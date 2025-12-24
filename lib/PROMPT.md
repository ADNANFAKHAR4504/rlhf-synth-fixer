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

## System Integration Flow

Applications in each environment authenticate using environment-specific IAM roles to access their designated S3 bucket for configuration retrieval, store transaction data in their environment-specific DynamoDB table, send operational logs to CloudWatch log groups, and securely retrieve sensitive parameters from SSM Parameter Store using KMS encryption for secure configuration management.

## Requirements

### 1. Parameterized S3 and DynamoDB Configurations

- Deploy **S3 buckets** that serve environment-specific data to applications, with each environment connecting to its designated bucket through IAM role-based authentication.
- Create **DynamoDB tables** that receive application data through environment-specific IAM role authentication, with applications writing transaction data directly to their environment's table.
- Use CloudFormation **Parameters** to configure environment-specific resource names and connection settings.

### 2. Environment-Specific IAM Roles & Policies

- Define **IAM roles** that applications assume to authenticate API calls to AWS services, with policies granting access to S3 GetObject operations on environment-specific buckets and DynamoDB PutItem/GetItem operations on environment-specific tables.
- Configure **least privilege policies** that enforce environment isolation, preventing dev applications from accessing production resources by restricting S3 and DynamoDB permissions to environment-tagged resources only.

### 3. Centralized AWS S3 Storage for Shared Configurations

- Create an **additional centralized S3 bucket** that provides shared configuration files accessible by applications across all environments.
- Configure IAM policies that grant all environment IAM roles read access to this shared bucket, enabling applications from dev, testing, and production to retrieve common configuration data during initialization.

### 4. Environment-Specific AWS CloudWatch Logging

- Create **CloudWatch log groups** that receive application logs from services running in each environment, with applications sending structured log events through the AWS SDK.
- Configure environment-specific **retention policies** with development logs kept for 7 days and production logs retained for 30 days.
- Applications stream logs directly to CloudWatch using IAM role permissions, capturing operational metrics, error traces, and performance data in real-time.

### 5. Secure Configuration Storage with AWS Systems Manager Parameter Store

- Store **sensitive configuration values** like database credentials and API keys in **SSM Parameter Store** with KMS encryption.
- Applications retrieve parameters at startup using SSM GetParameter API calls authenticated through their IAM role, with KMS automatically decrypting values before delivery to the application.
- Each environment maintains isolated parameter paths under /webapp/{environment}/ to ensure development applications cannot access production secrets.

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
