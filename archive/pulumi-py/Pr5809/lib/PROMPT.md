Hey team,

We're setting up a production-ready VPC infrastructure for a financial services company that's launching a new trading platform on AWS. The business needs a secure, isolated network environment that follows AWS Well-Architected Framework principles with proper segmentation between public-facing services and internal systems. This is a critical foundation for their trading operations, so we need to get the network architecture right from the start.

The team has asked me to build this using **Pulumi with Python**. They want a highly available setup spanning multiple availability zones with proper redundancy and security controls. The trading platform will have load balancers in public subnets and application servers in private subnets, with VPC Flow Logs enabled for security compliance.

I've been working with the infrastructure team to understand their requirements. They need a solid VPC foundation that can support their production trading workloads while maintaining strict security and compliance standards. The network needs to be resilient, with redundant NAT Gateways across all zones and proper routing configurations.

## What we need to build

Create a production-grade VPC infrastructure using **Pulumi with Python** for a financial services trading platform in the us-east-1 region.

### Core Requirements

1. **VPC Configuration**
   - Create a VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Tag all resources with Environment='production', Project='trading-platform', ManagedBy='pulumi'

2. **Multi-AZ Subnet Architecture**
   - Deploy 6 subnets total across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - One public subnet and one private subnet per AZ
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Private subnets: 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
   - Follow naming pattern: '{env}-{type}-{az}' (e.g., 'production-public-us-east-1a')

3. **Internet Gateway**
   - Create Internet Gateway named 'prod-igw-us-east-1'
   - Attach to the VPC for public internet access

4. **High Availability NAT Gateways**
   - Deploy one NAT Gateway in each public subnet (3 total)
   - Create and associate Elastic IPs for each NAT Gateway
   - Ensure redundancy across all availability zones

5. **Route Tables and Routing**
   - Configure public route tables with default route (0.0.0.0/0) to Internet Gateway
   - Configure private route tables with default route to respective NAT Gateways in same AZ
   - Associate route tables with appropriate subnets

6. **VPC Flow Logs**
   - Enable VPC Flow Logs for the entire VPC
   - Send logs to CloudWatch Logs
   - Create log group with 7-day retention policy
   - Include IAM role with appropriate permissions for Flow Logs

7. **S3 VPC Endpoint**
   - Create Gateway-type S3 VPC endpoint
   - Associate with all private subnet route tables
   - Enable efficient AWS service access without internet gateway

8. **Network ACLs**
   - Configure Network ACLs to explicitly allow HTTP (port 80), HTTPS (port 443), and SSH (port 22) traffic
   - Apply security best practices for network-level controls

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **EC2 VPC** for virtual network isolation
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Internet Gateway** for public subnet internet access
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **S3 VPC Endpoint** (Gateway type) for private AWS service access
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{suffix}`
- Deploy to **us-east-1** region
- Span exactly 3 availability zones for high availability

### Constraints

- VPC must use a /16 CIDR block in the 10.0.0.0/8 range
- Deploy exactly 3 availability zones for high availability
- Each AZ must have one public and one private subnet
- NAT Gateways must be deployed in each AZ for redundancy
- All resources must be tagged with Environment, Project, and ManagedBy tags
- VPC Flow Logs must be enabled and sent to CloudWatch Logs with 7-day retention
- Network ACLs must explicitly allow only HTTP, HTTPS, and SSH traffic
- S3 VPC endpoint must be Gateway type and associated with private subnets
- Internet Gateway must follow naming format: 'prod-igw-{region}'
- All subnet names must follow the pattern: '{env}-{type}-{az}'
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

### Security Requirements

- Private subnets must route through NAT Gateways (no direct internet access)
- VPC Flow Logs enabled for audit and compliance
- Network ACLs configured for traffic filtering
- S3 VPC endpoint prevents data exfiltration through internet
- Consistent tagging for resource management and compliance

## Success Criteria

- **Functionality**: VPC spans 3 AZs with proper subnet segmentation and routing
- **High Availability**: Redundant NAT Gateways in each AZ
- **Security**: VPC Flow Logs enabled, Network ACLs configured, private subnet isolation
- **Performance**: S3 VPC endpoint for efficient AWS service access
- **Compliance**: 7-day log retention, proper tagging, audit trail
- **Resource Naming**: All resources include environmentSuffix and follow naming conventions
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation with __main__.py and stack module
- VPC with DNS support and proper CIDR allocation
- 6 subnets (3 public, 3 private) across 3 availability zones
- Internet Gateway with specified naming format
- 3 NAT Gateways with Elastic IPs for high availability
- Route tables with correct routing for public and private subnets
- VPC Flow Logs with CloudWatch Logs destination and IAM role
- S3 VPC endpoint (Gateway type) associated with private subnets
- Network ACLs allowing HTTP, HTTPS, and SSH traffic
- Stack outputs for VPC ID, subnet IDs grouped by type, and S3 endpoint ID
- Unit tests for all components
- Documentation and deployment instructions
