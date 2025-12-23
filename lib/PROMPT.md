### Secure AWS S3 Configuration with Python CDK

Hey team, we're shifting to Python and AWS CDK for our secure configuration project instead of CloudFormation YAML. This gives us more flexibility with familiar programming.

Your task is to create a Python CDK application that sets up a secure IAM role for AWS Lambda to interact with S3.

### Requirements

Here's what the solution needs to do:

- IAM Role with AssumeRole Policy: Create an IAM Role that AWS Lambda service connects to and assumes. Lambda functions will use this role to access S3 securely.

- Customer Managed Policy: The role must attach a policy granting s3:GetObject and s3:ListBucket permissions. The policy connects these actions to a specific S3 bucket and uses a Condition that restricts access to only the apps/tap/ prefix and its subpaths.

- Service Flow: Lambda assumes the IAM role, which grants access to S3. The policy uses IAM conditions to limit what S3 paths Lambda can read from.

- Tagging: Tag all resources with Environment: Production and Owner: DevOps for tracking.

- Security: Use least-privilege IAM policies with specific resource ARNs rather than broad permissions.

### Technical Specifications

- Language: Python
- Framework: AWS CDK  
- Region: us-east-1

### Deliverable

Submit a complete Python CDK project with the main application file and stack definition. Should be ready to deploy with cdk synth and cdk deploy.
