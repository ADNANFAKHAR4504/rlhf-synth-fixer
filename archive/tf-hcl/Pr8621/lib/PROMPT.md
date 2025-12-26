Hey team,

We've got a startup launching their first production workload on AWS and they need a solid network foundation to build on. They want to follow AWS best practices for security and scalability but need to keep things cost-effective for their initial deployment. I've been asked to create this infrastructure using Terraform with HCL.

The business is looking for a production-ready VPC setup that can handle their current needs while leaving room to grow. They want everything properly segmented with public and private subnets across multiple availability zones for high availability. The architecture needs to support web tier services in public subnets and keep application and database tiers secured in private subnets.

One key consideration here is cost optimization. The team specifically wants only 2 NAT Gateways instead of 3 to reduce monthly expenses during their startup phase. This is a smart move that still maintains good availability without the full cost of NAT Gateways in all AZs.

## What we need to build

Create a production-ready VPC infrastructure using **Terraform with HCL** for a startup's initial AWS deployment.

### Core Requirements

1. **VPC Foundation**
   - VPC with CIDR block 10.0.0.0/16
   - DNS hostnames must be enabled for proper service discovery
   - Tag all resources with Environment and Project tags

2. **Public Subnet Architecture**
   - Deploy 3 public subnets across 3 availability zones
   - Use CIDR blocks: 10.0.1.0/24, 10.0.3.0/24, 10.0.5.0/24
   - Public subnets use the first half of each AZ's CIDR range
   - Configure route tables with routes to Internet Gateway

3. **Private Subnet Architecture**
   - Deploy 3 private subnets across the same 3 availability zones
   - Use CIDR blocks: 10.0.2.0/24, 10.0.4.0/24, 10.0.6.0/24
   - Private subnets use the second half of each AZ's CIDR range
   - Configure route tables with routes to appropriate NAT Gateway

4. **Internet Connectivity**
   - Create and attach Internet Gateway to VPC
   - Deploy 2 NAT Gateways with Elastic IPs in first two public subnets only
   - This reduces costs while maintaining good availability

5. **Security Configuration**
   - Create default security group
   - Allow HTTPS inbound from anywhere (0.0.0.0/0)
   - Allow all outbound traffic
   - Define security group rules inline rather than as separate resources

6. **Route Table Configuration**
   - Explicitly associate route tables with their respective subnets
   - Public subnets route internet-bound traffic to Internet Gateway
   - Private subnets route internet-bound traffic to NAT Gateways

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Provider 5.x** for compatibility
- Require **Terraform 1.5+** version
- Use **VPC** for network foundation
- Use **Subnet** resources (6 total: 3 public, 3 private)
- Use **InternetGateway** for public subnet connectivity
- Use **NATGateway** resources (2 total) with **EIP** resources
- Use **RouteTable** resources with proper associations
- Use **SecurityGroup** with inline rules
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {vpc-name}-{resource-type}

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16 to accommodate future growth
- Public subnets must use first half of each AZ CIDR range (odd third octet)
- Private subnets must use second half of each AZ CIDR range (even third octet)
- NAT Gateways deployed only in first two availability zones for cost optimization
- All resources must be tagged with Environment and Project tags
- Route tables must be explicitly associated with subnets
- Internet Gateway and NAT Gateway names must follow pattern: {vpc-name}-{resource-type}
- Security group rules must be defined inline, not as separate resources
- All resources must be destroyable with no Retain policies
- Include proper resource dependencies for correct creation order

## Success Criteria

- Functionality: VPC with 6 subnets across 3 AZs, proper routing, and security
- Performance: NAT Gateways in 2 AZs for cost-effective outbound connectivity
- Reliability: Multi-AZ architecture with proper subnet distribution
- Security: Private subnets isolated from internet, public subnets with controlled access
- Resource Naming: All resources include environmentSuffix and follow naming convention
- Code Quality: HCL, well-structured, with variables for reusability

## What to deliver

- Complete Terraform HCL implementation with main.tf
- Variables file (variables.tf) defining reusable variables for VPC name, environment, and project tags
- VPC resource with DNS hostnames enabled
- 3 public subnets (10.0.1.0/24, 10.0.3.0/24, 10.0.5.0/24)
- 3 private subnets (10.0.2.0/24, 10.0.4.0/24, 10.0.6.0/24)
- Internet Gateway with attachment
- 2 NAT Gateways with Elastic IPs
- Route tables with proper subnet associations
- Security group with inline HTTPS inbound and all outbound rules
- Proper resource dependencies and tagging
- Documentation with deployment instructions
