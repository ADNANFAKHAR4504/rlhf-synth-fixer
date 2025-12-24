# AWS VPC Infrastructure with Auto Scaling

I need to deploy a cloud environment where EC2 instances connect to the internet through a VPC networking layer. The Auto Scaling Group manages EC2 instances that are distributed across multiple availability zones for high availability.

Requirements:

1. Create a VPC with CIDR block 10.0.0.0/16. The VPC connects to an Internet Gateway for public subnet traffic. Public subnets route traffic through the Internet Gateway while private subnets connect to a NAT Gateway for outbound internet access.

2. Deploy EC2 instances that are managed by an Auto Scaling Group. The Auto Scaling Group distributes instances across two public subnets in different availability zones, ensuring high availability. EC2 instances connect to the VPC through the public subnets.

3. Configure a Security Group that attaches to EC2 instances and controls network access. The Security Group allows SSH traffic from the specific IP range 203.0.113.0/24 and permits HTTP traffic from the internet.

4. Create an IAM Role that EC2 instances assume to interact with AWS services. The IAM Role grants permissions for CloudWatch monitoring and Systems Manager access.

5. Set up a Launch Template that defines the EC2 instance configuration. The Launch Template connects to the Security Group and IAM Role, specifying t3.micro instances with Amazon Linux 2.

6. The Auto Scaling Group scales based on CPU utilization metrics. When average CPU exceeds 70 percent, the group triggers scaling policies to add instances.

Provide complete infrastructure code using AWS CDK with TypeScript. Include proper resource naming with prefixes and cost tracking tags.