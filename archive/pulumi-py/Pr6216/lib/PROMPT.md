Hey team,

We need to build a production-ready VPC infrastructure for a fintech startup that's launching a payment processing platform. They're dealing with sensitive financial data and need to meet PCI-DSS compliance requirements, so network segmentation and security are non-negotiable. The business has asked us to create this in Python using Pulumi, and they want everything set up in the eu-central-1 region.

The startup is building their payment platform from scratch and needs a solid foundation. They've emphasized that security and compliance are the top priorities since they'll be handling credit card transactions. They also need to integrate with their existing on-premises systems, so hybrid connectivity is essential. The architecture needs to support multiple tiers of applications with proper isolation between web, application, and database layers.

They're starting with a three-tier architecture and want room to scale as they grow. The team has mentioned they'll be deploying containerized workloads and serverless functions, so the network needs to accommodate various types of compute resources. They also want comprehensive logging and monitoring from day one, with all traffic flows captured for audit purposes.

## What we need to build

Create a network infrastructure using **Pulumi with Python** for a PCI-DSS compliant payment processing platform.

### Core Requirements

1. **VPC Configuration**
   - VPC with CIDR 10.0.0.0/16
   - DNS hostnames and DNS resolution enabled
   - Deploy to eu-central-1 region

2. **Multi-Tier Subnet Architecture**
   - Three public subnets across availability zones (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - Three private application subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
   - Three database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
   - All subnets distributed across exactly 3 availability zones

3. **Internet Connectivity**
   - Internet Gateway attached to VPC
   - Three NAT Gateways, one in each public subnet
   - Elastic IP addresses for each NAT Gateway

4. **Routing Configuration**
   - Separate route tables for each subnet tier
   - Public subnets route internet traffic through Internet Gateway
   - Private subnets route internet traffic through NAT Gateways in same AZ
   - Database subnets have no direct internet routing

5. **Network Security**
   - Network ACLs that explicitly deny all traffic except required ports
   - Allow HTTPS (443) from specific IP ranges
   - Allow SSH (22) from specific IP ranges
   - Allow database traffic (5432) between application and database tiers
   - Follow principle of least privilege

6. **Logging and Monitoring**
   - VPC Flow Logs enabled for all network traffic
   - S3 bucket to store Flow Logs
   - 90-day lifecycle policy on Flow Logs in S3

7. **Hybrid Connectivity**
   - Transit Gateway created for connecting to on-premises networks
   - Transit Gateway VPC Attachment configured
   - Export Transit Gateway attachment ID

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS VPC** for network foundation
- Use **NAT Gateways** for private subnet internet access (one per AZ)
- Use **Transit Gateway** for hybrid connectivity
- Use **S3** for VPC Flow Logs storage
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: {env}-{tier}-{resource}-{az} pattern
- Deploy to **eu-central-1** region
- Use availability zones: eu-central-1a, eu-central-1b, eu-central-1c

### Constraints

- VPC CIDR must be 10.0.0.0/16 with no overlap to existing corporate networks
- Public subnets should only host NAT gateways and load balancers
- Private application subnets must span exactly 3 availability zones
- Database subnets must have no direct internet routing
- Network ACLs must explicitly deny all traffic except required ports
- All resources must be destroyable with no Retain policies
- PCI-DSS compliant network segmentation required
- Encryption at rest and in transit for all data
- Least privilege IAM roles for all services
- Include proper error handling and logging

### Success Criteria

- Functionality: Complete three-tier network with proper isolation and routing
- Performance: Low-latency routing with multiple availability zones for high availability
- Reliability: Redundant NAT Gateways and multi-AZ deployment
- Security: Network ACLs enforcing port restrictions, VPC Flow Logs enabled, no direct database internet access
- Resource Naming: All resources include environmentSuffix variable
- Code Quality: Well-structured Python code with proper type hints and documentation
- Compliance: PCI-DSS compliant network segmentation achieved
- Monitoring: VPC Flow Logs captured and retained for 90 days

## What to deliver

- Complete Pulumi Python implementation with all infrastructure defined
- VPC with DNS support
- Nine subnets across three tiers and three availability zones
- Internet Gateway and three NAT Gateways with Elastic IPs
- Route tables configured for each subnet tier
- Network ACLs with explicit allow rules for ports 22, 443, and 5432
- VPC Flow Logs enabled and stored in S3 with lifecycle policy
- Transit Gateway and VPC attachment for hybrid connectivity
- Stack outputs exporting VPC ID, all subnet IDs grouped by tier, and Transit Gateway attachment ID
- Unit tests for infrastructure validation
- Documentation with deployment instructions and architecture diagram
