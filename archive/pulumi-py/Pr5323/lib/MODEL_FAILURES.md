# Model Failures and Fixes

## 1. Region/provider scoping not enforced

**Problem in Model Response:**
The model created providers but modules never used them properly:

```python
# In __main__.py (lines 15-20)
providers = {}
for region in regions:
    providers[region] = aws.Provider(f"aws-{normalize_region(region)}", region=region)

# In modules (lines 150-160)
__opts__=pulumi.ResourceOptions(region=self.region)  # INVALID - region is not a valid ResourceOptions parameter
```

**Our Fix:**
Created AWSProviderManager to ensure consistent provider usage:

```python
# lib/infrastructure/aws_provider.py
class AWSProviderManager:
    def __init__(self, config: InfraConfig):
        self.config = config
        self._provider = None

    def get_provider(self) -> aws.Provider:
        if self._provider is None:
            provider_name = f"aws-provider-{self.config.environment_suffix}"
            self._provider = aws.Provider(
                provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(tags=self.config.get_common_tags())
            )
        return self._provider

# All resources use: opts=ResourceOptions(provider=self.provider_manager.get_provider())
```

## 2. Mixed use of pulumi.Output inside JSON policies (invalid serialization)

**Problem in Model Response:**
Policies embedded Output values directly in dicts before JSON serialization:

```python
# Lines 450-470
policy_document = {
    "Version": "2012-10-17",
    "Statement": [{
        "Resource": bucket.arn  # This is an Output[str], not a string!
    }]
}
policy = json.dumps(policy_document)  # FAILS - cannot serialize Output
```

**Our Fix:**
Used Output.apply() and pulumi.Output.json_dumps() for proper serialization:

```python
# lib/infrastructure/iam.py (lines 164-184)
policy_document = Output.all(*bucket_arns).apply(
    lambda arns: pulumi.Output.json_dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject"],
            "Resource": [arn for arn in arns] + [f"{arn}/*" for arn in arns]
        }]
    })
)
```

## 3. IAM least-privilege requirement violated

**Problem in Model Response:**
Policies used broad Resource wildcards:

```python
# Lines 500-520
{
    "Effect": "Allow",
    "Action": ["s3:*"],
    "Resource": "*"  # TOO BROAD - violates least-privilege
}
{
    "Effect": "Allow",
    "Action": ["cloudwatch:*"],
    "Resource": "*"  # TOO BROAD
}
```

**Our Fix:**
Scoped all policies to specific resources and actions:

```python
# lib/infrastructure/iam.py (lines 107-137)
{
    "Effect": "Allow",
    "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
    ],
    "Resource": [
        f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*",
        f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*:log-stream:*"
    ]
},
{
    "Effect": "Allow",
    "Action": ["cloudwatch:PutMetricData"],
    "Resource": "*"  # CloudWatch metrics require *, but scoped by actions
}
```

## 4. Invalid and incorrect code

**Problem in Model Response:**
Code had syntax errors and invalid API usage:

```python
# Lines 300-320
vpc = aws.ec2.Vpc(
    opts=ResourceOptions(region=region)  # INVALID - region not a valid parameter
)

bucket = aws.s3.BucketV2(  # DEPRECATED API
    bucket_name,
    versioning={"enabled": True}  # INVALID - wrong parameter structure
)
```

**Our Fix:**
Used correct APIs and parameter structures:

```python
# lib/infrastructure/networking.py
vpc = aws.ec2.Vpc(
    vpc_name,
    cidr_block=self.config.vpc_cidr,
    enable_dns_hostnames=True,
    opts=ResourceOptions(
        provider=self.provider_manager.get_provider(),  # CORRECT
        parent=self.parent
    )
)

# lib/infrastructure/storage.py - Used current S3 APIs (not V2)
bucket = aws.s3.Bucket(bucket_name, opts=opts)
versioning = aws.s3.BucketVersioning(
    f"{bucket_name}-versioning",
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
        status="Enabled"
    ),
    opts=opts
)
```

## 5. S3 encryption / policy ambiguities

**Problem in Model Response:**
Inconsistent encryption configuration:

```python
# Lines 600-620
bucket = aws.s3.Bucket(
    bucket_name,
    server_side_encryption_configuration={
        "rule": {
            "apply_server_side_encryption_by_default": {
                "sse_algorithm": "AES256"  # S3-managed, not KMS
            }
        }
    }
)
# No bucket policy for access control
```

**Our Fix:**
Consistent server-side encryption with proper configuration:

```python
# lib/infrastructure/storage.py (lines 50-65)
encryption = aws.s3.BucketServerSideEncryptionConfiguration(
    f"{bucket_name}-encryption",
    bucket=bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True
        )
    ],
    opts=opts
)

# Added public access block
public_access_block = aws.s3.BucketPublicAccessBlock(
    f"{bucket_name}-public-access-block",
    bucket=bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=opts
)
```

## 6. Monitoring alarms created without actionable notifications

**Problem in Model Response:**
Alarms had no actions configured:

```python
# Lines 800-820
alarm = aws.cloudwatch.MetricAlarm(
    "cpu-high",
    alarm_actions=[],  # EMPTY - no notifications
    ok_actions=[]
)
# No SNS topic created
```

**Our Fix:**
Created SNS topic and wired it to alarms:

```python
# lib/infrastructure/monitoring.py (lines 47-58)
self.alarm_topic = aws.sns.Topic(
    topic_name,
    name=topic_name,
    tags=self.config.get_tags_for_resource('SNS-Topic'),
    opts=opts
)

# Lines 80-95 - Alarms with SNS actions
self.cpu_high_alarm = aws.cloudwatch.MetricAlarm(
    alarm_name,
    alarm_actions=[self.alarm_topic.arn],  # SNS topic ARN
    ok_actions=[self.alarm_topic.arn],
    # ... other configuration
)
```

## 7. ASG / ALB linkage and health checks fragile

**Problem in Model Response:**
ASG created without proper health check configuration:

```python
# Lines 700-720
asg = aws.autoscaling.Group(
    "asg",
    target_group_arns=[target_group.arn],  # ALB target group
    health_check_type="ELB",
    # Missing health_check_grace_period
    # Missing proper dependencies
)
```

**Our Fix:**
Removed ALB (not in requirements), configured EC2 health checks properly:

```python
# lib/infrastructure/compute.py (lines 220-245)
asg = aws.autoscaling.Group(
    asg_name,
    min_size=self.config.asg_min_size,
    max_size=self.config.asg_max_size,
    desired_capacity=self.config.asg_desired_capacity,
    health_check_type=self.config.health_check_type,  # EC2
    health_check_grace_period=self.config.health_check_grace_period,
    vpc_zone_identifiers=self.private_subnet_ids,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    opts=ResourceOptions(
        provider=self.provider_manager.get_provider(),
        parent=self.parent,
        depends_on=[self.instance_profile]  # Proper dependency
    )
)
```

## 8. VPC Flow Logs / NACLs / traffic controls missing

**Problem in Model Response:**
No VPC Flow Logs or Network ACLs implemented:

```python
# Lines 200-250 - Only basic VPC resources
vpc = aws.ec2.Vpc(...)
subnets = [aws.ec2.Subnet(...)]
# Missing: Flow Logs, NACLs
```

**Our Fix:**
Implemented VPC Flow Logs and Network ACLs:

```python
# lib/infrastructure/networking.py (lines 180-220)
# VPC Flow Logs
flow_log_group = aws.cloudwatch.LogGroup(
    log_group_name,
    name=log_group_name,
    retention_in_days=self.config.log_retention_days,
    opts=opts
)

flow_log_role = aws.iam.Role(
    role_name,
    assume_role_policy=assume_role_policy,
    opts=opts
)

flow_log = aws.ec2.FlowLog(
    flow_log_name,
    vpc_id=self.vpc.id,
    traffic_type="ALL",
    log_destination_type="cloud-watch-logs",
    log_destination=flow_log_group.arn,
    iam_role_arn=flow_log_role.arn,
    opts=opts
)

# Network ACLs (lines 250-300)
public_nacl = aws.ec2.NetworkAcl(
    public_nacl_name,
    vpc_id=self.vpc.id,
    subnet_ids=[subnet.id for subnet in self.public_subnets],
    opts=opts
)

# Ingress/Egress rules for public and private NACLs
```

## 9. Modularity vs. provider/parameter passing mismatch

**Problem in Model Response:**
Modules relied on global config instead of accepting parameters:

```python
# Lines 100-150
class VpcModule:
    def __init__(self):
        self.region = config.region  # Global config
        self.tags = config.tags      # Global config
        # No provider parameter
```

**Our Fix:**
Modules accept config and provider_manager as parameters:

```python
# lib/infrastructure/networking.py (lines 15-30)
class NetworkingStack:
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        # All resources use self.provider_manager.get_provider()
```

## 10. No automated validation or post-deploy checks

**Problem in Model Response:**
No validation or testing infrastructure:

```python
# No test files
# No validation logic
# No integration tests
```

**Our Fix:**
Created comprehensive test suite:

```
tests/
  unit/
    test_tap_stack.py - 27 unit tests, 98.58% coverage
  integration/
    test_tap_stack.py - 11 integration tests
      - 5 service-level tests (single service actions)
      - 3 cross-service tests (2 services interacting)
      - 3 E2E tests (3-4 services, single trigger, complete flows)
```

Integration tests validate:

- VPC networking with NAT Gateway internet access
- EC2 instances in private subnets with SSM access
- IAM role permissions for S3, CloudWatch, EC2 API calls
- S3 versioning and encryption
- CloudWatch alarms monitoring ASG
- SNS topic configuration for notifications
- Complete E2E flows with single trigger and multi-service verification
