# Multi-Tier VPC Architecture for Payment Processing

Hey team,

We need to build a solid network foundation for our payment processing environment. Our fintech startup is growing fast and we need to establish a proper AWS environment that can handle payment transactions securely. The architecture needs to provide network isolation between different application tiers while maintaining secure internet connectivity for updates and third-party API integrations.

I've been asked to create this infrastructure using **CDKTF with Python**. The business requirements are clear: we need a production-ready VPC that supports high availability across three availability zones in the eu-west-1 region. The network needs to be segmented into public subnets for load balancers and bastion hosts, private application subnets for our payment processing services, and completely isolated database subnets for sensitive data storage.

This is foundational infrastructure that everything else will build on top of. We need to get the networking right from the start because changing it later would be extremely disruptive. The security team has emphasized that database resources must have zero direct internet access, and we need comprehensive network traffic logging for compliance purposes.

## What we need to build

Create a production-grade multi-tier VPC architecture using **CDKTF with Python** for a payment processing environment in the eu-west-1 region.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Deploy across three availability zones in eu-west-1 (eu-west-1a, eu-west-1b, eu-west-1c)
   - Enable DNS hostnames and DNS support for the VPC

2. **Public Subnets**
   - Create three public subnets with CIDR blocks:
     - 10.0.1.0/24 (AZ 1)
     - 10.0.2.0/24 (AZ 2)
     - 10.0.3.0/24 (AZ 3)
   - Configure auto-assign public IP addresses
   - Route table with 0.0.0.0/0 pointing to Internet Gateway

3. **Private Application Subnets**
   - Create three private subnets with CIDR blocks:
     - 10.0.11.0/24 (AZ 1)
     - 10.0.12.0/24 (AZ 2)
     - 10.0.13.0/24 (AZ 3)
   - Route tables with 0.0.0.0/0 pointing to respective NAT Gateways
   - No public IP auto-assignment

4. **Database Subnets**
   - Create three database subnets with CIDR blocks:
     - 10.0.21.0/24 (AZ 1)
     - 10.0.22.0/24 (AZ 2)
     - 10.0.23.0/24 (AZ 3)
   - No internet routing (no 0.0.0.0/0 route)
   - Isolated from public internet entirely

5. **NAT Gateway Configuration**
   - Deploy one NAT Gateway in each availability zone (3 total)
   - Place NAT Gateways in public subnets
   - Allocate Elastic IP addresses for each NAT Gateway
   - Ensure fault tolerance across AZs

6. **Route Tables**
   - Public route table: routes to Internet Gateway for all public subnets
   - Three private route tables: one per AZ, routing through respective NAT Gateway
   - Three database route tables: local VPC routing only, no internet access
   - Explicit subnet associations for all subnets

7. **VPC Flow Logs**
   - Enable VPC Flow Logs for the entire VPC
   - Capture ALL traffic (both accepted and rejected)
   - Store logs in S3 bucket with lifecycle policy
   - S3 bucket must have 30-day lifecycle policy to automatically delete old logs

8. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=PaymentGateway
   - Include **environmentSuffix** in all resource names for uniqueness

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** for network foundation
- Use **Subnets** for network segmentation across three tiers
- Use **Internet Gateway** for public subnet internet access
- Use **NAT Gateways** (3 total, one per AZ) for private subnet outbound connectivity
- Use **Route Tables** for traffic routing configuration
- Use **VPC Flow Logs** to capture network traffic
- Use **S3** for Flow Logs storage with 30-day retention
- Deploy to **eu-west-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and output exports

### Constraints

- NAT Gateways must be deployed one per availability zone for fault tolerance (3 total)
- Database subnets must have no direct internet routing (no default route to IGW or NAT)
- All subnets must be explicitly associated with their respective route tables
- VPC Flow Logs must capture ALL traffic types (accepted and rejected)
- S3 bucket for VPC Flow Logs must include lifecycle policy to delete logs after 30 days
- No hardcoded availability zone names - derive from region dynamically
- Use explicit route table associations, not implicit defaults
- All resources must be properly tagged for resource management

## Success Criteria

- **Functionality**: VPC deployed with all three subnet tiers across 3 AZs
- **High Availability**: Redundant NAT Gateways providing fault-tolerant outbound connectivity
- **Network Isolation**: Database subnets completely isolated from internet
- **Routing**: Correct routing configuration enabling secure tier-to-tier communication
- **Monitoring**: VPC Flow Logs capturing all network traffic to S3
- **Resource Naming**: All resources include environmentSuffix parameter
- **Compliance**: All resources tagged with Environment=Production and Project=PaymentGateway
- **Lifecycle Management**: S3 Flow Logs bucket has 30-day deletion policy
- **Code Quality**: Python code following CDKTF patterns, well-structured, documented

## What to deliver

- Complete CDKTF Python implementation in lib/ directory
- VPC with Internet Gateway
- Three public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- Three private application subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- Three database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- Three NAT Gateways with Elastic IPs (one per AZ)
- Route tables properly configured for each subnet type
- VPC Flow Logs with S3 storage and lifecycle policy
- Proper resource naming with environmentSuffix
- Stack outputs for VPC ID, subnet IDs, and other key resources
- Documentation in lib/README.md