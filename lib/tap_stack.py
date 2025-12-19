import aws_cdk as cdk
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_elasticache as elasticache,
  aws_elasticloadbalancingv2 as elbv2,
  aws_autoscaling as autoscaling,
  aws_iam as iam,
  aws_lambda as lambda_,
  aws_logs as logs,
  aws_cloudwatch as cloudwatch,
  aws_sns as sns,
  aws_s3 as s3,
)
from constructs import Construct
from typing import Optional

class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix

class TapStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    self.environment_suffix = environment_suffix

    # VPC
    vpc = ec2.Vpc(
      self, f"tap-vpc-{environment_suffix}",
      ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
      max_azs=2,
      nat_gateways=1,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name=f"public-{environment_suffix}",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"private-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name=f"database-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
          cidr_mask=24
        )
      ]
    )

    # VPC Flow Logs
    flow_log_group = logs.LogGroup(
      self, f"tap-vpc-flowlogs-{environment_suffix}",
      retention=logs.RetentionDays.ONE_MONTH,
      removal_policy=RemovalPolicy.DESTROY
    )
    ec2.FlowLog(
      self, f"tap-vpc-flowlog-{environment_suffix}",
      resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
      destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_log_group)
    )

    # Security Groups
    alb_sg = ec2.SecurityGroup(
      self, f"tap-alb-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for ALB",
      allow_all_outbound=True
    )
    alb_sg.add_ingress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(80),
      description="Allow HTTP traffic"
    )
    alb_sg.add_ingress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(443),
      description="Allow HTTPS traffic"
    )

    web_sg = ec2.SecurityGroup(
      self, f"tap-web-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for web servers",
      allow_all_outbound=True
    )
    web_sg.add_ingress_rule(
      peer=alb_sg,
      connection=ec2.Port.tcp(80),
      description="Allow HTTP from ALB"
    )
    web_sg.add_ingress_rule(
      peer=alb_sg,
      connection=ec2.Port.tcp(443),
      description="Allow HTTPS from ALB"
    )

    db_sg = ec2.SecurityGroup(
      self, f"tap-db-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for RDS database",
      allow_all_outbound=False
    )
    db_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(3306),
      description="Allow MySQL access from web servers"
    )

    cache_sg = ec2.SecurityGroup(
      self, f"tap-cache-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for ElastiCache",
      allow_all_outbound=False
    )
    cache_sg.add_ingress_rule(
      peer=web_sg,
      connection=ec2.Port.tcp(6379),
      description="Allow Redis access from web servers"
    )

    # IAM Role for EC2
    ec2_role = iam.Role(
      self, f"tap-ec2-role-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
      ]
    )

    # RDS Subnet Group
    db_subnet_group = rds.SubnetGroup(
      self, f"tap-db-subnet-group-{environment_suffix}",
      description="Subnet group for RDS database",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
    )

    # RDS MySQL Instance
    database = rds.DatabaseInstance(
      self, f"tap-database-{environment_suffix}",
      engine=rds.DatabaseInstanceEngine.mysql(
        version=rds.MysqlEngineVersion.VER_8_0
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[db_sg],
      multi_az=True,
      storage_encrypted=True,
      allocated_storage=20,
      max_allocated_storage=100,
      backup_retention=Duration.days(7),
      deletion_protection=False,
      removal_policy=RemovalPolicy.DESTROY
    )

    # ElastiCache Redis Cluster
    cache_subnet_group = elasticache.CfnSubnetGroup(
      self, f"tap-cache-subnet-group-{environment_suffix}",
      description="Subnet group for ElastiCache",
      subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets]
    )
    redis_cluster = elasticache.CfnReplicationGroup(
      self, f"tap-redis-cluster-{environment_suffix}",
      replication_group_description=f"Redis cluster for {environment_suffix} session storage and caching",
      cache_node_type="cache.t3.micro",
      engine="redis",
      num_cache_clusters=2,
      automatic_failover_enabled=True,
      multi_az_enabled=True,
      cache_subnet_group_name=cache_subnet_group.ref,
      security_group_ids=[cache_sg.security_group_id]
    )

    # S3 Bucket for static assets
    assets_bucket = s3.Bucket(
      self, f"tap-assets-bucket-{environment_suffix}",
      bucket_name=f"tap-assets-{environment_suffix}-{self.account}",
      versioned=True,
      encryption=s3.BucketEncryption.S3_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      removal_policy=RemovalPolicy.DESTROY
    )

    # S3 Bucket for logs
    logs_bucket = s3.Bucket(
      self, f"tap-logs-bucket-{environment_suffix}",
      bucket_name=f"tap-logs-{environment_suffix}-{self.account}",
      removal_policy=RemovalPolicy.DESTROY
    )

    # Application Load Balancer
    alb = elbv2.ApplicationLoadBalancer(
      self, f"tap-alb-{environment_suffix}",
      vpc=vpc,
      internet_facing=True,
      security_group=alb_sg,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
    )

    # Target Group
    target_group = elbv2.ApplicationTargetGroup(
      self, f"tap-tg-{environment_suffix}",
      port=80,
      protocol=elbv2.ApplicationProtocol.HTTP,
      vpc=vpc,
      target_type=elbv2.TargetType.INSTANCE,
      health_check=elbv2.HealthCheck(
        enabled=True,
        healthy_http_codes="200",
        interval=Duration.seconds(30),
        path="/health",
        protocol=elbv2.Protocol.HTTP,
        timeout=Duration.seconds(5),
        unhealthy_threshold_count=2,
        healthy_threshold_count=5
      )
    )

    # Listener
    alb.add_listener(
      f"tap-listener-{environment_suffix}",
      port=80,
      default_target_groups=[target_group]
    )

    # Launch Template for EC2
    user_data_script = ec2.UserData.for_linux()
    user_data_script.add_commands(
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      "echo '<h1>Hello from TAP Web Server</h1>' > /var/www/html/index.html",
      "echo 'OK' > /var/www/html/health"
    )

    launch_template = ec2.LaunchTemplate(
      self, f"tap-launch-template-{environment_suffix}",
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.SMALL
      ),
      machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      ),
      security_group=web_sg,
      role=ec2_role,
      user_data=user_data_script
    )

    # Auto Scaling Group
    asg = autoscaling.AutoScalingGroup(
      self, f"tap-asg-{environment_suffix}",
      vpc=vpc,
      launch_template=launch_template,
      min_capacity=2,
      max_capacity=5,
      desired_capacity=2,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      health_check=autoscaling.HealthCheck.elb(grace=Duration.seconds(300))
    )
    # Attach ASG to target group
    target_group.add_target(asg)
    
    asg.scale_on_cpu_utilization(
      f"tap-cpu-scaling-{environment_suffix}",
      target_utilization_percent=70,
      cooldown=Duration.seconds(300)
    )

    # Outputs
    cdk.CfnOutput(self, "VpcId", value=vpc.vpc_id, description="VPC ID")
    cdk.CfnOutput(self, "LoadBalancerDNS", value=alb.load_balancer_dns_name, description="ALB DNS Name")
    cdk.CfnOutput(self, "DatabaseEndpoint", value=database.instance_endpoint.hostname, description="RDS Endpoint")
    cdk.CfnOutput(self, "AssetsBucketName", value=assets_bucket.bucket_name, description="Assets S3 Bucket Name")
    cdk.CfnOutput(self, "LogsBucketName", value=logs_bucket.bucket_name, description="Logs S3 Bucket Name")