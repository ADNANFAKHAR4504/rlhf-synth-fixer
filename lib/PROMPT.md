## Mission Statement

Act as an **expert AWS DevOps Engineer** and develop a TypeScript script using AWS CDK to define a CloudFormation stack for a multi-component application. **All provided requirements and constraints must remain intact and unchanged.** Ensure a **string suffix is appended to resource names where needed** for uniqueness and compliance.

---

## Instructions

1. **Analyze the Requirements**
   - Carefully review all problem statements, environments, and constraints. Do **not** modify, omit, or alter any provided data.

2. **Write the Architecture in CloudFormation TypeScript Format**
   - Use AWS CDK in TypeScript to define all resources and configurations.

3. **Specify AWS Services**
   - Explicitly configure each AWS service required: Lambda, API Gateway, IAM, RDS (PostgreSQL), S3, VPC, CloudFront, Route 53, SQS, CloudWatch, Secrets Manager.

4. **Enforce Resource Naming, Security, & High Availability**
   - **Resource Naming:** All resources must follow the convention `'prod-service-role-stringSuffix'`, appending a string suffix for uniqueness.
   - **Security:** Use least privilege IAM roles for all services.
   - **High Availability:** Ensure Lambda, VPC, and RDS are distributed across multiple availability zones for HA.

5. **Output Format**
   - **CloudFormation + TypeScript (AWS CDK)**

---

## Task Requirements

Design and implement a deployable AWS CDK TypeScript stack in AWS account `123456789012` for a multi-region environment (`us-east-1` as primary, `us-west-2` as secondary).

### Core Components

1. **Lambda Function**
   - Node.js 14.x runtime
   - Managed by API Gateway (IAM authentication)
   - High availability across at least two AZs in us-east-1

2. **Amazon RDS (PostgreSQL)**
   - db.m4.large instance type minimum
   - Credentials stored in AWS Secrets Manager

3. **Amazon S3 Buckets**
   - For static file storage
   - Versioning enabled

4. **VPC**
   - Name: `prod-app-vpc`
   - CIDR: `10.0.0.0/16`
   - Two public and two private subnets

5. **Amazon CloudFront**
   - For global content delivery

6. **Amazon Route 53**
   - For DNS management

7. **IAM Roles**
   - Provision all infrastructure using least privilege

8. **Amazon SQS**
   - Standard queue for async processing

9. **AWS CloudWatch**
   - Logging and monitoring for all services

10. **Secrets Manager**
    - Store database credentials securely

11. **Resource Naming**
    - Prefix: `'prod-'` followed by service and role, e.g., `'prod-ec2-web'`
    - Append a string suffix for uniqueness

---

## Constraints

- Use TypeScript (AWS CDK) to manage CloudFormation stacks.
- Target the AWS **us-east-1** region for all primary resources.
- Ensure high availability for Lambda across two AZs.
- Secure API Gateway using IAM authentication.
- Use least privilege IAM roles for all resources.
- Use versioned S3 for static files.
- RDS instance must be at least db.m4.large.
- All resources must use string suffixes in names to prevent collisions.
- All configurations must remain as provided.

---

## Solution Requirements

- **Single, deployable TypeScript CDK application**
- All components, configuration, IAM, tags, security, outputs included
- Output must confirm creation/configuration of each resource

---

## Success Criteria

- **High Availability:** Multi-AZ for Lambda, VPC, RDS
- **Security:** Least privilege IAM, IAM-authenticated API Gateway, Secrets Manager usage
- **Compliance:** All requirements/constraints implemented exactly as specified
- **Resource Uniqueness:** All resource names include a string suffix
- **Operational Excellence:** Maintainable, well-documented TypeScript code
- **Deployment:** TypeScript file compiles, deploys, and outputs all critical resource identifiers

---

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation
- Resource definitions for Lambda, API Gateway, IAM, RDS, S3, VPC, CloudFront, Route 53, SQS, CloudWatch, Secrets Manager
- Resource naming with string suffix for uniqueness
- Outputs for key resource IDs, endpoints, and ARNs
- Documentation for deployment, outputs, and operational runbooks

---
