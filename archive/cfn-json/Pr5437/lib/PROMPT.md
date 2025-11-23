Hey team,

We've got a startup launching their first SaaS application and they need us to set up their foundational network infrastructure in AWS. They're still in the early stages but want to do things right from the start - proper network segmentation, security groups following least privilege, the whole nine yards. They need an isolated environment where they can run their application tier, database servers, and have secure management access through a bastion host.

The infrastructure needs to be in us-east-1 and use CloudFormation for deployment. They want everything as code so they can replicate this setup later if needed. The network design should support a multi-tier web application with clear separation between public-facing components and internal resources.

I've been tasked with creating the initial VPC infrastructure. It's a greenfield deployment, so we're starting from scratch. The architecture team has already specified the network layout and security requirements based on their application needs.

## What we need to build

Create a foundational VPC network infrastructure using **CloudFormation with JSON** for a multi-tier web application deployment.

### Core Network Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16 in us-east-1
   - Enable DNS hostnames and DNS resolution for the VPC
   - This provides the base network with 65,536 IP addresses

2. **Subnet Architecture**
   - Deploy two public subnets (10.0.1.0/24, 10.0.2.0/24) across two availability zones
   - Deploy two private subnets (10.0.11.0/24, 10.0.12.0/24) across the same two AZs
   - Each AZ must have exactly one public and one private subnet
   - Public subnets will host NAT Gateways and bastion hosts
   - Private subnets will host application servers and databases

3. **Internet Connectivity**
   - Attach an Internet Gateway to the VPC for public subnet connectivity
   - Create two NAT Gateways (one per AZ) in the public subnets with Elastic IPs
   - All private subnets must have outbound internet access through NAT Gateways
   - This ensures high availability for outbound traffic

4. **Routing Configuration**
   - Configure route tables for public subnets to route traffic to Internet Gateway
   - Configure route tables for private subnets to route traffic to their respective NAT Gateways
   - Proper route table associations for all subnets

### Security Group Requirements

1. **Bastion Host Security Group**
   - Allow SSH (port 22) from a specific IP range (via parameter)
   - This will control management access to the environment

2. **Application Security Group**
   - Allow HTTP (port 80) and HTTPS (port 443) from the internet (0.0.0.0/0)
   - Allow SSH (port 22) only from the bastion host security group
   - Follow least privilege with explicit ingress rules only

3. **Database Security Group**
   - Allow MySQL (port 3306) only from the application security group
   - No direct internet access
   - Strictly limited to application tier communication

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation
- Use **Subnets** for network segmentation across AZs
- Use **Internet Gateway** for public internet access
- Use **NAT Gateways** for private subnet outbound connectivity
- Use **Elastic IPs** for NAT Gateway addressing
- Use **Route Tables** for traffic routing
- Use **Security Groups** for instance-level firewalling
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: vpc-environment-suffix, subnet-public-1-environment-suffix, etc.
- Deploy to **us-east-1** region
- Create Parameters section for EnvironmentSuffix and BastionSSHCIDR

### Constraints

- VPC must use CIDR block 10.0.0.0/16 (strict requirement)
- Security groups must follow least privilege principle
- All resources must be tagged with Environment, Project, and Owner tags
- All resources must be destroyable (no Retain policies)
- Include proper resource dependencies for correct deployment order
- Enable CloudWatch logging where applicable
- Follow CloudFormation best practices for resource organization

## Success Criteria

- Functionality: Complete VPC infrastructure with public and private subnets across two AZs
- Connectivity: Public subnets can reach internet via IGW, private subnets via NAT Gateways
- Security: Security groups properly restrict access following least privilege
- High Availability: Resources distributed across two availability zones
- Resource Naming: All resources include environmentSuffix parameter in their names
- Code Quality: Clean JSON, well-structured, properly documented
- Outputs: VPC ID, all subnet IDs, and security group IDs exported for cross-stack references

## What to deliver

- Complete CloudFormation JSON template (TapStack.json)
- Parameters section for EnvironmentSuffix and BastionSSHCIDR
- VPC with DNS settings enabled
- Four subnets (2 public, 2 private) across two AZs
- Internet Gateway and two NAT Gateways with Elastic IPs
- Route tables with proper associations
- Three security groups (bastion, application, database)
- Comprehensive tagging on all resources
- Outputs section with VPC ID, subnet IDs, and security group IDs
- Unit tests for template validation
- Integration tests for deployed infrastructure
- Documentation and deployment instructions
