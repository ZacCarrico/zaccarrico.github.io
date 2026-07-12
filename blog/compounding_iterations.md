I heard someone say that iterating 2x faster can lead to 10x better products. Their logic was that the learning from each iteration improves the builders' understanding, which leads to better decisions for future iterations. In other words, the knowledge compounding produces exponential improvements. There's some truth in this, but exponential improvement is largely overstated. This blog explains why.

## When short iteration cycles help

Let's assume that the total number of changes you make in a month is the same whether the iteration cycle is 1 week or 2 weeks. A 1 week iteration cycle leads to better outcomes when you can incorporate learning into the design of changes for the next iteration. If there is no learning, there's no knowledge gained, and thus no benefit to shorter iteration cycles.

## The rate divides when you iterate faster

Here is the textbook compounding formula:

```
final = principal · (1 + rate)^(number of iterations)
```

A rate is per unit of time. A change worth 10% over a year is worth about 5% over half a year, not another 10. So iterate twice as often and each iteration carries half the rate. The rate divides by the number of iterations.

Split the period into <var>n</var> iterations and each earns <var>R</var>/<var>n</var>:

```
outcome = (1 + R/n)^n
R:  rate over the whole period
n:  number of iterations
```

At <var>R</var> = 0.1, one iteration gives 1.10. Two, at 5% each, give 1.1025. Push <var>n</var> to infinity and it converges to e^0.1 = 1.105. That is the entire range. Going from yearly to infinitely gave you only a 0.5% increase in the outcome.

![Once the rate is divided by the number of iterations, iterating once a year lands almost exactly where infinite iterations do, both near e to the R](blog/plots/plot6_conservation.svg)

It's unrealistic to keep the rate the same as you increase iterations -- doing the same amount of work in half the time would mean you're working twice as fast or twice as long. I'm assuming you're already working at your capacity so this blog is about working smarter.

More iterations slice the same pie thinner. Real gains come from a bigger pie, and that comes from learning. Unlike R, C doesn't divide when you iterate faster. Each iteration produces a new learning signal you didn't have before — shipping twice as often accumulates twice as many C's in the same period. That's the real case for shorter cycles: not compounding, but more opportunities to learn. You can continue to get linear improvements by increasing iteration rate until that iteration time is shorter than the time necessary to learn something from it.

## Two ways to grow the pie

There are two ways to make a bigger pie. Only one compounds, and it does not run on the iteration clock.

The first is learning. Fast learning is the real reason to shorten iterations. Incorporating what you learn into the product adds a chunk of value per iteration.

The second is a compounding loop: value that begets value. A product with a network effect or which feeds data into the product to improve it has a compounding loop.Let's use Google Maps as an example. Phones navigating with it feed data back to the mothership, which improves the predictions about traffic and arrival times.

Importantly, learning and the compounding loop run on different clocks. Learning runs on the iteration clock and the compounding loop runs on the usage clock. An easy way to tell the difference is if you need to deploy a change to get a result, it's on the iteration clock, but if the data/users would accumulate without the change then it's on the usage clock. The 10x improvement from 2x iteration speed gives credit to learning which is likely mostly from compounding.

Let's write both pie growers in one line:

```
For a single iteration:
Q_next = (1 + r)·Q + C
Q:  current product value
r:  compounding-loop rate, the fraction of value that value generates on its own
C:  value learning adds each iteration (additive)
```

Set <var>r</var> to zero, which is most products in their early stage, and it collapses to <var>C</var>·<var>n</var> (i.e. linear, not exponetial). Only a real compounding loop, where <var>r</var> > 0, results in exponential growth. After <var>n</var> iterations:

```
For n iterations:
Q_final     = (C / r)·[ (1 + r)^n - 1 ]
learning    = C·n               additive, linear
compounding = Q_final - C·n     grows as (1 + r)^n
```

It is compound interest with a recurring deposit: <var>C</var> is the deposit learning makes each cycle, <var>r</var> is the loop earning a return on the balance.

![Learning is linear; only the loop compounds](blog/plots/plot1_deposits.svg)

## Value has a ceiling

There's a maximum value that a product provides, but compounding grows into infinity. To address this, let's introduce the ceiling <var>Qmax</var>.

```
Q_next = Q + r·Q·(1 - Q/Qmax) + C
Q:     current value
Qmax:  ceiling, the best the product can be for a typical user
r:     compounding-loop rate
C:     value learning adds each iteration
```

![Product value saturating into a single S-curve](blog/plots/plot2_ceiling.svg)

In this curve, learning drives improvements in early and late iterations, while the middle is driven by compounding.

Real curves are not clean logistics. Expanding the scope of the product will increase Qmax.

## Conclusion

Iterating faster does not lead to compound growth. Iterating infinitely quickly barely increases the outcome. The story that iterating 2x faster results in 10x value assumes the compounding rate <var>R</var> is not divided by the number of iterations, which isn't realistic. Iteration speed is important, but more important is features that produce compound growth (e.g. data feedback, network effects, etc.) and good experiments.
