# Three-Tier VPC Architecture for Payment Processing Platform

Hey team,

We're working with a fintech startup that needs to build a secure cloud foundation for their payment processing platform. They're dealing with sensitive financial data, so network isolation and security controls are critical to meet PCI DSS compliance requirements. The business wants us to establish a proper three-tier architecture that separates their load balancers, application servers, and databases into distinct network segments.

The challenge here is setting up proper network segmentation while maintaining high availability across multiple availability zones. They need public subnets for load balancers, private subnets for application servers with internet access through NAT gateways, and completely isolated database subnets with no internet routing whatsoever. The architecture needs to span three availability zones for resilience and must follow strict naming and tagging conventions for their cost management and compliance auditing.

## What we need to build

Create a comprehensive VPC infrastructure using **Pulumi with Python** for a payment processing platform that requires strict network segmentation and security controls.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Configure VPC flow logs to S3 bucket for security monitoring

2. **Public Subnet Tier**
   - Deploy 3 public subnets across 3 availability zones
   - CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Create internet gateway and attach to VPC
   - Deploy NAT gateways in each public subnet with Elastic IPs
   - Configure route table with routes to internet gateway

3. **Private Subnet Tier**
   - Deploy 3 private subnets across 3 availability zones
   - CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Configure route tables with routes to respective NAT gateways
   - Provide outbound internet access for application servers

4. **Database Subnet Tier**
   - Deploy 3 database subnets across 3 availability zones
   - CIDR blocks: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Create isolated route tables with no internet routing
   - Complete network isolation for database resources

5. **Security Groups**
   - Web tier security group allowing inbound HTTPS traffic on port 443
   - App tier security group allowing inbound traffic on port 8080
   - Database tier security group allowing inbound PostgreSQL traffic on port 5432
   - Implement least privilege access between tiers

6. **Stack Outputs**
   - Export VPC ID
   - Export all subnet IDs for each tier
   - Export security group IDs
   - Provide all resource IDs needed by application teams

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network foundation
- Use **EC2 Subnets** for network segmentation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway with Elastic IPs** for private subnet internet access
- Use **Route Tables** for traffic routing
- Use **Security Groups** for firewall rules
- Use **VPC Flow Logs** for security monitoring
- Use **S3** for flow log storage
- Deploy to **eu-central-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {environment}-{tier}-{resource}-{az}
- All resources must be destroyable without Retain policies

### Constraints

- VPC CIDR must be 10.0.0.0/16 with subnets sized for at least 250 hosts each
- Public subnets must only contain NAT gateways and ALB, no compute resources
- Private subnets must span exactly 3 availability zones for high availability
- Database subnets must be isolated with no direct internet routing
- Security groups must follow least privilege with explicit port definitions
- Route tables must be explicitly defined, not use default VPC routes
- All resources must be tagged with Environment, Team, and CostCenter tags
- Include proper error handling and logging
- All resources must be destroyable without retention policies

## Success Criteria

- **Functionality**: Fully deployed VPC with three-tier network segmentation
- **High Availability**: Resources span 3 availability zones
- **Security**: Proper network isolation between tiers with security groups
- **Routing**: Correct routing configured for each subnet tier
- **Monitoring**: VPC flow logs enabled for security monitoring
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, documented
- **Outputs**: All resource IDs exported for application team consumption

## What to deliver

- Complete Pulumi Python implementation
- VPC with DNS enabled
- 3 public subnets with internet gateway and NAT gateways
- 3 private subnets with NAT gateway routing
- 3 isolated database subnets
- Security groups for web, app, and database tiers
- VPC flow logs to S3 bucket
- Comprehensive stack outputs
- Documentation and deployment instructions