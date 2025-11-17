# EKS

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with yaml**
> 
> Platform: **cfn**  
> Language: **yaml**  
> Region: **ap-southeast-1**

---

## Background
Infrastructure as Code implementation task

## Problem Statement
Create a CloudFormation template to deploy an EKS cluster for microservices hosting.

## Constraints and Requirements
- Follow AWS security best practices

## Environment Setup
- AWS credentials with appropriate permissions
- cfn CLI tools installed
- yaml runtime/SDK configured

---

## Implementation Guidelines

### Platform Requirements
- Use cfn as the IaC framework
- All code must be written in yaml
- Follow cfn best practices for resource organization
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
