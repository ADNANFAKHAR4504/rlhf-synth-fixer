I’m setting up a **secure, production-ready multi-tier web application environment** using **AWS CloudFormation (YAML)**, and I need your help creating a complete, validated template for it.

Here’s the plan:  
We’re deploying in the **ca-central-1 region**, following strict **security and compliance best practices**. The infrastructure should include a **VPC** with both **public and private subnets**, distributed across at least **two availability zones** for high availability. Public subnets will handle web-facing components, while private subnets will securely host backend services such as databases and internal systems.

The **network layer** must include an **Internet Gateway** for public traffic and a **NAT Gateway** for secure outbound access from private subnets. All **security groups** should follow the principle of least privilege — web servers allow only **HTTP (80)** and **HTTPS (443)** ingress, while **RDS MySQL databases** remain isolated in private subnets with **no direct internet access**. Additionally, include a **bastion host** in its own restricted subnet that allows **SSH access only from whitelisted IPs**.

For compute and storage, configure **EC2 instances** with **IAM roles and policies** that provide **least privilege access** to **S3 buckets**. All **EBS volumes** must be encrypted using **KMS-managed keys**, and the **RDS instance** should have **automated backups enabled** with a **minimum retention period of 7 days**.

To strengthen observability and auditing, **enable VPC Flow Logs** and store them in a secure **S3 bucket**, while **CloudWatch Alarms** should monitor EC2 and RDS health metrics. Store configuration data securely using **Systems Manager Parameter Store**, avoiding any hardcoded credentials.

Every resource must include **tags for Name, Environment, and Owner**, and the **CloudFormation stack should support rollback on failure**. The final output should be a **single file named `secure-infrastructure-stack.yaml`** that can be deployed directly through the AWS Console or CLI without modification.

In short, I need a **Security Configuration as Code** solution — a complete YAML CloudFormation template that defines a **highly secure, fault-tolerant VPC-based infrastructure** with compute, database, monitoring, and access controls all properly integrated and production-ready.
