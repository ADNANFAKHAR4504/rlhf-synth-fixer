### Secure AWS Infrastructure with CDK

Hey, I'm putting together a CloudFormation stack using TypeScript and AWS CDK, and I need to make sure it's really solid on security.

We're aiming to set this up in the 'us-west-2' region, using our default AWS account settings. For naming things, we'll follow this pattern: resource-type-function-environment, like s3-logs-prod. The network CIDR blocks should be 10.0.0.0/16.

Here's a breakdown of what the stack needs to include:

- S3 Buckets: All S3 buckets need to be encrypted with server-side encryption, and versioning needs to be turned on for every single one.
- EC2 Instances: Any EC2 instances we launch must be inside a VPC, and we should only use t3.micro instances.
- IAM Roles: We'll apply IAM roles to our EC2 instances for S3 access. It's crucial that these roles have just the bare minimum permissions they need – no more.
- High Availability: We need to deploy everything across two availability zones for good high availability.
- Monitoring: CloudWatch monitoring should be enabled on all EC2 instances.
- Lambda Logs: All logs from AWS Lambda invocations need to be stored in CloudWatch.
- RDS Database: We'll use RDS for our database instances, configured for multi-AZ deployments. Automatic backups need to be on for RDS, with at least a 7-day retention period.
- SSH Access: I need a security group set up to allow SSH access, but only from a specific, limited IP range.
- Load Balancer Traffic: When we set up a load balancer, all application traffic through it must use HTTPS.
- DynamoDB: Any DynamoDB tables we use need to have point-in-time recovery enabled.

The expected output is a complete AWS CDK application written in TypeScript. When I deploy it, it should create all these specified resources exactly as described, following all the constraints.
My Directory structure follows generate the code accordingly

lib/
├── MODEL_RESPONSE.md
├── PROMPT.md
└── tap-stack.ts
