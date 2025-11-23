Hey team,

We need to build a secure network foundation for a fintech startup's payment processing platform. They're launching their first production workload and need strict network isolation between application tiers to meet PCI DSS compliance requirements. The infrastructure team has asked us to create this using **CloudFormation with JSON** format.

The business context is important here - this is a payment processing platform, so security and network segmentation aren't optional. PCI DSS requires clear boundaries between public-facing systems, application servers, and database layers. Any breach of these boundaries would fail compliance audits and put customer payment data at risk.

The networking team has already allocated the 10.0.0.0/16 CIDR block from their corporate IP space, and we need to carve out subnets that support a classic three-tier architecture. The platform will run across three availability zones for high availability, with public subnets for load balancers, private subnets for application servers, and isolated database subnets for RDS instances.

## What we need to build

Create a production-ready VPC networking infrastructure using **CloudFormation with JSON** for a three-tier web application that meets PCI DSS compliance requirements for network segmentation.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR 10.0.0.0/16
   - Enable DNS support and DNS hostnames
   - Must be tagged for cost tracking and organization

2. **Subnet Architecture**
   - Deploy 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Deploy 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Deploy 3 database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Each subnet must be in a different availability zone
   - All subnets use /24 CIDR blocks

3. **Internet Connectivity**
   - Internet Gateway attached to VPC
   - Public subnets route internet traffic through IGW
   - Private subnets have NO direct internet access

4. **NAT Gateway Setup**
   - Deploy NAT Gateway in each public subnet (3 total)
   - Each NAT Gateway requires Elastic IP
   - Private subnets route outbound traffic through NAT in same AZ

5. **Routing Configuration**
   - Separate route table for each tier and AZ
   - Public route tables: route 0.0.0.0/0 to Internet Gateway
   - Private route tables: route 0.0.0.0/0 to NAT Gateway
   - Database route tables: no internet routes
   - Route table naming: {env}-{tier}-{az}-rtb format

6. **Network Access Control Lists**
   - Default deny all traffic
   - Allow HTTP/HTTPS (80, 443) from internet to public subnets
   - Allow application traffic from public to private subnets
   - Allow database traffic from private to database subnets
   - Explicit allow rules only for required ports

7. **VPC Flow Logs**
   - Enable VPC Flow Logs for traffic monitoring
   - Send logs to CloudWatch Logs
   - Create CloudWatch Logs group with 7-day retention
   - Required for security audit trail

8. **Resource Tagging**
   - Use parameters for Environment, Project, and CostCenter
   - Apply tags consistently across all resources
   - Support for environmentSuffix parameter for unique resource naming

9. **Stack Outputs**
   - Export VPC ID
   - Export all subnet IDs grouped by tier
   - Export NAT Gateway IDs
   - Outputs must be usable by other CloudFormation stacks

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use AWS::EC2::VPC for VPC creation
- Use AWS::EC2::Subnet for all subnets
- Use AWS::EC2::InternetGateway and VPCGatewayAttachment
- Use AWS::EC2::NatGateway with EIP resources
- Use AWS::EC2::RouteTable and SubnetRouteTableAssociation
- Use AWS::EC2::NetworkAcl for security rules
- Use AWS::EC2::FlowLog with CloudWatch Logs destination
- Use AWS::Logs::LogGroup for Flow Logs storage
- Deploy to us-east-1 region
- Resource names must include EnvironmentSuffix parameter for uniqueness
- Follow naming convention: {resource-type}-${EnvironmentSuffix}
- All resources must be destroyable (no Retain policies or deletion protection)

### Constraints

1. VPC CIDR must be exactly 10.0.0.0/16 (corporate IP allocation standard)
2. Must span exactly 3 availability zones for high availability
3. Private subnets cannot have direct internet access
4. Each subnet must use /24 CIDR block
5. NAT Gateways required in each AZ to avoid cross-AZ traffic charges
6. All route tables must follow {env}-{tier}-{az}-rtb naming pattern
7. Network ACLs must default deny and explicitly allow only required traffic
8. VPC Flow Logs must be enabled and sent to CloudWatch Logs
9. All resources must include Environment, Project, and CostCenter tags

## Success Criteria

- **Functionality**: VPC with 9 subnets across 3 AZs, IGW, 3 NAT Gateways, proper routing
- **Performance**: NAT Gateway per AZ for low latency outbound traffic
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: Network ACLs enforce tier isolation, VPC Flow Logs enabled
- **Compliance**: Network segmentation meets PCI DSS requirements
- **Resource Naming**: All resources include EnvironmentSuffix for uniqueness
- **Destroyability**: No Retain policies, infrastructure can be fully torn down
- **Reusability**: Template works across regions with minimal changes
- **Code Quality**: Valid CloudFormation JSON, well-structured, proper dependencies

## What to deliver

- Complete CloudFormation JSON template
- VPC with DNS support and hostnames enabled
- 9 subnets (3 public, 3 private, 3 database) across 3 AZs
- Internet Gateway with public subnet routing
- 3 NAT Gateways with Elastic IPs and private subnet routing
- Network ACLs for tier isolation
- VPC Flow Logs with CloudWatch Logs destination
- CloudWatch Logs group with 7-day retention
- Stack outputs for VPC ID, subnet IDs, and NAT Gateway IDs
- Consistent resource tagging with parameters
- Template parameters for Environment, Project, CostCenter, and EnvironmentSuffix