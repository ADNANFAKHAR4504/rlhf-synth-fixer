# Prompt

Your mission is to act as an expert Senior DevOps Engineer specializing in cloud automation and modern network infrastructure. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**

Develop a comprehensive Python Pulumi program to provision a highly available, dual-stack (IPv4 and IPv6) environment on AWS. The solution must be modular, secure, and adhere to modern infrastructure-as-code and AWS best practices.
Output Format: Pulumi + Python

**Here is the task you need to translate to Pulumi:**

Develop a Python Pulumi program that sets up an AWS infrastructure environment designed for a secure, scalable, and dual-stack (IPv4/IPv6) web application. The solution must meet the following requirements:

1) Networking (VPC & Subnets): Define a VPC with both IPv4 and an Amazon-provided IPv6 CIDR block. The VPC must contain at least two public, dual-stack subnets across different Availability Zones, with an Internet Gateway and appropriate route tables for full internet connectivity.

2) Compute (EC2 Instance): Deploy at least one EC2 instance (t3.micro) using the latest Amazon Linux 2 AMI. The instance must be assigned both a public IPv4 and an IPv6 address and have a simple web server (Nginx) installed via user data for testing.

3) Load Balancing (Application Load Balancer): Deploy an Application Load Balancer (ALB) configured for dualstack IP address type. It should have an HTTP listener that forwards traffic to a target group containing the EC2 instance.

4) DNS & Routing (Route 53): For a given domain in a Route 53 hosted zone (provided via Pulumi config), automatically create an A record (IPv4) and an AAAA record (IPv6) pointing to the ALB.

5) Security (IAM & Security Groups): Enforce least privilege with a dedicated IAM role for the EC2 instance. The ALB's security group must allow inbound port 80 traffic from the internet (0.0.0.0/0 and ::/0), while the EC2 security group must only allow port 80 traffic from the ALB's security group.

6) Monitoring & Logging (CloudWatch): Create a CloudWatch Dashboard to monitor key ALB metrics like Request Count, Healthy Host Count, and HTTP status codes. Enable detailed monitoring for the EC2 instance.

7) Pulumi Project & State Management: The project must use Pulumi's configuration system for environment-specific values (e.g., AWS region, hosted zone name). All sensitive data should be managed as Pulumi secrets.

Expected output: A complete Python script (__main__.py) that successfully provisions the described dual-stack infrastructure on AWS. The script must be well-commented, use Pulumi's configuration system, export key outputs like the ALB DNS name, and be verifiable via pulumi up and checks in the AWS console.