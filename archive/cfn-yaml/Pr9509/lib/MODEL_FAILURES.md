# Common Model Failures for CloudFormation Template Generation

## Security-Related Failures

### 1. Overly Permissive IAM Policies
- **Failure**: Model generates IAM policies with `"*"` permissions or overly broad resource ARNs
- **Example**: `"Resource": "*"` instead of specific resource ARNs
- **Impact**: Security vulnerability, violates least privilege principle

### 2. Insecure Security Group Configuration
- **Failure**: Model allows `0.0.0.0/0` for SSH access instead of specific IP ranges
- **Example**: `CidrIp: 0.0.0.0/0` for port 22
- **Impact**: Exposes SSH access to the entire internet

### 3. Missing Encryption Configuration
- **Failure**: Model doesn't enable encryption for EBS volumes or RDS instances
- **Example**: No `Encrypted: true` property on storage resources
- **Impact**: Data at rest is not encrypted

## Networking Failures

### 4. Incorrect Subnet Configuration
- **Failure**: Model places EC2 instance in private subnet when public access is needed
- **Example**: EC2 instance in private subnet without proper routing
- **Impact**: Instance cannot be accessed from internet

### 5. Missing NAT Gateway Dependencies
- **Failure**: Model doesn't properly handle NAT Gateway dependencies
- **Example**: Private subnets reference NAT Gateway before it's created
- **Impact**: Template deployment fails due to dependency issues

### 6. VPC CIDR Conflicts
- **Failure**: Model uses overlapping CIDR blocks for VPC and subnets
- **Example**: VPC uses `10.0.0.0/16` and subnets use `10.0.0.0/24` and `10.0.0.0/25`
- **Impact**: Invalid network configuration

## Resource Configuration Failures

### 7. Missing Resource Dependencies
- **Failure**: Model doesn't use `DependsOn` or implicit dependencies correctly
- **Example**: Security group referenced before creation
- **Impact**: Template deployment fails with dependency errors

### 8. Incorrect Secrets Manager Integration
- **Failure**: Model doesn't properly configure IAM roles for Secrets Manager access
- **Example**: EC2 instance role lacks `secretsmanager:GetSecretValue` permission
- **Impact**: Application cannot retrieve secrets

### 9. Missing Monitoring Configuration
- **Failure**: Model doesn't enable CloudWatch logging or VPC Flow Logs
- **Example**: No CloudWatch log group or IAM permissions for logging
- **Impact**: No visibility into system performance and network traffic

## Template Structure Failures

### 10. Invalid YAML Syntax
- **Failure**: Model generates malformed YAML with incorrect indentation or syntax
- **Example**: Missing quotes around values with special characters
- **Impact**: Template fails validation

### 11. Missing Required Parameters
- **Failure**: Model doesn't define parameters for configurable values
- **Example**: Hard-coded IP ranges instead of parameters
- **Impact**: Template is not reusable across environments

### 12. Incomplete Resource Definitions
- **Failure**: Model omits required properties for AWS resources
- **Example**: EC2 instance without `ImageId` or `InstanceType`
- **Impact**: Template deployment fails

## Best Practice Violations

### 13. No Tags Applied
- **Failure**: Model doesn't add resource tags for cost tracking and management
- **Example**: Resources without `Environment`, `Project`, or `Owner` tags
- **Impact**: Difficult to manage and track costs

### 14. Missing Error Handling
- **Failure**: Model doesn't include proper error handling or rollback configuration
- **Example**: No `DeletionPolicy` or `UpdateReplacePolicy` settings
- **Impact**: Failed deployments may leave orphaned resources

### 15. Hard-coded Values
- **Failure**: Model uses hard-coded values instead of parameters or mappings
- **Example**: Hard-coded AMI IDs or instance types
- **Impact**: Template is not portable across regions or environments