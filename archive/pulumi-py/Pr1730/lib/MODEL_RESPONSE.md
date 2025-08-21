```python
# Commands to run this stack:
# pulumi config set aws:region us-east-1
# pulumi config set tap:environment production
# pulumi config set tap:project-name tap-system
# pulumi config set tap:notification-email your-email@company.com
# pulumi config set tap:kms-key-id --secret arn:aws:kms:region:account:key/key-id (optional)
# pulumi preview
# pulumi up

import pulumi
import pulumi_aws as aws
from typing import Dict, Any

# Configuration
config = pulumi.Config()
environment = config.require("environment")
project_name = config.require("project-name")
notification_email = config.require("notification-email")
kms_key_id = config.get("kms-key-id")  # Optional KMS key for S3 encryption

# Define regions for multi-region deployment
regions = ["us-east-1", "us-west-2"]

# Common tags for all resources
common_tags = {
    "Environment": "Production",
    "Project": project_name,
    "ManagedBy": "Pulumi",
    "Owner": "DevOps"
}

def create_s3_bucket(region: str, tags: Dict[str, str]) -> aws.s3.Bucket:
    """
    Create an S3 bucket with versioning and encryption enabled.

    Args:
        region: AWS region for the bucket
        tags: Resource tags to apply

    Returns:
        S3 bucket resource
    """
    # Create S3 bucket with region-specific naming
    bucket = aws.s3.Bucket(
        f"{project_name}-{environment}-storage-{region}",
        bucket=f"{project_name}-{environment}-storage-{region}",
        region=region,
        tags=tags,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Enable versioning
    aws.s3.BucketVersioning(
        f"{project_name}-{environment}-versioning-{region}",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Configure server-side encryption
    encryption_config = aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256" if not kms_key_id else "aws:kms",
                    kms_master_key_id=kms_key_id if kms_key_id else None
                ),
                bucket_key_enabled=True if kms_key_id else None
            )
        ]
    )

    aws.s3.BucketServerSideEncryptionConfiguration(
        f"{project_name}-{environment}-encryption-{region}",
        bucket=bucket.id,
        rules=encryption_config.rules,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
        f"{project_name}-{environment}-public-access-block-{region}",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    return bucket

def create_iam_roles(tags: Dict[str, str]) -> Dict[str, aws.iam.Role]:
    """
    Create IAM roles with least privilege access.

    Args:
        tags: Resource tags to apply

    Returns:
        Dictionary of IAM roles
    """
    # S3 access role for applications
    s3_assume_role_policy = aws.iam.get_policy_document(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Service",
                        identifiers=["ec2.amazonaws.com"]
                    )
                ],
                actions=["sts:AssumeRole"]
            )
        ]
    )

    s3_access_role = aws.iam.Role(
        f"{project_name}-{environment}-s3-access-role",
        name=f"{project_name}-{environment}-s3-access-role",
        assume_role_policy=s3_assume_role_policy.json,
        tags=tags
    )

    # S3 policy for the role - least privilege access
    s3_policy_document = aws.iam.get_policy_document(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    f"arn:aws:s3:::{project_name}-{environment}-storage-*",
                    f"arn:aws:s3:::{project_name}-{environment}-storage-*/*"
                ]
            )
        ]
    )

    aws.iam.RolePolicy(
        f"{project_name}-{environment}-s3-policy",
        name=f"{project_name}-{environment}-s3-policy",
        role=s3_access_role.id,
        policy=s3_policy_document.json
    )

    # CloudWatch monitoring role
    cloudwatch_assume_role_policy = aws.iam.get_policy_document(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Service",
                        identifiers=["monitoring.amazonaws.com"]
                    )
                ],
                actions=["sts:AssumeRole"]
            )
        ]
    )

    cloudwatch_role = aws.iam.Role(
        f"{project_name}-{environment}-cloudwatch-role",
        name=f"{project_name}-{environment}-cloudwatch-role",
        assume_role_policy=cloudwatch_assume_role_policy.json,
        tags=tags
    )

    # Attach CloudWatch read-only policy
    aws.iam.RolePolicyAttachment(
        f"{project_name}-{environment}-cloudwatch-policy-attachment",
        role=cloudwatch_role.name,
        policy_arn="arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
    )

    return {
        "s3_access_role": s3_access_role,
        "cloudwatch_role": cloudwatch_role
    }

def create_sns_topic(region: str, tags: Dict[str, str]) -> aws.sns.Topic:
    """
    Create SNS topic for notifications.

    Args:
        region: AWS region for the topic
        tags: Resource tags to apply

    Returns:
        SNS topic resource
    """
    topic = aws.sns.Topic(
        f"{project_name}-{environment}-security-alerts-{region}",
        name=f"{project_name}-{environment}-security-alerts-{region}",
        tags=tags,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Subscribe email to the topic
    aws.sns.TopicSubscription(
        f"{project_name}-{environment}-email-subscription-{region}",
        topic_arn=topic.arn,
        protocol="email",
        endpoint=notification_email,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    return topic

def create_security_group_alarm(region: str, sns_topic: aws.sns.Topic, tags: Dict[str, str]) -> aws.cloudwatch.MetricAlarm:
    """
    Create CloudWatch alarm for security group changes.

    Args:
        region: AWS region for the alarm
        sns_topic: SNS topic for notifications
        tags: Resource tags to apply

    Returns:
        CloudWatch metric alarm
    """
    # Create CloudWatch log group for CloudTrail
    log_group = aws.cloudwatch.LogGroup(
        f"{project_name}-{environment}-cloudtrail-logs-{region}",
        name=f"/aws/cloudtrail/{project_name}-{environment}-{region}",
        retention_in_days=30,
        tags=tags,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Create metric filter for security group changes
    metric_filter = aws.cloudwatch.LogMetricFilter(
        f"{project_name}-{environment}-sg-changes-filter-{region}",
        name=f"{project_name}-{environment}-sg-changes-{region}",
        log_group_name=log_group.name,
        pattern='{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }',
        metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
            name=f"SecurityGroupChanges-{region}",
            namespace=f"{project_name}/{environment}",
            value="1",
            default_value="0"
        ),
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Create alarm for security group changes
    alarm = aws.cloudwatch.MetricAlarm(
        f"{project_name}-{environment}-sg-changes-alarm-{region}",
        name=f"{project_name}-{environment}-sg-changes-{region}",
        description=f"Alarm for security group changes in {region}",
        metric_name=f"SecurityGroupChanges-{region}",
        namespace=f"{project_name}/{environment}",
        statistic="Sum",
        period=300,  # 5 minutes
        evaluation_periods=1,
        threshold=1,
        comparison_operator="GreaterThanOrEqualToThreshold",
        alarm_actions=[sns_topic.arn],
        treat_missing_data="notBreaching",
        tags=tags,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region),
            depends_on=[metric_filter]
        )
    )

    return alarm

def create_cloudtrail(region: str, bucket: aws.s3.Bucket, tags: Dict[str, str]) -> aws.cloudtrail.Trail:
    """
    Create CloudTrail for audit logging.

    Args:
        region: AWS region for CloudTrail
        bucket: S3 bucket for CloudTrail logs
        tags: Resource tags to apply

    Returns:
        CloudTrail resource
    """
    # CloudTrail service principal policy for S3 bucket
    cloudtrail_policy = aws.iam.get_policy_document(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Service",
                        identifiers=["cloudtrail.amazonaws.com"]
                    )
                ],
                actions=["s3:PutObject"],
                resources=[pulumi.Output.concat(bucket.arn, "/*")],
                conditions=[
                    aws.iam.GetPolicyDocumentStatementConditionArgs(
                        test="StringEquals",
                        variable="s3:x-amz-acl",
                        values=["bucket-owner-full-control"]
                    )
                ]
            ),
            aws.iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Service",
                        identifiers=["cloudtrail.amazonaws.com"]
                    )
                ],
                actions=["s3:GetBucketAcl"],
                resources=[bucket.arn]
            )
        ]
    )

    aws.s3.BucketPolicy(
        f"{project_name}-{environment}-cloudtrail-policy-{region}",
        bucket=bucket.id,
        policy=cloudtrail_policy.json,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    # Create CloudTrail
    trail = aws.cloudtrail.Trail(
        f"{project_name}-{environment}-trail-{region}",
        name=f"{project_name}-{environment}-trail-{region}",
        s3_bucket_name=bucket.bucket,
        s3_key_prefix=f"cloudtrail-logs/{region}",
        include_global_service_events=True,
        is_multi_region_trail=False,  # Regional trail for each region
        enable_logging=True,
        tags=tags,
        opts=pulumi.ResourceOptions(
            provider=aws.Provider(f"aws-{region}", region=region)
        )
    )

    return trail

# Main deployment logic
def deploy_infrastructure():
    """
    Deploy the complete infrastructure across multiple regions.
    """
    resources = {
        "buckets": {},
        "sns_topics": {},
        "alarms": {},
        "trails": {}
    }

    # Create IAM roles (global resources)
    iam_roles = create_iam_roles(common_tags)

    # Deploy resources in each region
    for region in regions:
        region_tags = {**common_tags, "Region": region}

        # Create S3 bucket
        bucket = create_s3_bucket(region, region_tags)
        resources["buckets"][region] = bucket

        # Create SNS topic
        sns_topic = create_sns_topic(region, region_tags)
        resources["sns_topics"][region] = sns_topic

        # Create CloudWatch alarm for security group changes
        alarm = create_security_group_alarm(region, sns_topic, region_tags)
        resources["alarms"][region] = alarm

        # Create CloudTrail
        trail = create_cloudtrail(region, bucket, region_tags)
        resources["trails"][region] = trail

    # Export important resource information
    pulumi.export("s3_buckets", {
        region: bucket.bucket for region, bucket in resources["buckets"].items()
    })

    pulumi.export("sns_topics", {
        region: topic.arn for region, topic in resources["sns_topics"].items()
    })

    pulumi.export("iam_roles", {
        "s3_access_role_arn": iam_roles["s3_access_role"].arn,
        "cloudwatch_role_arn": iam_roles["cloudwatch_role"].arn
    })

    pulumi.export("cloudtrail_arns", {
        region: trail.arn for region, trail in resources["trails"].items()
    })

    return resources

# Deploy the infrastructure
if __name__ == "__main__":
    infrastructure = deploy_infrastructure()
```
