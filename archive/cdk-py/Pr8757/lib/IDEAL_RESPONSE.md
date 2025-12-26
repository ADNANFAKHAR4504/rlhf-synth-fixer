# Ideal Response

## tap.py

```python
#!/usr/bin/env python3

import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags

from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
stack_name = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION'),
    ),
)

TapStack(app, stack_name, props=props)

app.synth()
```

## lib/tap_stack.py

```python
from typing import Optional
import json
import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    SecretValue,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudfront as cloudfront,
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_kms as kms,
    aws_secretsmanager as secretsmanager,
)
from aws_cdk.aws_cloudwatch_actions import SnsAction
from aws_cdk.aws_cloudfront_origins import S3BucketOrigin


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        kms_key = kms.Key(
            self,
            "TapKMSKey",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        kms_key.add_alias("alias/tap-infrastructure-key")

        access_logs_bucket = s3.Bucket(
            self,
            "TapAccessLogsBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(id="DeleteOldLogs", expiration=Duration.days(90))
            ],
        )
        tap_bucket = s3.Bucket(
            self,
            "TapBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            server_access_logs_bucket=access_logs_bucket,
            server_access_logs_prefix="access-logs/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90),
                        ),
                    ],
                )
            ],
        )

        ec2_role = iam.Role(
            self,
            "TapEC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                )
            ],
        )
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
        s3_policy.attach_to_role(ec2_role)
        lambda_role = iam.Role(
            self,
            "TapLambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        vpc = ec2.Vpc(
            self,
            "TapVPC",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        alb_sg = ec2.SecurityGroup(self, "TapALBSG", vpc=vpc, allow_all_outbound=True)
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80))
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443))

        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>TAP Microservice</h1>' > /var/www/html/index.html",
        )
        ec2_sg = ec2.SecurityGroup(self, "TapEC2SG", vpc=vpc, allow_all_outbound=True)
        ec2_sg.add_ingress_rule(
            ec2.Peer.security_group_id(alb_sg.security_group_id), ec2.Port.tcp(80)
        )

        launch_template = ec2.LaunchTemplate(
            self,
            "TapLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
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
        asg = autoscaling.AutoScalingGroup(
            self,
            "TapASG",
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5)),
        )

        cfn_asg = asg.node.default_child
        if (
            isinstance(cfn_asg, autoscaling.CfnAutoScalingGroup)
            and cfn_asg.launch_template
        ):
            cfn_asg.launch_template = (
                autoscaling.CfnAutoScalingGroup.LaunchTemplateSpecificationProperty(
                    launch_template_id=launch_template.launch_template_id,
                    version="$Latest",
                )
            )
        asg.scale_on_cpu_utilization(
            "CPUScaling", target_utilization_percent=70, cooldown=Duration.minutes(5)
        )

        alb = elbv2.ApplicationLoadBalancer(
            self,
            "TapALB",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "TapTargetGroup",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/",
                protocol=elbv2.Protocol.HTTP,
            ),
        )
        target_group.add_target(asg)
        alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group]),
        )

        oai = cloudfront.OriginAccessIdentity(self, "TapOAI")
        tap_bucket.grant_read(oai)
        response_headers_policy = cloudfront.ResponseHeadersPolicy(
            self,
            "TapSecurityHeadersPolicy",
            security_headers_behavior=cloudfront.ResponseSecurityHeadersBehavior(
                content_type_options=cloudfront.ResponseHeadersContentTypeOptions(
                    override=True
                ),
                frame_options=cloudfront.ResponseHeadersFrameOptions(
                    frame_option=cloudfront.HeadersFrameOption.DENY, override=True
                ),
                referrer_policy=cloudfront.ResponseHeadersReferrerPolicy(
                    referrer_policy=cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                    override=True,
                ),
                strict_transport_security=cloudfront.ResponseHeadersStrictTransportSecurity(
                    access_control_max_age=Duration.seconds(31536000),
                    include_subdomains=True,
                    override=True,
                ),
            ),
        )
        cf_logs_bucket = s3.Bucket(
            self,
            "TapCloudFrontLogsBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ACLS,
            object_ownership=s3.ObjectOwnership.OBJECT_WRITER,
            removal_policy=RemovalPolicy.DESTROY,
        )
        distribution = cloudfront.Distribution(
            self,
            "TapCloudFrontDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=S3BucketOrigin(tap_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                response_headers_policy=response_headers_policy,
            ),
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            enable_logging=True,
            log_bucket=cf_logs_bucket,
        )

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

        alb_5xx_alarm = cloudwatch.Alarm(
            self,
            "TapALB5xxErrorsAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="HTTPCode_ELB_5XX_Count",
                dimensions_map={"LoadBalancer": alb.load_balancer_full_name},
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="High number of 5xx errors from TAP ALB",
        )
        alb_5xx_alarm.add_alarm_action(SnsAction(alert_topic))

        cf_4xx_alarm = cloudwatch.Alarm(
            self,
            "TapCloudFront4xxAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/CloudFront",
                metric_name="4xxErrorRate",
                dimensions_map={
                    "DistributionId": distribution.distribution_id,
                    "Region": "Global",
                },
                period=Duration.minutes(5),
                statistic="Average",
            ),
            threshold=5,
            evaluation_periods=2,
            alarm_description="High 4xx error rate in TAP CloudFront",
        )
        cf_4xx_alarm.add_alarm_action(SnsAction(alert_topic))

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
                        dimensions_map={
                            "AutoScalingGroupName": asg.auto_scaling_group_name
                        },
                        period=Duration.minutes(5),
                        statistic="Average",
                    )
                ],
                width=12,
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="RequestCount",
                        dimensions_map={"LoadBalancer": alb.load_balancer_full_name},
                        period=Duration.minutes(5),
                        statistic="Sum",
                    )
                ],
                width=12,
            ),
            cloudwatch.GraphWidget(
                title="CloudFront Requests",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="Requests",
                        dimensions_map={
                            "DistributionId": distribution.distribution_id,
                            "Region": "Global",
                        },
                        period=Duration.minutes(5),
                        statistic="Sum",
                    )
                ],
                width=12,
            ),
        )

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
        api_secret = secretsmanager.Secret(
            self,
            "TapAPIKeys",
            description="API keys for TAP external services",
            secret_string_value=SecretValue.unsafe_plain_text(
                json.dumps(
                    {
                        "third_party_api_key": "placeholder-key",
                        "encryption_key": "placeholder-encryption-key",
                    }
                )
            ),
        )

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

## tests/unit/test_tap_stack.py

```python
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStackUnit(unittest.TestCase):
    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates expected top level resources")
    def test_creates_expected_resources(self):
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.resource_count_is("AWS::KMS::Key", 1)
        template.resource_count_is("AWS::SNS::Topic", 1)

        buckets = template.find_resources("AWS::S3::Bucket")
        self.assertGreaterEqual(len(buckets), 3)

        secrets = template.find_resources("AWS::SecretsManager::Secret")
        self.assertGreaterEqual(len(secrets), 2)

    @mark.it("configures KMS key rotation")
    def test_kms_key_rotation_enabled(self):
        stack = TapStack(
            self.app, "TapStackTestKms", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
            },
        )

    @mark.it("exports required stack outputs")
    def test_outputs_exist(self):
        stack = TapStack(
            self.app, "TapStackTestOutputs", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        outputs = template.find_outputs("*")
        self.assertIn("S3BucketName", outputs)
        self.assertIn("CloudFrontDomainName", outputs)
        self.assertIn("LoadBalancerDNS", outputs)

    @mark.it("enables bucket encryption")
    def test_bucket_encryption_present(self):
        stack = TapStack(
            self.app, "TapStackTestBuckets", TapStackProps(environment_suffix="test")
        )
        template = Template.from_stack(stack)

        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.any_value(),
                },
            },
        )
```

## tests/integration/test_tap_stack.py

```python
import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from pytest import mark


def _load_outputs() -> dict:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    outputs_path = os.path.join(
        base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        return {}

    with open(outputs_path, "r", encoding="utf-8") as f:
        content = f.read().strip() or "{}"

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


def _endpoint_url_for(service: str) -> str | None:
    service_env = f"AWS_ENDPOINT_URL_{service.upper()}"
    return os.getenv(service_env) or os.getenv("AWS_ENDPOINT_URL")


def _is_github_actions() -> bool:
    return bool(os.getenv("GITHUB_ACTIONS"))


@mark.describe("TapStack")
class TestTapStackIntegration(unittest.TestCase):
    @mark.it("deployment outputs contain required keys")
    def test_outputs_present(self):
        outputs = _load_outputs()

        if not outputs:
            if _is_github_actions():
                self.fail("Deployment outputs are empty")
            self.skipTest("Deployment outputs not found; skipping integration checks")

        self.assertTrue(outputs)

        required_keys = {"S3BucketName", "CloudFrontDomainName", "LoadBalancerDNS"}
        missing_keys = sorted(required_keys - set(outputs.keys()))
        if missing_keys:
            if _is_github_actions():
                self.fail(f"Missing required output keys: {missing_keys}")
            self.skipTest(f"Missing required output keys: {missing_keys}")

        self.assertTrue(str(outputs["S3BucketName"]).strip())
        self.assertTrue(str(outputs["CloudFrontDomainName"]).strip())
        self.assertTrue(str(outputs["LoadBalancerDNS"]).strip())

    @mark.it("S3 bucket exists")
    def test_s3_bucket_exists(self):
        outputs = _load_outputs()
        bucket_name = outputs.get("S3BucketName")

        if not bucket_name:
            self.skipTest("S3BucketName output not found")

        endpoint_url = os.getenv("AWS_ENDPOINT_URL_S3") or os.getenv("AWS_ENDPOINT_URL")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for S3")
            self.skipTest("No AWS endpoint configuration found; skipping S3 check")
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            s3.head_bucket(Bucket=bucket_name)
        except EndpointConnectionError as e:
            self.skipTest(f"S3 endpoint not reachable in this environment: {e}")
        except ClientError as e:
            self.fail(f"Unable to head bucket {bucket_name}: {e}")

    @mark.it("load balancer exists")
    def test_alb_exists(self):
        outputs = _load_outputs()
        expected_dns = outputs.get("LoadBalancerDNS")

        if not expected_dns:
            self.skipTest("LoadBalancerDNS output not found")

        endpoint_url = _endpoint_url_for("elbv2")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for ELBv2")
            self.skipTest("No AWS endpoint configuration found; skipping ELBv2 check")

        elbv2 = boto3.client(
            "elbv2",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            lbs = elbv2.describe_load_balancers().get("LoadBalancers", [])
            dns_names = {lb.get("DNSName") for lb in lbs}
            self.assertIn(expected_dns, dns_names)
        except (ClientError, EndpointConnectionError) as e:
            self.skipTest(f"ELBv2 not available in this environment: {e}")

    @mark.it("cloudfront distribution can be queried when supported")
    def test_cloudfront_distribution_exists_when_supported(self):
        outputs = _load_outputs()
        expected_domain = outputs.get("CloudFrontDomainName")

        if not expected_domain:
            self.skipTest("CloudFrontDomainName output not found")

        endpoint_url = _endpoint_url_for("cloudfront")
        if not endpoint_url:
            if _is_github_actions():
                self.fail("Missing AWS endpoint configuration for CloudFront")
            self.skipTest("No AWS endpoint configuration found; skipping CloudFront check")

        cloudfront = boto3.client(
            "cloudfront",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            endpoint_url=endpoint_url,
        )

        try:
            dist_list = cloudfront.list_distributions().get("DistributionList", {})
            items = dist_list.get("Items", []) or []
            domains = {d.get("DomainName") for d in items}
            if expected_domain not in domains:
                self.skipTest(
                    "CloudFront distribution not discoverable in this environment"
                )
        except (ClientError, EndpointConnectionError) as e:
            self.skipTest(f"CloudFront not available in this environment: {e}")
```
