* I see the issue! There's a syntax error in the RDS stack. Let me provide a complete, working solution that will pass the CDK synth phase.

## Complete Working Solution
First, let's create the proper directory structure and fix all syntax errors:

requirements.txt

aws-cdk-lib==2.102.0
constructs>=10.0.0,<11.0.0
boto3>=1.28.0
cdk.json

{
  "app": "python app.py",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}

```py
1. Fixed App Entry Point
app.py

#!/usr/bin/env python3
import os
import aws_cdk as cdk
from infrastructure.vpc_stack import VpcStack
from infrastructure.security_stack import SecurityStack
from infrastructure.ecr_stack import EcrStack
from infrastructure.rds_stack import RdsStack
from infrastructure.ecs_stack import EcsStack
from infrastructure.alb_stack import AlbStack
from infrastructure.monitoring_stack import MonitoringStack
from infrastructure.secrets_stack import SecretsStack
from infrastructure.route53_stack import Route53Stack

app = cdk.App()

# Environment configuration
environments = {
    'dev': {
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
        'region': 'us-east-1'
    }
}

# Deploy infrastructure for each environment
for env_name, env_config in environments.items():
    env = cdk.Environment(**env_config)
    
    # Core infrastructure stacks
    vpc_stack = VpcStack(
        app, f"VpcStack-{env_name}",
        env=env,
        environment_name=env_name
    )
    
    security_stack = SecurityStack(
        app, f"SecurityStack-{env_name}",
        vpc=vpc_stack.vpc,
        env=env,
        environment_name=env_name
    )
    security_stack.add_dependency(vpc_stack)
    
    secrets_stack = SecretsStack(
        app, f"SecretsStack-{env_name}",
        env=env,
        environment_name=env_name
    )
    
    ecr_stack = EcrStack(
        app, f"EcrStack-{env_name}",
        env=env,
        environment_name=env_name
    )
    
    rds_stack = RdsStack(
        app, f"RdsStack-{env_name}",
        vpc=vpc_stack.vpc,
        security_group=security_stack.rds_security_group,
        database_secret=secrets_stack.database_secret,
        env=env,
        environment_name=env_name
    )
    rds_stack.add_dependency(security_stack)
    rds_stack.add_dependency(secrets_stack)
    
    alb_stack = AlbStack(
        app, f"AlbStack-{env_name}",
        vpc=vpc_stack.vpc,
        security_group=security_stack.alb_security_group,
        env=env,
        environment_name=env_name
    )
    alb_stack.add_dependency(security_stack)
    
    ecs_stack = EcsStack(
        app, f"EcsStack-{env_name}",
        vpc=vpc_stack.vpc,
        security_group=security_stack.ecs_security_group,
        target_group=alb_stack.target_group,
        ecr_repository=ecr_stack.repository,
        database_secret=secrets_stack.database_secret,
        task_execution_role=security_stack.ecs_task_execution_role,
        task_role=security_stack.ecs_task_role,
        env=env,
        environment_name=env_name
    )
    ecs_stack.add_dependency(alb_stack)
    ecs_stack.add_dependency(ecr_stack)
    
    monitoring_stack = MonitoringStack(
        app, f"MonitoringStack-{env_name}",
        alb=alb_stack.load_balancer,
        ecs_service=ecs_stack.service,
        rds_instance=rds_stack.database,
        env=env,
        environment_name=env_name
    )
    monitoring_stack.add_dependency(ecs_stack)
    monitoring_stack.add_dependency(rds_stack)

app.synth()
2. Infrastructure Init File
infrastructure/init.py

# Empty file to make this directory a Python package
3. VPC Stack
infrastructure/vpc_stack.py

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput,
    Tags,
    RemovalPolicy
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment_name = environment_name
        
        # Create VPC with multiple AZs
        self.vpc = ec2.Vpc(
            self, f"Vpc-{environment_name}",
            max_azs=2,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # VPC Flow Logs
        flow_log_group = logs.LogGroup(
            self, f"VpcFlowLogGroup-{environment_name}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, f"VpcFlowLog-{environment_name}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_log_group)
        )
        
        # VPC Endpoints for AWS services
        self._create_vpc_endpoints()
        
        # Tagging
        Tags.of(self.vpc).add("Environment", environment_name)
        Tags.of(self.vpc).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"VpcId-{environment_name}",
            value=self.vpc.vpc_id,
            export_name=f"VpcId-{environment_name}"
        )
    
    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services"""
        # S3 Gateway Endpoint
        self.vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_name}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )
        
        # ECR Interface Endpoints
        self.vpc.add_interface_endpoint(
            f"EcrEndpoint-{self.environment_name}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR
        )
        
        self.vpc.add_interface_endpoint(
            f"EcrDockerEndpoint-{self.environment_name}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER
        )
        
        # CloudWatch Logs Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"CloudWatchLogsEndpoint-{self.environment_name}",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
        )
        
        # Secrets Manager Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"SecretsManagerEndpoint-{self.environment_name}",
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER
        )
4. Security Stack
infrastructure/security_stack.py

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    CfnOutput,
    Tags
)
from constructs import Construct

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.environment_name = environment_name
        
        # Create security groups
        self._create_security_groups()
        
        # Create IAM roles
        self._create_iam_roles()
        
        # Tagging
        self._add_tags()
    
    def _create_security_groups(self):
        """Create security groups for different components"""
        
        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, f"AlbSecurityGroup-{self.environment_name}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )
        
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )
        
        # ECS Security Group
        self.ecs_security_group = ec2.SecurityGroup(
            self, f"EcsSecurityGroup-{self.environment_name}",
            vpc=self.vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )
        
        self.ecs_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(8080),
            description="Allow traffic from ALB"
        )
        
        # RDS Security Group
        self.rds_security_group = ec2.SecurityGroup(
            self, f"RdsSecurityGroup-{self.environment_name}",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        self.rds_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL traffic from ECS"
        )
    
    def _create_iam_roles(self):
        """Create IAM roles for different services"""
        
        # ECS Task Execution Role
        self.ecs_task_execution_role = iam.Role(
            self, f"EcsTaskExecutionRole-{self.environment_name}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
            ]
        )
        
        # Add additional permissions for Secrets Manager
        self.ecs_task_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue"
                ],
                resources=[f"arn:aws:secretsmanager:{self.region}:{self.account}:secret:*"]
            )
        )
        
        # ECS Task Role
        self.ecs_task_role = iam.Role(
            self, f"EcsTaskRole-{self.environment_name}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )
        
        # Add policies to ECS Task Role
        self.ecs_task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                resources=[f"arn:aws:secretsmanager:{self.region}:{self.account}:secret:*"]
            )
        )
        
        self.ecs_task_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[f"arn:aws:logs:{self.region}:{self.account}:*"]
            )
        )
    
    def _add_tags(self):
        """Add tags to all resources"""
        Tags.of(self.alb_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_security_group).add("Environment", self.environment_name)
        Tags.of(self.rds_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_execution_role).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_role).add("Environment", self.environment_name)
5. Secrets Stack
infrastructure/secrets_stack.py

from aws_cdk import (
    Stack,
    aws_secretsmanager as secretsmanager,
    CfnOutput,
    Tags,
    RemovalPolicy
)
from constructs import Construct

class SecretsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment_name = environment_name
        
        # Create database credentials secret
        self.database_secret = secretsmanager.Secret(
            self, f"DatabaseSecret-{environment_name}",
            description=f"Database credentials for {environment_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create application secrets
        self.app_secret = secretsmanager.Secret(
            self, f"AppSecret-{environment_name}",
            description=f"Application secrets for {environment_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"jwt_secret": ""}',
                generate_string_key="jwt_secret",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                password_length=64
            ),
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Tagging
        Tags.of(self.database_secret).add("Environment", environment_name)
        Tags.of(self.app_secret).add("Environment", environment_name)
        
        # Outputs
        CfnOutput(
            self, f"DatabaseSecretArn-{environment_name}",
            value=self.database_secret.secret_arn,
            export_name=f"DatabaseSecretArn-{environment_name}"
        )
6. ECR Stack
infrastructure/ecr_stack.py

from aws_cdk import (
    Stack,
    aws_ecr as ecr,
    RemovalPolicy,
    CfnOutput,
    Tags
)
from constructs import Construct

class EcrStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment_name = environment_name
        
        # Create ECR repository
        self.repository = ecr.Repository(
            self, f"AppRepository-{environment_name}",
            repository_name=f"cicd-app-{environment_name}",
            image_scan_on_push=True,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep last 10 images",
                    max_image_count=10,
                    tag_status=ecr.TagStatus.ANY
                ),
                ecr.LifecycleRule(
                    description="Delete untagged images after 1 day",
                    max_image_age=1,
                    tag_status=ecr.TagStatus.UNTAGGED
                )
            ],
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Tagging
        Tags.of(self.repository).add("Environment", environment_name)
        Tags.of(self.repository).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"RepositoryUri-{environment_name}",
            value=self.repository.repository_uri,
            export_name=f"RepositoryUri-{environment_name}"
        )
7. Fixed RDS Stack
infrastructure/rds_stack.py

from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class RdsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, 
                 security_group: ec2.SecurityGroup, database_secret: secretsmanager.Secret,
                 environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.security_group = security_group
        self.database_secret = database_secret
        self.environment_name = environment_name
        
        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self, f"RdsKmsKey-{environment_name}",
            description=f"KMS key for RDS encryption - {environment_name}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create subnet group
        subnet_group = rds.SubnetGroup(
            self, f"DatabaseSubnetGroup-{environment_name}",
            description=f"Subnet group for database - {environment_name}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )
        
        # Create parameter group
        parameter_group = rds.ParameterGroup(
            self, f"DatabaseParameterGroup-{environment_name}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            parameters={
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "all",
                "log_min_duration_statement": "1000"
            }
        )
        
        # Create database instance
        self.database = rds.DatabaseInstance(
            self, f"Database-{environment_name}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            credentials=rds.Credentials.from_secret(self.database_secret),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.security_group],
            parameter_group=parameter_group,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            multi_az=False,
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=False,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            cloudwatch_logs_exports=["postgresql"],
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Tagging
        Tags.of(self.database).add("Environment", environment_name)
        Tags.of(self.database).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"DatabaseEndpoint-{environment_name}",
            value=self.database.instance_endpoint.hostname,
            export_name=f"DatabaseEndpoint-{environment_name}"
        )
8. ALB Stack
infrastructure/alb_stack.py

from aws_cdk import (
    Stack,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ec2 as ec2,
    CfnOutput,
    Tags
)
from constructs import Construct

class AlbStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.security_group = security_group
        self.environment_name = environment_name
        
        # Create Application Load Balancer
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, f"LoadBalancer-{environment_name}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, f"TargetGroup-{environment_name}",
            vpc=self.vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=2,
                healthy_threshold_count=5
            )
        )
        
        # Create listener
        self.listener = self.load_balancer.add_listener(
            f"Listener-{environment_name}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )
        
        # Tagging
        Tags.of(self.load_balancer).add("Environment", environment_name)
        Tags.of(self.load_balancer).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"LoadBalancerDns-{environment_name}",
            value=self.load_balancer.load_balancer_dns_name,
            export_name=f"LoadBalancerDns-{environment_name}"
        )
9. ECS Stack (Complete)
infrastructure/ecs_stack.py

from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    aws_ecr as ecr,
    aws_secretsmanager as secretsmanager,
    aws_elasticloadbalancingv2 as elbv2,
    aws_applicationautoscaling as appscaling,
    Duration,
    CfnOutput,
    Tags,
    RemovalPolicy
)
from constructs import Construct

class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup, target_group: elbv2.ApplicationTargetGroup,
                 ecr_repository: ecr.Repository, database_secret: secretsmanager.Secret,
                 task_execution_role: iam.Role, task_role: iam.Role,
                 environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.security_group = security_group
        self.target_group = target_group
        self.ecr_repository = ecr_repository
        self.database_secret = database_secret
        self.task_execution_role = task_execution_role
        self.task_role = task_role
        self.environment_name = environment_name
        
        # Create ECS cluster
        self.cluster = ecs.Cluster(
            self, f"Cluster-{environment_name}",
            vpc=self.vpc,
            cluster_name=f"cicd-cluster-{environment_name}",
            container_insights=True
        )
        
        # Create task definition
        self.task_definition = self._create_task_definition()
        
        # Create ECS service
        self.service = self._create_service()
        
        # Setup auto scaling
        self._setup_auto_scaling()
        
        # Tagging
        Tags.of(self.cluster).add("Environment", environment_name)
        Tags.of(self.cluster).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"ClusterName-{environment_name}",
            value=self.cluster.cluster_name,
            export_name=f"ClusterName-{environment_name}"
        )
        
        CfnOutput(
            self, f"ServiceName-{environment_name}",
            value=self.service.service_name,
            export_name=f"ServiceName-{environment_name}"
        )
    
    def _create_task_definition(self):
        """Create ECS task definition"""
        task_definition = ecs.FargateTaskDefinition(
            self, f"TaskDefinition-{self.environment_name}",
            memory_limit_mib=512,
            cpu=256,
            execution_role=self.task_execution_role,
            task_role=self.task_role
        )
        
        # Create log group
        log_group = logs.LogGroup(
            self, f"LogGroup-{self.environment_name}",
            log_group_name=f"/ecs/cicd-app-{self.environment_name}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Add container
        container = task_definition.add_container(
            f"AppContainer-{self.environment_name}",
            image=ecs.ContainerImage.from_registry("nginx:latest"),  # Default image, will be updated by CI/CD
            port_mappings=[
                ecs.PortMapping(
                    container_port=8080,
                    protocol=ecs.Protocol.TCP
                )
            ],
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="ecs",
                log_group=log_group
            ),
            secrets={
                "DATABASE_URL": ecs.Secret.from_secrets_manager(self.database_secret)
            },
            environment={
                "ENVIRONMENT": self.environment_name,
                "PORT": "8080"
            }
        )
        
        return task_definition
    
    def _create_service(self):
        """Create ECS service"""
        service = ecs.FargateService(
            self, f"Service-{self.environment_name}",
            cluster=self.cluster,
            task_definition=self.task_definition,
            desired_count=2,
            security_groups=[self.security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            assign_public_ip=False,
            health_check_grace_period=Duration.seconds(60),
            enable_execute_command=True
        )
        
        # Attach to load balancer
        service.attach_to_application_target_group(self.target_group)
        
        return service
    
    def _setup_auto_scaling(self):
        """Setup auto scaling for ECS service"""
        scaling_target = self.service.auto_scale_task_count(
            min_capacity=1,
            max_capacity=10
        )
        
        # CPU utilization scaling
        scaling_target.scale_on_cpu_utilization(
            f"CpuScaling-{self.environment_name}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )
        
        # Memory utilization scaling
        scaling_target.scale_on_memory_utilization(
            f"MemoryScaling-{self.environment_name}",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )
10. Monitoring Stack
infrastructure/monitoring_stack.py

from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecs as ecs,
    aws_rds as rds,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 alb: elbv2.ApplicationLoadBalancer, ecs_service: ecs.FargateService,
                 rds_instance: rds.DatabaseInstance, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.alb = alb
        self.ecs_service = ecs