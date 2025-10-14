# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **us-west-2**

---

## Background
A federal agency requires a monitoring solution for their data processing system that adheres to FedRAMP Moderate compliance requirements. The system processes sensitive but unclassified (SBU) data and needs comprehensive monitoring of database activities, container metrics, and API access patterns.

## Problem Statement
Create a FedRAMP-compliant monitoring infrastructure for a government agency's data processing pipeline using AWS CDK. The system should monitor ECS workloads and RDS databases while maintaining audit logs in accordance with FedRAMP Moderate requirements.

## Constraints and Requirements
- All resources must be deployed in us-west-2 and must implement FedRAMP Moderate controls
- Monitoring data must be retained for minimum 365 days with encryption at rest
- API Gateway must implement AWS WAF with FedRAMP-compliant rule sets

## Environment Setup
Implement an AWS CDK stack that includes: 1. RDS instance with enhanced monitoring enabled 2. ECS Fargate cluster with container monitoring 3. ElastiCache Redis cluster for temporary metric aggregation 4. API Gateway with request logging 5. SecretsManager for storing monitoring credentials 6. Kinesis Data Streams for log aggregation

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
Deploy all resources to: **us-west-2**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
