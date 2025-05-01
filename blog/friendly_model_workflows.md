# Friendly Model Workflows

I frequently encounter model training and inference workflows that can only be run end-to-end. This approach slows down future improvements, complicates debugging, and prevents component reuse. This post discusses how to make model workflows more friendly.

A friendly workflow means that each step:
1. Has fast unit or integration tests
2. Can be executed manually with overrides
3. Uses human-readable input and output formats (no pickled objects except for model weights)

The ability to execute tests with overrides is crucial because it enables efficient debugging after making changes to the component's code or input.
Using human-readable formats accelerates development by making inputs and outputs easily inspectable and allows components to be reused elsewhere without relying on local state or custom classes.

Model training and inference workflows typically follow these steps:
1. Data collection
2. Preprocessing
3. Training or inference
   - (Training) Validation
4. Postprocessing
5. (Training) Metric calculation
6. (Training) Model storage
7. Reporting results

Each of these steps should be "friendly" as described above.