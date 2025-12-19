"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_events as events,
    aws_events_targets as targets,
)
from constructs import Construct


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

    This stack creates a comprehensive AWS infrastructure with:
    - VPC with public/private subnets
    - EC2 Auto Scaling Group with Application Load Balancer
    - RDS Multi-AZ database
    - S3 bucket with encryption and versioning
    - Lambda monitoring function
    - IAM roles with least privilege
    - Security groups and CloudWatch monitoring
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC with public and private subnets across multiple AZs
        vpc = ec2.Vpc(
            self,
            f"VPC{environment_suffix}",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Database{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create security groups with minimal exposure
        alb_sg = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from anywhere"
        )
        alb_sg.add_egress_rule(
            ec2.Peer.ipv4(vpc.vpc_cidr_block),
            ec2.Port.tcp(8080),
            "Allow traffic to EC2 instances"
        )

        ec2_sg = ec2.SecurityGroup(
            self,
            f"EC2SecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        ec2_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB"
        )

        rds_sg = ec2.SecurityGroup(
            self,
            f"RDSSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        rds_sg.add_ingress_rule(
            ec2_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL traffic from EC2 instances"
        )

        # Create IAM role for EC2 instances with minimal permissions
        ec2_role = iam.Role(
            self,
            f"EC2Role{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # Add custom policy for S3 access (read-only to our bucket)
        ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                resources=[
                    f"arn:aws:s3:::tap-secure-bucket-{environment_suffix}",
                    f"arn:aws:s3:::tap-secure-bucket-{environment_suffix}/*"
                ]
            )
        )

        # Create read-only EC2 role as requested
        ec2_readonly_role = iam.Role(
            self,
            f"EC2ReadOnlyRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEC2ReadOnlyAccess")
            ]
        )

        # Create Launch Template for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y python3 python3-pip",
            "pip3 install flask boto3",
            "cat > /home/ec2-user/app.py << 'EOF'",
            "from flask import Flask, jsonify",
            "import boto3",
            "import logging",
            "",
            "app = Flask(__name__)",
            "logging.basicConfig(level=logging.INFO)",
            "",
            "@app.route('/')",
            "def health_check():",
            "    return jsonify({'status': 'healthy', 'message': 'TAP Infrastructure Running'})",
            "",
            "@app.route('/health')",
            "def detailed_health():",
            "    try:",
            "        # Simple health check",
            "        return jsonify({",
            "            'status': 'healthy',",
            "            'timestamp': str(__import__('datetime').datetime.now()),",
            "            'environment': 'AWS EC2'",
            "        })",
            "    except Exception as e:",
            "        return jsonify({'status': 'error', 'message': str(e)}), 500",
            "",
            "if __name__ == '__main__':",
            "    app.run(host='0.0.0.0', port=8080)",
            "EOF",
            "python3 /home/ec2-user/app.py &"
        )

        launch_template = ec2.LaunchTemplate(
            self,
            f"LaunchTemplate{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=ec2_sg,
            role=ec2_role,
            user_data=user_data
        )

        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self,
            f"AutoScalingGroup{environment_suffix}",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ApplicationLoadBalancer{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # Create Target Group and Listener
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TargetGroup{environment_suffix}",
            vpc=vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/health",
                port="8080"
            )
        )

        alb.add_listener(
            f"ALBListener{environment_suffix}",
            port=80,
            default_target_groups=[target_group]
        )

        # Attach Auto Scaling Group to Target Group
        asg.attach_to_application_target_group(target_group)

        # Create RDS Subnet Group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup{environment_suffix}",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        # Create RDS Multi-AZ Database
        database = rds.DatabaseInstance(
            self,
            f"Database{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[rds_sg],
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret("admin"),
            multi_az=True,
            storage_encrypted=True,
            backup_retention=Duration.days(1),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            allocated_storage=20,
            storage_type=rds.StorageType.GP3
        )

        # Create S3 bucket with versioning and encryption
        s3_bucket = s3.Bucket(
            self,
            f"SecureBucket{environment_suffix}",
            bucket_name=f"tap-secure-bucket-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            server_access_logs_prefix="access-logs/"
        )

        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f"LambdaRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add CloudWatch permissions to Lambda role
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "ec2:DescribeInstances",
                    "rds:DescribeDBInstances",
                    "elasticloadbalancing:DescribeLoadBalancers",
                    "elasticloadbalancing:DescribeTargetHealth"
                ],
                resources=["*"]
            )
        )

        # Create Lambda function for monitoring
        monitoring_lambda = _lambda.Function(
            self,
            f"MonitorLambdaFunc{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.minutes(5),
            code=_lambda.Code.from_inline("""
import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    ec2 = boto3.client('ec2')
    
    try:
        # Get EC2 instance information
        instances = ec2.describe_instances()
        running_instances = 0
        
        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                if instance['State']['Name'] == 'running':
                    running_instances += 1
        
        # Put custom metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='TAP/Infrastructure',
            MetricData=[
                {
                    'MetricName': 'RunningInstances',
                    'Value': running_instances,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        logger.info(f"Successfully published metrics. Running instances: {running_instances}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Monitoring completed successfully',
                'running_instances': running_instances,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in monitoring function: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }
""")
        )

        # Create CloudWatch Event Rule to trigger Lambda every 5 minutes
        monitoring_rule = events.Rule(
            self,
            f"MonitoringRule{environment_suffix}",
            schedule=events.Schedule.rate(Duration.minutes(5))
        )
        monitoring_rule.add_target(targets.LambdaFunction(monitoring_lambda))

        # Create CloudWatch Log Groups
        app_log_group = logs.LogGroup(
            self,
            f"ApplicationLogGroup{environment_suffix}",
            log_group_name=f"/aws/ec2/tap-application-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        lambda_log_group = logs.LogGroup(
            self,
            f"LambdaLogGroup{environment_suffix}",
            log_group_name=f"/aws/lambda/{monitoring_lambda.function_name}-group",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"TapDashboard{environment_suffix}",
            dashboard_name=f"TAP-Infrastructure-{environment_suffix}"
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="EC2 CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="CPUUtilization",
                        statistic="Average"
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="RequestCount",
                        statistic="Sum"
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="RDS Connections",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        statistic="Average"
                    )
                ]
            )
        )

        # Add resource tags for all components
        cdk.Tags.of(self).add("Project", "TAP")
        cdk.Tags.of(self).add("Environment", environment_suffix)
        cdk.Tags.of(self).add("ManagedBy", "CDK")
        cdk.Tags.of(self).add("CostCenter", "Infrastructure")

        # Outputs for integration testing
        CfnOutput(
            self,
            f"VPCId{environment_suffix}",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"TapVPCId{environment_suffix}"
        )

        CfnOutput(
            self,
            f"LoadBalancerDNS{environment_suffix}",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"TapALBDNS{environment_suffix}"
        )

        CfnOutput(
            self,
            f"DatabaseEndpoint{environment_suffix}",
            value=database.instance_endpoint.hostname,
            description="RDS Database endpoint",
            export_name=f"TapDBEndpoint{environment_suffix}"
        )

        CfnOutput(
            self,
            f"S3BucketName{environment_suffix}",
            value=s3_bucket.bucket_name,
            description="S3 Bucket name",
            export_name=f"TapS3Bucket{environment_suffix}"
        )

        CfnOutput(
            self,
            f"LambdaFunctionName{environment_suffix}",
            value=monitoring_lambda.function_name,
            description="Lambda function name",
            export_name=f"TapLambdaFunction{environment_suffix}"
        )

        # Store references for potential future use
        self.vpc = vpc
        self.alb = alb
        self.database = database
        self.s3_bucket = s3_bucket
        self.monitoring_lambda = monitoring_lambda
        self.asg = asg
