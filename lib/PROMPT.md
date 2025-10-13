# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with javascript**
> 
> Platform: **pulumi**  
> Language: **javascript**  
> Region: **ap-southeast-1**

---

## Background
Infrastructure task for Pulumi

## Problem Statement
{ problem_id: MED-HIPAA-DP-2024-001, problem_metadata: { platform: Pulumi, language: Go, difficulty: medium, subtask: Healthcare Data Processing Pipeline with RDS and Kinesis, subject_labels: [aws, healthcare, hipaa, data-pipeline, security] }, problem_statement: { problem: Create a HIPAA-compliant data pipeline for a healthcare provider that needs to process and store patient monitoring data. The system should ingest real-ti...

## Constraints and Requirements
- Constraint 1
- Constraint 2

## Environment Setup
Pulumi environment setup required

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in javascript
- Follow pulumi best practices for resource organization
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
Deploy all resources to: **ap-southeast-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
