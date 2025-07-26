# PROMPT

```yaml
You are an expert AWS Solutions Architect specializing in CloudFormation for highly available and auto-scaling web application deployments. Your task is to design and define a complete AWS infrastructure using a single CloudFormation YAML template.

The entire infrastructure must be deployed exclusively in the us-west-2 AWS region. All deployed resources must be tagged with Environment: production.

Your CloudFormation YAML template must comply with the following detailed requirements, ensuring high availability, scalability, and robust security:

VPC Network Configuration:

Provision a Virtual Private Cloud (VPC) that supports a multi-tier architecture.

Create at least two public subnets and two private subnets, each spanning different Availability Zones within the us-west-2 region to ensure high availability.

Implement an Internet Gateway attached to the VPC to enable public subnet internet access.

Deploy a NAT Gateway in one of the public subnets to provide outbound internet access for resources in the private subnets.

Configure route tables appropriately to direct traffic within the VPC and to the internet via the Internet Gateway or NAT Gateway.

Application Load Balancer (ALB) and Auto-Scaling EC2 Instances:

Deploy an Application Load Balancer (ALB) in the public subnets to evenly distribute incoming HTTP traffic.

The ALB must have a listener on port 80 that forwards requests to port 8080 on the backend EC2 instances.

Implement an Auto Scaling Group for the EC2 instances, configured to:

Maintain a minimum of 2 instances.

Scale up to a maximum of 6 instances.

Utilize the t2.micro instance type.

Deploy instances into the private subnets.

Use an up-to-date Amazon Linux AMI (e.g., Amazon Linux 2023).

Relational Database Service (RDS) Configuration:

Deploy an Amazon RDS instance using the MySQL 5.7 engine version.

The RDS instance must be configured for Multi-AZ deployment to enhance data redundancy and availability.

Deploy the RDS instance into the private database subnets (part of the private subnets created in the VPC).

Security Group Implementation:

Apply security groups with the principle of least privilege.

Define a security group for the ALB that allows inbound traffic on HTTP (port 80) from anywhere.

Define a security group for the EC2 instances that allows inbound traffic on port 8080 only from the ALB's security group.

Define a security group for the RDS instance that allows inbound traffic on MySQL (port 3306) only from the EC2 instances' security group.

Resource Tagging:

Ensure that all deployed resources (VPC, subnets, Internet Gateway, NAT Gateway, ALB, Auto Scaling Group, Launch Template, EC2 instances, RDS instance, security groups, etc.) are consistently tagged with Environment: production.
```
