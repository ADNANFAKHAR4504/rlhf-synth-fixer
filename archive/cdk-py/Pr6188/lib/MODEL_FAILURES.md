# Model Failures - Production VPC Infrastructure

This document tracks common failure patterns observed when generating this infrastructure.

## Common Failure Patterns

### 1. NAT Gateway Instead of NAT Instance
- **Issue**: Model uses managed NAT Gateway instead of NAT instances
- **Impact**: Violates cost optimization requirement and constraint #2
- **Fix**: Explicitly specify NAT instances (t3.micro EC2) in requirements

### 2. Incorrect Flow Log Interval
- **Issue**: Uses default 600-second interval instead of required 60-second
- **Impact**: Violates constraint #4
- **Fix**: Set `max_aggregation_interval=60` in CfnFlowLog

### 3. Shared Route Tables
- **Issue**: Subnets share route tables instead of dedicated ones
- **Impact**: Violates constraint #5
- **Fix**: Create separate CfnRouteTable for each subnet

### 4. Default Network ACLs
- **Issue**: Uses VPC default ACLs instead of custom ones
- **Impact**: Violates constraint #3 (explicit rules only)
- **Fix**: Create custom NetworkAcl resources with explicit rules

### 5. Missing environmentSuffix
- **Issue**: Resource names don't include environment suffix parameter
- **Impact**: Cannot support PR environments
- **Fix**: Append `-{env_suffix}` to all resource IDs and names

### 6. VPC Endpoints in All Subnets
- **Issue**: S3/DynamoDB endpoints associated with public subnets too
- **Impact**: Violates constraint #7 (private subnets only)
- **Fix**: Use `SubnetSelection(subnets=private_subnets)` only

### 7. Security Group with 0.0.0.0/0
- **Issue**: Security groups allow traffic from anywhere
- **Impact**: Violates constraint #6 (least-privilege)
- **Fix**: Use specific CIDR blocks (10.50.x.x/24) for NAT SG

### 8. Missing Source/Dest Check Disable
- **Issue**: NAT instances have source_dest_check=True (default)
- **Impact**: NAT instances cannot route traffic
- **Fix**: Set `source_dest_check=False` on Instance resource

### 9. Incomplete Tagging
- **Issue**: Not all resources have Environment, Team, CostCenter tags
- **Impact**: Violates constraint #8
- **Fix**: Apply standard_tags to all resources using Tags.of()

### 10. Wrong VPC CIDR
- **Issue**: Uses different CIDR than specified 10.50.0.0/16
- **Impact**: Violates constraint #1
- **Fix**: Use exact CIDR: `ip_addresses=ec2.IpAddresses.cidr("10.50.0.0/16")`

## Prevention Strategies

1. **Explicit Requirements**: State "NAT instances (NOT NAT Gateways)" clearly
2. **Constraint Checklist**: Review all 8 constraints before generation
3. **Template Review**: Check archive/ for proven patterns
4. **Validation Tests**: Unit tests catch most common failures
5. **Platform Verification**: Ensure MODEL_RESPONSE uses CDK Python syntax

## Testing Coverage

Unit tests should specifically verify:
- NAT instances created (not NAT Gateways)
- Flow log interval is 60 seconds
- Each subnet has dedicated route table
- Custom NACLs with explicit rules
- All resource names include environment suffix
- VPC endpoints only in private subnets
- NAT SG doesn't use 0.0.0.0/0
- NAT instances have source_dest_check=False
- All resources have required tags
- VPC CIDR is 10.50.0.0/16
