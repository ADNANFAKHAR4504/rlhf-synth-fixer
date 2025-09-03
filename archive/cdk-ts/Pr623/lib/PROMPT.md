# AWS Secure Foundational Environment - CDK Design Prompt

## Mission Statement

Your mission is to act as an **expert AWS Solutions Architect** specializing in cloud security and compliance. You will design a secure and compliant AWS foundational environment based on the user's requirements.

## Instructions

### 1. Analyze the Requirements
Carefully review the provided task to understand each security control and infrastructure component.

### 2. Write the Architecture in CDK Format
Propose a robust AWS infrastructure that fulfills all stated requirements, adhering to best practices for:
- Security
- High availability 
- Operational excellence

### 3. Specify AWS Services
Clearly name each AWS service used for each component of the architecture.

### 4. Emphasize Security Best Practices
Ensure the design incorporates principles of:
- **Least privilege**
- **Defense in depth**
- **Encryption everywhere**

### 5. Output Format
**AWS CDK + TypeScript**

## Task Requirements

You are tasked with designing an **IaC solution** for provisioning a secure and compliant AWS environment using the **AWS CDK and TypeScript**. The design must adhere to stringent security and compliance standards for the **"IaC - AWS Nova Model Breaking"** project.

### Core Requirements

- **Region**: All resources must be provisioned in the `us-east-1` region
- **Objective**: Build a foundational AWS environment with secure network, robust access control, comprehensive encryption, and detailed monitoring
- **Expertise Level**: Expert-level task requiring best practices for managing a secure cloud environment through code

## Infrastructure Components Required

### 1. **Virtual Private Cloud (VPC)**
- Configured across **at least two Availability Zones** for high availability

### 2. **Identity and Access Management (IAM)**
- IAM Roles for access control
- Ensure **no hardcoded credentials** are used

### 3. **Encryption**
- Customer-managed **AWS KMS Key (CMK)** for encrypting data at rest across supported services

### 4. **Network Security**
- **Strict Security Groups** that restrict network traffic to only necessary ports and protocols

### 5. **Monitoring and Logging**
- Detailed logging and monitoring enabled via **AWS CloudWatch** for all critical resources

### 6. **Storage**
- **S3 Buckets** configured with server-side encryption (**SSE-KMS**) enabled by default

### 7. **Compute**
- **EC2 Instances** that utilize the latest **Amazon Linux 2023 AMI**
- Use: `ec2.MachineImage.latestAmazonLinux2023()`

### 8. **Resource Management**
- **Tagging Strategy** applied to all resources for effective cost tracking and resource management

## Solution Requirements

### Architecture Structure
- The entire solution should be encapsulated within a **single, deployable CDK Stack**
- Demonstrate best practices for creating **reusable and secure infrastructure**

### Compliance Standards
- Adhere to stringent **security and compliance standards**
- Follow AWS Well-Architected Framework principles

### Code Quality
- TypeScript implementation with proper type definitions
- Clean, maintainable, and well-documented code
- Proper error handling and validation

## Success Criteria

The delivered solution must demonstrate:

1. **Security Excellence**: Implementation of defense-in-depth security controls
2. **High Availability**: Multi-AZ deployment for fault tolerance 
3. **Compliance**: Adherence to security and compliance best practices
4. **Operational Excellence**: Comprehensive monitoring and logging
5. **Cost Optimization**: Effective tagging and resource management
6. **Reliability**: Robust infrastructure design patterns
7. **Performance**: Optimized resource configuration

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation
- Secure network architecture with proper segmentation
- Comprehensive IAM roles and policies with least privilege
- End-to-end encryption implementation
- Monitoring and alerting configuration
- Proper resource tagging and documentation