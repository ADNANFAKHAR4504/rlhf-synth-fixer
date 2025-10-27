We're building a real-time **Anti-Money Laundering (AML) monitoring platform** for our bank to meet new regulatory demands. We need to move from slow, nightly batch reports to an instantaneous, event-driven system that can analyze and act on suspicious transactions in seconds. We'll be using the **AWS CDK and TypeScript** to build this.

Here’s the end-to-end workflow for every single transaction:

## 1. The "Hot Path": Real-time Triage (Sub-second)

Every customer transaction (2.3 million per day) will be published as an event to a **Kinesis Data Stream**. This stream will be consumed by a "Triage" **Lambda function**. This Lambda must be extremely fast (under 200ms). For every transaction, it must perform three rapid checks:

1.  It queries an **Amazon ElastiCache for Redis** cluster to check for "velocity fraud" using a 60-second sliding window (e.g., "Has this account made 5+ international transfers in the last minute?").
2.  It queries **Amazon Verified Permissions** to check the customer's pre-calculated risk profile. (The policies in Verified Permissions will be backed by our 12-million-customer DynamoDB table).
3.  It invokes a **SageMaker** endpoint (our ML anomaly detection model) to get an initial "suspicion score" (must respond in < 100ms).

## 2. The "Warm Path": Automated Investigation (Minutes)

If the combination of these checks (e.g., high-risk user + unusual velocity + high ML score) exceeds our risk threshold, the Triage Lambda must immediately trigger an **AWS Step Functions** workflow to orchestrate a full, automated investigation.

This Step Functions workflow must perform the following actions:

1.  **Historical Analysis:** Kick off an **Amazon Athena** query against our 340TB transaction data lake in S3. This query will pull the customer's _entire_ 12-month transaction history.
2.  **Relationship Analysis:** In parallel, query our **Amazon Neptune** graph database to traverse the customer's known relationships (4 degrees deep), looking for connections to sanctioned entities or known fraudulent accounts.
3.  **Rule-Based Scoring:** Once the Athena and Neptune data is available, a "Scoring" **Lambda** is invoked. This Lambda will connect to an **Aurora RDS** database (which stores our 234 official AML rules) to calculate a final, definitive risk score.
4.  **Generative AI Summary:** If the score is high, a Lambda function will use **Amazon Bedrock** (e.g., Claude 3 Sonnet) to summarize the complex Athena and Neptune findings into a human-readable narrative for the final audit report.

## 3. The "Action" Path: Remediation & Reporting

Based on the high score, the Step Functions workflow will then fork and execute three final tasks in parallel:

1.  **File SAR:** Invoke a Lambda that calls an external **API Gateway** (using a simple HTTP integration) to file the Suspicious Activity Report (SAR) with FinCEN.
2.  **Alert Security:** Publish a high-priority, formatted finding to **AWS Security Hub**.
3.  **Archive Evidence:** Archive the complete evidence package (the Bedrock summary, Athena results, Neptune graph, etc.) into an **Amazon OpenSearch Serverless** collection for our compliance auditors. This must use encrypted indices.

This entire system must be built with strict, least-privilege IAM roles for every single interaction.

Implement using AWS CDK TypeScript with separate modular stack file `lib/aml-pipeline-stack.ts` in lib/ for all components, instantiated in `lib/tap-stack.ts`.
