# MODEL FAILURES

## Common Terraform Configuration Failures:

### 1. Resource Naming Conflicts:
- Duplicate resource names across environments
- Non-unique S3 bucket names
- IAM role name collisions
- Security group name conflicts

### 2. Network Configuration Issues:
- Incorrect CIDR block overlaps
- Missing route table associations
- Insufficient subnet capacity
- Cross-AZ connectivity problems
- Missing NAT Gateway for private subnet internet access

### 3. Security Group Misconfigurations:
- Overly permissive rules (0.0.0.0/0 access)
- Missing egress rules
- Circular dependencies between security groups
- Incorrect port ranges
- Protocol mismatches

### 4. IAM Permission Problems:
- Over-privileged roles (unnecessary permissions)
- Missing required permissions
- Incorrect trust policies
- Policy size limits exceeded
- Resource ARN mismatches

### 5. Secrets Manager Issues:
- Unencrypted secrets in state
- Missing KMS key permissions
- Secret versioning conflicts
- Cross-region access problems
- Rotation configuration errors

### 6. EC2 Instance Failures:
- Instance type not available in AZ
- AMI not found or deprecated
- Insufficient instance capacity
- Metadata service v1 security risks
- Unencrypted EBS volumes

### 7. Terraform State Issues:
- State file corruption
- Concurrent execution conflicts
- Remote state locking failures
- Import conflicts
- Resource drift detection

### 8. Variable Validation Problem:
- Missing required variables
- Invalid variable types
- Sensitive data exposure
- Default value security risks
- Variable constraint violations

### 9. Provider Configuration Errors:
- Version compatibility issues
- Authentication failures
- Region availability problems
- Feature flag misconfigurations
- Resource quotas exceeded

### 10. Output Dependencies:
- Circular output references
- Missing output descriptions
- Sensitive data exposure in outputs
- Cross-module dependency failures
- Output format inconsistencies
