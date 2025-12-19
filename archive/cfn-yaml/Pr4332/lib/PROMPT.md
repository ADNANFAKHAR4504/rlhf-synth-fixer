You are an AWS Cloud Architect. I want you to create a complete CloudFormation YAML template named TapStack.yml that provisions a brand-new, production-ready infrastructure for a secure and highly available web application.  

Follow these conditions carefully:

1. The template must be **self-contained** — it should create all resources from scratch instead of referencing existing ones.  
2. Include all **Parameters, Mappings, Conditions, Resources, and Outputs** clearly.  
3. Use **AWS best practices** for networking, security, and IAM policies.  
4. Exclude any SSL certificate or ACM configuration.  

Here’s what the TapStack.yml must build step by step:

- **IAM Configuration**
  - Create IAM roles and instance profiles with least-privilege policies for EC2, S3, and RDS.
  - Add a policy denying IAM users from modifying their own permissions.
  - Enforce MFA for IAM user sign-in.

- **VPC and Networking**
  - Create a new VPC with public and private subnets across two Availability Zones.
  - Add Internet Gateway, NAT Gateway (one per AZ), and proper route tables.
  - Enable VPC Flow Logs.

- **Security Groups**
  - Allow SSH (port 22), HTTP (80), and HTTPS (443) only from specific CIDR ranges.
  - Keep RDS accessible only from private subnets and EC2 instances within the VPC.

- **EC2 Instances**
  - Launch EC2 instances in private subnets through an Auto Scaling Group with an Application Load Balancer in front.
  - Use Systems Manager (SSM) Agent for automation and patching.
  - Associate EC2 instances with IAM instance profiles for temporary credentials.

- **RDS Database**
  - Create a Multi-AZ RDS instance (MySQL or PostgreSQL) in private subnets.
  - Enable encryption at rest, automatic backups, and CloudWatch monitoring.
  - Store database credentials securely in **Parameter Store**.

- **S3 Buckets**
  - One S3 bucket for application assets (private by default).
  - One S3 bucket dedicated for **CloudTrail logs** (with access logging, versioning, and encryption).

- **Load Balancer**
  - Deploy an **Application Load Balancer (ALB)** in public subnets.
  - Configure listener on port 80 routing traffic to EC2 instances.

- **Monitoring & Logging**
  - Enable **CloudWatch Alarms** to monitor RDS CPU utilization >80% for 5 minutes.
  - Configure **CloudTrail** with the S3 log bucket.
  - Include basic EC2 and RDS CloudWatch metrics and log retention.

- **Automation & Management**
  - Use **AWS Systems Manager** for patch management and EC2 automation.
  - Add CloudFormation Outputs for key resources (VPC ID, ALB DNS, RDS Endpoint, S3 Bucket names, etc.).

- **Global Distribution**
  - Add a **CloudFront Distribution** to deliver static content from the S3 bucket globally.

All resources should be properly tagged (e.g., Project, Environment, Owner).  
Ensure encryption (SSE-KMS or AES256) for all data at rest and use secure policies throughout.  
Write the full YAML with logical names, dependencies, intrinsic functions, and best-practice descriptions.

Do not include any ACM/SSL certificate configuration — everything else should be present.
