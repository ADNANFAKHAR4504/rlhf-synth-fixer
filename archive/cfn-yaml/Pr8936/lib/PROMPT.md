You need to build secure application infrastructure on AWS using CloudFormation YAML templates.

The system processes application data through connected AWS services. Lambda functions run inside private VPC subnets and connect to an RDS MySQL database to read and write application records. These functions also write processed files to S3 buckets where all data gets encrypted using KMS keys. CloudWatch Logs streams capture every Lambda invocation for debugging. EC2 instances provide compute capacity within the same VPC, protected by security groups that only allow traffic from approved IP addresses. SSM Parameter Store holds database passwords that Lambda functions fetch at runtime instead of hardcoding secrets.

Build everything in us-east-1 region. Create IAM roles with minimal permissions - no wildcards. Tag every resource with Environment, CostCenter, Owner, and Project tags. Enable KMS encryption and versioning on all S3 buckets. Deploy Lambda functions inside the VPC with environment variables for config. Keep RDS instances private and encrypted. Lock down security groups to specific IP ranges only. Store secrets in SSM Parameter Store. Send Lambda logs to CloudWatch Log Groups.

Create these AWS resources in your CloudFormation template:

- VPC spanning multiple availability zones with both public and private subnets
- Internet Gateway connecting to route tables
- Two Lambda functions running in VPC with IAM roles that specify exact KMS and S3 permissions
- RDS MySQL database in private subnet with encryption enabled and seven day backup retention
- Two S3 buckets with KMS encryption, versioning, and lifecycle rules for archiving
- SSM parameters storing database credentials
- KMS keys with policies allowing Lambda to decrypt
- Security groups restricting access by IP CIDR blocks
- CloudWatch Log Groups for Lambda monitoring
- IAM roles for Lambda and EC2 with explicit action permissions

Use CloudFormation parameters for environment settings. Apply complete tagging with Environment, CostCenter, Owner, Project, and ManagedBy on every resource. Write IAM policies with explicit KMS decrypt and S3 object actions instead of wildcards. Set RDS backup retention to seven days with automated backups enabled. Configure S3 lifecycle policies to transition old objects to cheaper storage.

Output only valid YAML CloudFormation template code in a fenced code block.
