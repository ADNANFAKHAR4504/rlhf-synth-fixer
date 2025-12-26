# Infrastructure Task 088

## Technical Specifications

# PROMPT

```yaml
Design a highly available auto-scaling web application infrastructure using CloudFormation YAML template.

Deploy everything in us-west-2 region. Tag all resources with Environment: production.

VPC Network Configuration:

Create a VPC with multi-tier architecture.
Set up two public subnets and two private subnets across different Availability Zones in us-west-2 for high availability.
Add an Internet Gateway attached to the VPC for public subnet internet access.
Deploy a NAT Gateway in one public subnet to provide outbound internet access for private subnet resources.
Configure route tables to direct traffic within the VPC and to the internet via the Internet Gateway or NAT Gateway.

Application Load Balancer and Auto-Scaling EC2:

Deploy an Application Load Balancer in the public subnets to distribute incoming HTTP traffic.
Configure ALB listener on port 80 that forwards requests to port 8080 on the backend EC2 instances.
Implement an Auto Scaling Group for the EC2 instances with minimum 2 instances, maximum 6 instances, using t2.micro instance type.
Deploy instances into the private subnets.
Use Amazon Linux 2023 AMI.

RDS Configuration:

Deploy Amazon RDS instance using MySQL 5.7 engine version.
Configure for Multi-AZ deployment for data redundancy and availability.
Deploy the RDS instance into the private database subnets.

Security Groups:

Apply security groups with least privilege principle.
ALB security group allows inbound HTTP traffic on port 80 from anywhere.
EC2 instances security group allows inbound traffic on port 8080 only from ALB security group.
RDS security group allows inbound traffic on MySQL port 3306 only from EC2 instances security group.

Tag all deployed resources with Environment: production.
```