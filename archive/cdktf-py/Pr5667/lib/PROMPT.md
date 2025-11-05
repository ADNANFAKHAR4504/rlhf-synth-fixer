# Custom VPC Environment Setup

Hey team,

We're setting up our first AWS cloud environment for a startup that needs a proper network foundation. They want to separate their public-facing services from internal resources while keeping costs under control. The business needs a secure, scalable VPC architecture that can support their application workloads from day one.

This is a greenfield deployment, so we're building everything from scratch. The team has specified exact network requirements including CIDR blocks, subnet configurations, and specific tagging conventions they use for cost allocation. Everything needs to deploy to eu-central-2 region (or region specified via AWS_REGION environment variable or lib/AWS_REGION file).

We need to implement this using **CDKTF with Python** - no exceptions on the platform or language choice. The infrastructure needs to follow AWS networking best practices while optimizing for cost, which means using a single NAT Gateway instead of one per AZ.

## What we need to build

Create a custom VPC architecture using **CDKTF with Python** that provides network segmentation and prepares the environment for application deployments.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16 in eu-central-2 region (or region from AWS_REGION env var/lib/AWS_REGION file)
   - Enable VPC Flow Logs to CloudWatch with 5-minute capture intervals
   - Create VPC endpoints for S3 and DynamoDB (must be Gateway endpoints)

2. **Network Topology**
   - Deploy across exactly 2 availability zones only
   - Create one public subnet and one private subnet per AZ (4 subnets total)
   - Public subnets: 10.0.1.0/24 and 10.0.2.0/24
   - Private subnets: 10.0.11.0/24 and 10.0.12.0/24

3. **Internet Connectivity**
   - Deploy a single NAT Gateway in the first public subnet only
   - Create Internet Gateway for public subnet internet access
   - Configure custom route tables (do not use defaults)
   - Public route table with IGW route
   - Private route table with NAT Gateway route

4. **Resource Tagging**
   - Tag all resources with Environment=development
   - Tag all resources with CostCenter=engineering
   - All resource names must include environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use CDKTF L1 CfnResources (no L2 constructs in CDKTF)
- Import from cdktf_cdktf_provider_aws package
- Stack implementation in TapStack class
- Resource names must include **environmentSuffix** variable
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **eu-central-2** region (or region specified via AWS_REGION environment variable or lib/AWS_REGION file)
- Use TerraformOutput for outputs (not CfnOutput)

### Constraints

- VPC CIDR block must be exactly 10.0.0.0/16
- Deploy in exactly 2 availability zones only
- Use only one NAT Gateway to minimize costs
- Route tables must be explicitly created, not use defaults
- VPC endpoints must be Gateway endpoints, not Interface endpoints
- All resources must be destroyable (no Retain policies)
- Subnet CIDR blocks must follow exact numbering scheme specified
- Include proper error handling and logging

## Success Criteria

- **Functionality**: VPC with proper network segmentation operational
- **Performance**: Network routing configured correctly between subnets
- **Reliability**: Resources deployed across 2 availability zones
- **Security**: Private subnets isolated, flow logs enabled
- **Cost Optimization**: Single NAT Gateway reduces monthly costs
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Python code, well-tested, properly documented
- **Outputs**: VPC ID, all subnet IDs, and NAT Gateway ID exported

## What to deliver

- Complete CDKTF Python implementation in lib/lib/tap_stack.py
- VPC, subnets, route tables, Internet Gateway, NAT Gateway
- VPC Flow Logs with CloudWatch integration
- Gateway endpoints for S3 and DynamoDB
- Custom route tables with appropriate routes
- TerraformOutput for VPC ID, subnet IDs, NAT Gateway ID
- Comprehensive unit tests for all components
- Integration tests validating deployed resources
- Documentation including deployment instructions and architecture overview
