Hey team,

We have a fintech startup that needs to establish secure connectivity between their payment processing environment and analytics platform running in separate AWS accounts. They're dealing with sensitive payment data, so everything needs to be PCI DSS compliant with strict network isolation and controlled access patterns.

I've been asked to create this infrastructure using **CDKTF with Python**. The business wants a multi-account VPC peering setup that allows secure communication between these two critical environments while maintaining proper isolation for compliance.

The payment processing team works in one AWS account and the analytics team in another. They need to share specific data securely - mainly HTTPS traffic and PostgreSQL database connections between certain subnets. We need to ensure that only authorized traffic flows between the accounts while keeping everything else isolated.

## What we need to build

Create a multi-account VPC peering infrastructure using **CDKTF with Python** for a fintech company's payment and analytics environments.

### Core Requirements

1. **VPC Infrastructure**
   - Two VPCs with non-overlapping CIDR ranges (10.0.0.0/16 for payment, 10.1.0.0/16 for analytics)
   - Public and private subnets in each VPC across three availability zones for high availability
   - Internet gateways for public subnet internet access
   - All VPC and subnet names must include **environmentSuffix** parameter for uniqueness

2. **VPC Peering Connection**
   - Establish VPC peering connection between the two accounts
   - Enable auto-accept for the peering connection
   - Configure route tables to enable traffic flow between private subnets only (not public)

3. **Network Security**
   - Security groups allowing HTTPS (port 443) and PostgreSQL (port 5432) traffic between specific subnets
   - Network ACLs restricting inbound traffic to only ports 443, 5432, and 22 from the peered VPC
   - No direct internet access from private subnets except through NAT gateways

4. **Internet Access**
   - Deploy NAT gateways in each public subnet for outbound internet access from private subnets
   - One NAT gateway per availability zone for redundancy

5. **Monitoring and Logging**
   - Enable VPC flow logs for both VPCs
   - Store flow logs in S3 buckets with 90-day lifecycle policy
   - S3 bucket names must include **environmentSuffix** parameter

6. **DNS Resolution**
   - Configure Route 53 private hosted zones for cross-VPC DNS resolution
   - Associate hosted zones with both VPCs
   - Hosted zone names must include **environmentSuffix** parameter

7. **Resource Tagging**
   - Apply consistent tagging scheme with Environment, Project, and CostCenter tags
   - Tags should clearly identify resources by purpose and cost allocation

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** for network isolation (10.0.0.0/16 and 10.1.0.0/16)
- Use **Subnets** for segmentation across 3 availability zones
- Use **VPC Peering Connection** for cross-account connectivity
- Use **Route Tables** for traffic routing between VPCs
- Use **Security Groups** for instance-level security (ports 443, 5432)
- Use **NAT Gateways** for outbound internet access
- Use **VPC Flow Logs** for network monitoring
- Use **S3** for flow logs storage with lifecycle policies
- Use **Route 53 Private Hosted Zones** for DNS resolution
- Use **Network ACLs** for subnet-level security (ports 443, 5432, 22)
- Use **Internet Gateways** for public subnet connectivity
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Modular code structure with separate files for networking, security, and DNS components

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL resources (VPCs, subnets, S3 buckets, Route53 zones, etc.) must include an environmentSuffix parameter in their names for uniqueness. This is required for multi-environment deployments.
- **Destroyable Resources**: All resources must be destroyable. DO NOT use RemovalPolicy.RETAIN or enable DeletionProtection on any resource. Resources should use RemovalPolicy.DESTROY or equivalent.
- **Multi-Account Setup**: Code must handle cross-account VPC peering. Include clear documentation on required IAM permissions and account setup.
- **No Manual Resources**: Do not create resources like GuardDuty detectors that are account-level and may already exist. Code must handle existing resources gracefully.

### Constraints

- Must comply with PCI DSS standards for payment data security
- Private subnets must not have direct internet access (only through NAT gateways)
- Only specified ports (443, 5432, 22) allowed between VPCs
- Cross-account peering requires proper IAM permissions and accepter configuration
- All resources must be destroyable (no Retain policies or deletion protection)
- S3 buckets for flow logs must have lifecycle policies (90-day retention)
- Network ACLs must be stateless and properly configured for bidirectional traffic
- Include proper error handling and logging in the code

## Success Criteria

- **Functionality**: Both VPCs can communicate via peering connection with controlled access
- **Performance**: NAT gateways provide reliable outbound internet access
- **Reliability**: Multi-AZ deployment ensures high availability
- **Security**: Network ACLs and security groups enforce PCI DSS compliant access controls
- **Monitoring**: VPC flow logs capture all network traffic for audit purposes
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean Python code, modular structure, well-tested, documented

## What to deliver

- Complete CDKTF Python implementation with modular structure
- VPC infrastructure (2 VPCs, subnets across 3 AZs, internet gateways)
- VPC peering connection with route table configurations
- Security groups and network ACLs for controlled access
- NAT gateways for internet access
- VPC flow logs with S3 storage and lifecycle policies
- Route 53 private hosted zones for DNS resolution
- Comprehensive unit tests for all components
- Documentation including deployment instructions and multi-account setup guide
- Clear variable definitions for environmentSuffix and other configurable parameters
