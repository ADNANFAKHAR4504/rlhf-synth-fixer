I need a CloudFormation template for us-east-1 that sets up a secure AWS environment demonstrating how all the security services work together. This is for our security training examples, so it needs to show real-world integration patterns.

Start with a custom VPC using 10.0.0.0/16. Put EC2 instances in a private subnet so they're not directly exposed to the internet. The instances should use IAM roles to access specific paths in S3 buckets - no hardcoded credentials. Security groups should only allow the traffic we actually need, like SSH from our office CIDR and MySQL access between EC2 and RDS.

For storage, set up S3 buckets with KMS encryption and proper access policies. Make sure one bucket logs access to another bucket so we can track who's accessing what. Enable versioning for compliance and block all public access.

The RDS MySQL database goes in its own private subnet with encryption at rest. Store the database credentials in Secrets Manager and have a Lambda function rotate them automatically. The Lambda should run in a VPC and use endpoints to access Secrets Manager without going over the internet. Configure the RDS security group to only allow connections from the EC2 security group on port 3306.

Set up CloudTrail to capture all API calls and send them to both S3 and CloudWatch. Encrypt the CloudTrail logs with KMS. Also enable VPC Flow Logs so we can see all network traffic patterns for security monitoring.

Use separate KMS keys for different services - one for S3, another for RDS. Set up key policies that restrict which IAM roles can use them. Make sure KMS key rotation is enabled.

For the Lambda that rotates secrets, give it an execution role with just enough permissions to read from Secrets Manager, update RDS passwords, and write logs to CloudWatch. Connect it through VPC endpoints to keep everything private.

Make the template flexible with parameters for Environment (dev/prod), InstanceType, ProjectName, and Owner. Use mappings to configure different CIDR blocks per environment. Tag everything consistently with env, owner, and project tags.

Add outputs for all the important resource IDs and ARNs - VPC, subnets, security groups, EC2 instance, S3 bucket names, RDS endpoint, and KMS key IDs. This way other teams can reference these resources.

The whole setup should show defense in depth - multiple layers of security with encryption everywhere, network isolation, least-privilege IAM policies, and comprehensive logging. Make sure it actually deploys without errors and all the services can talk to each other through the security groups we configure.
