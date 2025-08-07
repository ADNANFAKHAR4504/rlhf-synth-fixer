# Prompt: Optimize Python CDKTF for AWS Production Deployment

## Context
You are a senior cloud engineer tasked with refactoring and optimizing an existing **Terraform infrastructure written in Python CDKTF**. This infrastructure is intended for a **high-profile production deployment** hosted on **AWS**, with a focus on **efficiency**, **security**, and **scalability**.

The infrastructure must follow modern DevOps practices, ensure fault tolerance, enable secure application deployment, and support zero-downtime upgrades.

## Objective
Write a **single Python file** using **CDK for Terraform (CDKTF)** that defines the entire infrastructure stack while satisfying the following constraints and production-grade requirements:

---

## Requirements

### ✅ General
- All infrastructure must be deployed **exclusively** in the `us-east-1` AWS region.
- Use **Terraform Cloud** for:
  - Remote state management
  - Team collaboration and automation

### ☁️ Compute
- Deploy application services using **AWS Fargate** to ensure a **serverless** architecture.
- Implement **zero-downtime deployments** for services hosted in Fargate.

### 🔒 Security
- Manage **all secrets** using **AWS Secrets Manager** (no plaintext secrets in code).
- Use **IAM roles and policies** to apply the **principle of least privilege** for all resource access.
- **Encrypt all EBS volumes** attached to EC2 resources (if any).

### 🛠️ Networking
- Design a **VPC** with:
  - At least **two public subnets** for load balancers or NAT gateways
  - At least **two private subnets** for application and database services
- Configure proper **routing and NAT** to isolate and secure private resources

### 🧠 Monitoring and Backups
- Use **Amazon CloudWatch** to monitor:
  - Fargate services
  - RDS database metrics
- Provision **RDS** with:
  - **Automated backups** enabled
  - Multi-AZ for high availability

### 🏷️ Tagging and Modularity
- Ensure **every AWS resource** is tagged with:  
  `Environment: Production`
- Use **Terraform modules** (even within the Python file) to encapsulate reusable infrastructure components.

---

## Constraints
- **Single Python file only** (no multiple file/module split).
- Use only **Terraform CDK (CDKTF)** in Python.
- Solution must run **without errors** using `cdktf deploy`.
- Code must be **modular**, **clean**, and **reusable** within a single file.

---

## Deliverable
A production-ready **Python CDKTF script** that:
- Deploys all resources per the above constraints
- Adheres to best practices for AWS architecture
- Demonstrates:
  - Secure secret handling
  - Efficient, scalable infrastructure
  - Zero-downtime deployment
  - Monitoring and backup compliance
  - Proper tagging and modular design

---

## Project Info
- **Difficulty Level:** Expert
