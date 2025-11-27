# Production VPC Infrastructure for Financial Services Platform

Hey team,

We need to build a production-ready VPC infrastructure for a new digital banking platform. A financial services company is launching their digital banking solution and needs a secure, isolated network foundation in AWS. I've been asked to create this in Python using CDKTF. The business wants a highly available network that can support strict segmentation between application tiers while maintaining redundancy across multiple availability zones.

The infrastructure needs to support dynamic region configuration via AWS_REGION environment variable or a lib/AWS_REGION file (with us-east-1 as default fallback) and must meet financial services compliance requirements including comprehensive network monitoring and explicit security controls. This is going to be the foundation for their multi-tier banking applications, so it needs to be rock solid from day one.

The key challenge here is balancing high availability with security. We need NAT Gateways in each availability zone for redundancy, but that comes with cost implications. We also need to ensure all traffic is logged for compliance, with proper lifecycle management to control storage costs. The network design must accommodate future growth while maintaining strict isolation between public and private resources.

## What we need to build

Create a production-grade VPC network infrastructure using **CDKTF with Python** for a financial services digital banking platform.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Must accommodate at least 4096 available IPs per subnet for future growth

2. **Multi-AZ Subnet Architecture**
   - Deploy 6 subnets total across 3 availability zones in the configured region
   - Each AZ must have exactly one public subnet and one private subnet
   - All subnets must use /24 CIDR blocks (256 IPs each)
   - CIDR blocks must be non-overlapping within the VPC range

3. **Internet Connectivity**
   - Create and attach an Internet Gateway to the VPC
   - Deploy one NAT Gateway in each public subnet (3 total for high availability)
   - Allocate Elastic IP addresses for each NAT Gateway
   - NAT Gateways must not be shared across availability zones

4. **Route Table Configuration**
   - Create separate route tables for public and private subnets
   - Configure public route tables with routes to Internet Gateway
   - Configure private route tables with routes to respective NAT Gateways
   - All route tables must have explicit subnet associations
   - Do not rely on the default main route table

5. **VPC Flow Logs**
   - Enable VPC Flow Logs capturing ALL traffic (accepted, rejected, and all)
   - Store flow logs in S3 bucket with versioning enabled
   - Configure S3 lifecycle rule to transition logs to Glacier after 30 days
   - Ensure proper IAM permissions for flow log delivery

6. **Network Security**
   - Create custom Network ACLs with explicit deny-all rules as baseline
   - Network ACLs must be documented with clear rule purposes
   - Apply network ACLs to appropriate subnets

7. **Resource Tagging**
   - Tag all resources with Environment={environmentSuffix} (use the suffix parameter value)
   - Tag all resources with Project=DigitalBanking
   - Resource names must include environmentSuffix for uniqueness across deployments

8. **Outputs**
   - Output the VPC ID
   - Output all subnet IDs grouped by type (public/private) and availability zone
   - Output all NAT Gateway public IP addresses

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider for CDKTF
- Use **VPC** for network isolation
- Use **Subnets** for network segmentation (public and private tiers)
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Elastic IP** for NAT Gateway addressing
- Use **Route Tables** for traffic routing
- Use **VPC Flow Logs** for network monitoring and compliance
- Use **S3 Bucket** for flow log storage with lifecycle policies
- Use **Network ACLs** for subnet-level security
- Support **dynamic region configuration** via AWS_REGION environment variable or lib/AWS_REGION file (default: us-east-1)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Code must be compatible with Python 3.8+, CDKTF 0.19+, and Terraform 1.5+

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy.DESTROY, no RETAIN policies)
- Include environmentSuffix parameter as constructor argument
- Pass environmentSuffix to all resource names for multi-deployment support
- Ensure S3 buckets can be deleted (force_destroy=True for development/testing)
- VPC CIDR must be /16 to accommodate future growth
- Each availability zone must have exactly one public and one private subnet
- NAT Gateways must be deployed in each AZ for high availability
- All route tables must have explicit associations
- VPC Flow Logs must capture ALL traffic types
- S3 lifecycle policy must transition logs to Glacier after 30 days

### Constraints

- VPC CIDR must be 10.0.0.0/16 (exactly as specified)
- Subnet CIDR blocks must be /24 and non-overlapping
- Must deploy across exactly 3 availability zones in the configured region
- Each AZ requires both public and private subnet
- NAT Gateways cannot be shared across availability zones
- Flow logs must capture accepted, rejected, and all traffic types
- S3 lifecycle transition must occur at exactly 30 days
- Network ACLs must explicitly deny all traffic by default
- All resources must be tagged with Environment={environmentSuffix} and Project=DigitalBanking
- No reliance on default main route table
- All resources must include environmentSuffix in names
- Code must follow CDKTF Python best practices and conventions

### Success Criteria

- Functionality: All 11 requirements implemented and verified
- High Availability: Redundant NAT Gateways across all availability zones
- Security: Network ACLs configured with explicit deny rules, VPC Flow Logs enabled
- Compliance: Flow logs stored in S3 with 30-day Glacier transition
- Resource Naming: All resources include environmentSuffix for deployment isolation
- Code Quality: Python code following CDKTF conventions, well-structured, documented
- Deployability: Code synthesizes valid Terraform configuration
- Destroyability: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete CDKTF Python implementation with all infrastructure components
- VPC with DNS support and specified CIDR block
- Six subnets across three availability zones in the configured region (public and private pairs)
- Internet Gateway attached to VPC
- Three NAT Gateways with Elastic IPs (one per AZ)
- Route tables for public and private subnets with appropriate routes
- S3 bucket with versioning and 30-day Glacier lifecycle policy
- VPC Flow Logs configuration capturing all traffic to S3
- Custom Network ACLs with explicit baseline deny rules
- Proper resource tagging (Environment, Project)
- Stack outputs for VPC ID, subnet IDs, and NAT Gateway IPs
- README documentation with deployment instructions
- Code that can be synthesized and deployed without errors
