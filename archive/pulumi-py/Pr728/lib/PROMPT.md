# IaC Challenge: Secure AWS Infrastructure with Pulumi (Python)

## Background

You are an expert cloud infrastructure engineer working on a high-security project titled **"IaC - AWS Nova Model
Breaking"**. Your mission is to design and implement a secure AWS environment using Pulumi with Python. The focus is on
enforcing enterprise-grade security standards in an AWS multi-account architecture.

All configurations and deployments must adhere to best practices in cloud security and follow the constraints outlined
below.

## Environment Setup

You are working in the AWS `us-west-1` region. The infrastructure you build must reflect production-grade,
security-first principles. This includes correct use of encryption, role-based access control, and secure handling of
sensitive information.

## Requirements

The infrastructure must meet **all** of the following requirements:

1. **Region**: All resources must be deployed in `us-west-1`.
2. **Encryption**: Use AWS Key Management Service (KMS) to create and manage cryptographic keys for all data at rest.
3. **IAM Roles**: Implement IAM roles that apply the **least privilege** principle--grant only the minimal permissions
   necessary for each resource or user.
4. **Centralized Logging**:
    - Capture logs from all AWS services (e.g., CloudTrail, VPC Flow Logs, etc.).
    - Store logs in an S3 bucket.
    - Ensure the bucket has **encryption enabled by default**.
5. **Credential Management**:
    - Use environment variables to manage sensitive information.
    - Avoid hardcoding any secrets, API keys, or credentials directly in the source code.

## Objective

Write a complete Pulumi program in Python that:

- Fulfills all security and infrastructure requirements above.
- Ensures that deployed resources align with the **least privilege** and **data protection** principles.
- Utilizes Pulumi best practices for readability, maintainability, and modularity.

## Validation

Your implementation will be tested using automated integration and unit tests. The tests will check for:

- Correct configuration and policies of KMS keys.
- Proper assignment and scope of IAM roles.
- Verification that all service logs are stored with encryption enabled in the S3 bucket.
- Secure handling of environment variables.

## Constraints

- All resources **must** reside in the `us-west-1` region.
- Encryption for **all data at rest** must be managed by AWS KMS.
- IAM roles **must not** exceed the minimum required permissions.
- Logging must be **centralized** and **secure**.
- No hardcoded secrets; environment variables must be used for any sensitive data.

## Difficulty

**Expert**

This task is intended for engineers with advanced knowledge of AWS, Pulumi, and cloud security practices.
