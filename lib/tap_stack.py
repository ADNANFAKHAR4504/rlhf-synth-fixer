from aws_cdk import (
  Stack,
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_iam as iam,
  aws_autoscaling as autoscaling,
  aws_elasticloadbalancingv2 as elbv2,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cloudwatch_actions,
  aws_sns as sns,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  CfnOutput,
  RemovalPolicy,
  Duration,
  Environment
)
from constructs import Construct


class WebApplicationStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Retrieve an existing VPC
    vpc = ec2.Vpc.from_lookup(
      self, "ExistingVPC",
      vpc_id="vpc-1234567890abcdef00"
    )

    private_subnets = vpc.select_subnets(
      subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
    )

    # 1. Application Load Balancer
    alb = elbv2.ApplicationLoadBalancer(
      self, "ALB",
      vpc=vpc,
      internet_facing=True,
      load_balancer_name="MyWebApplicationALB"
    )

    listener = alb.add_listener("HTTPListener", port=80, open=True)

    # 2. RDS Database
    db_security_group = ec2.SecurityGroup(
      self, "DBSecurityGroup",
      vpc=vpc,
      allow_all_outbound=True,
      description="Allows access to the RDS database"
    )

    db_subnet_group = rds.SubnetGroup(
      self, "DBSubnetGroup",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnets=private_subnets.subnets),
      description="Subnet group for the RDS database"
    )

    db_instance = rds.DatabaseInstance(
      self, "MySQLDBInstance",
      engine=rds.DatabaseInstanceEngine.mysql(
        version=rds.MysqlEngineVersion.VER_8_0_28
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.SMALL
      ),
      vpc=vpc,
      multi_az=True,
      allocated_storage=20,
      publicly_accessible=False,
      removal_policy=RemovalPolicy.DESTROY,
      security_groups=[db_security_group],
      subnet_group=db_subnet_group
    )

    db_instance.connections.allow_from(
      ec2.Peer.ipv4(vpc.vpc_cidr_block),
      ec2.Port.tcp(3306),
      "Allow web servers to access MySQL"
    )

    # 3. IAM Role
    web_server_role = iam.Role(
      self, "WebServerRole",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description="IAM role for web servers to access necessary AWS services"
    )

    web_server_role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name(
        "CloudWatchAgentServerPolicy"
      )
    )

    # 4. Auto Scaling Group
    asg = autoscaling.AutoScalingGroup(
      self, "ASG",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnets=private_subnets.subnets),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      ),
      desired_capacity=1,
      min_capacity=1,
      max_capacity=3,
      role=web_server_role
    )

    listener.add_targets("ASGTarget", port=80, targets=[asg])

    asg.scale_on_cpu_utilization(
      "CpuScaling",
      target_utilization_percent=50,
      cooldown=Duration.minutes(5)
    )

    # 5. CloudWatch Alarm
    alarm_topic = sns.Topic(self, "AlarmTopic")

    cpu_alarm = cloudwatch.Alarm(
      self, "HighCPUAlarm",
      metric=cloudwatch.Metric(
        namespace="AWS/EC2",
        metric_name="CPUUtilization",
        dimensions_map={
          "AutoScalingGroupName": asg.auto_scaling_group_name
        },
        statistic="Average"
      ),
      threshold=70,
      evaluation_periods=2,
      datapoints_to_alarm=2,
      comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarm_description="Alarm when average CPU utilization is too high"
    )

    cpu_alarm.add_alarm_action(
      cloudwatch_actions.SnsAction(alarm_topic)
    )

    # 6. S3 and CloudFront
    static_assets_bucket = s3.Bucket(
      self, "StaticAssetsBucket",
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )

    cloudfront_distribution = cloudfront.Distribution(
      self, "CloudFrontDistribution",
      default_behavior=cloudfront.BehaviorOptions(
        origin=origins.LoadBalancerV2Origin(
          alb,
          protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
        ),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      ),
      additional_behaviors={
        "/static/*": cloudfront.BehaviorOptions(
          origin=origins.S3Origin(static_assets_bucket),
          viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
        )
      }
    )

    # 7. Outputs
    CfnOutput(
      self, "AlbDnsName",
      value=alb.load_balancer_dns_name,
      export_name=f"{self.stack_name}-AlbDnsName"
    )

    CfnOutput(
      self, "CloudFrontDistributionDomainName",
      value=cloudfront_distribution.distribution_domain_name,
      export_name=f"{self.stack_name}-CloudFrontDistributionDomainName"
    )

    CfnOutput(
      self, "RdsEndpointAddress",
      value=db_instance.db_instance_endpoint_address,
      export_name=f"{self.stack_name}-RdsEndpointAddress"
    )
