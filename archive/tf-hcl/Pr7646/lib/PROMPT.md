Hey team,

We need to build a production-ready VPC networking environment for our cloud infrastructure. The business wants a secure, scalable network foundation that supports both public-facing services and private backend resources. This is a foundational setup that other teams will build upon, so it needs to be rock-solid and follow AWS best practices.

The network architecture should support typical web application patterns where we have public-facing resources like load balancers or bastion hosts in public subnets, while keeping our application servers and databases secured in private subnets. We need proper internet access for both subnet types - direct access for public resources and NAT-based access for private resources.

I've been asked to create this using **Terraform with HCL** for our us-east-1 region. The infrastructure should be flexible enough to support multiple availability zones for high availability, though we can start with two AZs to keep things manageable.

## What we need to build

Create a complete VPC networking infrastructure using **Terraform with HCL** for a production cloud environment.

### Core Requirements

1. **VPC Configuration**
   - Create a VPC with appropriate CIDR block for growth
   - Enable DNS hostnames and DNS support
   - Proper tagging for resource management

2. **Public Subnets**
   - Deploy public subnets across multiple availability zones
   - Associate with route table that routes to Internet Gateway
   - Enable auto-assign public IP for instances

3. **Private Subnets**
   - Deploy private subnets across multiple availability zones
   - Associate with route table that routes through NAT Gateway
   - No direct internet access

4. **Internet Gateway**
   - Attach Internet Gateway to VPC
   - Configure public route table to route internet traffic through IGW

5. **NAT Gateway**
   - Deploy NAT Gateway in public subnet for private subnet internet access
   - Allocate Elastic IP for NAT Gateway
   - Configure private route table to route internet traffic through NAT Gateway

6. **Route Tables**
   - Public route table with IGW route
   - Private route table with NAT Gateway route
   - Proper subnet associations

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use VPC for network isolation
- Use Subnets for network segmentation
- Use Internet Gateway for public internet access
- Use NAT Gateway for private subnet outbound access
- Use Route Tables for traffic routing
- Use Elastic IP for NAT Gateway static addressing
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Use variables for all configurable values (CIDR blocks, AZ count, etc.)

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable without manual intervention
- Use DeletionPolicy: Delete or remove_on_delete: true where applicable
- FORBIDDEN: retention policies, prevent_destroy lifecycle rules
- FORBIDDEN: skip_final_snapshot without allowing data loss
- Resource naming MUST include environmentSuffix parameter for uniqueness
- Example: vpc-dev-abc123, subnet-public-1-dev-abc123

### Constraints

- Multi-AZ deployment for high availability
- Use /16 or /20 CIDR blocks to allow room for growth
- Private subnets must not have direct internet access
- All traffic routing must be explicit and documented
- Include proper error handling and validation
- Follow AWS VPC best practices

### Success Criteria

- Functionality: VPC deployed with working public and private subnets
- Functionality: Internet connectivity verified for both subnet types
- Reliability: Multi-AZ setup for fault tolerance
- Security: Private subnets isolated from direct internet access
- Security: Appropriate security through network segmentation
- Resource Naming: All resources include environmentSuffix
- Code Quality: Clean HCL, well-tested, documented

## What to deliver

- Complete Terraform HCL implementation
- VPC with DNS support enabled
- Public and private subnets across multiple AZs
- Internet Gateway with proper routing
- NAT Gateway with Elastic IP
- Route tables with correct associations
- Variables file for configuration flexibility
- Outputs for resource IDs and network information
- Documentation on architecture and usage
