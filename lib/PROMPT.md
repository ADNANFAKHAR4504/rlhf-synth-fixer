We need to set up a secure and highly available web app environment in AWS, specifically in us-east-1.

The CloudFormation template should create a VPC with public and private subnets in at least two availability zones, and handle routing with an internet gateway and NAT gateway for private subnet internet access.

The database should be an RDS MySQL instance using db.t3.micro, with Multi-AZ enabled and storage encryption turned on. The RDS instance should only accept connections from the web server security group - no public access.

We also need S3 buckets for app data, with server-side encryption and access logging enabled. The buckets should connect to our application for storing user uploads and logs.

Parameters should cover things like AMI ID, DB password, and key pairs. You can add conditions to toggle features like S3 logging if needed.

Make sure the template exports useful outputs: VPC ID, subnet IDs, EC2 public IPs, DB endpoint, and S3 bucket names.

Tag every resource with the environment and owner. Add comments explaining any security or high availability choices.

The template should pass cfn-lint and be ready to deploy as a single YAML file. Keep it modular, readable, and follow AWS best practices.
