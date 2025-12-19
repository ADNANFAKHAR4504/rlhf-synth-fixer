```python
"""tap_stack.py
Main CDK stack for the TAP project: VPC, ALB (HTTP/HTTPS), ASG, and RDS PostgreSQL.
"""
from typing import Optional, Tuple

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnParameter,
    CfnOutput,
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_iam as iam,
    Tags,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Props for TapStack."""
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """Single stack deploying VPC, ALB, ASG, and RDS (us-east-1)."""

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (props.environment_suffix if props else None) or self.node.try_get_context(
            "environmentSuffix"
        ) or "dev"
        _ = environment_suffix  # reserved for future naming/tagging

        # ACM cert must be in the same region as ALB (you’re using us-east-1)
        self.certificate_arn = CfnParameter(
            self,
            "CertificateArn",
            type="String",
            description="ARN of the SSL certificate for HTTPS listener (must be in same region)",
            default="arn:aws:acm:us-east-1:718240086340:certificate/7a4b6a21-64e6-44a7-a384-77ad01122cdb",
        )

        # Networking
        self.vpc = self._create_vpc()

        # Security Groups
        self.alb_sg, self.app_sg, self.rds_sg = self._create_security_groups()

        # IAM for EC2
        self.ec2_role = self._create_ec2_role()

        # RDS
        self.rds_instance = self._create_rds_database()

        # ALB + Listeners
        self.alb = self._create_application_load_balancer()

        # ASG
        self.asg = self._create_auto_scaling_group()

        # Target group + listeners
        self._create_alb_listeners()

        # Tags & Outputs
        self._add_tags()
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """VPC with 2 public + 2 private subnets across 2 AZs."""
        return ec2.Vpc(
            self,
            "TapVpc",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="PublicSubnet",
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="PrivateSubnet",
                    cidr_mask=24,
                ),
            ],
        )

    def _create_security_groups(self) -> Tuple[ec2.SecurityGroup, ec2.SecurityGroup, ec2.SecurityGroup]:
        """Least-privilege SGs for ALB, app, and DB."""
        alb_sg = ec2.SecurityGroup(
            self,
            "AlbSecurityGroup",
            vpc=self.vpc,
            description="SG for ALB: allow 80/443 from internet; egress to app on 80",
            allow_all_outbound=False,
        )
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "HTTP from internet")
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS from internet")

        app_sg = ec2.SecurityGroup(
            self,
            "AppSecurityGroup",
            vpc=self.vpc,
            description="SG for EC2 instances",
            allow_all_outbound=True,
        )
        # REQUIRED because allow_all_outbound=False; ALB must reach targets on 80
        alb_sg.add_egress_rule(app_sg, ec2.Port.tcp(80), "Egress to app on 80")

        app_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(80), "HTTP from ALB")
        app_sg.add_ingress_rule(ec2.Peer.ipv4("192.168.1.0/24"), ec2.Port.tcp(22), "SSH from management CIDR")

        rds_sg = ec2.SecurityGroup(
            self,
            "RdsSecurityGroup",
            vpc=self.vpc,
            description="SG for RDS PostgreSQL",
            allow_all_outbound=False,
        )
        rds_sg.add_ingress_rule(app_sg, ec2.Port.tcp(5432), "PostgreSQL from app")

        return alb_sg, app_sg, rds_sg

    def _create_ec2_role(self) -> iam.Role:
        """EC2 role with SSM."""
        role = iam.Role(
            self,
            "Ec2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for EC2 with SSM access",
        )
        role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"))
        return role

    def _create_rds_database(self) -> rds.DatabaseInstance:
        """RDS PostgreSQL in private subnets; engine 13.22; encrypted; class db.t3.micro."""
        db_subnet_group = rds.SubnetGroup(
            self,
            "DbSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Prefer enum if available; fallback to of("13", "22") for cross-version compatibility
        pg_version = getattr(rds.PostgresEngineVersion, "VER_13_22", None)
        if pg_version is None:
            pg_version = rds.PostgresEngineVersion.of("13", "22")

        return rds.DatabaseInstance(
            self,
            "PostgresDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(version=pg_version),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),  # db.t3.micro
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.rds_sg],
            publicly_accessible=False,
            storage_encrypted=True,
            database_name="webapp",
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            backup_retention=cdk.Duration.days(7),
            deletion_protection=False,  # set True for production
        )

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Internet-facing ALB."""
        return elbv2.ApplicationLoadBalancer(
            self,
            "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """ASG: t3.micro, min=2, max=5, private subnets."""
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html",
            "chkconfig httpd on",
        )

        launch_template = ec2.LaunchTemplate(
            self,
            "LaunchTemplate",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),  # t3.micro
            machine_image=ec2.AmazonLinuxImage(generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2),
            security_group=self.app_sg,
            role=self.ec2_role,
            user_data=user_data,
        )

        return autoscaling.AutoScalingGroup(
            self,
            "AutoScalingGroup",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=5,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

    def _create_alb_listeners(self) -> None:
        """Target group + HTTP(80) and HTTPS(443) listeners."""
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "AppTargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(enabled=True, healthy_http_codes="200", path="/"),
        )

        self.asg.attach_to_application_target_group(target_group)

        self.alb.add_listener(
            "HttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group]),
        )

        self.alb.add_listener(
            "HttpsListener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[elbv2.ListenerCertificate.from_arn(self.certificate_arn.value_as_string)],
            default_action=elbv2.ListenerAction.forward([target_group]),
        )

    def _add_tags(self) -> None:
        """Apply common tags."""
        Tags.of(self).add("Project", "WebApp")
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("ManagedBy", "CDK")

    def _create_outputs(self) -> None:
        """Export key outputs."""
        CfnOutput(self, "AlbDnsName", value=self.alb.load_balancer_dns_name, description="ALB DNS")
        CfnOutput(self, "DbEndpoint", value=self.rds_instance.instance_endpoint.hostname, description="RDS endpoint")

```