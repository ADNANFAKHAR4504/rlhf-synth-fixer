# VPC Infrastructure for Payment Platform

Hey team,

We need to build a production-grade VPC infrastructure for our fintech startup's payment processing platform. I've been asked to create this using **Pulumi with TypeScript**. The business wants a secure, isolated network foundation that can handle payment transactions while meeting regulatory compliance requirements and supporting future integration with our on-premises systems.

The payment platform needs strict network isolation between different tiers - web, application, and database layers. We're dealing with sensitive financial data, so security is paramount. The infrastructure needs to span multiple availability zones for high availability, but we also need to be cost-conscious since we're a startup. That's why we're going with NAT instances instead of managed NAT Gateways.

We also need comprehensive logging and monitoring from day one. Auditors will want to see network traffic patterns, and we need to prove we're following security best practices. The VPC Flow Logs will give us that visibility while keeping everything encrypted at rest.

## What we need to build

Create a production VPC infrastructure using **Pulumi with TypeScript** for a payment processing platform in us-east-1.

### Core Requirements

1. **VPC Foundation**
   - CIDR block: 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Deploy across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Internet Gateway for public internet access

2. **Three-Tier Subnet Architecture**
   - Public subnets (3): 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 across all AZs
   - Private subnets (3): 10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23 for application tier
   - Database subnets (3): 10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24 with NO internet connectivity

3. **NAT Instances for Cost Optimization**
   - Use t3.micro EC2 instances (NOT NAT Gateways)
   - Deploy 3 instances, one per public subnet
   - Use latest Ubuntu 20.04 AMI
   - Disable source/destination checks
   - Handle outbound traffic for private subnets

4. **Route Tables and Networking**
   - Separate route tables for each subnet tier
   - Naming pattern: {env}-{tier}-{az}-rt
   - Public subnets route to Internet Gateway
   - Private subnets route to NAT instances
   - Database subnets have NO direct internet gateway routes
   - Proper route table associations for all subnets

5. **Security Groups with Zero Trust Model**
   - Web tier security group: Allow ports 80, 443 from 0.0.0.0/0
   - App tier security group: Allow port 8080 from web tier only
   - Database tier security group: Allow port 5432 from app tier only
   - Deny all traffic by default with explicit allow rules only
   - No overly permissive rules

6. **Network ACLs**
   - Implement inbound rules for necessary traffic only
   - Restrict ephemeral ports to range 32768-65535
   - Layer of defense in addition to security groups

7. **VPC Flow Logs**
   - Capture all network traffic for audit and compliance
   - Publish to S3 bucket with server-side encryption (AES256)
   - Implement 7-day object expiration lifecycle policy
   - Include CloudWatch Log Group for real-time monitoring
   - Proper IAM role for Flow Logs service

8. **S3 VPC Endpoint**
   - Create Gateway endpoint for S3 access
   - Allow private subnets to access S3 without internet routing
   - Associate with private subnet route tables

9. **Resource Tagging**
   - ALL resources must include these tags:
     - Environment='production'
     - Project='payment-platform'
     - CostCenter='engineering'

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network foundation with DNS enabled
- Use **EC2** for NAT instances (t3.micro on Ubuntu 20.04)
- Use **S3** with encryption for VPC Flow Logs storage
- Use **CloudWatch** for Flow Logs monitoring
- Use **IAM** roles with least privilege for Flow Logs service
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region spanning 3 availability zones
- Use Pulumi AWS Classic provider

### Deployment Requirements (CRITICAL)

- ALL resources must include **environmentSuffix** parameter to prevent naming conflicts
- Pattern: `resourceName-${environmentSuffix}` or `${environmentSuffix}-resourceName`
- NO resources with retain policies - everything must be destroyable
- NO `retainOnDelete: true` or similar protection flags
- Use `protect: false` in Pulumi resource options if needed
- Include proper IAM policies for VPC Flow Logs to write to S3 and CloudWatch

### Constraints

- Must use NAT instances (t3.micro EC2) instead of NAT Gateways for cost savings
- Route table naming must follow pattern: {env}-{tier}-{az}-rt
- Private subnets cannot have direct routes to Internet Gateway
- Database subnets must have NO internet connectivity
- Security groups must deny all by default
- VPC Flow Logs must be encrypted and have 7-day lifecycle
- Network ACLs must restrict ephemeral ports to 32768-65535
- All resources must be destroyable (no retention policies)
- Must span exactly 3 availability zones in us-east-1

## Success Criteria

- **Functionality**: Complete VPC with 3-tier subnet architecture across 3 AZs
- **Security**: Zero-trust security groups, encrypted Flow Logs, proper network isolation
- **Cost Optimization**: NAT instances instead of NAT Gateways, appropriate instance sizing
- **Compliance**: VPC Flow Logs to S3 with encryption and lifecycle policy
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed without errors
- **High Availability**: Resources distributed across us-east-1a, us-east-1b, us-east-1c
- **Code Quality**: TypeScript, well-structured, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with DNS enabled spanning 3 AZs
- 9 subnets total (3 public, 3 private, 3 database)
- Internet Gateway
- 3 NAT instances (t3.micro Ubuntu 20.04)
- Route tables with proper associations and naming
- Security groups for web, app, and database tiers
- Network ACLs with ephemeral port restrictions
- VPC Flow Logs to encrypted S3 bucket with 7-day lifecycle
- CloudWatch Log Group for Flow Logs
- S3 Gateway VPC Endpoint
- IAM roles for Flow Logs service
- Proper tagging on all resources
- Pulumi exports for VPC ID, subnet IDs, security group IDs, NAT instance IDs, and S3 bucket name
- Documentation with deployment instructions
