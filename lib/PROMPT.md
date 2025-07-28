Prompt is
```
Objective:

Generate a complete and valid AWS CloudFormation template in YAML format. This template will provision a secure, scalable, and isolated infrastructure for both development and production environments.

Core Requirements:

The template must define and configure the following resources and adhere to these specific constraints:

Region Specification:

All resources must be explicitly provisioned in the us-east-1 region.

Network Isolation (VPCs):

Create two distinct Virtual Private Clouds (VPCs) to ensure strict network isolation:

A VPC for the development environment (e.g., DevVPC).

A VPC for the production environment (e.g., ProdVPC).

For each VPC, provision at least one public subnet and one private subnet.

Include an Internet Gateway for public subnets and a NAT Gateway for private subnets to ensure proper internet access patterns.

Security Implementation (Security Groups):

Implement separate and distinct Security Groups for each environment.

Production Security Group: Create a security group for web servers that allows inbound traffic on port 80 (HTTP) and port 443 (HTTPS) from any IP address (0.0.0.0/0).

Development Security Group: Create a security group that allows inbound SSH traffic on port 22 from a placeholder IP address (use 10.0.0.5/32).

Scalability (Auto Scaling):

In the production environment only, design and configure an Auto Scaling group for EC2 instances.

The Launch Configuration should use an ami-0c55b159cbfafe1f0 (Amazon Linux 2) AMI and a t2.micro instance type.

The Auto Scaling group should be configured to maintain a minimum of 1 instance and scale up to a maximum of 3 instances.

Resource Outputs:

Use the Outputs section of the CloudFormation template to expose the following critical resource identifiers for external reference:

DevelopmentVPCID

ProductionVPCID

ProductionPublicSubnetIDs

ProductionPrivateSubnetIDs

ProductionAutoScalingGroupName

Expected Output:

The final deliverable should be a single, self-contained block of YAML code representing the complete CloudFormation template. The template must be well-commented, adhere to AWS best practices, and pass all CloudFormation validation checks.
```