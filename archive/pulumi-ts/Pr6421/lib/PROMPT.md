Hey team,

We need to build out the production VPC infrastructure for our payment processing platform. The business is moving fast on this fintech initiative and we need a rock-solid network foundation that can handle their security and compliance requirements. I've been asked to create this in TypeScript using Pulumi since that's what our team standardized on.

The company is building a payment platform and they need strict network isolation between different tiers. They've also mentioned they'll eventually need to connect this to their on-premises systems through VPN, so we need to plan for that. The security team is really particular about network segmentation and logging everything for compliance purposes.

One interesting constraint they gave us is to use NAT instances instead of NAT Gateways. Apparently they ran the numbers and for their traffic patterns, the cost savings are significant. They want t3.micro instances running Ubuntu 20.04 for this.

## What we need to build

Create a production-grade VPC infrastructure using **Pulumi with TypeScript** for a payment processing platform in the us-east-1 region.

### Core Requirements

1. **VPC Configuration**
   - VPC with 10.0.0.0/16 CIDR block
   - Enable DNS hostnames and DNS resolution
   - Must span exactly 3 availability zones (us-east-1a, us-east-1b, us-east-1c)

2. **Network Subnets**
   - 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for load balancers
   - 3 private subnets (10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23) for application servers
   - 3 database subnets (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24) with no internet connectivity
   - Each subnet type distributed across the three AZs

3. **Internet Connectivity**
   - Internet Gateway attached to VPC
   - 3 NAT instances (t3.micro) using latest Ubuntu 20.04 AMI, one per public subnet
   - NAT instances must have source/destination checks disabled
   - Use aws.ec2.getAmi() to fetch the latest Ubuntu 20.04 AMI dynamically

4. **Routing Configuration**
   - Route tables for each subnet tier with proper associations
   - Public subnets route to Internet Gateway
   - Private subnets route to NAT instances for outbound traffic
   - Database subnets have no internet gateway routes
   - Route table names must follow pattern: {env}-{tier}-{az}-rt

5. **Security Groups**
   - Web tier: allow ports 80, 443 from 0.0.0.0/0
   - App tier: allow port 8080 from web tier security group only
   - Database tier: allow port 5432 from app tier security group only
   - All security groups deny all traffic by default with only explicit allow rules

6. **Network ACLs**
   - Inbound rules allowing only necessary traffic
   - Ephemeral port range restricted to 32768-65535
   - Properly configured for each subnet tier

7. **VPC Flow Logs**
   - Enable VPC Flow Logs for the entire VPC
   - Publish logs to an S3 bucket
   - S3 bucket with server-side encryption enabled
   - 7-day lifecycle policy for automatic log expiration

8. **S3 VPC Endpoint**
   - Create S3 gateway endpoint for private subnet access
   - Attach to private subnet route tables
   - Allows S3 access without internet routing

9. **Resource Tagging**
   - Tag all resources with Environment='production'
   - Tag all resources with Project='payment-platform'
   - Tag all resources with CostCenter='engineering'

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network foundation
- Use **EC2** for NAT instances
- Use **S3** for flow log storage
- Use **CloudWatch** for flow log publishing
- Use **IAM** for flow log role and policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Use Pulumi TypeScript SDK v3.x with AWS Classic provider

### Constraints

- NAT instances required instead of NAT Gateways for cost optimization
- All route tables must have explicit names following pattern: {env}-{tier}-{az}-rt
- All resources must be tagged with Environment, Project, and CostCenter
- Security groups must deny all traffic by default with only explicit allow rules
- VPC Flow Logs must be enabled and stored in S3 with 7-day lifecycle policy
- Network ACLs must restrict ephemeral port range to 32768-65535
- Private subnets must have no direct internet gateway routes
- VPC must span exactly 3 availability zones in us-east-1
- S3 gateway endpoint must be created for private subnet access to S3
- Public subnets must use /24 CIDR blocks, private subnets must use /23
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All 9 subnets properly configured and routable
- **Performance**: NAT instances handle outbound traffic efficiently
- **Reliability**: Infrastructure spans 3 AZs for high availability
- **Security**: Network segmentation enforces tier isolation, all traffic logged
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript code is well-structured, typed, and documented
- **Compliance**: Flow logs capture all network traffic for audit purposes

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- VPC with DNS enabled
- 3 public subnets, 3 private subnets, 3 database subnets
- Internet Gateway
- 3 NAT instances (t3.micro Ubuntu 20.04)
- Route tables with proper associations
- 3 Security groups (web, app, database tiers)
- Network ACLs with proper rules
- VPC Flow Logs configuration
- S3 bucket for flow logs (encrypted, 7-day lifecycle)
- S3 VPC endpoint
- IAM role for flow logs
- Comprehensive exports: VPC ID, subnet IDs by tier, NAT instance IDs, security group IDs, S3 bucket name
- Unit tests for all components
- Documentation and deployment instructions
