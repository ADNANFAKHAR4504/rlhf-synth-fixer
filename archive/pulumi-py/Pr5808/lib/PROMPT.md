Hey team,

We've got an interesting project from a fintech startup that's building out their payment processing infrastructure. They need a rock-solid network foundation that can handle PCI-DSS compliance requirements while keeping their payment data secure and isolated. The business is asking us to set this up in AWS using Pulumi with Python.

The challenge here is that they're processing financial transactions, so network segmentation isn't just a best practice - it's a compliance requirement. They need clear separation between their public-facing components and the backend systems that actually handle the sensitive payment data. Plus, they want high availability across multiple availability zones so a single AZ failure doesn't take down their payment processing.

I've been working with their architecture team, and they've laid out pretty specific requirements around the network topology, subnet sizing, and security controls. They're particularly focused on getting the logging and monitoring right from day one since audit trails are critical for PCI-DSS.

## What we need to build

Create a production-ready VPC infrastructure using **Pulumi with Python** for a payment processing system deployed in the us-east-1 region.

### Core Requirements

1. VPC Configuration
   - VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Deploy across 3 availability zones for high availability

2. Public Subnet Tier
   - Create 3 public subnets (one per AZ)
   - Use /24 CIDR blocks starting from 10.0.1.0/24
   - These will host load balancers and NAT gateways

3. Private Subnet Tier
   - Create 3 private subnets (one per AZ)
   - Use /23 CIDR blocks starting from 10.0.10.0/23
   - These will host application servers processing payments

4. Internet Connectivity
   - Create and attach an Internet Gateway to the VPC
   - Deploy one NAT Gateway per public subnet with Elastic IPs
   - Configure high-availability NAT across all AZs

5. Routing Configuration
   - Public subnet route tables with 0.0.0.0/0 pointing to Internet Gateway
   - Private subnet route tables with 0.0.0.0/0 pointing to NAT Gateway in same AZ
   - Associate route tables with appropriate subnets

6. Network Security
   - Create Network ACLs for public subnets
   - Allow only HTTP (80), HTTPS (443), and SSH (22) inbound
   - Allow all outbound traffic
   - Explicitly deny all other traffic

7. Logging and Compliance
   - Enable VPC Flow Logs for all traffic
   - Store logs in S3 bucket with server-side encryption
   - Configure 30-day retention policy

8. Resource Tagging
   - Tag all resources with Environment='production'
   - Tag all resources with Project='payment-gateway'

9. Stack Outputs
   - Export VPC ID
   - Export all subnet IDs (public and private)
   - Export all NAT Gateway IDs

### Technical Requirements

- All infrastructure defined using Pulumi with Python
- Use aws.ec2.Vpc for VPC creation
- Use aws.ec2.Subnet for subnet resources
- Use aws.ec2.InternetGateway for internet connectivity
- Use aws.ec2.NatGateway with aws.ec2.Eip for NAT resources
- Use aws.ec2.RouteTable and aws.ec2.Route for routing
- Use aws.ec2.NetworkAcl for network access control lists
- Use aws.ec2.FlowLog for VPC flow logging
- Use aws.s3.Bucket for flow log storage
- Deploy to us-east-1 region
- Resource names must include environmentSuffix variable for uniqueness
- Follow naming convention: f"{resource-type}-{environmentSuffix}"
- All resources must be destroyable with no retention policies
- S3 bucket must have force_destroy=True for testing environments

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Public subnets must be /24 blocks
- Private subnets must be /23 blocks
- NAT Gateways must be deployed in all 3 AZs (high availability)
- Resource naming pattern: production-{resource-type}-{az-suffix}
- Network ACLs must use explicit deny rules
- VPC Flow Logs retention must be 30 days
- All S3 data must be encrypted at rest
- No deletion protection or retain policies allowed

## Success Criteria

- Functionality: Complete VPC with multi-AZ deployment, working internet connectivity through IGW and NAT Gateways
- Performance: High availability with NAT in each AZ for optimal latency
- Reliability: Infrastructure survives single AZ failure
- Security: Network ACLs enforcing traffic restrictions, encrypted S3 storage, VPC Flow Logs enabled
- Resource Naming: All resources include environmentSuffix variable in names
- Code Quality: Clean Python code, well-commented, follows Pulumi best practices
- Compliance: Architecture supports PCI-DSS requirements for network segmentation

## What to deliver

- Complete Pulumi Python implementation in tap.py
- VPC with 10.0.0.0/16 CIDR
- 3 public subnets (/24) and 3 private subnets (/23) across availability zones
- Internet Gateway for public access
- 3 NAT Gateways with Elastic IPs for high availability
- Route tables properly configured for public and private subnets
- Network ACLs restricting inbound traffic to ports 80, 443, 22
- VPC Flow Logs with S3 storage (encrypted, 30-day retention)
- Proper resource tagging (Environment, Project)
- Stack exports for VPC ID, subnet IDs, and NAT Gateway IDs
- Unit tests with minimum 90% coverage
- Integration tests using actual AWS outputs
- Documentation and deployment instructions
