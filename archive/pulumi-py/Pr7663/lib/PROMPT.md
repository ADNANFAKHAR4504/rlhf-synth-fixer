# Multi-VPC Transit Gateway Architecture for Payment Platform

Hey team,

We need to build a secure network foundation for a fintech startup's payment processing platform. They're dealing with strict compliance requirements around payment data, so we need solid network isolation between development and production environments while maintaining centralized control over egress traffic for auditing purposes.

The business wants this built using **Pulumi with Python** to leverage their existing Python expertise and Pulumi's declarative infrastructure model. The key challenge here is creating two completely isolated VPCs that can communicate through a Transit Gateway for specific services, while routing all internet-bound traffic through a single NAT instance for compliance logging.

This is a foundational architecture that needs to support their payment processing workloads across multiple availability zones for high availability, with comprehensive flow logging for security auditing and incident response.

## What we need to build

Create a multi-VPC network architecture using **Pulumi with Python** for a fintech payment platform with centralized egress control and Transit Gateway connectivity.

### Core Requirements

1. **VPC Infrastructure**
   - Two VPCs: 'dev-vpc' with CIDR 10.1.0.0/16 and 'prod-vpc' with CIDR 10.2.0.0/16
   - Each VPC must have 3 public subnets and 3 private subnets
   - Subnets distributed across availability zones us-east-1a, us-east-1b, and us-east-1c
   - Non-overlapping CIDR ranges from 10.0.0.0/8 address space
   - Internet Gateways for public subnet connectivity

2. **Transit Gateway Configuration**
   - Deploy AWS Transit Gateway connecting both VPCs
   - Create Transit Gateway route tables for inter-VPC routing
   - Allow traffic on ports 443 (HTTPS) and 5432 (PostgreSQL) between VPCs
   - Configure appropriate route table associations and propagations

3. **NAT Instance for Centralized Egress**
   - Single NAT instance using t3.micro instance type
   - Deploy in dev-vpc's first public subnet
   - All private subnets in both VPCs route internet traffic through this NAT instance
   - Cost optimization: single NAT instead of multiple NAT Gateways

4. **Security Groups**
   - Create security groups allowing HTTPS traffic on port 443
   - Allow SSH traffic on port 22
   - Source IP restriction: 192.168.1.0/24 CIDR range only
   - Deny all traffic except specified rules

5. **VPC Flow Logs**
   - Enable VPC Flow Logs for both dev-vpc and prod-vpc
   - Send logs to CloudWatch Logs
   - Set CloudWatch log retention to 7 days
   - Capture accepted, rejected, and all traffic flows

6. **Resource Tagging**
   - Tag all resources with Project: 'payment-platform'
   - Add Environment tags ('dev' or 'prod') to distinguish VPCs
   - Tag route tables with Environment and Purpose labels

7. **Resource Exports**
   - Export all resource IDs for use by downstream infrastructure
   - Include VPC IDs, subnet IDs, security group IDs, Transit Gateway ID

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS VPC** for network isolation
- Use **AWS Transit Gateway** for inter-VPC connectivity
- Use **EC2** for NAT instance
- Use **CloudWatch Logs** for flow log storage
- Use **IAM** roles and policies for VPC Flow Logs
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Private subnets must span exactly 3 availability zones (us-east-1a, us-east-1b, us-east-1c)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with no RemovalPolicy RETAIN configurations
- No deletion_protection settings enabled
- All named resources (VPCs, subnets, security groups, NAT instance, Transit Gateway) must include environmentSuffix
- NAT instance: Use single instance for cost optimization (not per-AZ)
- RDS-related resources: Set skip_final_snapshot and minimal backup retention if any databases added
- GuardDuty: DO NOT create detector (account-level service, only one per account)
- Flow Logs IAM role: Use appropriate service principal for vpc-flow-logs.amazonaws.com

### Constraints

1. **Network Design**
   - CIDR ranges must not overlap between VPCs
   - Use 10.1.0.0/16 for dev-vpc and 10.2.0.0/16 for prod-vpc exactly
   - All CIDRs from 10.0.0.0/8 private address space

2. **Cost Optimization**
   - Single NAT instance (t3.micro) instead of multiple NAT Gateways
   - 7-day CloudWatch log retention (not indefinite)
   - No unnecessary resources in multiple availability zones

3. **Security**
   - Security groups deny all except specified rules (443 and 22 from 192.168.1.0/24)
   - Transit Gateway routes only allow ports 443 and 5432 between VPCs
   - VPC Flow Logs enabled for audit trail

4. **High Availability**
   - Subnets distributed across 3 availability zones
   - Private subnets span exactly us-east-1a, us-east-1b, us-east-1c

5. **Compliance**
   - All egress traffic routed through single NAT for centralized logging
   - VPC Flow Logs with 7-day retention for audit compliance

## Success Criteria

- **Functionality**: Two VPCs with isolated networks, Transit Gateway enabling selective inter-VPC communication, single NAT instance routing all private subnet internet traffic
- **Performance**: Subnets distributed across 3 AZs for fault tolerance
- **Reliability**: Proper route table configuration ensuring traffic flows correctly through Transit Gateway and NAT instance
- **Security**: Security groups restrict access to specified ports and CIDR ranges, Flow Logs capture all network traffic for audit
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Cost Efficiency**: Single NAT instance instead of multiple NAT Gateways, minimal log retention periods
- **Code Quality**: Python code, comprehensive unit tests with 80%+ coverage, well-documented

## What to deliver

- Complete Pulumi Python implementation with proper project structure
- Two VPCs (dev-vpc and prod-vpc) with public and private subnets across 3 AZs
- Transit Gateway with route tables for inter-VPC connectivity on ports 443 and 5432
- Single NAT instance (t3.micro) in dev-vpc for centralized egress
- Security groups for HTTPS (443) and SSH (22) from 192.168.1.0/24
- VPC Flow Logs with CloudWatch Logs integration and 7-day retention
- IAM roles and policies for Flow Logs service
- Comprehensive unit tests with 80%+ code coverage using Pulumi testing framework
- Resource tagging (Project, Environment, Purpose)
- Exported outputs for all resource IDs
- Documentation and deployment instructions
