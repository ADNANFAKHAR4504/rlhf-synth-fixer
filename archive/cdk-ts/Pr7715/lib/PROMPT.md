You are an AWS CDK expert with deep knowledge of IaC patterns, AWS best practices, multi-service integration, and production-grade TapStack architecture.

I want you to generate a complete TapStack CDK file that includes all resources, services, constructs, alarms, dashboards, logs, roles, permissions, API Gateway configuration, CloudFront, Lambdas, KMS, S3, SNS, SQS, DynamoDB, VPC, and any service explicitly mentioned.

REQUIREMENTS:

Follow these rules strictly:

Single File Output
All resources must be defined inside ONE main file only

No separate construct files

No imports from custom folders

Everything (Dashboards, Alarms, Log Processing, Notifications, Retention, APIs, Lambdas, Frontend, Storage, Monitoring, IAM, KMS) must be written in the same TapStack file

Dynamic Configuration
The entire infrastructure must support dynamic environment configuration, including:

environmentSuffix

serviceName

stage (dev / staging / prod)

KMS key alias names

Log retention days

API names

Lambda memory, timeouts, concurrency

CloudFront behaviors

Bucket retention policy

SNS/SQS queue names

DynamoDB table names

Alarm thresholds

Metric periods

Cost-safety settings

All values MUST be parameterized & referenced properly.

Infrastructure Must Match EXACTLY What Is Described
Include every AWS service mentioned in the input description:

- Lambdas (NodejsFunction or Runtime-based)
- API Gateway REST or HTTP
- CloudFront + S3 website hosting
- KMS keys with correct alias validation
- DynamoDB tables
- SNS topics + subscriptions
- SQS queues (DLQ + retry if mentioned)
- Log groups & retention
- CloudWatch dashboards + widgets
- CloudWatch alarms + SNS notifications
- X-Ray
- VPC (if mentioned) with Subnets + NAT + routing
- IAM roles/policies/grants
- Any integrations (Lambda to DynamoDB, API to Lambda, CF to S3, etc.)

Every service mentioned must be created correctly, with proper wiring.

Names, Tags, and Outputs Must Be Correct
Resource names must include environmentSuffix

Outputs must export ARNs, names, and endpoints

Tags must include Service, Env, Owner (if provided)

Must Be Production-Grade
Ensure the generated TapStack:

Enforces least-privilege IAM

Has alarms for API Gateway, Lambda, DynamoDB, SQS, and CloudFront

Includes dashboards for key metrics

Uses KMS encryption everywhere

Uses S3 versioning + access logs

Includes log retention policies

Includes dead letter queues

Uses best practices for Lambda concurrency, environment vars, tracing

Generate ONLY Valid CDK (TypeScript) Code
No explanations

No placeholders

Must compile in a CDK project

Must import correct AWS CDK modules

Must define the class (e.g., export class TapStack extends cdk.Stack)

Must use CDK v2 module imports

YOUR TASK:

Using the above rules, generate a single-file, complete TapStack TypeScript CDK stack that includes all resources and functionality described in this input, configured in a fully dynamic, parameterized, production-ready design.

If the description contains:

Multiple Lambdas

Multiple API endpoints

Log processing

Alarms / Dashboards

Notifications

S3 buckets (frontend, logs, artifacts)

CloudFront distribution

KMS

Data store (DynamoDB)

Messaging (SNS/SQS)

Any service I explicitly mention later

You must include them ALL in the same file, configured correctly, dynamically, and interconnected.