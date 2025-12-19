We need a CDK project in TypeScript to build the data pipeline for a new **smart agriculture platform**. This system will ingest real-time telemetry from thousands of IoT soil sensors, process it, and store it for analysis. The entire infrastructure will be serverless and deployed in the `us-east-1` region.

Here’s the data flow: each sensor will send a JSON payload with its `deviceId`, `timestamp`, and sensor readings (e.g., moisture, pH) to a central API endpoint.

This is the infrastructure we need to define:

## 1. Data Ingestion & Archival

The entry point for all sensor data will be an **API Gateway REST API**. This endpoint must be secured with **API key authentication** and configured with request validation to ensure the incoming JSON matches our schema. To manage costs and prevent abuse, the API should be throttled to 1,000 requests per second.

The API Gateway will trigger a **Lambda function** (`validation-lambda`). This function's only job is to do a quick check on the data and then immediately write the raw, validated JSON payload to an S3 bucket for archival. This S3 bucket must have server-side encryption using a customer-managed KMS key and a lifecycle policy to transition the raw data to Glacier after 30 days.

## 2. Event-Driven Processing

Instead of a direct S3-to-Lambda trigger, we'll use an **Amazon EventBridge Pipe**. This pipe will watch the S3 bucket for new raw data files. When a new file arrives, the pipe will automatically invoke our second Lambda function (`transformation-lambda`) for processing.

This `transformation-lambda` is our core processing engine. It will read the raw data, transform it, and write the final, structured data into a DynamoDB table. If this function fails for any reason, the failed event must be sent to an SQS queue that will act as a dead-letter queue (DLQ).

## 3. Data Storage & Analytics

The processed data will be stored in a **DynamoDB table**. This table must be configured for on-demand billing and use the `deviceId` as its partition key and the `timestamp` as its sort key, which is perfect for querying sensor data over time. Also, enable a TTL on the timestamp attribute to automatically expire old data.

To support our real-time analytics dashboard, enable a **Kinesis Data Stream** on the DynamoDB table. This will stream all item changes from the table, allowing other services to consume them for live analysis.

## 4. Configuration and Observability

Both Lambda functions must use the Node.js runtime with 512MB of memory and a 30-second timeout. The best practice in CDK is to use the `NodejsFunction` construct which handles bundling automatically. Their configurations, like the table and bucket names, should be passed in as environment variables.

For monitoring, create a CloudWatch alarm that triggers if the `transformation-lambda`'s error rate exceeds 1% over a 5-minute period. All Lambda logs must go to custom log groups with a 7-day retention period.

Of course, all IAM roles must be created with strict, least-privilege permissions, using the CDK's built-in `grant` methods. All resources need to be tagged with `Environment`, `Project`, and `CostCenter`.

Implement using AWS CDK TypeScript with separate modular stack file analytics.ts in lib/ for all components, instantiated in lib/tap-stack.ts.
