# VPC Foundation for Payment Processing Platform

Hey team,

We need to build a production-grade VPC foundation for our fintech startup's payment processing platform. I've been asked to create this using **CDKTF with Python**. The business wants a secure, multi-tier network architecture that complies with PCI DSS requirements for network segmentation. We're hosting web servers in public subnets while keeping application and database tiers isolated in private subnets with controlled internet access.

The infrastructure needs to span three availability zones in us-east-1 for high availability. Each AZ will have both public and private subnets, with NAT Gateways providing outbound connectivity for private resources. We also need comprehensive security groups that enforce least-privilege access between tiers, and VPC Flow Logs for compliance auditing.

This is the foundational layer for our entire platform, so it needs to be rock-solid and follow AWS best practices. The team has standardized on CDKTF with Python to maintain consistency across our infrastructure codebase.

## What we need to build

Create a production-grade VPC networking foundation using **CDKTF with Python** for a fintech payment processing platform.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - All resources must include environmentSuffix in names for uniqueness

2. **Public Subnet Tier**
   - Deploy 3 public subnets across different availability zones
   - Subnet CIDRs: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Associate with Internet Gateway for inbound/outbound internet access
   - Public route table with 0.0.0.0/0 pointing to IGW

3. **Private Subnet Tier**
   - Deploy 3 private subnets in the same availability zones
   - Subnet CIDRs: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Each private subnet routes through its own NAT Gateway
   - Separate route tables per AZ for private subnets

4. **Internet Gateway**
   - Attach Internet Gateway to VPC
   - Configure proper route table associations for public subnets

5. **NAT Gateway Configuration**
   - Create 3 NAT Gateways, one per availability zone
   - Each NAT Gateway deployed in corresponding public subnet
   - Allocate Elastic IPs for each NAT Gateway
   - Tag all Elastic IPs with 'Purpose: NAT' for cost tracking

6. **Security Groups**
   - web-sg: Allow inbound traffic on ports 80 and 443 from 0.0.0.0/0
   - app-sg: Allow inbound traffic on port 8080 from web-sg only
   - db-sg: Allow inbound traffic on port 5432 from app-sg only
   - Follow least-privilege principle for all rules

7. **VPC Flow Logs**
   - Enable VPC Flow Logs to CloudWatch Logs
   - Create CloudWatch Log Group with 7-day retention policy
   - Create IAM role with proper permissions for Flow Logs service
   - Attach policy allowing logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents

8. **Outputs**
   - Export VPC ID
   - Export all subnet IDs grouped by type (public/private)
   - Export all security group IDs

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider with us-east-1 region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- All resources must be destroyable (no deletion protection or Retain policies)
- Use appropriate CDKTF constructs for VPC components
- Implement proper resource dependencies

### Constraints

- VPC CIDR must use exactly 10.0.0.0/16 range with specified subnet allocations
- Deploy across exactly 3 availability zones in us-east-1
- All NAT Gateways must use static Elastic IPs with specific tags
- Security groups must follow least-privilege with no 0.0.0.0/0 ingress except web-sg ports 80/443
- All resources must include mandatory tags: Environment, CostCenter, Owner, CreatedBy
- Route tables must explicitly define all routes including local traffic
- All resources must be destroyable without manual intervention
- Include proper error handling and validation

### Deployment Requirements (CRITICAL)

- Resource names MUST include environmentSuffix for uniqueness across deployments
- Format: {resource-type}-{purpose}-{environmentSuffix}
- All resources MUST be destroyable (no Retain policies, no deletion protection)
- NAT Gateways can be slow to provision - ensure proper dependency management
- VPC Flow Logs require specific IAM role with trust relationship to vpc-flow-logs.amazonaws.com
- CloudWatch Log Group must exist before Flow Logs are created

## Success Criteria

- Functionality: Complete VPC with proper network segmentation across 3 AZs
- Performance: Low-latency routing with NAT Gateways in each AZ
- Reliability: Multi-AZ architecture with redundant NAT Gateways
- Security: Proper security group isolation between tiers, Flow Logs enabled
- Compliance: PCI DSS network segmentation requirements met
- Resource Naming: All resources include environmentSuffix in names
- Code Quality: Clean Python code, well-structured CDKTF stacks, comprehensive documentation
- Destroyability: All resources can be destroyed via cdktf destroy without errors

## What to deliver

- Complete CDKTF Python implementation
- VPC with proper DNS settings
- 3 public subnets and 3 private subnets across availability zones
- Internet Gateway with route table associations
- 3 NAT Gateways with Elastic IPs (tagged appropriately)
- Security groups for web, app, and database tiers
- VPC Flow Logs with CloudWatch integration and IAM role
- Proper outputs for VPC ID, subnet IDs, and security group IDs
- Unit tests for infrastructure validation
- README with deployment instructions and architecture overview
