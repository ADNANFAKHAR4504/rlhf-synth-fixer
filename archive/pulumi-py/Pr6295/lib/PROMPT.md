Hey team,

We've been tasked with setting up the cloud foundation for our new fintech payment processing platform. This is a critical piece of infrastructure that needs to meet PCI-DSS compliance requirements, particularly around network segmentation. The business is counting on us to get this right from the start since we'll be handling sensitive payment data.

I've been working with the security and compliance teams to understand exactly what we need. They're adamant about proper network isolation between different application tiers - we can't have our public-facing load balancers sitting in the same network space as our backend payment processors. The auditors will want to see clear separation with proper logging and monitoring in place.

The architecture team has mapped out a multi-AZ setup in us-east-1 that should give us the redundancy we need while keeping costs reasonable. We're talking about spreading across three availability zones with both public and private subnets in each zone. The application servers will live in the private subnets with no direct internet access, while the load balancers will be in the public subnets handling incoming traffic.

## What we need to build

Create a production-ready VPC infrastructure using **Pulumi with Python** for our payment processing application that meets PCI-DSS network segmentation requirements.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames for service discovery
   - Deploy across us-east-1a, us-east-1b, and us-east-1c availability zones

2. **Network Segmentation**
   - Deploy 6 subnets total: 1 public and 1 private per availability zone
   - Public subnets for load balancers and bastion hosts
   - Private subnets for application servers and databases
   - Proper CIDR allocation across all subnets

3. **Internet Connectivity**
   - Configure Internet Gateway with environment-specific naming (format: igw-{environment}-{region})
   - Deploy NAT Gateways in each public subnet for private subnet outbound traffic
   - Each private subnet routes through NAT Gateway in same availability zone

4. **Routing Configuration**
   - Create route tables for public subnets with 0.0.0.0/0 route to Internet Gateway
   - Create route tables for private subnets with 0.0.0.0/0 route to respective NAT Gateway
   - Explicitly associate route tables with their respective subnets

5. **Network Access Control**
   - Implement Network ACLs for public subnets allowing only HTTP (port 80) and HTTPS (port 443) inbound
   - Allow all outbound traffic from public subnets
   - Explicitly deny all other inbound traffic

6. **Security Monitoring**
   - Enable VPC Flow Logs to capture all network traffic
   - Configure Flow Logs to publish to a new CloudWatch Log Group
   - Retain logs for compliance and security analysis

7. **Resource Tagging**
   - Apply consistent tags across all resources: Environment, Tier, and Purpose
   - All resource names must include **environmentSuffix** for uniqueness
   - Follow naming convention: {resource-type}-environment-suffix

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation
- Use **Subnets** for network segmentation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateway** for private subnet outbound connectivity
- Use **Route Tables** for traffic routing
- Use **Network ACLs** for subnet-level security
- Use **VPC Flow Logs** for network monitoring
- Use **CloudWatch Logs** for log aggregation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- VPC must use exactly 10.0.0.0/16 CIDR block
- Each availability zone must have exactly one public and one private subnet
- Private subnets must route outbound traffic through NAT Gateways in same AZ
- All subnets must have descriptive tags including Tier and Purpose
- Network ACLs must explicitly deny all traffic except HTTP/HTTPS on public subnets
- VPC Flow Logs must be enabled and sent to CloudWatch Logs
- Internet Gateway must follow name format: igw-{environment}-{region}
- Route tables must be explicitly associated with their respective subnets
- All resources must be destroyable (no Retain policies)
- Include proper error handling and resource dependencies

## Success Criteria

- **Functionality**: VPC deployed with proper network segmentation across 3 AZs
- **Compliance**: Network ACLs enforce PCI-DSS segmentation requirements
- **Connectivity**: Private subnets can reach internet through NAT Gateways
- **Monitoring**: VPC Flow Logs capturing all network traffic to CloudWatch
- **Security**: Proper isolation between public and private tiers
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation
- VPC with DNS hostnames enabled
- 6 subnets across 3 availability zones (public and private)
- Internet Gateway with proper naming
- NAT Gateways in each public subnet
- Route tables with appropriate associations
- Network ACLs restricting public subnet traffic
- VPC Flow Logs with CloudWatch Log Group
- Unit tests for all components
- Documentation and deployment instructions
- Exported outputs: VPC ID, subnet IDs, NAT Gateway IDs, Flow Log ID
