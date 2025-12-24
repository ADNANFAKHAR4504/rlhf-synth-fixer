# Model Failures

## Missing Stack Outputs

Add CfnOutput resources to export the S3 bucket name, CloudFront domain name, and ALB DNS name:

```python
CfnOutput(
    self,
    "S3BucketName",
    value=tap_bucket.bucket_name,
    description="S3 bucket for static content",
)
CfnOutput(
    self,
    "CloudFrontDomainName",
    value=distribution.distribution_domain_name,
    description="CloudFront distribution domain name",
)
CfnOutput(
    self,
    "LoadBalancerDNS",
    value=alb.load_balancer_dns_name,
    description="Application Load Balancer DNS name",
)
```

## Wildcard IAM Permissions

Replace wildcard IAM permissions with specific resource ARNs to follow least privilege:

```python
s3_policy = iam.Policy(
    self,
    "TapEC2S3AccessPolicy",
    statements=[
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["s3:GetObject", "s3:PutObject"],
            resources=[f"{tap_bucket.bucket_arn}/*"],
        ),
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["s3:ListBucket"],
            resources=[tap_bucket.bucket_arn],
        ),
    ],
)
```

## Missing S3 Bucket Encryption

Enable encryption on all S3 buckets using KMS or S3-managed encryption:

```python
tap_bucket = s3.Bucket(
    self,
    "TapBucket",
    encryption=s3.BucketEncryption.KMS,
    encryption_key=kms_key,
    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
    versioned=True,
    removal_policy=RemovalPolicy.DESTROY,
)
```

## Missing Public Access Block

Add public access block to all S3 buckets:

```python
block_public_access=s3.BlockPublicAccess.BLOCK_ALL
```

## Missing CloudWatch Dashboard

Create a CloudWatch dashboard with at least one widget to satisfy operational requirements:

```python
dashboard = cloudwatch.Dashboard(
    self,
    "TapInfrastructureDashboard",
    dashboard_name="TapInfrastructureDashboard",
)
dashboard.add_widgets(
    cloudwatch.GraphWidget(
        title="EC2 CPU Utilization",
        left=[
            cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name},
                period=Duration.minutes(5),
                statistic="Average",
            )
        ],
        width=12,
    )
)
```

## Missing Secrets Manager

Add Secrets Manager resources to store application secrets:

```python
db_secret = secretsmanager.Secret(
    self,
    "TapDatabaseCredentials",
    description="Database credentials for TAP application",
    generate_secret_string=secretsmanager.SecretStringGenerator(
        secret_string_template=json.dumps({"username": "admin"}),
        generate_string_key="password",
        exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\\\"@",
    ),
)
```

## Missing KMS Key Rotation

Enable automatic key rotation on KMS keys:

```python
kms_key = kms.Key(
    self,
    "TapKMSKey",
    enable_key_rotation=True,
    removal_policy=RemovalPolicy.DESTROY,
)
```

## EC2 Instances in Public Subnets

Move EC2 instances from public subnets to private subnets:

```python
asg = autoscaling.AutoScalingGroup(
    self,
    "TapASG",
    vpc=vpc,
    launch_template=launch_template,
    min_capacity=1,
    max_capacity=3,
    desired_capacity=2,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5)),
)
```

## Missing EBS Encryption

Enable encryption on EBS volumes:

```python
launch_template = ec2.LaunchTemplate(
    self,
    "TapLaunchTemplate",
    instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
    ),
    security_group=ec2_sg,
    role=ec2_role,
    user_data=user_data,
    block_devices=[
        ec2.BlockDevice(
            device_name="/dev/xvda",
            volume=ec2.BlockDeviceVolume.ebs(volume_size=20, encrypted=True),
        )
    ],
)
```

## Missing CloudWatch Alarms

Add CloudWatch alarms to publish to SNS topic for alerting:

```python
alert_topic = sns.Topic(
    self,
    "TapAlertTopic",
    display_name="TAP Infrastructure Alerts",
    topic_name="tap-infrastructure-alerts",
)

cpu_alarm = cloudwatch.Alarm(
    self,
    "TapHighCPUAlarm",
    metric=cloudwatch.Metric(
        namespace="AWS/EC2",
        metric_name="CPUUtilization",
        dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name},
        period=Duration.minutes(5),
        statistic="Average",
    ),
    threshold=80,
    evaluation_periods=2,
    alarm_description="High CPU utilization detected in TAP ASG",
)
cpu_alarm.add_alarm_action(SnsAction(alert_topic))
```

## Missing Security Group Rules

Add proper security group rules to restrict traffic:

```python
ec2_sg = ec2.SecurityGroup(self, "TapEC2SG", vpc=vpc, allow_all_outbound=True)
ec2_sg.add_ingress_rule(
    ec2.Peer.security_group_id(alb_sg.security_group_id), ec2.Port.tcp(80)
)
```

## Missing CloudFront Origin Access Identity

Configure CloudFront with Origin Access Identity to access S3 bucket:

```python
oai = cloudfront.OriginAccessIdentity(self, "TapOAI")
tap_bucket.grant_read(oai)

distribution = cloudfront.Distribution(
    self,
    "TapCloudFrontDistribution",
    default_behavior=cloudfront.BehaviorOptions(
        origin=S3BucketOrigin(tap_bucket),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    ),
)
```

## Missing Unit Tests

Add unit tests using CDK assertions to validate key resources:

```python
def test_creates_expected_resources(self):
    stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix="test"))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.resource_count_is("AWS::CloudFront::Distribution", 1)
```

## Missing Integration Tests

Add integration tests using boto3 to validate deployed resources:

```python
def test_s3_bucket_exists(self):
    outputs = _load_outputs()
    bucket_name = outputs.get("S3BucketName")

    s3 = boto3.client("s3", endpoint_url=endpoint_url)
    s3.head_bucket(Bucket=bucket_name)
```
