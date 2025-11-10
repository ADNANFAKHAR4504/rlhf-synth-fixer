Hey team,

We need to build a secure cloud foundation for a fintech startup's payment processing platform. This is for production-grade network infrastructure that meets PCI compliance requirements. I've been asked to create this using **CDK with Go** to establish proper network isolation between different application tiers.

The business is essentially building a payment processing platform and they need rock-solid network security boundaries. They want a three-tier VPC architecture that can scale and meet strict compliance standards. The platform needs to handle payment data, so security is absolutely critical here.

This needs to be deployed in us-east-1 across three availability zones for high availability. We're talking about a complete VPC foundation with public, private, and database subnet tiers, NAT Gateways for outbound connectivity, comprehensive logging for compliance monitoring, and proper load balancing for ingress traffic.

## What we need to build

Create a secure three-tier VPC architecture using **CDK with Go** for a payment processing platform.

### Core Requirements

1. **VPC Architecture**
   - VPC with CIDR 10.0.0.0/16 across three availability zones
   - Three subnet tiers per AZ: public (10.0.1-3.0/24), private (10.0.11-13.0/24), and database (10.0.21-23.0/24)
   - One NAT Gateway per availability zone in the public subnets
   - Route tables configured so private subnets route through NAT Gateways and database subnets have no internet routes

2. **Security Configuration**
   - Security groups for web tier (ports 80/443 from internet), app tier (port 8080 from web tier only), and database tier (port 5432 from app tier only)
   - Network ACLs that deny all traffic by default, then allow only necessary ports between tiers
   - Security groups following least-privilege principles with no 0.0.0.0/0 inbound rules

3. **Compliance and Monitoring**
   - VPC Flow Logs with CloudWatch Logs as destination, capturing all traffic types
   - All resources tagged with Environment=Production and Project=PaymentPlatform

4. **Cost Optimization**
   - VPC endpoints for S3 and DynamoDB to reduce NAT Gateway costs

5. **Outputs and Integration**
   - Export VPC ID, subnet IDs, and security group IDs as CloudFormation outputs

### Technical Requirements

- All infrastructure defined using **CDK with Go**
- Use **VPC** for network foundation
- Use **EC2** for NAT Gateways and security groups
- Use **CloudWatch** for VPC Flow Logs
- Use **ELB** for Application Load Balancer
- Use **S3** and **DynamoDB** VPC endpoints
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Constraints

- VPC must use non-overlapping CIDR blocks that allow for future expansion
- All database subnets must be completely private with no internet gateway attachments
- NAT instances are prohibited; use NAT Gateways for outbound connectivity
- Each availability zone must have dedicated subnets for each tier
- VPC Flow Logs must be enabled and sent to CloudWatch Logs
- Network ACLs must explicitly deny all traffic by default except required ports
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Network Isolation**: Complete separation between public, private, and database tiers
- **High Availability**: Resources distributed across three availability zones
- **Security**: Least-privilege security groups and restrictive Network ACLs
- **Compliance**: VPC Flow Logs capturing all traffic for audit requirements
- **Scalability**: CIDR allocation supports future growth
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Go code, well-structured, documented

## What to deliver

- Complete CDK Go implementation
- VPC, EC2, CloudWatch, ELB, S3, DynamoDB services integration
- Unit tests for all components
- Documentation and deployment instructions