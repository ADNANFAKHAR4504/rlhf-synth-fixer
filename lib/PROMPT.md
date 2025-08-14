**Act as** an experienced AWS Cloud Infrastructure Engineer with deep expertise in secure, highly available, and compliant architecture design.

You are tasked with delivering a **production-grade CloudFormation template in YAML** that provisions a robust AWS environment in the **us-east-1** region. 

The goal is to meet strict security, resilience, and compliance requirements while following AWS best practices.

Your template must:

* Create a **VPC** with at least two public and two private subnets, each in different Availability Zones, configured with proper routing tables, NAT gateways for private subnet internet access, and an internet gateway for public subnets.

* Deploy **EC2 instances** in private subnets with KMS-encrypted EBS volumes, attached IAM instance profiles, and Security Groups restricting SSH to a defined IP whitelist.

* Deploy a **Multi-AZ RDS** (MySQL or PostgreSQL) instance with:
  * Automated backups retained for at least 7 days
  * KMS encryption
  * Logging enabled
  * A dedicated S3 bucket for backups, with server-side encryption, logging enabled, and a restrictive bucket policy

* Ensure **all S3 buckets** are encrypted and have logging enabled.

* Deploy an **Application Load Balancer** protected by **AWS WAF** for any public-facing services.

* Configure **Lambda functions** to use secure KMS-encrypted environment variables, following least privilege IAM role practices.

* Implement **CloudWatch alarms** for critical metrics (EC2 CPU usage, RDS storage capacity, Lambda errors) and integrate them with an SNS topic for notifications.

All resources must be parameterized for flexibility, and the final YAML must be **fully deployable without manual intervention**. 

The output should be **production-ready** and adhere to AWS security, availability, and compliance standards from day one.