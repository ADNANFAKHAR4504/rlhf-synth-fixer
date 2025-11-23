# Common CloudFormation Model Failures

This document outlines common mistakes that LLMs might make when generating CloudFormation YAML templates for this student records database infrastructure task.

## 1. Platform and Language Errors

### Wrong IaC Tool
- Using Terraform HCL syntax instead of CloudFormation YAML
- Using CDK TypeScript/Python code instead of raw CloudFormation
- Using Pulumi code instead of CloudFormation
- Missing `AWSTemplateFormatVersion: '2010-09-09'` header

### Incorrect Syntax
- Using `resource` blocks instead of `Resources:` section
- Using `Type =` instead of `Type:`
- Missing proper YAML indentation
- Using Terraform-style interpolation `${var.foo}` instead of CloudFormation `!Sub` or `!Ref`

## 2. EnvironmentSuffix Violations

### Not Using Suffix at All
```yaml
# WRONG - No EnvironmentSuffix
Resources:
  RDSInstance:
    Properties:
      DBInstanceIdentifier: 'studentrecords-db'
```

### Using Wrong Interpolation Syntax
```yaml
# WRONG - Terraform syntax
DBInstanceIdentifier: '${var.environment_suffix}-db'

# WRONG - Python format
DBInstanceIdentifier: '{EnvironmentSuffix}-db'

# CORRECT - CloudFormation
DBInstanceIdentifier: !Sub 'studentrecords-db-${EnvironmentSuffix}'
```

### Missing Suffix on Resource Names
- Security group names without suffix
- KMS key aliases without suffix
- Log group names without suffix
- IAM role names without suffix
- Lambda function names without suffix

## 3. Multi-AZ Configuration Errors

### Wrong Multi-AZ Setting
```yaml
# WRONG - Not enabled
MultiAZ: false

# WRONG - Using cluster instead of instance
Type: AWS::RDS::DBCluster  # This is for Aurora, not PostgreSQL Multi-AZ
```

### Missing Required Multi-AZ Properties
- Not setting `MultiAZ: true` for RDS
- Not setting `AutomaticFailoverEnabled: true` for ElastiCache
- Not setting `MultiAZEnabled: true` for ElastiCache
- Using only 1 cache node instead of 2+

## 4. Encryption Mistakes

### Missing Encryption at Rest
```yaml
# WRONG - No KMS key specified
RDSInstance:
  Properties:
    StorageEncrypted: true
    # Missing: KmsKeyId: !Ref RDSKMSKey
```

### Missing Transit Encryption
```yaml
# WRONG - ElastiCache without TLS
ElastiCacheReplicationGroup:
  Properties:
    # Missing: TransitEncryptionEnabled: true
    # Missing: AuthToken
```

### KMS Key Policy Errors
- Not allowing the service principal (rds.amazonaws.com, elasticache.amazonaws.com)
- Missing key rotation: `EnableKeyRotation: true`
- Wrong key policy structure

## 5. Secrets Manager Rotation Errors

### Missing Rotation Configuration
```yaml
# WRONG - No rotation schedule
DBSecret:
  Type: AWS::SecretsManager::Secret
  # Missing: RotationSchedule resource
```

### Incorrect Rotation Period
```yaml
# WRONG - 90 days instead of 30
RotationRules:
  AutomaticallyAfterDays: 90  # Should be 30
```

### Missing Rotation Lambda
- Not creating the Lambda function for rotation
- Not providing proper IAM permissions for rotation Lambda
- Missing VPC configuration for Lambda to access RDS
- Not linking rotation schedule to Lambda ARN

### Wrong Secret Format
```yaml
# WRONG - Hardcoded password
MasterUserPassword: 'MyPassword123!'

# CORRECT - Dynamic resolution
MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
```

## 6. Security Group Misconfigurations

### Overly Permissive Rules
```yaml
# WRONG - Open to world
SecurityGroupIngress:
  - IpProtocol: tcp
    FromPort: 5432
    ToPort: 5432
    CidrIp: 0.0.0.0/0  # BAD!
```

### Missing Security Group References
- Not creating app security group for Lambda/application access
- Not referencing security groups between resources
- Using CIDR blocks instead of security group IDs

## 7. DeletionPolicy Violations

### Using Retain Policy
```yaml
# WRONG - Prevents clean deletion
RDSInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Retain  # Should be Delete for CI/CD
```

### Missing DeletionPolicy
- Not explicitly setting `DeletionPolicy: Delete`
- Not setting `UpdateReplacePolicy: Delete`

### Deletion Protection Enabled
```yaml
# WRONG - Blocks stack deletion
RDSInstance:
  Properties:
    DeletionProtection: true  # Should be false
```

## 8. CloudWatch Monitoring Gaps

### Missing Log Export
```yaml
# WRONG - No CloudWatch logs
RDSInstance:
  Properties:
    # Missing: EnableCloudwatchLogsExports: [postgresql, upgrade]
```

### No Log Groups Created
- Missing AWS::Logs::LogGroup resources
- Not setting retention periods
- No log groups for ElastiCache slow logs

### Missing Alarms
- No CPU utilization alarms
- No memory alarms
- No connection count alarms
- Missing alarm thresholds

## 9. VPC and Subnet Issues

### Hardcoding VPC/Subnets
```yaml
# WRONG - Hardcoded values
VPCSecurityGroups:
  - sg-12345678  # Should be dynamic
```

### Missing Subnet Groups
- Not creating DBSubnetGroup for RDS
- Not creating CacheSubnetGroup for ElastiCache
- Not distributing across multiple AZs

### No Conditional Logic
- Not handling default VPC vs custom VPC scenarios
- Missing conditions for optional parameters

## 10. Parameter and Output Errors

### Missing Parameters
- No EnvironmentSuffix parameter
- Missing database configuration parameters (DBInstanceClass, storage)
- No cache node type parameter

### Poor Parameter Validation
```yaml
# WRONG - No validation
EnvironmentSuffix:
  Type: String
  # Missing: AllowedPattern, ConstraintDescription
```

### Inadequate Outputs
- Not exporting endpoint addresses
- Missing port outputs
- No ARN exports for cross-stack references
- Not using `!Sub '${AWS::StackName}-OutputName'` pattern

## 11. IAM Permission Errors

### Overly Broad Permissions
```yaml
# WRONG - Too permissive
Action: '*'
Resource: '*'
```

### Missing Required Permissions
- Lambda rotation function missing Secrets Manager permissions
- Lambda missing RDS describe permissions
- Missing VPC execution role for Lambda
- Not including managed policies (AWSLambdaBasicExecutionRole)

## 12. Backup and Recovery Gaps

### Insufficient Backup Retention
```yaml
# WRONG - Only 1 day
BackupRetentionPeriod: 1  # Should be 7 for production
```

### Missing Snapshot Configuration
- No SnapshotRetentionLimit for ElastiCache
- Missing CopyTagsToSnapshot for RDS
- No PreferredBackupWindow specified

## 13. FERPA Compliance Issues

### Missing Compliance Tags
```yaml
# WRONG - No compliance tagging
Tags:
  - Key: Name
    Value: !Sub 'rds-${EnvironmentSuffix}'
  # Missing: Compliance tag
```

### Insufficient Audit Logging
- Not enabling CloudWatch log exports
- Missing log retention policies
- No audit trail for credential access

## 14. Region Hardcoding

### Wrong Region References
```yaml
# WRONG - Hardcoded us-east-1
KmsKeyId: 'arn:aws:kms:us-east-1:123456789:key/abc'

# CORRECT - Dynamic region
KmsKeyId: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${RDSKMSKey}'
```

## 15. Resource Dependency Issues

### Missing DependsOn
```yaml
# WRONG - Rotation schedule created before Lambda
SecretRotationSchedule:
  Type: AWS::SecretsManager::RotationSchedule
  # Missing: DependsOn: SecretRotationLambda
```

### Circular Dependencies
- Security groups referencing each other incorrectly
- Resources with circular !Ref chains

## 16. PostgreSQL Specific Errors

### Wrong Engine Type
```yaml
# WRONG - Using MySQL instead of PostgreSQL
Engine: mysql
```

### Unsupported Version
```yaml
# WRONG - Very old or unsupported version
EngineVersion: '9.6'  # Use 15.5 or later
```

### Missing PostgreSQL Configuration
- Not enabling IAM authentication
- Missing proper character set/collation
- No log export for postgresql logs

## 17. Performance Optimization Misses

### Wrong Instance Classes
- Using burstable instances (t3/t2) for production without consideration
- Not providing options for r5 memory-optimized instances
- Undersized cache nodes for session management

### Storage Issues
- Using gp2 instead of gp3 (older, less performant)
- Insufficient allocated storage
- No storage autoscaling consideration

## 18. Cost Optimization Failures

### Expensive Resource Choices
- Using r5.2xlarge when t3.medium would suffice
- Over-provisioning storage
- Not using serverless options where appropriate

### Missing Cost Tags
- No cost allocation tags
- Missing Environment/Application tags for billing

## Platform Detection Failures

### Model Returns Wrong Platform Code
The most critical failure is generating code for the wrong IaC tool:

Correct CloudFormation YAML pattern:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyResource:
    Type: AWS::Service::ResourceType
    Properties:
      Name: !Sub 'resource-${EnvironmentSuffix}'
```

Common wrong patterns:
- Terraform: `resource "aws_db_instance" "main" {`
- CDK: `new rds.DatabaseInstance(this, 'DB', {`
- Pulumi: `const db = new aws.rds.Instance("db", {`