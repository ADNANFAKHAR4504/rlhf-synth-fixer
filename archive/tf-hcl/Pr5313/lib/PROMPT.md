I need help building a multi-region hub-and-spoke network architecture in AWS for our financial services trading platform. We're deploying across three regions (US East, US West, and Europe) and everything needs to be connected through Transit Gateway with cross-region peering. This is more complex than a single-region setup because we need to handle peering connections between regions.

## Technology Stack: Terraform HCL

**All infrastructure must be written in Terraform 1.5+ using HCL with AWS Provider 5.x.** We need to use provider aliases for multi-region deployment. Also critical: we need remote state management with S3 backend and DynamoDB state locking to prevent concurrent modifications.

## What We're Building

A global hub-and-spoke network where:

- One hub region (us-east-1) acts as the central routing point
- Two spoke regions (us-west-2 and eu-west-1) host our trading workloads
- Each region has its own Transit Gateway
- Transit Gateways are connected via peering connections
- Traffic between regions flows through the peering connections
- DNS resolution works seamlessly across all regions
- Everything is logged for compliance

## The Three Regions

### Hub Region (us-east-1)

- **Hub VPC:** 10.0.0.0/16
- **Purpose:** Central control plane, shared services, primary routing hub
- **Transit Gateway:** Acts as the main routing hub, peers with other regions
- **DNS:** Hosts the central Route53 private hosted zone
- **Subnets:** 3 public (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and 3 private (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- **Internet Access:** NAT Gateways in each AZ
- **AZs:** 3 (fetch dynamically, don't hardcode)

### Spoke Region - US West (us-west-2)

- **Spoke VPC:** 10.1.0.0/16
- **Purpose:** US West Coast trading systems
- **Transit Gateway:** Local TGW that peers with hub
- **Subnets:** 3 public and 3 private across 3 AZs
- **Internet Access:** Own NAT Gateways for outbound traffic
- **AZs:** 3 (fetch dynamically for us-west-2)

### Spoke Region - Europe (eu-west-1)

- **Spoke VPC:** 10.2.0.0/16
- **Purpose:** European trading systems and compliance workloads
- **Transit Gateway:** Local TGW that peers with hub
- **Subnets:** 3 public and 3 private across 3 AZs
- **Internet Access:** Own NAT Gateways for outbound traffic
- **AZs:** 3 (fetch dynamically for eu-west-1)

## Transit Gateway Architecture - This Gets Complex

**Hub Transit Gateway (us-east-1):**

- Create Transit Gateway with DNS support and VPN ECMP enabled
- Amazon side ASN: 64512
- Attach the hub VPC (subnets from all 3 AZs)
- Create peering connections TO us-west-2 and eu-west-1 Transit Gateways
- Set up route tables that:
  - Route spoke VPC CIDRs (10.1.0.0/16, 10.2.0.0/16) through peering attachments
  - Keep production and non-production traffic separated (different route tables)
- **Important:** Add lifecycle prevent_destroy to avoid accidental deletion

**Spoke Transit Gateway (us-west-2):**

- Create Transit Gateway with DNS support
- Amazon side ASN: 64513
- Attach the us-west-2 VPC
- Accept peering connection FROM hub (us-east-1)
- Create route table with:
  - Route for hub VPC CIDR (10.0.0.0/16) through peering attachment
  - Route for eu-west-1 CIDR (10.2.0.0/16) through peering attachment to hub (hub acts as intermediary)

**Spoke Transit Gateway (eu-west-1):**

- Create Transit Gateway with DNS support
- Amazon side ASN: 64514
- Attach the eu-west-1 VPC
- Accept peering connection FROM hub (us-east-1)
- Create route table with:
  - Route for hub VPC CIDR (10.0.0.0/16) through peering attachment
  - Route for us-west-2 CIDR (10.1.0.0/16) through peering attachment to hub

**How Traffic Flows:**

- us-west-2 to eu-west-1: us-west-2 VPC → us-west-2 TGW → peering to hub TGW → peering to eu-west-1 TGW → eu-west-1 VPC
- All cross-region traffic goes through the hub Transit Gateway
- No direct peering between spoke regions

## Transit Gateway Route Tables - Production vs Non-Production

We need to keep production and non-production traffic isolated. Set up:

**Hub Production Route Table:**

- Associated with production VPC attachments
- Routes only to production spoke networks
- Tagged as Environment=production

**Hub Non-Production Route Table:**

- Associated with non-production VPC attachments
- Routes only to non-production spoke networks
- Tagged as Environment=non-production

**Spoke Route Tables:**

- Each spoke has its route table
- Routes to hub and other spokes through peering
- Environment tag determines which hub route table it associates with

## VPC Routing Configuration

**Hub VPC (us-east-1) Route Tables:**

- Public subnet route table:
  - 0.0.0.0/0 → Internet Gateway
  - 10.1.0.0/16 → Transit Gateway
  - 10.2.0.0/16 → Transit Gateway
- Private subnet route table:
  - 0.0.0.0/0 → NAT Gateway
  - 10.1.0.0/16 → Transit Gateway
  - 10.2.0.0/16 → Transit Gateway

**Spoke VPC (us-west-2) Route Tables:**

- Public subnet route table:
  - 0.0.0.0/0 → Internet Gateway
  - 10.0.0.0/16 → Transit Gateway (to hub)
  - 10.2.0.0/16 → Transit Gateway (to Europe via hub)
- Private subnet route table:
  - 0.0.0.0/0 → NAT Gateway
  - 10.0.0.0/16 → Transit Gateway
  - 10.2.0.0/16 → Transit Gateway

**Spoke VPC (eu-west-1) Route Tables:**

- Similar to us-west-2 but with appropriate CIDRs

## Multi-Region Provider Configuration

This is critical for Terraform. We need to set up three AWS providers:

```
provider "aws" {
  region = "us-east-1"
  alias  = "hub"
}

provider "aws" {
  region = "us-west-2"
  alias  = "us_west"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "europe"
}
```

Then use the appropriate provider alias when creating resources in each region.

## Route53 Private Hosted Zone - Cross-Region DNS

We want internal DNS to work everywhere, so create:

**Private Hosted Zone:**

- Domain: `trading.internal` (or configurable)
- Create in hub region (us-east-1)
- Associate with hub VPC first
- Then create VPC associations for:
  - us-west-2 VPC (cross-region association)
  - eu-west-1 VPC (cross-region association)

**Cross-Region Association:**

- In us-west-2: Create VPC association authorization
- In us-east-1: Create VPC association using the authorization
- Same for eu-west-1

This allows instances in any region to resolve DNS names from the central zone. For example, a database in us-east-1 can be accessed as `db.trading.internal` from instances in us-west-2 or eu-west-1.

## VPC Flow Logs - Centralized Logging

**S3 Bucket Setup:**

- Create one central bucket in hub region: `shared-us-east-1-s3-flowlogs`
- Bucket policy allowing VPC Flow Logs service from all regions
- Encryption enabled
- Lifecycle policy: Delete logs after 7 days (compliance requirement)
- Organize with prefixes: `/us-east-1/hub/`, `/us-west-2/spoke/`, `/eu-west-1/spoke/`

**Flow Logs Configuration:**

- Enable on hub VPC (us-east-1) → writes to S3
- Enable on us-west-2 VPC → writes to same S3 bucket (cross-region write)
- Enable on eu-west-1 VPC → writes to same S3 bucket (cross-region write)
- Capture all traffic (accepted and rejected)
- IAM roles in each region allowing writes to the central S3 bucket

## NAT Gateways - Regional Deployment

Each region needs its own NAT Gateways for outbound internet access:

**Hub (us-east-1):**

- NAT Gateway in each public subnet (3 total)
- Private subnets route through these for internet

**US West (us-west-2):**

- NAT Gateway in each public subnet (3 total)
- Private subnets route through these for internet

**Europe (eu-west-1):**

- NAT Gateway in each public subnet (3 total)
- Private subnets route through these for internet

Each region handles its own internet egress (not routed through hub like in single-region hub-spoke).

## Systems Manager VPC Endpoints - Per Region

Deploy in every VPC so we can manage EC2 instances without internet access:

**Required Endpoints (per region):**

- `com.amazonaws.{region}.ssm`
- `com.amazonaws.{region}.ssmmessages`
- `com.amazonaws.{region}.ec2messages`

**Configuration:**

- Interface endpoints in private subnets (all 3 AZs)
- Security groups allowing port 443 from VPC CIDR
- Private DNS enabled
- Deploy in: hub VPC, us-west-2 VPC, eu-west-1 VPC

## Security Groups - Least Privilege

Create security groups with minimal required access:

**VPC Endpoint Security Groups:**

- Allow inbound HTTPS (443) from VPC CIDR only
- No outbound restrictions (needed for API calls)

**Application Security Groups:**

- Trading application SG: Allow specific ports from known CIDRs
- Database SG: Allow database port only from application SG CIDRs
- Default deny all, explicit allow what's needed

**Cross-Region Considerations:**

- Can't reference security groups across regions
- Use CIDR-based rules instead
- For example: Allow 10.1.0.0/16 (us-west-2) to access database in 10.0.0.0/16 (us-east-1)

## Tagging Strategy

Every resource gets these tags:

- `Environment`: production / non-production / shared
- `Region`: us-east-1 / us-west-2 / eu-west-1
- `Purpose`: networking / connectivity / dns / logging / management / hub / spoke
- `ManagedBy`: terraform
- `Project`: trading-platform
- `CostCenter`: (configurable variable)

## State Management - Critical for Multi-Region

**S3 Backend Configuration:**

```
terraform {
  backend "s3" {
    bucket         = "terraform-state-{account-id}"
    key            = "networking/multi-region/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**DynamoDB Table for Locking:**

- Table name: `terraform-state-lock`
- Partition key: `LockID` (String)
- Prevents concurrent Terraform runs
- Point-in-time recovery enabled

**Why This Matters:**

- Multiple people might work on this
- Prevents state corruption from simultaneous applies
- Versioning on S3 bucket allows rollback

## Terraform Module Structure - Avoid Duplication

We need reusable modules since we're deploying similar resources in three regions:

**Modules to Create:**

**`modules/vpc/`** - Multi-region VPC

- Input: region, cidr_block, environment, az_count
- Creates VPC with public/private subnets across AZs
- Creates Internet Gateway
- Creates NAT Gateways
- Creates route tables
- Enables DNS support and hostnames
- Returns VPC ID, subnet IDs, route table IDs

**`modules/transit-gateway/`** - Transit Gateway

- Input: region, amazon_side_asn, environment
- Creates Transit Gateway
- Creates VPC attachment
- Creates route tables
- Adds lifecycle prevent_destroy
- Returns TGW ID, attachment ID

**`modules/transit-gateway-peering/`** - TGW Peering

- Input: local_tgw_id, peer_tgw_id, peer_region
- Creates peering attachment
- Creates peering accepter
- Handles cross-region peering setup
- Returns peering attachment ID

**`modules/vpc-endpoints/`** - Systems Manager Endpoints

- Input: vpc_id, subnet_ids, region
- Creates three SSM endpoints
- Creates security group
- Returns endpoint IDs

**`modules/route53-zone/`** - Private Hosted Zone

- Input: domain_name, vpc_ids (list)
- Creates private hosted zone
- Creates multi-region VPC associations
- Returns zone ID

**`modules/flow-logs/`** - VPC Flow Logs

- Input: vpc_id, s3_bucket_arn, log_prefix
- Creates Flow Logs configuration
- Creates IAM role
- Returns Flow Logs ID

**Main Configuration Files:**

- `backend.tf` (S3 backend config)
- `versions.tf` (Terraform >= 1.5, AWS >= 5.x)
- `providers.tf` (three AWS provider aliases)
- `variables.tf` (all input variables)
- `data.tf` (AZ data sources for each region)
- `vpc-hub.tf` (hub VPC using module with provider = aws.hub)
- `vpc-uswest.tf` (spoke VPC using module with provider = aws.us_west)
- `vpc-europe.tf` (spoke VPC using module with provider = aws.europe)
- `tgw-hub.tf` (hub TGW)
- `tgw-spokes.tf` (spoke TGWs)
- `tgw-peering.tf` (peering connections)
- `route-tables.tf` (all route table configurations)
- `route53.tf` (private hosted zone with cross-region associations)
- `vpc-endpoints.tf` (SSM endpoints in all VPCs)
- `flow-logs.tf` (S3 bucket and Flow Logs configs)
- `security-groups.tf` (all security groups)
- `outputs.tf` (all outputs)

## Mandatory Requirements - No Flexibility

These are absolute requirements:

1. **Use Terraform modules** to avoid code duplication across regions
2. **All inter-VPC routing must go through Transit Gateway** - no VPC peering allowed
3. **Implement least-privilege security group rules** allowing only necessary ports
4. **Use data sources to dynamically fetch availability zones** in each region - don't hardcode
5. **Configure Transit Gateway route tables** to prevent production and non-production traffic mixing
6. **Enable DNS support and DNS hostnames** on all VPCs and Transit Gateway attachments
7. **Use lifecycle rules** to prevent accidental deletion of Transit Gateway resources
8. **Implement remote state with S3 backend** and state locking via DynamoDB

## What We Need From You

**Complete Terraform HCL code with:**

All the modules and configuration files listed above, organized properly.

**Variables (`variables.tf`):**

- Hub VPC CIDR (default: 10.0.0.0/16)
- US West VPC CIDR (default: 10.1.0.0/16)
- Europe VPC CIDR (default: 10.2.0.0/16)
- Transit Gateway ASNs per region
- Route53 domain name (default: trading.internal)
- Flow logs retention days (default: 7)
- Environment tags
- Cost center tags
- AWS account ID for state bucket naming

**Outputs (`outputs.tf`):**

- All VPC IDs (hub, us-west, europe)
- All subnet IDs per VPC
- All Transit Gateway IDs
- Transit Gateway peering attachment IDs
- Route53 hosted zone ID
- S3 Flow Logs bucket name
- Systems Manager endpoint DNS names

**Documentation (`README.md`):**

- Architecture diagram showing multi-region connectivity
- Traffic flow examples:
  - How instance in us-west-2 reaches instance in eu-west-1 (through hub peering)
  - How DNS resolution works across regions
  - How internet access works per region (local NAT)
- Deployment sequence:
  1. Deploy S3 backend and DynamoDB table
  2. Deploy hub VPC and Transit Gateway
  3. Deploy spoke VPCs and Transit Gateways
  4. Create peering connections
  5. Configure route tables
  6. Deploy Route53 and cross-region associations
  7. Enable Flow Logs
  8. Deploy VPC endpoints
- How to add a new region:
  - Add new provider alias
  - Deploy VPC using module
  - Create Transit Gateway
  - Peer with hub
  - Update route tables
  - Add to Route53 associations
- Testing procedures:
  - Connectivity testing hub ↔ spoke
  - Connectivity testing spoke ↔ spoke (cross-region)
  - DNS resolution across regions
  - Internet access from private subnets
  - SSM connectivity without internet
  - Production isolation validation
- Troubleshooting:
  - Transit Gateway peering status
  - Route table inspection
  - Security group issues
  - DNS resolution problems
  - Cross-region latency issues
- Cost breakdown and optimization tips
- Disaster recovery procedures

**Testing Validation:**
Include steps to verify:

- Ping/connection from hub to both spokes
- Ping/connection between spokes (through hub peering)
- DNS lookups work from any region
- NAT Gateway provides internet access
- Systems Manager Session Manager works
- Production and non-production traffic isolated
- VPC Flow Logs appearing in S3
- State locking prevents concurrent modifications

## Important Design Considerations

**Multi-Region Complexity:**

- Peering connections must be established and accepted
- Cross-region latency affects performance (measure and document)
- Data transfer costs are higher between regions
- Provider aliases must be used correctly in modules
- Some resources can only be in one region (like S3 buckets)

**State Management:**

- Only one person can run `terraform apply` at a time (DynamoDB lock)
- State file contains sensitive info - encrypt it
- Versioning allows rollback if something breaks

**Transit Gateway Peering:**

- Peering must be requested from one side and accepted from the other
- Routes must be configured on both sides
- Static routes (no BGP) - we define them explicitly
- Each peering connection has limits (check AWS quotas)

**DNS Across Regions:**

- Route53 VPC associations work cross-region
- Authorization must be created before association
- TTL affects resolution speed
- Consider latency for cross-region lookups

**High Availability:**

- Everything deployed across 3 AZs
- NAT Gateways in each AZ for redundancy
- Transit Gateway is highly available by design
- Peering connections are highly available

**Security:**

- Least-privilege security groups
- VPC endpoints prevent internet exposure
- Flow Logs for compliance and monitoring
- Production isolation through separate route tables
- Encryption everywhere (in transit with TLS, at rest with encryption)

**Future Expansion:**
We're planning to add:

- Asia-Pacific region (ap-southeast-1)
- Another European region (eu-central-1)
- On-premises connectivity via Direct Connect to hub
- Network inspection VPC with firewall appliances

The architecture should make these additions straightforward - just deploy another spoke and peer it with the hub.

Make everything production-ready, well-documented, modular, and easy for our team to maintain and extend. This is critical infrastructure for our trading platform - it needs to be rock solid!

```

```
