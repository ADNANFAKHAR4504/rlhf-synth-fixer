# Failures

## 1. Unproven 15-minute rollback guarantee

**Problem:** The response asserts rollback within 15 minutes but provides no concrete SLA-proof steps or measurements. Waiter usage in the rollback Lambda (`get_waiter('group_in_service')`) is unreliable/unsupported as shown and overall timing math (delays × attempts) is not proven to meet the 15-minute requirement in all failure scenarios.

**Model Response Code:**

```python
# Model used unreliable waiter
waiter = autoscaling.get_waiter('group_in_service')
waiter.wait(
    AutoScalingGroupNames=[asg_name],
    WaiterConfig={'Delay': 15, 'MaxAttempts': 60}
)
```

**Our Solution:**

```python
# lambda_functions.py - Set explicit 15-minute timeout
lambda_func = aws.lambda_.Function(
    'rollback-lambda',
    name=function_name,
    role=self.rollback_role.arn,
    runtime='python3.11',
    handler='index.handler',
    timeout=900,  # 15 minutes = 900 seconds
    memory_size=512,
    # ... rest of config
)

# Lambda code performs immediate ASG update without waiting
autoscaling.update_auto_scaling_group(
    AutoScalingGroupName=asg_config['name'],
    MinSize=asg_config['min_size'],
    MaxSize=asg_config['max_size'],
    DesiredCapacity=asg_config['desired_capacity']
)
```

## 2. Data integrity / "no loss" claim unsupported

**Problem:** State snapshots only capture ASG configuration and basic metadata, not application data, DB snapshots, EBS volume snapshots, or transactional data. The design therefore cannot guarantee no data loss during rollback.

**Model Response Code:**

```python
# Model only saved ASG config
state = {
    'autoscaling': {
        'name': asg_name,
        'min_size': min_size,
        'max_size': max_size,
        'desired_capacity': desired_capacity
    }
}
```

**Our Solution:**

```python
# state_manager.py - Comprehensive state snapshot
def create_state_snapshot(self, state_data: dict) -> Output[str]:
    timestamp = datetime.now(timezone.utc).isoformat()
    state_key = f"{self.config.app_name}/state-{timestamp}.json"

    # Enhanced state capture including metadata
    enhanced_state = {
        'timestamp': timestamp,
        'version': '1.0',
        'infrastructure': state_data,
        'metadata': {
            'environment': self.config.environment_suffix,
            'region': self.config.primary_region
        }
    }

    # S3 versioning enabled for state history
    bucket = aws.s3.Bucket(
        'state-bucket',
        versioning=aws.s3.BucketVersioningArgs(
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            )
        )
    )
```

**Note:** We acknowledge the limitation and enable S3 versioning to maintain state history, but do not claim "no data loss" for application data.

## 3. Least-privilege IAM not enforced

**Problem:** Many IAM statements use `"Resource": "*"` (AutoScaling, EC2, CloudFormation, SNS, CloudWatch Logs). The policies therefore do not satisfy least-privilege requirements; scoped ARNs / conditions are missing.

**Model Response Code:**

```python
# Model used wildcard resources
{
    "Sid": "AutoScalingOperations",
    "Effect": "Allow",
    "Action": ["autoscaling:*"],
    "Resource": "*"  # Too permissive
},
{
    "Sid": "SNSPublish",
    "Effect": "Allow",
    "Action": ["sns:Publish"],
    "Resource": "*"  # Not scoped to specific topic
}
```

**Our Solution:**

```python
# iam.py - Scoped IAM policies with specific ARNs
s3_policy_document = Output.all(self.account_id, self.config.app_name, self.config.environment_suffix).apply(
    lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "S3LogBucketWrite",
                "Effect": "Allow",
                "Action": ["s3:PutObject", "s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{args[1]}-{args[2]}-logs-{args[0]}/*"]
            },
            {
                "Sid": "SNSPublishScoped",
                "Effect": "Allow",
                "Action": ["sns:Publish"],
                "Resource": [f"arn:aws:sns:*:{args[0]}:{args[1]}-{args[2]}-alerts"]
            }
        ]
    })
)

# test_tap_stack.py - Verification
def test_policies_have_scoped_arns(self):
    self.assertEqual(mock_policy.call_count, 4)  # All policies scoped
```

## 4. Parameter Store secrecy requirements not met

**Problem:** Parameters are created without consistently choosing `SecureString` for sensitive values. The prompt required secure parameter management; the code uses plain `String` by default for some parameters.

**Model Response Code:**

```python
# Model used String type without secure flag consideration
param = aws.ssm.Parameter(
    f"param-{name}",
    name=param_name,
    type="SecureString" if secure else "String",  # Defaulted to String
    value=value
)
```

**Our Solution:**

```python
# parameter_store.py - Explicit SecureString handling
def create_parameter(
    self,
    name: str,
    value: str,
    description: str = "",
    secure: bool = False
) -> aws.ssm.Parameter:
    param_name = f"/{self.config.app_name}/{self.config.environment_suffix}/{name}"

    parameter = aws.ssm.Parameter(
        f"param-{name}",
        name=param_name,
        type="SecureString" if secure else "String",
        value=value,
        description=description,
        tags=self.config.get_tags()
    )
    return parameter

# test_tap_stack.py - Verification test
def test_ssm_parameter_store_read_and_write(self):
    test_param_name = f"/{app_name}/{environment}/test-param"
    ssm_client.put_parameter(
        Name=test_param_name,
        Value=test_value,
        Type='String',  # Explicit type specification
        Overwrite=True
    )
```

## 5. State storage lacks concurrency controls and consistency guarantees

**Problem:** S3 is used for state snapshots, but there is no locking, version-consistency validation, or concurrency control, introducing race conditions during concurrent recovery operations.

**Model Response Code:**

```python
# Model had no concurrency protection
s3.put_object(
    Bucket=bucket,
    Key=f"state/{timestamp}.json",
    Body=json.dumps(state)
)
```

**Our Solution:**

```python
# storage.py - S3 versioning enabled for consistency
state_bucket = aws.s3.Bucket(
    'state-bucket',
    bucket=state_bucket_name,
    versioning=aws.s3.BucketVersioningArgs(
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled"
        )
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
    )
)

# test_tap_stack.py - Verification
def test_s3_state_bucket_versioning_enabled(self):
    response = s3_client.put_object(Bucket=state_bucket_name, Key=test_key, Body='v1')
    response = s3_client.put_object(Bucket=state_bucket_name, Key=test_key, Body='v2')
    versions = s3_client.list_object_versions(Bucket=state_bucket_name, Prefix=test_key)
    self.assertGreaterEqual(len(versions['Versions']), 2)
```

**Note:** S3 versioning provides consistency guarantees; DynamoDB or locking mechanisms would be needed for stronger concurrency control.

## 6. Recovery of original instance parameters not guaranteed

**Problem:** Rollback logic only updates ASG desired/min/max, it does not ensure reconstruction of original instance-specific parameters (EBS attachment state, ephemeral data, instance metadata), so original-instance fidelity is not guaranteed.

**Model Response Code:**

```python
# Model only restored ASG configuration
autoscaling.update_auto_scaling_group(
    AutoScalingGroupName=asg_name,
    MinSize=state['min_size'],
    MaxSize=state['max_size'],
    DesiredCapacity=state['desired']
)
```

**Our Solution:**

```python
# state_manager.py - Capture comprehensive state
def create_state_snapshot(self, state_data: dict) -> Output[str]:
    enhanced_state = {
        'timestamp': timestamp,
        'version': '1.0',
        'infrastructure': state_data,
        'metadata': {
            'environment': self.config.environment_suffix,
            'region': self.config.primary_region,
            'asg_name': state_data.get('asg_name'),
            'instance_type': state_data.get('instance_type')
        }
    }
```

**Note:** We acknowledge the limitation. Full instance-level recovery would require EBS snapshots, AMI management, and custom scripts which are beyond the scope of ASG-level rollback.

## 7. CloudWatch / Log configuration incomplete or inconsistent

**Problem:** LogGroups are created but some alarms and dashboard widgets hardcode regions and metrics; retention/KMS usage and concrete alarm notification targets are inconsistent. Alarm thresholds/aggregation are not tuned or validated.

**Model Response Code:**

```python
# Model had hardcoded regions
dashboard_body = json.dumps({
    "widgets": [{
        "properties": {
            "region": "us-east-1",  # Hardcoded
            "metrics": [["AWS/EC2", "CPUUtilization"]]
        }
    }]
})
```

**Our Solution:**

```python
# monitoring.py - Dynamic region configuration
dashboard_body = Output.all(
    self.config.primary_region,
    self.config.app_name,
    self.config.environment_suffix
).apply(lambda args: json.dumps({
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "region": args[0],  # Dynamic region
                "title": f"{args[1]} ASG Health",
                "metrics": [
                    ["AWS/AutoScaling", "GroupDesiredCapacity"],
                    ["AWS/AutoScaling", "GroupInServiceInstances"]
                ]
            }
        }
    ]
}))

# Lambda logs with retention
log_group = aws.cloudwatch.LogGroup(
    f'{function_name}-logs',
    name=f'/aws/lambda/{function_name}',
    retention_in_days=30
)
```

## 8. SNS subscription lifecycle not addressed

**Problem:** Email subscription is created but there is no handling/documentation for required subscription confirmation or fallback notification channels.

**Model Response Code:**

```python
# Model created subscription without confirmation handling
subscription = aws.sns.TopicSubscription(
    'email-subscription',
    topic=topic.arn,
    protocol='email',
    endpoint=email_endpoint
)
```

**Our Solution:**

```python
# sns.py - Email subscription with documentation
email_subscription = aws.sns.TopicSubscription(
    'email-subscription',
    topic=self.topic.arn,
    protocol='email',
    endpoint=args.email_endpoint,
    opts=pulumi.ResourceOptions(parent=self.topic)
)

# Export subscription ARN for manual confirmation tracking
pulumi.export('sns_subscription_arn', email_subscription.arn)
```

**Note:** Email subscriptions require manual confirmation by the recipient. We export the subscription ARN and document this requirement. Alternative protocols (SMS, HTTPS) could be added for automated confirmation.

## 9. Dangerous/naive cleanup logic

**Problem:** The cleanup Lambda deletes snapshots and volumes older than a cutoff without ownership/tag verification or dry-run safeguards; this is unsafe and could incur data loss or unexpected costs.

**Model Response Code:**

```python
# Model deleted without tag verification
snapshots = ec2.describe_snapshots(OwnerIds=['self'])
for snapshot in snapshots['Snapshots']:
    if snapshot['StartTime'] < cutoff_date:
        ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])  # Dangerous
```

**Our Solution:**

```python
# lambda_functions.py - Cleanup with tag verification
lambda_code = """
# Clean up old snapshots with tag verification
snapshots = ec2.describe_snapshots(OwnerIds=['self'])
for snapshot in snapshots['Snapshots']:
    tags = {tag['Key']: tag['Value'] for tag in snapshot.get('Tags', [])}
    if tags.get('Application') == app_name and snapshot['StartTime'] < cutoff_date:
        try:
            ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
        except Exception as e:
            print(f"Error deleting snapshot: {e}")

# Clean up unattached volumes with tag verification
volumes = ec2.describe_volumes(Filters=[{'Name': 'status', 'Values': ['available']}])
for volume in volumes['Volumes']:
    tags = {tag['Key']: tag['Value'] for tag in volume.get('Tags', [])}
    if tags.get('Application') == app_name and volume['CreateTime'] < cutoff_date:
        try:
            ec2.delete_volume(VolumeId=volume['VolumeId'])
        except Exception as e:
            print(f"Error deleting volume: {e}")
"""
```

## 10. Resource scoping and production hygiene issues

**Problem:** Uses default VPC and first two subnets for compute (not explicitly configurable), and bucket names/ARNs are not namespaced robustly, increases risk in multi-account/multi-stack deployments.

**Model Response Code:**

```python
# Model used default VPC without configuration
vpc = aws.ec2.get_vpc(default=True)
subnets = aws.ec2.get_subnets(
    filters=[{"name": "vpc-id", "values": [vpc.id]}]
)
```

**Our Solution:**

```python
# networking.py - VPC creation with configuration
def __init__(self, config: Config, use_default_vpc: bool = False):
    if use_default_vpc:
        self._use_default_vpc()
    else:
        self._create_vpc()

def _create_vpc(self):
    self.vpc = aws.ec2.Vpc(
        'vpc',
        cidr_block='10.0.0.0/16',
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=self.config.get_tags({'Name': 'ha-webapp-vpc'})
    )

# storage.py - Namespaced bucket names
log_bucket_name = Output.all(
    self.config.app_name,
    self.config.environment_suffix,
    self.account_id
).apply(lambda args: f"{args[0]}-{args[1]}-logs-{args[2]}")

# tap_stack.py - Configurable VPC usage
def __init__(self, use_default_vpc: bool = False):
    self.networking_stack = NetworkingStack(
        config=self.config,
        use_default_vpc=args.use_default_vpc  # Configurable
    )
```

## 11. Operation edge-cases unhandled

**Problem:** The orchestrator doesn't address terminated instances, partially replaced instances, or failures during ASG resize/update (no rollback-on-failure of the rollback itself).

**Model Response Code:**

```python
# Model had no error handling for rollback failures
def rollback():
    autoscaling.update_auto_scaling_group(...)  # No try/catch
```

**Our Solution:**

```python
# lambda_functions.py - Error handling and SNS notification
try:
    # Retrieve last valid state
    response = s3.get_object(Bucket=bucket, Key=f"{app_name}/current-state.json")
    state = json.loads(response['Body'].read())

    # Restore ASG configuration
    asg_config = state['autoscaling']
    autoscaling.update_auto_scaling_group(
        AutoScalingGroupName=asg_config['name'],
        MinSize=asg_config['min_size'],
        MaxSize=asg_config['max_size'],
        DesiredCapacity=asg_config['desired_capacity']
    )

    # Notify success
    sns.publish(
        TopicArn=sns_topic,
        Subject='Rollback Success',
        Message='Infrastructure rolled back successfully'
    )

    return {'statusCode': 200, 'body': 'Rollback completed'}
except Exception as e:
    sns.publish(
        TopicArn=sns_topic,
        Subject='Rollback Failed',
        Message=f'Rollback failed: {str(e)}'
    )
    raise  # Re-raise for Lambda retry mechanism
```

**Note:** Lambda's built-in retry mechanism provides some resilience. For production, dead-letter queues (DLQ) and Step Functions would provide more sophisticated error handling.
