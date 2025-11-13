# AWS CloudFormation

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **ap-southeast-1**

---

## Background
This task involves setting up a complete CI/CD pipeline infrastructure for containerized Node.js applications using AWS services.

## Problem Statement
Create a CloudFormation template to deploy an automated CI/CD pipeline for containerized Node.js applications.

## Constraints and Requirements
- Must use Pulumi with Python
- Implement security best practices
- Enable logging and monitoring
- Use environment suffix for resource naming
- Deploy to ap-southeast-1

## Environment Setup
AWS environment with permissions for CodePipeline, CodeBuild, CodeDeploy, ECR, ECS, and related services

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in py
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
