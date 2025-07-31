Prompt: Advanced Serverless Microservices Platform for Multi-Region Deployment with AWS CDK


Persona: You are a n expert AWS solutions architect in Infrastructure as Code (IaC) and resilient serverless architectures. Your task is to build an advanced, production-ready foundation for a microservices platform.

Primary Objective: Design and implement a robust, reusable, and multi-region AWS CDK application in TypeScript for a serverless microservices platform. The platform must be highly configurable per environment, deeply observable, secure by design, and leverage modern cloud-native patterns for decoupling and resilience.

Core Architectural & Functional Requirements:
1. Serverless Microservice Core
Compute: Build the stack around a primary "Product" microservice using AWS Lambda (Node.js 20.x runtime).

API Layer: Expose the Lambda function via a REST API using Amazon API Gateway. The API must have GET and POST methods on a /products resource.

Database: Use Amazon DynamoDB as the data store. The table's billing mode (PROVISIONED) and capacity (readCapacity, writeCapacity) must be configurable per environment.

2. Decoupled & Event-Driven Design
Asynchronous Processing: Integrate an Amazon SQS queue to handle background tasks like order processing, ensuring it's encrypted.

Event Notification: Use an Amazon SNS topic to publish events (e.g., "product created"), enabling a fan-out pattern for other potential microservices.

3. Multi-Region Deployment Strategy
Structure the bin/tap.ts entry point to deploy the stack to a configurable list of AWS regions (e.g., us-east-1, us-west-2).

The application must iterate through the specified regions and instantiate a unique stack for each one. Stack names and IDs must be dynamically generated to include both the environment and region to prevent conflicts (e.g., TapStack-prod-us-east-1).

4. Advanced Configuration with Feature Flags
Implement a flexible configuration strategy using cdk.context.json.

Define a default configuration set within the stack code for a dev environment.

Allow environment-specific context (e.g., from a staging or prod block in cdk.context.json) to merge with and override the defaults.

Incorporate a feature flag (e.g., enableFeatureX: boolean) that is passed to the Lambda function's environment variables and can be toggled per environment.

5. Robust Observability and Monitoring
API Gateway Logging: Programmatically configure API Gateway access logging by creating the necessary IAM role and account-level settings.

Proactive Alarming: Implement critical CloudWatch Alarms for:

Lambda function invocation errors.

API Gateway 5xx server-side errors.

DynamoDB throttled read requests.

Log Management: Explicitly manage Lambda Log Groups using the aws-cdk-lib/aws-logs construct to control log retention periods, moving away from deprecated CDK properties.

6. Security, Compliance, and Best Practices
Least Privilege: The Lambda function's IAM role must have narrowly-scoped permissions only to the specific DynamoDB table and SNS topic it needs to interact with.

Environment-Aware Lifecycles: Implement conditional resource management. The RemovalPolicy for critical stateful resources like DynamoDB tables and Log Groups must be RETAIN in prod environments but DESTROY in all non-production environments.

Modern CDK Patterns: Utilize up-to-date CDK constructs and properties. Specifically, avoid deprecated patterns by using pointInTimeRecoverySpecification for DynamoDB PITR and the logGroup property for Lambda functions.

Encryption by Default: Ensure encryption at rest is enabled for all applicable services (DynamoDB, SQS).

7. Granular and Systematic Tagging
Implement a comprehensive tagging strategy applied globally from the bin/tap.ts file to ensure all resources are tagged for cost allocation and governance.

Mandatory tags include: Project, Environment, Owner, CostCenter, Repository, and Author.

8. Logical Naming and Stack Outputs
Ensure all resource names (like the API Gateway) are parameterized with the environment suffix to guarantee uniqueness.

Provide clear CfnOutputs for key resource identifiers, including the API Gateway URL, DynamoDB table name, SNS topic ARN, SQS queue URL, and the Lambda function name.

