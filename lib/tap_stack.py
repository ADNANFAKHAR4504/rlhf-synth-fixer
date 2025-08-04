# pylint: disable=C0111,C0103,C0303,W0511,R0903,R0913,R0914,R0915

from aws_cdk import (
  aws_ec2 as ec2,
  aws_autoscaling as autoscaling,
  aws_elasticloadbalancingv2 as elbv2,
  aws_elasticloadbalancingv2_actions as elbv2_actions,
  aws_iam as iam,
  aws_s3 as s3,
  aws_certificatemanager as acm,
  Duration,
  NestedStack,
  Stack,
  CfnOutput
)
from constructs import Construct


class TapStackProps(NestedStack):
  def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev", **kwargs):
    super().__init__(scope, id, **kwargs)

    # S3 bucket with security best practices
    self.log_bucket = s3.Bucket(self, f"AppLogsBucket-{environment_suffix}",
      encryption=s3.BucketEncryption.S3_MANAGED,
      versioned=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          expiration=Duration.days(90),
          transitions=[
            s3.Transition(
              transition_after=Duration.days(30),
              storage_class=s3.StorageClass.INFREQUENT_ACCESS
            )
          ]
        )
      ]
    )

    # IAM role
    self.ec2_role = iam.Role(self, f"EC2Role-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      description="IAM role for EC2 instances with access to app logs bucket"
    )
    self.log_bucket.grant_read_write(self.ec2_role)

    # VPC
    self.vpc = ec2.Vpc(self, f"AppVPC-{environment_suffix}",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="PublicSubnet",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        )
      ],
      nat_gateways=0
    )

    # Restrictive Security Group
    self.security_group = ec2.SecurityGroup(self, f"InstanceSG-{environment_suffix}", vpc=self.vpc)
    self.security_group.add_ingress_rule(
      ec2.Peer.ipv4("10.0.0.0/16"),
      ec2.Port.tcp(80),
      "Allow HTTP access from internal CIDR block"
    )

    # Auto Scaling Group
    ami = ec2.MachineImage.latest_amazon_linux2()
    self.asg = autoscaling.AutoScalingGroup(self, f"AppASG-{environment_suffix}",
      vpc=self.vpc,
      instance_type=ec2.InstanceType("t3.micro"),
      machine_image=ami,
      role=self.ec2_role,
      security_group=self.security_group,
      min_capacity=1,
      max_capacity=3,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
    )

    # ACM Certificate
    self.certificate = acm.Certificate(self, f"AppCert-{environment_suffix}",
      domain_name="example.com",
      validation=acm.CertificateValidation.from_dns()
    )

    # ALB with HTTPS listener
    self.alb = elbv2.ApplicationLoadBalancer(self, f"AppALB-{environment_suffix}",
      vpc=self.vpc,
      internet_facing=True
    )

    self.listener = self.alb.add_listener(f"Listener-{environment_suffix}",
      port=443,
      certificates=[self.certificate],
      default_action=elbv2.ListenerAction.forward([self.asg])
    )

    # Outputs
    CfnOutput(self, f"LogBucketName-{environment_suffix}",
      value=self.log_bucket.bucket_name,
      export_name=f"LogBucketName-{environment_suffix}"
    )

    CfnOutput(self, f"EC2RoleName-{environment_suffix}",
      value=self.ec2_role.role_name,
      export_name=f"EC2RoleName-{environment_suffix}"
    )

    CfnOutput(self, f"ASGName-{environment_suffix}",
      value=self.asg.auto_scaling_group_name,
      export_name=f"ASGName-{environment_suffix}"
    )

    CfnOutput(self, f"ALBDNS-{environment_suffix}",
      value=self.alb.load_balancer_dns_name,
      export_name=f"ALBDNS-{environment_suffix}"
    )

    CfnOutput(self, f"VPCId-{environment_suffix}",
      value=self.vpc.vpc_id,
      export_name=f"VPCId-{environment_suffix}"
    )

    CfnOutput(self, f"SecurityGroupId-{environment_suffix}",
      value=self.security_group.security_group_id,
      export_name=f"SecurityGroupId-{environment_suffix}"
    )


class TapStack(Stack):
  def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev", **kwargs):
    super().__init__(scope, id, **kwargs)

    TapStackProps(self, f"{id}Props", environment_suffix=environment_suffix)
