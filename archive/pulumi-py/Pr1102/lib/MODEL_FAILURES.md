# MODEL FAILURES - Common Issues in AWS Security Configuration

This document outlines common failures and differences from the ideal response when implementing AWS security configurations with Pulumi.

## Common Model Failures

### 1. IAM Least Privilege Violations

**Failure**: Using wildcard permissions (`"*"`) in IAM policies
```python
# ❌ INCORRECT - Too permissive
{
    "Effect": "Allow",
    "Action": ["ec2:*", "s3:*"],
    "Resource": "*"
}
```

**Ideal Response**: Specific resource ARNs with minimal permissions
```python
# ✅ CORRECT - Least privilege
{
    "Effect": "Allow",
    "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeImages"
    ],
    "Resource": [
        "arn:aws:ec2:us-east-1:*:instance/*",
        "arn:aws:ec2:us-east-1:*:image/*"
    ]
}
```

### 2. Missing S3 Security Controls

**Failure**: Not implementing all required S3 security features
```python
# ❌ INCORRECT - Missing security controls
aws.s3.Bucket(
    "my-bucket",
    bucket="my-bucket-name"
)
```

**Ideal Response**: Comprehensive S3 security implementation
```python
# ✅ CORRECT - Complete security controls
bucket = aws.s3.Bucket(
    "my-bucket",
    bucket="my-bucket-name",
    versioning=aws.s3.BucketVersioningArgs(enabled=True)
)

# Enable encryption
aws.s3.BucketServerSideEncryptionConfigurationV2(
    "bucket-encryption",
    bucket=bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=(
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            )
        )
    )]
)

# Block public access
aws.s3.BucketPublicAccessBlock(
    "bucket-pab",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)
```

### 3. Incomplete CloudTrail Configuration

**Failure**: Basic CloudTrail without security enhancements
```python
# ❌ INCORRECT - Missing security features
aws.cloudtrail.Trail(
    "my-trail",
    s3_bucket_name=bucket.id
)
```

**Ideal Response**: Enhanced CloudTrail with security controls
```python
# ✅ CORRECT - Complete CloudTrail security
cloudtrail_bucket = aws.s3.Bucket(
    "cloudtrail-bucket",
    bucket="my-cloudtrail-bucket",
    versioning=aws.s3.BucketVersioningArgs(enabled=True)
)

# Block public access on CloudTrail bucket
aws.s3.BucketPublicAccessBlock(
    "cloudtrail-bucket-pab",
    bucket=cloudtrail_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Enable encryption
aws.s3.BucketServerSideEncryptionConfigurationV2(
    "cloudtrail-bucket-encryption",
    bucket=cloudtrail_bucket.id,
    rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=(
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            )
        )
    )]
)

# CloudTrail with enhanced configuration
aws.cloudtrail.Trail(
    "my-trail",
    s3_bucket_name=cloudtrail_bucket.id,
    include_global_service_events=True,
    is_multi_region_trail=True,
    enable_logging=True,
    enable_log_file_validation=True,
    event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
        read_write_type="All",
        include_management_events=True,
        data_resources=[
            aws.cloudtrail.TrailEventSelectorDataResourceArgs(
                type="AWS::S3::Object",
                values=["arn:aws:s3:::*/*"],
            ),
            aws.cloudtrail.TrailEventSelectorDataResourceArgs(
                type="AWS::Lambda::Function",
                values=["arn:aws:lambda:*"],
            ),
        ],
    )]
)
```

### 4. Insufficient WAF Configuration

**Failure**: Basic WAF without comprehensive protection
```python
# ❌ INCORRECT - Minimal WAF configuration
aws.wafv2.WebAcl(
    "my-waf",
    scope="CLOUDFRONT",
    default_action=aws.wafv2.WebAclDefaultActionArgs(allow={})
)
```

**Ideal Response**: Comprehensive WAF with multiple protection layers
```python
# ✅ CORRECT - Complete WAF protection
aws.wafv2.WebAcl(
    "my-waf",
    scope="CLOUDFRONT",
    default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
    rules=[
        # Rate limiting
        aws.wafv2.WebAclRuleArgs(
            name="RateLimitRule",
            priority=1,
            action=aws.wafv2.WebAclRuleActionArgs(block={}),
            statement=aws.wafv2.WebAclRuleStatementArgs(
                rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                    limit=1000,
                    aggregate_key_type="IP",
                )
            ),
            visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name="RateLimitRule",
                sampled_requests_enabled=True,
            ),
        ),
        # Common rule set
        aws.wafv2.WebAclRuleArgs(
            name="AWSManagedRulesCommonRuleSet",
            priority=2,
            override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
            statement=aws.wafv2.WebAclRuleStatementArgs(
                managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    vendor_name="AWS",
                )
            ),
            visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name="CommonRuleSetMetric",
                sampled_requests_enabled=True,
            ),
        ),
        # SQL injection protection
        aws.wafv2.WebAclRuleArgs(
            name="AWSManagedRulesSQLiRuleSet",
            priority=3,
            override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
            statement=aws.wafv2.WebAclRuleStatementArgs(
                managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                    name="AWSManagedRulesSQLiRuleSet",
                    vendor_name="AWS",
                )
            ),
            visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name="SQLiRuleSetMetric",
                sampled_requests_enabled=True,
            ),
        ),
    ],
    visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
        cloudwatch_metrics_enabled=True,
        metric_name="MyWAF",
        sampled_requests_enabled=True,
    )
)
```

### 5. Missing RDS Backup Configuration

**Failure**: No backup retention enforcement
```python
# ❌ INCORRECT - No backup configuration
aws.rds.Instance(
    "my-db",
    engine="mysql",
    instance_class="db.t3.micro"
)
```

**Ideal Response**: RDS with backup retention and security
```python
# ✅ CORRECT - Complete RDS security
# Create parameter group for backup retention
rds_parameter_group = aws.rds.ParameterGroup(
    "rds-backup-params",
    name="my-rds-backup-params",
    family="mysql8.0",
    description="Parameter group for RDS backup retention",
    parameters=[
        aws.rds.ParameterGroupParameterArgs(
            name="innodb_file_per_table",
            value="1",
            apply_method="pending-reboot",
        )
    ]
)

# Create security group for RDS
rds_security_group = aws.ec2.SecurityGroup(
    "rds-sg",
    name="my-rds-sg",
    description="Security group for RDS instances with restricted access",
    vpc_id=vpc_id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/8"],
            description="MySQL access from VPC",
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic",
        )
    ]
)

# RDS instance with backup retention
aws.rds.Instance(
    "my-db",
    engine="mysql",
    instance_class="db.t3.micro",
    backup_retention_period=7,  # Minimum 7 days
    parameter_group_name=rds_parameter_group.name,
    vpc_security_group_ids=[rds_security_group.id]
)
```

### 6. Incomplete VPC Flow Logs

**Failure**: Missing VPC Flow Logs configuration
```python
# ❌ INCORRECT - No VPC Flow Logs
# Missing network traffic monitoring
```

**Ideal Response**: Complete VPC Flow Logs setup
```python
# ✅ CORRECT - Complete VPC Flow Logs
# Create IAM role for VPC Flow Logs
flow_logs_role = aws.iam.Role(
  "vpc-flow-logs-role",
  assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "sts:AssumeRole",
      "Effect": "Allow",
      "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
    }],
  })
)

# Create IAM policy with least privilege
flow_logs_policy = aws.iam.Policy(
  "vpc-flow-logs-policy",
  policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:*:log-group:/aws/vpc/flowlogs/*",
        "arn:aws:logs:us-east-1:*:log-group:/aws/vpc/flowlogs/*:log-stream:*"
      ],
    }],
  })
)

# Attach policy to role
aws.iam.RolePolicyAttachment(
  "vpc-flow-logs-policy-attachment",
  role=flow_logs_role.name,
  policy_arn=flow_logs_policy.arn
)

# Create CloudWatch Log Group
log_group = aws.cloudwatch.LogGroup(
  "vpc-flow-logs",
  name="/aws/vpc/flowlogs/vpc-12345678",
  retention_in_days=90
)

# Enable VPC Flow Logs
aws.ec2.FlowLog(
  "vpc-flow-log",
  iam_role_arn=flow_logs_role.arn,
  log_destination=log_group.arn,
  log_destination_type="cloud-watch-logs",
  resource_id="vpc-12345678",
  resource_type="VPC",
  traffic_type="ALL"
)
```

### 7. GuardDuty ebsVolumes Configuration Error

**Failure**: Incorrect ebsVolumes configuration shape
```python
# ❌ INCORRECT - Wrong shape for ebsVolumes
malware_protection=aws.guardduty.DetectorDatasourcesMalwareProtectionArgs(
  scan_ec2_instance_with_findings=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsArgs(
    ebs_volumes=True  # Wrong: expects object, not boolean
  )
)
```

**Ideal Response**: Correct ebsVolumes object configuration
```python
# ✅ CORRECT - Proper ebsVolumes object
malware_protection=aws.guardduty.DetectorDatasourcesMalwareProtectionArgs(
  scan_ec2_instance_with_findings=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsArgs(
    ebs_volumes=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsEbsVolumesArgs(
      auto_enable=True
    )
  )
)
```

### 8. S3 get_buckets() Compatibility Issue

**Failure**: Using incompatible S3 data source
```python
# ❌ INCORRECT - get_buckets() not available in all pulumi-aws versions
try:
  existing_buckets = aws.s3.get_buckets()
  bucket_names = existing_buckets.names
except Exception as e:
  pulumi.log.warn(f"Could not enumerate S3 buckets: {e}")
  return
```

**Ideal Response**: Config-driven bucket management
```python
# ✅ CORRECT - Config-driven approach
# Use config-driven bucket list instead of get_buckets()
bucket_names = []  # Empty list - buckets will be configured via config if needed
# Or use a config parameter:
# bucket_names = config.get_object('s3.bucketNames') or []
```

### 9. NACL and Flow Logs Warning Messages

**Failure**: Warning messages for expected behavior
```python
# ❌ INCORRECT - Warning for expected empty configuration
if not self.nacl_subnet_ids:
  pulumi.log.warn("No subnet IDs provided for NACL configuration")
  return

if not self.vpc_flow_log_vpc_ids:
  pulumi.log.warn("No VPC IDs provided for Flow Logs configuration")
  return
```

**Ideal Response**: Informational messages for expected behavior
```python
# ✅ CORRECT - Info messages for expected behavior
if not self.nacl_subnet_ids:
  pulumi.log.info("No subnet IDs provided for NACL configuration - skipping NACL setup")
  return

if not self.vpc_flow_log_vpc_ids:
  pulumi.log.info("No VPC IDs provided for Flow Logs configuration - skipping Flow Logs setup")
  return
```

### 7. Missing Environment Configuration

**Failure**: Hardcoded values without environment awareness
```python
# ❌ INCORRECT - Hardcoded values
aws.s3.Bucket(
    "bucket",
    bucket="my-bucket"
)
```

**Ideal Response**: Environment-aware configuration
```python
# ✅ CORRECT - Environment-aware configuration
def _get_resource_name(self, service: str, suffix: str = "") -> str:
    base_name = f"{self.env}-{service}-{self.region}"
    return f"{base_name}-{suffix}" if suffix else base_name

aws.s3.Bucket(
    "bucket",
    bucket=self._get_resource_name("my-bucket"),
    tags=self._apply_tags({"Purpose": "SecurityLogging"})
)
```

### 8. Insufficient Testing

**Failure**: No or minimal test coverage
```python
# ❌ INCORRECT - No tests
# Missing test files or minimal test coverage
```

**Ideal Response**: Comprehensive test coverage
```python
# ✅ CORRECT - Complete test coverage
class TestTapStackArgs:
    """Test cases for TapStackArgs configuration class."""
    
    @patch('lib.tap_stack.aws.get_region')
    def test_tap_stack_args_default_values(self, mock_get_region):
        """Test TapStackArgs with default values."""
        mock_region = MagicMock()
        mock_region.name = "us-east-1"
        mock_get_region.return_value = mock_region
        
        args = TapStackArgs()
        
        assert args.environment_suffix == 'dev'
        assert args.env == 'prod'
        assert args.ssh_allowed_cidrs == ['10.0.0.0/8']
        assert args.cloudtrail_enable_data_events is True
        assert args.waf_rate_limit == 1000
        assert args.guardduty_regions == ['us-east-1', 'us-west-2', 'eu-west-1']
        assert args.vpc_flow_log_retention_days == 90
        assert args.rds_backup_retention_days == 7
```

## Summary of Key Differences

1. **Least Privilege**: Ideal response uses specific resource ARNs, failures use wildcards
2. **Comprehensive Security**: Ideal response implements all security controls, failures miss key features
3. **Environment Awareness**: Ideal response is configurable, failures use hardcoded values
4. **Testing**: Ideal response has comprehensive tests, failures have minimal or no tests
5. **Documentation**: Ideal response is well-documented, failures lack proper documentation
6. **Error Handling**: Ideal response includes proper exception handling, failures may not
7. **Resource Dependencies**: Ideal response properly manages resource dependencies, failures may not
8. **Tagging**: Ideal response uses consistent tagging, failures may not implement tagging

## Recommendations

1. Always implement least privilege principles
2. Enable encryption on all applicable services
3. Implement comprehensive logging and monitoring
4. Use environment-aware configuration
5. Write comprehensive tests
6. Follow security best practices
7. Document all security controls
8. Implement proper error handling
9. Use consistent resource naming and tagging
10. Validate all configurations before deployment