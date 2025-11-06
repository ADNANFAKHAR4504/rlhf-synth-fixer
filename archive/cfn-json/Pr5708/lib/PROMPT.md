# Payment Processing VPC Infrastructure

Hey team,

We need to build a secure network foundation for our new payment processing application. The business is launching a PCI DSS-compliant payment gateway and we need the AWS infrastructure ready for their production deployment. I've been asked to create this using CloudFormation with JSON templates so we can version control everything and deploy it consistently across environments.

The payments team has been very specific about the network architecture. They need complete isolation between the database tier and the internet, with controlled outbound access for the application servers. We're talking about handling sensitive financial data here, so security and compliance are non-negotiable. The architecture needs to span multiple availability zones for high availability, and we need full visibility into network traffic for security monitoring and audit purposes.

The infrastructure must support their three-tier application architecture with public-facing load balancers, private application servers that can reach external APIs, and completely isolated database subnets with zero internet connectivity. Everything needs proper tagging for cost allocation and compliance tracking.

## What we need to build

Create a production-ready VPC infrastructure using **CloudFormation with JSON** for a PCI DSS-compliant payment processing application.

### Core Requirements

1. **VPC and Network Foundation**
   - VPC with CIDR block 10.0.0.0/16 spanning 3 availability zones
   - Internet Gateway for public subnet connectivity
   - Resource names must include environmentSuffix for uniqueness
   - Follow naming convention: resource-type-environment-suffix

2. **Subnet Architecture (9 subnets total)**
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (one per AZ)
   - Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 (one per AZ)
   - Isolated subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24 (one per AZ)

3. **NAT Gateway High Availability**
   - Deploy NAT Gateway in each public subnet (3 total)
   - Each private subnet routes through its AZ's NAT Gateway
   - Ensures redundancy and failover capability

4. **Route Tables and Routing**
   - Public route table with internet gateway route
   - Private route tables with NAT Gateway routes for outbound access
   - Isolated route tables with no internet routes whatsoever
   - Proper subnet associations for each tier

5. **VPC Flow Logs for Security Monitoring**
   - Enable VPC Flow Logs capturing all traffic
   - Send logs to CloudWatch Logs destination
   - 7-day retention period for log data
   - IAM role for Flow Logs to write to CloudWatch

6. **S3 Gateway Endpoint**
   - Create S3 Gateway endpoint for private S3 access
   - Attach to private and isolated subnet route tables
   - Eliminates internet transit for S3 traffic

7. **Network ACLs**
   - Implement Network ACLs with explicit deny-all defaults
   - Properly configure inbound and outbound rules per tier

8. **Stack Outputs for Integration**
   - Export VPC ID for reference by other stacks
   - Export all subnet IDs (public, private, isolated)
   - Export route table IDs
   - Export NAT Gateway IDs

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use AWS::EC2::VPC for VPC creation
- Use AWS::EC2::NatGateway for NAT Gateways
- Use AWS::EC2::FlowLog for VPC Flow Logs
- Use AWS::Logs::LogGroup for CloudWatch Logs
- Use AWS::IAM::Role for Flow Logs permissions
- Use AWS::EC2::VPCEndpoint for S3 Gateway endpoint
- Resource names must include environmentSuffix for uniqueness
- Deploy to us-east-1 region
- All resources must be destroyable with no Retain policies

### Resource Tagging

All resources must include these tags:
- Environment: Production
- Project: PaymentGateway

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16 with specific subnet allocation
- Private subnets must have no direct internet access (only via NAT)
- All traffic between subnets must pass through security groups
- NAT Gateways must be deployed in at least 2 AZs for redundancy (implement in all 3)
- VPC Flow Logs must be enabled and sent to CloudWatch
- Network ACLs must explicitly deny all traffic by default
- Isolated subnets must have zero internet connectivity
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- Functionality: Complete VPC with 3-tier subnet architecture across 3 AZs
- Network Isolation: Isolated subnets have no internet routes
- High Availability: NAT Gateways in all 3 AZs for redundancy
- Security Monitoring: VPC Flow Logs enabled with CloudWatch integration
- Resource Naming: All resources include environmentSuffix parameter
- Compliance: Network ACLs with explicit deny-all defaults
- Integration: Stack exports all necessary IDs for dependent stacks
- Code Quality: Clean JSON, well-structured, properly formatted

## What to deliver

- Complete CloudFormation JSON implementation
- VPC with Internet Gateway
- 9 subnets across 3 AZs (public, private, isolated)
- 3 NAT Gateways with Elastic IPs
- Route tables for each subnet tier
- VPC Flow Logs with CloudWatch Log Group
- IAM role for Flow Logs
- S3 Gateway endpoint
- Network ACLs with deny-all defaults
- Stack outputs for VPC ID and all subnet IDs
- Proper tagging: Environment=Production, Project=PaymentGateway
