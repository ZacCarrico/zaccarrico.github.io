I've made many changes to model training pipelines that have unexpected negative consequences. Some issues only reveal themselves during longer training jobs or when using different training inputs. In an attempt to catch these unexpected regressions and create a logbook of improvements, I decided to implement automated regression tests. I thought this would be similar to writing unit tests, but more extensive—however, it proved much trickier for reasons I'll explain below.

## What I Wanted to Test

The three key areas I wanted to monitor were:

1. **Model predictions** (e.g., precision, recall, etc.)
2. **Training speed**
3. **Memory usage**

## Why This Is More Complex Than Expected

This sounds straightforward, but it's surprisingly difficult. The complexity arises due to several factors:

### 1. Machine-to-Machine Variability
- Training speed varies significantly depending on the hardware used
- Performance differs between GPU and CPU runs
- Results can vary even across identical hardware setups

### 2. Operating System Differences
- Memory usage measurements require different approaches depending on whether you're running locally or in a Kubernetes pod
- System-level metrics collection varies across operating systems

### 3. Tolerance Selection
- You want to detect genuine regressions while ignoring normal variability
- This requires choosing appropriate tolerances for each metric
- Without knowing the distribution of values for a metric, tolerance selection is mostly guesswork
- Ideally, you should run training multiple times to gather this distribution and set tolerances based on standard deviation
- However, this can be more time-consuming than worthwhile, so consider setting tolerances high enough to catch significant regressions while avoiding false positives

### 4. Missing Data and Integrations in CI/CD Environments
- Most CI/CD environments lack access to resources normally used for model training
- Integration with external services and data sources may be limited

### 5. Metrics Collection Infrastructure
- To measure regression, you first need to log all metrics of interest
- Most mature training pipelines report metrics to ML observability tools (e.g., Weights & Biases, ClearML, etc.)
- However, metrics must also be accessible to regression tests, which may require adding or modifying logging
- You might need to retrieve metrics from observability tools within the CI/CD test environment

### 6. Metric Overload
- There are numerous measurable aspects of training, which can become overwhelming
- In my case, speed and memory metrics were missing entirely and needed to be implemented first
- The sheer volume of potential metrics can make the system difficult to maintain

## Alternative Approaches

Considering these challenges, here are some alternative strategies:

**Timing Considerations**: First, ensure this is the right time to create regression tests. If your training pipeline is still in active development, it may be worth waiting until it stabilizes.

**Prioritize Key Metrics**: Instead of trying to measure everything that could regress, identify the most critical metrics. For me, this meant focusing on model prediction performance summary metrics first.

**Incremental Implementation**: Start with a single metric and build the regression testing infrastructure around it. You can expand the system gradually as you learn what works.

**Avoid Over-Engineering**: Be cautious when using AI code generators for this work. If you ask them to measure different training steps, they often add too many granular measurements, creating unnecessary complexity.

## Hardware and Infrastructure Considerations

Another important decision is whether regression tests need to run on the same hardware as production model training. If hardware consistency is critical, you may need to implement daily training runs, as it's often slow and complex to set up GPU machines in CI/CD test environments.


Good Luck!