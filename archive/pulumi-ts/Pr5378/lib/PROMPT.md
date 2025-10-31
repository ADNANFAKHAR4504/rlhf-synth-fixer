# Multi-Tier VPC Infrastructure for Payment Processing

Hey team,

We need to build a secure network foundation for a fintech startup's payment processing application. The company is looking to establish their first proper AWS environment with network isolation between application tiers while keeping administrative access secure. This is going to be their foundation infrastructure that they'll replicate across multiple regions as they grow.

The business team is pretty clear about what they need: proper network segmentation for their payment processing workloads, secure bastion access for the ops team, and comprehensive flow logging for compliance. They're building everything in eu-central-1 to start with and need this to be production-ready.

I've been asked to create this using **Pulumi with TypeScript**. The architecture team wants a classic three-tier setup with public and private subnets across three availability zones for high availability. They're also being very specific about using separate NAT Gateways in each AZ (I know it costs more, but they want true redundancy).

## What we need to build

Create a multi-tier VPC infrastructure using **Pulumi with TypeScript** for a fintech payment processing platform.

### Core Requirements

1. **VPC and Network Foundation**
   - VPC with CIDR block 10.0.0.0/16 in eu-central-1
   - Three pairs of subnets (public and private) spread across three availability zones
   - Internet Gateway attached to the VPC for public subnet connectivity

2. **NAT Gateway Setup**
   - NAT Gateways deployed in each public subnet
   - Each private subnet uses a different NAT Gateway for high availability
   - Route tables configured with appropriate routes (0.0.0.0/0 to IGW for public, 0.0.0.0/0 to NAT for private)

3. **Bastion Host**
   - Deploy a bastion host in the first public subnet
   - Use Amazon Linux 2 AMI with t3.micro instance type
   - Security group allowing SSH access from specific IP ranges only

4. **VPC Flow Logs**
   - S3 bucket for storing VPC Flow Logs
   - Lifecycle policy to delete logs after 30 days
   - Enable VPC Flow Logs for all traffic and send to the S3 bucket

5. **Outputs**
   - VPC ID
   - All subnet IDs (public and private)
   - Bastion host public IP address

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS VPC for network foundation
- Use AWS EC2 for bastion host
- Use AWS S3 for flow log storage
- Use AWS VPC Flow Logs for traffic monitoring
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- Deploy to eu-central-1 region
- Use only the @pulumi/aws package without additional NPM dependencies

### Constraints

- Use Pulumi's automatic naming feature for all resources except the S3 bucket which must have a unique name
- Implement all infrastructure in a single Pulumi stack without component resources
- Configure all security group rules inline rather than as separate rule resources
- All resources must be destroyable (no Retain policies)
- Tag all resources with Environment=Development and ManagedBy=Pulumi
- Include proper error handling and logging

## Success Criteria

- Functionality: Complete multi-tier VPC with working public and private subnets across three AZs
- Performance: High availability with separate NAT Gateways per AZ
- Reliability: Resources properly configured with appropriate route tables and security groups
- Security: Bastion host with restricted SSH access, flow logs enabled for compliance
- Resource Naming: All resources include environmentSuffix where applicable
- Code Quality: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- VPC with three public and three private subnets
- Internet Gateway and three NAT Gateways
- Route tables configured for public and private subnets
- Bastion host with security group
- S3 bucket with lifecycle policy for VPC Flow Logs
- VPC Flow Logs enabled and sending to S3
- Unit tests for all components
- Integration tests using deployed outputs
- Documentation and deployment instructions
