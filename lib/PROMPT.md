Need to lock down S3 access for our EC2 instances using IAM. The app running on EC2 needs to read from S3, but we're seeing write access where there shouldn't be any.

## What to build:

### EC2 Role with S3 Access
Set up an IAM role that EC2 instances **assume to connect to** S3 buckets. The role grants read-only access like GetObject and ListBucket but explicitly blocks write operations like PutObject, DeleteObject, and similar using a deny statement.

When the EC2 app **calls** S3, it **uses** this role's credentials **through** the instance profile.

### User Policy for Specific Bucket
Also need an IAM policy **attached to** a specific user that **allows reading from** one particular S3 bucket. The user **authenticates and accesses** that single bucket for reads.

## Security Requirements:
- Least privilege only - specify exact S3 actions needed
- No wildcards on resources
- Explicit deny on write operations
- Role assumption flow: EC2 **connects through** Instance Profile **which assumes** IAM Role **to access** S3

Use CloudFormation with YAML. Call it security-configuration.yml.

## Expected:
Working CFN template that:
- Creates the IAM role with instance profile for EC2
- **Connects** S3 read permissions with write denies
- Creates user policy for specific bucket access
- Links everything so EC2 **can assume the role and access** S3

Should deploy clean **through** CloudFormation console.
