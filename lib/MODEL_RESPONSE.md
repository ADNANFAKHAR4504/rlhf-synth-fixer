Below is a Python AWS CDK script that sets up the described infrastructure. This example assumes familiarity with AWS CDK and Python.

from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_wafv2 as wafv2,
    core
)

class RegionalRedundantStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, region: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # VPC with public and private subnets
        vpc = ec2.Vpc(self, f"VPC-{region}",
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC),
                ec2.SubnetConfiguration(name="PrivateSubnet", subnet_type=ec2.SubnetType.PRIVATE)
            ]
        )

        # Security Group for EC2
        ec2_sg = ec2.SecurityGroup(self, f"EC2SecurityGroup-{region}", vpc=vpc, allow_all_outbound=True)
        ec2_sg.add_ingress_rule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(22), 'Allow SSH from management subnet')

        # RDS Security Group
        rds_sg = ec2.SecurityGroup(self, f"RDSSecurityGroup-{region}", vpc=vpc)
        rds_sg.add_ingress_rule(ec2_sg, ec2.Port.tcp(5432), 'Allow EC2 to RDS')

        # RDS Instance
        rds_instance = rds.DatabaseInstance(self, f"RDS-{region}",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_12_3),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            vpc=vpc,
            multi_az=True,
            backup_retention=core.Duration.days(7),
            security_groups=[rds_sg],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE)
        )

        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(self, f"ASG-{region}",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            machine_image=ec2.AmazonLinuxImage(),
            min_capacity=2,
            max_capacity=10,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE),
            security_group=ec2_sg
        )

        # Load Balancer
        alb = elbv2.ApplicationLoadBalancer(self, f"ALB-{region}",
            vpc=vpc,
            internet_facing=True
        )

        listener = alb.add_listener("Listener", port=80)
        listener.add_targets("Targets", port=80, targets=[asg])
        listener.connections.allow_default_port_from_any_ipv4("Open to the world")

        # S3 Bucket
        bucket = s3.Bucket(self, f"S3Bucket-{region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED
        )

        # Lambda Function
        lambda_fn = _lambda.Function(self, f"Lambda-{region}",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="index.handler",
            code=_lambda.Code.from_inline("def handler(event, context): pass")
        )

        # IAM Role
        role = iam.Role(self, f"IAMRole-{region}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com")
        )

        # CloudWatch Alarms
        cloudwatch.Alarm(self, f"CPUAlarm-{region}",
            metric=asg.metric_cpu_utilization(),
            evaluation_periods=2,
            threshold=80
        )

        # Route 53
        zone = route53.HostedZone(self, f"HostedZone-{region}", zone_name="example.com")
        route53.ARecord(self, f"AliasRecord-{region}",
            zone=zone,
            target=route53.RecordTarget.from_alias(targets.LoadBalancerTarget(alb))
        )

        # Tagging
        core.Tags.of(self).add("Environment", "Production")
        core.Tags.of(self).add("Team", "DevOps")

app = core.App()

regions = ['us-east-1', 'us-west-2']  # Example regions

for region in regions:
    env = core.Environment(region=region)
    RegionalRedundantStack(app, f"RegionalStack-{region}", region=region, env=env)

app.synth()
This script covers the creation of VPCs, subnets, security groups, RDS, Auto Scaling Groups, Load Balancers, S3 buckets, Lambda functions, IAM roles, and Route 53 configurations. It also includes basic CloudWatch alarms and tagging.

Important Considerations:

Security: Ensure that the SSH access IP range is correctly specified.
Cost: Monitor and manage costs associated with multi-AZ deployments and data transfer.
Compliance: Adjust encryption and access policies to comply with organizational standards.
This script is a starting point and should be customized to fit specific needs and best practices.