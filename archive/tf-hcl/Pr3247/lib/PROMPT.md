Create Terraform infrastructure code for a travel agency booking portal web application.

Requirements:

1. Create a VPC in us-east-1 with CIDR block 10.10.0.0/16

2. Create two public subnets:
   - Subnet 1: 10.10.1.0/24 in availability zone us-east-1a
   - Subnet 2: 10.10.2.0/24 in availability zone us-east-1b

3. Deploy EC2 instances:
   - Use t3.small instance type
   - Configure instances to run nginx web server
   - Deploy instances in both public subnets for availability
   - Configure instances to use IMDSv2 for enhanced security
   - Include user data script to install and start nginx

4. Configure Security Groups:
   - Create a security group for EC2 instances
   - Allow HTTPS traffic on port 443 from anywhere
   - Allow SSH traffic on port 22 only from CIDR 10.0.0.0/8
   - Allow outbound traffic to anywhere

5. Create S3 bucket for static images:
   - Enable CORS configuration to allow cross-origin requests
   - Configure bucket with appropriate access policies
   - Enable versioning for data protection

6. Set up CloudWatch monitoring:
   - Enable detailed monitoring for EC2 instances
   - Create CloudWatch dashboard to monitor request latency
   - Configure VPC Flow Logs to capture network traffic data

7. Networking components:
   - Create Internet Gateway and attach to VPC
   - Configure route tables for public subnets
   - Associate route tables with subnets

Provide the complete Terraform HCL code implementing all requirements. Include variables for reusability and outputs for important resource identifiers. Each file should be in its own code block.