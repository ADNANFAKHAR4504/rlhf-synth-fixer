# Multi-Account Transit Gateway Network Architecture

## Background
A large enterprise needs to establish a hub-and-spoke network architecture across multiple AWS accounts to enable secure communication between production, development, and shared services environments. The solution must provide centralized DNS resolution, strict network isolation, and comprehensive monitoring capabilities.

## Environment Details
Multi-account AWS deployment in us-east-2 region. Requires Python 3.9+, AWS CDK 2.0+, AWS CLI v2 configured with cross-account IAM permissions. Target architecture includes Transit Gateway as the central hub, three VPCs (Production, Development, Shared Services), Route53 Resolver endpoints for centralized DNS, and VPC Flow Logs for compliance.

## Requirements

Create a CDK Python application to deploy a multi-account Transit Gateway network architecture with the following specifications:

### 1. Transit Gateway Configuration (MANDATORY)
- Create a Transit Gateway with DNS support enabled
- Configure Amazon side ASN 64512
- Disable default route table association and propagation for custom routing control
- Create separate route tables for Production, Development, and Shared Services

### 2. VPC Configuration (MANDATORY)
- **Production VPC**: CIDR 10.0.0.0/16
  - Private subnets only across 2+ availability zones
  - No NAT gateways required
- **Development VPC**: CIDR 10.1.0.0/16
  - Private subnets only across 2+ availability zones
  - No NAT gateways required
- **Shared Services VPC**: CIDR 10.2.0.0/16
  - Private subnets only across 2+ availability zones
  - No NAT gateways required

### 3. Route53 Resolver Configuration (MANDATORY)
- Deploy Route53 Resolver endpoints in Shared Services VPC
- Create INBOUND endpoint for on-premises to AWS DNS resolution
- Create OUTBOUND endpoint for AWS to on-premises DNS resolution
- Deploy endpoints across at least 2 availability zones for high availability

### 4. Transit Gateway Routing (MANDATORY)
- Create custom TGW route tables for each environment
- Production route table: Only routes to Shared Services
- Development route table: Only routes to Shared Services
- Shared Services route table: Routes to both Production and Development
- **CRITICAL**: No direct routing between Production and Development

### 5. Security Group Configuration (MANDATORY)
- Production VPC: Allow inbound from Shared Services CIDR only
- Development VPC: Allow inbound from Shared Services CIDR only
- Shared Services VPC: Allow inbound from both Production and Development CIDRs
- Route53 Resolver: Allow TCP/UDP port 53 from all VPC CIDRs

### 6. VPC Flow Logs (MANDATORY)
- Enable VPC Flow Logs for ALL traffic on all VPCs
- Store logs in S3 bucket with server-side encryption
- Configure 30-day lifecycle policy for cost optimization
- Use custom format with all available fields

### 7. IAM Roles and Policies (MANDATORY)
- Create IAM role for VPC Flow Logs with S3 write permissions
- Use External ID for cross-account access where applicable
- Follow least privilege principle

### 8. Resource Tagging (MANDATORY)
- All resources must include:
  - Environment tag (Production/Development/SharedServices)
  - Project tag: "transit-gateway-network"
  - ManagedBy tag: "CDK"
  - CostCenter tag

## Constraints
- Use CDK Python with proper construct hierarchy
- Implement using nested stacks for modularity
- Custom TGW route tables (not default)
- No direct Production-Development routing
- Private subnets only (no public subnets)
- Minimum 2 AZs for Route53 Resolver
- Security groups must follow least privilege
- Use cross-account CDK deployment patterns
- VPC Flow Logs must capture ALL traffic
- External ID required for IAM roles

## Success Criteria
- Transit Gateway successfully connects all three VPCs
- DNS resolution works bi-directionally through Route53 Resolver
- Network isolation enforced (no Prod-Dev connectivity)
- VPC Flow Logs capturing and storing in S3
- All resources properly tagged
- Infrastructure can be deployed and destroyed cleanly
- CDK synthesis completes without errors