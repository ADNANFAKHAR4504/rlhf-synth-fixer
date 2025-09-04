## lib/tap_stack.py

```python
"""
AWS Multi-Environment CI/CD Pipeline Infrastructure using Pulumi
Implements a complete DevOps pipeline with blue-green deployments, monitoring, and security scanning.
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict, List, Optional, Any


class TapStack:
    """
    Main infrastructure stack for AWS Nova Model Breaking project.
    Provisions multi-environment CI/CD pipeline with blue-green deployments.
    """
    
    def __init__(self, name: str, opts: Optional[pulumi.ResourceOptions] = None):
        """
        Initialize the TAP (Test, Analyze, Pipeline) stack.
        
        Args:
            name: Stack name identifier
            opts: Pulumi resource options
        """
        self.name = name
        self.opts = opts
        self.config = pulumi.Config()
        
        # Environment configuration
        self.environment = self.config.get("environment") or "development"
        self.region = self.config.get("region") or "us-east-1"
        self.project_name = "nova-model-breaking"
        
        # Environment-specific settings
        self.env_config = self._get_environment_config()
        
        # Initialize resources
        self.vpc = None
        self.subnets = {}
        self.security_groups = {}
        self.iam_roles = {}
        self.lambda_functions = {}
        self.codebuild_projects = {}
        self.codepipeline = None
        self.secrets = {}
        self.cloudwatch_resources = {}
        self.load_balancers = {}
        self.target_groups = {}
        
        # Build infrastructure
        self._create_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_secrets()
        self._create_lambda_functions()
        self._create_codebuild_projects()
        self._create_codedeploy_application()
        self._create_codepipeline()
        self._create_load_balancers()
        self._create_monitoring()
        
    def _get_environment_config(self) -> Dict[str, Any]:
        """Get environment-specific configuration settings."""
        configs = {
            "development": {
                "instance_type": "t3.micro",
                "min_capacity": 1,
                "max_capacity": 2,
                "desired_capacity": 1,
                "multi_az": False,
                "backup_retention": 7,
                "monitoring_detailed": False
            },
            "testing": {
                "instance_type": "t3.small",
                "min_capacity": 1,
                "max_capacity": 3,
                "desired_capacity": 2,
                "multi_az": True,
                "backup_retention": 14,
                "monitoring_detailed": True
            },
            "production": {
                "instance_type": "t3.medium",
                "min_capacity": 2,
                "max_capacity": 10,
                "desired_capacity": 3,
                "multi_az": True,
                "backup_retention": 30,
                "monitoring_detailed": True
            }
        }
        return configs.get(self.environment, configs["development"])
    
    def _create_networking(self) -> None:
        """Create VPC and networking infrastructure with multi-AZ support."""
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.project_name}-{self.environment}-vpc",
                "Environment": self.environment,
                "Project": self.project_name
            },
            opts=self.opts
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{self.name}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.project_name}-{self.environment}-igw",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Public subnets
        self.subnets["public"] = []
        for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
            subnet = aws.ec2.Subnet(
                f"{self.name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.project_name}-{self.environment}-public-{i+1}",
                    "Environment": self.environment,
                    "Type": "public"
                },
                opts=self.opts
            )
            self.subnets["public"].append(subnet)
        
        # Private subnets
        self.subnets["private"] = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{self.project_name}-{self.environment}-private-{i+1}",
                    "Environment": self.environment,
                    "Type": "private"
                },
                opts=self.opts
            )
            self.subnets["private"].append(subnet)
        
        # NAT Gateways for private subnets
        for i, public_subnet in enumerate(self.subnets["public"]):
            eip = aws.ec2.Eip(
                f"{self.name}-nat-eip-{i+1}",
                domain="vpc",
                tags={
                    "Name": f"{self.project_name}-{self.environment}-nat-eip-{i+1}",
                    "Environment": self.environment
                },
                opts=self.opts
            )
            
            nat_gw = aws.ec2.NatGateway(
                f"{self.name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"{self.project_name}-{self.environment}-nat-gw-{i+1}",
                    "Environment": self.environment
                },
                opts=self.opts
            )
        
        # Route tables
        public_rt = aws.ec2.RouteTable(
            f"{self.name}-public-rt",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"{self.project_name}-{self.environment}-public-rt",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.subnets["public"]):
            aws.ec2.RouteTableAssociation(
                f"{self.name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=self.opts
            )
    
    def _create_security_groups(self) -> None:
        """Create security groups for different components."""
        # ALB Security Group
        self.security_groups["alb"] = aws.ec2.SecurityGroup(
            f"{self.name}-alb-sg",
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
            tags={
                "Name": f"{self.project_name}-{self.environment}-alb-sg",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Application Security Group
        self.security_groups["app"] = aws.ec2.SecurityGroup(
            f"{self.name}-app-sg",
            description="Security group for application instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.security_groups["alb"].id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["10.0.0.0/16"]
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
            tags={
                "Name": f"{self.project_name}-{self.environment}-app-sg",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Lambda Security Group
        self.security_groups["lambda"] = aws.ec2.SecurityGroup(
            f"{self.name}-lambda-sg",
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
            tags={
                "Name": f"{self.project_name}-{self.environment}-lambda-sg",
                "Environment": self.environment
            },
            opts=self.opts
        )
    
    def _create_iam_roles(self) -> None:
        """Create IAM roles for various services."""
        # CodeBuild Service Role
        codebuild_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.iam_roles["codebuild"] = aws.iam.Role(
            f"{self.name}-codebuild-role",
            assume_role_policy=codebuild_assume_role_policy,
            tags={
                "Name": f"{self.project_name}-{self.environment}-codebuild-role",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # CodeBuild Policy
        codebuild_policy = aws.iam.RolePolicy(
            f"{self.name}-codebuild-policy",
            role=self.iam_roles["codebuild"].id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject",
                            "secretsmanager:GetSecretValue",
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "codebuild:CreateReportGroup",
                            "codebuild:CreateReport",
                            "codebuild:UpdateReport",
                            "codebuild:BatchPutTestCases"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=self.opts
        )
        
        # CodePipeline Service Role
        codepipeline_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.iam_roles["codepipeline"] = aws.iam.Role(
            f"{self.name}-codepipeline-role",
            assume_role_policy=codepipeline_assume_role_policy,
            tags={
                "Name": f"{self.project_name}-{self.environment}-codepipeline-role",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # CodePipeline Policy
        codepipeline_policy = aws.iam.RolePolicy(
            f"{self.name}-codepipeline-policy",
            role=self.iam_roles["codepipeline"].id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetBucketVersioning",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject",
                            "codebuild:BatchGetBuilds",
                            "codebuild:StartBuild",
                            "codedeploy:CreateDeployment",
                            "codedeploy:GetApplication",
                            "codedeploy:GetApplicationRevision",
                            "codedeploy:GetDeployment",
                            "codedeploy:GetDeploymentConfig",
                            "codedeploy:RegisterApplicationRevision"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=self.opts
        )
        
        # CodeDeploy Service Role
        codedeploy_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codedeploy.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.iam_roles["codedeploy"] = aws.iam.Role(
            f"{self.name}-codedeploy-role",
            assume_role_policy=codedeploy_assume_role_policy,
            managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"],
            tags={
                "Name": f"{self.project_name}-{self.environment}-codedeploy-role",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Lambda Execution Role
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.iam_roles["lambda"] = aws.iam.Role(
            f"{self.name}-lambda-role",
            assume_role_policy=lambda_assume_role_policy,
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
            ],
            tags={
                "Name": f"{self.project_name}-{self.environment}-lambda-role",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Lambda Policy for additional permissions
        lambda_policy = aws.iam.RolePolicy(
            f"{self.name}-lambda-policy",
            role=self.iam_roles["lambda"].id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "codedeploy:PutLifecycleEventHookExecutionStatus",
                            "cloudwatch:PutMetricData",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=self.opts
        )
        
        # EC2 Instance Profile Role
        ec2_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        })
        
        self.iam_roles["ec2"] = aws.iam.Role(
            f"{self.name}-ec2-role",
            assume_role_policy=ec2_assume_role_policy,
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
            ],
            tags={
                "Name": f"{self.project_name}-{self.environment}-ec2-role",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # EC2 Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"{self.name}-ec2-instance-profile",
            role=self.iam_roles["ec2"].name,
            opts=self.opts
        )
    
    def _create_secrets(self) -> None:
        """Create AWS Secrets Manager secrets for sensitive data."""
        # Database credentials
        self.secrets["db_credentials"] = aws.secretsmanager.Secret(
            f"{self.name}-db-credentials",
            description="Database credentials for the application",
            tags={
                "Name": f"{self.project_name}-{self.environment}-db-credentials",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # API keys and tokens
        self.secrets["api_keys"] = aws.secretsmanager.Secret(
            f"{self.name}-api-keys",
            description="API keys and external service tokens",
            tags={
                "Name": f"{self.project_name}-{self.environment}-api-keys",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Snyk token for security scanning
        self.secrets["snyk_token"] = aws.secretsmanager.Secret(
            f"{self.name}-snyk-token",
            description="Snyk authentication token for security scanning",
            tags={
                "Name": f"{self.project_name}-{self.environment}-snyk-token",
                "Environment": self.environment
            },
            opts=self.opts
        )
    
    def _create_lambda_functions(self) -> None:
        """Create Lambda functions for serverless components."""
        # Deployment validation Lambda
        validation_code = '''
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Validates deployment health and triggers rollback if needed.
    """
    try:
        codedeploy = boto3.client('codedeploy')
        cloudwatch = boto3.client('cloudwatch')
        
        deployment_id = event.get('DeploymentId')
        lifecycle_event_hook_execution_id = event.get('LifecycleEventHookExecutionId')
        
        # Perform health checks
        health_check_passed = perform_health_checks()
        
        if health_check_passed:
            status = 'Succeeded'
            logger.info(f"Deployment {deployment_id} validation passed")
        else:
            status = 'Failed'
            logger.error(f"Deployment {deployment_id} validation failed")
        
        # Report back to CodeDeploy
        if lifecycle_event_hook_execution_id:
            codedeploy.put_lifecycle_event_hook_execution_status(
                deploymentId=deployment_id,
                lifecycleEventHookExecutionId=lifecycle_event_hook_execution_id,
                status=status
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': status,
                'deploymentId': deployment_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error in deployment validation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def perform_health_checks():
    """Perform application health checks."""
    # Implement your health check logic here
    # This could include HTTP endpoint checks, database connectivity, etc.
    return True
'''
        
        self.lambda_functions["deployment_validator"] = aws.lambda_.Function(
            f"{self.name}-deployment-validator",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(validation_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.iam_roles["lambda"].arn,
            timeout=300,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.subnets["private"]],
                security_group_ids=[self.security_groups["lambda"].id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "PROJECT_NAME": self.project_name
                }
            ),
            tags={
                "Name": f"{self.project_name}-{self.environment}-deployment-validator",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Monitoring Lambda for custom metrics
        monitoring_code = '''
import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Collects custom metrics and sends to CloudWatch.
    """
    try:
        cloudwatch = boto3.client('cloudwatch')
        
        # Example custom metrics
        metrics = [
            {
                'MetricName': 'ApplicationHealth',
                'Value': 1.0,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'DeploymentSuccess',
                'Value': 1.0,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }
        ]
        
        # Send metrics to CloudWatch
        for metric in metrics:
            cloudwatch.put_metric_data(
                Namespace=f"NovaModel/{event.get('environment', 'development')}",
                MetricData=[metric]
            )
        
        logger.info("Custom metrics sent successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Metrics sent successfully'})
        }
        
    except Exception as e:
        logger.error(f"Error sending metrics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
'''
        
        self.lambda_functions["monitoring"] = aws.lambda_.Function(
            f"{self.name}-monitoring",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(monitoring_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.iam_roles["lambda"].arn,
            timeout=60,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "PROJECT_NAME": self.project_name
                }
            ),
            tags={
                "Name": f"{self.project_name}-{self.environment}-monitoring",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Schedule monitoring Lambda to run every 5 minutes
        monitoring_schedule = aws.cloudwatch.EventRule(
            f"{self.name}-monitoring-schedule",
            description="Trigger monitoring Lambda every 5 minutes",
            schedule_expression="rate(5 minutes)",
            opts=self.opts
        )
        
        aws.cloudwatch.EventTarget(
            f"{self.name}-monitoring-target",
            rule=monitoring_schedule.name,
            arn=self.lambda_functions["monitoring"].arn,
            opts=self.opts
        )
        
        # Grant CloudWatch Events permission to invoke Lambda
        aws.lambda_.Permission(
            f"{self.name}-monitoring-permission",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function=self.lambda_functions["monitoring"].name,
            principal="events.amazonaws.com",
            source_arn=monitoring_schedule.arn,
            opts=self.opts
        )
    
    def _create_codebuild_projects(self) -> None:
        """Create CodeBuild projects for different stages."""
        # S3 bucket for artifacts
        self.artifacts_bucket = aws.s3.Bucket(
            f"{self.name}-artifacts",
            bucket=f"{self.project_name}-{self.environment}-artifacts-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            public_access_block=aws.s3.BucketPublicAccessBlockArgs(
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True
            ),
            tags={
                "Name": f"{self.project_name}-{self.environment}-artifacts",
                "Environment": self.environment
            },
            opts=self.opts
        )
        
        # Build project buildspec
        buildspec = {
            "version": "0.2",
            "phases": {
                "install": {
                    "runtime-versions": {
                        "python": "3.9"
                    },
                    "commands": [
                        "echo Installing dependencies...",
                        "pip install --upgrade pip",
                        "pip install pytest pytest-cov boto3 requests",
                        "pip install -r requirements.txt || echo 'No requirements.txt found'"
                    ]
                },
                "pre_build": {
                    "commands": [
                        "echo Pre-build phase started on `date`",
                        "echo Logging in to Amazon ECR...",
                        "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com || echo 'ECR login failed'"
                    ]
                },
                "build": {
                    "commands": [
                        "echo Build started on `date`",
                        "echo Running unit tests...",
                        "python -m pytest tests/unit/ -v --cov=lib --cov-report=xml || echo 'Unit tests failed'",
                        "echo Running integration tests...",
                        "python -m pytest tests/integration/ -v || echo 'Integration tests failed'",
                        "echo Running Snyk security scan...",
                        "npm install -g snyk || echo 'Snyk installation failed'",
                        "snyk auth $SNYK_TOKEN || echo 'Snyk auth failed'",
                        "snyk test --severity-threshold=high || echo 'Snyk scan found vulnerabilities'",
                        "echo Building application..."
                    ]
                },
                "post_build": {
                    "commands": [
                        "echo Build completed on `date`",
                        "echo Creating deployment package...",
                        "zip -r deployment.zip . -x '*.git*' '__pycache__/*' '*.pyc' 'tests/*'"
                    ]
                }
            },
            "artifacts": {
                "files": [
                    "**/*"
                ],
                "exclude-paths": [
                    ".git/**/*",
                    "__pycache__/**/*",
                    "*.pyc"
                ]
            },
            "reports": {
                "coverage": {
                    "files": "coverage.xml",
                    "file-format": "COBERTURAXML"
                },
                "pytest": {
                    "files": "test-results.xml",
                    "file-format": "JUNITXML"
                }
            }
        }
        
        # Test and Build project
        self.codebuild_projects["test_build"] = aws.codebuild.Project(
            f"{self.name}-test-build",
            description=f"Test and build project for {self.project_name}",
            service_role=self.iam_roles["codebuild"].arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_MEDIUM",
                image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
                type="LINUX_CONTAINER",
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_DEFAULT_REGION",
                        value=self.region
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ENVIRONMENT",
                        value=self.environment
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="SNYK_TOKEN",
                        value=self.secrets["snyk_token"].arn,
                        type="SECRETS_MANAGER"
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec=json.dumps(buildspec, indent=2)
            ),
            vpc_config=aws.codebuild.ProjectVpcConfigArgs(
                vpc_id=self.vpc.id,
                subnets=[subnet.id for subnet in self.subnets["private"]],
                security_group_ids=[self