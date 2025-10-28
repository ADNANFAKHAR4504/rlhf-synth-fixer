# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **sa-east-1**

---

## Background
MedTech Brazil, a leading healthcare provider, needs to process thousands of medical imaging scans daily across multiple hospitals in São Paulo. They require a secure, scalable infrastructure that complies with HIPAA regulations and Brazilian healthcare data protection laws.

## Problem Statement
Design and implement a HIPAA-compliant medical imaging processing pipeline using AWS CDK in Python. The system should handle large medical imaging files (DICOM format), process them through a secure pipeline, and store the processed results while maintaining strict compliance requirements.

## Constraints and Requirements
- All data must be encrypted at rest and in transit using KMS keys with automatic rotation
- System must be deployed in sa-east-1 region with multi-AZ configuration for high availability

## Environment Setup
Using AWS CDK with Python, implement a solution that includes: 1. Secure data ingestion using API Gateway with mutual TLS 2. RDS cluster for metadata storage (Aurora PostgreSQL) 3. EFS for temporary DICOM file storage 4. ECS Fargate cluster for image processing 5. ElastiCache Redis cluster for processing queue management 6. Kinesis Data Streams for real-time processing events 7. SecretsManager for managing database and service credentials; Region: eu-south-1

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
Deploy all resources to: **sa-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
