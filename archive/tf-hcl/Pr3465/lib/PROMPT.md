# Production Web Application Infrastructure

We need to build a secure, production-ready web application infrastructure in AWS using Terraform. The infrastructure should be deployed in us-east-1 and follow AWS security best practices including least privilege access, private database subnets, and minimal open ports.

## Project Requirements

Create a single Terraform file (tap_stack.tf) that implements all the infrastructure components below. All resources should be tagged with Environment = "Production".

## Infrastructure Components

### 1. Region and Tagging

All resources must be created in the us-east-1 region.

All resources must be tagged with Environment = "Production".

### 2. VPC and Networking

VPC CIDR must be 10.0.0.0/16.

Create a public subnet with CIDR 10.0.1.0/24 for the EC2 web server.

Create a private subnet with CIDR 10.0.2.0/24 for the RDS instance (primary).

Create an additional private subnet 10.0.3.0/24 in a second availability zone for Multi-AZ RDS requirements. Place the RDS DB subnet group across both private subnets.

### 3. EC2 Web Server

The web server EC2 instance needs an attached IAM role granting S3 read-only access. Use least privilege policies (s3:GetObject, s3:ListBucket only).

### 4. Application Load Balancer (ALB)

Configure an Application Load Balancer to distribute HTTPS traffic to the web server:

- Use HTTPS listener with an ACM certificate (accept certificate ARN as variable since certificate requires domain validation)
- Create a Target Group and register the EC2 instance
- Configure health checks on HTTP path / with appropriate intervals

### 5. RDS PostgreSQL Database

- Engine: PostgreSQL version 13.7 or similar recent version
- Place RDS in the private subnets using a DB subnet group across both private subnets (10.0.2.0/24 and 10.0.3.0/24)
- Enable Multi-AZ for high availability
- Database should only accept connections from the web server security group (port 5432)
- Database must not be publicly accessible

### 6. CloudWatch Monitoring

- Enable ALB access logging to an S3 bucket
- Add CloudWatch metric alarms for high CPU on web server and RDS
- Enable RDS enhanced monitoring
- Export RDS logs to CloudWatch

### 7. Security Requirements

- Database port (5432) should never be open to 0.0.0.0/0
- SSH access should be limited to a specific CIDR block (configurable via variable)
- Use IAM roles and policies following least privilege principle
- Apply Environment = "Production" tag to all resources using provider default_tags

## Configuration Variables

The following variables should be configurable:

- VPC CIDR (default: 10.0.0.0/16)
- Public subnet CIDR (default: 10.0.1.0/24)
- Private subnet CIDRs (defaults: 10.0.2.0/24 and 10.0.3.0/24)
- ACM certificate ARN (required - must be valid certificate in us-east-1)
- EC2 key pair name for SSH access
- EC2 instance AMI (should default to Amazon Linux 2 or similar secure image)
- EC2 instance type (default: t3.micro or t3.small)
- RDS username and password (password should be marked sensitive)
- RDS allocated storage
- Allowed CIDR block for SSH access (for security, should not have a default)

## Security Groups

Create three security groups:

1. **ALB Security Group**: Allow inbound HTTPS (443) from anywhere, optionally HTTP (80) for redirect
2. **Web Server Security Group**: Allow inbound traffic from ALB on ports 80 and 443, allow SSH only from the specified CIDR block
3. **Database Security Group**: Allow inbound PostgreSQL (5432) only from the web server security group

## RDS Configuration Details

- Set publicly_accessible = false
- Enable multi_az = true
- Configure backup retention and snapshot settings appropriately
- Enable enhanced monitoring with appropriate monitoring role
- Enable Performance Insights for query performance monitoring

## Outputs Required

The infrastructure should output:
- ALB DNS name
- Web server public IP address
- RDS endpoint address
- RDS endpoint port

## Implementation Notes

- Use a single Terraform file for all infrastructure
- Include inline comments for clarity
- Add comments indicating where users need to supply values (AMI, certificate ARN, key pair)
- Keep user-data scripts simple for the EC2 instance (basic nginx installation)
- Ensure all resource references are correct and consistent