# Payment Processing VPC Infrastructure

Hey team,

We've been brought on by a fintech startup that's launching their payment processing application on AWS. This is a critical workload that needs to meet PCI DSS compliance requirements right out of the gate. The business is adamant about security and high availability - they can't afford any downtime or security incidents when handling customer payment data.

The challenge here is establishing a rock-solid network foundation that provides proper segmentation between different tiers of their application. We're talking about a classic three-tier architecture: public-facing resources in a DMZ, application servers in private subnets, and the most sensitive payment processing components completely isolated from direct internet access. The infrastructure needs to span multiple availability zones for resilience, which means we'll need redundant NAT Gateways and carefully planned subnet layouts.

I've been asked to build this using **Terraform with HCL** to provision the entire networking stack. The security team has emphasized that network segmentation is non-negotiable for PCI DSS compliance, and the operations team wants comprehensive flow logs for audit trails and incident investigation.

## What we need to build

Create a production-ready VPC infrastructure using **Terraform with HCL** for a payment processing fintech application with PCI DSS compliance requirements.

### Core Requirements

1. **VPC Foundation**
   - VPC with appropriately sized CIDR block for growth
   - Support for multiple availability zones with minimum 2 AZs
   - DNS hostname and DNS resolution enabled

2. **Network Segmentation - Three-Tier Architecture**
   - Public subnets for internet-facing resources like load balancers and bastion hosts
   - Private subnets for application tier with application servers
   - Isolated subnets for data tier including payment processing and databases
   - Each tier deployed across multiple AZs

3. **Internet Connectivity**
   - Internet Gateway for public subnet internet access
   - NAT Gateways in each availability zone for high availability
   - Proper route tables for each subnet tier

4. **Security Controls**
   - Security Groups following least privilege principle
   - Network ACLs for defense in depth at subnet level
   - No direct internet access to private or isolated subnets
   - VPC Flow Logs enabled for security monitoring and compliance

5. **High Availability**
   - Multi-AZ deployment across at least 2 availability zones
   - Redundant NAT Gateways with one per AZ
   - Subnets distributed across AZs for each tier

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Security Groups** for instance-level security
- Use **Network ACL** for subnet-level security
- All resource names must include the environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-purpose-environment-suffix format
- Deploy to **us-east-1** region
- All resources must be destroyable with no Retain policies

### PCI DSS Compliance Requirements

- Network segmentation between DMZ, application, and database tiers
- No direct internet routing to sensitive isolated tier subnets
- Security groups with specific port restrictions
- Network ACLs providing additional network-level filtering
- VPC Flow Logs capturing traffic for audit requirements
- Proper tagging for compliance tracking

### Deployment Requirements - CRITICAL

- Every infrastructure component name must include the environmentSuffix parameter for multi-environment support
- All resources must use DeletionPolicy Delete or RemovalPolicy DESTROY with no Retain policies
- Infrastructure must be completely destroyable for testing environments
- VPC Flow Logs should write to CloudWatch Logs with appropriate IAM role
- NAT Gateways require Elastic IPs so ensure proper allocation

### Constraints

- Must support multiple environments through parameterization
- CIDR blocks should not overlap with common corporate networks
- Subnet sizing should allow for future growth
- All resources must support tagging for cost allocation
- Must be deployable in a single Terraform apply operation
- Include proper error handling and validation

## Success Criteria

- **Functionality**: Complete three-tier network architecture with proper routing
- **Performance**: Low-latency routing between tiers, redundant NAT for high throughput
- **Reliability**: Multi-AZ deployment with no single points of failure
- **Security**: Network segmentation, least privilege security groups, flow logs enabled
- **Compliance**: Meets PCI DSS network segmentation and audit requirements
- **Naming Convention**: All resources include environmentSuffix parameter
- **Code Quality**: Clean HCL, well-tested, properly documented
- **Destroyability**: All resources can be cleanly destroyed with no Retain policies

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- Main configuration with VPC, subnets, route tables, gateways
- Security group and network ACL configurations
- VPC Flow Logs with CloudWatch integration
- Variables file for customization (CIDR blocks, environment suffix, AZ count)
- Outputs file with key resource IDs and attributes
- Unit tests validating resource configurations
- Integration tests confirming deployed infrastructure
- Documentation with deployment instructions and architecture overview
