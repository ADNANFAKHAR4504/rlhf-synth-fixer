# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **terraform**
> Language: **HCL**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to establish secure communication between their production environment and a partner's AWS account for real-time payment processing. The partner has strict security requirements including encrypted transit, restricted access patterns, and comprehensive audit logging.

## Problem Statement
Create a Terraform configuration to establish a cross-region VPC peering connection between your production VPC and a partner's VPC. The configuration must:

1. Create a VPC peering connection with appropriate requester and accepter configurations.
2. Configure DNS resolution options for both VPCs to enable hostname resolution across the peering connection.
3. Update route tables in both VPCs to enable traffic flow only between specific application subnets.
4. Create security group rules that allow HTTPS (443) and custom API traffic (8443) between peered VPCs.
5. Set up VPC Flow Logs for both VPCs with S3 bucket storage and 1-minute aggregation intervals.
6. Implement IAM roles and policies for cross-account access with explicit deny for unauthorized actions.
7. Use Terraform data sources to dynamically fetch accepter VPC details and validate CIDR compatibility.
8. Configure monitoring alarms for peering connection state changes and traffic anomalies.
9. Create a locals block to manage CIDR calculations and tag mappings.
10. Output the peering connection ID, DNS resolution status, and configured route counts.

Expected output: A complete Terraform configuration with modules for VPC peering, security, monitoring, and IAM that establishes secure cross-region connectivity while maintaining strict access controls and comprehensive logging.

## Environment Setup
Multi-account AWS deployment spanning us-east-1 and us-east-2 regions. Production VPC (10.0.0.0/16) in us-east-1 needs to peer with partner VPC (172.16.0.0/16) in us-east-2. Both VPCs have existing 3-tier architecture with public, private, and database subnets across 3 availability zones. Requires Terraform 1.5+ with AWS provider 5.x. Each VPC has NAT gateways, Internet gateways, and existing EC2 instances running application services. S3 VPC endpoints already configured.

## Constraints and Requirements
- VPC peering connection must use DNS resolution for cross-account resource discovery
- Route tables must only allow traffic to specific CIDR blocks, not entire VPCs
- Security groups must restrict traffic to ports 443 and 8443 only
- All resources must be tagged with Environment, Project, and CostCenter tags
- Use data sources to reference the accepter VPC instead of hardcoding values
- Implement CloudWatch VPC Flow Logs for both VPCs with 1-minute capture intervals
- Create separate route tables for public and private subnets with appropriate peering routes
- Use locals blocks for repeated values and complex expressions
- All IAM roles must follow principle of least privilege with explicit deny statements
- Configure VPC peering options to prevent overlapping CIDR blocks from being accepted

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environment_suffix` variable for naming

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
- Resources are properly tagged and named with environment_suffix
- Infrastructure can be cleanly destroyed
