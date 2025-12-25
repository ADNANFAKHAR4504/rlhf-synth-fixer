# AWS Loan Processing Migration Infrastructure

So we got this client - a financial services company moving their old loan processing system to AWS. They're doing like 50k transactions a day right now on-prem and need everything audit-ready because, you know, finance regulations.

They specifically want CloudFormation JSON (yeah I know, not my first choice either but that's what they're comfortable with). We're deploying to us-east-1.

The tricky part is they want one template that works for both dev and prod - dev should be single-AZ to keep costs down, prod needs multi-AZ obviously.

## What I need

Here's what needs to be in the CFN template:

**Database**
- Aurora MySQL cluster (just one writer instance)
- Has to be encrypted with KMS (customer-managed keys, not AWS-managed)
- Multi-AZ only if it's prod environment
- DB creds in Secrets Manager with 30-day rotation

**Lambda**
- One function for loan validation
- 1GB memory
- Need to set reserved concurrency so it doesn't get throttled
- CloudWatch logs with 90 day retention (compliance thing)

**Storage**
- S3 bucket for loan docs
- Versioning enabled
- Encrypted, proper access controls

**Network**
- VPC across 2+ AZs
- Public + private subnets in each AZ
- NAT gateways for private subnet internet access
- Security groups and NACLs

**Secrets**
- Secrets Manager for DB passwords
- Auto-rotate every 30 days
- Make sure Lambda can access it

**Monitoring**
- CloudWatch log groups for everything
- 90 day retention exactly (their compliance team is really strict about this)

**Template Parameters**
- Environment type (dev vs prod)
- Instance sizes should be configurable
- Use Conditions to handle the multi-AZ stuff

## Technical stuff to remember

- CloudFormation JSON format (not YAML)
- Aurora MySQL for the DB
- Lambda for compute
- S3 for storage
- Secrets Manager for passwords
- CloudWatch for logs
- KMS for encryption
- us-east-1 region
- All resource names need to include the `environmentSuffix` parameter - something like `{resource-type}-{purpose}-{environmentSuffix}`
- Everything needs to be destroyable - NO DeletionPolicy Retain or DeletionProtection on anything (we're testing this setup multiple times)

## Important constraints

- DB passwords ONLY in Secrets Manager (not hardcoded anywhere, obviously)
- Customer-managed KMS keys for RDS encryption
- Lambda needs reserved concurrency set
- Tag everything with Environment, CostCenter, and MigrationPhase
- 90 days log retention - not 89, not 91, exactly 90 (compliance is picky)
- Use CFN Conditions for the dev/prod differences
- NO retention policies or deletion protection - has to be fully teardown-able
- Need proper error handling and logging everywhere

## What needs to be in the final template

- Parameters section (environment type, instance sizes, etc)
- Conditions section (for the multi-AZ logic)
- VPC with public/private subnets across multiple AZs
- Aurora MySQL cluster with KMS encryption + Secrets Manager
- Lambda function with proper config
- S3 bucket with versioning
- CloudWatch log groups (90 day retention)
- KMS keys
- IAM roles and policies
- Tags on everything
- Some docs explaining how to use the parameters

That's pretty much it. Let me know if you need clarification on anything.
