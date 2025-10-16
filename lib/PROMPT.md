# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with python**
> 
> Platform: **pulumi**  
> Language: **python**  
> Region: **sa-east-1**

---

## Background
MedTech Solutions needs to deploy a containerized application that processes patient healthcare records. The system must maintain HIPAA compliance while providing efficient data processing capabilities. The application will receive patient data, process it, and store it in an encrypted database.

## Problem Statement
Create a secure container infrastructure for a healthcare data processing application that handles sensitive patient records. The solution must use ECS for container orchestration and include proper data encryption and storage components.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using AWS KMS keys
- Database backups must be retained for at least 30 days

## Environment Setup
```json
{'setup': ['AWS Account with appropriate permissions', 'Pulumi CLI installed', 'Python 3.8+', 'AWS credentials configured', 'Region: sa-east-1']}
```

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
Deploy all resources to: **sa-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
