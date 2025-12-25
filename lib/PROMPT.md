# AWS Loan Processing Migration Infrastructure

So we got this client - a financial services company moving their old loan processing system to AWS. They're doing like 50k transactions a day right now on-prem and need everything audit-ready because, you know, finance regulations.

They specifically want CloudFormation JSON - yeah I know, not my first choice either but that's what they're comfortable with. We're deploying to us-east-1.

The tricky part is they want one template that works for both dev and prod - dev should be single-AZ to keep costs down, prod needs multi-AZ obviously.

## What I need

Here's the setup:

**Database and how it connects**
- Aurora MySQL cluster - just one writer instance
- Has to be encrypted with customer-managed KMS keys
- Multi-AZ only if it's prod environment
- Lambda functions will connect to this database for loan validation
- DB password stored in Secrets Manager with 30-day rotation, and Lambda pulls creds from there

**Lambda compute**
- One function for loan validation
- 1GB memory
- Need reserved concurrency set so it doesn't get throttled
- Lambda accesses database through VPC security groups
- CloudWatch logs with 90 day retention - compliance is really strict about this

**Storage integration**
- S3 bucket for loan docs
- Versioning enabled
- Encrypted storage
- Lambda might write processed results here

**Network setup**
- VPC across 2 or more AZs
- Public and private subnets in each AZ
- NAT gateways so private subnets can access internet
- Security groups controlling Lambda access to RDS
- Network ACLs for subnet-level controls

**Secrets and how services access them**
- Secrets Manager holds DB passwords
- Auto-rotate every 30 days
- Lambda IAM role grants access to read from Secrets Manager
- Lambda execution role also needs VPC execution permissions

**Monitoring across everything**
- CloudWatch log groups for Lambda execution
- 90 day retention exactly - not 89, not 91
- Logs need to capture Lambda invocations and any database connection issues

**Template configuration**
- Parameters for environment type - dev vs prod
- Instance sizes configurable
- Conditions to handle the multi-AZ logic - dev is single-AZ, prod is multi-AZ

## Technical requirements

- CloudFormation JSON format - not YAML
- Aurora MySQL for the database
- Lambda for compute
- S3 for document storage
- Secrets Manager for password management
- CloudWatch for logging
- KMS for encryption keys
- us-east-1 region
- All resource names include the environmentSuffix parameter - like db-loanprocessing-dev123 or lambda-validator-prod456
- Everything needs to be destroyable - NO DeletionPolicy Retain or DeletionProtection on anything since we're testing this setup multiple times

## Key constraints

- DB passwords ONLY in Secrets Manager - not hardcoded anywhere
- Customer-managed KMS keys for RDS encryption - not AWS-managed
- Lambda needs reserved concurrency set to prevent throttling under load
- Tag everything with Environment, CostCenter, and MigrationPhase tags
- 90 days log retention - compliance team is picky about this exact number
- Use CFN Conditions for the dev vs prod differences
- NO retention policies or deletion protection - has to be fully tear-down-able
- IAM roles need specific permissions - Lambda execution role needs VPC access, Secrets Manager read, RDS network access, CloudWatch write

## What needs to be in the final template

- Parameters section for environment type, instance sizes, other configs
- Conditions section for the multi-AZ logic
- VPC with public and private subnets across multiple AZs
- Aurora MySQL cluster with KMS encryption integrated with Secrets Manager
- Lambda function with proper IAM role attached to it
- S3 bucket with versioning
- CloudWatch log groups with 90 day retention
- KMS keys for encrypting database storage
- IAM roles and policies - Lambda execution role connects to RDS through security groups, reads from Secrets Manager, writes to CloudWatch
- Tags on all resources
- Some docs explaining how to use the parameters

That's pretty much it. The main thing is making sure Lambda can actually connect to RDS through the VPC security groups and pull credentials from Secrets Manager at runtime.
