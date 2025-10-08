"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional, Tuple

import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
    Duration,
    NestedStack,
    RemovalPolicy,
    aws_autoscaling as autoscaling,
    aws_cloudwatch as cloudwatch,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_rds as rds,
    aws_s3 as s3,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """TapStackProps defines configuration for the TapStack CDK stack."""

    def __init__(
            self,
            environment_suffix: Optional[str] = None,
            environment: Optional[str] = None,
            project_name: Optional[str] = None,
            owner: Optional[str] = None,
            **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.project_name = project_name
        self.owner = owner


class HighAvailabilityWebAppStack(NestedStack):
    """Nested stack implementing a high availability web application architecture."""

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            *,
            environment_name: str,
            project_name: str,
            owner: str,
            **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_name = environment_name
        self.project_name = project_name
        self.owner_name = owner

        vpc = self._create_vpc()
        alb_sg, ec2_sg, rds_sg = self._create_security_groups(vpc)
        log_bucket = self._create_log_bucket()
        ec2_role = self._create_ec2_role(log_bucket)
        database = self._create_rds_database(vpc, rds_sg)
        alb = self._create_application_load_balancer(vpc, alb_sg, log_bucket)
        asg = self._create_auto_scaling_group(vpc, ec2_sg, ec2_role, alb, database)
        backup_lambda = self._create_backup_lambda(database, vpc)
        self._create_cloudwatch_alarms(asg)

        self.vpc = vpc
        self.log_bucket = log_bucket
        self.ec2_role = ec2_role
        self.database = database
        self.application_load_balancer = alb
        self.auto_scaling_group = asg
        self.backup_lambda = backup_lambda
        self.alb_dns_name = alb.load_balancer_dns_name

        CfnOutput(
            self,
            "ALBDNSName",
            value=self.alb_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"{self.stack_name}-alb-dns")

    def _create_vpc(self) -> ec2.Vpc:
        return ec2.Vpc(
            self,
            "HaVpc",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24)])

    def _create_security_groups(self, vpc: ec2.Vpc) -> Tuple[ec2.SecurityGroup, ec2.SecurityGroup, ec2.SecurityGroup]:
        alb_sg = ec2.SecurityGroup(
            self,
            "AlbSecurityGroup",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True)
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from internet")

        ec2_sg = ec2.SecurityGroup(
            self,
            "Ec2SecurityGroup",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True)
        ec2_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB")
        ec2_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access")

        rds_sg = ec2.SecurityGroup(
            self,
            "RdsSecurityGroup",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=False)
        rds_sg.add_ingress_rule(
            peer=ec2_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL connections from EC2 instances")

        return alb_sg, ec2_sg, rds_sg

    def _create_log_bucket(self) -> s3.Bucket:
        bucket_name = "-".join([
            self.project_name.lower(),
            self.environment_name.lower(),
            "logs",
            self.account,
            self.region])

        return s3.Bucket(
            self,
            "ApplicationLogBucket",
            bucket_name=bucket_name,
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30))])],
            removal_policy=RemovalPolicy.RETAIN)

    def _create_ec2_role(self, log_bucket: s3.Bucket) -> iam.Role:
        role = iam.Role(
            self,
            "Ec2InstanceRole",
            role_name=f"{self.project_name}-{self.environment_name}-Ec2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances in the web application",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")])
        log_bucket.grant_write(role)
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["secretsmanager:GetSecretValue", "kms:Decrypt"],
                resources=["*"],
                effect=iam.Effect.ALLOW))
        return role

    def _create_rds_database(
            self,
            vpc: ec2.Vpc,
            rds_sg: ec2.SecurityGroup) -> rds.DatabaseInstance:
        subnet_group = rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            removal_policy=RemovalPolicy.DESTROY)

        return rds.DatabaseInstance(
            self,
            "ApplicationDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.of("16.9", "16")),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[rds_sg],
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            database_name="webapp",
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=self.environment_name.lower() == "prod",
            removal_policy=RemovalPolicy.SNAPSHOT,
            cloudwatch_logs_exports=["postgresql"],
            subnet_group=subnet_group)

    def _create_application_load_balancer(
            self,
            vpc: ec2.Vpc,
            alb_sg: ec2.SecurityGroup,
            log_bucket: s3.Bucket) -> elbv2.ApplicationLoadBalancer:
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "ApplicationLoadBalancer",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC))
        if not cdk.Token.is_unresolved(self.region):
            alb.log_access_logs(log_bucket, prefix="alb-logs")
        return alb

    def _create_auto_scaling_group(
            self,
            vpc: ec2.Vpc,
            ec2_sg: ec2.SecurityGroup,
            ec2_role: iam.Role,
            alb: elbv2.ApplicationLoadBalancer,
            database: rds.DatabaseInstance) -> autoscaling.AutoScalingGroup:
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>High Availability Web App</h1>' > /var/www/html/index.html",
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            "yum install -y mysql",
            f"echo 'export DB_ENDPOINT={database.instance_endpoint.hostname}' >> /etc/environment")

        asg = autoscaling.AutoScalingGroup(
            self,
            "WebServerAutoScalingGroup",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            min_capacity=2,
            max_capacity=6,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_group=ec2_sg,
            role=ec2_role,
            user_data=user_data,
            health_checks=autoscaling.HealthChecks.with_additional_checks(
                additional_types=[autoscaling.AdditionalHealthCheckType.ELB],
                grace_period=Duration.minutes(5)))

        listener = alb.add_listener("HttpListener", port=80, open=True)
        listener.add_targets(
            "WebServerTargets",
            port=80,
            targets=[asg],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30)))

        asg.scale_on_cpu_utilization("ScaleOnCpu", target_utilization_percent=70)
        return asg

    def _create_backup_lambda(
            self,
            database: rds.DatabaseInstance,
            vpc: ec2.Vpc) -> lambda_.Function:
        lambda_role = iam.Role(
            self,
            "BackupLambdaRole",
            role_name=f"{self.project_name}-{self.environment_name}-BackupLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")])
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "rds:CreateDBSnapshot",
                    "rds:DescribeDBInstances",
                    "rds:DescribeDBSnapshots",
                    "rds:DeleteDBSnapshot",
                    "rds:ListTagsForResource"],
                resources=[
                    f"arn:aws:rds:{self.region}:{self.account}:db:{database.instance_identifier}",
                    f"arn:aws:rds:{self.region}:{self.account}:snapshot:*"],
                effect=iam.Effect.ALLOW))

        backup_lambda = lambda_.Function(
            self,
            "RdsBackupFunction",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline(
                """
    import boto3
    import os
    from datetime import datetime
    
    
    def handler(event, context):
        # Create a manual snapshot of the RDS database and prune old snapshots.
        rds_client = boto3.client('rds')
        db_instance_id = os.environ['DB_INSTANCE_ID']
        snapshot_id = f"{db_instance_id}-backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
        try:
            rds_client.create_db_snapshot(
                DBSnapshotIdentifier=snapshot_id,
                DBInstanceIdentifier=db_instance_id,
                Tags=[
                    {'Key': 'Type', 'Value': 'Automated'},
                    {'Key': 'Environment', 'Value': os.environ['ENVIRONMENT']},
                    {'Key': 'Owner', 'Value': os.environ['OWNER']}
                ]
            )
    
            snapshots = rds_client.describe_db_snapshots(
                DBInstanceIdentifier=db_instance_id,
                SnapshotType='manual'
            )
    
            for snapshot in snapshots.get('DBSnapshots', []):
                age = datetime.utcnow() - snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                if age.days > 30:
                    try:
                        rds_client.delete_db_snapshot(DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier'])
                    except Exception as delete_error:  # noqa: BLE001
                        print(f"Error deleting snapshot {snapshot['DBSnapshotIdentifier']}: {delete_error}")
    
            return {
                'statusCode': 200,
                'body': f'Successfully created snapshot: {snapshot_id}'
            }
    
        except Exception as creation_error:  # noqa: BLE001
            print(f"Error creating snapshot: {creation_error}")
            return {
                'statusCode': 500,
                'body': f'Error creating snapshot: {creation_error}'
            }
    """),
            handler="index.handler",
            role=lambda_role,
            timeout=Duration.minutes(5),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            environment={
                "DB_INSTANCE_ID": database.instance_identifier,
                "ENVIRONMENT": self.environment_name,
                "OWNER": self.owner_name})

        backup_rule = events.Rule(
            self,
            "DailyBackupRule",
            schedule=events.Schedule.cron(minute="0", hour="2", month="*", week_day="*"))
        backup_rule.add_target(targets.LambdaFunction(backup_lambda))
        return backup_lambda

    def _create_cloudwatch_alarms(self, asg: autoscaling.AutoScalingGroup) -> None:
        cpu_metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name},
            statistic="Average",
            period=Duration.minutes(5))

        cpu_alarm = cloudwatch.Alarm(
            self,
            "HighCpuAlarm",
            metric=cpu_metric,
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when CPU utilization exceeds 80%")

        memory_metric = cloudwatch.Metric(
            namespace="CWAgent",
            metric_name="mem_used_percent",
            dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name})
        memory_alarm = cloudwatch.Alarm(
            self,
            "HighMemoryAlarm",
            metric=memory_metric,
            threshold=85,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when memory utilization exceeds 85%")

        low_cpu_alarm = cloudwatch.Alarm(
            self,
            "LowCpuAlarm",
            metric=cpu_metric,
            threshold=20,
            evaluation_periods=3,
            datapoints_to_alarm=3,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            alarm_description="Alarm when CPU utilization is below 20%")


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
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
                                 props.environment_suffix if props else None
                             ) or self.node.try_get_context('environmentSuffix') or 'dev'

        environment_name = (
                               props.environment if props else None
                           ) or self.node.try_get_context('environment') or environment_suffix

        project_name = (
                           props.project_name if props else None
                       ) or self.node.try_get_context('projectName') or 'TapProject'

        owner_name = (
                         props.owner if props else None
                     ) or self.node.try_get_context('owner') or 'TapTeam'

        self.environment_suffix = environment_suffix
        self.environment_name = environment_name
        self.project_name = project_name
        self.owner_name = owner_name

        cdk.Tags.of(self).add('Environment', self.environment_name)
        cdk.Tags.of(self).add('Project', self.project_name)
        cdk.Tags.of(self).add('Owner', self.owner_name)

        self.high_availability_web_app = HighAvailabilityWebAppStack(
            self,
            f"HighAvailabilityWebApp{environment_suffix.capitalize()}",
            environment_name=self.environment_name+"-"+self.environment_suffix,
            project_name=self.project_name,
            owner=self.owner_name)

        self.alb_dns_name = self.high_availability_web_app.alb_dns_name

        # Export outputs from nested stack to parent stack
        CfnOutput(
            self,
            "VpcId",
            value=self.high_availability_web_app.vpc.vpc_id,
            description="VPC ID")

        CfnOutput(
            self,
            "AlbDnsName",
            value=self.high_availability_web_app.alb_dns_name,
            description="DNS name of the Application Load Balancer")

        CfnOutput(
            self,
            "RdsEndpoint",
            value=self.high_availability_web_app.database.db_instance_endpoint_address,
            description="RDS database endpoint")
