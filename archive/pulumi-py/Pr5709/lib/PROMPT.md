# Cloud Environment Setup

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Python**
>
> Platform: **Pulumi**
> Language: **Python**
> Region: **us-east-1** (payment processing) and **us-west-2** (analytics)
>
> **IMPORTANT NOTE**: The original problem statement mentions "Terraform", but this task MUST be implemented using **Pulumi with Python**. Translate all Terraform requirements to their Pulumi equivalents.

---

## Background

A financial services company needs to establish secure network connectivity between their payment processing VPC and their analytics VPC in different AWS regions. The payment processing environment contains sensitive PCI-compliant systems that must remain isolated while allowing specific data flows to the analytics environment for fraud detection and reporting.

## Problem Statement

Create a **Pulumi program in Python** to establish VPC peering between two existing VPCs in different AWS regions. The configuration must:

1. Create a VPC peering connection between the payment VPC (vpc-pay123) in us-east-1 and analytics VPC (vpc-analytics456) in us-west-2
2. Configure the peering connection to enable DNS resolution in both directions
3. Add routes in the payment VPC's private subnet route tables to reach the analytics VPC CIDR block through the peering connection
4. Add routes in the analytics VPC's private subnet route tables to reach the payment VPC CIDR block through the peering connection
5. Create security group rules allowing HTTPS traffic from payment VPC application servers (10.0.1.0/24) to analytics VPC API endpoints (10.1.2.0/24)
6. Create security group rules allowing return traffic from analytics VPC to payment VPC on established connections
7. Use data sources (e.g., `pulumi_aws.ec2.get_vpc()`) to reference existing VPCs and route tables rather than hardcoding resource IDs
8. Implement proper Pulumi stack outputs to display the peering connection ID and status
9. Use AWS provider aliases to handle multi-region resource creation (configure separate providers for us-east-1 and us-west-2)
10. Ensure all resources are properly tagged according to company standards

**Expected output**: A complete Pulumi program in Python that creates a functional VPC peering connection with proper routing and security group rules, allowing HTTPS communication between specific subnets while maintaining network isolation for all other traffic.

## Environment Setup

Multi-region AWS deployment spanning:
- **us-east-1** (payment processing): Payment VPC uses CIDR 10.0.0.0/16 with private subnets across 3 AZs
- **us-west-2** (analytics): Analytics VPC uses CIDR 10.1.0.0/16 with private subnets across 2 AZs

Both VPCs have NAT gateways for outbound internet access. Requires:
- Pulumi CLI (latest version)
- Python 3.8+
- AWS CLI configured with appropriate cross-region permissions
- No transit gateway or VPN connections exist

## Constraints and Requirements

1. VPC peering connections must use DNS resolution for cross-region communication
2. Security groups must explicitly allow only HTTPS traffic on port 443 between specific subnets
3. Route tables must be updated programmatically without manual intervention
4. All resources must be tagged with Environment, Owner, and CostCenter tags
5. The configuration must support destroying and recreating the peering connection without affecting existing resources
6. Network ACLs must remain at default settings and not be modified

---

## Implementation Guidelines

### Platform Requirements
- Use **Pulumi** as the IaC framework
- All code must be written in **Python**
- Follow Pulumi best practices for resource organization
- Use Pulumi stack configuration for environment-specific values
- Ensure all resources use the `environment_suffix` variable for naming

### Multi-Region Configuration
- Configure separate AWS providers for us-east-1 and us-west-2
- Use provider aliases in Pulumi (e.g., `opts=ResourceOptions(provider=east_provider)`)
- Ensure VPC peering accepter and requester are in correct regions

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources with Environment, Owner, and CostCenter tags

### Testing
- Write unit tests with good coverage using pytest
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from Pulumi stack exports
- Test cross-region connectivity after deployment

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Use Pulumi resource names with `environment_suffix` to support multiple PR environments
- Avoid using `protect=True` unless absolutely necessary

## Success Criteria
- Pulumi stack deploys successfully in both regions
- VPC peering connection is active and DNS resolution works
- HTTPS traffic flows successfully from payment VPC (10.0.1.0/24) to analytics VPC (10.1.2.0/24)
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged
- Infrastructure can be cleanly destroyed with `pulumi destroy`
