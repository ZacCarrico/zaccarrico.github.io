# Resuscitating FastAPI services

FastAPI is a framework for building APIs with Python. It abstracts many of the lower-level details of running a web service. This makes it easy to start using FastAPI, but it can be tricky to diagnose problems when things don't work because you don't start with an understanding of what it's doing under the hood. This bit me in the butt recently, and because I believe a lot of people using FastAPI and Starlette will be making the same mistake, I decided to desribe its solution.

## The problem
 A FastAPI service for a model deployment was being killed infrequently. The logs showed that it was being killed by Kubernetes due to a failing liveness probe. The liveness probe is a proxy that Kubernetes uses to determine if a service is still responding to requests. If the probe fails (**i.e.**, the service is not responding), Kubernetes will restart the container. 

## The code
There are three endpoints that are relevant to this problem:
`/predict`
`/livez[^1]`
`/readyz[^1]`



```Python
# only showing code that is relevant to the problem
from fastapi import FastAPI, Response, Request
from http import HTTPStatus


app = FastAPI()

@app.post("/predict")
async def predict(request: Request):
    return predict_handler(request)


@app.get("/livez")
def livez():
    # check if the service is still predicting based on the last prediction time
    if not is_predicting():
        raise Response(
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                content="Service has stopped completing predictions",
            )
    return Response(status_code=HTTPStatus.OK, content="OK")


@app.get("/readyz")
async def readyz():
    try:
        make_prediction()
    except Exception as e:
        return Response(
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                content=f"Model inference failed: {str(e)}",
            )
```

## The clues
1. The pod was killed more frequently when requests spiked. 
2. Predict requests are relatively slow. Around a second, which is acceptable for the application.

## Understanding the system
To solve this problem, we need to understand how FastAPI is handling the requests. FastAPI uses Starlette under the hood, which is a lower-level library for building web applications. Starlette uses asyncio to handle requests. If you're not familiar with asyncio, it's a library that allows you to run code concurrently. Functions defined with `async def` return coroutine objects when called. The coroutine objects are run by the "event looop" (which is a fancy name for a loop that waits for events). 

In our service the `predict` and `readyz` endpoints are using `async def` and the `livez` endpoint is using `def`. For async functions, Starlette runs them with the event loop. For non-async functions, Starlette runs them in the thread pool. We have two non-async functions (`predict_handler` and `livez`), and by default, Starlette will run them in the **same** thread pool. This means that they share the same task queue and this what led to the problem. 

## Root cause
The `predict` endpoint is being called many times per second, and it calls `predict_handler` which is slow. Each of those `predict_handler` calls adds a task to the thread pool. The `livez` endpoint is being called infrequently (every 10 seconds) and has a timeout of 5 seconds. It's added to the same thread pool queue as the `predict_handler`. As a result, the `livez` task is waiting on the `predict_handler` tasks to finish. This waiting period will frequently exceed the timeout of 5 seconds, and even with retries, the `livez` endpoint will return a failure status code.

## The Solution
The solution is to run the `predict_handler` and `livez` tasks in different thread pools. This way, the `livez` task is not waiting on the `predict_handler` tasks to finish. This can be accomplished by using 

```Python
predict_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="predict_handler")

@app.post("/predict")
async def predict(request: Request):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(predict_executor, predict_handler, request)
```

Now the `predict_handler` is running in the "predict_handler" thread pool and `livez` is running in the default thread pool. This means that the `livez` tasks are added to a separate queue than the `predict_handler` tasks. As a result `livez` tasks don't need to wait for `predict_handler` tasks to finish before they can run.

[^1]: The `z` at the end is a convention because it helps avoid naming conflicts in case you wanted to use a public endpoint called /live or /ready.