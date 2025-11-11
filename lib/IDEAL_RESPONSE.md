# Hub-and-Spoke Network Architecture - CloudFormation YAML Implementation

This solution implements a complete hub-and-spoke network architecture using **AWS CloudFormation with YAML** for migrating departmental workloads to AWS.

## Architecture Overview

The infrastructure creates:
- **1 Hub VPC** (10.0.0.0/16) - Central connectivity hub
- **3 Spoke VPCs** (Finance: 10.1.0.0/16, Engineering: 10.2.0.0/16, Marketing: 10.3.0.0/16)
- **AWS Transit Gateway** - Hub-and-spoke routing with controlled traffic flow
- **VPC Flow Logs** - All VPCs logged to CloudWatch at 1-minute intervals
- **NAT Gateways** - One per spoke VPC for outbound internet access
- **Security Groups** - Web-tier and app-tier with least-privilege access
- **Network ACLs** - Deny-by-default with explicit allow rules
- **Lambda Custom Resource** - Connectivity testing

## Platform and Language

**Platform**: CloudFormation (cfn)
**Language**: YAML

## Implementation

The complete CloudFormation template is located in `/var/www/turing/iac-test-automations/worktree/synth-101000891/lib/TapStack.yml`.

### Key Components

1. **Four VPCs** with proper CIDR allocation:
   - Hub: 10.0.0.0/16
   - Finance: 10.1.0.0/16
   - Engineering: 10.2.0.0/16
   - Marketing: 10.3.0.0/16

2. **Each VPC includes**:
   - 3 Availability Zones
   - 3 Public subnets (x.x.100.0/24, x.x.101.0/24, x.x.102.0/24)
   - 3 Private subnets (x.x.0.0/24, x.x.1.0/24, x.x.2.0/24)
   - Internet Gateway
   - Route tables (public and private)
   - VPC Flow Logs (1-minute aggregation to CloudWatch)

3. **Transit Gateway**:
   - DefaultRouteTableAssociation: disabled
   - DefaultRouteTablePropagation: disabled
   - Two custom route tables:
     - **HubTGWRouteTable**: Hub VPC sees all spoke VPCs
     - **SpokeTGWRouteTable**: Spoke VPCs see only hub VPC
   - Four VPC attachments (Hub + Finance + Engineering + Marketing)

4. **NAT Gateways**:
   - Finance VPC: 1 NAT Gateway in public subnet
   - Engineering VPC: 1 NAT Gateway in public subnet
   - Marketing VPC: 1 NAT Gateway in public subnet
   - Private subnets route internet traffic through NAT Gateway

5. **Security Groups**:
   - **WebTierSecurityGroup**: HTTP/HTTPS from 0.0.0.0/0
   - **AppTierSecurityGroup**: Custom ports (8080, 3000) from WebTierSecurityGroup only

6. **Network ACLs**:
   - Deny by default
   - Allow HTTP (80), HTTPS (443) inbound
   - Allow ephemeral ports (1024-65535) for return traffic
   - Allow all traffic from 10.0.0.0/8 for Transit Gateway
   - Allow all outbound traffic

7. **VPC Flow Logs**:
   - All 4 VPCs have flow logs enabled
   - MaxAggregationInterval: 60 (1-minute intervals)
   - Destination: CloudWatch Logs
   - Separate log group per VPC
   - IAM role with necessary permissions

8. **Custom Resource**:
   - Lambda function for connectivity testing
   - Python 3.11 runtime
   - Tests Transit Gateway attachments
   - Returns status in stack outputs

9. **Comprehensive Tagging**:
   - Department: Hub, Finance, Engineering, Marketing
   - Environment: Parameter-driven (migration, development, staging, production)
   - MigrationPhase: phase-1

10. **Resource Naming**:
    - All resources include EnvironmentSuffix parameter
    - Format: `{resource-type}-{context}-${EnvironmentSuffix}`

## Hub-and-Spoke Isolation

The architecture ensures proper hub-and-spoke topology:

1. **Hub VPC** is associated with `HubTGWRouteTable`
   - Propagates routes from all spoke VPC attachments
   - Hub can reach Finance, Engineering, Marketing

2. **Spoke VPCs** are associated with `SpokeTGWRouteTable`
   - Propagates routes only from hub VPC attachment
   - Spokes can reach Hub only, not other spokes

3. **Result**:
   - Finance ↔ Hub ✓
   - Engineering ↔ Hub ✓
   - Marketing ↔ Hub ✓
   - Finance ↔ Engineering ✗
   - Finance ↔ Marketing ✗
   - Engineering ↔ Marketing ✗

## Deployment

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name hub-spoke-migration \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
               ParameterKey=Environment,ParameterValue=migration \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor deployment
aws cloudformation describe-stacks \
  --stack-name hub-spoke-migration \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name hub-spoke-migration \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Verification

1. **Verify Transit Gateway Attachments**:
   ```bash
   aws ec2 describe-transit-gateway-attachments \
     --filters "Name=transit-gateway-id,Values=<TGW_ID>" \
     --region us-east-1
   ```

2. **Check VPC Flow Logs**:
   ```bash
   aws logs describe-log-groups \
     --log-group-name-prefix "/aws/vpc/" \
     --region us-east-1
   ```

3. **Verify Security Groups**:
   ```bash
   aws ec2 describe-security-groups \
     --filters "Name=tag:Environment,Values=migration" \
     --region us-east-1
   ```

## Outputs

The stack exports:
- TransitGatewayId
- All VPC IDs (Hub, Finance, Engineering, Marketing)
- All subnet IDs (public and private, 24 total)
- Security group IDs (Web-tier, App-tier)
- NAT Gateway IDs (Finance, Engineering, Marketing)
- Connectivity test result

## Requirements Fulfilled

- Hub VPC (10.0.0.0/16) with 3 AZs, public and private subnets
- Three spoke VPCs (10.1.0.0/16, 10.2.0.0/16, 10.3.0.0/16) each with 3 AZs
- Transit Gateway with hub-and-spoke routing (no spoke-to-spoke)
- NAT Gateways in each spoke VPC for private subnet internet access
- VPC Flow Logs for all VPCs with 1-minute intervals to CloudWatch
- Security groups with least-privilege (web-tier and app-tier)
- Network ACLs deny-by-default with explicit allow rules
- Custom resource Lambda for connectivity testing
- Comprehensive tagging (Department, Environment, MigrationPhase)
- All outputs exported (Transit Gateway ID, VPC IDs, subnet IDs, security group IDs)

## Cleanup

```bash
# Delete the stack (removes all resources)
aws cloudformation delete-stack \
  --stack-name hub-spoke-migration \
  --region us-east-1
```

## Notes

- All resources use DeletionPolicy: Delete (or default Delete)
- CIDR blocks follow RFC1918 and do not overlap
- Hub-and-spoke isolation enforced at Transit Gateway route table level
- Network ACLs provide additional security layer beyond security groups
- Custom resource validates connectivity post-deployment
- All resources tagged for cost tracking and organization
- EnvironmentSuffix parameter enables multi-environment deployments
