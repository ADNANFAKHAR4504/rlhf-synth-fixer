Hey team,

We need to build a secure cross-account VPC peering solution for our financial services client. They're running trading platforms in one AWS account and data analytics workloads in another, and these systems need to communicate securely without ever touching the public internet. I've been asked to create this using Python with CDKTF. The business is really strict about compliance and security here since we're dealing with financial data.

The trading platform runs on ECS Fargate with an Aurora PostgreSQL database, while the analytics side uses EMR and S3 for their data processing. Both environments are already deployed across multiple availability zones in us-east-1 with private subnets. The challenge is establishing connectivity between these two VPCs in different accounts while maintaining the level of network isolation and monitoring that financial compliance requires.

We need comprehensive security controls with a whitelist-only approach, no blanket internet access rules, and detailed flow logging for audit purposes. Everything needs to be tagged properly for cost tracking, and DNS resolution has to work bidirectionally so services can actually find each other across the peered connection.

## What we need to build

Create a secure cross-account VPC peering infrastructure using **CDKTF with Python** for connecting trading and analytics workloads in separate AWS accounts.

### Core Requirements

1. VPC Peering Configuration
   - Establish peering connection between trading VPC (account A, 10.0.0.0/16) and analytics VPC (account B, 10.1.0.0/16)
   - Configure bidirectional DNS resolution across the peering connection
   - Set up cross-account IAM roles for peering acceptance

2. Network Routing
   - Configure route tables in both VPCs to enable traffic through the peering connection
   - Implement least-privilege routing rules targeting only required subnets
   - Ensure routes support private subnet communication across 3 availability zones

3. Security Controls
   - Create security groups allowing only HTTPS (443) and PostgreSQL (5432) traffic from specific CIDR blocks
   - Implement Network ACLs restricting traffic to required subnets only
   - Enforce whitelist approach with no 0.0.0.0/0 rules anywhere

4. VPC Endpoints
   - Configure VPC endpoints for S3 to avoid internet routing
   - Configure VPC endpoints for DynamoDB to avoid internet routing
   - Ensure all traffic between VPCs stays on AWS private network

5. Monitoring and Logging
   - Enable VPC Flow Logs with S3 storage and 5-minute capture intervals
   - Set up CloudWatch alarms for unusual network traffic patterns
   - Create CloudWatch dashboard for network monitoring

6. Compliance and Governance
   - Enable AWS Config rules to monitor VPC peering compliance
   - Tag all resources with CostCenter and Environment tags
   - Ensure all configurations support audit requirements

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS VPC Peering Connection for cross-account connectivity
- Use AWS VPC for network isolation
- Use Route Tables for traffic routing
- Use Security Groups and Network ACLs for traffic filtering
- Use VPC Flow Logs with S3 backend for network traffic capture
- Use IAM Roles for cross-account authentication
- Use CloudWatch for alarms and dashboards
- Use VPC Endpoints for S3 and DynamoDB
- Use AWS Config for compliance monitoring
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix variable for multi-environment support
- Resource naming pattern: {resource-type}-{environment-suffix}
- All resources MUST be destroyable (use force_destroy=True for S3 buckets, no lifecycle retain policies)
- DO NOT create GuardDuty detectors (account-level resource, add comment only if relevant)
- For AWS Config IAM role, use managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- No hardcoded environment names, account IDs, or region values
- Use variables/parameters for all environment-specific values

### Constraints

- VPC CIDR blocks must not overlap (10.0.0.0/16 for trading, 10.1.0.0/16 for analytics)
- All traffic must use AWS private network, never traverse public internet
- Security groups must follow whitelist approach only
- Network ACLs must explicitly allow only required ports and subnets
- VPC Flow Logs must be enabled for all network interfaces
- DNS resolution must work bidirectionally between peered VPCs
- All resources must support cross-account deployment model
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- Functionality: Trading VPC can communicate with analytics VPC over private network on ports 443 and 5432
- Security: No traffic allowed from 0.0.0.0/0, all rules use specific CIDR blocks
- Monitoring: VPC Flow Logs capturing traffic every 5 minutes, CloudWatch alarms configured
- Compliance: All resources tagged with CostCenter and Environment, AWS Config rules active
- DNS Resolution: Services in both VPCs can resolve each other by DNS names
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be destroyed cleanly without manual intervention
- Code Quality: Python code, well-structured, properly documented

## What to deliver

- Complete CDKTF Python implementation
- VPC Peering Connection with cross-account support
- Route Tables configured for both VPCs
- Security Groups and Network ACLs with whitelist rules
- VPC Flow Logs with S3 storage
- IAM Roles for cross-account peering
- CloudWatch alarms and dashboard
- VPC Endpoints for S3 and DynamoDB
- AWS Config rules for compliance monitoring
- Stack outputs: peering connection ID, route table IDs, CloudWatch dashboard URL
- Documentation with deployment instructions
