# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with TypeScript**
> 
> Platform: **cdktf**  
> Language: **ts**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup has grown rapidly and needs to migrate their development infrastructure from a single AWS account to a multi-account strategy. They currently have resources scattered across different regions and need to consolidate into a standardized environment structure while maintaining service availability.

## Problem Statement
Create a CDKTF TypeScript configuration to migrate existing infrastructure from a single AWS account into a multi-account architecture with separate environments. The configuration must:

1. Define reusable constructs for RDS instances, ECS services, and ALB configurations that accept environment-specific parameters
2. Implement remote state backend configuration with separate S3 buckets and DynamoDB tables per environment
3. Create IAM roles in each account that can be assumed from a central operations account for deployment
4. Set up VPC peering connections between environments to allow controlled cross-environment communication
5. Migrate existing RDS snapshots to new accounts while preserving data integrity and minimizing downtime
6. Configure ECS task definitions to pull container images from a shared ECR repository in the operations account
7. Implement a tagging strategy that automatically applies required tags to all resources based on environment variables
8. Create data sources to reference existing resources that will remain in the original account during transition

**Expected output**: A modular CDKTF configuration with separate stacks for each environment, shared construct library, and a migration plan document describing the order of resource creation and data migration steps.

## Environment Setup
Multi-account AWS setup spanning three environments (dev, staging, prod) in us-east-1 region. Each account has its own VPC with CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16). Resources include RDS PostgreSQL instances, ECS clusters running containerized services, S3 buckets for static assets, and Application Load Balancers. Requires CDKTF with TypeScript, Node.js 18+, AWS CLI configured with appropriate IAM permissions. State management uses S3 backend with DynamoDB for locking. Cross-account access managed via assumable IAM roles.

## Constraints and Requirements
- All resources must be tagged with Environment, Team, and CostCenter tags
- State files must be stored in separate S3 buckets per environment with versioning enabled
- Cross-account IAM roles must follow least privilege principles
- Resource naming must include environment prefix (dev-, staging-, prod-)
- All data transfer between accounts must use VPC peering or Transit Gateway
- CDKTF stacks must be used to manage environment separation
- Backend configuration must support state locking with DynamoDB
- Migration must be reversible with rollback procedures defined

---

## Implementation Guidelines

### Platform Requirements
- Use CDKTF as the IaC framework with TypeScript
- All code must be written in TypeScript
- Follow CDKTF best practices for construct organization and stack structure
- Ensure all resources use the `environmentSuffix` variable for naming to support multiple PR environments
- Use CDKTF constructs from the AWS provider library

### Multi-Account Architecture
- Create separate CDKTF stacks for dev, staging, and prod environments
- Each stack should target a different AWS account using assume role credentials
- Implement shared construct library for reusable components (RDS, ECS, ALB)
- Use CDKTF remote state with S3 backend configured per environment

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources with Environment, Team, and CostCenter

### Testing
- Write unit tests with good coverage for custom constructs
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid resources that cannot be destroyed unless absolutely required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Multi-account CDKTF configuration deploys successfully to dev, staging, and prod
- All security and compliance constraints are met
- VPC peering established between environments
- IAM roles allow cross-account access from operations account
- Migration plan document is comprehensive and actionable
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
