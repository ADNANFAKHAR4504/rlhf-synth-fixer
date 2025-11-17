Hey team,

We're building the network foundation for a new fintech payment processing application and need to get the security right from day one. The business is requiring PCI DSS compliance, which means we need proper network segmentation, traffic controls, and comprehensive logging. I've been tasked with creating this infrastructure using **CDK with TypeScript** to keep everything as code and maintainable.

The payment team has specific requirements around network isolation. They need public-facing components separated from the backend processing layer, with controlled traffic flow between them. Everything needs to be logged for audit purposes, and we need to ensure S3 access doesn't route through the internet gateway to keep costs down and improve security.

Our security team has already reviewed the architecture and approved the approach, but they're adamant about the traffic controls. Only HTTPS, MySQL, and Redis traffic should be allowed between subnets - everything else gets blocked. They also want VPC Flow Logs retained for at least a week for incident response and compliance audits.

## What we need to build

Create a secure VPC infrastructure using **CDK with TypeScript** for a PCI DSS compliant payment processing application in the eu-central-2 region.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Deploy across 3 availability zones for high availability
   - Enable DNS hostnames and DNS support

2. **Public Subnet Layer**
   - Create 3 public subnets with /24 CIDR masks (CDK will automatically allocate from VPC CIDR)
   - Distribute across 3 different AZs
   - Configure Internet Gateway for inbound/outbound internet access
   - Route tables configured for internet connectivity

3. **Private Subnet Layer**
   - Create 3 private subnets with /24 CIDR masks (CDK will automatically allocate from VPC CIDR)
   - Distribute across same 3 AZs as public subnets
   - No direct internet access
   - Each subnet sized for at least 250 hosts

4. **NAT Gateway Configuration**
   - Deploy NAT gateway in each public subnet (3 total)
   - Configure route tables for private subnets to use NAT gateways
   - Enable outbound internet access for private subnets

5. **Network Security Controls**
   - Create custom Network ACLs for traffic control
   - Allow HTTPS traffic on port 443
   - Allow MySQL traffic on port 3306
   - Allow Redis traffic on port 6379
   - Explicitly deny all other traffic

6. **Monitoring and Logging**
   - Enable VPC Flow Logs for all traffic
   - Send logs to CloudWatch Log Group
   - Configure 7-day log retention
   - Capture both accepted and rejected traffic

7. **VPC Endpoints**
   - Create S3 VPC endpoint (Gateway type)
   - Associate with all private subnet route tables
   - Avoid internet gateway charges for S3 access

8. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=PaymentGateway
   - Follow consistent naming convention

9. **CloudFormation Outputs**
   - Export VPC ID
   - Export all public subnet IDs
   - Export all private subnet IDs
   - Export S3 VPC endpoint ID

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **Amazon VPC** for network foundation
- Use **EC2 Subnets** for network segmentation (3 public + 3 private)
- Use **NAT Gateways** for private subnet internet access
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **Network ACLs** for subnet-level traffic control
- Use **S3 VPC Endpoint** for private S3 access
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **eu-central-2** region

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16 with automatic subnet allocation by CDK
- Private subnets must not have direct internet access except through NAT gateways
- All inter-subnet traffic must be logged to CloudWatch for compliance audits
- Network ACLs must explicitly deny all traffic except ports 443, 3306, and 6379
- S3 VPC endpoint must be gateway type to avoid data transfer charges
- All resources must be destroyable (no DeletionProtection, no Retain policies)
- Include proper error handling and validation
- Code must be production-ready and well-documented

## Success Criteria

- **Functionality**: All 9 requirements implemented and working
- **Security**: Network ACLs properly configured, traffic logging enabled
- **High Availability**: Resources distributed across 3 AZs
- **Compliance**: VPC Flow Logs configured with proper retention
- **Cost Optimization**: S3 VPC endpoint configured for private access
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, properly typed, well-tested, documented
- **Deployability**: CDK stack deploys successfully without errors

## What to deliver

- Complete **CDK with TypeScript** implementation
- VPC with public and private subnets across 3 AZs
- NAT gateways for each availability zone
- Network ACLs with restricted traffic rules
- VPC Flow Logs with CloudWatch integration
- S3 VPC endpoint for private subnet access
- All resources properly tagged
- CloudFormation outputs for integration
- Unit tests for all components
- Documentation and deployment instructions
