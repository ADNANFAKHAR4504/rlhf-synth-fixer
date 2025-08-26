Using Pulumi's Java SDK, Design a configuration to set up a simple web hosting environment on AWS

Requirements:
- Use AWS as the service provider and deploy resources across 'us-east-1' and 'us-west-2' regions for failover capabilities.
- Create a Virtual Private Cloud (VPC) with a CIDR block of 10.0.0.0/16.
- Ensure the VPC contains at least two subnets across different Availability Zones.
- Implement an Internet Gateway and attach it to the VPC to allow inbound and outbound internet access.
- Set up a Route Table and associate it with the subnets intended for public access.
- Deploy an S3 bucket configured for static website hosting.
- Tag all resources with 'Environment=Development'.
- Define security groups to permit HTTP (port 80) and HTTPS (port 443) traffic.
- Launch a small EC2 instance within the VPC in one of the public subnets.
- Assign an IAM Role to the EC2 instance that grants access to the S3 bucket.
- Avoid using hard-coded AWS credentials within the Pulumi configurations.
- Ensure that Terraform state is stored in an S3 bucket backend for state management.