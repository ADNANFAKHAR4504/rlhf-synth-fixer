# model_failure

## Frequent causes of rejection

* **Hard-coded AllowedValues** for `EnvironmentSuffix` instead of a **regex** guard, blocking flexible environment names.
* Missing **ENVIRONMENT_SUFFIX** in one or more resource names, causing cross-environment collisions.
* Using **JSON** instead of **YAML** for `TapStack.yml`, or mixing styles in a way that fails validation.

## API & Lambda integration pitfalls

* Configuring API Gateway integration without **Lambda proxy** or building the integration URI incorrectly (must be the regional `apigateway:lambda:path/.../functions/<LambdaArn>/invocations`).
* Omitting the **Lambda invoke permission** for `apigateway.amazonaws.com` with the correct **SourceArn** pattern.
* Not enabling **X-Ray** or not setting **ReservedConcurrentExecutions ≥ 100** for each Lambda as required.

## IAM & SQS/DLQ issues

* Lambda execution roles missing specific actions:

  * Ingestion: `dynamodb:PutItem/UpdateItem/DescribeTable` on the created table and `sqs:SendMessage` on the main queue and DLQ.
  * Detection: `sqs:ReceiveMessage/DeleteMessage/GetQueueAttributes/ChangeMessageVisibility` for the main queue; `dynamodb:PutItem/UpdateItem/DescribeTable` for the table; `sqs:SendMessage` for its DLQ.
  * Scheduled analysis: required DynamoDB permissions and `sqs:SendMessage` for its DLQ when used by EventBridge as a target DLQ.
* Missing **SQS QueuePolicies** that allow **lambda.amazonaws.com** (and **events.amazonaws.com** for scheduled rules) to send messages to DLQs with **source-ARN** restrictions.
* Not setting DLQ **MessageRetentionPeriod = 1209600** (exactly **14 days**).

## Monitoring & alarms mistakes

* CloudWatch math expressions using unsupported functions (e.g., `maximum`) or unsafe divisions that fail when `Invocations = 0`.
* Alarms not referencing the correct **FunctionName** dimension or using mixed periods/stats that block evaluation.
* Log groups not explicitly created with **30-day** retention, leading to default infinite retention or policy drift.

## Data layer & throughput errors

* DynamoDB table mis-keyed (wrong attribute types), no **on-demand** billing mode, or missing **PITR/SSE**.
* Missing stage-level **throttling** in API Gateway (must enforce **1000 RPS** steady-state with burst).

## Tagging & outputs defects

* Omitting required tags (**Environment**, **CostCenter**, **Owner**) on any resource class.
* Missing essential **Outputs** (API URL, table/queue names and ARNs, Lambda ARNs, dashboard and alarm names), reducing operability and testability.

## Reliability & well-architected gaps

* No DLQs or incorrectly wired DLQs, causing message loss under failure.
* Broad IAM policies (e.g., `Resource: "*"`) where resource-scoped ARNs are feasible.
* No explicit access logs or metrics on API Gateway, hindering forensic analysis.
