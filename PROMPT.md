# Environment Migration

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with yaml**
>
> Platform: **cfn**
> Language: **yaml**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
Your company is consolidating AWS accounts and needs to migrate a production VPC from an old account to a new organizational account. The existing VPC hosts critical microservices that cannot tolerate downtime during migration.

## Problem Statement
Create a CloudFormation template to migrate a production VPC infrastructure from one AWS account to another. The configuration must:

1. Define a new VPC with CIDR block 10.1.0.0/16 that doesn't overlap with the existing VPC (10.0.0.0/16).
2. Create 3 public subnets (10.1.1.0/24, 10.1.2.0/24, 10.1.3.0/24) and 3 private subnets (10.1.11.0/24, 10.1.12.0/24, 10.1.13.0/24) across 3 availability zones.
3. Configure an Internet Gateway and attach it to the VPC.
4. Set up NAT Gateways in each public subnet for private subnet outbound connectivity.
5. Create route tables for public and private subnets with appropriate routes.
6. Establish VPC endpoints for S3 and DynamoDB services.
7. Configure security groups that mirror the existing environment's rules for web tier (ports 80, 443) and database tier (port 5432).
8. Set up Network ACLs that replicate the current environment's inbound and outbound rules.
9. Enable VPC Flow Logs to an S3 bucket for security compliance.
10. Output the VPC ID, subnet IDs, and security group IDs for use in subsequent migration steps.

Expected output: A complete CloudFormation YAML template that creates all networking components required for the VPC migration, with proper dependencies and parameterized values for flexibility across environments.

## Constraints and Requirements
- The new VPC must use non-overlapping CIDR ranges to allow temporary peering with the old VPC
- All security group rules from the old environment must be recreated with updated references
- Route tables must be configured to maintain connectivity during the migration window
- VPC endpoints for S3 and DynamoDB must be recreated in the new environment
- Network ACLs must be migrated with the same rule priorities and configurations

## Environment Setup
Production environment migration in us-east-1 region from legacy AWS account to new organizational account. Existing VPC (10.0.0.0/16) hosts microservices on EC2 instances across 3 availability zones with public and private subnets. New VPC requires 10.1.0.0/16 CIDR to enable VPC peering during transition. NAT Gateways in each AZ for outbound traffic. Application Load Balancer in public subnets. RDS Multi-AZ PostgreSQL in private subnets. Requires AWS CLI configured with appropriate cross-account IAM roles.

---

## Implementation Guidelines

### Platform Requirements
- Use cfn as the IaC framework
- All code must be written in yaml
- Follow CloudFormation best practices for resource organization
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
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
