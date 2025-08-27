**tap.py**

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

**lib/tap_stack.py**

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    StackProps,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_cloudwatch as cloudwatch,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_kms as kms,
    Duration,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct
from typing import Optional


class TapStackProps(StackProps):
    """Properties for TapStack"""
    def __init__(self, environment_suffix: str, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, props: Optional[TapStackProps] = None, **kwargs) -> None:
        # Set termination protection for production environments only
        termination_protection = props.environment_suffix == 'prod' if props else False
        super().__init__(scope, construct_id, env=props.env if props else None, 
                        termination_protection=termination_protection, **kwargs)
        
        self.environment_suffix = props.environment_suffix if props else 'dev'
        self.region_name = self.region or 'us-east-1'
        
        self.kms_key = kms.Key(
            self, f'KmsKey{self.environment_suffix}',
            description=f'KMS key for {self.environment_suffix} environment in {cdk.Aws.REGION}',
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix != 'prod' else RemovalPolicy.RETAIN
        )
        
        self.vpc = self.create_vpc()
        self.security_groups = self.create_security_groups()
        self.iam_role = self.create_iam_role()
        self.s3_bucket = self.create_s3_bucket()
        self.rds_instance = self.create_rds()
        self.alb = self.create_alb()
        self.asg = self.create_asg()
        self.create_cloudwatch_alarms()
        
        if self.environment_suffix == 'prod':
            self.cloudfront = self.create_cloudfront()
        
        self.hosted_zone = self.create_route53()
        self._create_outputs()
    
    def create_vpc(self):
        vpc = ec2.Vpc(
            self, f'Vpc{self.environment_suffix}',
            vpc_name=f'vpc-{self.environment_suffix}',
            ip_addresses=ec2.IpAddresses.cidr('10.0.0.0/16'),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f'public-{self.environment_suffix}',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f'private-{self.environment_suffix}',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        return vpc
    
    def create_security_groups(self):
        alb_sg = ec2.SecurityGroup(
            self, f'AlbSg{self.environment_suffix}',
            vpc=self.vpc,
            description=f'ALB security group for {self.environment_suffix}',
            security_group_name=f'alb-sg-{self.environment_suffix}'
        )
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80))
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443))
        
        ec2_sg = ec2.SecurityGroup(
            self, f'Ec2Sg{self.environment_suffix}',
            vpc=self.vpc,
            description=f'EC2 security group for {self.environment_suffix}',
            security_group_name=f'ec2-sg-{self.environment_suffix}'
        )
        ec2_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(80))
        
        rds_sg = ec2.SecurityGroup(
            self, f'RdsSg{self.environment_suffix}',
            vpc=self.vpc,
            description=f'RDS security group for {self.environment_suffix}',
            security_group_name=f'rds-sg-{self.environment_suffix}'
        )
        rds_sg.add_ingress_rule(ec2_sg, ec2.Port.tcp(3306))
        
        return {
            'alb': alb_sg,
            'ec2': ec2_sg,
            'rds': rds_sg
        }
    
    def create_iam_role(self):
        role = iam.Role(
            self, f'Ec2Role{self.environment_suffix}',
            role_name=f'ec2-role-{self.environment_suffix}',
            assumed_by=iam.ServicePrincipal('ec2.amazonaws.com'),
            inline_policies={
                'S3Access': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject'
                            ],
                            resources=[f'arn:aws:s3:::s3-bucket-{self.environment_suffix}/*']
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=['s3:ListBucket'],
                            resources=[f'arn:aws:s3:::s3-bucket-{self.environment_suffix}']
                        )
                    ]
                ),
                'CloudWatchLogs': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            resources=[f'arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ec2/{self.environment_suffix}/*']
                        )
                    ]
                ),
                'KMSAccess': iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                'kms:Decrypt',
                                'kms:GenerateDataKey'
                            ],
                            resources=[self.kms_key.key_arn]
                        )
                    ]
                )
            }
        )
        
        iam.InstanceProfile(
            self, f'Ec2InstanceProfile{self.environment_suffix}',
            instance_profile_name=f'ec2-profile-{self.environment_suffix}',
            role=role
        )
        
        return role
    
    def create_s3_bucket(self):
        self.s3_bucket = s3.Bucket(
            self, f'S3Bucket{self.environment_suffix}',
            bucket_name=f's3-bucket-{self.environment_suffix}',
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Enable auto-deletion of objects for non-prod environments
            auto_delete_objects=self.environment_suffix != 'prod',
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix != 'prod' else RemovalPolicy.RETAIN
        )
        return self.s3_bucket
    
    def create_rds(self):
        subnet_group = rds.SubnetGroup(
            self, f'RdsSubnetGroup{self.environment_suffix}',
            description=f'RDS subnet group for {self.environment_suffix}',
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )
        
        self.rds_instance = rds.DatabaseInstance(
            self, f'RdsInstance{self.environment_suffix}',
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_39
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.security_groups['rds']],
            allocated_storage=20,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=Duration.days(7),
            database_name='tapdb',
            deletion_protection=self.environment_suffix == 'prod',
            delete_automated_backups=self.environment_suffix != 'prod',
            credentials=rds.Credentials.from_generated_secret(
                'admin',
                secret_name=f'rds-credentials-{self.environment_suffix}'
            ),
            subnet_group=subnet_group,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix != 'prod' else RemovalPolicy.SNAPSHOT
        )
        return self.rds_instance
    
    def create_alb(self):
        self.alb = elbv2.ApplicationLoadBalancer(
            self, f'Alb{self.environment_suffix}',
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups['alb'],
            load_balancer_name=f'alb-{self.environment_suffix}'
        )
        
        self.target_group = elbv2.ApplicationTargetGroup(
            self, f'TargetGroup{self.environment_suffix}',
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_group_name=f'tg-{self.environment_suffix}',
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                interval=Duration.seconds(30),
                path='/health',
                port='80',
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )
        
        self.alb.add_listener(
            f'Listener{self.environment_suffix}',
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([self.target_group])
        )
        
        return self.alb
    
    def create_asg(self):
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            'yum update -y',
            'yum install -y httpd',
            'systemctl start httpd',
            'systemctl enable httpd',
            'echo "<h1>TAP Application - Environment: ' + self.environment_suffix + '</h1>" > /var/www/html/index.html',
            'echo "OK" > /var/www/html/health'
        )
        
        launch_template = ec2.LaunchTemplate(
            self, f'LaunchTemplate{self.environment_suffix}',
            launch_template_name=f'lt-{self.environment_suffix}',
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.security_groups['ec2'],
            role=self.iam_role,
            user_data=user_data
        )
        
        self.asg = autoscaling.AutoScalingGroup(
            self, f'Asg{self.environment_suffix}',
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            auto_scaling_group_name=f'asg-{self.environment_suffix}',
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )
        
        self.asg.attach_to_application_target_group(self.target_group)
        
        return self.asg
    
    def create_cloudwatch_alarms(self):
        cloudwatch.Alarm(
            self, f'HighCpuAlarm{self.environment_suffix}',
            alarm_name=f'high-cpu-{self.environment_suffix}',
            metric=self.asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description=f'High CPU utilization alarm for {self.environment_suffix}'
        )
        
        cloudwatch.Alarm(
            self, f'AlbTargetResponseTime{self.environment_suffix}',
            alarm_name=f'alb-response-time-{self.environment_suffix}',
            metric=self.target_group.metric_target_response_time(),
            threshold=1.0,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description=f'ALB target response time alarm for {self.environment_suffix}'
        )
    
    def create_cloudfront(self):
        self.cloudfront = cloudfront.Distribution(
            self, f'CloudFront{self.environment_suffix}',
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    self.alb,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            comment=f'CloudFront distribution for {self.environment_suffix} environment'
        )
        return self.cloudfront
    
    def create_route53(self):
        if self.environment_suffix == 'prod':
            domain_name = 'tap-platform.com'
        else:
            domain_name = f'{self.environment_suffix}.tap-platform.com'
        
        self.hosted_zone = route53.HostedZone(
            self, f'HostedZone{self.environment_suffix}',
            zone_name=domain_name,
            comment=f'Hosted zone for {self.environment_suffix} environment'
        )
        
        if hasattr(self, 'cloudfront'):
            target = route53_targets.CloudFrontTarget(self.cloudfront)
        else:
            target = route53_targets.LoadBalancerTarget(self.alb)
        
        route53.ARecord(
            self, f'AliasRecord{self.environment_suffix}',
            zone=self.hosted_zone,
            target=route53.RecordTarget.from_alias(target),
            record_name=domain_name
        )
        
        return self.hosted_zone
    
    def _create_outputs(self):
        CfnOutput(
            self, f'VpcId{self.environment_suffix}',
            value=self.vpc.vpc_id,
            description=f'VPC ID for {self.environment_suffix} environment',
            export_name=f'VpcId-{self.environment_suffix}'
        )
        
        CfnOutput(
            self, f'AlbDnsName{self.environment_suffix}',
            value=self.alb.load_balancer_dns_name,
            description=f'ALB DNS name for {self.environment_suffix} environment',
            export_name=f'AlbDnsName-{self.environment_suffix}'
        )
        
        CfnOutput(
            self, f'S3BucketName{self.environment_suffix}',
            value=self.s3_bucket.bucket_name,
            description=f'S3 bucket name for {self.environment_suffix} environment',
            export_name=f'S3BucketName-{self.environment_suffix}'
        )
        
        CfnOutput(
            self, f'RdsEndpoint{self.environment_suffix}',
            value=self.rds_instance.instance_endpoint.hostname,
            description=f'RDS endpoint for {self.environment_suffix} environment',
            export_name=f'RdsEndpoint-{self.environment_suffix}'
        )
        
        if hasattr(self, 'cloudfront'):
            CfnOutput(
                self, f'CloudFrontDomainName{self.environment_suffix}',
                value=self.cloudfront.distribution_domain_name,
                description=f'CloudFront domain name for {self.environment_suffix} environment',
                export_name=f'CloudFrontDomainName-{self.environment_suffix}'
            )
        
        CfnOutput(
            self, f'HostedZoneId{self.environment_suffix}',
            value=self.hosted_zone.hosted_zone_id,
            description=f'Route53 hosted zone ID for {self.environment_suffix} environment',
            export_name=f'HostedZoneId-{self.environment_suffix}'
        )
```