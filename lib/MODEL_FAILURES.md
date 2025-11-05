# Model Response Failures - Task 101000840

This document catalogs the intentional mistakes introduced in MODEL_RESPONSE.md to simulate realistic LLM errors.

## Critical Failures

### 1. Incomplete NAT Gateway Configuration
**Location**: Lines 108-123 in MODEL_RESPONSE.md
**Issue**: Only 1 NAT Gateway created instead of 3 (one per AZ)
**Impact**:
- Loss of high availability - single point of failure
- Private subnets in AZ2 and AZ3 won't have outbound internet access
- Violates requirement: "NAT Gateways in each public subnet"
**Missing Resources**:
- NATGatewayEIP2 and NATGatewayEIP3
- NATGateway2 and NATGateway3

### 2. Missing Public Subnet Route Table Associations
**Location**: Lines 142-147 in MODEL_RESPONSE.md
**Issue**: Only PublicSubnet1 associated with public route table
**Impact**:
- PublicSubnet2 and PublicSubnet3 cannot route to Internet Gateway
- Resources in those subnets won't have internet connectivity
- Breaks multi-AZ deployment
**Missing Resources**:
- PublicSubnetRouteTableAssociation2
- PublicSubnetRouteTableAssociation3

### 3. Single Private Route Table for All AZs
**Location**: Lines 149-181 in MODEL_RESPONSE.md
**Issue**: Only one private route table pointing to single NAT Gateway
**Impact**:
- No redundancy - all private subnets depend on one NAT Gateway in AZ1
- Cross-AZ data transfer charges
- Single point of failure violates HA requirement
**Required Fix**:
- Create 3 separate private route tables (one per AZ)
- Each should route to its respective NAT Gateway

### 4. Missing DynamoDB VPC Endpoint
**Location**: Lines 183-190 in MODEL_RESPONSE.md
**Issue**: Only S3 endpoint created, DynamoDB endpoint missing
**Impact**:
- DynamoDB traffic routes through NAT Gateway (costs money)
- Violates requirement: "VPC endpoints for S3 and DynamoDB services"
- Increased latency and data transfer costs
**Missing Resource**: DynamoDB gateway endpoint

### 5. Incomplete Network ACL Configuration
**Location**: Lines 232-241 in MODEL_RESPONSE.md
**Issue**: NetworkAcl resource created but no inbound/outbound rules
**Impact**:
- Default deny-all rules will block all traffic
- Subnets will be completely isolated
- Violates requirement: "Configure inbound and outbound rules with proper rule numbers"
**Missing Resources**:
- NetworkAclEntryInbound rules (80, 443, 5432, ephemeral ports)
- NetworkAclEntryOutbound rules
- SubnetNetworkAclAssociations

### 6. VPC Flow Logs Without S3 Bucket
**Location**: Lines 243-252 in MODEL_RESPONSE.md
**Issue**: FlowLog references non-existent S3 bucket
**Impact**:
- Stack creation will fail - bucket doesn't exist
- Can't enable flow logs without destination
- Violates compliance requirement
**Missing Resources**:
- S3 bucket for flow logs storage
- S3 bucket policy allowing VPC Flow Logs service
- IAM role for Flow Logs (not needed for S3 destination, but good practice)

### 7. Database Security Group Using CIDR Instead of Source Security Group
**Location**: Lines 214-230 in MODEL_RESPONSE.md
**Issue**: Database SG allows 5432 from entire VPC CIDR (10.1.0.0/16) instead of web tier SG
**Impact**:
- Overly permissive - any resource in VPC can access database
- Violates least privilege principle
- Should reference WebSecurityGroup as source
**Required Fix**: Change CidrIp to SourceSecurityGroupId: !Ref WebSecurityGroup

## Moderate Failures

### 8. Missing Route Table IDs in Outputs
**Location**: Line 293 in MODEL_RESPONSE.md
**Issue**: Outputs section missing route table IDs
**Impact**:
- Can't reference route tables in dependent stacks
- Violates requirement: "Route table IDs for validation"
**Missing Outputs**:
- PublicRouteTableId
- PrivateRouteTable1Id, PrivateRouteTable2Id, PrivateRouteTable3Id

### 9. Missing S3 Bucket Name Output
**Issue**: No output for VPC Flow Logs S3 bucket
**Impact**: Can't reference bucket in other stacks or for monitoring
**Required**: Add FlowLogsBucketName output

## Summary

Total Failures: 9
- Critical (blocking deployment): 6
- Moderate (deployment succeeds but incomplete): 3

These failures represent realistic mistakes an LLM might make:
- Incomplete resource sets (NAT Gateways 1 of 3)
- Missing associations (route table associations)
- Referencing non-existent resources (S3 bucket)
- Overly broad security rules (CIDR vs security group)
- Incomplete feature implementation (NACL without rules)
