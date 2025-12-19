# VPC Infrastructure with Advanced Networking

Hey team,

We've been asked to build out the network foundation for our financial services client's new AWS environment. They're moving to the cloud and need a production-grade VPC setup that can support both their public-facing services and internal microservices. Security and compliance are top priorities here, and they want the flexibility to deploy this across multiple regions.

The architecture team has already done the design work. We need 3 Availability Zones for high availability, with both public and private subnets in each AZ. They want to use NAT instances instead of NAT Gateways to keep costs under control, but still need full outbound internet access for the private subnets. All traffic needs to be logged for compliance, and they want custom metrics to monitor the NAT instance performance.

The interesting part is preparing for Transit Gateway integration. They're not ready to create the attachment yet, but we need to generate the configuration as CloudFormation outputs so the network team can implement it later. This is part of a larger multi-account strategy they're building.

We also need to make this repeatable across regions. The client wants to deploy in us-east-1 first, but they're planning expansions to eu-west-1 and ap-southeast-1 later this year. That means region-specific AMI mappings for the NAT instances and a design that doesn't hardcode anything region-specific.

## What we need to build

Create a production-grade VPC infrastructure using **CDK with Python** for a financial services company. This is the network foundation for their AWS environment that needs to support both public and internal services with strict security controls.

### Core Requirements

1. **VPC Configuration**
   - CIDR block 172.31.0.0/16
   - Enable DNS hostnames and DNS resolution
   - Must not overlap with future peering to 10.0.0.0/8 networks

2. **Multi-AZ Subnets**
   - Deploy across exactly 3 Availability Zones
   - 6 total subnets: one public and one private per AZ
   - Use /24 CIDR blocks for each subnet
   - Public subnets for NAT instances
   - Private subnets for application workloads

3. **NAT Instance Configuration**
   - Deploy t3.micro instances in each public subnet (one per AZ)
   - Use latest Amazon Linux 2023 AMI
   - Implement AMI mapping for at least 3 regions: us-east-1, eu-west-1, ap-southeast-1
   - Configure security groups to allow traffic only from respective private subnets

4. **Custom Route Tables**
   - Create custom routing for private subnets
   - Route 0.0.0.0/0 through the NAT instance in the same AZ
   - Ensure each private subnet routes through its own AZ's NAT instance

5. **Network Access Control Lists**
   - Deny all inbound traffic by default
   - Allow HTTP (port 80) from 0.0.0.0/0
   - Allow HTTPS (port 443) from 0.0.0.0/0
   - Allow SSH (port 22) from 192.168.1.0/24 only
   - Explicitly deny all other traffic

6. **VPC Flow Logs - Dual Destination**
   - Capture ALL traffic type (accepted, rejected, and all)
   - Store in S3 bucket with 90-day lifecycle policy
   - Also send to CloudWatch Logs with 30-day retention
   - Enable flow logs at VPC level

7. **CloudWatch Monitoring**
   - Create Lambda function to publish NAT instance network metrics
   - Run every 5 minutes using EventBridge schedule
   - Track bandwidth utilization and connection metrics
   - Custom CloudWatch metrics for NAT instance performance

8. **Transit Gateway Preparation**
   - Generate Transit Gateway attachment configuration
   - Output as CloudFormation exports (DO NOT create the actual attachment)
   - Include VPC ID, subnet IDs, and required configuration parameters

9. **Comprehensive Tagging**
   - Tag all resources with Environment='Production'
   - Tag all resources with CostCenter='NetworkOps'
   - Include environmentSuffix in all resource names for uniqueness

### Technical Requirements

- All infrastructure defined using **CDK with Python** (aws-cdk-lib)
- Use CDK 2.x with Python 3.9 or higher
- Deploy to **us-east-1** region (but support cross-region deployment)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-environment-suffix`
- All resources must be destroyable (no Retain policies, no DeletionProtection)
- Use AWS services: VPC, EC2 (NAT instances), S3, CloudWatch Logs, Lambda, EventBridge, IAM

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names must include environmentSuffix parameter for uniqueness
- **Destroyability**: All resources must be destroyable - no Retain removal policies, no DeletionProtection
- **No DeletionProtection**: Disable deletion protection on all resources (S3 buckets, CloudWatch log groups, etc.)
- **RemovalPolicy.DESTROY**: Use RemovalPolicy.DESTROY for all resources, not RETAIN or SNAPSHOT
- **Lambda Runtime**: If using Lambda with Node.js 18+, ensure AWS SDK v3 compatibility
- **Cost Optimization**: Use NAT instances (t3.micro) instead of NAT Gateways for cost control

### Stack Outputs

- VPC ID
- Public subnet IDs (grouped, all 3 subnets)
- Private subnet IDs (grouped, all 3 subnets)
- NAT instance IDs (all 3 instances)
- Transit Gateway attachment configuration (as CloudFormation export values)
- S3 bucket name for flow logs
- CloudWatch log group name for flow logs

### Constraints

- VPC CIDR must be 172.31.0.0/16 (non-overlapping with 10.0.0.0/8)
- Exactly 3 Availability Zones required
- Private subnets MUST route through NAT instances, not NAT Gateways
- Network ACLs must explicitly deny all traffic except specified ports
- VPC Flow Logs required to both S3 and CloudWatch with different retentions
- NAT instances must be t3.micro with Amazon Linux 2023
- Stack must be deployable in any of the mapped regions

## Success Criteria

- **Functionality**: VPC deploys with all 6 subnets across 3 AZs, NAT instances provide outbound access, flow logs capture all traffic
- **Performance**: Custom metrics track NAT instance bandwidth and performance every 5 minutes
- **Reliability**: Multi-AZ design with one NAT instance per AZ for fault isolation
- **Security**: Network ACLs enforce traffic restrictions, flow logs provide audit trail
- **Compliance**: Dual flow log destinations meet retention requirements, all traffic logged
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be fully deleted without manual intervention
- **Code Quality**: Python code, comprehensive unit and integration tests, full documentation
- **Cross-Region**: AMI mappings support deployment in us-east-1, eu-west-1, ap-southeast-1

## What to deliver

- Complete CDK Python implementation with aws-cdk-lib
- VPC with 6 subnets (3 public, 3 private) across 3 AZs
- NAT instances (t3.micro) with Amazon Linux 2023 in all public subnets
- Security groups configured for NAT instance traffic control
- Custom route tables routing private traffic through NAT instances
- Network ACLs with explicit allow/deny rules
- VPC Flow Logs to both S3 (90-day lifecycle) and CloudWatch (30-day retention)
- Lambda function for custom NAT instance metrics (5-minute schedule)
- Transit Gateway attachment configuration as CloudFormation outputs
- Region-specific AMI mappings for cross-region deployment
- Comprehensive tagging (Environment, CostCenter) on all resources
- Unit tests for all CDK constructs and Lambda functions
- Integration tests validating network connectivity and flow logs
- Documentation including architecture diagram and deployment instructions
