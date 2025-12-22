Hey team,

We need to build a production-ready network foundation for a financial services startup launching a trading platform. They're dealing with payment card data, so PCI-DSS compliance is critical, and they need strict network isolation between application tiers. I've been asked to create this using **CloudFormation with YAML**.

The business wants a multi-AZ VPC setup that provides high availability and proper security segmentation. This will be the foundation for their entire trading platform infrastructure, so it needs to be rock solid. They've specified three availability zones in us-east-1 with both public and private subnets in each AZ to support different application tiers.

The network design needs to support future deployments of RDS databases in the private subnets and application load balancers in the public subnets. We also need to ensure that resources in private subnets can reach the internet for updates and external API calls, but without exposing them directly to inbound internet traffic.

## What we need to build

Create a multi-AZ VPC infrastructure using **CloudFormation with YAML** for a production trading platform.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with 10.0.0.0/16 CIDR block
   - Enable DNS hostnames and DNS resolution
   - Deploy across three availability zones in us-east-1

2. **Public Subnet Tier**
   - Deploy three public subnets across three AZs
   - Use CIDR blocks 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Attach Internet Gateway for direct internet access
   - Route all outbound traffic (0.0.0.0/0) to Internet Gateway

3. **Private Subnet Tier**
   - Deploy three private subnets across the same three AZs
   - Use CIDR blocks 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - No direct internet access for enhanced security

4. **High Availability NAT Configuration**
   - Create three NAT Gateways, one per public subnet
   - Allocate Elastic IP for each NAT Gateway
   - Configure each private subnet to route 0.0.0.0/0 to its AZ's NAT Gateway
   - Ensure fault isolation across availability zones

5. **Security Group Setup**
   - Create foundational security group for HTTPS traffic
   - Allow inbound HTTPS (port 443) from anywhere (0.0.0.0/0)
   - Allow all outbound traffic

6. **Tagging and Organization**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=TradingPlatform
   - Resource names must include environmentSuffix for uniqueness

7. **Stack Outputs**
   - Export VPC ID for cross-stack references
   - Export all subnet IDs (public and private)
   - Export security group ID
   - Make outputs available for other CloudFormation stacks

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** for network isolation
- Use **EC2 Subnet** for public and private network segments
- Use **Internet Gateway** for public subnet internet access
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Elastic IP** for NAT Gateway addresses
- Use **Route Table** for traffic routing configuration
- Use **Security Group** for network-level access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Explicitly specify availability zones: us-east-1a, us-east-1b, us-east-1c

### Constraints

- VPC CIDR block must be exactly 10.0.0.0/16
- Each availability zone must have exactly one public subnet and one private subnet
- NAT Gateways must be deployed in high-availability mode across all three AZs
- All route tables must include explicit routes for local traffic
- Security group rules must be defined inline rather than as separate resources
- All resources must be destroyable (no Retain policies)
- Include proper tags for all resources

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter for unique naming
- No DeletionPolicy: Retain or RemovalPolicy: RETAIN allowed
- All resources must be fully destroyable for clean teardown
- Stack must support multiple deployments in same account/region

## Success Criteria

- Functionality: All three AZs have working public and private subnets with proper routing
- Performance: NAT Gateways provide high-throughput internet access for private subnets
- Reliability: Multi-AZ design ensures no single point of failure
- Security: Private subnets isolated from direct internet access, HTTPS security group configured
- Resource Naming: All resources include environmentSuffix for unique identification
- Code Quality: Clean YAML, well-documented, follows CloudFormation best practices
- Outputs: All required IDs exported for cross-stack references

## What to deliver

- Complete CloudFormation YAML template
- VPC with DNS support enabled
- Three public subnets and three private subnets across three AZs
- Internet Gateway for public subnets
- Three NAT Gateways with Elastic IPs for private subnet internet access
- Route tables configured for proper traffic flow
- Security group for HTTPS access
- Proper tagging on all resources
- Stack outputs for VPC ID, subnet IDs, and security group ID
- Documentation and deployment instructions
