```python
"""
AWS Multi-Environment CI/CD Pipeline Infrastructure
Pulumi Infrastructure-as-Code implementation for Nova Model Breaking project
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict, List, Optional, Any
from pulumi import Config, Output, ResourceOptions


class TapStack:
    """
    Complete AWS infrastructure stack for multi-environment CI/CD pipeline
    Implements blue-green deployment, security scanning, monitoring, and cost optimization
    """
    
    def __init__(self, stack_name: str):
        """
        Initialize the infrastructure stack with environment-specific configurations
        
        Args:
            stack_name: The Pulumi stack name (dev, test, prod)
        """
        self.stack_name = stack_name
        self.config = Config()
        self.environment = self.config.get("environment") or stack_name
        self.region = self.config.get("region") or "us-east-1"
        
        # Environment-specific configurations
        self.env_config = self._get_environment_config()
        
        # Initialize AWS provider
        self.provider = aws.Provider(
            "aws-provider",
            region=self.region,
            default_tags={
                "tags": {
                    "Environment": self.environment,
                    "Project": "IaC-AWS-Nova-Model-Breaking",
                    "ManagedBy": "Pulumi",
                    "Stack": stack_name
                }
            }
        )
        
        # Core infrastructure components
        self.vpc = None
        self.security_groups = {}
        self.subnets = {}
        self.load_balancer = None
        self.ecs_cluster = None
        self.lambda_functions = {}
        self.secrets = {}
        self.pipeline = None
        
        # Build the infrastructure
        self._create_infrastructure()
    
    def _get_environment_config(self) -> Dict[str, Any]:
        """
        Get environment-specific configuration settings
        
        Returns:
            Dictionary containing environment-specific settings
        """
        configs = {
            "dev": {
                "instance_type": "t3.micro",
                "min_capacity": 1,
                "max_capacity": 2,
                "desired_capacity": 1,
                "enable_deletion_protection": False,
                "backup_retention": 7,
                "multi_az": False
            },
            "test": {
                "instance_type": "t3.small",
                "min_capacity": 1,
                "max_capacity": 3,
                "desired_capacity": 2,
                "enable_deletion_protection": False,
                "backup_retention": 14,
                "multi_az": True
            },
            "prod": {
                "instance_type": "t3.medium",
                "min_capacity": 2,
                "max_capacity": 10,
                "desired_capacity": 3,
                "enable_deletion_protection": True,
                "backup_retention": 30,
                "multi_az": True
            }
        }
        return configs.get(self.environment, configs["dev"])
    
    def _create_infrastructure(self):
        """
        Create the complete AWS infrastructure stack
        """
        # Core networking
        self._create_vpc()
        self._create_security_groups()
        
        # Storage and secrets
        self._create_secrets()
        self._create_s3_buckets()
        
        # Compute resources
        self._create_ecs_cluster()
        self._create_lambda_functions()
        
        # Load balancing
        self._create_load_balancer()
        
        # CI/CD Pipeline
        self._create_codebuild_projects()
        self._create_codedeploy_application()
        self._create_codepipeline()
        
        # Monitoring and logging
        self._create_cloudwatch_resources()
        
        # Export important outputs
        self._export_outputs()
    
    def _create_vpc(self):
        """
        Create VPC with public and private subnets across multiple AZs
        """
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"vpc-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"igw-{self.environment}",
            vpc_id=self.vpc.id,
            tags={"Name": f"igw-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Create subnets
        self.subnets = {
            "public": [],
            "private": []
        }
        
        for i, az in enumerate(azs.names[:3]):  # Use first 3 AZs
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{i+1}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
            self.subnets["public"].append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"private-subnet-{i+1}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
            self.subnets["private"].append(private_subnet)
            
            # NAT Gateway for private subnet internet access
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment}",
                domain="vpc",
                tags={"Name": f"nat-eip-{i+1}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
            
            nat_gw = aws.ec2.NatGateway(
                f"nat-gw-{i+1}-{self.environment}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={"Name": f"nat-gw-{i+1}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
            
            # Private route table
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gw.id
                    )
                ],
                tags={"Name": f"private-rt-{i+1}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
            
            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{self.environment}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(provider=self.provider)
            )
        
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{self.environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={"Name": f"public-rt-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.subnets["public"]):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{self.environment}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(provider=self.provider)
            )
    
    def _create_security_groups(self):
        """
        Create security groups for different components
        """
        # ALB Security Group
        self.security_groups["alb"] = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"alb-sg-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # ECS Security Group
        self.security_groups["ecs"] = aws.ec2.SecurityGroup(
            f"ecs-sg-{self.environment}",
            description="Security group for ECS tasks",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.security_groups["alb"].id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"ecs-sg-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Lambda Security Group
        self.security_groups["lambda"] = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"lambda-sg-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
    
    def _create_secrets(self):
        """
        Create AWS Secrets Manager secrets for sensitive data
        """
        # Database credentials
        self.secrets["db_credentials"] = aws.secretsmanager.Secret(
            f"db-credentials-{self.environment}",
            description="Database credentials",
            recovery_window_in_days=0 if self.environment == "dev" else 7,
            tags={"Name": f"db-credentials-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        aws.secretsmanager.SecretVersion(
            f"db-credentials-version-{self.environment}",
            secret_id=self.secrets["db_credentials"].id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "changeme123!",
                "engine": "mysql",
                "host": "localhost",
                "port": 3306,
                "dbname": f"nova_db_{self.environment}"
            }),
            opts=ResourceOptions(provider=self.provider)
        )
        
        # API keys and tokens
        self.secrets["api_keys"] = aws.secretsmanager.Secret(
            f"api-keys-{self.environment}",
            description="API keys and external service tokens",
            recovery_window_in_days=0 if self.environment == "dev" else 7,
            tags={"Name": f"api-keys-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        aws.secretsmanager.SecretVersion(
            f"api-keys-version-{self.environment}",
            secret_id=self.secrets["api_keys"].id,
            secret_string=json.dumps({
                "snyk_token": "your-snyk-token-here",
                "github_token": "your-github-token-here",
                "slack_webhook": "your-slack-webhook-here"
            }),
            opts=ResourceOptions(provider=self.provider)
        )
    
    def _create_s3_buckets(self):
        """
        Create S3 buckets for artifacts, logs, and backups
        """
        # Artifacts bucket
        self.artifacts_bucket = aws.s3.Bucket(
            f"artifacts-{self.environment}-{self.stack_name}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=self.env_config["backup_retention"]
                    ),
                    noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                        days=7
                    )
                )
            ],
            tags={"Name": f"artifacts-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"artifacts-pab-{self.environment}",
            bucket=self.artifacts_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(provider=self.provider)
        )
    
    def _create_ecs_cluster(self):
        """
        Create ECS Fargate cluster for containerized applications
        """
        # ECS Cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"cluster-{self.environment}",
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategies=[
                aws.ecs.ClusterDefaultCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE",
                    weight=1,
                    base=1
                ),
                aws.ecs.ClusterDefaultCapacityProviderStrategyArgs(
                    capacity_provider="FARGATE_SPOT",
                    weight=4
                )
            ],
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={"Name": f"cluster-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # ECS Task Execution Role
        task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        }
                    }
                ]
            }),
            tags={"Name": f"ecs-task-execution-role-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Attach managed policy
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-role-policy-{self.environment}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Custom policy for secrets access
        aws.iam.RolePolicyAttachment(
            f"ecs-secrets-policy-{self.environment}",
            role=task_execution_role.name,
            policy_arn=aws.iam.Policy(
                f"ecs-secrets-policy-{self.environment}",
                policy=pulumi.Output.all(
                    self.secrets["db_credentials"].arn,
                    self.secrets["api_keys"].arn
                ).apply(lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue"
                            ],
                            "Resource": arns
                        }
                    ]
                })),
                opts=ResourceOptions(provider=self.provider)
            ).arn,
            opts=ResourceOptions(provider=self.provider)
        )
        
        # ECS Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"app-task-{self.environment}",
            family=f"nova-app-{self.environment}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=task_execution_role.arn,
            task_role_arn=task_execution_role.arn,
            container_definitions=pulumi.Output.all(
                self.secrets["db_credentials"].arn,
                self.secrets["api_keys"].arn
            ).apply(lambda arns: json.dumps([
                {
                    "name": "nova-app",
                    "image": "nginx:latest",  # Replace with actual application image
                    "portMappings": [
                        {
                            "containerPort": 8080,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {"name": "ENVIRONMENT", "value": self.environment},
                        {"name": "AWS_REGION", "value": self.region}
                    ],
                    "secrets": [
                        {
                            "name": "DB_CREDENTIALS",
                            "valueFrom": arns[0]
                        },
                        {
                            "name": "API_KEYS",
                            "valueFrom": arns[1]
                        }
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": f"/ecs/nova-app-{self.environment}",
                            "awslogs-region": self.region,
                            "awslogs-stream-prefix": "ecs"
                        }
                    },
                    "essential": True
                }
            ])),
            tags={"Name": f"app-task-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
    
    def _create_load_balancer(self):
        """
        Create Application Load Balancer for blue-green deployments
        """
        # Application Load Balancer
        self.load_balancer = aws.lb.LoadBalancer(
            f"alb-{self.environment}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.subnets["public"]],
            security_groups=[self.security_groups["alb"].id],
            enable_deletion_protection=self.env_config["enable_deletion_protection"],
            tags={"Name": f"alb-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Target Groups for Blue-Green Deployment
        self.target_groups = {}
        for color in ["blue", "green"]:
            self.target_groups[color] = aws.lb.TargetGroup(
                f"tg-{color}-{self.environment}",
                port=8080,
                protocol="HTTP",
                vpc_id=self.vpc.id,
                target_type="ip",
                health_check=aws.lb.TargetGroupHealthCheckArgs(
                    enabled=True,
                    healthy_threshold=2,
                    interval=30,
                    matcher="200",
                    path="/health",
                    port="traffic-port",
                    protocol="HTTP",
                    timeout=5,
                    unhealthy_threshold=2
                ),
                tags={"Name": f"tg-{color}-{self.environment}"},
                opts=ResourceOptions(provider=self.provider)
            )
        
        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"alb-listener-{self.environment}",
            load_balancer_arn=self.load_balancer.arn,
            port="80",
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_groups["blue"].arn
                )
            ],
            tags={"Name": f"alb-listener-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # ECS Service
        self.ecs_service = aws.ecs.Service(
            f"app-service-{self.environment}",
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=self.env_config["desired_capacity"],
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.subnets["private"]],
                security_groups=[self.security_groups["ecs"].id],
                assign_public_ip=False
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_groups["blue"].arn,
                    container_name="nova-app",
                    container_port=8080
                )
            ],
            deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
                maximum_percent=200,
                minimum_healthy_percent=50,
                deployment_circuit_breaker=aws.ecs.ServiceDeploymentConfigurationDeploymentCircuitBreakerArgs(
                    enable=True,
                    rollback=True
                )
            ),
            enable_execute_command=True,
            tags={"Name": f"app-service-{self.environment}"},
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[self.alb_listener]
            )
        )
    
    def _create_lambda_functions(self):
        """
        Create Lambda functions for serverless components
        """
        # Lambda execution role
        lambda_role = aws.iam.Role(
            f"lambda-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ],
            tags={"Name": f"lambda-role-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Health check Lambda function
        self.lambda_functions["health_check"] = aws.lambda_.Function(
            f"health-check-{self.environment}",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import urllib3

def lambda_handler(event, context):
    '''
    Health check function for monitoring application status
    '''
    http = urllib3.PoolManager()
    
    try:
        # Check application health endpoint
        response = http.request('GET', event.get('url', 'http://localhost/health'))
        
        if response.status == 200:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'healthy',
                    'timestamp': context.aws_request_id
                })
            }
        else:
            raise Exception(f'Health check failed with status {response.status}')
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': context.aws_request_id
            })
        }
                """)
            }),
            handler="index.lambda_handler",
            role=lambda_role.arn,
            timeout=30,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.subnets["private"]],
                security_group_ids=[self.security_groups["lambda"].id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "REGION": self.region
                }
            ),
            tags={"Name": f"health-check-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Deployment notification Lambda
        self.lambda_functions["deployment_notification"] = aws.lambda_.Function(
            f"deployment-notification-{self.environment}",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import urllib3

def lambda_handler(event, context):
    '''
    Send deployment notifications to Slack/Teams
    '''
    try:
        # Parse CodePipeline event
        detail = event.get('detail', {})
        pipeline = detail.get('pipeline', 'unknown')
        state = detail.get('state', 'unknown')
        
        message = {
            'text': f'Pipeline {pipeline} is now {state}',
            'environment': event.get('environment', 'unknown'),
            'timestamp': context.aws_request_id
        }
        
        # Send notification (implement your notification logic here)
        print(json.dumps(message))
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Notification sent successfully'})
        }
        
    except Exception as e:
        print(f'Error sending notification: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
                """)
            }),
            handler="index.lambda_handler",
            role=lambda_role.arn,
            timeout=30,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "REGION": self.region
                }
            ),
            tags={"Name": f"deployment-notification-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
    
    def _create_codebuild_projects(self):
        """
        Create CodeBuild projects for CI/CD pipeline
        """
        # CodeBuild service role
        codebuild_role = aws.iam.Role(
            f"codebuild-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "codebuild.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={"Name": f"codebuild-role-{self.environment}"},
            opts=ResourceOptions(provider=self.provider)
        )
        
        # CodeBuild policy
        codebuild_policy = aws.iam.RolePolicy(
            f"codebuild-policy-{self.environment}",
            role=codebuild_role.id,
            policy=pulumi.Output.all(
                self.artifacts_bucket.arn,
                self.secrets["api_keys"].arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage",
                            "ecr:GetAuthorizationToken"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(provider=self.provider)
        )
        
        # Build project
        self.build_project = aws.codebuild.Project(
            f"build-project-{self.environment}",
            service_role=codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL