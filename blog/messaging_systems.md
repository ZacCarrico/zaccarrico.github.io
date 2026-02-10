# Tech Deep Dive: Messaging Exchange Patterns (MEP)

## 1. Core Categories
* **Request-Response:** Synchronous. Client waits for server. (e.g., REST APIs).
* **Asynchronous Messaging:** "Fire-and-forget." Decouples sender and receiver.

## 2. Comparison Table: Queues vs. Pub/Sub vs. Streaming
| Feature | Message Queues | Pub/Sub | Event Streaming |
| :--- | :--- | :--- | :--- |
| **Pattern** | 1-to-1 | 1-to-Many | 1-to-Many (Log) |
| **Data Life** | Deleted after read | Deleted after send | Persistent (Replayable) |
| **Mechanism** | Push (usually) | Push | Pull (Long Polling) |
| **Scalability** | Medium | Moderate | Extremely High |

## 3. High-Scale Image Processing (Streaming Model)
* **Workflow:** Save image to S3 → Post metadata pointer to Stream → Multiple consumers (Resizer, AI, Indexer) pull the pointer.
* **Parallelism:** Handled by **Consumer Groups** and **Partitions**.
    * **Partitions:** Divide the "highway" into lanes.
    * **Consumer Groups:** Ensure 5 instances of the same service don't process the same image (1 partition per instance).
* **Backpressure:** Because it's a **Pull** mechanism, consumers only take work when they have capacity, preventing system crashes during bursts.
* **Idempotency:** Designing actions so repeating them doesn't cause errors (e.g., checking if a thumbnail already exists before creating it).

## 4. Performance: Latency vs. Throughput
* **Latency (Speed per message):** **Pub/Sub** wins due to Push delivery.
* **Throughput (Total Volume):** **Streaming** wins due to batching and linear scaling.
