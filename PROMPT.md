# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with python**
>
> Platform: **cdktf**
> Language: **python**
> Region: **sa-east-1**

---

## Background
EduTech Brasil, a growing educational technology provider, needs to deploy their custom LMS platform to support 10,000 concurrent students. The system requires session management and caching to handle high traffic loads during peak exam periods.

## Problem Statement
Create a CDKTF configuration to deploy a containerized learning management system (LMS) with high availability and performance requirements for a growing educational institution in South America.

## Constraints and Requirements
- All resources must be tagged with environment='production' and project='edutechbr-lms'
- ElastiCache must be configured with encryption at rest and in-transit

## Environment Setup
The infrastructure needs to be deployed in sa-east-1 (São Paulo) region with the following core components: - ECS Fargate cluster for the LMS application - ElastiCache Redis cluster for session management - EFS volume for shared content storage - Secrets Manager for database credentials

---

## Implementation Guidelines

### Platform Requirements
- Use cdktf as the IaC framework
- All code must be written in python
- Follow cdktf best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **sa-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
