Hey, we need to migrate a payment processing system from development to production using **AWS CDK with Python**. A fintech startup has been running their dev environment for 6 months with various manual configurations that need to be properly codified and replicated in production with enhanced security and compliance controls.

Here's what we need to build:

The infrastructure must define separate stacks for networking, compute, and data layers with proper dependencies between them. This separation is critical for managing the complexity of the payment processing system.

For networking, create a VPC with 3 availability zones. Each AZ should have both public and private subnets, with NAT gateways deployed only in the public subnets to enable outbound internet access from private resources.

The data layer needs an RDS PostgreSQL instance using db.t3.medium instance type. Deploy it in the private subnets with Multi-AZ enabled for high availability. Configure automated backups with a 30-day retention period.

Set up 3 Lambda functions with the following configurations:
- payment-validator: validates incoming payment requests
- payment-processor: processes approved payments
- audit-logger: logs all payment activities for compliance
All functions should have 512MB memory allocation and a 30-second timeout.

Configure API Gateway with a REST API that maps these endpoints to the Lambda functions:
- /validate → payment-validator
- /process → payment-processor
- /status → returns system status

Create a DynamoDB table named 'payment-transactions' with:
- Partition key: 'transaction_id' (String)
- Sort key: 'timestamp' (Number)

Establish an S3 bucket for audit logs with a lifecycle policy that automatically transitions objects to Glacier storage after 90 days to optimize costs while maintaining compliance.

Implement an SQS queue for handling failed payment retry processing. Configure it with 14-day message retention to ensure no payment failure is lost.

Set up a CloudWatch dashboard that displays:
- API Gateway latency metrics
- Lambda function error rates
- RDS CPU utilization

Configure an SNS topic for critical alerts with an email subscription to ops@company.com so the operations team is immediately notified of any issues.

Important requirements:
- Use AWS CDK v2 with Python 3.8 or higher
- All resources must be tagged with Environment, Team, and CostCenter tags for proper cost allocation
- RDS instances must use encrypted storage with customer-managed KMS keys (not AWS-managed)
- Lambda functions must use reserved concurrency to prevent throttling during high-traffic periods
- API Gateway must implement request throttling and require API keys for authentication
- DynamoDB tables must have point-in-time recovery enabled for data protection
- S3 buckets must block all public access and enable versioning
- IAM roles must follow the least-privilege principle with explicit deny statements where appropriate
- CloudWatch alarms must be created for all critical metrics to ensure monitoring coverage
- Production environment must use a separate VPC with no default security group rules (all rules must be explicit)

The deployment will be in the us-east-1 region. Set up the VPC with private subnets for RDS and Lambda functions, and public subnets for NAT gateways. Use separate KMS keys for database encryption and S3 bucket encryption. Configure CloudWatch Logs retention to 90 days for compliance requirements.

Expected output: A complete CDK Python application with proper stack organization, comprehensive IAM policies, and deployment instructions. The solution should reliably recreate the production environment from code with zero manual configuration required post-deployment.
