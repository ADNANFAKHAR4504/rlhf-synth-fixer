You are an expert in building scalable, secure, and modular serverless infrastructure using Pulumi with Python. Please write the complete implementation of the TapStack class inside the tap_stack.py file. This stack is the main infrastructure component for a Pulumi-based project called "IaC - AWS Nova Model Breaking".

Do not generate the tap.py entry point or pulumi.yaml — they already exist and load this TapStack as the main component.

Infrastructure Objective
Design and deploy a real-time, serverless architecture using AWS services for data processing and API routing. The system must be multi-region, secure, modular, and support automated testing, environment separation, and rollback strategies. All infrastructure must be defined inside the TapStack class in a single tap_stack.py file.

Functional Requirements
Lambda Functions

Use AWS Lambda with the Python runtime.

Each function must have a dedicated IAM role with least-privilege access.

Store configuration via environment variables.

Fetch secrets from AWS Secrets Manager.

Log execution details to CloudWatch Logs.

API Gateway

Set up a RESTful API Gateway (v2 preferred).

Expose multiple Lambda-backed routes (e.g., /process, /health).

Secure endpoints using custom authorizers.

Enable tracing and access logging.

S3 Buckets

Create private S3 buckets with:

Versioning

Lifecycle policies

Server-side encryption

Triggers for Lambda functions and/or Kinesis.

Kinesis Streams

Set up a Kinesis stream for ingesting and processing real-time data.

Use Lambda consumers to handle stream events.

Configure retry policies and batching as needed.

CloudWatch Monitoring

Enable logging and metrics for:

Lambda

API Gateway

Kinesis

Create CloudWatch alarms for Lambda errors.

Optionally notify via SNS.

Secrets Management

Use AWS Secrets Manager to securely manage secrets.

Encrypt secrets at rest using KMS.

Ensure proper IAM access from Lambda only.

Multi-Region Deployment

Support deploying the full infrastructure in multiple AWS regions (e.g., us-west-2, us-east-1).

Resource names must include environment and region suffixes.

Environment Configuration

Use pulumi.Config() and TapStackArgs to configure:

Environment (dev, staging, prod)

Tags

Project-level naming conventions

Secret keys and Lambda config

Tagging

Apply a standard tagging policy to all resources using:

python
Copy
Edit
self.tags = {
"Project": "NovaModelBreaking",
"Environment": config.require("env"),
"Region": aws.config.region,
...
}
Rollback Support

Enable rollback capabilities using Pulumi stack snapshots and history.

Ensure resources are not deleted or mutated irreversibly during deployment failures.

Testing

Structure the code to support automated infrastructure tests using Pulumi's testing framework.

At minimum, support validation of:

IAM policies

Lambda environment variables

API Gateway route integrations

Secrets configuration

Code Architecture Constraints
All code must reside in a single file: tap_stack.py.

Use the existing TapStack class as the base and follow the project template.

Split logic into private methods within the class:

\_create_lambdas()

\_create_api_gateway()

\_create_s3_buckets()

\_create_kinesis_streams()

\_create_cloudwatch_monitoring()

\_create_secrets_manager()

Do not use external stack files or modules.

Use ResourceOptions(parent=self) for hierarchical resource control.

Add inline comments explaining each resource and why it exists.

Do not hardcode secrets, config values, or regions.

Final Output
Return only the full content of the tap_stack.py file, which includes:

TapStackArgs definition

Complete TapStack class with method-based resource logic

All AWS resources configured per the requirements

self.register_outputs({}) at the end of the constructor

This code should be deployable using pulumi up and compatible with the existing tap.py entry point and Pulumi configuration structure.
