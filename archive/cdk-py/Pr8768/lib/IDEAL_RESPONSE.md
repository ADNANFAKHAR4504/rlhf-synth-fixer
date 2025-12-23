# SecureApp CDK Stack — Ideal Response

This CDK stack provisions a **secure, production-ready AWS infrastructure** for the SecureApp project. It follows industry best practices including:

* KMS key encryption
* IAM least privilege
* CloudTrail and VPC Flow Logs
* CloudWatch metrics and dashboards
* Encrypted, versioned S3 buckets with lifecycle rules
* EC2 instance with CloudWatch agent and encrypted EBS

---

## File: `tap_stack.py`

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""
```

---

## Stack Initialization and Properties

```python
class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        self.kms_key = self._create_kms_key()
        self.vpc = self._create_vpc()
        self.security_groups = self._create_security_groups()
        self.s3_buckets = self._create_s3_buckets()
        self.iam_roles = self._create_iam_roles()
        self.cloudwatch_resources = self._create_cloudwatch_resources()
        self.ec2_instances = self._create_ec2_instances()
        self.cloudtrail = self._create_cloudtrail()
        self._create_outputs()
```

---

## KMS Key with Rotation and Secure Access

```python
def _create_kms_key(self) -> kms.Key:
    key_policy = iam.PolicyDocument(statements=[
        iam.PolicyStatement(
            sid="Enable IAM User Permissions",
            effect=iam.Effect.ALLOW,
            principals=[iam.AccountRootPrincipal()],
            actions=["kms:*"],
            resources=["*"]
        ),
        iam.PolicyStatement(
            sid="Allow CloudWatch Logs",
            effect=iam.Effect.ALLOW,
            principals=[iam.ServicePrincipal("logs.amazonaws.com")],
            actions=["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"],
            resources=["*"]
        ),
        iam.PolicyStatement(
            sid="Allow S3 Service",
            effect=iam.Effect.ALLOW,
            principals=[iam.ServicePrincipal("s3.amazonaws.com")],
            actions=["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"],
            resources=["*"]
        )
    ])

    kms_key = kms.Key(
        self, "SecureAppKMSKey",
        alias="secureapp-encryption-key",
        description="KMS key for SecureApp encryption with automatic rotation",
        enable_key_rotation=True,
        policy=key_policy,
        removal_policy=RemovalPolicy.DESTROY
    )

    Tags.of(kms_key).add("Name", "secureapp-kms-key")
    return kms_key
```

---

## VPC with Public & Private Subnets + Flow Logs

```python
def _create_vpc(self) -> ec2.Vpc:
    vpc = ec2.Vpc(
        self, "SecureAppVPC",
        vpc_name="secureapp-vpc",
        ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
        max_azs=2,
        subnet_configuration=[
            ec2.SubnetConfiguration(name="secureapp-public-subnet", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24),
            ec2.SubnetConfiguration(name="secureapp-private-subnet", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, cidr_mask=24),
        ],
        enable_dns_hostnames=True,
        enable_dns_support=True
    )

    vpc_flow_log_group = logs.LogGroup(
        self, "VPCFlowLogGroup",
        log_group_name="/secureapp/vpc/flowlogs",
        encryption_key=self.kms_key,
        retention=logs.RetentionDays.ONE_MONTH,
        removal_policy=RemovalPolicy.DESTROY
    )

    flow_log_role = iam.Role(
        self, "VPCFlowLogRole",
        assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
        inline_policies={
            "VPCFlowLogsPolicy": iam.PolicyDocument(statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                    resources=["*"]
                )
            ])
        }
    )

    ec2.FlowLog(
        self, "VPCFlowLog",
        resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
        destination=ec2.FlowLogDestination.to_cloud_watch_logs(
            log_group=vpc_flow_log_group,
            iam_role=flow_log_role
        ),
        traffic_type=ec2.FlowLogTrafficType.ALL
    )

    return vpc
```

---

## Secure EC2 Instance with Logging & Monitoring

```python
def _create_ec2_instances(self) -> dict:
    user_data = ec2.UserData.for_linux()
    user_data.add_commands(
        "yum update -y",
        "yum install -y amazon-cloudwatch-agent",
        "yum install -y awslogs",
        # CloudWatch agent config omitted for brevity...
    )

    instance = ec2.Instance(
        self, "SecureAppInstance",
        instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machine_image=ec2.MachineImage.latest_amazon_linux2(),
        vpc=self.vpc,
        vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        security_group=self.security_groups["ec2_sg"],
        role=self.iam_roles["ec2_role"],
        user_data=user_data,
        block_devices=[
            ec2.BlockDevice(
                device_name="/dev/xvda",
                volume=ec2.BlockDeviceVolume.ebs(volume_size=20, encrypted=True, kms_key=self.kms_key)
            )
        ]
    )

    Tags.of(instance).add("Name", "secureapp-instance-01")
    return {"instance": instance}
```

---

## CloudTrail with Secure Logging

```python
def _create_cloudtrail(self) -> logs.LogGroup:
    trail_log_group = logs.LogGroup(
        self, "CloudTrailLogGroup",
        log_group_name="/secureapp/cloudtrail",
        encryption_key=self.kms_key,
        retention=logs.RetentionDays.ONE_YEAR
    )

    trail_bucket = self.s3_buckets["logs_bucket"]

    trail_bucket.add_to_resource_policy(iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:GetBucketAcl"],
        resources=[trail_bucket.bucket_arn]
    ))

    trail_bucket.add_to_resource_policy(iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:PutObject"],
        resources=[f"{trail_bucket.bucket_arn}/AWSLogs/{self.account}/*"],
        conditions={"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}}
    ))

    trail = cloudtrail.CfnTrail(
        self, "SecureAppTrail",
        trail_name="secureapp-trail",
        s3_bucket_name=trail_bucket.bucket_name,
        cloud_watch_logs_log_group_arn=trail_log_group.log_group_arn,
        cloud_watch_logs_role_arn=self._create_cloudtrail_log_role().role_arn,
        is_logging=True,
        is_multi_region_trail=True,
        enable_log_file_validation=True,
        include_global_service_events=True
    )

    return trail_log_group
```

---

## CloudFormation Outputs

```python
def _create_outputs(self) -> None:
    CfnOutput(self, "VPCId", value=self.vpc.vpc_id)
    CfnOutput(self, "KMSKeyId", value=self.kms_key.key_id)
    CfnOutput(self, "AppDataBucketOutput", value=self.s3_buckets["app_data_bucket"].bucket_name)
    CfnOutput(self, "LogsBucketOutput", value=self.s3_buckets["logs_bucket"].bucket_name)
    CfnOutput(self, "InstanceId", value=self.ec2_instances["instance"].instance_id)
```

---

## Summary

This stack is well-architected for:

* **Security**: Encryption, least privilege, flow logs, IAM hardening.
* **Observability**: CloudTrail, CloudWatch Logs, metrics dashboard.
* **Maintainability**: Logical separation, reusable components.
* **Compliance**: S3 lifecycle, log retention, KMS policies.

---
