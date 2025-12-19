# Production VPC Infrastructure for Payment Processing

Hey team,

We need to build a production-grade VPC infrastructure for a fintech startup launching their payment processing platform. They've been running on shared infrastructure and now need isolated network segments with strict security controls to meet PCI DSS compliance requirements. I've been asked to create this using AWS CDK with Python.

The business wants a secure cloud foundation with complete network segmentation between application tiers. They need robust traffic controls, cost-effective internet connectivity for private resources, and comprehensive monitoring for security audits. This is a critical piece of infrastructure that will host payment processing workloads, so security and compliance are non-negotiable.

They've specified exact CIDR ranges and subnet layouts based on their networking standards. The infrastructure needs to span three availability zones for high availability, with separate public and private subnet tiers. Cost is a factor, so they've opted for NAT instances over managed NAT Gateways, accepting the operational trade-off for significant cost savings.

## What we need to build

Create a production VPC infrastructure using **AWS CDK with Python** for a payment processing platform requiring PCI DSS compliance and strict network segmentation.

### Core Requirements

1. **VPC Foundation**
   - VPC with CIDR block 10.50.0.0/16
   - Span exactly 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Enable DNS hostnames and DNS support

2. **Public Subnet Tier**
   - Three public subnets: 10.50.1.0/24, 10.50.2.0/24, 10.50.3.0/24
   - One subnet per availability zone
   - Internet Gateway attached to VPC
   - Route tables with internet gateway routes
   - Each subnet must have its own dedicated route table

3. **Private Subnet Tier**
   - Three private subnets: 10.50.11.0/24, 10.50.12.0/24, 10.50.13.0/24
   - One subnet per availability zone
   - No direct internet access
   - Outbound connectivity through NAT instances
   - Each subnet must have its own dedicated route table

4. **NAT Instance Configuration**
   - Deploy t3.micro EC2 instances as NAT devices (NOT NAT Gateways)
   - One NAT instance per public subnet (3 total)
   - Use appropriate Amazon Linux NAT AMI
   - Security groups for NAT instance traffic
   - Source/destination check disabled
   - Private subnet route tables pointing to NAT instances

5. **Network Access Control Lists**
   - Custom Network ACLs for each subnet tier
   - Explicit inbound rules (no default allow-all)
   - Explicit outbound rules (no default allow-all)
   - Public subnet ACLs allowing HTTP/HTTPS/SSH
   - Private subnet ACLs allowing internal VPC traffic

6. **VPC Flow Logs**
   - Enable VPC Flow Logs at VPC level
   - CloudWatch Logs as destination
   - 60-second (1-minute) capture intervals
   - Log all traffic (accepted and rejected)
   - IAM role for Flow Logs to write to CloudWatch

7. **VPC Endpoints**
   - S3 Gateway Endpoint configured in all private subnets
   - DynamoDB Gateway Endpoint configured in all private subnets
   - Both endpoints associated with private subnet route tables

8. **Security Groups**
   - Follow least-privilege principle
   - No use of 0.0.0.0/0 CIDR blocks
   - Security groups for NAT instances
   - Restrict traffic to necessary ports and protocols only

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon VPC** for network foundation
- Use **EC2** for NAT instances (t3.micro)
- Use **CloudWatch Logs** for VPC Flow Logs destination
- Use **VPC Endpoints** for S3 and DynamoDB
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- CDK version 2.x with Python 3.9 or higher

### Constraints

- VPC must use custom CIDR range 10.50.0.0/16 with exactly 6 subnets across 3 availability zones
- Private subnets must have no direct internet access but require outbound connectivity through NAT instances (not NAT Gateways)
- All traffic between subnets must pass through Network ACLs with explicit allow rules only
- VPC Flow Logs must be enabled and sent to CloudWatch Logs with 1-minute intervals
- Each subnet must have dedicated route tables with no shared routing configurations
- Security groups must follow least-privilege principle with no use of 0.0.0.0/0 CIDR blocks
- VPC endpoints for S3 and DynamoDB must be configured in all private subnets
- All resources must be tagged with Environment: 'production', Team: 'platform', CostCenter: 'engineering'
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: VPC with exact CIDR ranges, 3 AZs, 6 subnets, NAT instances operational, flow logs capturing traffic
- **Performance**: 60-second flow log intervals, efficient routing through NAT instances
- **Reliability**: High availability across 3 AZs, redundant NAT instances
- **Security**: Custom NACLs, least-privilege security groups, no 0.0.0.0/0 CIDR usage, VPC endpoints for AWS services
- **Compliance**: PCI DSS-ready network segmentation, comprehensive traffic logging
- **Resource Naming**: All resources include environmentSuffix parameter
- **Cost Optimization**: NAT instances instead of NAT Gateways
- **Code Quality**: Python, well-tested, documented

## What to deliver

- Complete AWS CDK Python implementation
- VPC with Internet Gateway and Flow Logs
- 3 public subnets and 3 private subnets across 3 AZs
- 3 NAT instances (t3.micro) in public subnets
- Custom Network ACLs with explicit rules
- Dedicated route tables for each subnet
- S3 and DynamoDB VPC endpoints
- Security groups following least-privilege
- Mandatory resource tags (Environment, Team, CostCenter)
- Unit tests for all components
- Documentation and deployment instructions
