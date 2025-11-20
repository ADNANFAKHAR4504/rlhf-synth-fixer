Hey team,

We're building a secure cloud foundation for a financial services startup that's launching a payment processing application. The infrastructure needs to meet PCI-DSS compliance requirements right from the start, which means we need to be really careful about network segmentation and security controls.

The business is bringing payment processing workloads to AWS, and they need separate environments for development and production that are completely isolated from each other. Since this involves handling credit card data, we're under strict compliance requirements - PCI-DSS mandates specific network segmentation patterns and security controls that we must implement from day one.

The platform team has asked us to build this using **CloudFormation with JSON** to maintain consistency with their existing infrastructure management approach. They want a production-ready VPC that can scale across multiple availability zones and provide proper isolation between different application tiers.

## What we need to build

Create a secure, multi-tier VPC infrastructure using **CloudFormation with JSON** for a payment processing system that meets PCI-DSS compliance requirements.

### Core Requirements

1. **Multi-AZ VPC Architecture**
   - VPC with properly sized CIDR block for future growth
   - Deployment across at least 2 Availability Zones for high availability
   - Public and private subnets in each AZ
   - Separate subnet tiers for web, application, and database layers
   - Internet Gateway for public subnet connectivity
   - NAT Gateway(s) in public subnets for private subnet internet access

2. **Network Segmentation for PCI-DSS**
   - Distinct subnets for each tier: web (DMZ), application, and database
   - Network ACLs for subnet-level traffic control
   - Proper routing tables for public and private subnets with correct associations
   - Isolation between production and non-production environments through network design
   - Clear network boundaries between cardholder data environment and other zones

3. **Security Groups**
   - Web tier security group with controlled ingress from internet
   - Application tier security group allowing only web tier traffic
   - Database tier security group allowing only application tier traffic
   - Least privilege access principles enforced
   - Proper egress rules for each tier
   - All security groups must include environmentSuffix in names for uniqueness

4. **Logging and Monitoring**
   - VPC Flow Logs enabled for network traffic monitoring
   - Flow logs capturing both accepted and rejected traffic
   - Logs stored in CloudWatch Logs for analysis and audit

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use AWS VPC for network foundation
- Use EC2 NAT Gateways for private subnet internet access
- Use Internet Gateway for public subnet connectivity
- Deploy to us-east-1 region
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain deletion policies
- CloudFormation template must be properly parameterized for flexibility
- Include comprehensive outputs for all critical resource IDs

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All resource names must include an environmentSuffix parameter to ensure uniqueness across multiple deployments. This is mandatory for testing and multi-environment support.
- **Destroyability Requirement**: All resources must use Delete or no RemovalPolicy. Do not use Retain policies. Resources must be completely removable during stack deletion.
- **No Account-Level Resources**: Be cautious with services that have account-level limitations or require special handling.

### Constraints

- Must follow AWS best practices for VPC design with multi-AZ deployment
- CIDR blocks must not overlap and should allow for future expansion
- Security groups must implement defense in depth
- All network traffic must be logged for compliance
- Public subnets only for resources requiring direct internet access
- Private subnets for application and database tiers
- Cost optimization: consider NAT Gateway placement carefully
- All resources must be production-ready and support high availability

## Success Criteria

- **Functionality**: Complete VPC infrastructure with multi-AZ support, proper subnet segmentation, working internet and NAT gateways, and functional routing
- **Security**: Network segmentation meets PCI-DSS requirements, security groups follow least privilege, network ACLs provide subnet-level protection
- **Compliance**: VPC Flow Logs enabled and capturing all traffic, clear isolation between tiers, audit trail available
- **High Availability**: Resources deployed across multiple AZs, no single points of failure in network design
- **Resource Naming**: All resources include environmentSuffix for uniqueness and testing
- **Code Quality**: Valid CloudFormation JSON syntax, well-structured template, comprehensive parameters and outputs
- **Destroyability**: Stack can be completely deleted without retained resources

## What to deliver

- Complete CloudFormation template in JSON format (lib/TapStack.json)
- VPC with Internet Gateway and NAT Gateway(s)
- Public and private subnets across multiple AZs for web, application, and database tiers
- Route tables with proper associations
- Network ACLs for subnet-level security
- Security groups for web, app, and database tiers with least privilege rules
- VPC Flow Logs for network monitoring
- CloudFormation parameters including environmentSuffix
- Outputs for VPC ID, subnet IDs, security group IDs, and other resources
- Comprehensive documentation in README.md
