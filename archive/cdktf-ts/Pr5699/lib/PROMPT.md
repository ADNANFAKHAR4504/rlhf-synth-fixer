# Multi-Tier VPC Architecture for Payment Platform

Hey team,

We need to build out a new AWS environment for our fintech startup's payment processing application. I've been asked to create this infrastructure using **CDKTF with TypeScript**. The business wants a solid, well-architected network foundation that properly isolates different parts of the application and keeps everything secure.

Right now we're starting from scratch in the ca-central-1 region. The application team needs three distinct network tiers - public for load balancers, private for application servers, and completely isolated subnets for the database layer. They want everything spread across two availability zones for resilience.

The security team has been pretty clear about their requirements. They want comprehensive network monitoring through VPC Flow Logs, security groups that follow least privilege, and a Systems Manager endpoint so we can manage instances without exposing them to the public internet. Operations wants everything tagged consistently so we can track costs and resources properly.

## What we need to build

Create a multi-tier VPC infrastructure using **CDKTF with TypeScript** for a payment processing application.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16 in ca-central-1
   - Deploy across TWO availability zones for high availability
   - Resource names must include environmentSuffix for uniqueness

2. **Subnet Configuration**
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24 (one per AZ)
   - Private subnets: 10.0.11.0/24, 10.0.12.0/24 (one per AZ)
   - Isolated subnets: 10.0.21.0/24, 10.0.22.0/24 (one per AZ)
   - All CIDR blocks must be explicit, not auto-generated

3. **Internet Connectivity**
   - Internet Gateway for public subnet access
   - NAT Gateway in EACH public subnet (high availability)
   - Private subnets route outbound through NAT Gateways

4. **Routing Configuration**
   - Route table for public subnets with IGW route
   - Route table for each private subnet tier with NAT Gateway routes
   - Isolated subnets with no internet access
   - Proper subnet associations for all route tables

5. **Security Groups**
   - Web tier: Allow inbound on port 443
   - App tier: Allow inbound on port 8080
   - Database tier: Allow inbound on port 5432
   - Follow least privilege with specific source restrictions

6. **Monitoring and Logging**
   - VPC Flow Logs capturing ALL traffic (accepted and rejected)
   - Store flow logs in S3 bucket with 7-day retention
   - Flow logs must capture traffic from entire VPC

7. **VPC Endpoints**
   - Systems Manager VPC endpoint in private subnets only
   - Enable private DNS for endpoint
   - Proper security group for endpoint access

8. **Resource Tagging**
   - All resources tagged with Environment=production
   - All resources tagged with Project=payment-platform
   - Follow naming pattern: {project}-{tier}-{resource}-{az}

9. **Stack Outputs**
   - Export VPC ID
   - Export all subnet IDs (public, private, isolated)
   - Outputs should be usable by other stacks

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use CDKTF AWS provider resources (not CDK L2 constructs)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **ca-central-1** region
- Use CDKTF TerraformStack as base class

### Constraints

- NAT Gateways must be in separate availability zones
- Security group rules must specify exact ports and protocols
- VPC Flow Logs must capture both accepted and rejected traffic
- Systems Manager endpoint only in private subnets
- All resources must be destroyable (no Retain policies)
- Stack must deploy in single cdktf deploy command
- All subnets must use specified CIDR blocks exactly

## Success Criteria

- **Functionality**: Complete VPC with public, private, and isolated subnets across 2 AZs
- **Connectivity**: Internet Gateway for public, NAT Gateways for private subnet outbound
- **Security**: Security groups for three tiers with least privilege rules
- **Monitoring**: VPC Flow Logs capturing all traffic to S3 with 7-day retention
- **Endpoints**: Systems Manager endpoint in private subnets for secure access
- **Resource Naming**: All resources include environmentSuffix in names
- **Tagging**: All resources tagged with Environment and Project
- **Outputs**: VPC ID and all subnet IDs exported

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with 10.0.0.0/16 CIDR in ca-central-1
- Six subnets (2 public, 2 private, 2 isolated) with explicit CIDRs
- Internet Gateway and 2 NAT Gateways (one per AZ)
- Route tables configured for each subnet tier
- S3 bucket for VPC Flow Logs with 7-day retention
- Three security groups (web, app, database)
- Systems Manager VPC endpoint
- Proper tagging on all resources
- Stack outputs for VPC and subnet IDs
- Well-structured, tested, and documented code
