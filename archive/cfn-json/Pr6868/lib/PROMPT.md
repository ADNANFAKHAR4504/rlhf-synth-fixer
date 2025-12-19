Hey team,

We need to build the network foundation for our new payment processing platform. I've been asked to create this in JSON using CloudFormation. The business needs a highly available VPC architecture that can support PCI-DSS compliant workloads across multiple availability zones with proper network segmentation and security controls.

This is critical infrastructure for our fintech startup, so we need to get it right from day one. The architecture should support future growth while maintaining strict security boundaries between different application tiers. We're talking production-grade networking with high availability, proper security groups, and comprehensive logging.

## What we need to build

Create a highly available VPC infrastructure using **CloudFormation with JSON** for a payment processing platform.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with 10.0.0.0/16 CIDR block
   - Enable DNS hostnames and DNS resolution for service discovery
   - Deploy across 3 availability zones in us-east-1 for high availability

2. **Subnet Architecture**
   - Deploy 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
   - Deploy 6 private subnets (10.0.11.0/24 through 10.0.16.0/24) with 2 per AZ
   - Use non-overlapping CIDR blocks for proper network segmentation

3. **Internet Connectivity**
   - Create Internet Gateway and attach to VPC
   - Configure proper route table associations for public subnets
   - Deploy 3 NAT Gateways (one per AZ) with Elastic IPs for private subnet outbound connectivity

4. **Security Controls**
   - Create bastion host security group allowing SSH from specific IP parameter
   - Create application security group with ingress from ALB only on ports 80/443
   - Implement Network ACLs with explicit deny-all and specific allow rules for ports 443, 80, 22
   - Follow least-privilege principle with no 0.0.0.0/0 inbound rules in security groups

5. **Monitoring and Logging**
   - Configure VPC Flow Logs to CloudWatch Logs with KMS encryption
   - Set 30-day retention for CloudWatch log groups
   - Enable logging for all network traffic for compliance requirements

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **KMS** for encryption of log data
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-type-${EnvironmentSuffix}`
- Deploy to **us-east-1** region
- All route tables must use explicit subnet associations, no main route table modifications

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Deletion protection must be disabled to allow clean teardown in CI/CD pipelines
- Use CloudFormation parameters for flexible configuration (CIDR blocks, allowed IPs)
- Proper parameter validation with CloudFormation constraints
- Export stack outputs for cross-stack references by other infrastructure

### Constraints

- VPC must span exactly 3 availability zones
- Each availability zone must have exactly one public and two private subnets
- NAT Gateways must be deployed in each AZ for high availability
- Security groups must follow least-privilege access
- VPC Flow Logs must use KMS encryption
- Network ACLs must explicitly deny all traffic except required ports
- All resources must be tagged with Environment, Owner, and CostCenter tags
- Template must be valid CloudFormation JSON format

## Success Criteria

- **Functionality**: Complete VPC with 3 AZs, 9 subnets, NAT Gateways, security groups
- **High Availability**: Multi-AZ deployment with redundant NAT Gateways
- **Security**: Proper network segmentation, security groups, NACLs, encrypted logs
- **Compliance**: PCI-DSS ready with proper network isolation and logging
- **Resource Naming**: All resources include EnvironmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly torn down after testing
- **Code Quality**: Valid CloudFormation JSON, proper parameters, documented

## What to deliver

- Complete CloudFormation JSON template
- VPC with DNS support enabled
- 3 public subnets and 6 private subnets across 3 AZs
- Internet Gateway with route table associations
- 3 NAT Gateways with Elastic IPs
- Security groups for bastion and application tiers
- Network ACLs with explicit rules
- VPC Flow Logs with CloudWatch Logs and KMS encryption
- CloudFormation parameters for flexibility
- Stack outputs for cross-stack references
- Proper resource tagging
- Documentation and deployment instructions
