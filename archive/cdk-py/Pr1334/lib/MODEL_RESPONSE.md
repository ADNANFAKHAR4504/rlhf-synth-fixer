I'll create a comprehensive AWS CDK project in Python for a highly available, fault-tolerant e-commerce infrastructure. Here's the complete solution:

## Project Structure

```
ecommerce-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
└── README.md
```

## app.py

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App, Stack, Environment, Duration, RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_elbv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_events as events,
    aws_events_targets as targets,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_certificatemanager as acm,
    aws_route53 as route53,
    aws_ssm as ssm,
    Tags
)
from constructs import Construct

class ECommerceInfrastructureStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.env_name = env_name
        
        # Create VPC and networking
        self.create_vpc()
        
        # Create security groups
        self.create_security_groups()
        
        # Create IAM roles
        self.create_iam_roles()
        
        # Create RDS Aurora cluster
        self.create_database()
        
        # Create ElastiCache cluster
        self.create_cache()
        
        # Create Application Load Balancer
        self.create_load_balancer()
        
        # Create Auto Scaling Group with EC2 instances
        self.create_compute_resources()
        
        # Create S3 buckets for static assets
        self.create_storage()
        
        # Create CloudFront distribution
        self.create_cdn()
        
        # Create monitoring and alerting
        self.create_monitoring()
        
        # Create failure detection Lambda functions
        self.create_failure_detection()
        
        # Add tags to all resources
        self.add_tags()

    def create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""
        self.vpc = ec2.Vpc(
            self, f"ECommerceVPC-{self.env_name}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=3,  # One NAT gateway per AZ for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        
        # VPC Flow Logs for security monitoring
        self.vpc_flow_logs = ec2.FlowLog(
            self, f"VPCFlowLogs-{self.env_name}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, f"VPCFlowLogsGroup-{self.env_name}",
                    retention=logs.RetentionDays.ONE_MONTH
                )
            )
        )

    def create_security_groups(self):
        """Create security groups with least privilege principles"""
        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, f"ALBSecurityGroup-{self.env_name}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )
        
        # Web Server Security Group
        self.web_sg = ec2.SecurityGroup(
            self, f"WebServerSecurityGroup-{self.env_name}",
            vpc=self.vpc,
            description="Security group for web servers",
            allow_all_outbound=True
        )
        self.web_sg.add_ingress_rule(
            peer=self.alb_sg,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from ALB"
        )
        self.web_sg.add_ingress_rule(
            peer=self.alb_sg,
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from ALB"
        )
        
        # Database Security Group
        self.db_sg = ec2.SecurityGroup(
            self, f"DatabaseSecurityGroup-{self.env_name}",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        self.db_sg.add_ingress_rule(
            peer=self.web_sg,
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL access from web servers"
        )
        
        # Cache Security Group
        self.cache_sg = ec2.SecurityGroup(
            self, f"CacheSecurityGroup-{self.env_name}",
            vpc=self.vpc,
            description="Security group for ElastiCache",
            allow_all_outbound=False
        )
        self.cache_sg.add_ingress_rule(
            peer=self.web_sg,
            connection=ec2.Port.tcp(6379),
            description="Allow Redis access from web servers"
        )
        
        # Lambda Security Group
        self.lambda_sg = ec2.SecurityGroup(
            self, f"LambdaSecurityGroup-{self.env_name}",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

    def create_iam_roles(self):
        """Create IAM roles with minimal required permissions"""
        # EC2 Instance Role
        self.ec2_role = iam.Role(
            self, f"EC2InstanceRole-{self.env_name}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ],
            inline_policies={
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:GetObject", "s3:PutObject"],
                            resources=[f"arn:aws:s3:::ecommerce-{self.env_name}-*/*"]
                        )
                    ]
                )
            }
        )
        
        # Lambda Execution Role
        self.lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{self.env_name}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ],
            inline_policies={
                "FailoverActions": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "rds:FailoverDBCluster",
                                "elasticache:RebootCacheCluster",
                                "autoscaling:UpdateAutoScalingGroup",
                                "sns:Publish",
                                "cloudwatch:PutMetricData"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            }
        )

    def create_database(self):
        """Create Aurora MySQL cluster with multi-AZ deployment"""
        # DB Subnet Group
        db_subnet_group = rds.SubnetGroup(
            self, f"DBSubnetGroup-{self.env_name}",
            description="Subnet group for Aurora cluster",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )
        
        # Aurora Cluster
        self.aurora_cluster = rds.DatabaseCluster(
            self, f"AuroraCluster-{self.env_name}",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_8_0_MYSQL_3_02_0
            ),
            instance_props=rds.InstanceProps(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R5, ec2.InstanceSize.LARGE
                ),
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
                security_groups=[self.db_sg]
            ),
            instances=3,  # One writer + two readers across AZs
            subnet_group=db_subnet_group,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00"
            ),
            cloudwatch_logs_exports=["error", "general", "slowquery"],
            monitoring_interval=Duration.seconds(60),
            deletion_protection=True if self.env_name == "prod" else False,
            removal_policy=RemovalPolicy.SNAPSHOT if self.env_name == "prod" else RemovalPolicy.DESTROY
        )
        
        # Store database credentials in SSM Parameter Store
        ssm.StringParameter(
            self, f"DBEndpoint-{self.env_name}",
            parameter_name=f"/ecommerce/{self.env_name}/db/endpoint",
            string_value=self.aurora_cluster.cluster_endpoint.hostname
        )

    def create_cache(self):
        """Create ElastiCache Redis cluster with replication"""
        # Cache Subnet Group
        cache_subnet_group = elasticache.CfnSubnetGroup(
            self, f"CacheSubnetGroup-{self.env_name}",
            description="Subnet group for ElastiCache",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets]
        )
        
        # Redis Replication Group
        self.redis_cluster = elasticache.CfnReplicationGroup(
            self, f"RedisCluster-{self.env_name}",
            description="Redis cluster for session storage and caching",
            cache_node_type="cache.r6g.large",
            engine="redis",
            engine_version="7.0",
            num_cache_clusters=3,  # One primary + two replicas
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=cache_subnet_group.ref,
            security_group_ids=[self.cache_sg.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00"
        )

    def create_load_balancer(self):
        """Create Application Load Balancer with health checks"""
        self.alb = elbv2.ApplicationLoadBalancer(
            self, f"ApplicationLoadBalancer-{self.env_name}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Target Group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, f"WebServerTargetGroup-{self.env_name}",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP
            )
        )
        
        # Listener
        self.alb.add_listener(
            f"ALBListener-{self.env_name}",
            port=80,
            default_target_groups=[self.target_group]
        )

    def create_compute_resources(self):
        """Create Auto Scaling Group with EC2 instances"""
        # Launch Template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y docker",
            "systemctl start docker",
            "systemctl enable docker",
            "usermod -a -G docker ec2-user",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Create health check endpoint
            "mkdir -p /var/www/html",
            "echo 'OK' > /var/www/html/health",
            "python3 -m http.server 80 --directory /var/www/html &"
        )
        
        launch_template = ec2.LaunchTemplate(
            self, f"WebServerLaunchTemplate-{self.env_name}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.web_sg,
            role=self.ec2_role,
            user_data=user_data,
            detailed_monitoring=True
        )
        
        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, f"WebServerASG-{self.env_name}",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=3,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            target_group_arns=[self.target_group.target_group_arn],
            health_check=autoscaling.HealthCheck.elb(grace=Duration.seconds(300))
        )
        
        # Scaling Policies
        self.asg.scale_on_cpu_utilization(
            f"CPUScaling-{self.env_name}",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300)
        )

    def create_storage(self):
        """Create S3 buckets for static assets"""
        self.assets_bucket = s3.Bucket(
            self, f"AssetsBucket-{self.env_name}",
            bucket_name=f"ecommerce-{self.env_name}-assets-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if self.env_name == "prod" else RemovalPolicy.DESTROY
        )
        
        # Logs bucket
        self.logs_bucket = s3.Bucket(
            self, f"LogsBucket-{self.env_name}",
            bucket_name=f"ecommerce-{self.env_name}-logs-{self.account}",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.RETAIN if self.env_name == "prod" else RemovalPolicy.DESTROY
        )

    def create_cdn(self):
        """Create CloudFront distribution"""
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, f"OAI-{self.env_name}"
        )
        
        self.assets_bucket.grant_read(origin_access_identity)
        
        self.cloudfront_distribution = cloudfront.CloudFrontWebDistribution(
            self, f"CloudFrontDistribution-{self.env_name}",
            origin_configs=[
                cloudfront.SourceConfiguration(
                    s3_origin_source=cloudfront.S3OriginConfig(
                        s3_bucket_source=self.assets_bucket,
                        origin_access_identity=origin_access_identity
                    ),
                    behaviors=[
                        cloudfront.Behavior(
                            is_default_behavior=True,
                            compress=True,
                            allowed_methods=cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            cached_methods=cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
                        )
                    ]
                )
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enable_logging=True,
            log_bucket=self.logs_bucket,
            log_file_prefix="cloudfront-logs/"
        )

    def create_monitoring(self):
        """Create CloudWatch monitoring and SNS alerts"""
        # SNS Topic for alerts
        self.alerts_topic = sns.Topic(
            self, f"AlertsTopic-{self.env_name}",
            display_name=f"ECommerce {self.env_name.upper()} Alerts"
        )
        
        # CloudWatch Alarms
        # High CPU utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, f"HighCPUAlarm-{self.env_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            period=Duration.minutes(5),
            alarm_description="High CPU utilization detected"
        )
        cpu_alarm.add_alarm_action(sns.SnsAction(self.alerts_topic))
        
        # Database CPU alarm
        db_cpu_alarm = cloudwatch.Alarm(
            self, f"DBHighCPUAlarm-{self.env_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBClusterIdentifier": self.aurora_cluster.cluster_identifier
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            period=Duration.minutes(5),
            alarm_description="Database high CPU utilization"
        )
        db_cpu_alarm.add_alarm_action(sns.SnsAction(self.alerts_topic))
        
        # ALB target health alarm
        target_health_alarm = cloudwatch.Alarm(
            self, f"UnhealthyTargetsAlarm-{self.env_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "TargetGroup": self.target_group.target_group_full_name,
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Average"
            ),
            threshold=1,
            evaluation_periods=2,
            period=Duration.minutes(1),
            alarm_description="Unhealthy targets detected"
        )
        target_health_alarm.add_alarm_action(sns.SnsAction(self.alerts_topic))

    def create_failure_detection(self):
        """Create Lambda functions for failure detection and automated response"""
        # Database failover Lambda
        db_failover_lambda = lambda_.Function(
            self, f"DBFailoverLambda-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            timeout=Duration.minutes(5),
            code=lambda_.Code.from_inline("""
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    rds_client = boto3.client('rds')
    sns_client = boto3.client('sns')
    
    try:
        # Parse CloudWatch alarm
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message['AlarmName']
        
        if 'DB' in alarm_name and message['NewStateValue'] == 'ALARM':
            # Trigger database failover
            cluster_id = message['Trigger']['Dimensions'][0]['value']
            
            response = rds_client.failover_db_cluster(
                DBClusterIdentifier=cluster_id
            )
            
            logger.info(f"Initiated failover for cluster: {cluster_id}")
            
            # Send notification
            sns_client.publish(
                TopicArn=context.invoked_function_arn.replace(':function:', ':topic:'),
                Subject=f"Database Failover Initiated - {cluster_id}",
                Message=f"Automated failover initiated for RDS cluster {cluster_id}"
            )
            
        return {
            'statusCode': 200,
            'body': json.dumps('Failover initiated successfully')
        }
        
    except Exception as e:
        logger.error(f"Error during failover: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
""")
        )
        
        # Subscribe Lambda to SNS topic
        self.alerts_topic.add_subscription(
            sns.LambdaSubscription(db_failover_lambda)
        )
        
        # Health check Lambda
        health_check_lambda = lambda_.Function(
            self, f"HealthCheckLambda-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            timeout=Duration.minutes(2),
            code=lambda_.Code.from_inline("""
import json
import boto3
import urllib3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    elbv2 = boto3.client('elbv2')
    
    try:
        # Get target group health
        target_groups = elbv2.describe_target_groups()
        
        for tg in target_groups['TargetGroups']:
            targets = elbv2.describe_target_health(
                TargetGroupArn=tg['TargetGroupArn']
            )
            
            healthy_count = len([t for t in targets['TargetHealthDescriptions'] 
                               if t['TargetHealth']['State'] == 'healthy'])
            unhealthy_count = len([t for t in targets['TargetHealthDescriptions'] 
                                 if t['TargetHealth']['State'] == 'unhealthy'])
            
            # Send custom metrics
            cloudwatch.put_metric_data(
                Namespace='ECommerce/Health',
                MetricData=[
                    {
                        'MetricName': 'HealthyTargets',
                        'Value': healthy_count,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'TargetGroup',
                                'Value': tg['TargetGroupName']
                            }
                        ]
                    },
                    {
                        'MetricName': 'UnhealthyTargets',
                        'Value': unhealthy_count,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'TargetGroup',
                                'Value': tg['TargetGroupName']
                            }
                        ]
                    }
                ]
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Health check completed')
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
""")
        )
        
        # Schedule health check every 5 minutes
        health_check_rule = events.Rule(
            self, f"HealthCheckRule-{self.env_name}",
            schedule=events.Schedule.rate(Duration.minutes(5))
        )
        health_check_rule.add_target(targets.LambdaFunction(health_check_lambda))

    def add_tags(self):
        """Add tags to all resources"""
        Tags.of(self).add("Environment", self.env_name)
        Tags.of(self).add("Project", "ECommerce")
        Tags.of(self).add("ManagedBy", "CDK")


class ECommerceApp(App):
    def __init__(self):
        super().__init__()
        
        # Environment configuration
        env_us_west_2 = Environment(
            account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
            region="us-west-2"
        )
        
        # Deploy different environments
        environments = ["dev", "staging", "prod"]
        
        for env_name in environments:
            ECommerceInfrastructureStack(
                self, f"ECommerceInfrastructure-{env_name}",
                env_name=env_name,
                env=env_us_west_2,
                description=f"E-commerce infrastructure for {env_name} environment"
            )


# Create and run the app
app = ECommerceApp()
app.synth()
```

## requirements.txt

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## cdk.json

```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess