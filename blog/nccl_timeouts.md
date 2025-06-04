So, I was happily training my model across GPUs. Everything looked good. The logs were humming. The fans were spinning madly in some far off datacenter. I was patting myself on the back for speeding up model training.

Great, model training has finished. But why isn't the test data evaluation starting? Huh, I will give it some more time ...

SIGABRT

Wait, what?

It worked when I trained with less data. Why is it failing now?

Let me add more logging to see what the different GPU processes are doing.  
...waiting, watching...
Huh, only one process made it to the final dist.barrier() call. Why didn't the others make it? The process that made it to the final dist.barrier() call was the only one evaluating the validation data because it was rank 0, and evaluation isn't distributed across GPUs. 

Are the other processes quitting silently? Do they have timeouts to wait for collective calls? Where is this set?


## Solution
I should have paid more attention to the optional parameters of what I though was a boilerplate operation: `torch.distributed.init_process_group`
In PyTorch’s torch.distributed.init_process_group, there’s a parameter called `timeout`. Seems harmless. Defaults to 10 minutes. You think, “Cool, it must be how long the process group has to initialize.” Nope.

It’s also the timeout for every collective communication op—all_gather, all_reduce, broadcast, that whole merry band of sync calls. If one process initiates a collective call and the others don’t show up in time? Timeout. Killed. No warning. Just a nice quiet SIGABRT to keep things interesting.

But wait, it did ;). The subprocess didn't immediately raise a SIGABRT, the living subprocess had to finish and then finally the SIGABRT was raised to the parent process that had executed torch.multiprocessing.spawn(train)

## Final Thoughts

Like most bugs caused by distributed systems + human optimism, this one wasn’t obvious until it failed after hours of training.

Moral of the story: distributed training is full of gotchas like this. Add a debug option that sets these environment variables:
```
"NCCL_DEBUG": "INFO"
"NCCL_DEBUG_SUBSYS": "ALL"
```