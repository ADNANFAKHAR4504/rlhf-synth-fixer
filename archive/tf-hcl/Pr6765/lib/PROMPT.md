# Hub-and-Spoke Network Architecture with AWS Transit Gateway

Hey team,

We need to build a hub-and-spoke network architecture for our multi-account AWS environment. The business is expanding rapidly with multiple application teams, and we're running into network connectivity challenges. Right now, teams are using VPC peering which creates a mesh that's becoming unmanageable. I've been asked to create this solution in HCL using Terraform to establish a centralized network hub that all spoke VPCs can connect through.

The core problem is network sprawl. Each time a new VPC needs to communicate with existing VPCs, we have to create multiple peering connections. With 10 VPCs, that's potentially 45 peering connections to manage. The business wants a scalable solution where adding new VPCs doesn't exponentially increase complexity. They also need proper network segmentation between production, staging, and development environments while maintaining centralized egress for internet traffic.

Our security team has specific requirements around network isolation and wants to ensure traffic flows are properly controlled. The operations team needs this to be easily deployable and destroyable for different environments, so we need to support environment-specific naming with a suffix pattern.

## What we need to build

Create a hub-and-spoke network topology using **Terraform with HCL** for AWS Transit Gateway deployment.

### Core Requirements

1. **Transit Gateway Hub**
   - Deploy AWS Transit Gateway as the central hub in us-east-1
   - Configure Transit Gateway route tables for traffic routing
   - Enable DNS support and VPN ECMP support
   - Configure appropriate Amazon Side ASN

2. **Hub VPC Configuration**
   - Create a dedicated hub VPC for shared services
   - Deploy NAT Gateways for centralized internet egress
   - Configure appropriate CIDR ranges avoiding overlap
   - Implement Transit Gateway attachment for hub VPC

3. **Spoke VPC Architecture**
   - Create multiple spoke VPCs (minimum 2-3 for different environments)
   - Configure non-overlapping CIDR blocks for each spoke
   - Attach each spoke VPC to the Transit Gateway
   - Configure VPC Route Tables to route through Transit Gateway

4. **Network Routing**
   - Configure Transit Gateway route tables for hub-spoke routing
   - Enable spoke-to-spoke communication through the hub
   - Route internet-bound traffic through hub VPC NAT Gateways
   - Implement appropriate route propagation

5. **Security and Segmentation**
   - Implement Security Groups for proper access control
   - Configure Network ACLs for subnet-level security
   - Ensure production and non-production network isolation
   - Apply principle of least privilege for network access

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Transit Gateway** for central network hub
- Use **Amazon VPC** for hub and spoke networks
- Use **VPC Route Tables** for traffic routing configuration
- Use **Security Groups** for instance-level security
- Use **Network ACLs** for subnet-level security
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environment-suffix}`
- Deploy to **us-east-1** region
- Support multiple environment deployments (dev, staging, prod)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL resources must include an environment suffix parameter for unique naming across multiple deployments
- **Destroyability**: All resources must be fully destroyable with `terraform destroy` - NO retention policies, NO prevent_destroy flags on production resources for this test environment
- **Idempotency**: Configuration must be safely reapplied without creating duplicate resources
- **Clean State**: Remove any hardcoded values that would conflict across environments

### Constraints

- All CIDR blocks must be non-overlapping across VPCs
- Hub VPC must provide centralized egress through NAT Gateway
- Spoke VPCs must not have direct internet gateways (route through hub)
- Transit Gateway must support multiple route tables for segmentation
- Security Groups must follow least privilege principle
- Network ACLs must allow required traffic patterns
- All resources must support tagging for cost allocation
- Configuration must be reusable across different AWS accounts

### Terraform Best Practices

- Use variables for all configurable parameters
- Define outputs for Transit Gateway ID, VPC IDs, and route table IDs
- Organize code into logical modules if complexity warrants
- Use data sources for AMIs and availability zones
- Implement proper resource dependencies with depends_on where needed
- Include comprehensive resource tags (Environment, Project, ManagedBy)

## Success Criteria

- **Functionality**: Transit Gateway successfully routes traffic between hub and spoke VPCs
- **Connectivity**: Spoke VPCs can communicate through the Transit Gateway
- **Internet Access**: Spoke VPCs can reach internet through hub NAT Gateway
- **Security**: Proper network segmentation with Security Groups and NACLs
- **Isolation**: Production and non-production environments properly segmented
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Destroyability**: Complete infrastructure can be destroyed cleanly with terraform destroy
- **Code Quality**: Valid HCL syntax, properly structured, well-documented

## What to deliver

- Complete Terraform HCL configuration files
- Transit Gateway with proper routing configuration
- Hub VPC with NAT Gateway for internet egress
- Multiple spoke VPCs with Transit Gateway attachments
- VPC Route Tables configured for hub-spoke topology
- Security Groups and Network ACLs for proper access control
- Variables file for environment-specific configuration
- Outputs file exposing key resource identifiers
- Documentation with deployment instructions
