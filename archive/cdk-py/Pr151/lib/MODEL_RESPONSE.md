from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    core
)

class SecureInfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # VPC Configuration
        vpc = ec2.Vpc(
            self, "SecureVPC",
            max_azs=2,
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE,
                    cidr_mask=24
                )
            ],
            nat_gateways=1
        )

        # Security Groups
        ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            vpc=vpc,
            allow_all_outbound=False,
            description="Security group for EC2 instances"
        )

        # Allow inbound HTTP traffic from anywhere
        ec2_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from the internet"
        )

        # Allow outbound traffic to CloudWatch Logs
        ec2_sg.add_egress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow outbound HTTPS for CloudWatch Logs"
        )

        # EC2 Role and SSM Managed Policy
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # EC2 Instance
        ec2_instance = ec2.Instance(
            self, "PublicEC2Instance",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machine_image=ec2.AmazonLinuxImage(),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=ec2_sg,
            role=ec2_role
        )

        # CloudWatch Log Group
        log_group = logs.LogGroup(
            self, "EC2InstanceLogGroup",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=core.RemovalPolicy.DESTROY
        )

        # CloudTrail
        trail = cloudtrail.Trail(
            self, "CloudTrail",
            send_to_cloud_watch_logs=True
        )

        # Tagging all resources
        core.Tags.of(self).add("Project", "SecureInfrastructure")
        core.Tags.of(vpc).add("Name", "SecureVPC")
        core.Tags.of(ec2_instance).add("Name", "PublicEC2Instance")

app = core.App()
SecureInfrastructureStack(app, "SecureInfrastructureStack")
app.synth()