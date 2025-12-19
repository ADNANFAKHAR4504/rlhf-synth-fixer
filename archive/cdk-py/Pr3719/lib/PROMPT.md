Create a Python script using the AWS CDK to deploy a high-availability web application infrastructure.
Your script should define a CloudFormation stack with the following components and configurations:

Networking:
  A VPC with both public and private subnets distributed across two Availability Zones.

Compute & Load Balancing:
  An Auto Scaling Group for EC2 instances, with a minimum of two instances running.
  An Application Load Balancer (ALB) to distribute traffic to the EC2 instances.

Database:
  An RDS database instance deployed in a private subnet.
  Multi-AZ support must be enabled for the RDS instance to ensure high availability.

Security & IAM:
  Configure security groups to allow public HTTP traffic to the ALB and SSH access to the EC2 instances.
  Use IAM roles to grant necessary permissions to the EC2 instances, avoiding the use of IAM users.

Operations & Monitoring:
  Create a Lambda function for daily automated backups of the RDS database.
  Set up an S3 bucket with versioning enabled for storing application logs.
  Implement CloudWatch alarms to monitor the CPU and memory utilization of the EC2 instances.
  Enable termination protection for the entire stack.

General Requirements:
  The CDK stack should output the DNS name of the ALB.
  All created resources must be tagged with Environment, Project and Owner.
  The architecture should be designed to support multi-region deployment.

As a basic validation, please ensure the generated Python code is well-commented and successfully runs cdk synth without any errors.