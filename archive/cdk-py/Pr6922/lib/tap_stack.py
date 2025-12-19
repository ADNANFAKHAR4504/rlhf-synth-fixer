import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (CfnMapping, CfnOutput, CfnParameter, Duration,
                     RemovalPolicy, Stack, StackProps, Tags)
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from constructs import Construct


class TapStackProps(StackProps):
    """Properties for TapStack."""
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs) -> None:
        # Extract environment_suffix from props if provided
        env_suffix_from_props = props.environment_suffix if props and hasattr(props, 'environment_suffix') else None

        # Pass only valid StackProps to parent
        stack_props = {}
        if props:
            if hasattr(props, 'env') and props.env:
                stack_props['env'] = props.env
        stack_props.update(kwargs)

        super().__init__(scope, construct_id, **stack_props)

        # Use environment suffix from props or default to 'prod'
        environment_suffix = env_suffix_from_props or 'prod'

        # AMI mappings for Amazon Linux 2023 across regions
        ami_mapping = cdk.CfnMapping(
            self,
            "RegionAMIMap",
            mapping={
                "us-east-1": {"AMI": "ami-0c55b159cbfafe1f0"},
                "eu-west-1": {"AMI": "ami-0d71ea30463e0ff8d"},
                "ap-southeast-1": {"AMI": "ami-0dc2d3e4c0f9ebd18"},
            }
        )

        # Get AMI for current region using CfnMapping
        nat_ami = ami_mapping.find_in_map(Stack.of(self).region, "AMI")

        # Create VPC with custom CIDR
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            vpc_name=f"financial-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("172.31.0.0/16"),
            max_azs=3,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Tag VPC
        Tags.of(vpc).add("Environment", "Production")
        Tags.of(vpc).add("CostCenter", "NetworkOps")

        # Get public and private subnets
        public_subnets = vpc.public_subnets
        private_subnets = vpc.isolated_subnets

        # Create S3 bucket for VPC Flow Logs
        # NOTE: auto_delete_objects is disabled to avoid bucket policy conflicts with VPC Flow Logs
        flow_logs_bucket = s3.Bucket(
            self,
            f"flow-logs-bucket-{environment_suffix}",
            bucket_name=f"vpc-flow-logs-{self.account}-{environment_suffix}-v2",
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(90),
                )
            ],
            encryption=s3.BucketEncryption.S3_MANAGED,
        )
        Tags.of(flow_logs_bucket).add("Environment", "Production")
        Tags.of(flow_logs_bucket).add("CostCenter", "NetworkOps")

        # Create CloudWatch Log Group for VPC Flow Logs
        flow_logs_log_group = logs.LogGroup(
            self,
            f"flow-logs-log-group-{environment_suffix}",
            log_group_name=f"/aws/vpc/flowlogs/{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )
        Tags.of(flow_logs_log_group).add("Environment", "Production")
        Tags.of(flow_logs_log_group).add("CostCenter", "NetworkOps")

        # Create IAM role for VPC Flow Logs to CloudWatch
        flow_logs_role = iam.Role(
            self,
            f"flow-logs-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchLogsFullAccess"
                )
            ],
        )
        Tags.of(flow_logs_role).add("Environment", "Production")
        Tags.of(flow_logs_role).add("CostCenter", "NetworkOps")

        # Create VPC Flow Logs to S3
        ec2.CfnFlowLog(
            self,
            f"flow-log-s3-{environment_suffix}",
            resource_id=vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.bucket_arn,
            tags=[
                {"key": "Environment", "value": "Production"},
                {"key": "CostCenter", "value": "NetworkOps"},
            ],
        )

        # Create VPC Flow Logs to CloudWatch
        ec2.CfnFlowLog(
            self,
            f"flow-log-cloudwatch-{environment_suffix}",
            resource_id=vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_group_name=flow_logs_log_group.log_group_name,
            deliver_logs_permission_arn=flow_logs_role.role_arn,
            tags=[
                {"key": "Environment", "value": "Production"},
                {"key": "CostCenter", "value": "NetworkOps"},
            ],
        )

        # Create Network ACL for VPC
        network_acl = ec2.NetworkAcl(
            self,
            f"network-acl-{environment_suffix}",
            vpc=vpc,
            subnet_selection=ec2.SubnetSelection(subnets=private_subnets),
        )
        Tags.of(network_acl).add("Environment", "Production")
        Tags.of(network_acl).add("CostCenter", "NetworkOps")

        # Allow HTTP inbound
        network_acl.add_entry(
            "allow-http-inbound",
            cidr=ec2.AclCidr.ipv4("0.0.0.0/0"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(80),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW,
        )

        # Allow HTTPS inbound
        network_acl.add_entry(
            "allow-https-inbound",
            cidr=ec2.AclCidr.ipv4("0.0.0.0/0"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW,
        )

        # Allow SSH from specific CIDR
        network_acl.add_entry(
            "allow-ssh-inbound",
            cidr=ec2.AclCidr.ipv4("192.168.1.0/24"),
            rule_number=120,
            traffic=ec2.AclTraffic.tcp_port(22),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW,
        )

        # Deny all other inbound traffic
        network_acl.add_entry(
            "deny-all-inbound",
            cidr=ec2.AclCidr.ipv4("0.0.0.0/0"),
            rule_number=32766,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.DENY,
        )

        # Allow all outbound traffic
        network_acl.add_entry(
            "allow-all-outbound",
            cidr=ec2.AclCidr.ipv4("0.0.0.0/0"),
            rule_number=100,
            traffic=ec2.AclTraffic.all_traffic(),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW,
        )

        # Create NAT instances and configure routing
        nat_instances = []
        nat_instance_ids = []

        for i, (public_subnet, private_subnet) in enumerate(
            zip(public_subnets, private_subnets)
        ):
            # Security group for NAT instance
            nat_sg = ec2.SecurityGroup(
                self,
                f"nat-sg-az{i}-{environment_suffix}",
                vpc=vpc,
                description=f"Security group for NAT instance in AZ {i}",
                allow_all_outbound=True,
            )

            # Allow traffic from private subnet CIDR
            nat_sg.add_ingress_rule(
                peer=ec2.Peer.ipv4(private_subnet.ipv4_cidr_block),
                connection=ec2.Port.all_traffic(),
                description=f"Allow all traffic from private subnet AZ {i}",
            )

            Tags.of(nat_sg).add("Environment", "Production")
            Tags.of(nat_sg).add("CostCenter", "NetworkOps")

            # IAM role for NAT instance
            nat_role = iam.Role(
                self,
                f"nat-role-az{i}-{environment_suffix}",
                assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name(
                        "AmazonSSMManagedInstanceCore"
                    )
                ],
            )
            Tags.of(nat_role).add("Environment", "Production")
            Tags.of(nat_role).add("CostCenter", "NetworkOps")

            # User data to configure NAT instance
            user_data = ec2.UserData.for_linux()
            user_data.add_commands(
                "#!/bin/bash",
                "yum update -y",
                "echo 1 > /proc/sys/net/ipv4/ip_forward",
                "echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf",
                "sysctl -p /etc/sysctl.conf",
                "/sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
                "/sbin/iptables -F FORWARD",
                "yum install -y iptables-services",
                "systemctl enable iptables",
                "service iptables save",
            )

            # Create NAT instance using CfnInstance to support CfnMapping AMI
            nat_instance = ec2.Instance(
                self,
                f"nat-instance-az{i}-{environment_suffix}",
                instance_type=ec2.InstanceType("t3.micro"),
                machine_image=ec2.MachineImage.latest_amazon_linux2023(),
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(subnets=[public_subnet]),
                security_group=nat_sg,
                role=nat_role,
                user_data=user_data,
                source_dest_check=False,
            )
            Tags.of(nat_instance).add("Environment", "Production")
            Tags.of(nat_instance).add("CostCenter", "NetworkOps")
            Tags.of(nat_instance).add("Name", f"nat-instance-az{i}-{environment_suffix}")

            nat_instances.append(nat_instance)
            nat_instance_ids.append(nat_instance.instance_id)

            # Create route table for private subnet
            route_table = ec2.CfnRouteTable(
                self,
                f"private-rt-az{i}-{environment_suffix}",
                vpc_id=vpc.vpc_id,
                tags=[
                    {"key": "Name", "value": f"private-rt-az{i}-{environment_suffix}"},
                    {"key": "Environment", "value": "Production"},
                    {"key": "CostCenter", "value": "NetworkOps"},
                ],
            )

            # Add route to NAT instance
            ec2.CfnRoute(
                self,
                f"private-route-az{i}-{environment_suffix}",
                route_table_id=route_table.ref,
                destination_cidr_block="0.0.0.0/0",
                instance_id=nat_instance.instance_id,
            )

            # Associate route table with private subnet
            ec2.CfnSubnetRouteTableAssociation(
                self,
                f"private-rt-assoc-az{i}-{environment_suffix}",
                route_table_id=route_table.ref,
                subnet_id=private_subnet.subnet_id,
            )

        # Create Lambda function for NAT instance metrics
        metrics_lambda_role = iam.Role(
            self,
            f"metrics-lambda-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEC2ReadOnlyAccess"),
            ],
        )
        Tags.of(metrics_lambda_role).add("Environment", "Production")
        Tags.of(metrics_lambda_role).add("CostCenter", "NetworkOps")

        # Create Lambda function for NAT metrics
        # Note: log_retention property manages the CloudWatch Log Group automatically
        metrics_lambda = lambda_.Function(
            self,
            f"nat-metrics-lambda-{environment_suffix}",
            function_name=f"nat-metrics-publisher-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            log_retention=logs.RetentionDays.ONE_WEEK,
            code=lambda_.Code.from_inline(
                """
import boto3
import json
from datetime import datetime, timedelta

ec2 = boto3.client('ec2')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    instance_ids = event.get('instance_ids', [])

    for instance_id in instance_ids:
        try:
            # Get instance details
            response = ec2.describe_instances(InstanceIds=[instance_id])

            if not response['Reservations']:
                continue

            instance = response['Reservations'][0]['Instances'][0]

            # Get CloudWatch metrics for network
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=5)

            # Get NetworkIn metric
            network_in = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='NetworkIn',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Average', 'Sum']
            )

            # Get NetworkOut metric
            network_out = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='NetworkOut',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=['Average', 'Sum']
            )

            # Publish custom metrics
            if network_in['Datapoints']:
                avg_in = network_in['Datapoints'][0].get('Average', 0)
                cloudwatch.put_metric_data(
                    Namespace='CustomMetrics/NAT',
                    MetricData=[
                        {
                            'MetricName': 'NetworkBandwidthIn',
                            'Value': avg_in,
                            'Unit': 'Bytes',
                            'Dimensions': [
                                {'Name': 'InstanceId', 'Value': instance_id}
                            ]
                        }
                    ]
                )

            if network_out['Datapoints']:
                avg_out = network_out['Datapoints'][0].get('Average', 0)
                cloudwatch.put_metric_data(
                    Namespace='CustomMetrics/NAT',
                    MetricData=[
                        {
                            'MetricName': 'NetworkBandwidthOut',
                            'Value': avg_out,
                            'Unit': 'Bytes',
                            'Dimensions': [
                                {'Name': 'InstanceId', 'Value': instance_id}
                            ]
                        }
                    ]
                )

            print(f"Published metrics for {instance_id}")

        except Exception as e:
            print(f"Error processing {instance_id}: {str(e)}")
            continue

    return {
        'statusCode': 200,
        'body': json.dumps('Metrics published successfully')
    }
"""
            ),
            role=metrics_lambda_role,
            timeout=Duration.seconds(60),
            environment={
                "INSTANCE_IDS": ",".join(nat_instance_ids),
            },
        )
        Tags.of(metrics_lambda).add("Environment", "Production")
        Tags.of(metrics_lambda).add("CostCenter", "NetworkOps")

        # Create EventBridge rule to trigger Lambda every 5 minutes
        rule = events.Rule(
            self,
            f"nat-metrics-rule-{environment_suffix}",
            schedule=events.Schedule.rate(Duration.minutes(5)),
        )
        rule.add_target(
            targets.LambdaFunction(
                metrics_lambda,
                event=events.RuleTargetInput.from_object(
                    {"instance_ids": nat_instance_ids}
                ),
            )
        )
        Tags.of(rule).add("Environment", "Production")
        Tags.of(rule).add("CostCenter", "NetworkOps")

        # Outputs
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"vpc-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in public_subnets]),
            description="Public subnet IDs",
            export_name=f"public-subnet-ids-{environment_suffix}",
        )

        CfnOutput(
            self,
            "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in private_subnets]),
            description="Private subnet IDs",
            export_name=f"private-subnet-ids-{environment_suffix}",
        )

        CfnOutput(
            self,
            "NatInstanceIds",
            value=",".join(nat_instance_ids),
            description="NAT instance IDs",
            export_name=f"nat-instance-ids-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FlowLogsBucket",
            value=flow_logs_bucket.bucket_name,
            description="S3 bucket name for VPC Flow Logs",
            export_name=f"flow-logs-bucket-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FlowLogsLogGroup",
            value=flow_logs_log_group.log_group_name,
            description="CloudWatch Log Group name for VPC Flow Logs",
            export_name=f"flow-logs-log-group-{environment_suffix}",
        )

        # Transit Gateway attachment configuration outputs
        CfnOutput(
            self,
            "TransitGatewayAttachmentConfig",
            value=json.dumps(
                {
                    "VpcId": vpc.vpc_id,
                    "SubnetIds": [subnet.subnet_id for subnet in private_subnets],
                    "Tags": [
                        {"Key": "Environment", "Value": "Production"},
                        {"Key": "CostCenter", "Value": "NetworkOps"},
                    ],
                }
            ),
            description="Transit Gateway attachment configuration (JSON)",
            export_name=f"tgw-config-{environment_suffix}",
        )
