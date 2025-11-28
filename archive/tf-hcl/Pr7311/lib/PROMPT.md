Hey team,

We've been tasked with building out the network foundation for a fintech startup's payment processing system. They're serious about security and compliance - this needs to meet PCI DSS requirements while being highly available across multiple zones. The business needs strict network isolation between their load balancers, application servers, and databases.

I've been asked to create this infrastructure using Terraform with HCL. The architecture team has specified a three-tier design with public, private, and database subnets spread across three availability zones in us-east-1. They need this to support around 4000 hosts with room to grow.

The networking team is particularly concerned about isolation - they want database subnets completely cut off from the internet, with NAT Gateways in high availability mode for outbound traffic from the private tiers. We also need to implement Network ACLs with explicit deny-by-default rules.

## What we need to build

Create a production-grade AWS VPC network infrastructure using **Terraform with HCL** that provides strict network segmentation for a payment processing system.

### Core Requirements

1. VPC Configuration
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS support
   - Support expansion to at least 4000 hosts

2. Subnet Architecture
   - Deploy 9 subnets across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

3. Internet Connectivity
   - Configure Internet Gateway and attach to VPC
   - Enable internet access for public subnets only

4. NAT Gateway Configuration
   - Deploy NAT Gateway in each of the 3 public subnets
   - Allocate and associate Elastic IP for each NAT Gateway
   - Ensure high availability mode across all availability zones

5. Routing Configuration
   - Create 1 public route table routing to Internet Gateway
   - Create 3 private route tables, each routing to its local NAT Gateway
   - Create 1 database route table with local VPC routes only (no internet)
   - Associate route tables with appropriate subnets

6. Network Access Control Lists
   - Public subnets: Allow inbound traffic on ports 80 and 443
   - Private subnets: Allow inbound traffic on ports 8080-8090
   - Database subnets: Allow inbound traffic on port 5432 only from private subnet CIDR ranges
   - All NACLs must deny all traffic by default, then explicitly allow required ports

7. VPC Flow Logs
   - Enable VPC Flow Logs to CloudWatch Logs
   - Create CloudWatch Logs group with 30-day retention
   - Capture all traffic (ACCEPT and REJECT)

8. Resource Tagging
   - Tag all resources with Environment=Production
   - Tag all resources with Project=PaymentGateway

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use AWS provider version 5.x or higher
- Terraform version 1.5 or higher
- Deploy to us-east-1 region
- Resource names must include environmentSuffix variable for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- All resources must be destroyable (no DeletionProtection, no Retain policies)
- Use non-overlapping CIDR blocks that support future expansion
- Database subnets must have no direct internet access
- Route tables must enforce strict traffic separation between tiers

### Deployment Requirements (CRITICAL)

- Resource Naming: All named resources (VPC, subnets, route tables, NAT gateways, CloudWatch log groups, etc.) must include the environmentSuffix variable for uniqueness and multi-environment support
- Destroyability: All resources must be fully destroyable after testing. Do not use any Retain policies or deletion protection flags
- IAM Permissions: Ensure proper IAM roles and policies for VPC Flow Logs to write to CloudWatch Logs
- CIDR Planning: Use the specified CIDR blocks exactly as provided to avoid overlap with existing infrastructure

### Constraints

- VPC must use non-overlapping CIDR blocks with capacity for 4000+ hosts
- Database subnets must use private IP ranges with no internet gateway routes
- NAT Gateways must be deployed across all three availability zones for redundancy
- Route tables must maintain strict separation between public, private, and database traffic
- Network ACLs must implement explicit deny-all defaults with specific allow rules
- All security controls must support PCI DSS compliance requirements

### Optional Enhancements

If time permits, consider adding:
- VPC endpoints for S3 and DynamoDB to reduce NAT Gateway costs and improve security
- Transit Gateway for future multi-VPC connectivity and enterprise-scale networking
- Route 53 Resolver endpoints for hybrid DNS resolution with on-premise systems

## Success Criteria

- Functionality: All 9 subnets deployed across 3 AZs with proper routing
- High Availability: NAT Gateways operational in all public subnets for redundancy
- Network Isolation: Database subnets have zero internet access, private subnets route through NAT
- Security: Network ACLs enforce port restrictions per tier
- Compliance: VPC Flow Logs enabled and capturing all traffic to CloudWatch
- Resource Naming: All resources include environmentSuffix for uniqueness
- Tagging: All resources properly tagged with Environment and Project
- Destroyability: All resources can be cleanly destroyed via terraform destroy
- Code Quality: HCL code is well-structured, properly formatted, and follows Terraform best practices

## What to deliver

- Complete Terraform HCL implementation with all required resources
- VPC with Internet Gateway
- 9 subnets across 3 availability zones (public, private, database)
- 3 NAT Gateways with Elastic IPs
- Route tables with proper associations
- Network ACLs with tier-specific rules
- VPC Flow Logs with CloudWatch Logs integration
- IAM role for Flow Logs
- All resources properly tagged
- Variables file defining environment_suffix and aws_region
- Documentation in README.md format
