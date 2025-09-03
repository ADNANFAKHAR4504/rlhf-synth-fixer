## Complex CI/CD Pipeline with AWS CDK Python

I'll create a comprehensive, production-ready CI/CD pipeline using AWS CDK Python that meets all your requirements. This solution includes multi-region deployment, blue-green deployments, comprehensive security, and monitoring.

## Project Structure
cicd-infrastructure/
├── app.py                          # CDK app entry point
├── requirements.txt                # Python dependencies
├── cdk.json                        # CDK configuration
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml          # Development deployment
│       ├── deploy-staging.yml      # Staging deployment
│       └── deploy-prod.yml         # Production deployment
├── infrastructure/
│   ├── __init__.py
│   ├── vpc_stack.py               # VPC and networking
│   ├── security_stack.py          # IAM roles and security groups
│   ├── ecr_stack.py              # Container registry
│   ├── rds_stack.py              # Database infrastructure
│   ├── ecs_stack.py              # Container orchestration
│   ├── alb_stack.py              # Load balancer
│   ├── monitoring_stack.py       # CloudWatch monitoring
│   ├── secrets_stack.py          # Secrets Manager
│   ├── route53_stack.py          # DNS and health checks
│   └── pipeline_stack.py         # CI/CD pipeline
├── application/
│   ├── Dockerfile
│   ├── app.py                    # Sample Flask application
│   ├── requirements.txt
│   └── tests/
│       ├── test_unit.py
│       └── test_integration.py
└── docs/
    ├── architecture.md
    ├── deployment.md
    └── operations.md

1. CDK App Entry Point

<!-- app.py -->
```py
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
from infrastructure.pipeline_stack import PipelineStack

app = cdk.App()

# Environment configuration
environments = {
    'dev': {
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
        'region': 'us-east-1'
    },
    'staging': {
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
        'region': 'us-east-1'
    },
    'prod-primary': {
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
        'region': 'us-east-1'
    },
    'prod-secondary': {
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
        'region': 'us-east-2'
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
        env=env,
        environment_name=env_name
    )
    
    alb_stack = AlbStack(
        app, f"AlbStack-{env_name}",
        vpc=vpc_stack.vpc,
        security_group=security_stack.alb_security_group,
        env=env,
        environment_name=env_name
    )
    
    ecs_stack = EcsStack(
        app, f"EcsStack-{env_name}",
        vpc=vpc_stack.vpc,
        security_group=security_stack.ecs_security_group,
        target_group=alb_stack.target_group,
        ecr_repository=ecr_stack.repository,
        database_secret=secrets_stack.database_secret,
        env=env,
        environment_name=env_name
    )
    
    monitoring_stack = MonitoringStack(
        app, f"MonitoringStack-{env_name}",
        alb=alb_stack.load_balancer,
        ecs_service=ecs_stack.service,
        rds_instance=rds_stack.database,
        env=env,
        environment_name=env_name
    )

# Global Route53 stack for multi-region setup
if 'prod' in [env for env in environments.keys()]:
    route53_stack = Route53Stack(
        app, "Route53Stack",
        primary_alb_dns=None,  # Will be set via cross-stack references
        secondary_alb_dns=None,
        env=cdk.Environment(
            account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
            region='us-east-1'
        )
    )

# CI/CD Pipeline stack
pipeline_stack = PipelineStack(
    app, "PipelineStack",
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region='us-east-1'
    )
)

app.synth()
2. VPC and Networking Stack
infrastructure/vpc_stack.py

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput,
    Tags
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment_name = environment_name
        
        # Create VPC with multiple AZs
        self.vpc = ec2.Vpc(
            self, f"Vpc-{environment_name}",
            max_azs=3,
            cidr="10.0.0.0/16",
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
        vpc_flow_log = ec2.FlowLog(
            self, f"VpcFlowLog-{environment_name}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, f"VpcFlowLogGroup-{environment_name}",
                    retention=logs.RetentionDays.ONE_MONTH
                )
            )
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
        
        CfnOutput(
            self, f"PrivateSubnetIds-{environment_name}",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            export_name=f"PrivateSubnetIds-{environment_name}"
        )
    
    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services"""
        # S3 Gateway Endpoint
        self.vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_name}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )
        
        # DynamoDB Gateway Endpoint
        self.vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{self.environment_name}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
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
3. Security Stack
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
        
        # CodeBuild Service Role
        self.codebuild_role = iam.Role(
            self, f"CodeBuildRole-{self.environment_name}",
            assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSCodeBuildDeveloperAccess")
            ]
        )
        
        # Add additional permissions to CodeBuild role
        self.codebuild_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "ecr:GetAuthorizationToken",
                    "ecr:PutImage",
                    "ecr:InitiateLayerUpload",
                    "ecr:UploadLayerPart",
                    "ecr:CompleteLayerUpload"
                ],
                resources=["*"]
            )
        )
        
        # CodeDeploy Service Role
        self.codedeploy_role = iam.Role(
            self, f"CodeDeployRole-{self.environment_name}",
            assumed_by=iam.ServicePrincipal("codedeploy.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSCodeDeployRoleForECS")
            ]
        )
    
    def _add_tags(self):
        """Add tags to all resources"""
        Tags.of(self.alb_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_security_group).add("Environment", self.environment_name)
        Tags.of(self.rds_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_execution_role).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_role).add("Environment", self.environment_name)
4. ECR Stack
infrastructure/ecr_stack.py

from aws_cdk import (
    Stack,
    aws_ecr as ecr,
    aws_iam as iam,
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
                    description="Keep last 10 production images",
                    max_image_count=10,
                    tag_status=ecr.TagStatus.TAGGED,
                    tag_prefix_list=["prod"]
                ),
                ecr.LifecycleRule(
                    description="Keep last 5 staging images",
                    max_image_count=5,
                    tag_status=ecr.TagStatus.TAGGED,
                    tag_prefix_list=["staging"]
                ),
                ecr.LifecycleRule(
                    description="Keep last 3 dev images",
                    max_image_count=3,
                    tag_status=ecr.TagStatus.TAGGED,
                    tag_prefix_list=["dev"]
                ),
                ecr.LifecycleRule(
                    description="Delete untagged images after 1 day",
                    max_image_age=1,
                    tag_status=ecr.TagStatus.UNTAGGED
                )
            ],
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod" else RemovalPolicy.RETAIN
        )
        
        # Cross-region replication for production
        if "prod" in environment_name:
            self._setup_cross_region_replication()
        
        # Grant permissions for CI/CD
        self._setup_cicd_permissions()
        
        # Tagging
        Tags.of(self.repository).add("Environment", environment_name)
        Tags.of(self.repository).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"RepositoryUri-{environment_name}",
            value=self.repository.repository_uri,
            export_name=f"RepositoryUri-{environment_name}"
        )
    
    def _setup_cross_region_replication(self):
        """Setup cross-region replication for production repositories"""
        replication_configuration = ecr.CfnReplicationConfiguration(
            self, f"ReplicationConfiguration-{self.environment_name}",
            replication_configuration={
                "rules": [
                    {
                        "destinations": [
                            {
                                "region": "us-east-2",
                                "registryId": self.account
                            }
                        ],
                        "repositoryFilters": [
                            {
                                "filter": f"cicd-app-{self.environment_name}",
                                "filterType": "PREFIX_MATCH"
                            }
                        ]
                    }
                ]
            }
        )
    
    def _setup_cicd_permissions(self):
        """Setup permissions for CI/CD pipeline"""
        # Allow GitHub Actions to push images
        self.repository.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ArnPrincipal(f"arn:aws:iam::{self.account}:role/GitHubActionsRole")],
                actions=[
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "ecr:PutImage",
                    "ecr:InitiateLayerUpload",
                    "ecr:UploadLayerPart",
                    "ecr:CompleteLayerUpload"
                ]
            )
        )
5. RDS Stack
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
                 security_group: ec2.SecurityGroup, environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.security_group = security_group
        self.environment_name = environment_name
        
        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self, f"RdsKmsKey-{environment_name}",
            description=f"KMS key for RDS encryption - {environment_name}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod" else RemovalPolicy.RETAIN
        )
        
        # Create database credentials secret
        self.database_secret = secretsmanager.Secret(
            self, f"DatabaseSecret-{environment_name}",
            description=f"Database credentials for {environment_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                password_length=32
            )
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
                version=rds.PostgresEngineVersion.VER_14_9
            ),
            parameters={
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "all",
                "log_min_duration_statement": "1000",
                "log_connections": "1",
                "log_disconnections": "1"
            }
        )
        
        # Create database instance
        self.database = rds.DatabaseInstance(
            self, f"Database-{environment_name}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14_9
            ),
            instance_type=self._get_instance_type(),
            credentials=rds.Credentials.from_secret(self.database_secret),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.security_group],
            parameter_group=parameter_group,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            multi_az=self._is_multi_az(),
            allocated_storage=self._get_allocated_storage(),
            max_allocated_storage=self._get_max_allocated_storage(),
            storage_type=rds.StorageType.GP3,
            backup_retention=Duration.days(self._get_backup_retention_days()),
            delete_automated_backups=False,
            deletion_protection=self._get_deletion_protection(),
            monitoring_interval=Duration.seconds(60),
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            enable_performance_insights=True,
            cloudwatch_logs_exports=["postgresql"],
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod" else RemovalPolicy.SNAPSHOT
        )
        
        # Create read replica for production
        if "prod" in environment_name and self.region == "us-east-1":
            self._create_read_replica()
        
        # Tagging
        Tags.of(self.database).add("Environment", environment_name)
        Tags.of(self.database).add("Project", "CICD-Infrastructure")
        
        # Outputs
        CfnOutput(
            self, f"DatabaseEndpoint-{environment_name}",
            value=self.database.instance_endpoint.hostname,
            export_name=f"DatabaseEndpoint-{environment_name}"
        )
        
        CfnOutput(
            self, f"DatabaseSecretArn-{environment_name}",
            value=self.database_secret.secret_arn,
            export_name=f"DatabaseSecretArn-{environment_name}"
        )
    
    def _get_instance_type(self) -> ec2.InstanceType:
        """Get instance type based on environment"""
        if "prod" in self.environment_name:
            return ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
        elif "staging" in self.environment_name:
            return ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM)
        else:
            return ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO)
    
    def _is_multi_az(self) -> bool:
        """Determine if multi-AZ should be enabled"""
        return "prod" in self.environment_name
    
    def _get_allocated_storage(self) -> int:
        """Get allocated storage based on environment"""
        if "prod" in self.environment_name:
            return 100
        elif "staging" in self.environment_name:
            return 50
        else:
            return 20
    
    def _get_max_allocated_storage(self) -> int:
        """Get max allocated storage based on environment"""
        if "prod" in self.environment_name:
            return 1000
        elif "staging" in self.environment_name:
            return 200
        else:
            return 50
    
    def _get_backup_retention_days(self) -> int:
        """Get backup retention days based on environment"""
        if "prod" in self.environment_name:
            return 30
        elif "staging" in self.environment_name:
            return 7
        else:
            return 1
    
    def _get_deletion_protection(self) -> bool:
        """Determine if deletion protection should be enabled"""
        return "prod" in self.environment_name
    
    def _create_read_replica(self):
        """Create read replica in secondary region for production"""
        self.read_replica = rds.DatabaseInstanceReadReplica(
            self, f"DatabaseReadReplica-{self.environment_name}",
            source_database_instance=self.database,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
            vpc=self.vpc,
            security_groups=[self.security_group],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            monitoring_interval=Duration.seconds(60),
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            enable_performance_insights=True,
            cloudwatch_logs_exports=["postgresql"]
        )
6. ECS Stack
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
    aws_servicediscovery as servicediscovery,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 security_group: ec2.SecurityGroup, target_group: elbv2.ApplicationTargetGroup,
                 ecr_repository: ecr.Repository, database_secret: secretsmanager.Secret,
                 environment_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.security_group = security_group
        self.target_group = target_group
        self.ecr_repository = ecr_repository
        self.database_secret = database_secret
        self.environment_name = environment_name
        
        # Create ECS cluster
        self.cluster = ecs.Cluster(
            self, f"Cluster-{environment_name}",
            vpc=self.vpc,
            cluster_name=f"cicd-cluster-{environment_name}",
            container_insights=True
        )
        
        # Create service discovery namespace
        self.namespace = servicediscovery.PrivateDnsNamespace(
            self, f"ServiceDiscoveryNamespace-{environment_name}",
            name=f"cicd.{environment_name}.local",
            vpc=self.vpc
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
            value=self.service