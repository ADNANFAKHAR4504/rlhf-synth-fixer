# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cloudformation with yaml**
> 
> Platform: **cloudformation**  
> Language: **yaml**  
> Region: **ap-southeast-1**

---

## Background
MediTech Solutions is launching a new patient records management system that must comply with HIPAA regulations. The system needs to process sensitive healthcare data, maintain encryption at rest and in transit, and provide comprehensive audit trails for compliance.

## Problem Statement
Design and implement a HIPAA-compliant healthcare data processing infrastructure using CloudFormation that processes sensitive patient records through a secure, containerized application architecture with encrypted data storage and audit logging capabilities.

## Constraints and Requirements
- All data must be encrypted at rest using KMS keys with automatic rotation
- Network architecture must implement strict segmentation with no direct public access to databases or containers

## Environment Setup
```
setup_requirements:
  Create a multi-tier architecture with:
components:
  [ECS Fargate cluster for containerized applications with automatic scaling
RDS Aurora cluster with encryption and automated backups
EFS for shared storage with encryption at rest
ElastiCache Redis cluster for session management
API Gateway with WAF integration
Secrets Manager for credential management
NAT Gateway for private subnet communication]
```

---

## Implementation Guidelines

### Platform Requirements
- Use cloudformation as the IaC framework
- All code must be written in yaml
- Follow cloudformation best practices for resource organization
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
