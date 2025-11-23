I need help building a hub-and-spoke network architecture in AWS using Transit Gateway. We're a financial services company launching digital banking services, and we need a solid network foundation that's scalable, secure, and cost-effective.

## Technology Stack: Terraform HCL

**All infrastructure must be written in Terraform 1.5+ using HCL with AWS Provider 5.x.** This is for our production AWS environment in us-east-1.

## What We're Building

We need a centralized hub-and-spoke network where:
- One central "hub" VPC handles shared services, internet access, and DNS
- Multiple "spoke" VPCs host different environments (production, development, etc.)
- Everything connects through AWS Transit Gateway (no VPC peering)
- Spoke VPCs are completely isolated from each other (can't talk directly)
- All spoke internet traffic goes through the hub (cost savings on NAT Gateways)
- Centralized DNS resolution from the hub to all spokes

## The VPCs We Need

### Hub VPC (Central Services)
- **CIDR:** 10.0.0.0/16
- **Availability Zones:** 3 (use data source to fetch dynamically, don't hardcode)
- **Subnets:**
  - Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (one per AZ)
  - Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 (one per AZ)
- **Internet Gateway:** Yes, in public subnets
- **NAT Gateways:** Yes, one in each public subnet (these will be shared by all spokes)
- **Purpose:** Shared services, internet egress point, DNS resolver

### Production Spoke VPC
- **CIDR:** 10.1.0.0/16
- **Availability Zones:** 3 (same as hub)
- **Subnets:**
  - Public subnets: Small, for potential ALBs or bastion hosts
  - Private subnets: Large, for application workloads
- **Internet Gateway:** No
- **NAT Gateways:** No (routes through hub)
- **Purpose:** Production digital banking applications

### Development Spoke VPC
- **CIDR:** 10.2.0.0/16
- **Availability Zones:** 3 (same as hub)
- **Subnets:**
  - Public subnets: Small
  - Private subnets: Large
- **Internet Gateway:** No
- **NAT Gateways:** No (routes through hub)
- **Purpose:** Development and testing

## Transit Gateway Configuration

Create an AWS Transit Gateway that connects all VPCs with these requirements:

**Transit Gateway Settings:**
- DNS support enabled
- VPN ECMP support enabled
- Default route table association: disabled (we're using custom route tables)
- Amazon side ASN: configurable (maybe 64512)

**VPC Attachments:**
- Hub VPC attached with subnets from all 3 AZs
- Production VPC attached with subnets from all 3 AZs
- Development VPC attached with subnets from all 3 AZs

**Route Table Setup - This is Critical:**

We need two separate Transit Gateway route tables:

**Hub Route Table:**
- Associated with: Hub VPC attachment
- Routes:
  - 10.1.0.0/16 → Production VPC attachment
  - 10.2.0.0/16 → Development VPC attachment
- Purpose: Hub can reach all spokes

**Spoke Route Table:**
- Associated with: Production and Development VPC attachments
- Routes:
  - 0.0.0.0/0 → Hub VPC attachment (for internet access)
  - 10.0.0.0/16 → Hub VPC attachment (to reach hub services)
  - **Blackhole/deny for 10.1.0.0/16** (production can't reach development)
  - **Blackhole/deny for 10.2.0.0/16** (development can't reach production)
- Purpose: Spokes can reach hub and internet, but NOT each other

The spoke-to-spoke isolation is critical for security - production and development must never communicate directly.

## Routing Configuration

**Hub VPC Route Tables:**
- Public subnets: Default route to Internet Gateway
- Private subnets: 
  - Default route to NAT Gateway
  - 10.1.0.0/16 → Transit Gateway
  - 10.2.0.0/16 → Transit Gateway

**Spoke VPC Route Tables (Production and Development):**
- Public subnets: 0.0.0.0/0 → Transit Gateway (goes to hub, then hub's NAT)
- Private subnets: 0.0.0.0/0 → Transit Gateway (goes to hub, then hub's NAT)
- No local internet gateway, everything routes through hub

## Route53 Resolver Endpoints (Centralized DNS)

We want all DNS resolution to happen in the hub VPC, then be shared with spokes.

**In Hub VPC:**
- Create Route53 Resolver inbound endpoint
  - Deploy in private subnets across all 3 AZs
  - Security group allowing port 53 UDP/TCP from all VPC CIDRs (10.0.0.0/8)
- Create Route53 Resolver outbound endpoint (if we need conditional forwarding later)
- Share resolver rules with spoke VPCs using AWS RAM (Resource Access Manager)

**In Spoke VPCs:**
- Configure VPC settings to use the hub's resolver endpoints
- DNS queries from spokes go through Transit Gateway to hub resolver

This centralizes our DNS management and allows us to implement custom DNS rules in one place.

## VPC Flow Logs to S3

We need to capture all network traffic for security monitoring and compliance.

**S3 Bucket Setup:**
- Bucket name following our convention: `shared-us-east-1-s3-flowlogs`
- Server-side encryption enabled
- Block public access
- **Lifecycle policy:**
  - Transition to Glacier after 30 days
  - Delete after 365 days (or configurable)
- Versioning enabled
- Organize with prefixes: `/hub/`, `/production/`, `/development/`

**VPC Flow Logs Configuration:**
- Enable on all three VPCs (hub, production, development)
- Destination: S3 bucket
- Capture interval: 5 minutes (not the default 10 minutes)
- Traffic type: All (accepted and rejected)
- Log format: Default or include additional fields (resource ID, subnet ID)
- IAM role allowing Flow Logs to write to S3

## Systems Manager VPC Endpoints

We want to manage EC2 instances using Systems Manager without requiring internet access or bastion hosts.

**Deploy in all VPCs:**
- `com.amazonaws.us-east-1.ssm`
- `com.amazonaws.us-east-1.ssmmessages`
- `com.amazonaws.us-east-1.ec2messages`

**Configuration:**
- Type: Interface endpoints
- Subnets: Private subnets in all 3 AZs
- Security groups: Allow HTTPS (port 443) from VPC CIDR
- Enable private DNS
- This lets EC2 instances communicate with Systems Manager securely without NAT or IGW

## Custom DHCP Option Sets

Each VPC needs its own domain name for internal DNS:

- Hub VPC: `hub.company.internal`
- Production VPC: `prod.company.internal`
- Development VPC: `dev.company.internal`

Create DHCP option sets with:
- Domain name: as above per VPC
- Domain name servers: AmazonProvidedDNS
- Associate each option set with the respective VPC

This gives instances proper internal DNS names based on their environment.

## Tagging Strategy

Every resource needs consistent tags for cost allocation and management:

**Required Tags:**
- `Environment`: hub / production / development
- `Purpose`: networking / connectivity / dns / logging / management
- `CostCenter`: (configurable, like "infrastructure" or "engineering")
- `ManagedBy`: terraform
- `Project`: digital-banking

Make these configurable through variables.

## Naming Convention - Super Important

We have a strict naming standard: `{environment}-{region}-{service}-{purpose}`

Examples:
- Hub VPC: `hub-us-east-1-vpc-network`
- Production VPC: `production-us-east-1-vpc-workloads`
- Transit Gateway: `shared-us-east-1-tgw-hubspoke`
- NAT Gateway in hub AZ1: `hub-us-east-1-nat-az1`
- Route53 resolver: `hub-us-east-1-resolver-inbound`
- Flow logs bucket: `shared-us-east-1-s3-flowlogs`

Apply this consistently to every resource.

## Terraform Module Structure - Make It Reusable

This is really important: we need to be able to easily add more spoke VPCs in the future (staging, QA, UAT, etc.) without rewriting code.

**Create these Terraform modules:**

**`modules/vpc/`** - General VPC creation
- Creates VPC with configurable CIDR
- Creates subnets across multiple AZs (fetched dynamically)
- Creates route tables
- Optionally creates Internet Gateway
- Optionally creates NAT Gateways
- Applies tags
- Reusable for hub VPC

**`modules/spoke-vpc/`** - Specialized for spoke VPCs
- Similar to vpc module but:
  - No Internet Gateway
  - No NAT Gateways
  - Routes default through Transit Gateway instead
  - Lighter weight for cost savings
- Should be reusable: we can call this module with different CIDRs to create new spokes

**`modules/transit-gateway/`** - Transit Gateway resources
- Creates Transit Gateway
- Creates VPC attachments
- Creates route tables with proper associations
- Configures routes including blackhole routes for spoke isolation

**`modules/vpc-endpoints/`** - Systems Manager endpoints
- Creates the three SSM endpoints
- Creates security groups
- Reusable across all VPCs

**`modules/flow-logs/`** - VPC Flow Logs setup
- Creates S3 bucket with lifecycle policy
- Creates Flow Logs configurations
- Creates IAM roles

**Main Configuration Files:**
- `versions.tf` (Terraform >= 1.5, AWS >= 5.x)
- `providers.tf` (AWS provider config)
- `variables.tf` (all input variables)
- `data.tf` (data sources for AZs)
- `vpc-hub.tf` (hub VPC using vpc module)
- `vpc-spokes.tf` (spoke VPCs using spoke-vpc module)
- `transit-gateway.tf` (TGW using transit-gateway module)
- `nat-gateways.tf` (NAT setup in hub)
- `route53-resolver.tf` (DNS resolver endpoints)
- `dhcp-options.tf` (custom DHCP for each VPC)
- `vpc-endpoints.tf` (SSM endpoints using module)
- `flow-logs.tf` (Flow Logs using module)
- `security-groups.tf` (SGs for endpoints and resolvers)
- `outputs.tf` (VPC IDs, subnet IDs, TGW ID, etc.)

## Mandatory Requirements - No Flexibility

These are absolute requirements:
1. **Use Terraform modules** for reusability - spoke VPCs must be deployable from a single module
2. **All inter-VPC routing must go through Transit Gateway** - no VPC peering allowed
3. **Implement explicit blackhole routes** in Transit Gateway spoke route table to prevent direct spoke-to-spoke communication
4. **Use data sources to dynamically fetch availability zones** - don't hardcode AZ names
5. **S3 bucket for VPC Flow Logs must have lifecycle policy** to transition logs to Glacier after 30 days
6. **All resources must use consistent naming convention:** `{environment}-{region}-{service}-{purpose}`

## What We Need From You

**Complete Terraform HCL code with:**

All the module definitions and main configuration files listed above, plus:

**Variables (`variables.tf`):**
- Region (default: us-east-1)
- Hub VPC CIDR (default: 10.0.0.0/16)
- Production VPC CIDR (default: 10.1.0.0/16)
- Development VPC CIDR (default: 10.2.0.0/16)
- Number of AZs (default: 3)
- Environment names
- Cost center tags
- Flow logs retention days
- NAT Gateway deployment (map per AZ)

**Outputs (`outputs.tf`):**
- All VPC IDs
- All subnet IDs (public and private)
- Transit Gateway ID
- Route53 resolver endpoint IPs
- Systems Manager endpoint DNS names
- Flow logs S3 bucket name

**Documentation (`README.md`):**
- Architecture diagram showing hub-and-spoke topology
- Traffic flow explanations:
  - How spoke gets to internet (spoke → TGW → hub → NAT → IGW)
  - How DNS works (spoke → TGW → hub resolver)
  - Why spokes can't reach each other
- Deployment instructions:
  - Prerequisites (AWS credentials, Terraform installed)
  - Step-by-step deployment
  - Validation steps
- How to add a new spoke VPC:
  - Copy module call in `vpc-spokes.tf`
  - Add Transit Gateway attachment
  - Update route tables
  - Add to Flow Logs
- Naming and tagging conventions
- Cost breakdown (NAT Gateways, Transit Gateway, endpoints)
- Troubleshooting guide:
  - Connectivity issues
  - DNS resolution problems
  - Route table debugging
  - Transit Gateway attachment states

**Testing Procedures:**
Include instructions to verify:
- Spoke can ping/connect to hub
- Spoke can access internet through hub NAT
- Spoke **cannot** connect directly to other spoke (test and confirm blockage)
- DNS resolution works from spokes
- Systems Manager can connect to instances without internet access
- VPC Flow Logs are being captured and stored in S3

## Design Considerations

**Scalability:**
- Easy to add new spoke VPCs by just calling the spoke module
- Transit Gateway can handle 50+ attachments
- CIDR ranges leave room for growth (we're only using 3 of the 10.x.x.x space)

**Cost Optimization:**
- Single set of NAT Gateways in hub (not per VPC) saves significant cost
- VPC endpoints reduce data transfer charges
- Flow Logs to S3 cheaper than CloudWatch Logs

**Security:**
- Complete spoke isolation (can't reach each other)
- All traffic flows through central hub for potential inspection
- Private subnets for workloads
- No direct internet access from spokes (goes through hub)
- Systems Manager access without exposing instances to internet

**High Availability:**
- Everything deployed across 3 AZs
- NAT Gateways in each AZ for redundancy
- Transit Gateway is highly available by design
- Resolver endpoints in multiple AZs

**Future Expansion:**
We're planning to add:
- Staging VPC (10.3.0.0/16)
- QA VPC (10.4.0.0/16)
- Shared services VPC for Active Directory (10.5.0.0/16)
- On-premises connectivity via VPN or Direct Connect (also connects to Transit Gateway)
- Maybe centralized egress VPC with inspection appliances

The architecture should make these additions straightforward.

Make everything production-ready, well-documented, and easy for our team to maintain and extend!
```
