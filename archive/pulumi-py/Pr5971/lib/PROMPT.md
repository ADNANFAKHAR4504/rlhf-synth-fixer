Hey team,

We have a fintech startup client that needs to establish a secure network foundation in AWS for their payment processing application. This is critical infrastructure that must comply with PCI DSS requirements for network segmentation and access control. The business wants us to create a repeatable infrastructure-as-code solution that can deploy consistent networking across multiple AWS accounts. They specifically need this implemented using **Pulumi with Python** to align with their existing automation tooling.

The payment processing system requires high availability across multiple availability zones, proper network isolation between public-facing and private resources, and comprehensive logging for security compliance. The infrastructure must be production-ready from day one, with proper segmentation to handle payment card data securely.

## What we need to build

Create a VPC infrastructure using **Pulumi with Python** for a payment processing system. The solution must provide a secure, highly available network foundation that meets PCI DSS compliance requirements.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR 10.0.0.0/16
   - Enable DNS hostnames for the VPC
   - Resource names must include environmentSuffix for uniqueness

2. **Public Subnet Layer**
   - Deploy 3 public subnets across 3 availability zones
   - Public subnet CIDRs: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Internet Gateway attached to VPC
   - Public route tables pointing to Internet Gateway

3. **Private Subnet Layer**
   - Deploy 3 private subnets across the same 3 availability zones
   - Private subnet CIDRs: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - NAT Gateways for outbound internet access (one per AZ)
   - Private route tables pointing to respective NAT Gateways

4. **Routing Configuration**
   - Explicit route table names following pattern: Public-RouteTable-{AZ} and Private-RouteTable-{AZ}
   - Public subnets route 0.0.0.0/0 through Internet Gateway
   - Private subnets route 0.0.0.0/0 through NAT Gateway in same AZ
   - Route table associations for all subnets

5. **Security Controls**
   - Security group allowing only HTTPS (port 443) inbound from 0.0.0.0/0
   - VPC Flow Logs to CloudWatch with 5-minute capture intervals
   - All resources tagged with Environment=Production and Project=PaymentGateway

6. **Infrastructure Outputs**
   - Export VPC ID
   - Export all subnet IDs (public and private)
   - Export all NAT Gateway IDs
   - Export security group ID

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS VPC** for network isolation
- Use **AWS EC2** for subnets, NAT Gateways, Internet Gateway, route tables, and security groups
- Use **AWS CloudWatch** for VPC Flow Logs with 5-minute intervals
- Fetch availability zones dynamically using get_availability_zones()
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to us-east-1 region
- Use pulumi_aws package for all AWS resources

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Public subnets must use specific CIDRs: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Private subnets must use specific CIDRs: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Deploy exactly 3 NAT Gateways, one per availability zone for redundancy
- Security groups must block all inbound except HTTPS (443) from anywhere
- Route tables must have explicit names following pattern: {Type}-RouteTable-{AZ}
- All resources must be destroyable (no Retain policies)
- All resources must have tags: Environment=Production, Project=PaymentGateway
- Include proper error handling and logging
- Use Python type hints for code quality

## Success Criteria

- Functionality: VPC with 6 subnets across 3 AZs, proper routing, and security controls
- Performance: NAT Gateways provide high-throughput outbound connectivity
- Reliability: High availability with redundant NAT Gateways across all 3 AZs
- Security: Network segmentation, restricted security groups, and VPC Flow Logs enabled
- Compliance: Architecture supports PCI DSS requirements for network isolation
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Python code with type hints, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Pulumi configuration files (Pulumi.yaml, __main__.py)
- VPC resource with DNS hostnames enabled
- 3 public subnets and 3 private subnets across 3 availability zones
- Internet Gateway and 3 NAT Gateways with Elastic IPs
- Route tables with explicit names and proper associations
- Security group with HTTPS-only inbound rule
- VPC Flow Logs to CloudWatch with 5-minute intervals
- IAM role for VPC Flow Logs
- All required tags on all resources
- Comprehensive unit tests for all components
- Documentation and deployment instructions
