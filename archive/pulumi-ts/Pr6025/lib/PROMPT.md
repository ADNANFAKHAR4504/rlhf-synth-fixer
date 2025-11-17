# Multi-Environment VPC Infrastructure for Payment Processing Platform

Hey team,

We're building the foundation for a fintech startup's payment processing platform. They need a secure, PCI-DSS compliant network infrastructure that separates development, staging, and production workloads completely. The business has strict requirements around network segmentation, redundancy, and audit trails for compliance purposes.

The payment platform will handle sensitive financial data, so we need proper isolation between environments. Each environment requires its own VPC with distinct CIDR ranges, multiple availability zones for redundancy, and comprehensive logging for security audits. We also need to establish proper connectivity patterns with public subnets for load balancers and private subnets for application workloads.

This infrastructure will serve as the base layer for deploying microservices, databases, and other components. The security team has emphasized the need for proper network segmentation using security groups that follow least-privilege principles. They also want VPC Flow Logs enabled from day one to track all network traffic for compliance reporting.

## What we need to build

Create a multi-environment VPC infrastructure using **Pulumi with TypeScript** for a payment processing platform requiring PCI-DSS compliance and environment isolation.

### Core Requirements

1. **Multi-Environment VPC Setup**
   - Create three separate VPCs for dev, staging, and production environments
   - Dev VPC: 10.0.0.0/16 CIDR range
   - Staging VPC: 10.1.0.0/16 CIDR range
   - Production VPC: 10.2.0.0/16 CIDR range
   - VPC CIDR blocks must not overlap

2. **Subnet Architecture**
   - Deploy 6 subnets per VPC: 3 public and 3 private
   - Distribute subnets across availability zones: us-east-1a, us-east-1b, us-east-1c
   - Public subnets for internet-facing resources
   - Private subnets for application workloads

3. **Internet Connectivity**
   - Configure Internet Gateway for each VPC
   - Attach Internet Gateways to enable public subnet connectivity
   - Public subnets must route traffic to IGW

4. **Private Subnet Outbound Access**
   - Deploy NAT Gateway in each public subnet for high availability
   - One NAT Gateway per availability zone (3 per VPC)
   - Private subnets must route outbound traffic through NAT Gateways

5. **Route Table Configuration**
   - Create route tables with appropriate routes
   - Public subnets: route 0.0.0.0/0 to Internet Gateway
   - Private subnets: route 0.0.0.0/0 to NAT Gateway in same AZ
   - Explicit route table associations with respective subnets

6. **Security Groups**
   - Web tier security group allowing HTTPS (443) inbound from anywhere
   - App tier security group allowing traffic only from web tier
   - Follow least-privilege principles
   - No overly permissive 0.0.0.0/0 ingress rules except HTTPS on web tier

7. **VPC Flow Logs**
   - Enable VPC Flow Logs for all three VPCs
   - Store logs in CloudWatch Logs
   - Set 7-day retention period for logs
   - Capture all traffic (accepted and rejected)

8. **Stack Outputs**
   - Export VPC IDs for all environments
   - Export subnet IDs (public and private) for all environments
   - Export security group IDs for web and app tiers
   - Outputs should be usable by other Pulumi stacks

9. **Code Organization**
   - Implement Pulumi component resource pattern for reusability
   - Create reusable VPC component for dev, staging, and production
   - Proper error handling throughout the code

10. **Configuration Management**
    - Create configuration file for environment-specific settings
    - Use Pulumi stack configuration for parameterization
    - Support different CIDR ranges and AZ counts per environment

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation
- Use **Subnets** for network segmentation (6 per VPC)
- Use **Internet Gateway** for public internet access (1 per VPC)
- Use **NAT Gateway** for private subnet outbound traffic (3 per VPC)
- Use **Route Tables** for traffic routing
- Use **Security Groups** for network access control
- Use **CloudWatch Logs** for VPC Flow Log storage
- Use **VPC Flow Logs** for network traffic monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region with availability zones a, b, c
- Pulumi SDK version 3.x or higher required
- Node.js 16+ and TypeScript 4.x required

### Constraints

- VPC CIDR blocks must not overlap and use RFC 1918 private address spaces
- Each environment must have exactly 3 availability zones for redundancy
- NAT Gateways must be deployed in high availability mode (one per AZ)
- All route tables must have explicit associations with their respective subnets
- Security groups must follow least-privilege principles
- Use Pulumi stack references for cross-environment resource sharing if needed
- Enable VPC Flow Logs with 7-day retention in CloudWatch Logs
- Tag all resources with Environment, ManagedBy, and CostCenter tags
- All resources must be destroyable (no Retain policies)
- All resource names must include environmentSuffix parameter
- Include proper error handling and validation
- Use Pulumi's componentResource pattern for code reusability

## Success Criteria

- **Functionality**: All three VPCs (dev, staging, prod) deployed with 6 subnets each, proper routing, and security groups
- **Network Isolation**: Separate VPCs with non-overlapping CIDR ranges provide environment isolation
- **High Availability**: NAT Gateways deployed across 3 availability zones for redundancy
- **Security**: Least-privilege security groups, VPC Flow Logs enabled, proper IAM roles
- **Compliance**: VPC Flow Logs with CloudWatch Logs meet PCI-DSS audit requirements
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript code using Pulumi component pattern, well-tested, documented
- **Reusability**: VPC component can be instantiated multiple times for different environments
- **Destroyability**: All resources can be deleted cleanly without retention policies

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC infrastructure for dev, staging, and production environments
- Internet Gateway and NAT Gateway configuration
- Route tables with proper routing rules
- Security groups for web and app tiers
- VPC Flow Logs with CloudWatch Logs integration
- Pulumi component resource for VPC reusability
- Stack outputs for VPC IDs, subnet IDs, and security group IDs
- Unit tests for all components
- Integration tests validating resource creation
- Documentation with deployment instructions
- Configuration file for environment-specific settings
