
# CDK Python Stack - Secure Infrastructure

This CDK Python stack creates a secure infrastructure with VPC, EC2, CloudTrail, and proper security configurations.

## tap_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    Tags,
    RemovalPolicy,
)
from constructs import Construct

class TuringOneStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ----------------------
        # Tags (Global Tags)
        # ----------------------
        Tags.of(self).add("Project", "SecureInfra")
        Tags.of(self).add("Environment", "Production")

        # ----------------------
        # VPC Configuration
        # ----------------------
        vpc = ec2.Vpc(
            self, "SecureVpc",
            max_azs=2,
            nat_gateways=1,
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
                )
            ]
        )

        # ----------------------
        # IAM Role for EC2
        # ----------------------
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com")
        )

        ec2_role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"))
        ec2_role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"))

        # ----------------------
        # Security Groups
        # ----------------------
        lb_sg = ec2.SecurityGroup(
            self, "LBSecurityGroup",
            vpc=vpc,
            description="Security group for Load Balancer",
            allow_all_outbound=True
        )
        lb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP from anywhere")

        ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=vpc,
            description="Security group for EC2 instance",
            allow_all_outbound=True
        )
        ec2_sg.add_ingress_rule(lb_sg, ec2.Port.tcp(80), "Allow HTTP from Load Balancer")

        # ----------------------
        # EC2 Instance
        # ----------------------
        ec2_instance = ec2.Instance(
            self, "WebServerInstance",
            instance_type=ec2.InstanceType("t3.micro"),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=ec2_sg,
            role=ec2_role
        )

        # ----------------------
        # CloudTrail for Logging
        # ----------------------
        cloudtrail_log_group = logs.LogGroup(
            self, "CloudTrailLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        trail = cloudtrail.Trail(
            self, "SecureCloudTrail",
            send_to_cloud_watch_logs=True,
            cloud_watch_log_group=cloudtrail_log_group
        )
        trail.log_all_s3_data_events()

        # ----------------------
        # CloudWatch Log Group for EC2 logs
        # ----------------------
        ec2_log_group = logs.LogGroup(
            self, "EC2LogGroup",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ----------------------
        # Tagging Resources
        # ----------------------
        Tags.of(ec2_instance).add("Name", "WebServer")
        Tags.of(ec2_sg).add("Component", "EC2-Web")
        Tags.of(lb_sg).add("Component", "LoadBalancer")
        Tags.of(trail).add("Component", "CloudTrail")
        Tags.of(vpc).add("Component", "Networking")
```
