Hey team,

We're working with a financial services startup that needs to build a secure cloud foundation for their new trading platform. This is a critical piece because they need to comply with PCI DSS requirements, which means we have to be really careful about network segmentation and isolation between different application tiers. The platform will handle sensitive customer data, so there's zero room for error on the network boundaries between public-facing services and the internal databases.

The business context here is that they're building this trading platform from scratch, and the VPC infrastructure is the foundation everything else will sit on. They need a production-ready setup that can handle their compliance requirements while still being cost-effective. The architecture team has specified a three-tier design with public subnets for load balancers, private subnets for application servers, and completely isolated subnets for databases with no internet access whatsoever.

I've been asked to create this infrastructure using **Pulumi with Python**. The deployment target is us-east-1, and they want everything set up across three availability zones for high availability.

## What we need to build

Create a production-ready VPC infrastructure using **Pulumi with Python** for a financial services trading platform that needs PCI DSS compliance.

### Core Requirements

1. **VPC and Network Architecture**
   - Create VPC with CIDR block 10.0.0.0/16 spanning 3 availability zones
   - VPC must accommodate at least 1000 hosts across all subnets
   - All resources must include environmentSuffix for unique naming

2. **Public Subnet Tier**
   - Deploy 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - One subnet per availability zone for load balancers and NAT gateways
   - Configure Network ACLs that deny all inbound traffic except ports 80 and 443
   - Attach Internet Gateway for public internet access

3. **Private Subnet Tier**
   - Deploy 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - One subnet per availability zone for application servers
   - No direct internet access - route through NAT gateways only
   - Configure one NAT gateway per AZ for cost optimization

4. **Isolated Database Tier**
   - Deploy 3 isolated subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - One subnet per availability zone for RDS databases
   - Completely isolated with no internet connectivity
   - No route to NAT gateways or Internet Gateway

5. **VPC Flow Logs and Monitoring**
   - Enable VPC Flow Logs for all network traffic
   - Store flow logs in S3 bucket with AES-256 encryption
   - Configure bucket versioning for audit trail
   - Implement lifecycle policy to transition logs to Glacier after 30 days

6. **Routing and Connectivity**
   - Create route tables for each subnet tier with appropriate routes
   - Public subnets route to Internet Gateway
   - Private subnets route to NAT Gateway in same AZ
   - Isolated subnets have local-only routes

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use pulumi-aws provider for AWS resource provisioning
- Deploy to us-east-1 region
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Tag all resources with Environment=production and Project=trading-platform

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use RemovalPolicy.DESTROY or equivalent for all resources
- FORBIDDEN: DeletionPolicy=Retain, RemovalPolicy.RETAIN
- Resource naming: All resources must include environmentSuffix parameter
- Example: f"vpc-flow-logs-bucket-{environment_suffix}"

### Constraints

- VPC CIDR must support at least 1000 hosts across all subnets
- Private subnets must have no direct internet access except through NAT gateways
- Each availability zone must have exactly one NAT gateway
- All VPC Flow Logs must be stored in S3 with AES-256 encryption enabled
- Security group rules must explicitly deny all traffic by default and only allow specific ports
- No resources should have deletion protection enabled (development testing requirement)

## Success Criteria

- Functionality: VPC with complete three-tier network architecture across 3 AZs
- Network Segmentation: Clear isolation between public, private, and database tiers
- Compliance: Network ACLs and routing support PCI DSS requirements
- Monitoring: VPC Flow Logs capturing all network traffic to S3
- Cost Optimization: One NAT gateway per AZ (not per subnet)
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be deleted without retention policies
- Outputs: Export VPC ID, subnet IDs by tier, and S3 bucket name

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- VPC with Internet Gateway and 3 NAT Gateways
- 9 subnets total: 3 public, 3 private, 3 isolated
- S3 bucket for VPC Flow Logs with encryption and lifecycle policies
- Route tables configured for each tier
- Network ACLs for public subnet security
- Pulumi outputs for VPC ID, subnet IDs (grouped by tier), and flow logs bucket
- Resource tagging with Environment and Project tags
- Integration with existing tap.py entry point
