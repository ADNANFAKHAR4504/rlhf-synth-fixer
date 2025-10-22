You are an expert AWS Solutions Architect and Pulumi TypeScript developer specializing in enterprise-grade network infrastructure. Your task is to implement a production-ready hub-and-spoke network architecture based on the requirements below.

## Context
A financial services company requires a standardized, secure multi-region AWS network architecture. The solution must provide isolated VPCs for different business units with controlled inter-VPC communication through a central hub, supporting future growth while maintaining strict security boundaries.

## Infrastructure Requirements

### Network Architecture
- **Hub VPC** (us-east-1): CIDR 10.0.0.0/16
  - Public and private subnets across 3 availability zones
  - NAT Gateways (one per AZ) for centralized internet egress
  - Internet Gateway for public subnet connectivity

- **Production Spoke VPC** (us-east-1): CIDR 10.1.0.0/16
  - Private subnets only (3 AZs)
  - No direct internet gateway
  - Communication limited to Hub VPC only

- **Development Spoke VPC** (us-east-1): CIDR 10.2.0.0/16
  - Private subnets only (3 AZs)
  - No direct internet gateway
  - Can communicate with both Hub and Production VPCs

### Transit Gateway Configuration
- Deploy AWS Transit Gateway in us-east-1
- Attach all three VPCs with dedicated attachments
- Configure route tables with these isolation rules:
  - Production → Hub only (unidirectional)
  - Development → Hub and Production (bidirectional with Hub, one-way to Production)
  - Development CANNOT initiate connections to Production
  - Hub → All spokes

### Routing Strategy
- Spoke VPCs route internet-bound traffic (0.0.0.0/0) through Transit Gateway to Hub NAT Gateways
- Private subnet route tables in spoke VPCs point default route to Transit Gateway
- Hub VPC private subnets route to NAT Gateways for internet access

### Logging and Monitoring
- **VPC Flow Logs**: Enable for all VPCs
  - Store in S3 bucket with server-side encryption (AES256)
  - Block all public access on S3 bucket
  - Lifecycle policy: Transition to Glacier after 30 days
  
- **CloudWatch Alarms**:
  - Transit Gateway attachment packet drops
  - VPC subnet IP utilization exceeding 80% threshold

### DNS Resolution
- Create Route53 Private Hosted Zones for each VPC
- Enable DNS resolution between connected VPCs
- Associate zones appropriately based on Transit Gateway connectivity

### Private Connectivity
- Deploy VPC Endpoints in each VPC for AWS Systems Manager:
  - ssm endpoint
  - ssmmessages endpoint
  - ec2messages endpoint
- Enable private DNS for all endpoints

### Tagging Strategy
Apply consistent tags to ALL resources:
- `Environment`: "hub" | "production" | "development"
- `CostCenter`: "network-operations"
- `ManagedBy`: "pulumi"

## Technical Constraints
1. All spoke VPCs MUST use private subnets only with NO direct Internet Gateway attachments
2. VPC CIDR blocks MUST NOT overlap
3. Use ONLY Pulumi's strongly typed AWS constructs—no raw AWS SDK calls
4. Ensure NAT Gateway high availability with one per AZ in Hub VPC
5. S3 bucket for Flow Logs MUST have encryption and public access blocked
6. Transit Gateway route table isolation MUST prevent Development from initiating connections to Production

## Output Requirements

Provide complete, production-ready code for these three files ONLY:

### 1. lib/tap-stack.ts
- Full Pulumi stack implementation
- Use TypeScript interfaces for configuration
- Export all resource IDs, ARNs, and endpoints as stack outputs
- Include comprehensive inline comments explaining resource relationships
- Group resources logically (VPCs, Transit Gateway, Routing, Monitoring, DNS, Endpoints)
- Use Pulumi's `apply()` method for dependent resource references

### 2. tests/tap-stack.unit.test.ts
- Unit tests using Jest framework
- Mock AWS SDK calls
- Test resource creation logic
- Validate CIDR blocks don't overlap
- Verify correct tag application
- Test route table configurations
- Validate security group rules for endpoints

### 3. tests/tap-stack.int.test.ts
- Integration tests using Pulumi's testing utilities
- Test actual resource deployment (using Pulumi preview or up)
- Validate Transit Gateway attachments
- Verify VPC peering through Transit Gateway
- Test DNS resolution between VPCs
- Validate S3 lifecycle policies
- Check CloudWatch alarm configuration

## Code Structure Guidelines
- Use async/await patterns for Pulumi resources
- Create reusable helper functions for subnet creation
- Implement proper TypeScript typing for all variables
- Use Pulumi ComponentResources for logical grouping
- Handle errors gracefully with try-catch blocks
- Use Pulumi's `interpolate` for dynamic string construction

## Connection Focus Areas
Pay special attention to these resource connections:
1. Transit Gateway Attachments → VPCs → Route Tables
2. Route Tables → Transit Gateway → NAT Gateways
3. VPC Flow Logs → S3 Bucket → Lifecycle Policies
4. Route53 Zones → VPC Associations → DNS Resolution
5. VPC Endpoints → Security Groups → Private Subnets
6. CloudWatch Alarms → Transit Gateway Metrics
7. Subnet CIDR Calculations → IP Address Management

Begin implementation with lib/tap-stack.ts first, followed by the test files. Ensure all code is formatted, linted, and includes proper error handling.
