Hey team,

We have a financial services company that's establishing a new AWS presence and they need serious network isolation between their production, development, and shared services environments. They want to implement a hub-and-spoke network architecture using Transit Gateway that allows controlled cross-environment communication while maintaining strict security boundaries. The design needs to support future expansion into additional AWS regions as well.

The business requirements are clear about isolation. Production traffic should never directly communicate with development, but both environments need centralized internet egress through a hub VPC. All inter-VPC routing must flow through Transit Gateway with separate route domains to enforce these policies. They also want centralized NAT Gateway architecture in the hub to reduce costs and simplify management.

From a compliance perspective, they need VPC Flow Logs on all VPCs for audit trails, and these logs need lifecycle policies to move to Glacier after 30 days for cost optimization. They want Route53 Private Hosted Zones for internal DNS resolution across the VPCs. Everything needs to be tagged properly for cost allocation and management.

## What we need to build

Create a multi-VPC hub-and-spoke network architecture using **Terraform with HCL** for a financial services company requiring strict network isolation between environments.

### Core Requirements

1. **VPC Infrastructure**
   - Create three VPCs: hub-vpc (10.0.0.0/16), prod-vpc (10.1.0.0/16), and dev-vpc (10.2.0.0/16)
   - Deploy private and public subnets in each VPC across two availability zones
   - All VPCs must use non-overlapping CIDR ranges from the 10.0.0.0/8 private address space
   - Use Terraform modules for VPC creation with configurable CIDR blocks

2. **Transit Gateway Architecture**
   - Deploy AWS Transit Gateway with DNS support enabled
   - Attach all three VPCs to the Transit Gateway
   - Configure Transit Gateway route tables with separate domains for prod and dev isolation
   - Transit Gateway attachments must use dedicated subnets separate from application subnets
   - All inter-VPC communication must flow through Transit Gateway
   - Production VPC must have no direct routes to development VPC

3. **Centralized Egress Control**
   - Implement NAT Gateways in hub-vpc only for centralized internet egress
   - NAT Gateways must only exist in the hub VPC to enforce centralized egress
   - Configure routing so prod and dev VPCs use hub NAT Gateways for internet access

4. **Network Monitoring and Logging**
   - Configure VPC Flow Logs for all VPCs with S3 destination
   - VPC Flow Logs must use S3 lifecycle policies to transition to Glacier after 30 days
   - All resources must have proper CloudWatch logging enabled

5. **DNS Resolution**
   - Set up Route53 Private Hosted Zones for internal DNS resolution
   - Associate private hosted zones with all VPCs for cross-VPC DNS queries

6. **Resource Tagging and Naming**
   - Tag all resources with Environment, Project, and ManagedBy tags
   - Resource names must follow the pattern {environment}-{service}-{resource-type}
   - All named resources MUST include the environmentSuffix variable for uniqueness
   - Example naming: hub-vpc-${var.environment_suffix}, prod-tgw-attachment-${var.environment_suffix}

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **Transit Gateway** for hub-and-spoke connectivity
- Use **Route53** for private DNS resolution
- Use **NAT Gateway** for centralized internet egress
- Use **S3** for VPC Flow Logs storage
- Use **VPC Flow Logs** for network monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {environment}-{service}-{resource-type}-${var.environment_suffix}
- Deploy to **us-east-1** region
- Terraform 1.5+ required
- AWS provider 5.x required

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with terraform destroy (no RemovalPolicy: RETAIN or DeletionPolicy: Retain)
- All named resources must include ${var.environment_suffix} to ensure unique naming across deployments
- Terraform state must be configured for remote backend with state locking
- All security group rules must use description fields documenting the purpose

### Constraints

- All VPCs must use non-overlapping CIDR ranges from the 10.0.0.0/8 private address space
- Transit Gateway attachments must use dedicated subnets separate from application subnets
- Production VPC must have no direct routes to development VPC
- NAT Gateways must only exist in the hub VPC to enforce centralized egress
- All inter-VPC communication must flow through Transit Gateway
- VPC Flow Logs must use S3 lifecycle policies to transition to Glacier after 30 days
- All security group rules must use description fields documenting the purpose
- Use modular Terraform structure for reusability
- Prefer cost-optimized solutions where possible

### Optional Enhancements

- Add VPC endpoints for S3 and DynamoDB if needed for better performance
- Implement AWS Network Firewall in hub-vpc for advanced traffic inspection
- Deploy VPN connection for hybrid connectivity if required

## Success Criteria

- **Functionality**: Three VPCs connected via Transit Gateway with proper isolation between prod and dev
- **Network Isolation**: Production traffic cannot reach development VPC directly
- **Centralized Egress**: All internet-bound traffic from prod and dev flows through hub NAT Gateways
- **Monitoring**: VPC Flow Logs enabled on all VPCs with S3 lifecycle policies
- **DNS Resolution**: Private hosted zones enable cross-VPC DNS queries
- **Resource Naming**: All resources include environmentSuffix and follow naming convention
- **Destroyability**: All resources can be destroyed with terraform destroy
- **Tagging**: All resources properly tagged with Environment, Project, and ManagedBy
- **Code Quality**: Clean HCL code, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation with reusable modules
- Hub VPC with NAT Gateways in public subnets across two AZs
- Production VPC with private subnets only (no NAT Gateways)
- Development VPC with private subnets only (no NAT Gateways)
- Transit Gateway with DNS support and VPC attachments
- Transit Gateway route tables enforcing prod/dev isolation
- VPC Flow Logs for all VPCs with S3 storage and Glacier lifecycle
- Route53 Private Hosted Zones for internal DNS
- Proper route tables directing traffic through Transit Gateway and hub NAT
- Variables file with configurable CIDR blocks and environmentSuffix
- Outputs file exposing VPC IDs, Transit Gateway ID, and other key resources
- README documentation explaining architecture and deployment steps
