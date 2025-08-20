We need to set up a secure, highly available AWS infrastructure for our app in us-west-2. The team wants everything tagged for environment and ownership, and resource names should be clear and consistent.

Security is a big deal: use managed IAM policies with just enough access, encrypt all S3 buckets and Lambda environment variables with KMS, and lock down network traffic so only HTTP gets through. For high availability, spread resources across at least two AZsVPC, public/private subnets, and RDS in Multi-AZ mode. DynamoDB should have point-in-time recovery.

Well need to specify all data at rest must use AWS-managed KMS keys. The deployment should be smooth, error-free, and follow AWS best practices.

When youre done, just give us a single CloudFormation YAML file with everything: VPC, subnets, security groups, IAM roles, EC2, S3, RDS and outputs for the main resource ARNs and endpoints. Add comments where you made security, HA, or compliance choices. Make sure its easy to read and passes