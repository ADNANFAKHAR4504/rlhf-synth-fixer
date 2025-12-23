Create a CloudFormation template where VPC connects private EC2 instances through NAT Gateway for internet access and security groups control traffic between resources.

Network setup:
- VPC with 10.0.0.0/16 CIDR in us-east-1 that contains public and private subnets
- Two public subnets in different AZs connected to Internet Gateway for outbound traffic
- Two private subnets in different AZs that route traffic through NAT Gateway for internet access
- Internet Gateway attached to VPC for public subnet connectivity
- NAT Gateway deployed in public subnet that provides internet access for private subnets

Compute and security:
- EC2 instances deployed in private subnets that connect through security groups
- Latest Amazon Linux 2 AMI with IAM instance profile for CloudWatch and SSM access
- Security groups that allow SSH from office IP and enable internal communication between instances
- Route tables that direct private subnet traffic through NAT Gateway for updates

All resources use ProjectX prefix for tagging and environment suffix for multi-environment deployment.

Template should deploy without errors with comments explaining how each resource connects to others.
