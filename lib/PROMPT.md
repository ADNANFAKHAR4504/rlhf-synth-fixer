# CDKTF Scalable Web Application Infrastructure

Create a CDK for Terraform (CDKTF) project to deploy a scalable, secure, production-grade web application infrastructure on AWS. Use either TypeScript or Python with CDKTF and ensure the following requirements and constraints are fully implemented.

## Requirements

### Environment and Versioning
- Use CDKTF with Terraform version ≥ 0.14
- Target AWS us-west-2 region
- Infrastructure code must be stored in a Git repository and properly version-controlled

### VPC and Networking
- Create a VPC with CIDR block 10.0.0.0/16
- Provision public and private subnets across at least 2 Availability Zones
- Add an Internet Gateway and configure Route Tables for public subnet access

### Elastic Load Balancer (ALB)
- Deploy an Application Load Balancer (ALB) in the public subnets
- ALB should route traffic to EC2 instances in the private subnets

### Auto Scaling Group (ASG)
- Deploy EC2 instances in private subnets as part of an Auto Scaling Group
- ASG must scale based on CPU utilization using CloudWatch metrics and alarms
- Use a specific AMI ID of your choice

### RDS PostgreSQL
- Deploy a PostgreSQL RDS instance in private subnets
- Ensure no public access; restrict database access to EC2 instances only via Security Groups

### Security Groups
- **ALB SG**: allow HTTP/HTTPS from the internet
- **EC2 SG**: allow HTTP/SSH only from ALB
- **RDS SG**: allow PostgreSQL access only from EC2

### S3 Logging with Lifecycle Policies
- Create an S3 bucket for application logs
- Configure lifecycle policies: archive logs to Glacier after 30 days, delete after 1 year

### IAM Roles and Policies
- Assign IAM roles to EC2 instances and Lambda functions (if used) with least privilege access to S3, CloudWatch, and SSM Parameter Store

### CloudFront
- Deploy a CloudFront distribution in front of ALB or S3

### Route 53 DNS
- Use Route 53 to configure DNS routing to CloudFront or ALB with a custom domain

### SSM Parameter Store
- Use AWS Systems Manager Parameter Store for managing application environment variables securely

### Tagging and Cost Monitoring
- All resources must be tagged per organizational policy, e.g., Environment: Production, Owner: DevOps
- Use CloudWatch Alarms to monitor cost thresholds and trigger alerts

## Output Expectations
- Provide a CDKTF project with properly structured code and reusable constructs or stacks
- Include all necessary cdktf.json, main.ts or main.py, and helper modules/files
- Code must be idempotent, pass cdktf synth, cdktf deploy, and include clear comments
- Demonstrate that the infrastructure fulfills all security, scalability, and cost-efficiency constraints