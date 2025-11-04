Hey team,

We need to build a production-ready VPC infrastructure for our Asia-Pacific expansion. The company is establishing a new AWS presence in the ap-southeast-1 region to support growing customer demand. I've been asked to create this using AWS CDK with TypeScript. The business wants a standardized VPC setup that can be replicated across multiple regions while maintaining consistent security and networking policies.

The infrastructure team needs this to be fully automated and repeatable. We'll be hosting ECS workloads and RDS databases in private subnets, with Application Load Balancers operating in public subnets. The setup needs high availability across multiple availability zones with proper network segmentation and security controls.

## What we need to build

Create a VPC infrastructure using **AWS CDK with TypeScript** for deployment in ap-southeast-1 region.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR 10.0.0.0/16 in ap-southeast-1
   - Must span 3 availability zones for high availability

2. **Public Subnets**
   - Deploy 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Distribute across 3 availability zones
   - Must use /24 CIDR blocks

3. **Private Subnets**
   - Deploy 3 private subnets: 10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23
   - Distribute across the same 3 availability zones
   - Must use /23 CIDR blocks

4. **Internet Connectivity**
   - Create Internet Gateway and attach to VPC
   - Deploy NAT Gateways in first two public subnets only
   - Configure proper routing for public and private subnet access

5. **Network Routing**
   - Configure route tables with proper naming conventions
   - Follow naming pattern: {env}-{tier}-rt
   - Ensure proper routes for internet and NAT gateway access

6. **VPC Flow Logs**
   - Enable VPC Flow Logs for network traffic monitoring
   - Send logs to CloudWatch Logs
   - Set retention period to 7 days

7. **Network Security**
   - Create custom Network ACLs
   - Allow only HTTP (80), HTTPS (443), and SSH (22) inbound traffic
   - Explicitly deny all other traffic from 0.0.0.0/0

8. **Resource Tagging**
   - Tag all resources with Environment=production
   - Tag all resources with Project=apac-expansion

9. **CloudFormation Exports**
   - Export VPC ID
   - Export all subnet IDs
   - Export NAT Gateway IDs

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **VPC** for network isolation and segmentation
- Use **EC2** services for NAT Gateways and Internet Gateways
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **IAM** for CloudWatch Logs permissions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **ap-southeast-1** region
- Target CDK version 2.x with Node.js 18.x or higher

### Constraints

- VPC CIDR must be /16 to accommodate future growth
- Public subnets must use /24 CIDR blocks
- Private subnets must use /23 CIDR blocks
- Route tables must follow naming pattern {env}-{tier}-rt
- NAT Gateways must be deployed in at least 2 availability zones
- VPC Flow Logs must be enabled with CloudWatch Logs integration
- Network ACLs must explicitly deny all traffic except allowed ports
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation
- No hardcoded values - use parameters where appropriate

## Success Criteria

- Functionality: VPC infrastructure deploys successfully across 3 AZs
- Performance: NAT Gateways provide reliable outbound connectivity
- Reliability: Multi-AZ setup ensures high availability
- Security: Network ACLs enforce traffic restrictions, Flow Logs capture network activity
- Resource Naming: All resources include environmentSuffix for uniqueness
- Compliance: All resources properly tagged with Environment and Project
- Code Quality: TypeScript code is well-structured, typed, and documented
- Testability: Stack can be deployed and destroyed cleanly

## What to deliver

- Complete AWS CDK TypeScript implementation
- VPC with 10.0.0.0/16 CIDR in ap-southeast-1
- 3 public subnets (/24) and 3 private subnets (/23) across 3 AZs
- Internet Gateway for public subnet connectivity
- NAT Gateways in 2 public subnets for private subnet outbound access
- Route tables with proper naming conventions
- VPC Flow Logs with 7-day retention in CloudWatch Logs
- Network ACLs allowing only ports 80, 443, and 22
- CloudFormation outputs for VPC ID, subnet IDs, and NAT Gateway IDs
- Proper tagging with Environment=production and Project=apac-expansion
- Documentation and deployment instructions
