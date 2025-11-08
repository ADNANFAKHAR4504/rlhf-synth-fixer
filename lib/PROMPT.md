# Secure VPC Infrastructure for Financial Trading Platform

Hey team,

We're helping a financial services startup build out their AWS environment for a new trading platform. They need rock-solid network infrastructure that meets PCI-DSS compliance requirements - we're talking full network segmentation with isolated environments for different workloads. The business is pretty specific about what they need here, and compliance is non-negotiable.

I've been asked to create this infrastructure using **CFN with YAML**. The platform needs to support a multi-tier application architecture with proper separation between web-facing resources, application servers, and databases. We're building this from scratch in us-east-1, and everything needs to be production-ready from day one.

The key challenge here is setting up the networking foundation that can handle their trading platform's requirements while maintaining strict security boundaries. We need multiple availability zones for high availability, separate subnet tiers for different workload types, and all the connectivity infrastructure to make it work seamlessly.

## What we need to build

Create a production-ready VPC infrastructure using **CFN with YAML** for a multi-tier financial trading application.

### Core Networking Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Span across 3 availability zones in us-east-1

2. **Public Subnet Layer**
   - Deploy 3 public subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.1.0 (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - For load balancers and bastion hosts

3. **Private Subnet Layer**
   - Deploy 3 private subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.11.0 (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
   - For application servers

4. **Database Subnet Layer**
   - Deploy 3 database subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.21.0 (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
   - For RDS instances

5. **Internet Connectivity**
   - Configure Internet Gateway and attach to VPC
   - Create 3 NAT Gateways (one per AZ) in public subnets
   - Provision Elastic IPs for each NAT Gateway

6. **Routing Configuration**
   - Set up route tables for each subnet type
   - Public subnets route to Internet Gateway
   - Private and database subnets route to NAT Gateways in their respective AZs
   - Follow naming pattern: {vpc-name}-{subnet-type}-rt-{az}

7. **Network Access Control**
   - Configure Network ACLs with deny-by-default policy
   - Allow HTTP/HTTPS ingress on public subnets
   - Allow database connections only from private subnets
   - Implement explicit allow rules for required traffic

8. **Monitoring and Logging**
   - Enable VPC Flow Logs
   - Send logs to CloudWatch Logs
   - Set retention period to 7 days

9. **Stack Outputs**
   - VPC ID
   - Subnet IDs grouped by type (public, private, database)
   - NAT Gateway IDs
   - All outputs formatted for cross-stack references

### Technical Requirements

- All infrastructure defined using **CFN with YAML**
- Use AWS VPC for network foundation
- Use EC2 services (NAT Gateway, Internet Gateway)
- Use CloudWatch for VPC Flow Logs
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to us-east-1 region

### Constraints

- VPC CIDR must be 10.0.0.0/16 with no overlapping subnets
- Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- NAT Gateways must be in separate Availability Zones
- Route tables must follow naming pattern: {vpc-name}-{subnet-type}-rt-{az}
- Network ACLs deny all by default with explicit allows only
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Tag all resources with Environment, Project, and CostCenter
- PCI-DSS compliant network segmentation
- Encryption at rest using AWS KMS
- Encryption in transit using TLS/SSL
- Follow principle of least privilege
- CloudWatch logging and monitoring enabled

## Success Criteria

- Functionality: CFN template deploys successfully with all 9 networking requirements
- Performance: Infrastructure supports multi-tier application with proper routing
- Reliability: Resources deployed across 3 availability zones with NAT Gateway redundancy
- Security: PCI-DSS compliant network segmentation with proper ACLs and encryption
- Resource Naming: All resources include environmentSuffix parameter for unique naming
- Code Quality: YAML format, well-tested with 90%+ coverage, fully documented
- Destroyability: All resources can be cleanly deleted without retention policies
- Monitoring: VPC Flow Logs enabled and sending to CloudWatch with 7-day retention
- Network ACLs: Deny-by-default with explicit allows following least privilege

## What to deliver

- Complete CFN YAML template implementation
- VPC with DNS enabled (10.0.0.0/16)
- 3 public subnets with Internet Gateway connectivity
- 3 private subnets with NAT Gateway connectivity
- 3 database subnets with controlled access
- Network ACLs implementing security controls
- VPC Flow Logs with CloudWatch integration
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs for cross-stack references
