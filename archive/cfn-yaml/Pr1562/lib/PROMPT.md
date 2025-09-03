We need to build a CloudFormation template for a production AWS setup. The goal is to create a secure environment in us-west-2 that can handle real workloads.

Here's what we're looking for:

Network setup - We need a VPC with public and private subnets. The private stuff should stay private, only public subnets get internet access. Make sure the routing is tight.

Servers and security - Put EC2 instances in the public subnets, but lock down SSH to just one IP address. Give them a read-only IAM role. We want at least 2 instances running at all times for redundancy.

Storage - S3 bucket with versioning turned on. The bucket policy should only allow access from within our VPC.

Database - RDS instance goes in the private subnet. Turn on encryption for the storage.

Lambda function - When someone uploads something to S3, we want a Lambda function to kick off automatically.

Monitoring - Set up CloudWatch to watch CPU usage on the EC2 instances. If it goes over 80%, send us an email via SNS.

Organization - Tag everything with Environment: Production. We need outputs for the EC2 public IP, RDS endpoint, and S3 bucket name so we can reference them later.

The template should be called TapStack.yml and use YAML format. Follow AWS security best practices throughout.
