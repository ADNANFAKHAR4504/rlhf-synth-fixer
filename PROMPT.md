# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **us-east-1**

---

## Background
RetailTech Inc. needs to implement a scalable data pipeline for their growing e-commerce platform. The system needs to handle real-time inventory updates from multiple suppliers, maintain product catalog data in a relational database, and provide fast access to frequently queried products through caching.

## Problem Statement
Create a CDK infrastructure stack for an e-commerce platform's product catalog data pipeline that processes real-time inventory updates, caches frequently accessed product data, and maintains data compliance requirements.

## Constraints and Requirements
- All infrastructure must be deployed in us-east-1 region
- Data retention must comply with e-commerce regulations (minimum 3 years)
- System must handle at least 1000 product updates per minute

## Environment Setup
```
setup_requirements:
  [AWS CDK CLI installed
Python 3.8+
AWS account with appropriate permissions
CDK environment bootstrapped in us-east-1
pip install aws-cdk-lib constructs]; Region:
  us-east-1
```

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in python
- Follow cdk best practices for resource organization
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
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
