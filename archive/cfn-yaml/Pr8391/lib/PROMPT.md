Hey team,

We need to build out the foundational network infrastructure for a new digital banking platform that a financial services company is launching. This is a critical project because it needs to meet PCI-DSS compliance requirements right from the start. The business has made it clear that security and network segmentation are non-negotiable since we'll be handling customer financial data and transactions.

The platform architecture needs to support multiple types of workloads - customer-facing applications that need internet access, internal APIs that should remain private, and sensitive data processing systems that require strict isolation. The infrastructure team has asked us to set this up using **CloudFormation with YAML** to ensure everything is version controlled and reproducible.

What makes this challenging is that we need high availability across multiple availability zones while maintaining proper network segmentation. The compliance team has stressed that we need defense-in-depth principles baked into the infrastructure, not bolted on later. We're deploying to us-east-1 and need to make sure every component is redundant and fault-tolerant.

## What we need to build

Create a secure VPC foundation using **CloudFormation with YAML** for a PCI-DSS compliant digital banking platform.

### Core Requirements

1. **VPC Configuration**
   - VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution for service discovery
   - Proper tagging for compliance and resource management

2. **Multi-AZ Public Subnets**
   - Three public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Spread across us-east-1a, us-east-1b, us-east-1c for high availability
   - Connected to Internet Gateway for public-facing services

3. **Multi-AZ Private Subnets**
   - Three private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Same availability zone distribution as public subnets
   - Isolated from direct internet access

4. **Internet Connectivity**
   - Internet Gateway attached to VPC for public subnet connectivity
   - Three NAT Gateways, one in each public subnet for redundancy
   - Each NAT Gateway must have its own Elastic IP

5. **Routing Configuration**
   - Route tables for public subnets routing to Internet Gateway
   - Separate route table for each private subnet routing through its respective NAT Gateway
   - All private subnet route tables must be explicitly associated (cannot use main route table)

6. **Security Groups**
   - Web server security group: HTTPS (443) from anywhere, SSH (22) from 10.0.0.0/16 only
   - Database security group: PostgreSQL (5432) only from web server security group
   - All rules must include descriptions following least-privilege principles

7. **Stack Outputs**
   - VPC ID for other stacks to reference
   - All subnet IDs (public and private)
   - All security group IDs
   - Outputs must be export-ready for cross-stack references

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** for network isolation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Elastic IP** for NAT Gateway addressing
- Use **Route Tables** for traffic routing
- Use **Security Groups** for traffic filtering
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region with multi-AZ support

### Constraints

- VPC CIDR block must be exactly 10.0.0.0/16 with no overlapping subnets
- NAT Gateways must be deployed in high availability mode across all three availability zones
- All private subnet route tables must have explicit associations and cannot use the main route table
- Security group rules must include descriptions and follow least-privilege principles
- All resources must be tagged with Environment, Project, and Owner tags
- Template must use CloudFormation parameters for region-specific configurations
- All resources must be destroyable (no Retain deletion policies)
- Include proper resource dependencies to ensure correct creation order

### Success Criteria

- **Functionality**: VPC with proper public and private subnet segmentation across 3 AZs
- **Performance**: NAT Gateways in each AZ for redundant outbound connectivity
- **Reliability**: Multi-AZ architecture with no single points of failure
- **Security**: Security groups implementing defense-in-depth for PCI-DSS compliance
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Clean YAML, well-documented, follows CloudFormation best practices
- **Compliance**: Network architecture suitable for PCI-DSS requirements

## What to deliver

- Complete CloudFormation YAML implementation
- VPC with DNS support enabled
- Three public subnets and three private subnets across multiple AZs
- Internet Gateway for public connectivity
- Three NAT Gateways with Elastic IPs for high availability
- Route tables with proper associations
- Security groups for web servers and database servers
- Comprehensive outputs for all resource IDs
- Unit tests for template validation
- Documentation and deployment instructions
