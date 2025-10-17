# Application Deployment

CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with python

Platform: cdktf
Language: python  
Region: eu-central-1

## Background
A large manufacturing company operates multiple production lines with IoT sensors generating 10,000 events per second. They need a scalable infrastructure to ingest, process, and analyze this data in real-time while maintaining data integrity and compliance with industrial regulations. The system must support both real-time monitoring and historical analysis.

## Problem Statement
Design and implement a high-throughput IoT data processing infrastructure for a manufacturing company using CDKTF (Python). The system must handle real-time sensor data from industrial equipment, process it for anomaly detection, and store it securely while maintaining compliance with manufacturing industry standards.

## Constraints and Requirements
- All sensitive configuration values (database credentials, API keys) must be stored in AWS Secrets Manager with automatic rotation enabled
- The solution must implement end-to-end encryption for data in transit and at rest, meeting industrial compliance requirements

Environment Setup
setup_requirements:
  cdktf_version: >=0.15.0
  python_version: >=3.8
  aws_provider:
    region: eu-central-1
    required_version: >=4.0.0
  required_packages: [cdktf, cdktf-aws-provider]

Implementation Guidelines

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

Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from cfn-outputs/flat-outputs.json

Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Important: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

Target Region
Deploy all resources to: eu-central-1

Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
