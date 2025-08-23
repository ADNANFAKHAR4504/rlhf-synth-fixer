=== lib/tap_stack.py ===

```python
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output
import json

# AWS CodePipeline Configuration (buildspec.yml and pipeline definition)
"""
# buildspec.yml
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.9
    commands:
      - pip install pulumi pulumi-aws pytest
  pre_build:
    commands:
      - pulumi login --local
  build:
    commands:
      - pytest tests/unit/ -v
      - pytest tests/integration/ -v
      - pulumi preview --stack dev
  post_build:
    commands:
      - pulumi up --stack dev --yes
artifacts:
  files:
    - '**/*'

# CodePipeline CloudFormation Template
Resources:
  CodePipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
        - Name: Test
          Actions:
            - Name: TestAction
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
        - Name: Rollback
          Actions:
            - Name: RollbackAction
              ActionTypeId:
                Category: Invoke
                Owner: AWS
                Provider: Lambda
              Configuration:
                FunctionName: !Ref RollbackFunction
"""

class TapStack:
    def __init__(self):
        self.config = Config()
        self.team_name = "nova"
        self.environment = "prod"
        self.region = "us-west-2"
        
        # Validate required config
        self.allowed_cidr = self.config.require("allowed_cidr")
        self.db_backup_retention_days = self.config.require_int("db_backup_retention_days")
        self.cross_region_replication_region = self.config.get("cross_region_replication_region") or "us-east-1"
        
        # Initialize resources
        self._create_kms_keys()
        self._create_vpc()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_s3_buckets()
        self._create_rds()
        self._create_alb_and_waf()
        self._create_auto_scaling_group()
        self._create_fargate_service()
        self._create_cloudwatch_alarms()
        self._create_backup_plan()
        self._create_secrets()
        
    def _create_tags(self, purpose: str) -> dict:
        return {
            "Owner": self.team_name,
            "Purpose": purpose,
            "Environment": self.environment,
            "Project": "IaC - AWS Nova Model Breaking"
        }
    
    def _create_kms_keys(self):
        # KMS key for general encryption
        self.kms_key = aws.kms.Key(
            f"{self.team_name}-{self.environment}-main-key",
            description="Main KMS key for encryption",
            tags=self._create_tags("encryption")
        )
        
        self.kms_key_alias = aws.kms.Alias(
            f"{self.team_name}-{self.environment}-main-key-alias",
            name=f"alias/{self.team_name}-{self.environment}-main",
            target_key_id=self.kms_key.key_id
        )
    
    def _create_vpc(self):
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.team_name}-{self.environment}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self._create_tags("networking")
        )
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{self.team_name}-{self.environment}-igw",
            vpc_id=self.vpc.id,
            tags=self._create_tags("networking")
        )
        
        # Get AZs
        azs = aws.get_availability_zones(state="available")
        
        # Public subnets
        self.public_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.team_name}-{self.environment}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self._create_tags("public-networking")
            )
            self.public_subnets.append(subnet)
        
        # Private subnets
        self.private_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.team_name}-{self.environment}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags=self._create_tags("private-networking")
            )
            self.private_subnets.append(subnet)
        
        # Isolated subnets for DB
        self.isolated_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.team_name}-{self.environment}-isolated-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags=self._create_tags("isolated-networking")
            )
            self.isolated_subnets.append(subnet)
        
        # NAT Gateways
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = aws.ec2.Eip(
                f"{self.team_name}-{self.environment}-nat-eip-{i+1}",
                domain="vpc",
                tags=self._create_tags("networking")
            )
            nat = aws.ec2.NatGateway(
                f"{self.team_name}-{self.environment}-nat-{i+1}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags=self._create_tags("networking")
            )
            self.nat_gateways.append(nat)
        
        # Route tables
        self.public_route_table = aws.ec2.RouteTable(
            f"{self.team_name}-{self.environment}-public-rt",
            vpc_id=self.vpc.id,
            tags=self._create_tags("networking")
        )
        
        aws.ec2.Route(
            f"{self.team_name}-{self.environment}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.team_name}-{self.environment}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )
        
        # Private route tables
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f"{self.team_name}-{self.environment}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags=self._create_tags("networking")
            )
            
            aws.ec2.Route(
                f"{self.team_name}-{self.environment}-private-route-{i+1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id
            )
            
            aws.ec2.RouteTableAssociation(
                f"{self.team_name}-{self.environment}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id
            )
        
        # DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{self.team_name}-{self.environment}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.isolated_subnets],
            tags=self._create_tags("database")
        )
    
    def _create_security_groups(self):
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-alb-sg",
            description="Security group for ALB",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags=self._create_tags("security")
        )
        
        # EC2 Security Group
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=[self.allowed_cidr]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags=self._create_tags("security")
        )
        
        # Fargate Security Group
        self.fargate_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-fargate-sg",
            description="Security group for Fargate tasks",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags=self._create_tags("security")
        )
        
        # RDS Security Group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-rds-sg",
            description="Security group for RDS",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.ec2_sg.id, self.fargate_sg.id]
                )
            ],
            tags=self._create_tags("security")
        )
    
    def _create_iam_roles(self):
        # EC2 Instance Role
        self.ec2_role = aws.iam.Role(
            f"{self.team_name}-{self.environment}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags=self._create_tags("iam")
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.team_name}-{self.environment}-ec2-ssm-policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )
        
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"{self.team_name}-{self.environment}-ec2-profile",
            role=self.ec2_role.name
        )
        
        # Fargate Task Role
        self.fargate_task_role = aws.iam.Role(
            f"{self.team_name}-{self.environment}-fargate-task-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                }]
            }),
            tags=self._create_tags("iam")
        )
        
        # Fargate Execution Role
        self.fargate_execution_role = aws.iam.Role(
            f"{self.team_name}-{self.environment}-fargate-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"}
                }]
            }),
            tags=self._create_tags("iam")
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.team_name}-{self.environment}-fargate-execution-policy",
            role=self.fargate_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )
    
    def _create_s3_buckets(self):
        # Main S3 bucket
        self.s3_bucket = aws.s3.Bucket(
            f"{self.team_name}-{self.environment}-main-bucket",
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    )
                )
            ),
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            tags=self._create_tags("storage")
        )
        
        # Cross-region replication bucket
        self.replication_bucket = aws.s3.Bucket(
            f"{self.team_name}-{self.environment}-replication-bucket",
            region=self.cross_region_replication_region,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms"
                    )
                )
            ),
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            tags=self._create_tags("storage-replication")
        )
        
        # Replication IAM role
        self.replication_role = aws.iam.Role(
            f"{self.team_name}-{self.environment}-replication-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"}
                }]
            })
        )
        
        replication_policy = aws.iam.RolePolicy(
            f"{self.team_name}-{self.environment}-replication-policy",
            role=self.replication_role.id,
            policy=pulumi.Output.all(self.s3_bucket.arn, self.replication_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObjectVersionForReplication",
                                "s3:GetObjectVersionAcl"
                            ],
                            "Resource": f"{args[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ListBucket"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ReplicateObject",
                                "s3:ReplicateDelete"
                            ],
                            "Resource": f"{args[1]}/*"
                        }
                    ]
                })
            )
        )
        
        # S3 bucket replication configuration
        self.bucket_replication = aws.s3.BucketReplicationConfiguration(
            f"{self.team_name}-{self.environment}-replication-config",
            role=self.replication_role.arn,
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketReplicationConfigurationRuleArgs(
                    id="ReplicateAll",
                    status="Enabled",
                    destination=aws.s3.BucketReplicationConfigurationRuleDestinationArgs(
                        bucket=self.replication_bucket.arn,
                        storage_class="STANDARD_IA"
                    )
                )
            ],
            opts=pulumi.ResourceOptions(depends_on=[replication_policy])
        )
    
    def _create_rds(self):
        self.rds_instance = aws.rds.Instance(
            f"{self.team_name}-{self.environment}-database",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            db_name="appdb",
            username="admin",
            password="changeme123!",  # In production, use AWS Secrets Manager
            vpc_security_group_ids=[self.rds_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            backup_retention_period=self.db_backup_retention_days,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            skip_final_snapshot=True,
            tags=self._create_tags("database")
        )
    
    def _create_alb_and_waf(self):
        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{self.team_name}-{self.environment}-alb",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.alb_sg.id],
            tags=self._create_tags("load-balancer")
        )
        
        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"{self.team_name}-{self.environment}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200"
            ),
            tags=self._create_tags("load-balancer")
        )
        
        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"{self.team_name}-{self.environment}-listener",
            load_balancer_arn=self.alb.arn,
            port="80",
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ]
        )
        
        # WAF Web ACL
        self.waf_web_acl = aws.wafv2.WebAcl(
            f"{self.team_name}-{self.environment}-waf",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesOWASPTop10",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesOWASPTop10",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="OWASPTop10Metric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name="WebACLMetric",
                sampled_requests_enabled=True
            ),
            tags=self._create_tags("security")
        )
        
        # Associate WAF with ALB
        self.waf_association = aws.wafv2.WebAclAssociation(
            f"{self.team_name}-{self.environment}-waf-association",
            resource_arn=self.alb.arn,
            web_acl_arn=self.waf_web_acl.arn
        )
    
    def _create_auto_scaling_group(self):
        # Launch Template
        user_data = """#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
"""
        
        self.launch_template = aws.ec2.LaunchTemplate(
            f"{self.team_name}-{self.environment}-launch-template",
            image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI
            instance_type="c5.large",
            vpc_security_group_ids=[self.ec2_sg.id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.ec2_instance_profile.name
            ),
            user_data=pulumi.Output.secret(user_data).apply(lambda x: x),
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=20,
                        volume_type="gp3",
                        encrypted=True,
                        kms_key_id=self.kms_key.arn,
                        delete_on_termination=True
                    )
                )
            ],
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self._create_tags("compute")
                )
            ]
        )
        
        # Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"{self.team_name}-{self.environment}-asg",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=6,
            desired_capacity=2,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"{self.team_name}-{self.environment}-asg-instance",
                    propagate_at_launch=True
                )
            ]
        )
        
        # Auto Scaling Policy
        self.scale_up_policy = aws.autoscaling.Policy(
            f"{self.team_name}-{self.environment}-scale-up-policy",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name
        )
        
        self.scale_down_policy = aws.autoscaling.Policy(
            f"{self.team_name}-{self.environment}-scale-down-policy",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name
        )
    
    def _create_fargate_service(self):
        # ECS Cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"{self.team_name}-{self.environment}-cluster",
            tags=self._create_tags("container")
        )
        
        # CloudWatch Log Group
        self.log_group = aws.cloudwatch.LogGroup(
            f"{self.team_name}-{self.environment}-fargate-logs",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags=self._create_tags("logging")
        )
        
        # Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"{self.team_name}-{self.environment}-task-def",
            family=f"{self.team_name}-{self.environment}-app",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.fargate_execution_role.arn,
            task_role_arn=self.fargate_task_role.arn,
            container_definitions=pulumi.Output.all(self.log_group.name).apply(
                lambda args: json.dumps([{
                    "name": "app",
                    "image": "nginx:latest",
                    "portMappings": [{
                        "containerPort": 80,
                        "protocol": "tcp"
                    }],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[0],
                            "awslogs-region": self.region,
                            "awslogs-stream-prefix": "ecs"
                        }
                    },
                    "essential": True
                }])
            ),
            tags=self._create_tags("container")
        )
        
        # Fargate Service
        self.fargate_service = aws.ecs.Service(
            f"{self.team_name}-{self.environment}-fargate-service",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                security_groups=[self.fargate_sg.id],
                subnets=[subnet.id for subnet in self.private_subnets]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="app",
                    container_port=80
                )
            ],
            tags=self._create_tags("container"),
            opts=pulumi.ResourceOptions(depends_on=[self.alb_listener])
        )
    
    def _create_cloudwatch_alarms(self):
        # EC2 CPU Alarm
        self.ec2_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.team_name}-{self.environment}-ec2-cpu-alarm",
            comparison_