
# AWS CloudFormation Template for PCI DSS Compliant VPC Infrastructure

## Overview
Generate a fully automated AWS CloudFormation template (YAML format) that deploys a secure, multi-AZ VPC infrastructure for a payment processing environment requiring PCI DSS compliance.
The template must be cross-account executable, region-agnostic, and free of hardcoded values (e.g., ARNs, Account IDs, Region names). Use parameters and intrinsic functions wherever possible.

## Requirements

### General Requirements
- Use YAML format with proper indentation
- Use CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt, etc.)
- All values (e.g., CIDR blocks, environment names, tag values) must be parameterized
- Template must be cross-account executable — no account- or region-specific references
- Avoid hardcoding ARNs, Account IDs, Region names, or fixed resource names

### Critical Resource Naming Pattern
All resources must follow this naming pattern using !Sub:
`${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]`

Example:
- VPC: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- Subnets: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`

### Required Parameters
Must include the following parameters:
```yaml
EnvironmentSuffix:
  Type: String
  Description: 'Suffix for resource names to support multiple parallel deployments'
  Default: "dev"
  AllowedPattern: '^[a-zA-Z0-9\-]*$'
  ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

### VPC Architecture

- Create a VPC with CIDR block 10.0.0.0/16 (parameterized)
- Deploy across three Availability Zones (automatically determined via !GetAZs and !Select)
- Enable DNS Hostnames and DNS Resolution

### Subnets
#### Public Subnets
- CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Purpose: NAT Gateways only

#### Private Subnets
- CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Purpose: Application workloads

#### Database Subnets
- CIDR blocks: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- Purpose: Database instances (no internet access)

All subnet CIDR blocks must be parameterized and distributed across AZs automatically.

### Networking Components

- Internet Gateway attached to VPC
- One Elastic IP and NAT Gateway per public subnet (for high availability)

#### Route Tables
- **Public Route Table**
  - Routes to Internet Gateway
- **Private Route Tables**
  - Routes to NAT Gateway (in the same AZ)
- **Database Route Table**
  - Local routes only (no internet access)

### Security Groups

#### Web Tier
- Inbound: Allow HTTPS (443) only from the Internet
- Outbound: Least privilege, only necessary routes

#### Application Tier
- Inbound: Allow port 8080 from Web Tier SG
- Outbound: Least privilege, internal-only where applicable

#### Database Tier
- Inbound: Allow port 5432 (PostgreSQL) from App Tier SG
- Outbound: Least privilege, internal-only where applicable

### Monitoring & Compliance

#### VPC Flow Logs
- Enable Flow Logs with traffic type: ALL
- Destination: CloudWatch Logs
- Create necessary IAM Role for Flow Logs delivery
- Set aggregation interval to 1 minute

### VPC Endpoints
#### Gateway Endpoints
- S3 Endpoint for private subnets

#### Interface Endpoints
- Systems Manager (SSM)
- EC2 Messages
- SSM Messages

All endpoints must be associated with private subnets only.

### Tagging Requirements
All resources must include the following tags:
- Environment
- CostCenter
- Compliance

All tag values must be provided as parameters.

### Required Outputs

Export the following resources for cross-stack references:
- VPC ID
- Subnet IDs
- Security Group IDs
- NAT Gateway IDs
- Route Table IDs

All exports must use proper Export names in the Outputs section.

### Technical Constraints & Best Practices
- Use Parameters for all user-defined values
- Use Mappings for AZ selection or region-specific defaults
- Avoid hardcoding any AWS-managed resource ARNs or Region strings
- Follow least-privilege and separation of duties principles
- Template must deploy successfully across any AWS account without modification

## Deliverables
A single YAML CloudFormation template that meets all requirements outlined above.

### Output Requirements
1. Clean, production-grade YAML template
2. Fully parameterized and region-independent
3. No manual steps required post-deployment
4. Include descriptive comments for each major resource block