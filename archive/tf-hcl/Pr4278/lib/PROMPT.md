# Multi-Account VPC Peering with Secure Access

## Overview

We need to build a production-ready Terraform solution that creates a secure VPC peering system connecting 10 VPCs across multiple AWS accounts. This infrastructure will enable controlled data sharing between different parts of a corporation while maintaining comprehensive monitoring, auditing, and security controls.

## What We're Building

### Network Architecture

We'll create 10 VPCs, each in its own network space with sequential CIDR blocks starting from 10.0.0.0/16 and incrementing up to 10.9.0.0/16. Each VPC needs to be properly segmented with:

- **Public subnets** in two availability zones (following the pattern x.0.1.0/24 and x.0.2.0/24)
- **Private subnets** in two availability zones (following the pattern x.0.10.0/24 and x.0.11.0/24)
- **DNS support** enabled for both DNS hostnames and DNS resolution

These VPCs will be distributed across multiple AWS accounts, so we'll need a flexible way to map each VPC to its respective account ID.

### Multi-Account Configuration

To work across multiple AWS accounts, we need to set up:

- **Primary AWS provider** for the main account
- **Aliased providers** for each peer account that will host VPCs
- **Cross-account authentication** using AWS assume role functionality
- **Configurable variables** including:
  - The primary account ID
  - A list of peer account IDs
  - The IAM role name for cross-account access (defaulting to "TerraformPeeringRole")

### VPC Peering Strategy

The peering connections between VPCs should be flexible and configurable. We'll support three different topology patterns:

1. **Full-mesh** - where every VPC peers with every other VPC
2. **Hub-and-spoke** - where VPC 0 acts as a central hub and all other VPCs peer with it
3. **Custom** - where you can define specific peering relationships

For cross-account peering, we need to handle both sides of the connection:
- Create the peering connection request in the requester account
- Accept the peering connection in the accepter account
- Auto-accept connections when both VPCs are in the same account

### Routing Configuration

Once peering connections are established, we need to automatically update the route tables in both VPCs so traffic can flow between them. This means adding routes that point each peered VPC's CIDR block to its peering connection. We need to handle routing for both public and private subnet route tables.

### Security Controls

Each VPC needs security groups configured to control traffic between peered VPCs:

- **HTTPS traffic (port 443)** should be allowed from all peered VPC CIDRs
- **Database traffic (port 3306)** should only be allowed from specific VPCs based on a configurable mapping
- **All other inbound traffic** should be implicitly denied
- **Outbound traffic** to peered VPCs should be allowed on required ports

### Cross-Account IAM Roles

We need to create IAM roles in each accepter account that grant the primary account permission to:
- Accept VPC peering connections
- Describe VPC peering connections
- Create and delete routes

These roles should have trust policies allowing the primary account to assume them. Since these roles need to exist before we can create peering connections, we'll create them as a separate Terraform module that gets applied first.

### VPC Flow Logs

Every VPC needs Flow Logs enabled to capture network traffic information. These logs should:
- Stream to CloudWatch Logs with a dedicated log group per VPC (named `/aws/vpc/flowlogs/{vpc_id}`)
- Have a configurable retention period (defaulting to 30 days)
- Use an IAM role with permissions to write to CloudWatch

### Centralized Logging Infrastructure

For long-term storage and compliance, we'll create:

- **S3 bucket** in the primary account for archiving logs
- **Lifecycle policies** that transition logs to Glacier after 90 days and delete them after 365 days
- **KMS encryption** using a customer-managed key
- **Bucket policy** allowing all peered accounts to write their logs
- **CloudWatch log subscription filters** that stream VPC Flow Logs to S3 via Kinesis Firehose

### CloudTrail Auditing

We need comprehensive API call logging through CloudTrail:

- Enable an organization-wide trail if using AWS Organizations, or individual trails per account
- Capture all VPC and peering-related API calls (creating/deleting peering connections, modifying security groups)
- Send logs to the centralized S3 bucket with KMS encryption
- Enable log file validation to detect tampering
- Enable multi-region logging to capture activity across all regions

### Real-Time Monitoring

Set up CloudWatch monitoring to detect security and operational issues:

**Metric filters** on VPC Flow Logs should detect:
- Rejected connection attempts
- Connections from IP addresses outside the peered network
- Unusually high volumes of connections to sensitive ports

**CloudWatch alarms** should trigger based on thresholds and publish alerts to an SNS topic.

### Event-Driven Alerting

Configure EventBridge rules in each account to catch important security events in real-time:

- VPC peering connections being deleted
- Security group rules being modified
- Unauthorized API calls being attempted

These events should be sent to a centralized SNS topic in the primary account using cross-account event bus functionality.

### Automated Compliance Validation

Deploy a Lambda function in the primary account that runs hourly to validate the infrastructure:

- **Runtime**: Python 3.12
- **Execution**: Triggered by EventBridge scheduled rule
- **Validation checks**:
  - All peering connections are in an active state
  - No security groups have overly permissive rules (0.0.0.0/0 on sensitive ports)
  - VPC Flow Logs are enabled and actively publishing
  - Route tables contain the correct peering routes

The function should assume cross-account roles to check resources in each account and publish findings to both SNS and CloudWatch custom metrics (under the namespace `Corp/VPCPeering/Compliance`).

### Resource Tagging

Apply consistent tags across all resources:
- `Environment` - the environment name
- `VPCIndex` - the VPC's index number
- `Owner` - the team or person responsible
- `ManagedBy` - set to "Terraform"
- `Project` - set to "VPCPeering"

### Outputs

The Terraform configuration should output:
- List of all VPC IDs
- List of all VPC CIDR blocks
- Map of peering connection IDs
- Security group IDs for each VPC
- CloudWatch log group names
- S3 bucket name for centralized logging
- CloudTrail ARN
- Lambda function ARN

## Implementation Files

Please provide the following files as separate code blocks:

1. **versions.tf** - Terraform version constraints (>= 1.5) and AWS provider version (>= 5.0)
2. **providers.tf** - Primary AWS provider plus aliased providers for each peer account using assume_role
3. **variables.tf** - All input variables including account mappings, peering topology, database access mappings, role names, regions, SNS topics, retention periods, etc.
4. **iam-roles/main.tf** - Separate module for cross-account IAM roles (must be applied first)
5. **vpcs.tf** - Create all 10 VPCs with their subnets, internet gateways, NAT gateways, and route tables
6. **peering.tf** - VPC peering connections and accepters based on the chosen topology
7. **routes.tf** - Route table updates for peering connections
8. **security-groups.tf** - Security groups for each VPC with dynamic rules
9. **flow-logs.tf** - VPC Flow Logs, CloudWatch log groups, IAM roles, and Kinesis Firehose to S3
10. **cloudtrail.tf** - S3 bucket, KMS key, and CloudTrail configuration
11. **monitoring.tf** - CloudWatch metric filters, alarms, and SNS topic with cross-account permissions
12. **eventbridge.tf** - EventBridge rules, cross-account event bus, and Lambda triggers
13. **lambda-compliance.tf** - Lambda function resource, IAM role, EventBridge schedule, and permissions
14. **lambda/compliance_check.py** - Python code for compliance validation
15. **outputs.tf** - All output values
16. **README.md** - Deployment instructions, variable descriptions, topology options, prerequisites, and troubleshooting guide

## Design Principles

- **Scalability**: Use dynamic blocks and `for_each` extensively so the configuration can easily scale
- **Flexibility**: Make it easy to add more VPCs by simply extending variables
- **State management**: Support Terraform workspaces or separate state files for different environments
- **Avoid circular dependencies**: Use data sources where needed (e.g., `data.aws_vpc` for peering)
- **Proper ordering**: Use `depends_on` to ensure resources are created in the correct sequence
- **Optional components**: Provide enable/disable flags for features like S3 log streaming and compliance Lambda
- **Examples included**: Provide example tfvars files for both full-mesh and hub-spoke topologies
- **Security**: Mark sensitive outputs (like account IDs) appropriately

## Deliverable Format

Please provide only the requested files as code blocks with no additional commentary or explanation.
