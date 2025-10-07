Hi! I need a CloudFormation template in YAML to quickly set up a secure AWS environment for our startup’s internal services. Here’s what I need:

A VPC that spans two Availability Zones, with two public subnets and two private subnets (one of each in each AZ).
An Internet Gateway for the VPC, and a NAT Gateway in one of the public subnets so that EC2 instances in private subnets can access the internet.
Proper route tables:
Public subnets should be able to route traffic to the internet via the Internet Gateway.
Private subnets should route outbound internet traffic through the NAT Gateway.
An Application Load Balancer (ALB) in the public subnets.
An Auto Scaling Group (ASG) of EC2 instances (Amazon Linux 2) running Nginx, deployed in the private subnets and registered with the ALB.
The ALB should have health checks configured for Nginx.
Please tag all resources with Environment: Development.
At the end, output the ALB DNS name, the subnet IDs, and the security group IDs for future reference.
The template should follow AWS best practices, be deployable without errors, and ensure the ALB is functional with health checks.
Please provide only the YAML CloudFormation template
