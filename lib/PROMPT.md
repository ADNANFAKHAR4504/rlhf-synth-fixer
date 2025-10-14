# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with python**
> 
> Platform: **pulumi**  
> Language: **python**  
> Region: **ap-southeast-1**

---

## Background
An educational technology company needs to deploy a student management system that handles sensitive student data. They require a robust CI/CD pipeline with proper staging environments and database management that complies with educational data protection standards.

## Problem Statement
Create a secure CI/CD infrastructure for an educational platform that processes student data, requiring compliance with data protection regulations. The system needs to handle student records deployment with proper staging and production environments.

## Constraints and Requirements
- All database credentials must be stored in AWS Secrets Manager and rotated every 30 days
- RDS instance must be in a private subnet with access only through NAT Gateway
- Pipeline must include separate staging and production environments with manual approval for production deployments

## Environment Setup
Using Pulumi with Python, implement a CI/CD infrastructure that includes: 1. CodePipeline for deployment orchestration 2. RDS instance for student data (MySQL) 3. ElastiCache for session management 4. SecretsManager for credential management The infrastructure should be deployed in ap-southeast-1 region with proper security considerations.

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in python
- Follow pulumi best practices for resource organization
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
Deploy all resources to: **ap-southeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
