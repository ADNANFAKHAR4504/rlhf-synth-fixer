# Model Failure Analysis - FastCart Order Processing Infrastructure

This document outlines intentional issues and common mistakes that would represent typical model failures when generating this infrastructure. These serve as training data to help improve model accuracy.

## Critical Failures (Would Block Deployment)

### 1. Wrong Platform/Language
**Issue**: Model generates code in wrong IaC platform or language
- Generates CDK TypeScript instead of Pulumi Python
- Uses Terraform HCL syntax
- Mixes platform syntax (e.g., Pulumi constructs with Terraform resources)

**Impact**: Complete deployment failure, wasted time

**Example**:
```python
# WRONG - CDK-style import
from aws_cdk import aws_ec2 as ec2

# CORRECT - Pulumi import
from pulumi_aws import ec2
```

### 2. Wrong Region Configuration
**Issue**: Deploys to wrong AWS region
- Hardcodes wrong region (us-east-1 instead of eu-central-1)
- Uses wrong availability zones (us-east-1a instead of eu-central-1a)
- Region mismatch in resource configuration

**Impact**: Resources in wrong region, compliance violation

**Example**:
```python
# WRONG
availability_zone="us-east-1a"

# CORRECT
availability_zone="eu-central-1a"
```

### 3. Missing Environment Suffix
**Issue**: Resources created without environment_suffix
- Hardcoded resource names without suffix
- Name collisions in CI/CD
- Cannot distinguish between environments

**Impact**: Resource conflicts, deployment failures

**Example**:
```python
# WRONG
name="fastcart-vpc"

# CORRECT
name=f"fastcart-vpc-{self.environment_suffix}"
```

### 4. Missing Required AWS Services
**Issue**: Omits services explicitly mentioned in requirements
- No Kinesis Data Stream
- Missing ElastiCache Redis cluster
- Forgets Secrets Manager
- Omits NAT Gateway

**Impact**: Incomplete solution, doesn't meet requirements

### 5. Encryption Not Enabled
**Issue**: Critical data stores without encryption
- RDS without `storage_encrypted=True`
- ElastiCache without at-rest encryption
- Kinesis without KMS encryption
- CloudWatch logs without KMS key

**Impact**: Security compliance failure

**Example**:
```python
# WRONG
self.rds_instance = rds.Instance(
    ...,
    storage_encrypted=False  # Security violation
)

# CORRECT
self.rds_instance = rds.Instance(
    ...,
    storage_encrypted=True,
    kms_key_id=self.kms_key.arn
)
```

## High-Severity Issues (Would Cause Functional Problems)

### 6. ECS Tasks in Public Subnets
**Issue**: Places ECS tasks in public subnets with public IPs
- Violates security requirement
- Exposes containers to internet

**Impact**: Security vulnerability, requirement violation

**Example**:
```python
# WRONG
network_configuration=ecs.ServiceNetworkConfigurationArgs(
    assign_public_ip=True,
    subnets=[self.public_subnet_1.id]
)

# CORRECT
network_configuration=ecs.ServiceNetworkConfigurationArgs(
    assign_public_ip=False,
    subnets=[self.private_subnet_1.id, self.private_subnet_2.id]
)
```

### 7. Missing NAT Gateway
**Issue**: Private subnets without NAT Gateway
- ECS tasks cannot reach internet
- Cannot pull container images from ECR
- Cannot access AWS services

**Impact**: Deployment succeeds but tasks fail to start

### 8. Secrets Not Using Rotation
**Issue**: Secrets Manager without rotation policy
- Missing `SecretRotation` resource
- No `rotation_rules` configuration
- Violates 30-day rotation requirement

**Impact**: Compliance violation

**Example**:
```python
# WRONG - No rotation configured
self.db_password_secret = secretsmanager.Secret(...)
# Missing: SecretRotation resource

# CORRECT
self.db_secret_rotation = secretsmanager.SecretRotation(
    ...,
    rotation_rules=secretsmanager.SecretRotationRotationRulesArgs(
        automatically_after_days=30
    )
)
```

### 9. ElastiCache Missing Transit Encryption
**Issue**: Redis cluster without in-transit encryption
- `transit_encryption_enabled=False`
- Missing `auth_token`
- Violates requirement

**Impact**: Security compliance failure

**Example**:
```python
# WRONG
self.redis_cluster = elasticache.ReplicationGroup(
    ...,
    transit_encryption_enabled=False
)

# CORRECT
self.redis_cluster = elasticache.ReplicationGroup(
    ...,
    transit_encryption_enabled=True,
    auth_token_enabled=True,
    auth_token="SecureToken123..."
)
```

### 10. Incorrect Security Group Rules
**Issue**: Overly permissive or incorrect security groups
- RDS allows 0.0.0.0/0 instead of ECS SG only
- Redis allows all VPC traffic instead of ECS only
- Missing ingress rules

**Impact**: Security vulnerability

**Example**:
```python
# WRONG
ingress=[
    ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=5432,
        to_port=5432,
        cidr_blocks=["0.0.0.0/0"]  # Too permissive
    )
]

# CORRECT
ingress=[
    ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=5432,
        to_port=5432,
        security_groups=[self.ecs_sg.id]  # Only ECS
    )
]
```

## Medium-Severity Issues (Would Cause Operational Problems)

### 11. Missing CloudWatch Alarms
**Issue**: No monitoring configured
- No Kinesis iterator age alarm
- No RDS CPU alarm
- No alerting setup

**Impact**: Cannot detect issues proactively

### 12. Incorrect IAM Policies
**Issue**: IAM roles missing necessary permissions
- ECS Task Role cannot read from Kinesis
- Cannot access Secrets Manager
- Overly restrictive policies

**Impact**: Runtime permission errors

**Example**:
```python
# WRONG - Missing Kinesis permissions
policy={
    "Statement": [{
        "Action": ["logs:PutLogEvents"],  # Missing kinesis:*
        "Resource": "*"
    }]
}

# CORRECT
policy={
    "Statement": [
        {
            "Action": [
                "kinesis:GetRecords",
                "kinesis:GetShardIterator",
                "kinesis:DescribeStream"
            ],
            "Resource": kinesis_stream_arn
        }
    ]
}
```

### 13. Missing VPC Endpoints
**Issue**: No consideration for cost optimization
- Forces all traffic through NAT Gateway
- Higher data transfer costs
- Not using VPC endpoints for S3, DynamoDB, ECR

**Impact**: Higher AWS costs

### 14. Hardcoded Credentials
**Issue**: Passwords in plain text instead of generated securely
- Database password visible in code
- Redis auth token hardcoded
- Secrets not properly managed

**Impact**: Security vulnerability, poor practice

### 15. Missing Resource Tagging
**Issue**: Inconsistent or missing tags
- No Environment tag
- No Application tag
- Cannot track costs or manage resources

**Impact**: Poor operational management

## Low-Severity Issues (Would Cause Minor Problems)

### 16. Incorrect Output Types
**Issue**: Outputs not properly typed or formatted
- Missing outputs for critical resources
- Wrong output format
- Not using `Output.from_input()` correctly

**Impact**: Integration tests fail, consumers cannot use outputs

### 17. Missing Log Retention
**Issue**: CloudWatch logs without retention policy
- Logs retained indefinitely
- Unnecessary costs
- No automatic cleanup

**Impact**: Increased costs over time

### 18. Incorrect Dependency Management
**Issue**: Missing `depends_on` or wrong resource order
- NAT Gateway created before IGW
- Private routes before NAT Gateway
- Race conditions

**Impact**: Intermittent deployment failures

### 19. ECS Task Size Mismatch
**Issue**: CPU/Memory configuration issues
- Too little memory for workload
- CPU/memory ratio incorrect
- Fargate limits not respected

**Impact**: Task failures, performance issues

### 20. Missing Container Image
**Issue**: ECR repository empty or wrong image reference
- Task definition references non-existent image
- Latest tag but no image pushed
- Wrong registry URL

**Impact**: ECS service fails to start tasks

## Testing Failures

### 21. No Unit Tests
**Issue**: Missing or incomplete unit tests
- No test file created
- Tests don't use Pulumi mocks
- Coverage below 90%

**Impact**: Cannot validate infrastructure

### 22. Integration Tests Don't Use Outputs
**Issue**: Integration tests hardcode values instead of reading flat-outputs.json
- Cannot test actual deployment
- Tests pass but infrastructure broken

**Impact**: False confidence in deployment

### 23. Import Errors in Tests
**Issue**: Test files have wrong imports
- Import from `aws_cdk` instead of `pulumi_aws`
- Missing mock setup
- Wrong test framework

**Impact**: Tests fail to run

## Documentation Failures

### 24. Wrong Platform Documented
**Issue**: Documentation claims wrong platform
- Says "Terraform" instead of "Pulumi"
- Shows wrong code examples
- Incorrect deployment commands

**Impact**: User confusion, wrong expectations

### 25. Missing PROMPT.md Platform Statement
**Issue**: PROMPT.md doesn't explicitly state platform and language
- No bold statement: **Pulumi with Python**
- Ambiguous platform requirements
- Missing from opening paragraphs

**Impact**: Training quality reduced, unclear requirements

## Summary of Training Opportunities

These failures represent common patterns where models need improvement:

1. **Platform/Language Compliance** - Most critical issue
2. **Security Configuration** - Encryption, network isolation
3. **Resource Naming** - Environment suffix consistency
4. **Service Completeness** - Including all required services
5. **IAM Permissions** - Correct policy configuration
6. **Testing** - Comprehensive test coverage
7. **Documentation** - Clear platform statements
8. **Region Compliance** - Correct regional configuration

Each of these areas provides valuable training data to improve model accuracy and reduce deployment failures.
