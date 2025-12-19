# Application Deployment

CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with YAML

Platform: CloudFormation  
Language: YAML  
Region: eu-central-1

## Background

HealthTech Solutions is launching a new SaaS platform that handles sensitive patient data. They need a HIPAA-compliant infrastructure that ensures data encryption at rest and in transit, automated credential management, and comprehensive audit logging. The solution must be deployed in the EU region to maintain GDPR compliance.

## Problem Statement

Design and implement a CloudFormation template for a compliance-focused database infrastructure that supports a healthcare SaaS platform. The solution must include encrypted RDS instances, automated secret rotation, and secure storage for audit logs using EFS.

## Constraints and Requirements

- All database credentials must be managed through SecretsManager with automatic rotation enabled every 30 days
- RDS instances must be encrypted using KMS keys and deployed across multiple AZs
- All audit logs must be retained for a minimum of 7 years in encrypted EFS storage

## Environment Setup

```
setup_requirements:
  - AWS Account with access to eu-central-1 region
  - AWS CLI configured with appropriate permissions
  - Basic understanding of HIPAA and GDPR requirements
  - CloudFormation template development environment
```

## Implementation Guidelines

### Platform Requirements

- Use CloudFormation as the IaC framework
- All code must be written in YAML
- Follow CloudFormation best practices for resource organization
- Ensure all resources use the environmentSuffix variable for naming

### Security and Compliance

- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing

- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from cfn-outputs/flat-outputs.json

### Resource Management

- Infrastructure should be fully destroyable for CI/CD workflows
- Important: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region

Deploy all resources to: eu-central-1

## Success Criteria

- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
