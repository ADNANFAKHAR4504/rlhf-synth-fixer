# Prompt: CloudFormation Multi-Environment Infrastructure

## Role

You are an expert AWS CloudFormation template designer.

## Task

Design a **CloudFormation YAML template** that ensures **multi-environment consistency and replication** for a web application.  
The solution should support **three environments**:

- **development**
- **testing**
- **production**

The template must **deploy successfully** in AWS **us-east-1** region.

## Requirements

### 1. Parameterized S3 and DynamoDB Configurations

- Create **S3 buckets** for each environment with **unique environment identifiers** in the bucket name.
- Create **DynamoDB tables** for each environment with **environment-specific names**.
- Use CloudFormation **Parameters** to switch between environments.

### 2. Environment-Specific IAM Roles & Policies

- Define **IAM roles and policies** that restrict access **only** to resources belonging to their environment.
- Ensure services and users can **only access** their environment-specific S3 buckets and DynamoDB tables.

### 3. Centralized AWS S3 Storage for Shared Configurations

- Create an **additional centralized S3 bucket** for storing **shared configuration files**.
- Ensure application services in all environments can **read** from this bucket at runtime.

### 4. Environment-Specific AWS CloudWatch Logging

- Implement **CloudWatch log groups** for each environment.
- Configure **different retention policies** or log stream names per environment.
- Ensure logs capture **application performance** and **resource utilization**.

### 5. Secure Configuration Storage with AWS Systems Manager Parameter Store

- Store **sensitive and environment-specific configurations** in **SSM Parameter Store**.
- Ensure values are **encrypted** using **AWS KMS**.
- Parameters should be **retrievable by the application** at runtime.

---

## Constraints

- **Parameterize** environment configurations for development, testing, and production.
- **Restrict access** with IAM policies based on environment.
- Use **S3 for centralized configuration storage**.
- Implement **environment-specific CloudWatch logging**.
- Use **SSM Parameter Store** for secure parameter management.
- All deployments in **us-east-1** region.

---

## Expected Output

A **single CloudFormation YAML template** that:

- Meets all requirements above
- Is fully deployable across the three environments
- Ensures **environment isolation**
- Adheres to AWS **best practices** for security, naming, and structure
