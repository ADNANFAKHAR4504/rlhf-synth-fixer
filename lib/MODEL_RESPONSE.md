# MODEL_RESPONSE.md

This document describes the model's response to provisioning a high-availability web application infrastructure on AWS using CloudFormation. The model provisions all required components including ALB, Auto Scaling Group, RDS (Multi-AZ), S3 buckets, and Route 53, adhering to security and scalability best practices.

---

## ✅ Infrastructure Components Created

### 1. **Networking**
- **VPC** with CIDR `10.0.0.0/16` and DNS support enabled.
- **2 Public Subnets** for ALB and EC2 in different AZs.
- **2 Private Subnets** for RDS in different AZs.
- **Internet Gateway** and attachment to the VPC.
- **Route Table** and associations for public subnets.

### 2. **Security Groups**
- **ALBSecurityGroup**: Allows inbound HTTPS (443) from internet.
- **ASGSecurityGroup**: Allows HTTP (80) from ALB SG.
- **RDSSecurityGroup**: Allows MySQL (3306) from ASG SG.

### 3. **Load Balancing**
- **Application Load Balancer**:
  - Internet-facing
  - Access logs enabled to S3 (`tapstack-pr222-alb-logs`)
- **HTTPS Listener**:
  - Uses certificate from ACM (parameterized)
  - Forwards to target group

### 4. **Compute Layer**
- **LaunchTemplate** for EC2 instances:
  - Amazon Linux AMI
  - Installs and starts Apache
  - Echoes health page
- **AutoScalingGroup**:
  - Min 2, Max 4 instances
  - Spreads across 2 AZs
  - Connected to ALB Target Group

### 5. **Database Layer**
- **RDS (MySQL)**:
  - Multi-AZ deployment
  - Username/password from Secrets Manager
  - Located in private subnets

### 6. **S3 Buckets**
- **ALBLogsBucket**:
  - Bucket policy allows ELB log delivery
- **StaticAssetsBucket**:
  - Configured for static website hosting
  - Blocked public ACLs & policies

### 7. **Route 53 DNS**
- A record alias for ALB DNS
- Domain name passed via parameter

---

## 🛡️ Security & Best Practices

- Uses **parameterized** values for certificate ARN, domain, and hosted zone.
- IAM role for EC2 instance only allows `s3:GetObject` on specific bucket.
- Access logs for ALB are securely stored.
- Tagging all resources with `Environment: Production`.

---

## 📦 Output Variables

- `ALBDNSName`: DNS name of the ALB
- `StaticAssetsURL`: Public website link for static assets
- `Route53Record`: Full domain name mapped to ALB

---

## 📁 File & Template Source

- Source: `lib/TapStack.yml`
- Format: CloudFormation YAML
- Deployment method: CI/CD pipeline or manual using `aws cloudformation deploy`

---

## ✅ Summary

The model meets all requirements:
- High availability via Multi-AZ ASG and RDS
- Secure by design using VPC, SGs, and Secrets Manager
- Scalable and observable with ALB logs, ASG
- DNS-resolved HTTPS endpoint with ACM & Route 53