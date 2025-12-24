Hey team,

We need to build out a secure network infrastructure for our new payment processing system. I've been asked to create this using **Terraform with HCL** to meet PCI DSS compliance requirements. The business is launching a fintech platform and needs strict network segmentation across multiple availability zones for high availability.

The security team has been crystal clear about the isolation requirements. We're talking three-tier architecture with public subnets for load balancers, private subnets for application servers, and completely isolated database subnets with zero internet access. They want everything tagged and logged for audit purposes.

I've mapped out the network topology with the team, and we're going with a /16 CIDR block that gives us room to grow to at least 4000 hosts. We'll be spreading resources across three availability zones in us-east-1 for resilience. Each tier gets its own route tables and network ACLs with explicit deny-by-default rules.

## What we need to build

Create a production-grade VPC network infrastructure using **Terraform with HCL** for a payment processing system that meets PCI DSS compliance requirements.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS support
   - Must support future expansion to at least 4000 hosts

2. **Subnet Architecture**
   - Deploy 9 subnets total across 3 availability zones in us-east-1a, us-east-1b, and us-east-1c
   - 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - 3 database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Database subnets must have no direct internet access

3. **Internet Gateway**
   - Configure Internet Gateway that attaches to VPC for bidirectional internet access
   - Create route in public route table that directs internet-bound traffic to Internet Gateway
   - Provide internet access for public subnets

4. **NAT Gateway High Availability**
   - Deploy NAT Gateway in each of the 3 public subnets that connects to the Internet Gateway
   - Allocate 3 Elastic IPs that attach to NAT Gateways for outbound internet access
   - Configure private subnets to route outbound traffic through their local NAT Gateway
   - Ensure high availability mode across all availability zones

5. **Route Tables**
   - 1 public route table routing traffic to Internet Gateway
   - 3 private route tables, each routing to its local NAT Gateway
   - 1 database route table with local-only routing
   - Associate appropriate subnets to each route table

6. **Network ACLs**
   - Public NACL: allow ports 80 and 443 inbound for web traffic from internet
   - Private NACL: allow ports 8080-8090 inbound for application traffic from public tier
   - Database NACL: allow port 5432 only from private subnet ranges for secure database access
   - All NACLs must explicitly deny all traffic by default

7. **VPC Flow Logs**
   - Enable VPC Flow Logs that stream to CloudWatch Logs for centralized monitoring
   - Create CloudWatch log group with 30-day retention
   - Configure IAM role granting VPC Flow Logs write access to CloudWatch using specific actions: logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents
   - Capture all network traffic for audit compliance

8. **Tagging Strategy**
   - Tag all components with Environment=Production
   - Tag all components with Project=PaymentGateway
   - Include **environmentSuffix** parameter in all component names for uniqueness

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS VPC for network isolation
- Use NAT Gateway for high availability outbound connectivity
- Use Internet Gateway for public subnet internet access
- Use CloudWatch Logs for VPC Flow Logs storage
- Component names must include **environmentSuffix** variable for environment-specific deployments
- Follow naming convention: component-type-environmentSuffix
- Deploy to **us-east-1** region
- All components must be destroyable with proper deletion policies and no retain policies

### Constraints

- VPC CIDR block 10.0.0.0/16 must not overlap with existing networks
- Database subnets must use private IP ranges only with no internet access
- NAT Gateways must be in high availability mode across all AZs
- Route tables must enforce strict traffic separation between tiers
- Network ACLs must deny all by default and only allow specific ports
- All subnets must support future expansion requirements

### Deployment Requirements (CRITICAL)

- **Naming Convention**: Every infrastructure component MUST include the **environmentSuffix** variable in its name following the pattern vpc-SUFFIX or nat-gateway-SUFFIX-az1
- **Destroyability**: Every component must be fully destroyable without manual intervention. Do not use retain or snapshot policies
- **Region Configuration**: Target region is us-east-1 with availability zones us-east-1a, us-east-1b, and us-east-1c

## Success Criteria

- **Functionality**: All 9 subnets deployed across 3 AZs with proper routing
- **High Availability**: NAT Gateways deployed in all 3 availability zones
- **Network Isolation**: Database tier has no internet access, strict NACL rules enforced
- **Compliance**: VPC Flow Logs enabled with 30-day retention for PCI DSS audit requirements
- **Naming Convention**: All components include environmentSuffix variable
- **Tagging**: All components tagged with Environment=Production and Project=PaymentGateway
- **Code Quality**: Clean HCL code, properly structured, documented

## What to deliver

- Complete Terraform HCL implementation with proper variable usage
- VPC, subnets, Internet Gateway, NAT Gateways with Elastic IPs
- Route tables and route table associations for all three tiers
- Network ACLs with explicit port rules for public, private, and database tiers
- VPC Flow Logs configuration with CloudWatch Logs integration
- IAM role and policy for VPC Flow Logs
- Variables file with environmentSuffix, region, and CIDR configurations
- Outputs file showing VPC ID, subnet IDs, and NAT Gateway IPs
- Documentation with deployment and testing instructions
