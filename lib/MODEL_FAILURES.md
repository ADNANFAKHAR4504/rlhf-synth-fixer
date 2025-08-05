# AWS Production Infrastructure - Model Failure Analysis and Troubleshooting

## Overview

This document provides comprehensive analysis of potential failure scenarios, common issues, troubleshooting procedures, and recovery strategies for the AWS production infrastructure deployment. It serves as a diagnostic guide for infrastructure engineers and operations teams.

## Common Deployment Failures

### 1. **CDKTF Synthesis Failures**

#### **Failure Scenario: Missing Dependencies**
```bash
Error: ModuleNotFoundError: No module named 'cdktf_cdktf_provider_aws'
```

**Root Cause**: Missing or incorrectly installed CDKTF providers

**Resolution Steps**:
```bash
# 1. Verify Python environment
python --version  # Should be 3.8+

# 2. Install/reinstall requirements
pip install --upgrade pip
pip install -r requirements.txt

# 3. Verify CDKTF installation
cdktf --version

# 4. Clear Python cache if needed
find . -name "__pycache__" -delete
find . -name "*.pyc" -delete
```

**Prevention**: Use virtual environments and pin specific dependency versions

#### **Failure Scenario: Stack Synthesis Errors**
```bash
Error: ReferenceError: 'subnet_id' referenced before assignment
```

**Root Cause**: Resource dependency issues or incorrect resource references

**Resolution Steps**:
1. Check resource creation order in `tap_stack.py`
2. Verify all resource references use correct attribute names
3. Ensure dependencies are properly declared with `depends_on`
4. Validate CIDR block calculations and subnet allocations

**Code Fix Example**:
```python
# Before (incorrect)
self.bastion_host = Instance(
    self, "bastion",
    subnet_id=self.public_subnets[0].id  # May fail if list is empty
)

# After (correct)
def _create_bastion_host(self):
    if not self.public_subnets:
        raise ValueError("Public subnets must be created before Bastion host")
    
    self.bastion_host = Instance(
        self, "bastion",
        subnet_id=self.public_subnets[0].id
    )
```

### 2. **Terraform Provider Failures**

#### **Failure Scenario: AWS Provider Authentication**
```bash
Error: Error configuring AWS Provider: no valid credential sources for AWS Provider found
```

**Root Cause**: Missing or invalid AWS credentials

**Resolution Steps**:
```bash
# Option 1: AWS CLI Configuration
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format

# Option 2: Environment Variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-west-2"

# Option 3: IAM Role (EC2/Lambda)
# Attach appropriate IAM role to the execution environment

# Verify credentials
aws sts get-caller-identity
```

**Prevention**: 
- Use IAM roles instead of hardcoded credentials
- Implement credential rotation policies
- Use AWS SSO for centralized access management

#### **Failure Scenario: Insufficient IAM Permissions**
```bash
Error: AccessDenied: User: arn:aws:iam::123456789012:user/terraform is not authorized to perform: ec2:CreateVpc
```

**Root Cause**: IAM user/role lacks required permissions

**Required IAM Permissions**:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "s3:*",
                "iam:GetRole",
                "iam:PassRole"
            ],
            "Resource": "*"
        }
    ]
}
```

**Resolution**: Attach `PowerUserAccess` or custom policy with required permissions

### 3. **Network Configuration Failures**

#### **Failure Scenario: CIDR Block Conflicts**
```bash
Error: InvalidVpc.Range: The CIDR '10.0.0.0/16' conflicts with another subnet
```

**Root Cause**: CIDR block already in use or overlapping subnets

**Troubleshooting Steps**:
```bash
# 1. Check existing VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock]' --output table

# 2. Check subnet CIDR allocations
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,CidrBlock,VpcId]' --output table

# 3. Verify CIDR calculations
python3 -c "
import ipaddress
vpc = ipaddress.IPv4Network('10.0.0.0/16')
subnet1 = ipaddress.IPv4Network('10.0.1.0/24')
subnet2 = ipaddress.IPv4Network('10.0.2.0/24')
print(f'Subnet1 in VPC: {subnet1.subnet_of(vpc)}')
print(f'Subnet2 in VPC: {subnet2.subnet_of(vpc)}')
print(f'Subnets overlap: {subnet1.overlaps(subnet2)}')
"
```

**Resolution**: Use different CIDR blocks or clean up existing conflicting resources

#### **Failure Scenario: Availability Zone Limitations**
```bash
Error: InvalidParameterValue: Availability zone 'us-west-2d' is not supported
```

**Root Cause**: Requesting unavailable AZ or region-specific limitations

**Resolution Steps**:
```bash
# 1. Check available AZs
aws ec2 describe-availability-zones --region us-west-2

# 2. Update stack to use dynamic AZ selection
# Already implemented in tap_stack.py with:
self.azs = DataAwsAvailabilityZones(self, "available_azs", state="available")
```

### 4. **Security Configuration Failures**

#### **Failure Scenario: SSH Key Pair Issues**
```bash
Error: InvalidKeyPair.NotFound: The key pair 'nova-production-bastion-key' does not exist
```

**Root Cause**: SSH key pair not created or incorrect key reference

**Resolution Steps**:
```bash
# 1. Generate SSH key pair
ssh-keygen -t rsa -b 2048 -f ~/.ssh/nova-bastion-key

# 2. Create AWS key pair
aws ec2 import-key-pair \
    --key-name nova-production-bastion-key \
    --public-key-material fileb://~/.ssh/nova-bastion-key.pub

# 3. Update tap_stack.py with correct public key
public_key = open('~/.ssh/nova-bastion-key.pub', 'r').read()
```

**Code Fix**:
```python
# Update KeyPair resource with actual public key
self.bastion_key_pair = KeyPair(
    self, "production_bastion_key_pair",
    key_name=f"nova-production-bastion-key-{self.infrastructure_id.hex}",
    public_key="ssh-rsa AAAAB3Nza... [ACTUAL_PUBLIC_KEY_CONTENT]",  # Replace with real key
    tags={...}
)
```

#### **Failure Scenario: Security Group Rule Conflicts**
```bash
Error: InvalidGroup.Duplicate: The security group rule already exists
```

**Root Cause**: Duplicate security group rules or rule conflicts

**Troubleshooting**:
```bash
# 1. Check existing security groups
aws ec2 describe-security-groups --group-names "nova-production-*"

# 2. Clean up existing rules if needed
aws ec2 revoke-security-group-ingress \
    --group-id sg-12345678 \
    --protocol tcp \
    --port 22 \
    --cidr 203.0.113.0/24
```

### 5. **Resource Quota and Limit Failures**

#### **Failure Scenario: VPC Limit Exceeded**
```bash
Error: VpcLimitExceeded: The maximum number of VPCs has been reached
```

**Root Cause**: AWS account VPC limits reached

**Resolution Steps**:
```bash
# 1. Check current VPC usage
aws ec2 describe-vpcs --query 'length(Vpcs)'

# 2. Check VPC limits
aws service-quotas get-service-quota \
    --service-code ec2 \
    --quota-code L-F678F1CE

# 3. Request limit increase if needed
aws service-quotas request-service-quota-increase \
    --service-code ec2 \
    --quota-code L-F678F1CE \
    --desired-value 10
```

**Prevention**: Regular quota monitoring and proactive limit increase requests

#### **Failure Scenario: Elastic IP Allocation Failure**
```bash
Error: AddressLimitExceeded: The maximum number of addresses has been reached
```

**Root Cause**: EIP allocation limit exceeded

**Resolution**:
```bash
# 1. Check current EIP usage
aws ec2 describe-addresses --query 'length(Addresses)'

# 2. Release unused EIPs
aws ec2 describe-addresses --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]'

# 3. Request EIP limit increase
aws service-quotas request-service-quota-increase \
    --service-code ec2 \
    --quota-code L-0263D0A3 \
    --desired-value 20
```

## Security Validation Failures

### 1. **SSH Access Control Failures**

#### **Failure Scenario: Overly Permissive SSH Access**
```bash
Warning: Security group allows SSH access from 0.0.0.0/0
```

**Security Risk**: High - Allows SSH access from anywhere on the internet

**Validation Script**:
```bash
#!/bin/bash
# Check for overly permissive SSH rules
aws ec2 describe-security-groups \
    --query 'SecurityGroups[?IpPermissions[?FromPort==`22` && ToPort==`22` && IpRanges[?CidrIp==`0.0.0.0/0`]]].[GroupId,GroupName]' \
    --output table

# Should return empty if properly configured
```

**Resolution**: Update security group rules to restrict SSH to `203.0.113.0/24` only

#### **Failure Scenario: Missing Security Group Segregation**
```bash
Error: Private instances accessible directly from internet
```

**Root Cause**: Security groups not properly segregated between Bastion and private instances

**Fix**:
```python
# Ensure Bastion SG only allows inbound SSH from allowed CIDR
# Ensure Private SG only allows SSH from Bastion SG
SecurityGroupRule(
    self, "private_ssh_from_bastion",
    type="ingress",
    from_port=22,
    to_port=22,
    protocol="tcp",
    source_security_group_id=self.bastion_sg.id,  # Not CIDR blocks
    security_group_id=self.private_sg.id
)
```

### 2. **S3 Security Failures**

#### **Failure Scenario: S3 Bucket Public Access**
```bash
Error: S3 bucket is publicly accessible
```

**Security Risk**: Critical - Data exposure risk

**Validation Script**:
```bash
#!/bin/bash
# Check S3 bucket public access settings
aws s3api get-public-access-block --bucket nova-production-app-logs-xxxx

# Should return:
# {
#     "PublicAccessBlockConfiguration": {
#         "BlockPublicAcls": true,
#         "IgnorePublicAcls": true,
#         "BlockPublicPolicy": true,
#         "RestrictPublicBuckets": true
#     }
# }
```

**Resolution**: Ensure all S3 buckets have Block Public Access enabled

### 3. **Network Segmentation Failures**

#### **Failure Scenario: Private Subnet Route to IGW**
```bash
Error: Private subnet has route to Internet Gateway
```

**Security Risk**: High - Private resources exposed to internet

**Validation**:
```bash
# Check route tables for private subnets
aws ec2 describe-route-tables \
    --filters "Name=tag:Type,Values=Private" \
    --query 'RouteTables[*].Routes[?GatewayId!=null]'

# Should be empty (no IGW routes in private route tables)
```

## Performance and Scalability Issues

### 1. **Network Performance Problems**

#### **Issue: Single NAT Gateway Bottleneck**
**Symptom**: Slow internet access from private subnets
**Cause**: All private subnets using single NAT Gateway

**Current Implementation** (Correct):
```python
# Creates one NAT Gateway per AZ
for i in range(2):
    nat_gw = NatGateway(
        self, f"production_nat_gateway_{i+1}",
        allocation_id=self.nat_eips[i].id,
        subnet_id=self.public_subnets[i].id
    )
```

**Performance Monitoring**:
```bash
# Monitor NAT Gateway metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/NATGateway \
    --metric-name BytesOutToDestination \
    --dimensions Name=NatGatewayId,Value=nat-12345678 \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Average
```

### 2. **IP Address Exhaustion**

#### **Issue: Subnet IP Exhaustion**
**Symptom**: Cannot launch new instances
**Cause**: Insufficient IP addresses in subnets

**Diagnosis**:
```bash
# Check subnet IP usage
aws ec2 describe-subnets \
    --query 'Subnets[*].[SubnetId,CidrBlock,AvailableIpAddressCount]' \
    --output table
```

**Resolution**:
```python
# Increase subnet size by modifying CIDR allocation
# Change from /24 (254 IPs) to /23 (510 IPs)
cidr_block=f"10.0.{i*2}.0/23"  # Instead of /24
```

## Disaster Recovery Scenarios

### 1. **Complete Infrastructure Loss**

#### **Scenario**: Entire AWS region unavailable
**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 1 hour

**Recovery Steps**:
```bash
# 1. Switch to backup region
export AWS_DEFAULT_REGION=us-east-1

# 2. Update stack configuration
# Modify tap_stack.py:
self.aws_region = "us-east-1"

# 3. Deploy infrastructure in new region
python tap.py
terraform apply

# 4. Restore data from S3 cross-region replication
aws s3 sync s3://backup-bucket-us-west-2 s3://backup-bucket-us-east-1
```

### 2. **Partial Infrastructure Failure**

#### **Scenario**: Single AZ failure
**Impact**: 50% capacity reduction
**Mitigation**: Automatic failover through multi-AZ design

**Validation**:
```bash
# Simulate AZ failure by checking resource distribution
aws ec2 describe-instances \
    --query 'Reservations[*].Instances[*].[InstanceId,Placement.AvailabilityZone,State.Name]' \
    --output table
```

## Monitoring and Alerting Setup

### 1. **Infrastructure Health Monitoring**

#### **CloudWatch Alarms**:
```bash
# NAT Gateway monitoring
aws cloudwatch put-metric-alarm \
    --alarm-name "NAT-Gateway-High-Bandwidth" \
    --alarm-description "NAT Gateway bandwidth usage" \
    --metric-name BytesOutToDestination \
    --namespace AWS/NATGateway \
    --statistic Sum \
    --period 300 \
    --threshold 1000000000 \
    --comparison-operator GreaterThanThreshold

# Bastion host monitoring
aws cloudwatch put-metric-alarm \
    --alarm-name "Bastion-Host-CPU" \
    --alarm-description "Bastion host CPU usage" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold
```

### 2. **Security Monitoring**

#### **VPC Flow Logs**:
```bash
# Enable VPC Flow Logs
aws ec2 create-flow-logs \
    --resource-type VPC \
    --resource-ids vpc-12345678 \
    --traffic-type ALL \
    --log-destination-type s3 \
    --log-destination s3://vpc-flow-logs-bucket/
```

## Automated Recovery Procedures

### 1. **Infrastructure Self-Healing**

#### **Auto Scaling for Bastion Host**:
```python
# Add to tap_stack.py for future enhancement
def _create_bastion_auto_scaling(self):
    # Launch template for Bastion host
    launch_template = LaunchTemplate(
        self, "bastion_launch_template",
        image_id=self.amazon_linux_ami.id,
        instance_type="t3.micro",
        key_name=self.bastion_key_pair.key_name,
        security_group_ids=[self.bastion_sg.id]
    )
    
    # Auto Scaling Group
    AutoScalingGroup(
        self, "bastion_asg",
        min_size=1,
        max_size=2,
        desired_capacity=1,
        vpc_zone_identifier=[subnet.id for subnet in self.public_subnets],
        launch_template=launch_template
    )
```

### 2. **Backup and Recovery Automation**

#### **S3 Cross-Region Replication**:
```python
# Add to storage infrastructure
S3BucketReplication(
    self, "logs_bucket_replication",
    bucket=self.logs_bucket.id,
    replication_configuration={
        "role": "arn:aws:iam::account:role/replication-role",
        "rules": [{
            "id": "cross-region-backup",
            "status": "Enabled",
            "destination": {
                "bucket": "arn:aws:s3:::backup-bucket-us-east-1",
                "storage_class": "STANDARD_IA"
            }
        }]
    }
)
```

## Troubleshooting Checklists

### **Pre-Deployment Checklist**
- [ ] AWS credentials configured and tested
- [ ] Required IAM permissions verified
- [ ] Python environment and dependencies installed
- [ ] CDKTF version compatibility confirmed
- [ ] Target region has sufficient capacity
- [ ] No conflicting resources in target region

### **Post-Deployment Validation**
- [ ] VPC created with correct CIDR (10.0.0.0/16)
- [ ] All 4 subnets created across 2 AZs
- [ ] Internet Gateway and NAT Gateways operational
- [ ] Security groups configured with correct rules
- [ ] Bastion host accessible via SSH
- [ ] S3 buckets secured with Block Public Access
- [ ] All resources properly tagged

### **Security Validation**
- [ ] SSH access restricted to 203.0.113.0/24
- [ ] No public access to private subnets
- [ ] S3 buckets not publicly accessible
- [ ] Security group rules follow least privilege
- [ ] Network segmentation properly implemented

This troubleshooting guide provides comprehensive coverage of potential issues and their resolutions, enabling quick diagnosis and recovery of the AWS production infrastructure.