# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with go**
> 
> Platform: **cdk**  
> Language: **go**  
> Region: **eu-south-1**

---

## Background
Infrastructure task for CDK

## Problem Statement
{ problem_id: cdkgo-med-001, problem_metadata: { platform: CDK, language: Go, difficulty: medium, subtask: Streaming Media Processing Pipeline, subject_labels: [aws, infrastructure, cloud, media, streaming] }, problem_statement: { problem: Create a CDK infrastructure solution for a streaming media processing pipeline that handles video content ingestion, processing, and delivery for a media company's OTT platform., back...

## Constraints and Requirements
- All resources must be deployed in eu-south-1 region
- Constraint 1
- Constraint 2

## Environment Setup
CDK environment setup required; Region: eu-south-1

---

## Implementation Guidelines

### Platform Requirements
- Use cdk as the IaC framework
- All code must be written in go
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
Deploy all resources to: **eu-south-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
