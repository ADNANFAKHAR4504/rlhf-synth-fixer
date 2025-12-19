# Production Web Infrastructure Setup

Build a secure web application infrastructure on AWS using CloudFormation JSON. We need a complete setup for hosting a production web application.

## What to Build

Create a CloudFormation template that sets up:

**Network Setup:**
- VPC using 10.0.0.0/16 in us-west-2
- Public subnet: 10.0.1.0/24 in us-west-2a  
- Private subnet: 10.0.2.0/24 in us-west-2b
- Internet Gateway for public access
- NAT Gateway so private resources can reach internet

**Servers and Database:**
- Web server (t3.micro EC2) in public subnet with static IP
- MySQL database (db.t3.micro RDS) in private subnet
- Database subnet group across multiple availability zones

**Security:**
- Security group for web server allowing HTTP/HTTPS from internet
- Security group for database allowing MySQL only from web server
- IAM role for EC2 with CloudWatch logging permissions
- Instance profile to attach the role to EC2

**Operations:**
- Tag everything with Project: XYZ and Environment: Production
- Set up routing tables for traffic flow
- Export EC2 public IP and database endpoint in outputs

## Requirements

- Use CloudFormation JSON format
- Template should pass validation with aws cloudformation validate-template
- Follow AWS best practices for security
- Keep database private with no direct internet access
- Use minimal IAM permissions

The template should create working infrastructure that can run a production web application.