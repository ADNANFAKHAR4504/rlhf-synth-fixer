# Marketplace Infrastructure CDK Python Code

I'll create the infrastructure for your marketplace platform using AWS CDK in Python. Here's the complete solution organized into separate files:

## File: lib/vpc_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    Stack,
    CfnOutput
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with specified CIDR
        self.vpc = ec2.Vpc(
            self, "MarketplaceVPC",
            ip_addresses=ec2.IpAddresses.cidr("172.31.0.0/16"),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            export_name="MarketplaceVPCId"
        )
```

## File: lib/security_groups_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    NestedStack
)
from constructs import Construct

class SecurityGroupsStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        # EC2 Security Group
        self.ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )

        self.ec2_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )

        # Database Security Group
        self.db_sg = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=vpc,
            description="Security group for Aurora database",
            allow_all_outbound=False
        )

        self.db_sg.add_ingress_rule(
            self.ec2_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL traffic from EC2"
        )

        # Redis Security Group
        self.redis_sg = ec2.SecurityGroup(
            self, "RedisSecurityGroup",
            vpc=vpc,
            description="Security group for Redis cluster",
            allow_all_outbound=False
        )

        self.redis_sg.add_ingress_rule(
            self.ec2_sg,
            ec2.Port.tcp(6379),
            "Allow Redis traffic from EC2"
        )
```

## File: lib/alb_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack,
    CfnOutput,
    Duration
)
from constructs import Construct

class ALBStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "MarketplaceALB",
            vpc=vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # Target Group with health checks
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "MarketplaceTargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(300)  # Connection draining
        )

        # Listener
        listener = self.alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([self.target_group])
        )

        CfnOutput(
            self, "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            export_name="MarketplaceALBDNS"
        )
```

## File: lib/autoscaling_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack,
    Duration
)
from constructs import Construct

class AutoScalingStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup, target_group: elbv2.ApplicationTargetGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Marketplace Platform</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        )

        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, "MarketplaceASG",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.LARGE
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=security_group,
            min_capacity=4,
            max_capacity=10,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            user_data=user_data,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.seconds(300)
            )
        )

        # Attach to target group
        self.asg.attach_to_application_target_group(target_group)

        # Scaling policies
        self.asg.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70
        )
```

## File: lib/rds_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    NestedStack,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct

class RDSStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database credentials
        db_secret = secretsmanager.Secret(
            self, "DBCredentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=16
            )
        )

        # Subnet group
        subnet_group = rds.SubnetGroup(
            self, "AuroraSubnetGroup",
            description="Subnet group for Aurora cluster",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        # Aurora Serverless v2 Cluster
        self.cluster = rds.DatabaseCluster(
            self, "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_3_04_0
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            writer=rds.ClusterInstance.serverless_v2("Writer",
                enable_performance_insights=True
            ),
            readers=[
                rds.ClusterInstance.serverless_v2("Reader1",
                    scale_with_writer=True,
                    enable_performance_insights=True
                ),
                rds.ClusterInstance.serverless_v2("Reader2",
                    scale_with_writer=True,
                    enable_performance_insights=True
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            subnet_group=subnet_group,
            security_groups=[security_group],
            default_database_name="marketplace",
            backup=rds.BackupProps(
                retention=Duration.days(7)
            ),
            removal_policy=RemovalPolicy.SNAPSHOT
        )

        CfnOutput(
            self, "ClusterEndpoint",
            value=self.cluster.cluster_endpoint.hostname,
            export_name="AuroraClusterEndpoint"
        )

        CfnOutput(
            self, "ClusterReadEndpoint",
            value=self.cluster.cluster_read_endpoint.hostname,
            export_name="AuroraClusterReadEndpoint"
        )
```

## File: lib/elasticache_stack.py

```python
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticache as elasticache,
    NestedStack,
    CfnOutput
)
from constructs import Construct

class ElastiCacheStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get private subnet IDs
        private_subnets = vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)

        # Subnet group
        subnet_group = elasticache.CfnSubnetGroup(
            self, "RedisSubnetGroup",
            description="Subnet group for Redis cluster",
            subnet_ids=private_subnets.subnet_ids,
            cache_subnet_group_name="marketplace-redis-subnet-group"
        )

        # Redis Replication Group with cluster mode enabled
        self.redis_cluster = elasticache.CfnReplicationGroup(
            self, "RedisCluster",
            replication_group_description="Marketplace Redis cluster with cluster mode enabled",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.r6g.large",
            num_node_groups=6,  # 6 shards as required
            replicas_per_node_group=1,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=subnet_group.cache_subnet_group_name,
            security_group_ids=[security_group.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auto_minor_version_upgrade=True
        )

        self.redis_cluster.add_dependency(subnet_group)

        CfnOutput(
            self, "RedisEndpoint",
            value=self.redis_cluster.attr_configuration_end_point_address,
            export_name="RedisClusterEndpoint"
        )
```

## File: lib/s3_cloudfront_stack.py

```python
from aws_cdk import (
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    NestedStack,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct

class S3CloudFrontStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for product images
        self.image_bucket = s3.Bucket(
            self, "ProductImagesBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN
        )

        # CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self, "ImageCDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.image_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True
        )

        CfnOutput(
            self, "BucketName",
            value=self.image_bucket.bucket_name,
            export_name="ProductImagesBucketName"
        )

        CfnOutput(
            self, "CloudFrontDomain",
            value=self.distribution.distribution_domain_name,
            export_name="CloudFrontDistributionDomain"
        )
```

## File: lib/monitoring_stack.py

```python
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack
)
from constructs import Construct

class MonitoringStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str,
                 asg: autoscaling.AutoScalingGroup,
                 alb: elbv2.ApplicationLoadBalancer,
                 target_group: elbv2.ApplicationTargetGroup, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "MarketplaceDashboard",
            dashboard_name="MarketplaceMetrics"
        )

        # Add widgets
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[target_group.metric_request_count()]
            ),
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[target_group.metric_target_response_time()]
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="EC2 CPU Utilization",
                left=[asg.metric_cpu_utilization()]
            ),
            cloudwatch.GraphWidget(
                title="Healthy Host Count",
                left=[target_group.metric_healthy_host_count()]
            )
        )

        # CPU Utilization Alarm
        cloudwatch.Alarm(
            self, "HighCPUAlarm",
            metric=asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            alarm_description="Alert when CPU exceeds 80%"
        )

        # Request Count Alarm
        cloudwatch.Alarm(
            self, "HighRequestCountAlarm",
            metric=target_group.metric_request_count(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10000,
            evaluation_periods=1,
            alarm_description="Alert when request count is high"
        )

        # Unhealthy Host Alarm
        cloudwatch.Alarm(
            self, "UnhealthyHostAlarm",
            metric=target_group.metric_unhealthy_host_count(),
            threshold=1,
            evaluation_periods=2,
            alarm_description="Alert when unhealthy hosts detected"
        )
```

## File: lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from lib.vpc_stack import VpcStack
from lib.security_groups_stack import SecurityGroupsStack
from lib.alb_stack import ALBStack
from lib.autoscaling_stack import AutoScalingStack
from lib.rds_stack import RDSStack
from lib.elasticache_stack import ElastiCacheStack
from lib.s3_cloudfront_stack import S3CloudFrontStack
from lib.monitoring_stack import MonitoringStack


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create VPC Stack
    vpc_stack = VpcStack(
        self,
        f"VpcStack{environment_suffix}",
        env=props.env if props else None
    )

    # Create Security Groups
    security_groups = SecurityGroupsStack(
        self,
        f"SecurityGroups{environment_suffix}",
        vpc=vpc_stack.vpc
    )

    # Create ALB
    alb_stack = ALBStack(
        self,
        f"ALBStack{environment_suffix}",
        vpc=vpc_stack.vpc,
        security_group=security_groups.alb_sg
    )

    # Create Auto Scaling Group
    asg_stack = AutoScalingStack(
        self,
        f"AutoScalingStack{environment_suffix}",
        vpc=vpc_stack.vpc,
        security_group=security_groups.ec2_sg,
        target_group=alb_stack.target_group
    )

    # Create RDS Aurora
    rds_stack = RDSStack(
        self,
        f"RDSStack{environment_suffix}",
        vpc=vpc_stack.vpc,
        security_group=security_groups.db_sg
    )

    # Create ElastiCache
    elasticache_stack = ElastiCacheStack(
        self,
        f"ElastiCacheStack{environment_suffix}",
        vpc=vpc_stack.vpc,
        security_group=security_groups.redis_sg
    )

    # Create S3 and CloudFront
    s3_cloudfront_stack = S3CloudFrontStack(
        self,
        f"S3CloudFrontStack{environment_suffix}"
    )

    # Create Monitoring
    monitoring_stack = MonitoringStack(
        self,
        f"MonitoringStack{environment_suffix}",
        asg=asg_stack.asg,
        alb=alb_stack.alb,
        target_group=alb_stack.target_group
    )
```

This infrastructure provides a complete three-tier architecture for your marketplace platform with all the required components including Aurora Serverless v2 with multi-AZ deployment, ElastiCache Redis with 6 shards in cluster mode, and proper monitoring with CloudWatch.