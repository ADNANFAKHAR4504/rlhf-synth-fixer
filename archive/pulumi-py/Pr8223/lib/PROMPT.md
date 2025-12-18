Hey team,

We need to build a secure VPC infrastructure for a fintech startup's payment processing application that complies with PCI DSS requirements. I've been asked to create this in Python using Pulumi with Python. The business wants a production-ready network foundation that provides proper segmentation between public-facing and private resources while maintaining cost efficiency.

The startup is launching their payment processing platform and needs rock-solid network security. They've specifically chosen Python for infrastructure code because their engineering team already knows Python well. We're looking at a multi-availability zone setup in us-east-1 to ensure high availability. The architecture needs public subnets for load balancers and private subnets for application servers, with proper routing through a NAT Gateway for outbound internet access from private resources.

The security groups need to follow least-privilege principles with web servers accepting HTTPS from anywhere but SSH only from within the VPC, and database servers only accepting PostgreSQL connections from the web server security group.

## What we need to build

Create a production-ready VPC infrastructure using **Pulumi with Python** for a payment processing application with PCI DSS compliance.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with 10.0.0.0/16 CIDR block
   - Enable DNS hostnames and DNS resolution
   - Deploy across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)

2. **Public Subnet Architecture**
   - Deploy 3 public subnets with /24 CIDR blocks
   - Subnet 1: 10.0.1.0/24 in us-east-1a
   - Subnet 2: 10.0.2.0/24 in us-east-1b
   - Subnet 3: 10.0.3.0/24 in us-east-1c
   - Route 0.0.0.0/0 traffic to Internet Gateway

3. **Private Subnet Architecture**
   - Deploy 3 private subnets with /24 CIDR blocks
   - Subnet 1: 10.0.11.0/24 in us-east-1a
   - Subnet 2: 10.0.12.0/24 in us-east-1b
   - Subnet 3: 10.0.13.0/24 in us-east-1c
   - Route 0.0.0.0/0 traffic to NAT Gateway

4. **Internet Connectivity**
   - Create Internet Gateway and attach to VPC
   - Create single NAT Gateway in first public subnet (us-east-1a) for cost optimization
   - Allocate Elastic IP for NAT Gateway

5. **Route Tables**
   - Public route table: route 0.0.0.0/0 to Internet Gateway
   - Private route table: route 0.0.0.0/0 to NAT Gateway
   - Associate public subnets with public route table
   - Associate private subnets with private route table

6. **Security Groups**
   - Web server security group: allow HTTPS (443) from 0.0.0.0/0, SSH (22) from 10.0.0.0/16
   - Database security group: allow PostgreSQL (5432) only from web server security group
   - Follow least-privilege principle with explicit ingress/egress rules

7. **Resource Naming and Tagging**
   - Use naming convention: production-{service}-{resource-type}
   - Resource names must include **environmentSuffix** parameter for uniqueness
   - Tag all resources with Environment=production and ManagedBy=pulumi

8. **Stack Outputs**
   - Export VPC ID
   - Export all 6 subnet IDs (3 public + 3 private)
   - Export both security group IDs (web and database)

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network foundation
- Use **EC2** for Elastic IPs and NAT Gateway
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: production-{resource-type}-{environmentSuffix}
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use DESTROY removal policy, FORBIDDEN to use RETAIN)
- Include proper error handling and logging
- Ensure all resources can be completely removed with pulumi destroy
- No stateful resources with retention policies

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Must create exactly 3 public and 3 private subnets
- Each subnet must use /24 CIDR block
- Single NAT Gateway shared by all private subnets (cost optimization)
- Security groups must use explicit ingress/egress rules
- All resources must have production and pulumi tags

## Success Criteria

- **Functionality**: Complete VPC with 6 subnets across 3 AZs, proper routing, and working security groups
- **Performance**: Multi-AZ deployment for high availability
- **Reliability**: Redundant subnets across availability zones
- **Security**: PCI DSS compliant network segmentation, least-privilege security groups
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Python, well-tested, documented, follows Pulumi best practices
- **Cost Optimization**: Single NAT Gateway shared across all private subnets

## What to deliver

- Complete Pulumi Python implementation in __main__.py
- VPC with DNS support enabled
- 3 public subnets and 3 private subnets across 3 AZs
- Internet Gateway and NAT Gateway with proper routing
- Two security groups (web and database) with correct rules
- Stack exports for VPC ID, subnet IDs, and security group IDs
- Unit tests for all components
- Documentation and deployment instructions
