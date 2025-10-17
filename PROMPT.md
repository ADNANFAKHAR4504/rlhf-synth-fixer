# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with json**
> 
> Platform: **pulumi**  
> Language: **json**  
> Region: **ap-southeast-1**

---

## Background
Infrastructure task for Pulumi

## Problem Statement
{ problem_id: pulumi-iot-monitoring-h001, problem_metadata: { platform: Pulumi, language: Python, difficulty: hard, subtask: Industrial IoT Monitoring System with Real-time Analytics, subject_labels: [aws, infrastructure, iot, monitoring, manufacturing] }, problem_statement: { problem: Design and implement a high-throughput industrial IoT monitoring system for a manufacturing plant in Brazil using Pulumi Python. The system mu...

## Constraints and Requirements
- Constraint 1
- Constraint 2
- Constraint 3

## Environment Setup
Pulumi environment setup required

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in json
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
