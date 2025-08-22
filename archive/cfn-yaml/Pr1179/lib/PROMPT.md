You are an AWS CloudFormation expert. Your task is to create a production-ready CloudFormation template in YAML format that deploys a highly available and secure cloud environment according to the following specifications:

Infrastructure Requirements:

    1	VPC & Networking
    •	Create a Virtual Private Cloud (VPC) with a configurable CIDR block.
    •	Include at least two subnets located in different Availability Zones for high availability.
    •	Configure appropriate route tables for public access where required.

    2	Internet Access
    •	Deploy and attach an Internet Gateway (IGW) to the VPC to allow public internet access.
    •	Ensure that the public subnets route traffic through the IGW.

    3	Compute (EC2 + Auto Scaling)
    •	Create an Auto Scaling Group (ASG) that maintains a minimum of two EC2 instances.
    •	Ensure instances are distributed across multiple Availability Zones.
    •	Use a Launch Template or Launch Configuration with configurable AMI ID, instance type, and key pair.

    4	Security
    •	Define Security Groups that allow inbound HTTP (port 80) and HTTPS (port 443) access to EC2 instances.
    •	Restrict outbound traffic to only necessary destinations.
    •	Follow the principle of least privilege in security rules.

Template Requirements:
• All resource names must be logically structured and tagged with environment and purpose.
• Use parameters for configurable values such as environment name, instance type, and CIDR blocks.
• Include outputs for critical resources (VPC ID, subnet IDs, security group IDs, ASG name).
• Avoid hardcoding values; use intrinsic functions where applicable.
• The template must pass aws cloudformation validate-template without errors.

Expected Output:
• A complete YAML CloudFormation template file implementing all of the above requirements.
• The template must be fully deployable in AWS CloudFormation and adhere to AWS best practices for high availability and network isolation.
