import aws_cdk as cdk
from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  CfnOutput,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
  aws_autoscaling as autoscaling,
  aws_rds as rds,
  aws_secretsmanager as secretsmanager,
  aws_iam as iam,
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

    # VPC with public, private, and isolated subnets
    # Note: Using PRIVATE_ISOLATED instead of PRIVATE_WITH_EGRESS to avoid NAT Gateway
    # which has limited support in LocalStack Community edition
    vpc = ec2.Vpc(
      self, f"tap-vpc-{environment_suffix}",
      ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
      max_azs=2,  # Reduced for LocalStack compatibility
      nat_gateways=0,  # Disable NAT Gateways for LocalStack
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name=f"tap-public-{environment_suffix}",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
          name=f"tap-private-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,  # Changed from PRIVATE_WITH_EGRESS
          cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
          name=f"tap-db-{environment_suffix}",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
          cidr_mask=24,
        ),
      ],
      enable_dns_hostnames=True,
      enable_dns_support=True,
    )

    # Security Groups
    alb_sg = ec2.SecurityGroup(
      self, f"tap-alb-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for Application Load Balancer",
      allow_all_outbound=True,
    )
    alb_sg.add_ingress_rule(
      peer=ec2.Peer.any_ipv4(),
      connection=ec2.Port.tcp(80),
      description="Allow HTTP for health checks",
    )

    ec2_sg = ec2.SecurityGroup(
      self, f"tap-ec2-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for EC2 instances",
      allow_all_outbound=True,
    )
    ec2_sg.add_ingress_rule(
      peer=alb_sg,
      connection=ec2.Port.tcp(80),
      description="Allow HTTP traffic from ALB",
    )
    ec2_sg.add_ingress_rule(
      peer=ec2.Peer.ipv4("10.0.0.0/16"),
      connection=ec2.Port.tcp(22),
      description="Allow SSH access from VPC",
    )

    rds_sg = ec2.SecurityGroup(
      self, f"tap-rds-sg-{environment_suffix}",
      vpc=vpc,
      description="Security group for RDS database",
      allow_all_outbound=False,
    )
    rds_sg.add_ingress_rule(
      peer=ec2_sg,
      connection=ec2.Port.tcp(3306),
      description="Allow MySQL traffic from EC2 instances",
    )

    # RDS Subnet Group
    db_subnet_group = rds.SubnetGroup(
      self, f"tap-db-subnet-group-{environment_suffix}",
      description="Subnet group for RDS database",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
      ),
    )

    # Secrets Manager for DB credentials
    db_secret = rds.DatabaseSecret(
      self, f"tap-db-credentials-{environment_suffix}",
      secret_name=f"tap-{environment_suffix}/db-credentials",
      username="admin"
    )

    # RDS MySQL Instance
    database = rds.DatabaseInstance(
      self, f"tap-database-{environment_suffix}",
      instance_identifier=f"tap-{environment_suffix}-database",
      engine=rds.DatabaseInstanceEngine.mysql(
        # Use a version available in us-west-2
        version=rds.MysqlEngineVersion.VER_8_0
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      credentials=rds.Credentials.from_secret(db_secret),
      vpc=vpc,
      subnet_group=db_subnet_group,
      security_groups=[rds_sg],
      # Avoid Multi-AZ with a micro instance to prevent deployment failures
      multi_az=False,
      storage_encrypted=True,
      allocated_storage=20,
      max_allocated_storage=100,
      backup_retention=Duration.days(7),
      deletion_protection=False,
      removal_policy=RemovalPolicy.DESTROY,
      parameter_group=rds.ParameterGroup.from_parameter_group_name(
        self, "DefaultParameterGroup", "default.mysql8.0"
      ),
      auto_minor_version_upgrade=True,
      delete_automated_backups=True
    )

    # Application Load Balancer
    alb = elbv2.ApplicationLoadBalancer(
      self, f"tap-alb-{environment_suffix}",
      vpc=vpc,
      internet_facing=True,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PUBLIC
      ),
      security_group=alb_sg,
    )

    # Target Group
    target_group = elbv2.ApplicationTargetGroup(
      self, f"tap-tg-{environment_suffix}",
      port=80,
      protocol=elbv2.ApplicationProtocol.HTTP,
      vpc=vpc,
      health_check=elbv2.HealthCheck(
        enabled=True,
        healthy_http_codes="200",
        interval=Duration.seconds(30),
        path="/health",
        timeout=Duration.seconds(5),
        unhealthy_threshold_count=2,
        healthy_threshold_count=5,
      ),
      target_type=elbv2.TargetType.INSTANCE,
    )

    alb.add_listener(
      f"tap-http-listener-{environment_suffix}",
      port=80,
      protocol=elbv2.ApplicationProtocol.HTTP,
      default_target_groups=[target_group],
    )

    # IAM Role for EC2
    ec2_role = iam.Role(
      self, f"tap-ec2-role-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
        iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
      ],
    )
    db_secret.grant_read(ec2_role)

    # Launch Template for EC2
    user_data_script = ec2.UserData.for_linux()
    user_data_script.add_commands(
      "yum update -y",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      "echo '<h1>Hello from TAP Web Server</h1>' > /var/www/html/index.html",
      "echo 'OK' > /var/www/html/health",
      "yum install -y amazon-cloudwatch-agent",
      "yum install -y aws-cli",
    )

    launch_template = ec2.LaunchTemplate(
      self, f"tap-launch-template-{environment_suffix}",
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition=ec2.AmazonLinuxEdition.STANDARD,
        virtualization=ec2.AmazonLinuxVirt.HVM,
        storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      ),
      security_group=ec2_sg,
      role=ec2_role,
      user_data=user_data_script,
      block_devices=[
        ec2.BlockDevice(
          device_name="/dev/xvda",
          volume=ec2.BlockDeviceVolume.ebs(
            volume_size=8,
            encrypted=True,
            delete_on_termination=True,
          ),
        )
      ],
    )

    # Auto Scaling Group
    # Note: Using public subnets for LocalStack since NAT Gateway is not available
    # Using instance_type and machine_image directly instead of launch_template
    # to avoid CloudFormation LaunchTemplate.LatestVersionNumber issues
    asg = autoscaling.AutoScalingGroup(
      self, f"tap-asg-{environment_suffix}",
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(
        subnet_type=ec2.SubnetType.PUBLIC  # Changed for LocalStack compatibility
      ),
      instance_type=ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      machine_image=ec2.AmazonLinuxImage(
        generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        edition=ec2.AmazonLinuxEdition.STANDARD,
        virtualization=ec2.AmazonLinuxVirt.HVM,
        storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      ),
      security_group=ec2_sg,
      role=ec2_role,
      user_data=user_data_script,
      block_devices=[
        autoscaling.BlockDevice(
          device_name="/dev/xvda",
          volume=autoscaling.BlockDeviceVolume.ebs(
            volume_size=8,
            encrypted=True,
            delete_on_termination=True,
          ),
        )
      ],
      min_capacity=2,
      max_capacity=10,
      desired_capacity=2,
      health_check=autoscaling.HealthCheck.elb(
        grace=Duration.minutes(5)
      ),
    )
    asg.attach_to_application_target_group(target_group)

    # Single target-tracking policy handles both scale out & in
    asg.scale_on_cpu_utilization(
      f"tap-cpu-scaling-{environment_suffix}",
      target_utilization_percent=50,
      cooldown=Duration.minutes(5),
    )

    # Outputs
    CfnOutput(
      self, "LoadBalancerDNS",
      value=alb.load_balancer_dns_name,
      description="DNS name of the load balancer",
      export_name=f"tap-{environment_suffix}-alb-dns",
    )
    CfnOutput(
      self, "DatabaseEndpoint",
      value=database.instance_endpoint.hostname,
      description="RDS database endpoint",
      export_name=f"tap-{environment_suffix}-db-endpoint",
    )
    CfnOutput(
      self, "DatabaseSecretArn",
      value=db_secret.secret_arn,
      description="ARN of the database credentials secret",
      export_name=f"tap-{environment_suffix}-db-secret-arn",
    )
