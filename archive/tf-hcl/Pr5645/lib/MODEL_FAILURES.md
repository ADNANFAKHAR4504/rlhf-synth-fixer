1. Critical Failures - The error you're encountering is due to AWS Lambda not supporting FIFO SQS queues as dead letter queues (DLQs). means that AWS Lambda functions cannot use an SQS FIFO queue as a dead letter queue.

Explanation and Solution
AWS Lambda DLQ limitation: AWS Lambda supports either SNS topics or standard (non-FIFO) SQS queues as dead letter queues. FIFO SQS queues are not supported for DLQ purposes for Lambda.

Current DLQ configuration: Your DLQs are FIFO SQS queues, which causes the invalid DLQ ARN error on Lambda function creation.

Resolution options:

Change DLQ queues to standard SQS queues: Modify your DLQ definitions to be standard queues (remove fifo_queue = true) rather than FIFO. This allows the Lambda function's DLQ to be a valid target.

Use SNS topic as DLQ: Alternatively, configure an SNS topic as the dead letter target for your Lambda functions instead of an SQS FIFO queue.

Given that you probably want ordered, deduplicated messages for your DLQs, if FIFO behavior is essential, you cannot directly use an SQS FIFO queue as DLQ for Lambda. You might need additional architecture, such as routing Lambda DLQ messages through SNS to an SQS FIFO queue as a workaround.

Summary
The error happens because Lambda does not accept FIFO SQS queues as DLQ targets. Changing your DLQ queues from FIFO to standard SQS queues will fix this Terraform error:

Remove fifo_queue = true and content_based_deduplication from your DLQ queues.

Update the Terraform code to match.

This will allow Lambda functions to be created successfully with valid DLQ ARNs.

Suggested fixes
To fix the invalid DLQ ARN error, update the DLQ queue resources as follows:

Remove fifo_queue = true (so queues become standard SQS queues)

Remove content_based_deduplication = true (this is only for FIFO queues)

Ensure queue names no longer end with .fifo to follow standard SQS queue naming

```
╷
│ Error: creating Lambda Function (prod-fraud-lambda-ingestion-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: add1b92a-949c-497c-bf74-eaa899c017d7, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.ingestion_primary,
│   on tap_stack.tf line 1389, in resource "aws_lambda_function" "ingestion_primary":
│ 1389: resource "aws_lambda_function" "ingestion_primary" {
│ 
╵
╷
│ Error: creating Lambda Function (prod-fraud-lambda-scoring-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: f216a144-54f6-4ee2-a413-9f946d7eee20, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.scoring_primary,
│   on tap_stack.tf line 1430, in resource "aws_lambda_function" "scoring_primary":
│ 1430: resource "aws_lambda_function" "scoring_primary" {
│ 
╵
╷
│ Error: creating Lambda Function (prod-fraud-lambda-alert-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: 7a3414c1-95cb-4951-827e-e6ac71f8bb58, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.alert_primary,
│   on tap_stack.tf line 1471, in resource "aws_lambda_function" "alert_primary":
│ 1471: resource "aws_lambda_function" "alert_primary" {
│ 
╵
╷
│ Error: creating Lambda Function (prod-fraud-lambda-ingestion-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: 089d73f7-bb65-4727-b3a9-86cd47bc6bc9, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.ingestion_secondary,
│   on tap_stack.tf line 1517, in resource "aws_lambda_function" "ingestion_secondary":
│ 1517: resource "aws_lambda_function" "ingestion_secondary" {
│ 
╵
╷
│ Error: creating Lambda Function (prod-fraud-lambda-scoring-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: 9f6ba52d-6ea8-4185-96cd-20b1192482cb, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.scoring_secondary,
│   on tap_stack.tf line 1558, in resource "aws_lambda_function" "scoring_secondary":
│ 1558: resource "aws_lambda_function" "scoring_secondary" {
│ 
╵
╷
│ Error: creating Lambda Function (prod-fraud-lambda-alert-slmr): operation error Lambda: CreateFunction, https response error StatusCode: 400, RequestID: e7737231-d18b-49d8-8c75-44ed196348d9, InvalidParameterValueException: Invalid dead letter queue ARN: FIFO SQS queue is not supported for dead letter configuration
│ 
│   with aws_lambda_function.alert_secondary,
│   on tap_stack.tf line 1599, in resource "aws_lambda_function" "alert_secondary":
│ 1599: resource "aws_lambda_function" "alert_secondary" {
│ 
╵
Error: Terraform exited with code 1

```

2. Medium Failures - Since the queues are not FIFO still using .fifo in the suffix which is causing the issue


Summary:
For standard SQS queues (non-FIFO), queue names cannot end with .fifo

Your error happens because the queue names still have .fifo suffix after removing FIFO options

Remove .fifo suffix in name attribute for these queues to fix the error

```
Planning failed. Terraform encountered an error while generating this plan.

╷
│ Error: invalid queue name: prod-fraud-sqs-ingestion-slmr.fifo
│ 
│   with aws_sqs_queue.ingestion_primary,
│   on tap_stack.tf line 769, in resource "aws_sqs_queue" "ingestion_primary":
│  769: resource "aws_sqs_queue" "ingestion_primary" {
│ 
╵
╷
│ Error: invalid queue name: prod-fraud-sqs-scoring-slmr.fifo
│ 
│   with aws_sqs_queue.scoring_primary,
│   on tap_stack.tf line 803, in resource "aws_sqs_queue" "scoring_primary":
│  803: resource "aws_sqs_queue" "scoring_primary" {
│ 
╵
╷
│ Error: invalid queue name: prod-fraud-sqs-alert-slmr.fifo
│ 
│   with aws_sqs_queue.alert_primary,
│   on tap_stack.tf line 837, in resource "aws_sqs_queue" "alert_primary":
│  837: resource "aws_sqs_queue" "alert_primary" {
│ 
╵
╷
│ Error: invalid queue name: prod-fraud-sqs-ingestion-slmr.fifo
│ 
│   with aws_sqs_queue.ingestion_secondary,
│   on tap_stack.tf line 875, in resource "aws_sqs_queue" "ingestion_secondary":
│  875: resource "aws_sqs_queue" "ingestion_secondary" {
│ 
╵
╷
│ Error: invalid queue name: prod-fraud-sqs-scoring-slmr.fifo
│ 
│   with aws_sqs_queue.scoring_secondary,
│   on tap_stack.tf line 909, in resource "aws_sqs_queue" "scoring_secondary":
│  909: resource "aws_sqs_queue" "scoring_secondary" {
│ 
╵
╷
│ Error: invalid queue name: prod-fraud-sqs-alert-slmr.fifo
│ 
│   with aws_sqs_queue.alert_secondary,
│   on tap_stack.tf line 943, in resource "aws_sqs_queue" "alert_secondary":
│  943: resource "aws_sqs_queue" "alert_secondary" {
```


3. Critical Failures - seems the error persists because of a mismatch between the source queue and its dead letter queue (DLQ) types in the redrive policy configuration.

The key points to check, extracted from your Terraform file and error context:

Core Problem
Your main SQS queue resource still has a redrive_policy specifying a DLQ ARN with .fifo suffix, or possibly with fifo_queue = true.

The DLQ queue you have updated to be a standard queue (no .fifo suffix and no fifo_queue = true), but the source queue refers to a DLQ ARN that still points to the old FIFO DLQ ARN.

AWS requires the DLQ to be the same queue type as the source queue.

The error is thrown during creation of the source queue because its redrive policy points to an incompatible DLQ.

What to verify and fix
Source queue's redrive_policy must reference the updated DLQ ARN (standard queue ARN without .fifo).

Remove fifo_queue = true and content_based_deduplication on both source and DLQ queues if using standard queues.

Redrive policy deadLetterTargetArn must match the ARN of the new standard DLQ queue (not the old FIFO DLQ ARN).

```
╷
│ Error: creating SQS Queue (prod-fraud-sqs-ingestion-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: e9fec4bf-bf10-5983-b5db-a5c2e7f721e2, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:***:prod-fraud-dlq-ingestion-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.ingestion_primary,
│   on tap_stack.tf line 769, in resource "aws_sqs_queue" "ingestion_primary":
│  769: resource "aws_sqs_queue" "ingestion_primary" {
│ 
╵
╷
│ Error: creating SQS Queue (prod-fraud-sqs-scoring-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: fa0beb79-279c-5226-8818-8a047f7b2a47, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:***:prod-fraud-dlq-scoring-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.scoring_primary,
│   on tap_stack.tf line 803, in resource "aws_sqs_queue" "scoring_primary":
│  803: resource "aws_sqs_queue" "scoring_primary" {
│ 
╵
╷
│ Error: creating SQS Queue (prod-fraud-sqs-alert-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: 2b5f6e27-69ed-52ac-9f9a-0f5a310a4424, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:***:prod-fraud-dlq-alert-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.alert_primary,
│   on tap_stack.tf line 837, in resource "aws_sqs_queue" "alert_primary":
│  837: resource "aws_sqs_queue" "alert_primary" {
│ 
╵
╷
│ Error: creating SQS Queue (prod-fraud-sqs-ingestion-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: dd2a043c-4d38-50fd-9272-654115d13cba, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-west-2:***:prod-fraud-dlq-ingestion-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.ingestion_secondary,
│   on tap_stack.tf line 875, in resource "aws_sqs_queue" "ingestion_secondary":
│  875: resource "aws_sqs_queue" "ingestion_secondary" {
│ 
╵
╷
│ Error: creating SQS Queue (prod-fraud-sqs-scoring-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: dc1f0438-901a-5c6f-b5ab-6545c8f39382, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-west-2:***:prod-fraud-dlq-scoring-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.scoring_secondary,
│   on tap_stack.tf line 909, in resource "aws_sqs_queue" "scoring_secondary":
│  909: resource "aws_sqs_queue" "scoring_secondary" {
│ 
╵
╷
│ Error: creating SQS Queue (prod-fraud-sqs-alert-slmr): operation error SQS: CreateQueue, https response error StatusCode: 400, RequestID: 482d9e09-26da-5813-8733-ff747e33bf40, api error InvalidParameterValue: Value {"deadLetterTargetArn":"arn:aws:sqs:us-west-2:***:prod-fraud-dlq-alert-slmr.fifo","maxReceiveCount":3} for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source..
│ 
│   with aws_sqs_queue.alert_secondary,
│   on tap_stack.tf line 943, in resource "aws_sqs_queue" "alert_secondary":
│  943: resource "aws_sqs_queue" "alert_secondary" {
│ 
╵
Error: Terraform exited with code 1.
```

4. Medium Failures- the concurrency setting for your Lambda function is reserving too many concurrent executions, which causes the account's unreserved concurrency to fall below the required minimum of 100.

AWS Lambda enforces a minimum level of unreserved concurrent executions (100 by default) that cannot be reserved by functions. When you set ReservedConcurrentExecutions on a Lambda function too high, it violates this limit.

How to fix this:
Reduce the reserved_concurrent_executions value in your Terraform aws_lambda_function resources for ingestion_primary, scoring_primary, and alert_primary to a number that does not cause unreserved concurrency to go below 100.

Alternatively, check your total Lambda concurrency quota for the account and subtract 100 from it to find the maximum concurrency you can reserve at a single function level.

If you don't explicitly need to reserve concurrency for these Lambdas, consider removing reserved_concurrent_executions from the Terraform resource.

```
╷
│ Error: setting Lambda Function (prod-fraud-lambda-ingestion-slmr) concurrency: operation error Lambda: PutFunctionConcurrency, https response error StatusCode: 400, RequestID: 52ba1a07-50e7-42a7-81e0-f904fa0bce25, InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
│ 
│   with aws_lambda_function.ingestion_primary,
│   on tap_stack.tf line 1365, in resource "aws_lambda_function" "ingestion_primary":
│ 1365: resource "aws_lambda_function" "ingestion_primary" {
│ 
╵
╷
│ Error: Missing Resource Identity After Create: The Terraform provider unexpectedly returned no resource identity after having no errors in the resource create. This is always a problem with the provider and should be reported to the provider developer
│ 
│   with aws_lambda_function.ingestion_primary,
│   on tap_stack.tf line 1365, in resource "aws_lambda_function" "ingestion_primary":
│ 1365: resource "aws_lambda_function" "ingestion_primary" {
│ 
╵
╷
│ Error: setting Lambda Function (prod-fraud-lambda-scoring-slmr) concurrency: operation error Lambda: PutFunctionConcurrency, https response error StatusCode: 400, RequestID: 50f70459-e851-4ac6-8750-143a957eb2a9, InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
│ 
│   with aws_lambda_function.scoring_primary,
│   on tap_stack.tf line 1406, in resource "aws_lambda_function" "scoring_primary":
│ 1406: resource "aws_lambda_function" "scoring_primary" {
│ 
╵
╷
│ Error: Missing Resource Identity After Create: The Terraform provider unexpectedly returned no resource identity after having no errors in the resource create. This is always a problem with the provider and should be reported to the provider developer
│ 
│   with aws_lambda_function.scoring_primary,
│   on tap_stack.tf line 1406, in resource "aws_lambda_function" "scoring_primary":
│ 1406: resource "aws_lambda_function" "scoring_primary" {
│ 
╵
╷
│ Error: setting Lambda Function (prod-fraud-lambda-alert-slmr) concurrency: operation error Lambda: PutFunctionConcurrency, https response error StatusCode: 400, RequestID: 727dbdf0-a23b-4f25-a456-757377876a61, InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
│ 
│   with aws_lambda_function.alert_primary,
│   on tap_stack.tf line 1447, in resource "aws_lambda_function" "alert_primary":
│ 1447: resource "aws_lambda_function" "alert_primary" {
│ 
╵
╷
│ Error: Missing Resource Identity After Create: The Terraform provider unexpectedly returned no resource identity after having no errors in the resource create. This is always a problem with the provider and should be reported to the provider developer
│ 
│   with aws_lambda_function.alert_primary,
│   on tap_stack.tf line 1447, in resource "aws_lambda_function" "alert_primary":
│ 1447: resource "aws_lambda_function" "alert_primary" {
│ 
╵
Error: Terraform exited with code 1.
```
