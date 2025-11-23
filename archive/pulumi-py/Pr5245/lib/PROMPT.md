##Prompt: Pulumi Python prompt for a serverless transaction pipeline

Hey there! We’re looking for a clean, production-ready Pulumi Python script that builds a serverless transaction validation pipeline. The goal is to deliver a scalable, observable, and secure backend with everything defined in Pulumi.

Please implement:

- API and endpoints: Deploy an API Gateway REST API with request validation and throttling (1000 requests per second) to front the processing flow.
- Lambda functions: Create three functions
  - transaction-receiver (Python)
  - fraud-validator (Python)
  - audit-logger (Python)
- Data persistence: Set up DynamoDB tables for transactions and validation-results (with a global secondary index on timestamp).
- Messaging and routing: Configure SQS dead-letter queues for each Lambda with a maximum receive count of 3. Implement EventBridge rules to trigger fraud-validator on transaction events and route failed validations to a separate queue.
- Environment and configuration: Add Lambda environment variables for fraud threshold (0.85) and audit retention days (90). Constrain concurrency limits: transaction-receiver 100, fraud-validator 50, audit-logger 25.
- Observability: Set CloudWatch logs for all Lambda functions and enable tracing across all Lambdas and API Gateway.
- Tagging: Apply consistent tags environment (prod), team (fraud-detection), and cost-center (fin-001), environment_suffix(pr1234) and normalized region name (useast1).
- Modularity and maintainability: Structure the Pulumi Python code in a modular, reusable way with clear boundaries between inputs, resources, and outputs.
- Outputs: After successful deployment, display the API endpoint URL, DynamoDB table names, and Lambda ARNs.

Notes:

- The solution should be fully declarative in Pulumi Python with proper IAM roles and least-privilege permissions.
