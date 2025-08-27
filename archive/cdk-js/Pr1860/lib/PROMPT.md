You are an expert AWS DevOps architect and you need to solve following:

We're setting up a secure web app infrastructure on AWS using CloudFormation.

We need to make sure everything meets our production standards.

Here’s what we need:

Use our existing VPC (the network team already set this up)
Spin up EC2 instances (t2.micro, Amazon Linux 2) in at least two Availability Zones for high availability
Only allow HTTP (port 80) and SSH (port 22) traffic in the security group, and restrict SSH to a specific IP CIDR block
Enable CloudWatch monitoring and centralized logging for all instances
Store logs in an existing S3 bucket
Encrypt the root volumes of all EC2 instances to meet CIS benchmarks
Attach IAM roles with just the permissions needed for sensitive configs
Tag every resource with Environment: Production
Restrict outbound traffic so only trusted IPs can be reached
Make sure config files are only readable by the EC2 instances themselves
Everything should be set up in the us-east-1 region

The end goal: a modular, fully testable CDK + JavaScript code.

The code that passes all our security and compliance checks, and is ready for production

Let’s keep it simple, secure, and easy to maintain. Do not use emojis in response.
