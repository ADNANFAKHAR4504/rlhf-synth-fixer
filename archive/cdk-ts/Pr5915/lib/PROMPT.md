Hey team,

We need to build a production-grade VPC infrastructure for our new financial services application. This is a critical deployment that will host both public-facing web services and private backend systems. I've been asked to create this using **CDK with TypeScript**. The business wants a highly available, secure network architecture that can support our growing financial application workload.

We're establishing a new AWS presence in us-east-1, and this VPC will be the foundation for everything. The architecture needs to support strict network isolation and compliance controls while maintaining high availability across multiple availability zones. We'll be running public-facing Application Load Balancers, private ECS services, and RDS Aurora instances, so the network design needs to be solid from day one.

The security team has been very clear about the requirements. We need explicit controls for SSH access, proper segmentation between web and application tiers, and comprehensive logging for compliance purposes. This is financial services, so we can't cut corners on security or reliability.

## What we need to build

Create a multi-AZ VPC infrastructure using **CDK with TypeScript** that provides production-grade networking for a financial services application.

### Core Requirements

1. **VPC Configuration**
   - VPC with CIDR 10.0.0.0/16
   - Span across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Enable DNS hostnames and DNS support

2. **Subnet Architecture**
   - One public subnet per AZ: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
   - One private subnet per AZ: 10.0.128.0/24, 10.0.129.0/24, 10.0.130.0/24
   - Public subnets for load balancers and NAT gateways
   - Private subnets for application and database tiers

3. **High Availability NAT Configuration**
   - Deploy NAT Gateway in each public subnet
   - Configure private subnets to route through their respective NAT gateways
   - Enable high availability across all three AZs

4. **Routing Configuration**
   - Create custom route tables with explicit naming
   - Follow naming pattern: {env}-{az}-{type}-rt
   - Associate route tables with appropriate subnets
   - Configure internet gateway routes for public subnets

5. **VPC Flow Logs**
   - Enable VPC Flow Logs capturing ALL traffic
   - Send logs to CloudWatch Logs
   - Retain logs for compliance and troubleshooting

6. **Network ACLs**
   - Configure Network ACLs for security
   - Explicitly deny inbound SSH (port 22) from 0.0.0.0/0
   - Allow other necessary traffic

7. **Security Groups**
   - Web tier security group: allow HTTP (80) and HTTPS (443) from anywhere
   - App tier security group: allow HTTP (80) and HTTPS (443) only from web tier
   - Implement least-privilege access

8. **Resource Tagging**
   - Tag all resources with Environment='production'
   - Tag all resources with Project='financial-app'
   - Tag all resources with ManagedBy='cdk'

9. **CloudFormation Outputs**
   - Export VPC ID
   - Export all subnet IDs (public and private)
   - Export security group IDs for web and app tiers

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **VPC** construct for network infrastructure
- Use **Subnet** constructs for subnet creation
- Use **NAT Gateway** constructs for high availability internet access
- Use **CloudWatch Logs** for VPC Flow Logs
- Use **Network ACL** constructs for SSH blocking
- Use **Security Group** constructs for tier-based access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Use CDK 2.x with Node.js 16+

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16 with no overlapping ranges
- Each availability zone must have exactly one public and one private subnet
- NAT Gateways must be deployed in high availability mode across all AZs
- All route tables must have explicit names following {env}-{az}-{type}-rt pattern
- Security groups must use least-privilege rules
- VPC Flow Logs must be enabled and sent to CloudWatch Logs
- Network ACLs must explicitly deny SSH from public internet
- Private subnets must use /24 CIDR blocks starting from 10.0.128.0
- Public subnets must use /24 CIDR blocks starting from 10.0.0.0
- All resources must be easily destroyable (no RETAIN policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete VPC with 6 subnets across 3 AZs operational
- **High Availability**: NAT Gateways deployed in all three AZs for redundancy
- **Security**: Network ACLs blocking SSH, security groups implementing tier-based access
- **Compliance**: VPC Flow Logs capturing all traffic to CloudWatch
- **Naming**: All route tables follow {env}-{az}-{type}-rt pattern
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources tagged with Environment, Project, and ManagedBy
- **Outputs**: VPC ID, subnet IDs, and security group IDs exported
- **Code Quality**: TypeScript, well-structured, documented

## What to deliver

- Complete CDK TypeScript implementation in lib/ directory
- VPC with 10.0.0.0/16 CIDR across 3 AZs
- 3 public subnets and 3 private subnets with specified CIDR ranges
- NAT Gateways in each public subnet for high availability
- Custom route tables with explicit naming
- VPC Flow Logs to CloudWatch with ALL traffic capture
- Network ACLs denying SSH from internet
- Security groups for web and app tiers with least-privilege rules
- Comprehensive tagging on all resources
- CloudFormation outputs for VPC, subnets, and security groups
- Documentation and deployment instructions