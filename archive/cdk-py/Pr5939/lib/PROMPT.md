# Multi-Tier VPC Infrastructure for Payment Processing

Hey team,

We need to build a production-grade multi-tier VPC infrastructure for our new payment processing platform. This is a critical piece of infrastructure that needs to be rock-solid and follow AWS best practices. I've been asked to create this using Python with AWS CDK.

The business requirements are clear: we need a highly available network architecture that spans multiple availability zones to ensure our payment processing services can handle failures gracefully. The platform needs to support both public-facing components and secure backend services, with proper network isolation between application and database tiers.

Security is paramount here since we're dealing with payment data. We need comprehensive network monitoring through VPC Flow Logs, and everything must be tagged appropriately for compliance and cost tracking. The infrastructure also needs to be reproducible across different environments, so we're using an environment suffix pattern for all resource naming.

## What we need to build

Create a multi-tier VPC infrastructure using **AWS CDK with Python** for a payment processing platform that requires high availability across multiple availability zones.

### Core Requirements

1. **VPC Architecture**
   - VPC with CIDR block 10.0.0.0/16
   - Must span exactly 3 availability zones in us-east-1 (us-east-1a, us-east-1b, us-east-1c)
   - Three distinct subnet tiers: public, private application, and private database

2. **Public Subnet Tier**
   - 3 public subnets across 3 AZs
   - CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Internet Gateway attachment for outbound internet access
   - Will host load balancers and bastion hosts

3. **Private Application Tier**
   - 3 private subnets for application workloads
   - CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - NAT Gateway connectivity for outbound internet access
   - Will host application servers and microservices

4. **Private Database Tier**
   - 3 private subnets for database instances
   - CIDR blocks: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - No direct internet access
   - Isolated from application tier for security

5. **NAT Gateway Infrastructure**
   - 3 NAT Gateways, one per availability zone for high availability
   - Each NAT Gateway requires an Elastic IP address
   - NAT Gateways deployed in public subnets
   - Private subnets route internet-bound traffic through their AZ's NAT Gateway

6. **Network Monitoring**
   - VPC Flow Logs enabled for all network traffic
   - Flow logs delivered to CloudWatch Logs
   - 60-second aggregation interval for timely monitoring
   - Capture both accepted and rejected traffic for security analysis

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon VPC** for network infrastructure
- Use **NAT Gateway** for private subnet internet access
- Use **CloudWatch Logs** for VPC Flow Logs storage
- Use **IAM** for Flow Logs service role
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Use CDK L2 constructs for all resources
- All resources must be tagged with Environment=production and Project=payment-platform

### Constraints

- Must use exactly 3 availability zones (not rely solely on max_azs parameter)
- NAT Gateways cannot be avoided despite cost (business requirement for HA)
- Flow Log aggregation interval must be 60 seconds (AWS only supports 60 or 600)
- All resources must be destroyable with no Retain deletion policies
- No hardcoded account IDs or regions in stack code
- Subnet CIDR blocks must match specified ranges exactly
- Must output VPC ID, all subnet IDs, and NAT Gateway IDs for downstream usage

### Code Quality Requirements

- Well-structured CDK stack with clear separation of concerns
- Comprehensive unit tests achieving 100% code coverage
- Integration tests validating resource creation and configuration
- Proper error handling and validation
- Clear inline documentation for complex configurations
- Type hints throughout Python code

## Success Criteria

- **Functionality**: VPC successfully deploys with all specified subnets and routing
- **High Availability**: Infrastructure spans exactly 3 availability zones
- **Network Isolation**: Clear separation between public, application, and database tiers
- **Monitoring**: VPC Flow Logs capturing all traffic with 60-second intervals
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Python code follows PEP 8, includes type hints, well-tested and documented
- **Reproducibility**: Stack can be deployed to multiple environments using different suffixes

## What to deliver

- Complete AWS CDK Python implementation
- VPC with specified CIDR and subnet configuration
- NAT Gateways with Elastic IPs for high availability
- VPC Flow Logs with CloudWatch integration
- Comprehensive unit tests for all stack components
- Integration tests validating deployed infrastructure
- Stack outputs for VPC ID, subnet IDs, and NAT Gateway IDs
- Documentation including deployment instructions and architecture overview
