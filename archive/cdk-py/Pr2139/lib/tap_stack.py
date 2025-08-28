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
    def __init__(self, environment_suffix: str, kms_key_arn: Optional[str] = None, ebs_kms_key_arn_or_alias: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        # Optional: import an existing KMS key for all resources (S3/RDS/EBS)
        self.kms_key_arn = kms_key_arn
        # Optional: override the EBS volume KMS key only (accepts full ARN or alias like 'alias/aws/ebs')
        self.ebs_kms_key_arn_or_alias = ebs_kms_key_arn_or_alias


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, props: Optional[TapStackProps] = None, **kwargs) -> None:
        # Set termination protection for production environments only
        termination_protection = props.environment_suffix == 'prod' if props else False
        super().__init__(scope, construct_id, env=props.env if props else None, 
                        termination_protection=termination_protection, **kwargs)
        
        self.environment_suffix = props.environment_suffix if props else 'dev'
        self.region_name = self.region or 'us-east-1'
        
        # Determine KMS key to use for the stack
        if props and getattr(props, 'kms_key_arn', None):
            # Import existing KMS key by ARN
            self.kms_key = kms.Key.from_key_arn(
                self, f'ImportedKmsKey{self.environment_suffix}', props.kms_key_arn
            )
        else:
            # Create a new KMS key with required service permissions
            self.kms_key = kms.Key(
                self, f'KmsKey{self.environment_suffix}',
                description=f'KMS key for {self.environment_suffix} environment in {cdk.Aws.REGION}',
                enable_key_rotation=True,
                removal_policy=RemovalPolicy.DESTROY if self.environment_suffix != 'prod' else RemovalPolicy.RETAIN,
                policy=iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            sid='Enable IAM User Permissions',
                            effect=iam.Effect.ALLOW,
                            principals=[iam.AccountRootPrincipal()],
                            actions=['kms:*'],
                            resources=['*']
                        ),
                        iam.PolicyStatement(
                            sid='Allow EC2 Service',
                            effect=iam.Effect.ALLOW,
                            principals=[iam.ServicePrincipal('ec2.amazonaws.com')],
                            actions=[
                                'kms:Decrypt',
                                'kms:DescribeKey',
                                'kms:Encrypt',
                                'kms:GenerateDataKey*',
                                'kms:ReEncrypt*',
                                'kms:CreateGrant'
                            ],
                            resources=['*']
                        ),
                        iam.PolicyStatement(
                            sid='Allow Auto Scaling',
                            effect=iam.Effect.ALLOW,
                            principals=[iam.ServicePrincipal('autoscaling.amazonaws.com')],
                            actions=[
                                'kms:Decrypt',
                                'kms:DescribeKey',
                                'kms:Encrypt',
                                'kms:GenerateDataKey*',
                                'kms:ReEncrypt*',
                                'kms:CreateGrant'
                            ],
                            resources=['*']
                        ),
                        iam.PolicyStatement(
                            sid='Allow S3 Service',
                            effect=iam.Effect.ALLOW,
                            principals=[iam.ServicePrincipal('s3.amazonaws.com')],
                            actions=[
                                'kms:Decrypt',
                                'kms:DescribeKey',
                                'kms:Encrypt',
                                'kms:GenerateDataKey*',
                                'kms:ReEncrypt*',
                                'kms:CreateGrant'
                            ],
                            resources=['*']
                        ),
                        iam.PolicyStatement(
                            sid='Allow RDS Service',
                            effect=iam.Effect.ALLOW,
                            principals=[iam.ServicePrincipal('rds.amazonaws.com')],
                            actions=[
                                'kms:Decrypt',
                                'kms:DescribeKey',
                                'kms:Encrypt',
                                'kms:GenerateDataKey*',
                                'kms:ReEncrypt*',
                                'kms:CreateGrant'
                            ],
                            resources=['*']
                        )
                    ]
                )
            )
        
        # Determine EBS KMS key override if provided (e.g., alias/aws/ebs)
        if props and getattr(props, 'ebs_kms_key_arn_or_alias', None):
            override = props.ebs_kms_key_arn_or_alias
            if override.startswith('arn:'):
                self.ebs_kms_key = kms.Key.from_key_arn(
                    self, f'EbsKmsKey{self.environment_suffix}', override
                )
            else:
                # Treat as alias name, e.g., 'alias/aws/ebs' or custom alias
                self.ebs_kms_key = kms.Alias.from_alias_name(
                    self, f'EbsKmsAlias{self.environment_suffix}', override
                )
        else:
            # Default to AWS-managed EBS key to avoid InvalidKMSKey.InvalidState during instance launch
            self.ebs_kms_key = kms.Alias.from_alias_name(
                self, f'EbsKmsAliasDefault{self.environment_suffix}', 'alias/aws/ebs'
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
        
        # Create outputs for integration testing
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
                            resources=[
                                f'arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ec2/{self.environment_suffix}/*'
                            ]
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
        alb = elbv2.ApplicationLoadBalancer(
            self, f'Alb{self.environment_suffix}',
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups['alb'],
            load_balancer_name=f'alb-{self.environment_suffix}'
        )
        
        target_group = elbv2.ApplicationTargetGroup(
            self, f'TargetGroup{self.environment_suffix}',
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_group_name=f'tg-{self.environment_suffix}',
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                interval=cdk.Duration.seconds(15),
                path='/health',
                port='80',
                protocol=elbv2.Protocol.HTTP,
                timeout=cdk.Duration.seconds(5),
                unhealthy_threshold_count=2
            )
        )
        
        alb.add_listener(
            f'AlbListener{self.environment_suffix}',
            port=80,
            default_target_groups=[target_group]
        )
        
        self.target_group = target_group
        return alb
    
    def create_asg(self):
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            'yum install -y httpd',
            'systemctl start httpd',
            'systemctl enable httpd',
            f'echo "<h1>Hello from {self.environment_suffix} in {self.region_name}</h1>" > /var/www/html/index.html',
            'echo "OK" > /var/www/html/health'
        )
        
        launch_template = ec2.LaunchTemplate(
            self, f'LaunchTemplate{self.environment_suffix}',
            launch_template_name=f'lt-{self.environment_suffix}',
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
                        kms_key=self.ebs_kms_key
                    )
                )
            ]
        )
        # Ensure the launch template waits for the KMS key to be fully created/enabled
        # Only add dependency if using a newly created key for EBS
        if self.ebs_kms_key is self.kms_key and isinstance(self.kms_key, kms.Key):
            launch_template.node.add_dependency(self.kms_key)
        
        asg = autoscaling.AutoScalingGroup(
            self, f'Asg{self.environment_suffix}',
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=1,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(3)),
            auto_scaling_group_name=f'asg-{self.environment_suffix}'
        )
        # Extra safeguard to ensure ASG depends on the KMS key if using created key for EBS
        if self.ebs_kms_key is self.kms_key and isinstance(self.kms_key, kms.Key):
            asg.node.add_dependency(self.kms_key)
        
        asg.attach_to_application_target_group(self.target_group)
        return asg
    
    def create_cloudwatch_alarms(self):
        cloudwatch.Alarm(
            self, f'CpuAlarm{self.environment_suffix}',
            alarm_name=f'cpu-alarm-{self.environment_suffix}',
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
            self, f'CloudFront{self.environment_suffix}',
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(self.alb),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100
        )
        return distribution
    
    def create_route53(self):
        hosted_zone = route53.HostedZone(
            self, f'HostedZone{self.environment_suffix}',
            zone_name=f'{self.environment_suffix}.tap.internal'
        )
        
        route53.ARecord(
            self, f'AlbRecord{self.environment_suffix}',
            zone=hosted_zone,
            record_name='alb',
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(self.alb)
            )
        )
        
        if hasattr(self, 'cloudfront'):
            route53.ARecord(
                self, f'CloudFrontRecord{self.environment_suffix}',
                zone=hosted_zone,
                record_name='cdn',
                target=route53.RecordTarget.from_alias(
                    route53_targets.CloudFrontTarget(self.cloudfront)
                )
            )
        
        return hosted_zone
    
    def _create_outputs(self):
        """Create CloudFormation outputs for integration testing"""
        # VPC outputs
        CfnOutput(self, 'VpcId', value=self.vpc.vpc_id, description='VPC ID')
        
        # S3 outputs
        CfnOutput(self, 'S3BucketName', value=self.s3_bucket.bucket_name, description='S3 Bucket Name')
        
        # RDS outputs
        CfnOutput(self, 'RdsInstanceId', 
                 value=self.rds_instance.instance_identifier, 
                 description='RDS Instance Identifier')
        CfnOutput(self, 'RdsSecretArn', 
                 value=self.rds_instance.secret.secret_arn if hasattr(self.rds_instance, 'secret') else '',
                 description='RDS Secret ARN')
        
        # ALB outputs
        CfnOutput(self, 'AlbArn', value=self.alb.load_balancer_arn, description='ALB ARN')
        CfnOutput(self, 'AlbDnsName', value=self.alb.load_balancer_dns_name, description='ALB DNS Name')
        
        # ASG outputs
        CfnOutput(self, 'AsgName', 
                 value=self.asg.auto_scaling_group_name, 
                 description='Auto Scaling Group Name')
        
        # KMS outputs
        # Use the ARN as a universal identifier accepted by DescribeKey for both created and imported keys
        CfnOutput(self, 'KmsKeyId', value=self.kms_key.key_arn, description='KMS Key ID or ARN')
        CfnOutput(self, 'KmsKeyArn', value=self.kms_key.key_arn, description='KMS Key ARN')
        
        # Route53 outputs
        CfnOutput(self, 'HostedZoneId', 
                 value=self.hosted_zone.hosted_zone_id, 
                 description='Route53 Hosted Zone ID')
        
        # IAM outputs
        CfnOutput(self, 'IamRoleName', 
                 value=self.iam_role.role_name, 
                 description='IAM Role Name')
        CfnOutput(self, 'InstanceProfileName', 
                 value=f'ec2-profile-{self.environment_suffix}',
                 description='Instance Profile Name')
