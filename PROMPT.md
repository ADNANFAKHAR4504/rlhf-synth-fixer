# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with python**
> 
> Platform: **cdktf**  
> Language: **python**  
> Region: **eu-west-1**

---

## Background
A European manufacturing company needs to modernize their factory monitoring system. They have hundreds of IoT sensors collecting temperature, pressure, and equipment status data. The data needs to be processed in real-time for anomaly detection and stored for compliance purposes.

## Problem Statement
Implement a CDKTF infrastructure for a manufacturing facility's real-time sensor data processing system. The system needs to collect data from IoT sensors, process it in real-time, and store it securely while maintaining compliance with manufacturing standards.

## Constraints and Requirements
- All infrastructure must be deployed in eu-west-1 region
- Database credentials must be rotated every 30 days using Secrets Manager

## Environment Setup
```
setup_requirements:
  [Python 3.7+
CDKTF CLI installed
AWS credentials configured
Pipenv or virtual environment]
required_components:
  [Kinesis Data Streams for real-time data ingestion
ECS Fargate for data processing
ElastiCache Redis for temporary storage
RDS PostgreSQL for permanent storage
Secrets Manager for database credentials]
```

---

## Implementation Guidelines

### Platform Requirements
- Use cdktf as the IaC framework
- All code must be written in python
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
