# Multi-Tier VPC Infrastructure for Payment Platform

Hey team,

We've got a fintech startup that's building out their payment processing platform, and they need us to set up the foundational network infrastructure. They're dealing with PCI DSS compliance requirements, which means we need to be really careful about network segmentation and isolation between different tiers of their application. The business has made it clear that security and compliance are non-negotiable here.

The payment platform is going to handle sensitive financial transactions, so we need to architect this with proper separation between the web tier, application tier, and database tier. Each tier needs its own security boundary, and we need to ensure that private resources don't have direct internet access while still being able to make outbound connections when needed. This is going to be the foundation for their ECS containers, RDS databases, and load balancers that will come in later phases.

I've been asked to build this using **AWS CDK with TypeScript**. The infrastructure team wants everything as code so it's repeatable and version controlled. We're targeting the us-east-1 region for this deployment.

## What we need to build

Create a production-ready VPC infrastructure using **AWS CDK with TypeScript** that provides secure network segmentation for a payment processing application.

### Core Network Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Deploy across exactly 3 availability zones for high availability
   - Configure three subnet tiers: public, private, and database

2. **Internet Connectivity**
   - Attach Internet Gateway to VPC for public subnet access
   - Deploy NAT Gateways in each public subnet for HA configuration
   - Ensure private and database subnets route through NAT Gateways only

3. **Routing Configuration**
   - Set up dedicated route tables for each subnet tier
   - Create explicit route table associations
   - Public subnets route to Internet Gateway
   - Private and database subnets route through NAT Gateways
   - No direct internet routes for private or database tiers

4. **Security Groups**
   - Create security groups for web, app, and database tiers
   - Configure ingress rules following least privilege principle
   - Implement tier-based access controls

5. **Compliance and Monitoring**
   - Enable VPC Flow Logs with CloudWatch Logs destination
   - Tag all resources with Environment='production' and Project='payment-platform'
   - Ensure network traffic is logged for compliance auditing

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Amazon VPC** for network foundation
- Use **NAT Gateway** in high availability mode
- Use **VPC Flow Logs** with **CloudWatch Logs** for monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- Deploy to **us-east-1** region
- CDK version 2.x with Node.js 16+

### AWS Services to Use

- Amazon VPC (Virtual Private Cloud)
- VPC Subnets (Public, Private, Database tiers)
- Internet Gateway
- NAT Gateway (High Availability)
- Route Tables
- Security Groups
- VPC Flow Logs
- CloudWatch Logs

### Constraints

- VPC must span exactly 3 availability zones
- NAT Gateways must be deployed in HA mode (one per public subnet)
- Private subnets must not have direct internet access
- Database subnets must not have direct internet access
- All route tables must have explicit subnet associations
- Security group rules must follow least privilege principle
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

### Resource Naming

All resources must include environmentSuffix variable to avoid conflicts:

```typescript
vpcName: `payment-vpc-${environmentSuffix}`
```

## Success Criteria

- **Functionality**: VPC deployed with correct CIDR, 3 AZs, all subnet tiers operational
- **High Availability**: NAT Gateways in each AZ for redundancy
- **Security**: Proper network segmentation, no direct internet access for private tiers
- **Compliance**: VPC Flow Logs enabled, all resources tagged correctly
- **Monitoring**: CloudWatch Logs capturing network traffic
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-structured, synthesizes valid CloudFormation
- **Outputs**: Export VPC ID, subnet IDs, and security group IDs

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/tap-stack.ts
- VPC with 10.0.0.0/16 CIDR across 3 availability zones
- Public, private, and database subnet tiers
- Internet Gateway and high availability NAT Gateways
- Route tables with proper associations and routes
- Security groups for web, app, and database tiers
- VPC Flow Logs with CloudWatch Logs destination
- CloudFormation outputs for all resource IDs
- Unit tests for stack validation
- Documentation for deployment and validation
