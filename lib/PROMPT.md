Please generate a single YAML CloudFormation template file named secure-web-app.yaml. This template should deploy a highly available, scalable, and secure web application infrastructure on AWS, adhering to the following specifications:

Virtual Private Cloud (VPC) Configuration:

Create a new VPC with a CIDR block of 10.0.0.0/16.

Establish two public subnets (e.g., 10.0.1.0/24, 10.0.2.0/24) and two private subnets (e.g., 10.0.10.0/24, 10.0.11.0/24). These subnets must be distributed across two distinct Availability Zones to ensure high availability.

Include an Internet Gateway (IGW) attached to the VPC to enable internet connectivity for public resources.

Deploy two NAT Gateways, one in each public subnet, to allow instances in private subnets to initiate outbound internet connections without being publicly accessible.

Configure appropriate route tables for both public and private subnets to direct traffic correctly (internet-bound traffic via IGW for public, via NAT Gateways for private).

Application Load Balancer (ALB) Setup:

Provision an Application Load Balancer (ALB) in the public subnets.

The ALB should be internet-facing and configured to handle all incoming HTTP (port 80) and HTTPS (port 443) traffic.

Create an ALB Security Group that permits inbound HTTP (80) and HTTPS (443) traffic from anywhere (0.0.0.0/0).

Define an ALB Target Group for the EC2 instances, listening on port 80 (HTTP).

EC2 Auto Scaling Group for Web Servers:

Create an Auto Scaling Group (ASG) for the web application servers.

The ASG instances must be launched into the private subnets across the two Availability Zones.

Configure the ASG with a minimum size of 2 and a desired capacity of 2, ensuring at least two t3.micro instances are always running.

Utilize a Launch Template for the ASG that specifies the t3.micro instance type, a suitable Amazon Linux 2 AMI, and associates the instances with the necessary security group and IAM instance profile.

Include a basic UserData script in the Launch Template to install and start a web server (e.g., Apache or Nginx) on the EC2 instances.

RDS PostgreSQL Database Instance:

Deploy an RDS PostgreSQL database instance.

Crucially, configure the RDS instance for Multi-AZ deployment to ensure high availability and automatic failover.

The database instance should be placed in the private subnets and must not be publicly accessible.

Specify a db.t3.micro instance type and a supported PostgreSQL engine version (e.g., 13.10).

Define parameters for the master username and password.

IAM Roles and Policies (Least Privilege):

Create an IAM Role for EC2 instances that grants only the necessary permissions for the web application to function (e.g., potentially for SSM access for management, or any other AWS services the application might interact with). Adhere strictly to the principle of least privilege.

Attach this IAM role to the EC2 instances via an Instance Profile.

Security Group for Secure Communication:

Create an EC2 Security Group for the web application instances that allows inbound HTTP (port 80) traffic only from the ALB's security group. It should also allow SSH (port 22) access from a specific, restricted CIDR block (or a bastion host's security group) for administrative purposes (avoid 0.0.0.0/0 for SSH in a production scenario).

Create an RDS Security Group that permits inbound PostgreSQL traffic (port 5432) only from the EC2 instances' security group. This ensures that only your web application can connect to the database.

Upon successful deployment, the CloudFormation stack should pass all AWS validation checks, and the resulting AWS environment should precisely reflect this secure, scalable, and highly available three-tier architecture.
