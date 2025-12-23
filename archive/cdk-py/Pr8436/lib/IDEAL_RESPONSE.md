```python
from aws_cdk import (
  aws_ec2 as ec2,
  aws_autoscaling as autoscaling,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_s3 as s3,
  NestedStack,
  Stack,
  CfnOutput,
  Duration,
)
from constructs import Construct


class TapStackProps(NestedStack):
  def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev", **kwargs):
    super().__init__(scope, id, **kwargs)

    # S3 bucket for logs
    self.log_bucket = s3.Bucket(
      self,
      f"AppLogsBucket-{environment_suffix}",
      encryption=s3.BucketEncryption.S3_MANAGED,
      versioned=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          enabled=True,
          expiration=Duration.days(90),
          transitions=[
            s3.Transition(
              storage_class=s3.StorageClass.INFREQUENT_ACCESS,
              transition_after=Duration.days(30),
            )
          ],
        )
      ],
    )

    # IAM Role for EC2
    self.ec2_role = iam.Role(
      self,
      f"EC2Role-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description="IAM role for EC2 instances with access to log bucket",
    )
    self.log_bucket.grant_read_write(self.ec2_role)

    # VPC
    self.vpc = ec2.Vpc(
      self,
      f"AppVPC-{environment_suffix}",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="PublicSubnet",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24,
        )
      ],
      nat_gateways=0,
    )

    # Security group
    self.security_group = ec2.SecurityGroup(
      self,
      f"InstanceSG-{environment_suffix}",
      vpc=self.vpc,
      description="Allow HTTP",
    )
    self.security_group.add_ingress_rule(
      ec2.Peer.any_ipv4(),
      ec2.Port.tcp(80),
      "Allow HTTP access from anywhere",
    )

    # AMI
    ami = ec2.MachineImage.latest_amazon_linux2()

    # Auto Scaling Group
    self.asg = autoscaling.AutoScalingGroup(
      self,
      f"AppASG-{environment_suffix}",
      vpc=self.vpc,
      instance_type=ec2.InstanceType("t3.micro"),
      machine_image=ami,
      role=self.ec2_role,
      security_group=self.security_group,
      min_capacity=1,
      max_capacity=3,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
    )

    # Application Load Balancer
    self.alb = elbv2.ApplicationLoadBalancer(
      self,
      f"AppALB-{environment_suffix}",
      vpc=self.vpc,
      internet_facing=True,
    )

    # HTTP Listener only (port 80)
    self.listener = self.alb.add_listener(
      f"Listener-{environment_suffix}",
      port=80,
      open=True,
    )

    self.listener.add_targets(
      f"AppTargets-{environment_suffix}",
      port=80,
      targets=[self.asg],
    )

    # Outputs
    CfnOutput(
      self,
      f"LogBucketName-{environment_suffix}",
      value=self.log_bucket.bucket_name,
    )
    CfnOutput(
      self,
      f"EC2RoleName-{environment_suffix}",
      value=self.ec2_role.role_name,
    )
    CfnOutput(
      self,
      f"ASGName-{environment_suffix}",
      value=self.asg.auto_scaling_group_name,
    )
    CfnOutput(
      self,
      f"ALBDNS-{environment_suffix}",
      value=self.alb.load_balancer_dns_name,
    )
    CfnOutput(
      self,
      f"VPCId-{environment_suffix}",
      value=self.vpc.vpc_id,
    )
    CfnOutput(
      self,
      f"SecurityGroupId-{environment_suffix}",
      value=self.security_group.security_group_id,
    )


class TapStack(Stack):
  def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev", **kwargs):
    super().__init__(scope, id, **kwargs)

    TapStackProps(self, f"{id}Props", environment_suffix=environment_suffix)


```