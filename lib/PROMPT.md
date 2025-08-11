# Prompt

Your mission is to act as an expert Senior DevOps Engineer specializing in cloud automation and modern network infrastructure. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**

Develop a comprehensive Python Pulumi program to provision a highly available, dual-stack (IPv4 and IPv6) environment on AWS. The solution must be modular, secure, and adhere to modern infrastructure-as-code and AWS best practices.
Output Format: Pulumi + Python

**Here is the task:**

Develop a Python Pulumi program that sets up an AWS infrastructure environment designed for a secure, scalable, and dual-stack (IPv4/IPv6) web application. The primary goal is to make the application accessible via the automatically generated DNS name of the Application Load Balancer. This task does not require you to buy a domain name. 

**The solution must meet the following requirements:**

1) Networking (VPC & Subnets): Define a VPC with both an IPv4 and an Amazon-provided IPv6 CIDR block. The VPC must contain at least two public, dual-stack subnets across different Availability Zones, with an Internet Gateway and appropriate route tables for full internet connectivity.

2) Compute (EC2 Instance): Deploy at least one EC2 instance (t3.micro) using the latest Amazon Linux 2 AMI. The instance must be assigned both a public IPv4 and an IPv6 address and have a simple web server (Nginx) installed via user data for testing.

3) Deploy an Application Load Balancer (ALB) configured for dualstack IP address type. It should have an HTTP listener that forwards traffic to a target group containing the EC2 instance.

4) Security (IAM & Security Groups): Enforce least privilege with a dedicated IAM role for the EC2 instance. The ALB's security group must allow inbound port 80 traffic from the internet (0.0.0.0/0 and ::/0), while the EC2 security group must only allow port 80 traffic from the ALB's security group.

5) Monitoring & Logging (CloudWatch): Create a CloudWatch Dashboard to monitor key ALB metrics like Request Count, Healthy Host Count, and HTTP status codes. Enable detailed monitoring for the EC2 instance.

6) Pulumi Project & State Management: The project must use Pulumi's configuration system for environment-specific values (e.g., AWS region). All sensitive data should be managed as Pulumi secrets.

Expected output: A complete Python script (__main__.py) that successfully provisions the described dual-stack infrastructure on AWS. The script must be well-commented, use Pulumi's configuration system, and export key outputs like the ALB's public DNS name for direct access. The result must be verifiable via pulumi up and by accessing the ALB's DNS name in a web browser.