Need to get terraform working for this webapp thing. Everything goes in one file - ./lib/main.tf. Don't want to deal with modules right now, too much hassle.

So basically we're trying to build a secure web app infrastructure on AWS. The usual stuff but done right this time.

The backend is already setup (S3 + DynamoDB in provider.tf) so don't add that again. Only works in us-west-2 or us-east-1 btw. Should probably make aws_region a variable.

For security - yeah, least privilege and all that. Each EC2 needs its own IAM role, nothing too permissive. Security groups should block everything by default then we'll open what we need.

S3 buckets need encryption (KMS), no public access obviously. And block any unencrypted uploads or we'll get in trouble. Tag everything consistently - Environment, Project, Owner, ManagedBy=terraform.

Network setup: one VPC, split into public/private subnets across multiple AZs. EC2s and database stuff goes in private subnets. Need a NAT gateway for internet access and a bastion host in public subnet for SSH access (only way in).

EC2 instances stay in private subnets, proper IAM roles, SSH only from bastion - no exceptions.

CloudTrail should be enabled but make it conditional since some accounts already have the max number of trails. Logs go to S3 (encrypted). CloudWatch logs also encrypted with KMS, keep for 90 days then delete.

Output the stuff CI/CD pipelines need: VPC ID, subnet IDs, bastion IP, bucket names, CloudTrail bucket ARN. Don't output any secrets or keys.

Requirements:
- Terraform >= 0.15 
- single main.tf file under ./lib/
- no external modules
- passes terraform validate 
- follows AWS security best practices