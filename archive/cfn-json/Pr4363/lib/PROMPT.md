# Application Deployment

CRITICAL REQUIREMENT: This task MUST be implemented using cloudformation with json

Platform: cloudformation  
Language: json  
Region: ap-southeast-1

---

## Background
Infrastructure task for CloudFormation

## Problem Statement
We need to create a complete application deployment infrastructure using CloudFormation that supports a web application with CI/CD capabilities. The infrastructure should handle application deployment, auto-scaling, load balancing, and include proper security controls.

The solution must integrate multiple AWS services including VPC networking, EC2 compute, Application Load Balancer, Auto Scaling Groups, S3 storage, KMS encryption, IAM roles, CodeDeploy, CodeBuild, and CloudWatch monitoring.

## Constraints and Requirements
- All resources must use KMS encryption where applicable for data at rest
- Network traffic must use TLS/SSL for encryption in transit
- IAM roles must follow least privilege principles with explicit permissions
- All resources must be tagged and use the environmentSuffix parameter for unique naming
- Infrastructure must support clean teardown for CI/CD workflows
- CloudWatch logging must be enabled with appropriate retention periods
- The solution must work in the ap-southeast-1 region
- Do not hardcode any secrets or credentials in the template
- Public access to S3 buckets must be blocked
- EC2 instances must use IMDSv2 for metadata access
- Load balancer must have health checks configured
- Auto Scaling must have appropriate min/max/desired capacity settings

## Environment Setup
CloudFormation environment setup required

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
- Important: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: ap-southeast-1

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
