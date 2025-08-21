## Common Deployment Failures and Solutions

This document outlines potential failure scenarios, their root causes, and remediation strategies for the AWS infrastructure provisioning with Pulumi Python.

---

## 1. Configuration and Authentication Failures

### 1.1 AWS Credentials Not Set
**Error Message:**
```
error: could not determine the AWS region to use. Set the region using `pulumi config set aws:region <region>` or by setting either the AWS_REGION or AWS_DEFAULT_REGION environment variables
```

**Root Cause:**
- AWS credentials not configured
- Missing AWS CLI setup
- Incorrect IAM permissions

**Solutions:**
```bash
# Configure AWS credentials
aws configure

# Set region explicitly
pulumi config set aws:region us-east-1

# Verify credentials
aws sts get-caller-identity

# Alternative: Use environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 1.2 Invalid IP Address Configuration
**Error Message:**
```
error: invalid CIDR block format: '192.168.1.1' (expected format: '192.168.1.1/32')
```

**Root Cause:**
- IP address provided without CIDR notation
- Invalid IP format

**Solutions:**
```bash
# Correct format - single IP
pulumi config set my_ip_address "203.0.113.100/32"

# Multiple IPs require security group modification
# Update the code to accept an array of IPs
```

---

## 2. Resource Limit and Quota Failures

### 2.1 VPC Limit Exceeded
**Error Message:**
```
error: VpcLimitExceeded: The maximum number of VPCs has been reached.
```

**Root Cause:**
- AWS account VPC limit reached (default: 5 per region)

**Solutions:**
```bash
# Check current VPC usage
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,State,CidrBlock]' --output table

# Request limit increase via AWS Support
# Or delete unused VPCs
aws ec2 delete-vpc --vpc-id vpc-xxxxxxxx
```

### 2.2 Insufficient Instance Capacity
**Error Message:**
```
error: InsufficientInstanceCapacity: We currently do not have sufficient t3.micro capacity in the Availability Zone (us-east-1a)
```

**Root Cause:**
- AWS capacity constraints in specific AZ
- Instance type unavailable

**Solutions:**
```python
# Modify instance type in code
instance_type="t3.small"  # or t2.micro, t3.nano

# Add multiple instance type fallback
INSTANCE_TYPES = ["t3.micro", "t2.micro", "t3.nano"]

# Implement retry logic with different AZs
```

---

## 3. Networking Configuration Failures

### 3.1 CIDR Block Conflicts
**Error Message:**
```
error: InvalidVpc.Range: The CIDR '10.0.0.0/16' conflicts with another subnet
```

**Root Cause:**
- CIDR block overlaps with existing VPC
- Subnet CIDR doesn't fit within VPC CIDR

**Solutions:**
```python
# Use different CIDR blocks
VPC_CIDR = "172.16.0.0/16"
PUBLIC_SUBNET_CIDRS = ["172.16.1.0/24", "172.16.2.0/24"]

# Check existing VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].CidrBlock'
```

### 3.2 Route Table Association Failures
**Error Message:**
```
error: Resource.AlreadyAssociated: the route table rtb-xxxxxxxx is already associated with subnet subnet-xxxxxxxx
```

**Root Cause:**
- Attempting to associate subnet with multiple route tables
- Previous deployment not properly cleaned up

**Solutions:**
```bash
# Check existing associations
aws ec2 describe-route-tables --route-table-ids rtb-xxxxxxxx

# Manually disassociate if needed
aws ec2 disassociate-route-table --association-id rtbassoc-xxxxxxxx

# Use Pulumi refresh
pulumi refresh
```

---

## 4. IAM and Security Failures

### 4.1 IAM Role Creation Failures
**Error Message:**
```
error: EntityAlreadyExists: Role with name EC2-S3-ReadOnly-Role already exists.
```

**Root Cause:**
- IAM role with same name exists
- Previous deployment not cleaned up

**Solutions:**
```python
# Add unique suffix to role names
role_name = f"EC2-S3-ReadOnly-Role-{pulumi.get_stack()}"

# Or check and reuse existing role
existing_role = aws.iam.get_role(name="EC2-S3-ReadOnly-Role")
```

### 4.2 Security Group Rule Conflicts
**Error Message:**
```
error: InvalidGroup.Duplicate: the specified rule "peer: 0.0.0.0/0, TCP, from port: 22, to port: 22, ALLOW" already exists
```

**Root Cause:**
- Duplicate security group rules
- Security group not properly cleaned up

**Solutions:**
```python
# Use unique security group names
name=f"production-ec2-sg-{pulumi.get_stack()}"

# Check existing security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=production-ec2-sg"
```

---

## 5. EC2 Instance Launch Failures

### 5.1 AMI Not Found
**Error Message:**
```
error: InvalidAMIID.NotFound: The image id '[ami-xxxxxxxx]' does not exist
```

**Root Cause:**
- AMI lookup filters too restrictive
- AMI deprecated or unavailable in region

**Solutions:**
```python
# Broaden AMI search filters
def get_latest_amazon_linux_ami():
    return aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["amzn2-ami-hvm-*"]  # Simplified filter
            )
        ]
    )

# Verify AMI availability
aws ec2 describe-images --owners amazon --filters "Name=name,Values=amzn2-ami-hvm-*" --query 'Images[0].ImageId'
```

### 5.2 Key Pair Issues
**Error Message:**
```
error: InvalidKeyPair.NotFound: The key pair 'my-key' does not exist
```

**Root Cause:**
- SSH key pair not created or specified
- Key pair in different region

**Solutions:**
```python
# Create key pair in code
key_pair = aws.ec2.KeyPair(
    "ec2-keypair",
    key_name=f"tap-key-{pulumi.get_stack()}",
    public_key="ssh-rsa AAAAB3NzaC1yc2EAAAA..."  # Your public key
)

# Add to EC2 instance
key_name=key_pair.key_name
```

---

## 6. Dependency and Timing Issues

### 6.1 Resource Dependencies
**Error Message:**
```
error: DependencyViolation: The vpc 'vpc-xxxxxxxx' has dependencies and cannot be deleted
```

**Root Cause:**
- Resources not properly ordered for deletion
- Missing explicit dependencies

**Solutions:**
```python
# Add explicit dependencies
opts=pulumi.ResourceOptions(
    depends_on=[vpc, internet_gateway, ec2_security_group]
)

# Use pulumi destroy with --target flag
pulumi destroy --target urn:pulumi:stack::project::aws:ec2/instance:Instance::production-ec2-1
```

### 6.2 Eventual Consistency Issues
**Error Message:**
```
error: InvalidInstanceProfile.NotFound: Instance profile EC2-S3-ReadOnly-InstanceProfile does not exist
```

**Root Cause:**
- AWS eventual consistency delays
- IAM resources not fully propagated

**Solutions:**
```python
# Add explicit dependencies and delays
opts=pulumi.ResourceOptions(
    depends_on=[ec2_instance_profile, s3_readonly_policy],
    custom_timeouts=pulumi.CustomTimeouts(create="10m")
)

# Use Pulumi sleep resource for critical timing
import time
time.sleep(30)  # Wait for IAM propagation
```

---

## 7. State Management Failures

### 7.1 State File Corruption
**Error Message:**
```
error: could not deserialize deployment: json: cannot unmarshal string into Go value
```

**Root Cause:**
- Pulumi state file corrupted
- Concurrent operations on same stack

**Solutions:**
```bash
# Export and reimport state
pulumi stack export --file backup.json
pulumi stack import --file backup.json

# Cancel any ongoing operations
pulumi cancel

# Refresh state from actual resources
pulumi refresh
```

### 7.2 Stack Locked
**Error Message:**
```
error: the stack is currently locked by 1 lock(s)
```

**Root Cause:**
- Previous operation didn't complete cleanly
- Multiple simultaneous operations

**Solutions:**
```bash
# Force unlock (use with caution)
pulumi stack unset-secret --force

# Check lock details
pulumi stack --show-secrets

# Wait for operation to complete or cancel
pulumi cancel
```

---

## 8. Performance and Timeout Issues

### 8.1 Resource Creation Timeouts
**Error Message:**
```
error: Timeout waiting for internet gateway to attach to VPC
```

**Root Cause:**
- AWS API delays
- Resource creation taking longer than expected

**Solutions:**
```python
# Increase timeouts
opts=pulumi.ResourceOptions(
    custom_timeouts=pulumi.CustomTimeouts(
        create="15m",
        update="10m",
        delete="10m"
    )
)

# Add retry logic
import time
for attempt in range(3):
    try:
        # Resource creation
        break
    except Exception as e:
        if attempt < 2:
            time.sleep(30)
        else:
            raise
```

---

## 9. Debugging and Monitoring

### 9.1 Enable Verbose Logging
```bash
# Increase log verbosity
pulumi up --logtostderr -v=9

# Enable debug mode
export PULUMI_DEBUG=true
pulumi up
```

### 9.2 Check AWS CloudTrail
```bash
# Check recent API calls
aws logs filter-log-events \
    --log-group-name CloudTrail/AWSCloudTrailLogs \
    --start-time $(date -d '1 hour ago' +%s)000
```

### 9.3 Validate Resources Manually
```bash
# Verify VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=Production-VPC"

# Check EC2 instances
aws ec2 describe-instances --filters "Name=tag:Project,Values=CloudEnvironmentSetup"

# Verify IAM role
aws iam get-role --role-name EC2-S3-ReadOnly-Role
```

---

## 10. Recovery Procedures

### 10.1 Partial Deployment Failure
```bash
# Continue deployment from last successful point
pulumi up --continue-on-error

# Target specific resources
pulumi up --target urn:pulumi:stack::project::aws:ec2/vpc:Vpc::production-vpc
```

### 10.2 Complete Stack Recovery
```bash
# Export current state
pulumi stack export --file pre-recovery.json

# Import known good state
pulumi stack import --file last-known-good.json

# Perform targeted refresh
pulumi refresh --target <specific-resource-urn>
```

### 10.3 Clean Slate Recovery
```bash
# Destroy all resources
pulumi destroy --yes

# Remove stack
pulumi stack rm

# Recreate stack
pulumi stack init production
pulumi config set my_ip_address "YOUR_IP/32"
pulumi up
```

---

## 11. Best Practices to Prevent Failures

### 11.1 Pre-deployment Checks
```bash
# Validate AWS permissions
aws iam simulate-principal-policy \
    --policy-source-arn $(aws sts get-caller-identity --query Arn --output text) \
    --action-names ec2:RunInstances ec2:CreateVpc iam:CreateRole

# Check resource limits
aws service-quotas get-service-quota \
    --service-code ec2 \
    --quota-code L-F678F1CE  # Running On-Demand instances
```

### 11.2 Code Validation
```python
# Add resource validation
def validate_cidr(cidr: str) -> bool:
    import ipaddress
    try:
        ipaddress.IPv4Network(cidr)
        return True
    except ValueError:
        return False

# Implement error handling
try:
    vpc = aws.ec2.Vpc(...)
except Exception as e:
    pulumi.log.error(f"VPC creation failed: {e}")
    raise
```

### 11.3 Gradual Deployment
```bash
# Deploy incrementally
pulumi up --target urn:pulumi:stack::project::aws:ec2/vpc:Vpc::production-vpc
pulumi up --target urn:pulumi:stack::project::aws:ec2/subnet:Subnet::public-subnet-1
# ... continue with remaining resources
```

---

## 12. Emergency Contacts and Escalation

### 12.1 AWS Support Cases
- **Account Issues**: Create support case via AWS Console
- **Service Limits**: Request quota increases
- **Technical Issues**: Engage AWS Premium Support

### 12.2 Internal Escalation
- **Level 1**: Infrastructure Team Lead
- **Level 2**: DevOps Manager
- **Level 3**: Cloud Architecture Team

### 12.3 Documentation and Runbooks
- Maintain incident response playbooks
- Document all configuration changes
- Keep recovery procedures updated

---

## Conclusion

This comprehensive failure guide covers the most common issues encountered during AWS infrastructure provisioning with Pulumi. Regular review and updates of these procedures ensure robust and reliable deployments.

For additional support:
- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **AWS Documentation**: https://docs.aws.amazon.com/
- **Community Forums**: Pulumi Community Slack, AWS Forums