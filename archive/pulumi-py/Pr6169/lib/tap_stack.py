"""
Main Pulumi stack for loan processing application infrastructure.
"""

import json
import pulumi
import pulumi_aws as aws
import pulumi_random as random
from typing import Optional
from dataclasses import dataclass

@dataclass
class TapStackArgs:
    """Arguments for TapStack."""
    environment_suffix: str

class TapStack:
    """
    Main infrastructure stack for loan processing application migration.
    
    Creates a complete multi-tier architecture including:
    - VPC with public/private subnets across 3 AZs
    - ECS Fargate cluster with task definitions and services
    - RDS PostgreSQL with KMS encryption and automated backups
    - Application Load Balancer with target groups
    - Secrets Manager with credential rotation
    - ECR repository with image scanning
    - CloudWatch logging and monitoring
    - S3 bucket for ALB logs
    - Parameter Store for configuration
    """
    
    def __init__(self, name: str, args: TapStackArgs):
        """Initialize the TapStack with all infrastructure components."""
        self.name = name
        self.args = args
        self.env_suffix = args.environment_suffix
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": self.env_suffix,
            "Project": "LoanProcessing",
            "CostCenter": "FinancialServices",
            "ManagedBy": "Pulumi",
        }
        
        # Create all infrastructure components
        self._create_kms_key()
        self._create_vpc()
        self._create_security_groups()
        self._create_s3_alb_logs_bucket()
        self._create_ecr_repository()
        self._create_ecs_cluster()
        self._create_iam_roles()
        self._create_cloudwatch_logs()
        self._create_rds_database()
        self._create_secrets_manager()
        self._create_parameter_store()
        self._create_alb()
        self._create_ecs_task_and_service()
        self._export_outputs()
    
    def _create_kms_key(self):
        """Create KMS key for RDS encryption."""
        self.kms_key = aws.kms.Key(
            f"rds-kms-key-{self.env_suffix}",
            description=f"KMS key for RDS encryption - {self.env_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={**self.common_tags, "Name": f"rds-kms-key-{self.env_suffix}"},
        )
        
        self.kms_key_alias = aws.kms.Alias(
            f"rds-kms-alias-{self.env_suffix}",
            name=f"alias/rds-{self.env_suffix}",
            target_key_id=self.kms_key.key_id,
        )
    
    def _create_vpc(self):
        """Create VPC with public and private subnets across 3 AZs."""
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.env_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"vpc-{self.env_suffix}"},
        )
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{self.env_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"igw-{self.env_suffix}"},
        )
        
        # Get availability zones - FIXED: Changed to us-east-1
        self.availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
        
        # Create public and private subnets
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []
        
        for i, az in enumerate(self.availability_zones):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.env_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"public-subnet-{i+1}-{self.env_suffix}"},
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.env_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={**self.common_tags, "Name": f"private-subnet-{i+1}-{self.env_suffix}"},
            )
            self.private_subnets.append(private_subnet)
            
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.env_suffix}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"nat-eip-{i+1}-{self.env_suffix}"},
            )
            self.eips.append(eip)
            
            # NAT Gateway
            nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{i+1}-{self.env_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.common_tags, "Name": f"nat-gateway-{i+1}-{self.env_suffix}"},
            )
            self.nat_gateways.append(nat_gateway)
        
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.env_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"public-rt-{self.env_suffix}"},
        )
        
        # Public route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{self.env_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{self.env_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
            )
        
        # Private route tables (one per AZ)
        self.private_route_tables = []
        for i, nat_gateway in enumerate(self.nat_gateways):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.env_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"private-rt-{i+1}-{self.env_suffix}"},
            )
            self.private_route_tables.append(private_rt)
            
            # Route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{i+1}-{self.env_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
            )
            
            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{self.env_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=private_rt.id,
            )
    
    def _create_security_groups(self):
        """Create security groups for ALB, ECS, and RDS."""
        # ALB Security Group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"alb-sg-{self.env_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**self.common_tags, "Name": f"alb-sg-{self.env_suffix}"},
        )
        
        # ECS Security Group
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"ecs-sg-{self.env_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**self.common_tags, "Name": f"ecs-sg-{self.env_suffix}"},
        )
        
        # Add ingress rule for ECS from ALB
        aws.ec2.SecurityGroupRule(
            f"ecs-ingress-from-alb-{self.env_suffix}",
            type="ingress",
            from_port=8000,
            to_port=8000,
            protocol="tcp",
            source_security_group_id=self.alb_security_group.id,
            security_group_id=self.ecs_security_group.id,
            description="Allow traffic from ALB",
        )
        
        # RDS Security Group
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{self.env_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={**self.common_tags, "Name": f"rds-sg-{self.env_suffix}"},
        )
        
        # Add ingress rule for RDS from ECS
        aws.ec2.SecurityGroupRule(
            f"rds-ingress-from-ecs-{self.env_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.ecs_security_group.id,
            security_group_id=self.rds_security_group.id,
            description="Allow PostgreSQL from ECS",
        )
    
    def _create_s3_alb_logs_bucket(self):
        """Create S3 bucket for ALB access logs."""
        self.alb_logs_bucket = aws.s3.Bucket(
            f"alb-logs-{self.env_suffix}",
            bucket=f"loan-processing-alb-logs-{self.env_suffix}",
            force_destroy=True,
            tags={**self.common_tags, "Name": f"alb-logs-{self.env_suffix}"},
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"alb-logs-public-access-block-{self.env_suffix}",
            bucket=self.alb_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )
        
        # Bucket policy for ALB logs - FIXED: Changed ELB account ID for us-east-1
        alb_logs_bucket_policy = aws.s3.BucketPolicy(
            f"alb-logs-bucket-policy-{self.env_suffix}",
            bucket=self.alb_logs_bucket.id,
            policy=self.alb_logs_bucket.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::127311923021:root"
                            },
                            "Action": "s3:PutObject",
                            "Resource": f"{arn}/*"
                        }
                    ]
                })
            ),
        )
    
    def _create_ecr_repository(self):
        """Create ECR repository for Docker images."""
        self.ecr_repository = aws.ecr.Repository(
            f"loan-app-repo-{self.env_suffix}",
            name=f"loan-processing-app-{self.env_suffix}",
            image_tag_mutability="MUTABLE",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True,
            ),
            tags={**self.common_tags, "Name": f"loan-app-repo-{self.env_suffix}"},
        )
        
        # Lifecycle policy to keep only last 10 images
        aws.ecr.LifecyclePolicy(
            f"ecr-lifecycle-policy-{self.env_suffix}",
            repository=self.ecr_repository.name,
            policy=json.dumps({
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep last 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            }),
        )
    
    def _create_ecs_cluster(self):
        """Create ECS cluster."""
        self.ecs_cluster = aws.ecs.Cluster(
            f"loan-app-cluster-{self.env_suffix}",
            name=f"loan-processing-cluster-{self.env_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled",
                )
            ],
            tags={**self.common_tags, "Name": f"loan-app-cluster-{self.env_suffix}"},
        )
    
    def _create_iam_roles(self):
        """Create IAM roles for ECS task execution and task."""
        # ECS Task Execution Role
        self.ecs_task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{self.env_suffix}",
            name=f"ecs-task-execution-role-{self.env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags=self.common_tags,
        )
        
        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-attachment-{self.env_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        )
        
        # Additional policy for Secrets Manager and Parameter Store
        execution_role_policy = aws.iam.RolePolicy(
            f"ecs-task-execution-custom-policy-{self.env_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "ssm:GetParameters",
                            "kms:Decrypt"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
        )
        
        # ECS Task Role (for application permissions)
        self.ecs_task_role = aws.iam.Role(
            f"ecs-task-role-{self.env_suffix}",
            name=f"ecs-task-role-{self.env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    }
                }]
            }),
            tags=self.common_tags,
        )
        
        # Task role policy for application needs (S3, etc.)
        task_role_policy = aws.iam.RolePolicy(
            f"ecs-task-custom-policy-{self.env_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
        )
    
    def _create_cloudwatch_logs(self):
        """Create CloudWatch log group for ECS."""
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"ecs-log-group-{self.env_suffix}",
            name=f"/ecs/loan-processing-{self.env_suffix}",
            retention_in_days=7,
            tags=self.common_tags,
        )
    
    def _create_rds_database(self):
        """Create RDS PostgreSQL database with KMS encryption."""
        # Generate a random password using Pulumi Random provider
        self.db_password = random.RandomPassword(
            f"db-password-{self.env_suffix}",
            length=32,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
        )
        
        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.env_suffix}",
            name=f"loan-db-subnet-group-{self.env_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.common_tags, "Name": f"db-subnet-group-{self.env_suffix}"},
        )
        
        # RDS Instance - FIXED: Changed engine_version to "15" (not "15.4")
        self.rds_instance = aws.rds.Instance(
            f"loan-db-{self.env_suffix}",
            identifier=f"loan-processing-db-{self.env_suffix}",
            engine="postgres",
            engine_version="15",  # FIXED: Changed from "15.4" to "15"
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="loandb",
            username="dbadmin",
            password=self.db_password.result,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            publicly_accessible=False,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={**self.common_tags, "Name": f"loan-db-{self.env_suffix}"},
        )
    
    def _create_secrets_manager(self):
        """Create Secrets Manager secret for database credentials."""
        db_credentials = pulumi.Output.all(
            self.rds_instance.endpoint,
            self.rds_instance.username,
            self.db_password.result
        ).apply(lambda args: json.dumps({
            "host": args[0].split(":")[0],
            "port": 5432,
            "username": args[1],
            "password": args[2],
            "dbname": "loandb"
        }))
        
        self.db_secret = aws.secretsmanager.Secret(
            f"db-credentials-secret-{self.env_suffix}",
            name=f"loan-processing/db-credentials-{self.env_suffix}",
            description="Database credentials for loan processing application",
            tags=self.common_tags,
        )
        
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-credentials-secret-version-{self.env_suffix}",
            secret_id=self.db_secret.id,
            secret_string=db_credentials,
        )
    
    def _create_parameter_store(self):
        """Create Parameter Store parameters for configuration."""
        self.app_config_param = aws.ssm.Parameter(
            f"app-config-param-{self.env_suffix}",
            name=f"/loan-processing/{self.env_suffix}/app-config",
            type="String",
            value=json.dumps({
                "log_level": "INFO",
                "max_loan_amount": 1000000,
                "interest_rate": 5.5
            }),
            tags=self.common_tags,
        )
    
    def _create_alb(self):
        """Create Application Load Balancer."""
        self.alb = aws.lb.LoadBalancer(
            f"loan-app-alb-{self.env_suffix}",
            name=f"loan-app-alb-{self.env_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=self.alb_logs_bucket.bucket,
                enabled=True,
            ),
            tags={**self.common_tags, "Name": f"loan-app-alb-{self.env_suffix}"},
        )
        
        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"loan-app-tg-{self.env_suffix}",
            name=f"loan-app-tg-{self.env_suffix}",
            port=8000,
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
                unhealthy_threshold=2,
            ),
            tags={**self.common_tags, "Name": f"loan-app-tg-{self.env_suffix}"},
        )
        
        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"loan-app-listener-{self.env_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
        )
    
    def _create_ecs_task_and_service(self):
        """Create ECS task definition and service."""
        # Container definitions - FIXED: Changed region to us-east-1
        container_definitions = pulumi.Output.all(
            self.ecr_repository.repository_url,
            self.db_secret.arn,
            self.app_config_param.arn,
            self.ecs_log_group.name
        ).apply(lambda args: json.dumps([{
            "name": "loan-app",
            "image": f"{args[0]}:latest",
            "cpu": 256,
            "memory": 512,
            "essential": True,
            "portMappings": [{
                "containerPort": 8000,
                "protocol": "tcp"
            }],
            "environment": [
                {
                    "name": "ENVIRONMENT",
                    "value": self.env_suffix
                },
                {
                    "name": "AWS_REGION",
                    "value": "us-east-1"
                }
            ],
            "secrets": [
                {
                    "name": "DB_CREDENTIALS",
                    "valueFrom": args[1]
                },
                {
                    "name": "APP_CONFIG",
                    "valueFrom": args[2]
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": args[3],
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }]))
        
        # Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"loan-app-task-{self.env_suffix}",
            family=f"loan-processing-task-{self.env_suffix}",
            cpu="256",
            memory="512",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=container_definitions,
            tags=self.common_tags,
        )
        
        # ECS Service
        self.ecs_service = aws.ecs.Service(
            f"loan-app-service-{self.env_suffix}",
            name=f"loan-processing-service-{self.env_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_security_group.id],
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.target_group.arn,
                    container_name="loan-app",
                    container_port=8000,
                )
            ],
            tags=self.common_tags,
        )
    
    def _export_outputs(self):
        """Export important outputs."""
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("alb_dns_name", self.alb.dns_name)
        pulumi.export("ecr_repository_url", self.ecr_repository.repository_url)
        pulumi.export("ecs_cluster_name", self.ecs_cluster.name)
        pulumi.export("rds_endpoint", self.rds_instance.endpoint)
        pulumi.export("db_secret_arn", self.db_secret.arn)
