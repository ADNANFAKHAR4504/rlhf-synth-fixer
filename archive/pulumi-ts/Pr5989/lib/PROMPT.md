# Multi-Region AWS Infrastructure with Pulumi TypeScript

## Role and Context

You are an expert AWS infrastructure architect specializing in Pulumi with TypeScript. Your task is to build a production-grade, multi-region network foundation for a financial services trading platform that requires secure, low-latency cross-region connectivity.

## Infrastructure Requirements

Build a Pulumi TypeScript program implementing a hub-and-spoke network topology across three AWS regions with the following specifications:

### Regional VPC Configuration

Create VPCs in three regions with non-overlapping CIDR blocks:

- **us-east-1**: 10.10.0.0/16 (ASN: 64512)
- **eu-west-1**: 10.20.0.0/16 (ASN: 64513)
- **ap-southeast-1**: 10.30.0.0/16 (ASN: 64514)

Each VPC must include:

- Three Availability Zones with public and private subnets
- Public subnets: /24 CIDR (10.X.0.0/24, 10.X.1.0/24, 10.X.2.0/24)
- Private subnets: /20 CIDR (10.X.16.0/20, 10.X.32.0/20, 10.X.48.0/20)
- Internet Gateway for public subnet internet access
- NAT Gateway in each public subnet for private subnet outbound connectivity

### Transit Gateway Architecture

- Deploy Transit Gateway in each region with unique BGP ASN
- Create VPC attachments for inter-VPC routing
- Establish Transit Gateway peering connections between all three regions (us-east-1 ↔ eu-west-1, us-east-1 ↔ ap-southeast-1, eu-west-1 ↔ ap-southeast-1)
- Configure route tables for cross-region traffic flow

### DNS and Management Services

- Route53 private hosted zones with DNSSEC signing for internal DNS resolution across all regions
- Systems Manager VPC endpoints (ssm, ssmmessages, ec2messages) in each VPC for secure management access without internet exposure

### Monitoring and Compliance

- VPC Flow Logs capturing ALL traffic with custom format including packet-level details (srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, action)
- S3 buckets in each region for flow log storage with encryption enabled

### Resource Standards

- All resources must have a 10-character random suffix using Pulumi's `RandomString` to prevent naming conflicts
- Apply consistent tags to every resource: `Environment: production`, `CostCenter: trading-platform`, `Owner: infrastructure-team`

## File Structure and Implementation

Modify only these three files:

### lib/tap-stack.ts

Create the main stack class `TapStack` that:

- Defines regional configurations as a data structure
- Implements VPC creation with subnet calculations
- Configures Transit Gateways with proper ASN assignments
- Establishes Transit Gateway peering and route propagation
- Creates Route53 hosted zones with DNSSEC
- Deploys Systems Manager endpoints
- Sets up VPC Flow Logs with S3 storage
- Exports Transit Gateway attachment IDs and VPC endpoint URLs

### tests/tap-stack.unit.test.ts

Write unit tests validating:

- CIDR block calculations for non-overlapping ranges
- Subnet allocation logic across 3 AZs
- Transit Gateway ASN uniqueness
- Resource naming with random suffix generation
- Tag application to all resources
- Route table configuration logic

### tests/tap-stack.int.test.ts

Write integration tests verifying:

- VPC and subnet creation in all three regions
- Transit Gateway attachment successful creation
- Transit Gateway peering connection establishment
- Route53 zone association across regions
- Systems Manager endpoint accessibility
- Flow log delivery to S3 buckets

## Technical Constraints

1. Use Pulumi AWS SDK v6.x with TypeScript strong typing
2. Implement proper error handling and resource dependencies
3. Use `Output<T>` types correctly for cross-resource references
4. Leverage Pulumi component resources for reusability
5. Ensure Transit Gateway peering uses `accepter` and `requester` roles correctly
6. Configure route table propagation automatically after peering establishment

## Expected Output Structure

The stack must export:

{
transitGatewayIds: { [region: string]: Output<string> },
transitGatewayAttachmentIds: { [region: string]: Output<string> },
vpcEndpointUrls: {
[region: string]: {
ssm: Output<string>,
ssmmessages: Output<string>,
ec2messages: Output<string>
}
},
route53ZoneIds: { [region: string]: Output<string> },
flowLogBuckets: { [region: string]: Output<string> }
}


## Code Quality Requirements

- Use TypeScript interfaces for configuration objects
- Implement helper functions for CIDR calculation and subnet allocation
- Add descriptive comments for complex networking logic
- Follow consistent naming conventions: `{region}-{resource-type}-{random-suffix}`
- Use async/await patterns where appropriate
- Handle region-specific availability zone mappings

## Deliverables

Generate production-ready code with proper resource dependencies, comprehensive test coverage, and clear documentation for infrastructure operations teams.

## Metadata

- **Difficulty**: Hard
- **Tool**: Pulumi
- **Language**: TypeScript
- **Domain**: AWS VPC, Networking, Multi-Region
- **Use Case**: Financial services trading platform
- **Compliance**: Production-grade with monitoring and security best practices
