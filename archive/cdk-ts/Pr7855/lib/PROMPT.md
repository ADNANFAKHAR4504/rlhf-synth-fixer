I need a TypeScript AWS CDK v2 file called infrastructure.ts that sets up a complete cloud environment. Here's what I need:

**Configuration at the top of the file:**

- Put a config block right at the top with settings I can easily change
- Region should default to us-east-1 but support any region
- A nameSuffix variable that I can change once to update all resource names (like -dev01)
- An ec2AmiId placeholder that I need to fill in before deploying
- Settings for instance types and auto scaling min/max sizes
- Default VPC CIDR and log retention days

Document exactly where each setting is so I know what to change before running cdk deploy.

**What needs to be built:**

Multi-AZ VPC across at least two availability zones with public and private subnets in each one. This gives us high availability and lets us put databases in private subnets while keeping load balancers accessible.

EC2 instances in an auto scaling group that can scale up or down based on CPU usage. Each instance should have an Elastic IP attached. Put them in private subnets for security, with a bastion host or NAT gateway for outbound traffic.

An S3 bucket with versioning turned on and KMS encryption. Make sure it requires HTTPS only and blocks public access. The bucket name needs the nameSuffix appended.

A Secrets Manager resource to store database passwords and app credentials. The EC2 instances should be able to read from it but nothing gets hardcoded in the source code.

CloudWatch alarms that watch EC2 CPU and send SNS notifications if it gets too high. I need an SNS topic with the nameSuffix in the name that I can subscribe an email to.

An IAM role for EC2 that only has the permissions it needs: read from Secrets Manager, write logs to CloudWatch, and read from S3. No overly permissive policies.

Logging enabled for everything - CloudWatch Logs agent on EC2, S3 access logs, and AWS Backup audit logs all going to a centralized log group with the nameSuffix in the name.

AWS Backup configured with a plan and vault. Back up the EC2 instances and any RDS or EFS if we add them. Use KMS for encryption. The vault name needs the nameSuffix.

**Outputs:**

At the end of the stack, output the key resource IDs so I can reference them: VPC ID, subnet IDs, EC2 instance IDs, auto scaling group name, S3 bucket name, Secrets Manager secret ARNs, CloudWatch log group names, SNS topic ARN, backup vault name, and IAM role ARNs. Include the nameSuffix in output names where it makes sense.

**Code quality:**

Write it all in one TypeScript file. Use CDK v2 constructs properly, not string-based JSON for IAM policies. Add comments explaining the design and where to change things. Include a validation checklist as comments showing how to test that versioning works, secrets are accessible, alarms trigger, auto scaling responds, and backups complete.

Make sure it synthesizes with cdk synth and deploys with cdk deploy without errors. Use standard security practices for security groups and NACLs. Tag everything with Environment, Name, and Owner tags.

The file needs to work with Node.js 18 and up.
