Hey team,

We need to build a production-ready VPC infrastructure for a new payment processing application at our financial services startup. This is critical infrastructure that must meet PCI DSS compliance requirements for network segmentation and access control. The business needs us to create separate, secure environments for testing and production workloads with proper isolation.

The payment processing team has been really clear about their security requirements. They need multi-AZ redundancy, proper network segmentation between public and private subnets, and strict controls on traffic flow. We also need comprehensive logging and monitoring to meet compliance requirements. The infrastructure needs to support both web-facing components and backend application services that process sensitive payment data.

The team wants everything deployed in us-east-1 with full high availability across three availability zones. We need to ensure private subnets have outbound internet access through NAT Gateways while maintaining strict inbound security. All resources need proper tagging for cost tracking and compliance auditing.

## What we need to build

Create a highly available, secure VPC infrastructure using **CloudFormation with YAML** for a payment processing application that meets PCI DSS compliance requirements.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Deploy across us-east-1 region

2. **Subnet Architecture**
   - Deploy 6 subnets across 3 availability zones
   - 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - All subnets must have explicit route table associations

3. **Internet Connectivity**
   - Configure Internet Gateway attached to VPC
   - Create routes from public subnets to Internet Gateway
   - Deploy NAT Gateways in first two public subnets with Elastic IPs
   - Private subnets must route outbound traffic through NAT Gateways

4. **Routing Configuration**
   - Create separate route tables for public and private subnets
   - Public route tables route to Internet Gateway
   - Private route tables route to NAT Gateways
   - Ensure private subnets have no direct internet gateway routes

5. **VPC Flow Logs**
   - Enable VPC Flow Logs to CloudWatch Logs
   - Configure 30-day retention period
   - Capture all accepted and rejected traffic

6. **VPC Endpoints**
   - Create VPC endpoint for S3 service
   - Create VPC endpoint for DynamoDB service
   - Configure for private access from private subnets

7. **Security Groups**
   - Web tier security group allowing ports 80 and 443
   - Application tier security group allowing port 8080
   - Follow least privilege principle with restrictive ingress rules
   - No 0.0.0.0/0 ingress rules allowed

8. **Network ACLs**
   - Implement Network ACLs with deny-by-default policy
   - Explicitly allow only necessary ports
   - Apply to both public and private subnets

9. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Owner=FinanceTeam
   - Tag all resources with CostCenter=TECH001

10. **CloudFormation Outputs**
    - Export all subnet IDs for cross-stack references
    - Export all security group IDs
    - Export VPC ID and CIDR block

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use AWS::EC2::VPC for VPC creation
- Use AWS::EC2::Subnet for subnet definitions
- Use AWS::EC2::InternetGateway and AWS::EC2::VPCGatewayAttachment
- Use AWS::EC2::NatGateway with AWS::EC2::EIP
- Use AWS::EC2::RouteTable and AWS::EC2::Route
- Use AWS::EC2::VPCEndpoint for S3 and DynamoDB
- Use AWS::Logs::LogGroup for CloudWatch Logs
- Use AWS::EC2::FlowLog for VPC Flow Logs
- Use AWS::EC2::SecurityGroup for security groups
- Use AWS::EC2::NetworkAcl and AWS::EC2::NetworkAclEntry
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region

### Constraints

- VPC must use CIDR block 10.0.0.0/16 for production environment
- All subnets must have explicit route table associations
- NAT Gateways must be deployed in at least two availability zones
- VPC Flow Logs must be enabled and stored in CloudWatch Logs
- Network ACLs must explicitly deny all traffic by default except required ports
- Security groups must follow least privilege principle with no 0.0.0.0/0 ingress rules
- All resources must be tagged with Environment, Owner, and CostCenter tags
- Private subnets must not have direct internet gateway routes
- VPC endpoints for S3 and DynamoDB must be configured for private access
- CloudFormation outputs must include all subnet IDs and security group IDs
- All resources must be destroyable with no Retain policies
- Include proper IAM roles for VPC Flow Logs
- CloudWatch Logs must have 30-day retention period

## Success Criteria

- Functionality: Complete VPC infrastructure with proper network segmentation and high availability across 3 AZs
- Performance: Multi-AZ NAT Gateway deployment for reliable outbound connectivity
- Reliability: Redundant NAT Gateways in multiple availability zones
- Security: Restrictive security groups and Network ACLs following least privilege, VPC Flow Logs enabled
- Resource Naming: All resources include environmentSuffix parameter
- Cost Tracking: All resources properly tagged with Environment, Owner, and CostCenter
- Code Quality: Well-structured CloudFormation YAML, properly documented with comments

## What to deliver

- Complete CloudFormation YAML implementation in TapStack.yml
- VPC with 6 subnets across 3 availability zones
- Internet Gateway and 2 NAT Gateways with Elastic IPs
- Route tables for public and private subnet routing
- VPC Flow Logs configured with CloudWatch Logs
- VPC Endpoints for S3 and DynamoDB services
- Security Groups for web tier and application tier
- Network ACLs with deny-by-default rules
- Comprehensive resource tagging
- CloudFormation outputs for cross-stack references
- Documentation and deployment instructions
