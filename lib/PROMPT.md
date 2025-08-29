# CloudFormation Production Web Application Infrastructure Challenge

You are a senior DevOps engineer tasked with creating a production-grade AWS infrastructure using CloudFormation JSON. Deploy a secure web application environment with the following architecture:

## Core Infrastructure Requirements
Create a CloudFormation JSON template that provisions:

1. **VPC Network Architecture**
   - VPC with CIDR block 10.0.0.0/16 in us-west-2
   - Public subnet: 10.0.1.0/24 (us-west-2a)
   - Private subnet: 10.0.2.0/24 (us-west-2b) 
   - Internet Gateway attached to VPC
   - NAT Gateway in public subnet for private subnet internet access

2. **Compute and Database Infrastructure**
   - EC2 instance (t3.micro) in public subnet with Elastic IP
   - RDS MySQL instance (db.t3.micro) in private subnet
   - Database subnet group spanning multiple AZs

3. **Security and Access Control**
   - Security groups: web server (HTTP/HTTPS from anywhere) and database (MySQL from web server only)
   - IAM role for EC2 with CloudWatch Logs permissions
   - Instance profile for EC2 to assume the IAM role

4. **Operational Requirements**
   - All resources tagged with Project: XYZ and Environment: Production
   - Route tables configured for proper traffic flow
   - Outputs section exposing EC2 public IP and RDS endpoint

## Technical Constraints
- Use JSON format exclusively
- Template must validate using aws cloudformation validate-template
- Name the template 'prod-environment-setup.json'
- Ensure minimal IAM permissions following principle of least privilege
- Database must be in private subnet with no direct internet access

Provide a complete, deployable CloudFormation JSON template that creates this infrastructure successfully.