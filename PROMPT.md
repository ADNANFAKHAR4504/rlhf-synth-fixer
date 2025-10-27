# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cloudformation with json**
> 
> Platform: **cloudformation**  
> Language: **json**  
> Region: **eu-south-2**

---

## Background
Infrastructure task for CloudFormation

## Problem Statement
{ problem_id: CFN-H-2024-DP301, problem_metadata: { platform: CloudFormation, language: Go, difficulty: hard, subtask: Streaming Media Processing Pipeline with Compliance, subject_labels: [aws, infrastructure, streaming, compliance, media-processing] }, problem_statement: { problem: Design and implement a high-performance media processing pipeline using CloudFormation for a Japanese streaming service that handles real-time co...

## Constraints and Requirements
- All resources must be deployed in eu-south-2 region
- Constraint 1
- Constraint 2
- Constraint 3

## Environment Setup
CloudFormation environment setup required; Region: eu-south-2

---

## Implementation Guidelines

### Platform Requirements
- Use cloudformation as the IaC framework
- All code must be written in json
- Follow cloudformation best practices for resource organization
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
Deploy all resources to: **eu-south-2**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
