# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with typescript**
> 
> Platform: **cdktf**
> Language: **typescript**
> Region: **eu-west-1**

---

## Background
An educational technology company needs to build a secure data pipeline for processing student assessment data. The system needs to collect assessment results from various schools, process them for analytics, and store them securely while maintaining strict privacy controls.

## Problem Statement
Create a CDKTF infrastructure solution for a student assessment processing system that collects, processes, and stores educational assessment data while maintaining FERPA compliance.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using AWS managed keys
- Database credentials must be rotated automatically every 30 days
- System must maintain audit logs for all data access patterns

## Environment Setup
```json
{'required_tools': {'cdktf': '>=0.15.0', 'node': '>=14.0.0', 'typescript': '>=4.0.0'}, 'aws_services': {'primary': ['ECS Fargate', 'RDS Aurora', 'ElastiCache Redis', 'SecretsManager'], 'region': 'eu-west-1'}}
```

---

## Implementation Guidelines

### Platform Requirements
- Use cdktf as the IaC framework
- All code must be written in typescript
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
Deploy all resources to: **eu-west-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
