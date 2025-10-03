# AWS CloudFormation Deployment Task

## Task Overview

I need a production-ready CloudFormation template in JSON format that provisions a highly available web application infrastructure on AWS. The infrastructure should comply with strict security requirements and follow AWS Well-Architected Framework principles.

## Detailed Requirements

### 1. Virtual Private Cloud (VPC) Architecture

- I need a VPC with CIDR block 10.0.0.0/16
- Deploy across at least 2 availability zones
- Create 2 public subnets (10.0.1.0/24, 10.0.2.0/24) for NAT gateways and load balancer
- Create 2 private subnets (10.0.10.0/24, 10.0.11.0/24) for EC2 instances
- Create 2 database subnets (10.0.20.0/24, 10.0.21.0/24) for RDS instances
- Configure route tables appropriately for each subnet type

### 2. NAT Gateway Configuration

- Deploy NAT gateways in each public subnet for high availability
- Allocate Elastic IPs for NAT gateways
- Configure private subnet route tables to use respective NAT gateways
- Ensure outbound internet connectivity for private resources

### 3. EC2 Instance Configuration

- All EC2 instances MUST be launched in private subnets only
- NO public IP addresses assigned to EC2 instances
- Use Amazon Linux 2023 AMI (latest version)
- Instance type: t3.medium for production workload
- Configure user data script to install and start a web server
- Enable detailed monitoring
- Encrypt all EBS volumes using AWS managed KMS keys
- Root volume: 20 GB encrypted gp3
- Additional data volume: 100 GB encrypted gp3

### 4. Auto Scaling Requirements

- Create Launch Template with the EC2 configuration
- Configure Auto Scaling Group with:
  - Minimum instances: 2
  - Desired capacity: 4
  - Maximum instances: 10
- Scale based on CPU utilization (target 70%)
- Health check type: ELB
- Health check grace period: 300 seconds
- Enable instance refresh for deployments

### 5. Load Balancing

- Deploy Application Load Balancer (ALB) in public subnets
- Configure HTTP listener on port 80
- Configure HTTPS listener on port 443 (certificate ARN as parameter)
- Create target group for EC2 instances
- Health check path: /health
- Sticky sessions enabled with 1-day duration

### 6. Database Configuration (RDS)

- Deploy MySQL 8.0 RDS instance
- Multi-AZ deployment for high availability
- Instance class: db.t3.medium
- Allocated storage: 100 GB (encrypted)
- Storage auto-scaling enabled (max 500 GB)
- Automated backups: 7-day retention
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sunday 04:00-05:00 UTC
- DB subnet group using database subnets
- No public accessibility

### 7. Security Configuration

#### Key Pair

- Accept EC2 key pair name as parameter
- Apply to all EC2 instances for SSH access

#### Security Groups

a) ALB Security Group:

- Ingress: HTTP (80) and HTTPS (443) from 0.0.0.0/0
- Egress: All traffic to EC2 security group

b) EC2 Security Group:

- Ingress: HTTP (80) from ALB security group only
- Ingress: SSH (22) from bastion security group (if exists)
- Egress: HTTPS (443) to 0.0.0.0/0 (for updates)
- Egress: MySQL (3306) to RDS security group

c) RDS Security Group:

- Ingress: MySQL (3306) from EC2 security group only
- No egress rules needed

### 8. IAM Roles and Policies

- Create IAM role for EC2 instances with:
  - AmazonSSMManagedInstanceCore policy (for Systems Manager)
  - Custom policy for S3 read access to specific bucket
  - Custom policy for CloudWatch Logs write access
- Instance profile for EC2 instances
- No use of AWS root account credentials

### 9. Parameters Required

The template should accept the following parameters:

- EnvironmentName (dev/staging/prod)
- KeyPairName (existing EC2 key pair)
- CertificateArn (ACM certificate for HTTPS)
- DatabaseUsername (master username)
- DatabasePassword (master password - NoEcho)

### 10. Outputs Required

Export the following values for cross-stack references:

- VPC ID
- Public Subnet IDs (comma-delimited)
- Private Subnet IDs (comma-delimited)
- ALB DNS Name
- ALB Hosted Zone ID
- RDS Endpoint Address
- RDS Port
- Auto Scaling Group Name
- EC2 Security Group ID
- IAM Role ARN

### 11. Additional Constraints

- Use intrinsic functions for dynamic values
- Implement proper resource dependencies
- Add meaningful descriptions to all resources
- Use tags for cost tracking (Environment, Project, Owner)
- Ensure deletion protection on critical resources
- Template must be deployable in us-west-2 region

## Validation Criteria

The solution will be validated against:

1. Successful CloudFormation stack creation
2. All EC2 instances running in private subnets only
3. Successful ALB health checks
4. RDS Multi-AZ verified
5. Encrypted volumes confirmed
6. Security group rules properly restricted
7. Auto Scaling functioning correctly
8. No public IP addresses on EC2 instances
9. All required outputs exported
10. Zero security vulnerabilities

Please provide a complete, production-ready CloudFormation JSON template that implements all requirements above. The template should follow AWS best practices and be deployable without errors.
