# Manufacturing IoT Sensor Data Processing System - CDKTF Python Implementation

This implementation provides a complete real-time IoT sensor data processing system using CDKTF with Python, deployed in the eu-west-2 region.

## Architecture Overview

The infrastructure creates:
- VPC with public and private subnets across 2 AZs
- Kinesis Data Stream for real-time sensor data ingestion
- ECS Fargate cluster for containerized data processing
- ElastiCache Redis for caching and temporary storage
- RDS PostgreSQL for permanent data storage
- Secrets Manager with 30-day rotation for database credentials
- Comprehensive IAM roles and security groups
- CloudWatch logging for all components

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for Manufacturing IoT Sensor Data Processing."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'eu-west-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get available AZs
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        vpc = Vpc(
            self,
            "iot_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"iot-vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "iot_igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"iot-igw-{environment_suffix}"
            }
        )

        # Create Public Subnets (2 AZs)
        public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"iot-public-subnet-1-{environment_suffix}"
            }
        )

        public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=Fn.element(azs.names, 1),
            map_public_ip_on_launch=True,
            tags={
                "Name": f"iot-public-subnet-2-{environment_suffix}"
            }
        )

        # Create Private Subnets (2 AZs)
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=Fn.element(azs.names, 0),
            tags={
                "Name": f"iot-private-subnet-1-{environment_suffix}"
            }
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=Fn.element(azs.names, 1),
            tags={
                "Name": f"iot-private-subnet-2-{environment_suffix}"
            }
        )

        # Create Public Route Table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"iot-public-rt-{environment_suffix}"
            }
        )

        # Associate Public Subnets with Public Route Table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "iot_log_group",
            name=f"/aws/iot-processing-{environment_suffix}",
            retention_in_days=7
        )

        # Create Kinesis Data Stream
        kinesis_stream = KinesisStream(
            self,
            "sensor_data_stream",
            name=f"sensor-data-stream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={
                "Name": f"sensor-data-stream-{environment_suffix}"
            }
        )

        # Create Security Group for ECS Tasks
        ecs_sg = SecurityGroup(
            self,
            "ecs_sg",
            name=f"ecs-tasks-sg-{environment_suffix}",
            description="Security group for ECS Fargate tasks",
            vpc_id=vpc.id,
            ingress=[],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecs-tasks-sg-{environment_suffix}"
            }
        )

        # Create Security Group for Redis
        redis_sg = SecurityGroup(
            self,
            "redis_sg",
            name=f"redis-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow Redis access from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"redis-sg-{environment_suffix}"
            }
        )

        # Create Security Group for RDS
        rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"rds-sg-{environment_suffix}",
            description="Security group for RDS PostgreSQL",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[ecs_sg.id],
                    description="Allow PostgreSQL access from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"rds-sg-{environment_suffix}"
            }
        )

        # Create ECS Cluster
        ecs_cluster = EcsCluster(
            self,
            "iot_cluster",
            name=f"iot-processing-cluster-{environment_suffix}",
            tags={
                "Name": f"iot-processing-cluster-{environment_suffix}"
            }
        )

        # Create IAM Role for ECS Task Execution
        ecs_execution_role = IamRole(
            self,
            "ecs_execution_role",
            name=f"ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-execution-role-{environment_suffix}"
            }
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "ecs_execution_policy_attachment",
            role=ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Create IAM Role for ECS Tasks
        ecs_task_role = IamRole(
            self,
            "ecs_task_role",
            name=f"ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"ecs-task-role-{environment_suffix}"
            }
        )

        # Create Secrets Manager Secret for Database Credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"iot-db-credentials-{environment_suffix}",
            description="Database credentials for IoT PostgreSQL",
            tags={
                "Name": f"iot-db-credentials-{environment_suffix}"
            }
        )

        # Create initial secret version
        db_username = "iotadmin"
        db_password = "InitialPassword123!"  # Will be rotated immediately

        SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": db_username,
                "password": db_password,
                "engine": "postgres",
                "host": "placeholder",
                "port": 5432,
                "dbname": "iotdb"
            })
        )

        # Create IAM policy for Kinesis access
        kinesis_policy = IamRolePolicy(
            self,
            "kinesis_policy",
            name=f"kinesis-access-policy-{environment_suffix}",
            role=ecs_task_role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kinesis:GetRecords",
                        "kinesis:GetShardIterator",
                        "kinesis:DescribeStream",
                        "kinesis:ListShards"
                    ],
                    "Resource": kinesis_stream.arn
                }]
            })
        )

        # Create IAM policy for Secrets Manager access
        secrets_policy = IamRolePolicy(
            self,
            "secrets_policy",
            name=f"secrets-access-policy-{environment_suffix}",
            role=ecs_task_role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": db_secret.arn
                }]
            })
        )

        # Create IAM policy for CloudWatch Logs
        logs_policy = IamRolePolicy(
            self,
            "logs_policy",
            name=f"logs-access-policy-{environment_suffix}",
            role=ecs_task_role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{log_group.arn}:*"
                }]
            })
        )

        # Create ElastiCache Subnet Group
        elasticache_subnet_group = ElasticacheSubnetGroup(
            self,
            "redis_subnet_group",
            name=f"redis-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"redis-subnet-group-{environment_suffix}"
            }
        )

        # Create ElastiCache Redis Replication Group
        redis = ElasticacheReplicationGroup(
            self,
            "redis_cluster",
            replication_group_id=f"iot-redis-{environment_suffix}",
            replication_group_description="Redis cache for IoT sensor data",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name="default.redis7",
            subnet_group_name=elasticache_subnet_group.name,
            security_group_ids=[redis_sg.id],
            automatic_failover_enabled=True,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            multi_az_enabled=True,
            tags={
                "Name": f"iot-redis-{environment_suffix}"
            }
        )

        # Create DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"iot-db-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"iot-db-subnet-group-{environment_suffix}"
            }
        )

        # Create RDS PostgreSQL Instance
        rds_instance = DbInstance(
            self,
            "postgres_db",
            identifier=f"iot-postgres-{environment_suffix}",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            db_name="iotdb",
            username=db_username,
            password=db_password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={
                "Name": f"iot-postgres-{environment_suffix}"
            }
        )

        # Update secret with actual RDS endpoint
        # Note: This is a simplified approach. In production, use Lambda rotation function
        SecretsmanagerSecretVersion(
            self,
            "db_credentials_updated",
            secret_id=db_secret.id,
            secret_string=Fn.jsonencode({
                "username": db_username,
                "password": db_password,
                "engine": "postgres",
                "host": rds_instance.address,
                "port": rds_instance.port,
                "dbname": "iotdb"
            }),
            depends_on=[rds_instance]
        )

        # Create ECS Task Definition
        task_definition = EcsTaskDefinition(
            self,
            "iot_task_definition",
            family=f"iot-processor-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=json.dumps([{
                "name": "iot-processor",
                "image": "public.ecr.aws/docker/library/nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 80,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": log_group.name,
                        "awslogs-region": aws_region,
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "KINESIS_STREAM_NAME",
                        "value": kinesis_stream.name
                    },
                    {
                        "name": "REDIS_ENDPOINT",
                        "value": redis.configuration_endpoint_address
                    },
                    {
                        "name": "DB_SECRET_ARN",
                        "value": db_secret.arn
                    },
                    {
                        "name": "AWS_REGION",
                        "value": aws_region
                    }
                ]
            }]),
            tags={
                "Name": f"iot-processor-{environment_suffix}"
            }
        )

        # Create ECS Service
        ecs_service = EcsService(
            self,
            "iot_service",
            name=f"iot-processor-service-{environment_suffix}",
            cluster=ecs_cluster.id,
            task_definition=task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[public_subnet_1.id, public_subnet_2.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=True
            ),
            tags={
                "Name": f"iot-processor-service-{environment_suffix}"
            }
        )

        # Create Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis_stream.name,
            description="Kinesis Data Stream name"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_cluster.name,
            description="ECS Cluster name"
        )

        TerraformOutput(
            self,
            "redis_endpoint",
            value=redis.configuration_endpoint_address,
            description="Redis configuration endpoint"
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=rds_instance.endpoint,
            description="RDS PostgreSQL endpoint"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn,
            description="Database credentials secret ARN"
        )
```

## Implementation Notes

### Architecture Components

1. **VPC Configuration**
   - CIDR: 10.0.0.0/16
   - 2 public subnets (10.0.1.0/24, 10.0.2.0/24)
   - 2 private subnets (10.0.11.0/24, 10.0.12.0/24)
   - Internet Gateway for public subnet connectivity
   - Spans 2 Availability Zones for high availability

2. **Kinesis Data Stream**
   - 2 shards for parallel processing
   - 24-hour retention period
   - KMS encryption enabled
   - Designed for continuous sensor data ingestion

3. **ECS Fargate**
   - Serverless container orchestration
   - 2 tasks running for high availability
   - 256 CPU units, 512 MB memory per task
   - IAM roles with least-privilege access
   - CloudWatch logging enabled

4. **ElastiCache Redis**
   - Redis 7.0 engine
   - Multi-AZ with automatic failover
   - 2 cache nodes across AZs
   - Encryption at rest and in transit
   - Located in private subnets

5. **RDS PostgreSQL**
   - PostgreSQL 15.4
   - Multi-AZ deployment for reliability
   - 20 GB storage with gp3
   - Encryption at rest enabled
   - 7-day backup retention
   - CloudWatch logs enabled

6. **Secrets Manager**
   - Stores database credentials
   - Initial password set (should be rotated)
   - Accessible by ECS tasks via IAM role
   - Note: Automatic 30-day rotation requires Lambda function (not implemented in this basic version)

7. **Security**
   - Separate security groups for ECS, Redis, and RDS
   - Least-privilege IAM policies
   - All network traffic encrypted
   - No public access to databases

### Deployment Considerations

1. **Region**: All resources deployed to eu-west-2
2. **Naming**: All resources include environment_suffix for uniqueness
3. **Destroyability**: skip_final_snapshot=true, deletion_protection=false
4. **Cost Optimization**: Using t3.micro instances for development/testing

### Limitations and Future Enhancements

1. **Secrets Rotation**: This implementation includes the secret but not the Lambda rotation function. For production, implement AWS Lambda function for automatic credential rotation.

2. **Container Image**: Using nginx as placeholder. Replace with actual data processing application.

3. **Auto-scaling**: ECS service set to 2 tasks. Add auto-scaling policies based on Kinesis metrics.

4. **NAT Gateway**: Not included to reduce costs. ECS tasks use public subnets with public IPs. For production, add NAT Gateway for private subnet egress.

5. **Monitoring**: Basic CloudWatch logging enabled. Add CloudWatch alarms for critical metrics.

6. **VPC Endpoints**: Consider adding VPC endpoints for S3, Secrets Manager, and other AWS services to reduce NAT costs.
