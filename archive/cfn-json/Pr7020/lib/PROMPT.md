# VPC Network Architecture for Financial Services
 
Hey team,

We need to build a production-grade VPC network architecture for our new financial services application deployment in AWS. I've been asked to create this infrastructure using **CloudFormation with JSON**. The business needs a robust multi-AZ network foundation that can support both public-facing web services and private backend systems with controlled internet access.

Our organization is establishing a new AWS presence specifically for financial services workloads that require strict network isolation and compliance controls. This means we need to get the network foundation right from the start - proper segmentation, high availability across multiple zones, and comprehensive logging for audit purposes.

The infrastructure will be deployed in us-east-1 across three availability zones. We need to support both internet-facing services and internal workloads while maintaining strict security controls. The network design needs to be scalable enough to support future growth but secure enough to meet financial services compliance requirements.

## What we need to build

Create a production-ready VPC network architecture using **CloudFormation with JSON** that provides high-availability networking components across 3 availability zones in us-east-1, including all routing, security, and logging configurations.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames for the VPC
   - No overlapping IP ranges allowed
   - All resource names must include **EnvironmentSuffix** parameter for uniqueness

2. **Subnet Architecture**
   - Deploy exactly 6 subnets across 3 availability zones
   - Each AZ must have one public subnet and one private subnet
   - Use Mappings section to define subnet CIDR blocks for consistency across regions
   - Follow naming convention: subnet-{type}-{az}-{EnvironmentSuffix}

3. **Internet Gateway Setup**
   - Deploy Internet Gateway and attach to VPC
   - Configure proper route tables for internet access
   - Follow naming pattern: igw-{EnvironmentSuffix}

4. **NAT Gateway Deployment**
   - Deploy NAT Gateways in high-availability mode across all 3 public subnets
   - Each NAT Gateway requires an Elastic IP
   - All private subnets must route outbound traffic through NAT Gateway in the same AZ
   - Follow naming pattern: nat-{az}-{EnvironmentSuffix}

5. **Route Table Configuration**
   - Create separate route tables for public and private subnets
   - Public route tables: route 0.0.0.0/0 to Internet Gateway
   - Private route tables: route 0.0.0.0/0 to NAT Gateway in same AZ
   - Associate route tables with appropriate subnets

6. **VPC Flow Logs**
   - Enable VPC Flow Logs for all traffic (accepted and rejected)
   - Send logs to CloudWatch Logs with 30-day retention period
   - Create IAM role with appropriate permissions for Flow Logs service
   - Include proper trust policy for vpc-flow-logs.amazonaws.com

7. **Network ACLs**
   - Implement custom Network ACLs with explicit rules
   - Allow inbound traffic only on ports 80, 443, and 22 from specific IP ranges
   - Explicitly deny all other inbound traffic
   - Configure appropriate outbound rules for response traffic
   - Use rule numbers (100, 110, 120, etc.) for proper ordering

8. **Resource Tagging**
   - Apply consistent tags to all resources
   - Required tags: Environment and Department keys
   - Tags must be applied to VPC, subnets, route tables, Internet Gateway, NAT Gateways, and Network ACLs

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS VPC** for network foundation
- Use **EC2 Subnets** for network segmentation
- Use **Internet Gateway** for public internet access
- Use **NAT Gateways** with **Elastic IPs** for private subnet outbound connectivity
- Use **VPC Flow Logs** sent to **CloudWatch Logs** for compliance monitoring
- Use **Network ACLs** for subnet-level security controls
- Deploy to **us-east-1** region across 3 availability zones
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{az}-{EnvironmentSuffix}
- All resources must be destroyable (use DeletionPolicy: Delete, not Retain)

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16 with no overlapping ranges
- Must deploy across exactly 3 availability zones in us-east-1
- Each AZ requires exactly one public and one private subnet
- NAT Gateways must be deployed in all 3 public subnets for high availability
- Private subnets must route through NAT Gateway in the same AZ (no cross-AZ routing)
- VPC Flow Logs retention must be exactly 30 days
- Network ACL rules must explicitly deny all traffic except ports 80, 443, 22
- All resources require Cost Allocation Tags with Environment and Department keys
- Template must use Mappings section for subnet CIDR definitions
- Financial services compliance requirements apply

### Deployment Requirements (CRITICAL)

- All resource names MUST include **EnvironmentSuffix** parameter
- Use CloudFormation Parameters to define EnvironmentSuffix as a String
- Example naming: VPC resource should be named "vpc-{EnvironmentSuffix}"
- NAT Gateways: "nat-us-east-1a-{EnvironmentSuffix}", "nat-us-east-1b-{EnvironmentSuffix}", etc.
- All resources must use DeletionPolicy: Delete (NOT Retain) to ensure clean teardown
- Template must be completely self-contained with no external dependencies
- Use GetAtt and Ref intrinsic functions for resource references

### Optional Enhancements

If implementation goes smoothly, consider adding:
- VPC Endpoints for S3 and DynamoDB to reduce NAT Gateway costs
- Transit Gateway attachment for multi-VPC connectivity
- AWS Network Firewall for advanced threat protection

However, the core requirements above are mandatory and must be completed first.

## Success Criteria

- **Functionality**: VPC deploys successfully across 3 AZs with all networking components
- **High Availability**: NAT Gateways in all public subnets, proper routing in each AZ
- **Security**: Network ACLs enforce traffic restrictions, Flow Logs capture all traffic
- **Compliance**: 30-day log retention, proper IAM roles, comprehensive tagging
- **Resource Naming**: All resources include EnvironmentSuffix parameter value
- **Destroyability**: All resources can be deleted cleanly without retention policies
- **Code Quality**: Valid CloudFormation JSON syntax, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template
- VPC with DNS hostnames enabled
- 6 subnets (3 public, 3 private) across 3 AZs
- Internet Gateway with proper routing
- 3 NAT Gateways with Elastic IPs in public subnets
- Separate route tables for public and private subnets
- VPC Flow Logs to CloudWatch Logs with IAM role
- Custom Network ACLs with explicit rules
- Mappings section for subnet CIDR blocks
- Consistent tagging on all resources
- Parameters section with EnvironmentSuffix
- Outputs section with key resource IDs
- Documentation with deployment instructions
