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
  Duration
)
from constructs import Construct


class WebApplicationStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    vpc = ec2.Vpc(
      self, "NewVPC",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          subnet_type=ec2.SubnetType.PUBLIC,
          name="PublicSubnet",
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name="PrivateSubnet",
          cidr_mask=24
        )
      ]
    )

    alb = elbv2.ApplicationLoadBalancer(
      self, "ALB",
      vpc=vpc,
      internet_facing=True,
      load_balancer_name="MyWebApplicationALB1"
    )

    listener = alb.add_listener("HTTPListener", port=80, open=True)

    db_sg = ec2.SecurityGroup(
      self, "DBSecurityGroup1",
      vpc=vpc,
      allow_all_outbound=False,
      description="Allows access to the RDS database"
    )
    
    db_subnet_group = rds.SubnetGroup(
      self, "DBSubnetGroup1",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
      ),
      description="Subnet group for the RDS database"
    )
    
    # Security Group for the Web Servers (ASG)
    web_sg = ec2.SecurityGroup(
      self, "WebSecurityGroup1",
      vpc=vpc,
      allow_all_outbound=False,
      description="Allows outbound traffic from web servers"
    )
    
    db_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(3306),
      description="Allow MySQL access from web servers"
    )
    
    web_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
      connection=ec2.Port.tcp(80),
      description="Allow HTTP traffic from within the VPC"
    )

    db_instance = rds.DatabaseInstance(
      self, "MySQLDBInstance1",
      engine=rds.DatabaseInstanceEngine.mysql(
        version=rds.MysqlEngineVersion.VER_8_0_42
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc=vpc,
      multi_az=True,
      allocated_storage=20,
      publicly_accessible=False,
      removal_policy=RemovalPolicy.DESTROY,
      security_groups=[db_sg],
      subnet_group=db_subnet_group
    )

    db_instance.connections.allow_from(
      db_sg,
      ec2.Port.tcp(3306),
      "Allow MySQL access"
    )

    role = iam.Role(
      self, "WebServerRole1",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com")
    )

    role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name(
        "CloudWatchAgentServerPolicy"
      )
    )

    asg = autoscaling.AutoScalingGroup(
      self, "ASG1",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
      ),
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
      role=role,
      security_group=web_sg
    )

    listener.add_targets("ASGTarget", port=80, targets=[asg])

    asg.scale_on_cpu_utilization(
      "CpuScaling",
      target_utilization_percent=50,
      cooldown=Duration.minutes(5)
    )

    topic = sns.Topic(self, "AlarmTopic1")

    alarm = cloudwatch.Alarm(
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
      alarm_description="Alarm when average CPU is high"
    )

    alarm.add_alarm_action(
      cloudwatch_actions.SnsAction(topic)
    )

    static_bucket = s3.Bucket(
      self, "StaticAssetsBucket1",
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )

    cf = cloudfront.Distribution(
      self, "CloudFrontDistribution1",
      default_behavior=cloudfront.BehaviorOptions(
        origin=origins.LoadBalancerV2Origin(
          alb,
          protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
        ),
        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      ),
      additional_behaviors={
        "/static/*": cloudfront.BehaviorOptions(
          origin=origins.S3Origin(static_bucket),
          viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
        )
      }
    )

    CfnOutput(
      self, "AlbDnsName",
      value=alb.load_balancer_dns_name,
      export_name=f"{self.stack_name}-AlbDnsName"
    )

    CfnOutput(
      self, "CloudFrontDistributionDomainName",
      value=cf.distribution_domain_name,
      export_name=f"{self.stack_name}-CloudFrontDistributionDomainName"
    )
    
    CfnOutput(
      self, "RdsEndpointAddress",
      value=db_instance.db_instance_endpoint_address,
      export_name=f"{self.stack_name}-RdsEndpointAddress"
    )
