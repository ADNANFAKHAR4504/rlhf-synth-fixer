Need a production-ready serverless web application stack using CloudFormation with SAM transform. This should be deployable in multiple regions for failover.

Core Setup:

API Gateway V2 that routes incoming HTTP requests to Lambda functions for processing. Lambda functions run in private VPC subnets and store data in DynamoDB tables. When Lambda processes requests, it reads secrets from Secrets Manager and logs everything to CloudWatch. Failed Lambda invocations get sent to an SQS dead letter queue so we don't lose error data.

For file storage, S3 bucket with versioning and encryption that Lambda can write to. KMS key encrypts Lambda environment variables and S3 data. API Gateway protected by WAF to block malicious traffic before it reaches our functions.

Networking:

VPC across 2 availability zones with public and private subnets. NAT gateways in public subnets give private subnet resources internet access. Lambda functions run in private subnets for security. Route 53 DNS records pointing to the API Gateway for custom domain support with failover routing to secondary region.

DynamoDB table with auto-scaling for both read and write capacity so it handles traffic spikes without manual intervention.

Security Requirements:

IAM roles with least-privilege permissions - Lambda execution role only gets specific actions it needs for DynamoDB access, Secrets Manager read, CloudWatch logs write, and SQS send. No wildcard permissions allowed.

Everything encrypted - S3 server-side encryption, KMS for Lambda env vars, encrypted DynamoDB table.

Monitoring:

CloudWatch log groups capture Lambda execution logs and errors. CloudWatch alarms trigger when Lambda error rate spikes or API Gateway returns too many 4xx/5xx errors. SNS topic sends alarm notifications.

Tagging:

All resources tagged with Environment, Project, and Owner from CloudFormation parameters. Need this for cost tracking and resource management.

Template should be complete CloudFormation YAML with inline comments explaining the service integrations. Must work without modifications when deployed to primary or secondary region.
