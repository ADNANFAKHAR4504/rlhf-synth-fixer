Hey team,

We need to build a production-grade VPC network architecture for our financial services application. I've been asked to create this infrastructure in JSON using CloudFormation. The business is establishing our AWS presence and needs strict network isolation with compliance controls to support both public-facing web services and private backend systems.

This is a foundational network layer that will support multiple availability zones for high availability. We need proper segmentation between public and private subnets, controlled internet access through NAT Gateways, and comprehensive logging for security compliance. The architecture needs to be consistent across regions and follow our standard tagging practices.

## What we need to build

Create a VPC network infrastructure using **CloudFormation with JSON** for production financial services deployment.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames for proper service discovery
   - No overlapping IP address ranges

2. **Multi-AZ Subnet Architecture**
   - Deploy 6 subnets across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Each AZ must have exactly one public subnet and one private subnet
   - Use Mappings section to define subnet CIDR blocks for different regions

3. **Internet Connectivity**
   - Configure Internet Gateway attached to VPC
   - Setup proper route tables for public subnets with IGW routes
   - Enable internet access for public-facing resources

4. **High-Availability NAT**
   - Deploy NAT Gateways in each public subnet with Elastic IPs
   - NAT Gateways must be in high-availability mode across all 3 AZs
   - All private subnets must route outbound traffic through NAT Gateway in the same AZ

5. **Routing Configuration**
   - Create separate route tables for public and private subnets
   - Public route tables point to Internet Gateway
   - Private route tables point to NAT Gateways
   - Ensure proper route associations with subnets

6. **Network Logging**
   - Enable VPC Flow Logs to CloudWatch Logs
   - Create IAM role with proper permissions for Flow Logs
   - Set 30-day retention period on CloudWatch log groups
   - Capture all traffic (accepted and rejected)

7. **Network Security**
   - Implement custom Network ACLs with explicit rules
   - Allow only required ports: 80 (HTTP), 443 (HTTPS), 22 (SSH from specific IPs)
   - Explicitly deny all other traffic at network level
   - Configure both inbound and outbound rules

8. **Resource Organization**
   - Apply consistent tagging with Environment and Department keys on all resources
   - Follow naming pattern: {ResourceType}-{AZ}-{Environment}
   - Use Cost Allocation Tags for expense tracking

9. **Parameter Support**
   - Template must use Mappings for subnet CIDRs to ensure regional consistency
   - All resource names must include **EnvironmentSuffix** parameter for uniqueness

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network foundation
- Use **EC2 Subnets** for network segmentation (6 total subnets)
- Use **Internet Gateway** for public internet access
- Use **NAT Gateways** with **Elastic IPs** for private subnet outbound
- Use **Route Tables** for traffic routing configuration
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **VPC Flow Logs** for network traffic monitoring
- Use **Network ACLs** for subnet-level security
- Use **IAM Roles** for VPC Flow Logs permissions
- Resource names must include **EnvironmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy to **us-east-1** region with 3 availability zones

### Deployment Requirements (CRITICAL)

- All resources must include **EnvironmentSuffix** parameter in their names using `Fn::Sub` intrinsic function
- All resources must be destroyable (use DeletionPolicy: Delete, no Retain policies)
- No DeletionProtectionEnabled flags set to true
- Resources must support multiple parallel deployments with different suffixes

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Each availability zone gets exactly one public and one private subnet
- NAT Gateways deployed in high-availability mode (one per AZ)
- Private subnets route through NAT Gateway in same AZ for optimal performance
- VPC Flow Logs must be enabled with 30-day CloudWatch retention
- Network ACLs must explicitly deny all except ports 80, 443, 22 from specific IPs
- All resources tagged with Environment and Department for cost allocation
- Internet Gateway and NAT Gateway names follow: {ResourceType}-{AZ}-{Environment}
- Template uses Mappings section for subnet CIDR blocks across regions
- No hardcoded values that prevent multi-region deployment

## Success Criteria

- **Functionality**: Complete VPC with 6 subnets, routing, NAT, and logging working correctly
- **High Availability**: Resources deployed across 3 availability zones
- **Security**: Network ACLs enforcing port restrictions, VPC Flow Logs capturing traffic
- **Compliance**: All resources properly tagged with Environment and Department
- **Consistency**: Mappings used for regional CIDR consistency
- **Uniqueness**: All resource names include EnvironmentSuffix parameter
- **Destroyability**: All resources can be fully deleted after testing
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template in lib/TapStack.json
- VPC with DNS hostnames enabled (CIDR 10.0.0.0/16)
- 6 subnets across 3 AZs (3 public, 3 private)
- Internet Gateway with route table configuration
- 3 NAT Gateways with Elastic IPs (one per AZ)
- Public and private route tables with proper associations
- VPC Flow Logs with CloudWatch Logs integration
- IAM role for Flow Logs with 30-day retention
- Custom Network ACLs for ports 80, 443, 22
- Mappings section for regional subnet CIDRs
- Consistent tagging with Environment and Department
- EnvironmentSuffix parameter support for all named resources
- Outputs for VPC ID, subnet IDs, route table IDs, and NAT Gateway IPs
