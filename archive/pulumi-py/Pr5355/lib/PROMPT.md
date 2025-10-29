Hey man, we’d like you to build a Pulumi Python solution that provisions a complete, event-driven serverless pipeline for processing financial market CSV data.
The setup should be fully automated, secure, and observable.
Please implement:

- Deploy a REST API using API Gateway with Lambda proxy integration for three endpoints: POST /upload, GET /status/{jobId}, and GET /results/{symbol}.  
  Make sure request validation is enabled and standardized error responses include a correlation ID.

- Create an S3 bucket with server-side encryption (AWS-managed keys).  
  Files uploaded to the `incoming/` prefix should trigger a processing Lambda via event notifications.  
  Add a lifecycle policy to delete processed files after 30 days.

- Implement Lambda functions that read CSV files, validate their format, and store parsed records in DynamoDB.  
  Configure all Lambdas with 3GB memory, 5-minute timeout, environment variables for table and bucket names, and X-Ray tracing.  
  Each Lambda should have its own DLQ (SQS) with a max of 2 retry attempts.  
  The processing Lambda must have 100 reserved concurrent executions.  
  CloudWatch Logs retention should be set to 7 days.

- Provision a DynamoDB table with partition key `symbol` and sort key `timestamp`.  
  Use on-demand billing, enable point-in-time recovery, and turn on contributor insights.

- Set up CloudWatch alarms for Lambda errors exceeding 1% and DynamoDB throttling events.  
  X-Ray tracing should be enabled across all Lambdas and the API Gateway for full trace visibility.

- Configure API Gateway with throttling limits of 1000 requests per second and a burst limit of 2000.  
  The entire pipeline should process an uploaded CSV and store results within about 30 seconds.

- Enforce least-privilege IAM roles for all functions and resources.  
  Include consistent naming and tagging conventions with normalized region identifiers and environment suffixes.  
  Tags should include Environment, Team, and CostCenter with your own cool defaults.

Keep it clean, modular, and prod-ready. just a solid Pulumi Python implementation that’s reliable, secure, and easy to maintain.
