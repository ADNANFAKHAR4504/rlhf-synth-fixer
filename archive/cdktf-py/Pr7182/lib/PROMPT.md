# VPC Infrastructure for Financial Services Platform

Hey team,

We need to build a production-ready VPC infrastructure for a new digital banking platform. I've been asked to create this using **CDKTF with Python**. The business wants a secure, isolated network foundation that can support strict network segmentation between application tiers while maintaining high availability across multiple availability zones in the US East (N. Virginia) region.

A financial services company is launching their new digital banking platform and needs the network foundation to be rock-solid from day one. They're very particular about security and compliance given the regulatory requirements in the financial sector. We need to ensure proper network isolation, comprehensive logging for audit trails, and redundancy at every level to meet their SLA commitments.

The infrastructure needs to span three availability zones in us-east-1 to provide fault tolerance. Each AZ will have dedicated public and private subnets to support multi-tier applications, with NAT Gateways in each zone for high availability. They also want comprehensive network flow logging stored in S3 with lifecycle management for cost optimization.

## What we need to build

Create a production-ready VPC infrastructure using **CDKTF with Python** for a financial services digital banking platform deployed in the us-east-1 region.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Support future growth with sufficient IP address space

2. **Subnet Architecture**
   - Deploy 6 subnets total across 3 availability zones
   - Each AZ must have exactly one public subnet and one private subnet
   - Use /24 CIDR blocks for each subnet
   - Ensure non-overlapping CIDR blocks across all subnets

3. **Internet Connectivity**
   - Create Internet Gateway and attach to VPC
   - Deploy one NAT Gateway in each public subnet (3 total)
   - Allocate Elastic IP addresses for each NAT Gateway
   - Ensure high availability by not sharing NAT Gateways across zones

4. **Routing Configuration**
   - Create separate route tables for public and private subnets
   - Configure appropriate routes for internet-bound and internal traffic
   - Explicitly associate all subnets with route tables (no reliance on main route table)
   - Public subnets route to Internet Gateway
   - Private subnets route to NAT Gateway in same AZ

5. **Network Monitoring and Compliance**
   - Create S3 bucket for VPC Flow Logs storage
   - Enable versioning on the S3 bucket
   - Enable VPC Flow Logs capturing ALL traffic types
   - Store flow logs in S3 bucket
   - Configure S3 lifecycle rule to transition logs to Glacier after 30 days

6. **Network Security**
   - Create custom Network ACLs
   - Configure explicit deny-all rules as baseline
   - Document any exceptions to default deny rules

7. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=DigitalBanking
   - Include **environmentSuffix** parameter for resource naming uniqueness

8. **Outputs**
   - Output VPC ID
   - Output subnet IDs grouped by type (public/private)
   - Output NAT Gateway public IP addresses

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS VPC** for network isolation
- Use **EC2 Subnets** for network segmentation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateways** with Elastic IPs for private subnet outbound connectivity
- Use **Route Tables** for traffic routing
- Use **S3** for VPC Flow Logs storage with versioning and lifecycle policies
- Use **VPC Flow Logs** for network traffic monitoring
- Use **Network ACLs** for subnet-level security
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region (N. Virginia)
- Use Python 3.8 or higher
- Use CDKTF 0.19 or higher
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** in their names to ensure uniqueness across multiple deployments
- All resources MUST be fully destroyable with no DeletionPolicy=Retain or RemovalPolicy=RETAIN settings
- S3 buckets MUST use auto_delete_objects=True or equivalent for cleanup capability
- NAT Gateways MUST be deployed one per availability zone (3 total) for high availability
- Route tables MUST have explicit subnet associations for all subnets
- VPC Flow Logs MUST capture ALL traffic (not just ACCEPT or REJECT)

### Constraints

- VPC CIDR must be /16 to accommodate future growth with at least 4096 available IPs per subnet
- Each availability zone must have exactly one public and one private subnet with non-overlapping CIDR blocks
- NAT Gateways must be deployed in each AZ for high availability, not shared across zones
- All route tables must have explicit associations - no reliance on main route table
- VPC Flow Logs must be enabled and stored in S3 with 30-day lifecycle policy
- Network ACLs must explicitly deny all traffic by default except for documented exceptions
- All resources must follow financial services security best practices
- Infrastructure must support multi-tier application architecture
- Include proper error handling and logging in code

## Success Criteria

- **Functionality**: Complete VPC with 6 subnets across 3 AZs, internet connectivity via IGW and NAT Gateways, comprehensive flow logging to S3
- **High Availability**: Redundant NAT Gateways deployed one per AZ, subnets spanning multiple availability zones
- **Security**: Custom Network ACLs with deny-all baseline, private subnets isolated from direct internet access, flow logs capturing all network traffic
- **Compliance**: VPC Flow Logs enabled with S3 storage and lifecycle management, proper tagging for resource tracking
- **Resource Naming**: All resources include environmentSuffix parameter in names for multi-environment support
- **Code Quality**: Clean Python code, well-structured CDKTF constructs, proper documentation, follows CDKTF best practices

## What to deliver

- Complete CDKTF Python implementation
- AWS VPC with DNS support enabled
- 6 subnets (3 public, 3 private) across 3 availability zones
- Internet Gateway for VPC
- 3 NAT Gateways with Elastic IPs (one per AZ)
- Route tables for public and private subnets with explicit associations
- S3 bucket with versioning for VPC Flow Logs
- VPC Flow Logs configuration capturing all traffic
- S3 lifecycle policy for 30-day Glacier transition
- Custom Network ACLs with deny-all baseline
- Proper resource tagging (Environment=Production, Project=DigitalBanking)
- Outputs for VPC ID, subnet IDs, and NAT Gateway IPs
- Documentation with deployment and testing instructions
