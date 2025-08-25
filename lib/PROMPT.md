Create a TypeScript CDKTF project to deploy a highly available, scalable web application on AWS in **us-east-1**.

## Infrastructure Overview

### 1. VPC & Networking
- **VPC:** 10.0.0.0/16
- **Public subnets:** 10.0.1.0/24, 10.0.2.0/24 (AZs: us-east-1a/b)
- **Private subnets:** 10.0.10.0/24, 10.0.20.0/24 (AZs: us-east-1a/b)
- **Internet Gateway** for public subnets
- **NAT Gateways** for private subnets
- Proper route tables and associations

### 2. Static Assets
- **S3 bucket** for static website hosting
- **CloudFront distribution** with Origin Access Control
- Custom error pages (403/404 → index.html)
- Secure bucket policies for CloudFront

### 3. Scalability & High Availability
- **Auto Scaling Group:** min: 1, desired: 2, max: 3
- **Application Load Balancer** across AZs
- **Launch Template:** Amazon Linux 2, t3.micro, Apache setup
- Health checks for ALB and ASG
- EC2 instances in private subnets, redundant NAT Gateways

### 4. Security
- **IAM roles** for EC2 with managed policies (SSM, CloudWatch)
- **Security Groups:**
  - ALB: HTTP/HTTPS from internet
  - EC2: HTTP from ALB only
- IAM instance profiles, no hardcoded credentials

### 5. State Management
- **S3 backend:** `iac-rlhf-tf-states` with encryption and state locking

### 6. Project Structure
- `lib/tap-stack.ts`: main stack, provider config, backend setup, module instantiations, outputs
- `lib/modules.ts`: reusable modules (VPC, S3/CloudFront, IAM, AutoScaling with Launch Template, ALB, ASG)

### 7. Implementation Notes
- Support environment suffix (default: `dev`) for naming
- Tag all resources
- Add timestamp to S3 bucket for uniqueness
- Configure DNS, routing, and egress rules
- Expose Terraform outputs for all resources (VPC, subnets, S3, CloudFront, IAM, ALB, ASG)

## Outcome
A fully functional CDKTF template deployable via `cdktf deploy` for a production-ready, highly available AWS web application.
