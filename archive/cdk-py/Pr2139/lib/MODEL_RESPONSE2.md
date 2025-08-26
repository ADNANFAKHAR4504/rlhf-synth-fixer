**tap.py**

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

environments = ['dev', 'prod']
regions = ['us-east-1', 'us-west-2']

for env in environments:
    for region in regions:
        region_code = 'use1' if region == 'us-east-1' else 'usw2'
        stack_name = f'tap-{env}-{region_code}'
        
        TapStack(
            app,
            stack_name,
            env=cdk.Environment(region=region),
            env_name=env,
            region_code=region_code
        )

app.synth()
```

**lib/tap_stack.py**

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    aws_s3 as s3,
    aws_kms as kms,
    aws_rds as rds,
    aws_cloudwatch as cloudwatch,
    aws_cloudfront as cloudfront,
    aws_route53 as route53,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, env_name: str, region_code: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.env_name = env_name
        self.region_code = region_code
        
        self.kms_key = kms.Key(
            self, f'KmsKey-{env_name}-{region_code}',
            description=f'KMS key for {env_name} environment in {region_code}',
            enable_key_rotation=True
        )
        
        self.vpc = self.create_vpc()
        self.security_groups = self.create_security_groups()
        self.iam_role = self.create_iam_role()
        self.s3_bucket = self.create_s3_bucket()
        self.rds_instance = self.create_rds()
        self.alb = self.create_alb()
        self.asg = self.create_asg()
        self.create_cloudwatch_alarms()
        
        if env_name == 'prod':
            self.cloudfront = self.create_cloudfront()
        
        self.hosted_zone = self.create_route53()
    
    def create_vpc(self):
        vpc = ec2.Vpc(
            self, f'Vpc-{self.env_name}-{self.region_code}',
            vpc_name=f'vpc-{self.env_name}-{self.region_code}',
            ip_addresses=ec2.IpAddresses.cidr('10.0.0.0/16'),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f'public-{self.env_name}-{self.region_code}',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f'private-{self.env_name}-{self.region_code}',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        return vpc
    
    def create_security_groups(self):
        alb_sg = ec2.SecurityGroup(
            self, f'AlbSg-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            description=f'ALB security group for {self.env_name}',
            security_group_name=f'alb-sg-{self.env_name}-{self.region_code}'
        )
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80))
        alb_sg.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443))
        
        ec2_sg = ec2.SecurityGroup(
            self, f'Ec2Sg-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            description=f'EC2 security group for {self.env_name}',
            security_group_name=f'ec2-sg-{self.env_name}-{self.region_code}'
        )
        ec2_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(80))
        
        rds_sg = ec2.SecurityGroup(
            self, f'RdsSg-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            description=f'RDS security group for {self.env_name}',
            security_group_name=f'rds-sg-{self.env_name}-{self.region_code}'
        )
        rds_sg.add_ingress_rule(ec2_sg, ec2.Port.tcp(3306))
        
        return {
            'alb': alb_sg,
            'ec2': ec2_sg,
            'rds': rds_sg
        }
    
    def create_iam_role(self):
        role = iam.Role(
            self, f'Ec2Role-{self.env_name}-{self.region_code}',
            role_name=f'ec2-role-{self.env_name}-{self.region_code}',
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
                            resources=[f'arn:aws:s3:::tap-{self.env_name}-{self.region_code}-*/*']
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=['s3:ListBucket'],
                            resources=[f'arn:aws:s3:::tap-{self.env_name}-{self.region_code}-*']
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
                            resources=[f'arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ec2/{self.env_name}/*']
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
            self, f'Ec2InstanceProfile-{self.env_name}-{self.region_code}',
            instance_profile_name=f'ec2-profile-{self.env_name}-{self.region_code}',
            role=role
        )
        
        return role
    
    def create_s3_bucket(self):
        bucket = s3.Bucket(
            self, f'S3Bucket-{self.env_name}-{self.region_code}',
            bucket_name=f'tap-{self.env_name}-{self.region_code}-{self.account}',
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True
        )
        return bucket
    
    def create_rds(self):
        subnet_group = rds.SubnetGroup(
            self, f'RdsSubnetGroup-{self.env_name}-{self.region_code}',
            description=f'RDS subnet group for {self.env_name}',
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )
        
        instance = rds.DatabaseInstance(
            self, f'RdsInstance-{self.env_name}-{self.region_code}',
            engine=rds.DatabaseInstanceEngine.mysql(version=rds.MysqlEngineVersion.VER_8_0),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.security_groups['rds']],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=cdk.Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=self.env_name == 'prod',
            database_name='tapdb',
            credentials=rds.Credentials.from_generated_secret(
                'admin',
                secret_name=f'rds-credentials-{self.env_name}-{self.region_code}'
            )
        )
        return instance
    
    def create_alb(self):
        alb = elbv2.ApplicationLoadBalancer(
            self, f'Alb-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups['alb'],
            load_balancer_name=f'alb-{self.env_name}-{self.region_code}'
        )
        
        target_group = elbv2.ApplicationTargetGroup(
            self, f'TargetGroup-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_group_name=f'tg-{self.env_name}-{self.region_code}',
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                interval=cdk.Duration.seconds(30),
                path='/',
                port='80',
                protocol=elbv2.Protocol.HTTP,
                timeout=cdk.Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )
        
        alb.add_listener(
            f'AlbListener-{self.env_name}-{self.region_code}',
            port=80,
            default_target_groups=[target_group]
        )
        
        self.target_group = target_group
        return alb
    
    def create_asg(self):
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            'yum update -y',
            'yum install -y httpd',
            'systemctl start httpd',
            'systemctl enable httpd',
            f'echo "<h1>Hello from {self.env_name} in {self.region_code}</h1>" > /var/www/html/index.html'
        )
        
        launch_template = ec2.LaunchTemplate(
            self, f'LaunchTemplate-{self.env_name}-{self.region_code}',
            launch_template_name=f'lt-{self.env_name}-{self.region_code}',
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            machine_image=ec2.AmazonLinuxImage(generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2),
            security_group=self.security_groups['ec2'],
            role=self.iam_role,
            user_data=user_data,
            block_devices=[
                ec2.BlockDevice(
                    device_name='/dev/xvda',
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=8,
                        encrypted=True,
                        kms_key=self.kms_key
                    )
                )
            ]
        )
        
        asg = autoscaling.AutoScalingGroup(
            self, f'Asg-{self.env_name}-{self.region_code}',
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(cdk.Duration.seconds(300)),
            auto_scaling_group_name=f'asg-{self.env_name}-{self.region_code}'
        )
        
        asg.attach_to_application_target_group(self.target_group)
        return asg
    
    def create_cloudwatch_alarms(self):
        cloudwatch.Alarm(
            self, f'CpuAlarm-{self.env_name}-{self.region_code}',
            alarm_name=f'cpu-alarm-{self.env_name}-{self.region_code}',
            metric=cloudwatch.Metric(
                namespace='AWS/AutoScaling',
                metric_name='CPUUtilization',
                dimensions_map={
                    'AutoScalingGroupName': self.asg.auto_scaling_group_name
                },
                statistic='Average'
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
    
    def create_cloudfront(self):
        distribution = cloudfront.Distribution(
            self, f'CloudFront-{self.env_name}-{self.region_code}',
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront.LoadBalancerV2Origin(self.alb),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100
        )
        return distribution
    
    def create_route53(self):
        hosted_zone = route53.HostedZone(
            self, f'HostedZone-{self.env_name}-{self.region_code}',
            zone_name=f'{self.env_name}-{self.region_code}.tap.internal'
        )
        
        route53.ARecord(
            self, f'AlbRecord-{self.env_name}-{self.region_code}',
            zone=hosted_zone,
            record_name='alb',
            target=route53.RecordTarget.from_alias(
                route53.targets.LoadBalancerTarget(self.alb)
            )
        )
        
        if hasattr(self, 'cloudfront'):
            route53.ARecord(
                self, f'CloudFrontRecord-{self.env_name}-{self.region_code}',
                zone=hosted_zone,
                record_name='cdn',
                target=route53.RecordTarget.from_alias(
                    route53.targets.CloudFrontTarget(self.cloudfront)
                )
            )
        
        return hosted_zone
```