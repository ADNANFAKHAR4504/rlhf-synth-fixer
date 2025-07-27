"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

from aws_cdk import (
    NestedStack,
    Duration,
    CfnOutput,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_iam as iam,
    Tags,
    StackProps,
    Stack,
    Environment
)
from constructs import Construct


class RegionalRedundantStack(NestedStack):
  def __init__(
      self,
      scope: Construct,
      stack_id: str,
      region: str,
      props: dict = None,
      env: Optional[Environment] = None,
      **kwargs
  ) -> None:
    super().__init__(scope, stack_id, **kwargs)

    # VPC
    print(f"Creating Environment for region: {env.region}")
    vpc = ec2.Vpc(
        self,
        f"VPC-{region}",
        max_azs=3,
        subnet_configuration=[
            ec2.SubnetConfiguration(
                name="PublicSubnet",
                subnet_type=ec2.SubnetType.PUBLIC),
            ec2.SubnetConfiguration(
                name="PrivateSubnet",
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        ]
    )

    # Security Groups
    ec2_sg = ec2.SecurityGroup(self, f"EC2SecurityGroup-{region}", vpc=vpc)
    ec2_sg.add_ingress_rule(
        ec2.Peer.ipv4('10.0.0.0/16'),
        ec2.Port.tcp(22),
        'Allow SSH from management subnet')

    rds_sg = ec2.SecurityGroup(self, f"RDSSecurityGroup-{region}", vpc=vpc)
    rds_sg.add_ingress_rule(ec2_sg, ec2.Port.tcp(5432), 'Allow EC2 to RDS')

    # RDS
    rds_instance = rds.DatabaseInstance(
        self,
        f"RDS-{region}",
        engine=rds.DatabaseInstanceEngine.postgres(
            version=rds.PostgresEngineVersion.VER_14_7),
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE2,
            ec2.InstanceSize.MICRO),
        vpc=vpc,
        multi_az=True,
        backup_retention=Duration.days(7),
        security_groups=[rds_sg],
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
    )

    asg = autoscaling.AutoScalingGroup(
        self,
        f"ASG-{region}",
        vpc=vpc,
        instance_type=ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE2,
            ec2.InstanceSize.MICRO),
        machine_image=ec2.AmazonLinuxImage(),
        min_capacity=2,
        max_capacity=10,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        security_group=ec2_sg
    )

    # ALB
    alb = elbv2.ApplicationLoadBalancer(self, f"ALB-{region}",
                                        vpc=vpc,
                                        internet_facing=True)

    listener = alb.add_listener("Listener", port=80)
    listener.add_targets("Targets", port=80, targets=[asg])
    listener.connections.allow_default_port_from_any_ipv4("Open to world")

    # S3
    bucket = s3.Bucket(self, f"S3Bucket-{region}",
                       versioned=True,
                       encryption=s3.BucketEncryption.S3_MANAGED)

    # Lambda
    lambda_fn = _lambda.Function(
        self,
        f"Lambda-{region}",
        runtime=_lambda.Runtime.PYTHON_3_8,
        handler="index.handler",
        code=_lambda.Code.from_inline("def handler(event, context): pass"))

    # IAM Role (suppressed warning)
    _ = iam.Role(self, f"IAMRole-{region}",
                 assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"))

    # CloudWatch
    cloudwatch.Alarm(
        self,
        f"CPUAlarm-{region}",
        metric=cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={
                "AutoScalingGroupName": asg.auto_scaling_group_name},
            period=Duration.minutes(5),
            statistic="Average",
        ),
        evaluation_periods=2,
        threshold=80,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarm_description=f"CPU > 80% for ASG in {region}",
    )

    # Route 53
    zone = route53.HostedZone(
        self,
        f"HostedZone-{region}",
        zone_name=props.get('dns_name', f"tap-{region}-example.com")
    route53.ARecord(
        self,
        f"AliasRecord-{region}",
        zone=zone,
        target=route53.RecordTarget.from_alias(
            targets.LoadBalancerTarget(alb)))

    # Tagging
    Tags.of(self).add("Environment", "Production")
    Tags.of(self).add("Team", "DevOps")

    # Outputs
    CfnOutput(self, "VPCId", value=vpc.vpc_id)
    CfnOutput(self, "ALBDns", value=alb.load_balancer_dns_name)
    CfnOutput(self, "BucketName", value=bucket.bucket_name)
    CfnOutput(self, "LambdaName", value=lambda_fn.function_name)
    CfnOutput(
        self,
        "RDSInstanceIdentifier",
        value=rds_instance.instance_identifier)
    CfnOutput(self, "HostedZoneId", value=zone.hosted_zone_id)


class TapStackProps(StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Instantiate nested regional stacks
    print(f"Creating TapStack with environment suffix: {props.environment_suffix}")
    for region in ['us-east-1', 'us-west-2']:
      RegionalRedundantStack(
          self,
          f"RegionalStack-{region}",
          region=region,
          props={"dns_name": f"tap-{region}-{props.environment_suffix}.example.com"},
          env=Environment(region=region)
      )
