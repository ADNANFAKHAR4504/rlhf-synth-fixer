* You're absolutely right! Let me fix those issues and provide a complete, working solution. I'll address the CDK synth errors, deprecated versions, and missing modules.

## Fixed Project Structure and Complete Implementation
Let me start with the corrected requirements.txt and cdk.json files:

requirements.txt

aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
boto3>=1.28.0
pytest>=7.4.0
pytest-cov>=4.1.0
requests>=2.31.0
flask>=2.3.0
psycopg2-binary>=2.9.0

```json
cdk.json

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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
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
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```
<!-- 1. Corrected App Entry Point -->

app.py
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

# Store ALB DNS names for Route53
alb_dns_names = {}

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
    
    # Store ALB DNS for Route53
    alb_dns_names[env_name] = alb_stack.load_balancer.load_balancer_dns_name

# Global Route53 stack for production multi-region setup
route53_stack = Route53Stack(
    app, "Route53Stack",
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region='us-east-1'
    )
)

app.synth()
2. Fixed VPC Stack
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
            max_azs=3,
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
        
        vpc_flow_log = ec2.FlowLog(
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
        
3. Fixed Security Stack
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
        
        # GitHub Actions OIDC Role
        github_provider = iam.OpenIdConnectProvider(
            self, f"GitHubOidcProvider-{self.environment_name}",
            url="https://token.actions.githubusercontent.com",
            client_ids=["sts.amazonaws.com"],
            thumbprints=["6938fd4d98bab03faadb97b34396831e3780aea1"]
        )
        
        self.github_actions_role = iam.Role(
            self, f"GitHubActionsRole-{self.environment_name}",
            assumed_by=iam.WebIdentityPrincipal(
                github_provider.open_id_connect_provider_arn,
                conditions={
                    "StringEquals": {
                        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                    },
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": "repo:*:*"
                    }
                }
            )
        )
        
        # Add permissions for GitHub Actions
        self.github_actions_role.add_to_policy(
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
        
        self.github_actions_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ecs:UpdateService",
                    "ecs:DescribeServices",
                    "ecs:DescribeTaskDefinition",
                    "ecs:RegisterTaskDefinition"
                ],
                resources=["*"]
            )
        )
    
    def _add_tags(self):
        """Add tags to all resources"""
        Tags.of(self.alb_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_security_group).add("Environment", self.environment_name)
        Tags.of(self.rds_security_group).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_execution_role).add("Environment", self.environment_name)
        Tags.of(self.ecs_task_role).add("Environment", self.environment_name)
4. Secrets Stack
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
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod" else RemovalPolicy.RETAIN
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
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod" else RemovalPolicy.RETAIN
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
        
        CfnOutput(
            self, f"AppSecretArn-{environment_name}",
            value=self.app_secret.secret_arn,
            export_name=f"AppSecretArn-{environment_name}"
        )
5. Fixed ECR Stack
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
            removal_policy=RemovalPolicy.DESTROY if environment_name != "prod-primary" else RemovalPolicy.RETAIN
        )
        
        # Cross-region replication for production
        if "prod" in environment_name and self.region == "us-east-1":
            self._setup_cross_region_replication()
        
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
        ecr.CfnReplicationConfiguration(
            self, f"ReplicationConfiguration-{self.environment_name}",
            replication_configuration=ecr.CfnReplicationConfiguration.ReplicationConfigurationProperty(
                rules=[
                    ecr.CfnReplicationConfiguration.ReplicationRuleProperty(
                        destinations=[
                            ecr.CfnReplicationConfiguration.ReplicationDestinationProperty(
                                region="us-east-2",
                                registry_id=self.account
                            )
                        ],
                        repository_filters=[
                            ecr.CfnReplicationConfiguration.RepositoryFilterProperty(
                                filter=f"cicd-app-{self.environment_name}",
                                filter_type="PREFIX_MATCH"
                            )
                        ]
                    )
                ]
            )
        )
6. Fixed RDS Stack
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
            removal_policy=RemovalPolicy.DESTROY if environment_name not in ["prod-primary", "prod-secondary"] else RemovalPolicy.RETAIN
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
                "log_min_duration_statement": "1000",
                "log_connections": "1",
                "log_disconnections": "1"
            }
        )
        
        # Create database instance
        self.database = rds.DatabaseInstance(
            self, f"Database-{environment_name}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
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
            removal_policy=RemovalPolicy.DESTROY if environment_name not in ["prod-primary", "prod-secondary"] else RemovalPolicy.SNAPSHOT
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
    
    def _get_instance_type(self) -> ec2.InstanceType:
        """Get instance type based on environment"""