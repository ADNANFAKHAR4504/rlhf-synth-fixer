# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with python**
> 
> Platform: **cdk**  
> Language: **python**  
> Region: **ap-northeast-1**

---

## Background
StreamTech Japan, a media streaming company, needs to process thousands of video files daily. They require a scalable infrastructure to handle video metadata extraction, storage, and quick access to popular content. The solution must comply with Japanese broadcasting regulations and maintain low latency for the AP region.

## Problem Statement
Create a CDK infrastructure for a video processing pipeline that handles incoming media files for a Japanese entertainment company. The system needs to process videos, store metadata in a database, and cache frequently accessed content.

## Constraints and Requirements
- All resources must be deployed in ap-northeast-1 region with multi-AZ configuration where applicable
- Database passwords and API keys must be managed through SecretsManager
- ElastiCache cluster must maintain at least 2 nodes for high availability

## Environment Setup
Using AWS CDK with Python, implement a solution that includes: 1. ECS Cluster for video processing tasks 2. RDS PostgreSQL for metadata storage 3. ElastiCache Redis cluster for caching popular content metadata 4. EFS for temporary video processing storage 5. API Gateway for metadata access

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
Deploy all resources to: **ap-northeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
