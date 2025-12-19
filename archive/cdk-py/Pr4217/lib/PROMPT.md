A logistics platform needs to process 30,000 shipment events per day asynchronously. The system must be highly reliable, durable, and provide operational monitoring and alerting.
Please produce a single AWS CDK (Python) template file that implements a serverless, production-ready processing pipeline with the following components and constraints:

    •	Amazon EventBridge for ingesting and routing shipment events to the pipeline.
    •	Amazon SQS (standard queue) to buffer events and smooth spikes; include a Dead Letter Queue (DLQ) for failed deliveries.
    •	AWS Lambda (Python) functions to consume messages from SQS and process shipment events (idempotent processing recommended).
    •	Amazon DynamoDB to store event logs and processing status (with clear primary key design and TTL or retention strategy described).
    •	CloudWatch: metrics and dashboards for queue depth, processing rate, error rate, and Lambda duration; plus alarms on high queue depth and error rate.
    •	IAM roles and least-privilege policies for Lambda, EventBridge, SQS, and DynamoDB interactions.
    •	Operational details: configure appropriate concurrency/visibility timeout/backoff for SQS, configure DLQ redrive policy, add basic CloudWatch alarms (e.g., SQS ApproximateNumberOfMessagesVisible threshold, Lambda errors > X), and include CloudWatch Logs retention.
    •	Cost & reliability guidance: choose settings that balance cost-efficiency with reliability (small provisioned concurrency or reserved concurrency limits if needed, auto-scaling hints for DynamoDB).

Outputs: export key resource identifiers (SQS queue URLs/ARNs, Lambda ARNs, DynamoDB table name, CloudWatch dashboard link).
