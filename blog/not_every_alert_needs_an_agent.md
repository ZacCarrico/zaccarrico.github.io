I gave a talk called "Not every alert needs an agent" at MLOps & GenAI World on Nov 18, 2026 (slides linked at the bottom). This post covers why we built an alert triage agent and why most of the work went into running the agent less.

## Engineers were already triaging with agents

When an alert fired, the on-call engineer opened Claude Code on their laptop and asked it to investigate (we have an "investigator" agent skill). Often, other people would do the same, generating multiple local copies of a similar report.

## First minimize noisy alerts

Before you add automation like an agent, first reduce the noise. The agent writes a report to describe the root cause of alerts and if the alerts are due to noise you have noise + lots of descriptions of the noise. This isn't helpful. First spend the time decreasing the noise of the alerts by taking these steps:

1. **Set alert triggers that match the traffic**

   A trigger set when traffic was low fires every day once traffic grows. A trigger set at peak traffic misses problems at night. Set it from the alert's recent history and revisit it when traffic changes. If an alert fires often, but does not need to be responded to, the trigger is too sensitive.
2. **Use anomaly detection**

   Many metrics follow a daily and weekly cycle, so one fixed threshold is wrong for part of the day. Anomaly detection learns the normal range for each hour and day and fires only when the metric leaves that range.
3. **Combine an alerting rule's sub-alerts into one alert**

   Say a rule checks API latency, with one sub-alert per endpoint. When the database slows down, every endpoint alerts at once, and each alert gets its own triage report about the same slow database. Alert on the total, or send the group as one notification, so one cause sends one alert.

## A shared triage agent posts one report

The triage agent investigates each alert and posts one report in the alert's Slack thread. The report has the likely cause, the evidence, and next steps. Everyone reads the same report, so time to resolution drops and nobody regenerates the investigation locally.

## General instructions beat detailed instructions

I tested the agent on 24 past prod alerts. Two LLM judges scored each answer against the root cause the on-call engineer found. Opus 5.5 and Sonnet 5.5 were used as judges. The final score is 0-1, with 1 being the max score.

A prescriptive skill with step-by-step instructions did worse than "Investigate this alert." With steps, the agent did not look anywhere the steps did not send it. With general instructions, it followed the evidence and found the cause more often.

Using the alert, metrics, logs, code, the agent averaged a score of 0.81 +/- 0.06 across 3 independent attempts. Adding past threads for the alert, recent changes, and playbooks, alone or together, gave between 0.79 and 0.86. The standard error was about 0.06, so these differences are within noise.

Two workflow changes did not help either. A hypothesis loop generates up to 5 hypotheses, runs one query per hypothesis, and repeats for up to 3 rounds. It scored 0.86, the same as without it. Subagents, one per data source, scored 0.84 to 0.89. They cost about $2.25 per alert, against $0.65 without them, and the gain is within run-to-run noise.

## Use the Tool Runner SDK

The Agent SDK starts a Claude Code CLI process per alert, with Claude Code's built-in tools. The Tool Runner SDK runs the agent loop inside our own Python process, with only the tools we give it. On the same alerts:

| | Agent SDK | Tool Runner SDK |
|---|---|---|
| Finds the cause | 0.95 | 0.92 |
| Says unclear when evidence is missing | 0.54 | 0.58 |
| Cost per alert | $0.68 | $0.54 |
| Time per alert | 105 s | 61 s |
| Peak memory, largest alert | 316 MB | 118 MB |

Accuracy is about the same. Many triages at once use far less memory with the Tool Runner SDK, because they share one process.

## Agents find bugs when there are none

I picked 9 prod alerts that were the cause of noise in the system to test whether the model would come up with a bogus explanation of the cause. For 1 in 3 of them, the agent said something needed a fix, which is incorrect. The past replies and noise marks on those alerts said no action was needed.

An agent asked to find a cause will often hallucinate one. A report that names a fix for an alert that resolved on its own sends an engineer after a bug that may not exist.

## Wait and batch to cut reviews

*Every report costs someone a review. A report nobody needed wastes that review.* So the router waits before it starts triage:

- P1: no wait.
- P2: 5 minutes. Over 33% of alerts resolve on their own in 5 minutes.
- P3: 10 minutes. About 50% resolve on their own in 10 minutes.
- P4 and P5: 20 minutes.

If the alert resolves during the wait, the router skips triage. The router also batches repeat fires of the same alert into one investigation, and the agent links them to the first Slack thread. Batching cuts investigations by 16%.

## Reviews make the eval set

Each report has a Slack poll that asks whether triage was correct, incorrect, or correct but insufficient. For the last two, the agent asks in the thread what was wrong or what was missing. If the alert resolved on its own and the agent asked for a change, the report is marked incorrect without waiting for the poll.

A marked report can become an eval case. A report nobody marks cannot. Fewer reports means each one is more likely to get a review.

When a review shows a playbook gap, the agent opens a ticket, and an engineer updates the playbook.

## Permissions

* The agent can only read, except for Linear and Slack. This minimizes its ability to cause harm.

## The router decides when the agent runs

The agent management platform's router claims each Slack alert so it is triaged once, then waits and batches. It runs at most 50 triages at once. A new alert past that waits and checks again in 15 seconds. If 50 or more alerts arrive in one hour, the router alerts on-call instead of starting more runs. A failed run retries after a backoff, and after 4 failures the agent posts that triage failed.

etcd stores every claim and lock, so a router restart loses no alert.

## Each noisy alert the agent finds leads to fewer alerts

When the agent finds that an alert is noise, it opens a ticket to change the alerting rule. An engineer changes the rule, and that alert fires less often.

## Minimize agent triaging to minimize human review

Here is the order an alert goes through:

1. Fix noisy alerting rules and tune thresholds.
2. Wait. About 50% of alerts resolve on their own in 10 minutes.
3. Batch repeat fires. This gives 16% fewer investigations.
4. The agent triages the rest and posts the cause and a ticket.
5. A human reviews the report and decides whether or not the fix should be implemented.

Every step before the agent cuts the number of reports a human has to review.

The slides are on GitHub: [Not every alert needs an agent (PDF)](https://github.com/ZacCarrico/alert-triage-agent/blob/main/not-every-alert-needs-an-agent.pdf).
