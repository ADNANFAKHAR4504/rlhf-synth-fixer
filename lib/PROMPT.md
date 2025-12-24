Need to set up IAM security for our web app running on EC2. Have to lock down S3 access properly using CloudFormation.

## What I need:

### EC2 IAM Role
- Create role that EC2 instances can use
- Only allow reading from S3 buckets (no writes!)
- Need an explicit deny on all S3 write operations to be safe

### IAM User Policy
- Set up read-only access to one specific S3 bucket
- Attach to a specific user

### Security
Follow least privilege - only grant what's actually needed. No wildcards or broad permissions.

Use YAML format, call it security-configuration.yml.

## Deliverable:
Working CloudFormation template with:
- EC2 role with S3 read permissions + write deny
- User policy for specific bucket read access
- All the resource IDs and definitions needed
- Should deploy without errors

Make sure it actually deploys through the CF console.
