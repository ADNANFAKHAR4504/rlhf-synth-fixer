# AWS Scalable Web Application Infrastructure using CDKTF (Terraform)

## Project Overview

You are an expert in Terraform and AWS infrastructure design. You are tasked with building a highly available, secure, and scalable web application infrastructure on AWS using CDK for Terraform (CDKTF). All resources must be defined using Infrastructure as Code (IaC) principles, versioned in a Git repository, and adhere to AWS security best practices.

---

## Goals & Constraints

Your Terraform/CDKTF configuration **must** meet the following **strict requirements**:

### Networking

- Deploy all infrastructure within a **single AWS VPC**.
- The VPC must contain **both public and private subnets** across **at least two Availability Zones** for high availability.
- Use **NAT Gateways** for outbound internet access from private subnets.
- Enable **VPC Flow Logs** for security and audit tracking.

### Application Layer

- Deploy a **web application** within the **private subnets**.
- Use an **Auto Scaling Group (ASG)** to scale application instances dynamically based on **CPU utilization thresholds**.
- Application instances must be part of an **Elastic Load Balancer (ALB)** in public subnets to distribute traffic.
- Use **Launch Templates or Launch Configurations** to define EC2 configurations.

### Database Layer

- Provision a **PostgreSQL** database using **Amazon RDS**.
- RDS instance must reside in **private subnets**.
- Configure **Security Groups** to **restrict access** to the database **only to application EC2 instances**.

### Storage

- Create **Amazon S3 buckets** to store application logs.
- S3 buckets must:
  - Have **server-side encryption (SSE)** enabled.
  - Enable **lifecycle management policies** for cost-effective storage.
  - Block **public access** entirely.

### IAM & Security

- Use **IAM Roles and Policies** for EC2, S3, RDS, and CloudWatch access.
- Implement **least privilege** access principles.
- Store application **environment variables** in **AWS SSM Parameter Store** (with SecureString for sensitive data).
- Use **AWS WAF** (Web Application Firewall) with **custom rules** to protect the application layer.

### Content Delivery & DNS

- Use **CloudFront** as a Content Delivery Network (CDN) to cache and distribute application content.
- Configure **Amazon Route 53** to manage DNS and domain routing to the CloudFront distribution or ALB.

### Monitoring & Cost Control

- Set up **CloudWatch Alarms** to monitor:
  - EC2 CPU usage
  - RDS metrics
  - S3 usage metrics
- Include **budget alerts** to track AWS spending.
- Ensure **resource tagging** for cost allocation and organization (e.g., `Environment`, `Project`, `Owner`, `CostCenter`).

### Infrastructure as Code

- All infrastructure must be defined using **CDK for Terraform**.
- Primary entry file must be named: `main.tf` (generated from CDK output if necessary).
- All modules, constructs, and components should be modular and reusable.
- The entire project must be versioned using **Git**.

---

## Acceptance Criteria

- [ ] All infrastructure is provisioned via Terraform CDK (TypeScript preferred).
- [ ] CDKTF `synth` produces a valid `main.tf` Terraform configuration.
- [ ] All services work together to form a scalable, secure application environment.
- [ ] Configuration is modular and follows best practices.
- [ ] All resources are appropriately tagged and monitored.
- [ ] Project is Git version-controlled.
- [ ] Adheres to all constraints and cloud security/compliance standards.

---

## Tools & Technologies

- AWS CDK for Terraform (CDKTF)
- TypeScript (preferred)
- AWS EC2, VPC, ALB, RDS, S3, IAM, CloudFront, Route 53, WAF, SSM
- Terraform CLI
- Git for version control
- AWS CloudWatch for monitoring

---

Please ensure all services are properly interconnected, secure, and compliant. This setup will serve as the foundation for deploying production-ready applications on AWS.
