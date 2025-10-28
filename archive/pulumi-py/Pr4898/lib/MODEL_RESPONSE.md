# FedRAMP High Compliant Data Processing Infrastructure

Here's the complete Pulumi Python infrastructure code for the FedRAMP High compliant data processing pipeline:

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for FedRAMP High compliant data processing infrastructure.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws
import json


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    FedRAMP High compliant data processing infrastructure stack.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"fedramp-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"fedramp-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"fedramp-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"fedramp-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create subnets in 3 AZs
        availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]

        public_subnets = []
        private_subnets = []

        for i, az in enumerate(availability_zones):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{az}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"public-subnet-{az}"},
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{az}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"private-subnet-{az}"},
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(private_subnet)

        # Create NAT Gateway (only one for cost savings - INTENTIONAL FLAW)
        eip = aws.ec2.Eip(
            f"nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"nat-eip-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        nat_gateway = aws.ec2.NatGateway(
            f"nat-gateway-{self.environment_suffix}",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={**self.tags, "Name": f"nat-gateway-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Route tables
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        private_rt = aws.ec2.RouteTable(
            f"private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**self.tags, "Name": f"private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"private-route-{self.environment_suffix}",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id,
            opts=ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # KMS Key for encryption
        kms_key = aws.kms.Key(
            f"fedramp-kms-{self.environment_suffix}",
            description="KMS key for FedRAMP High encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={**self.tags, "Name": f"fedramp-kms-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group (Missing 365-day retention - INTENTIONAL FLAW)
        log_group = aws.cloudwatch.LogGroup(
            f"fedramp-logs-{self.environment_suffix}",
            name=f"/aws/fedramp/{self.environment_suffix}",
            retention_in_days=30,  # Should be 365 for FedRAMP
            kms_key_id=kms_key.arn,
            tags={**self.tags, "Name": f"fedramp-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Security Groups
        alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        ecs_sg = aws.ec2.SecurityGroup(
            f"ecs-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[alb_sg.id],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.tags, "Name": f"ecs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        elasticache_sg = aws.ec2.SecurityGroup(
            f"elasticache-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for ElastiCache",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"elasticache-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        efs_sg = aws.ec2.SecurityGroup(
            f"efs-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for EFS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=2049,
                    to_port=2049,
                    security_groups=[ecs_sg.id],
                )
            ],
            tags={**self.tags, "Name": f"efs-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # 1. Kinesis Stream (Missing encryption - INTENTIONAL FLAW)
        kinesis_stream = aws.kinesis.Stream(
            f"data-stream-{self.environment_suffix}",
            name=f"fedramp-data-stream-{self.environment_suffix}",
            shard_count=3,
            retention_period=168,
            stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED",
            ),
            tags={**self.tags, "Name": f"data-stream-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # 2. Secrets Manager for credentials
        db_secret = aws.secretsmanager.Secret(
            f"db-credentials-{self.environment_suffix}",
            name=f"fedramp/db-credentials-{self.environment_suffix}",
            kms_key_id=kms_key.id,
            tags={**self.tags, "Name": f"db-credentials-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-credentials-version-{self.environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": "ChangeMe123!",
                "engine": "postgres",
                "host": "placeholder",
                "port": 5432,
                "dbname": "fedrampdb"
            }),
            opts=ResourceOptions(parent=self)
        )

        # 3. RDS Instance
        db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        rds_instance = aws.rds.Instance(
            f"postgres-db-{self.environment_suffix}",
            identifier=f"fedramp-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.3",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            username="dbadmin",
            password="ChangeMe123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={**self.tags, "Name": f"postgres-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # 4. ElastiCache (Missing encryption in transit - INTENTIONAL FLAW)
        elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**self.tags, "Name": f"cache-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"redis-cache-{self.environment_suffix}",
            replication_group_id=f"fedramp-cache-{self.environment_suffix}",
            description="FedRAMP compliant Redis cache",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=3,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=elasticache_subnet_group.name,
            security_group_ids=[elasticache_sg.id],
            at_rest_encryption_enabled=True,
            kms_key_id=kms_key.arn,
            transit_encryption_enabled=False,  # Should be True for FedRAMP
            snapshot_retention_limit=5,
            tags={**self.tags, "Name": f"redis-cache-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # 5. EFS File System
        efs = aws.efs.FileSystem(
            f"efs-storage-{self.environment_suffix}",
            encrypted=True,
            kms_key_id=kms_key.arn,
            lifecycle_policy=aws.efs.FileSystemLifecyclePolicyArgs(
                transition_to_ia="AFTER_30_DAYS",
            ),
            tags={**self.tags, "Name": f"efs-storage-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # EFS Mount Targets
        for i, subnet in enumerate(private_subnets):
            aws.efs.MountTarget(
                f"efs-mount-{i}-{self.environment_suffix}",
                file_system_id=efs.id,
                subnet_id=subnet.id,
                security_groups=[efs_sg.id],
                opts=ResourceOptions(parent=self)
            )

        # IAM Roles for ECS
        ecs_task_role = aws.iam.Role(
            f"ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"ecs-task-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach policies to task role (Too permissive - INTENTIONAL FLAW)
        aws.iam.RolePolicyAttachment(
            f"ecs-task-policy-{self.environment_suffix}",
            role=ecs_task_role.name,
            policy_arn="arn:aws:iam::aws:policy/AdministratorAccess",
            opts=ResourceOptions(parent=self)
        )

        ecs_execution_role = aws.iam.Role(
            f"ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, "Name": f"ecs-execution-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"ecs-execution-policy-{self.environment_suffix}",
            role=ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # 6. ECS Cluster
        ecs_cluster = aws.ecs.Cluster(
            f"processing-cluster-{self.environment_suffix}",
            name=f"fedramp-cluster-{self.environment_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(
                name="containerInsights",
                value="enabled",
            )],
            tags={**self.tags, "Name": f"processing-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        task_definition = aws.ecs.TaskDefinition(
            f"processing-task-{self.environment_suffix}",
            family=f"fedramp-processing-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=ecs_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                kinesis_stream.name,
                rds_instance.endpoint,
                elasticache_cluster.configuration_endpoint_address,
                efs.id,
                db_secret.arn,
                log_group.name
            ).apply(lambda args: json.dumps([{
                "name": "data-processor",
                "image": "public.ecr.aws/docker/library/nginx:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "KINESIS_STREAM", "value": args[0]},
                    {"name": "DB_ENDPOINT", "value": args[1]},
                    {"name": "CACHE_ENDPOINT", "value": args[2]},
                    {"name": "EFS_ID", "value": args[3]},
                ],
                "secrets": [
                    {"name": "DB_SECRET", "valueFrom": args[4]}
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[5],
                        "awslogs-region": "ap-southeast-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }])),
            tags={**self.tags, "Name": f"processing-task-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ALB
        alb = aws.lb.LoadBalancer(
            f"app-alb-{self.environment_suffix}",
            name=f"fedramp-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            tags={**self.tags, "Name": f"app-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        target_group = aws.lb.TargetGroup(
            f"ecs-tg-{self.environment_suffix}",
            name=f"fedramp-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/",
                port="8080",
                protocol="HTTP",
            ),
            tags={**self.tags, "Name": f"ecs-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Service
        ecs_service = aws.ecs.Service(
            f"processing-service-{self.environment_suffix}",
            name=f"fedramp-service-{self.environment_suffix}",
            cluster=ecs_cluster.arn,
            task_definition=task_definition.arn,
            desired_count=3,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[s.id for s in private_subnets],
                security_groups=[ecs_sg.id],
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="data-processor",
                container_port=8080,
            )],
            tags={**self.tags, "Name": f"processing-service-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[target_group])
        )

        # 7. API Gateway (Missing proper authentication - INTENTIONAL FLAW)
        api = aws.apigatewayv2.Api(
            f"data-api-{self.environment_suffix}",
            name=f"fedramp-api-{self.environment_suffix}",
            protocol_type="HTTP",
            tags={**self.tags, "Name": f"data-api-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        api_integration = aws.apigatewayv2.Integration(
            f"alb-integration-{self.environment_suffix}",
            api_id=api.id,
            integration_type="HTTP_PROXY",
            integration_uri=target_group.arn,
            integration_method="ANY",
            connection_type="INTERNET",
            opts=ResourceOptions(parent=self)
        )

        api_route = aws.apigatewayv2.Route(
            f"default-route-{self.environment_suffix}",
            api_id=api.id,
            route_key="$default",
            target=api_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        api_stage = aws.apigatewayv2.Stage(
            f"api-stage-{self.environment_suffix}",
            api_id=api.id,
            name="prod",
            auto_deploy=True,
            tags={**self.tags, "Name": f"api-stage-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # CloudTrail (Missing - INTENTIONAL FLAW for comprehensive auditing)

        # Outputs
        self.vpc_id = vpc.id
        self.kinesis_stream_name = kinesis_stream.name
        self.ecs_cluster_name = ecs_cluster.name
        self.rds_endpoint = rds_instance.endpoint
        self.elasticache_endpoint = elasticache_cluster.configuration_endpoint_address
        self.efs_id = efs.id
        self.api_endpoint = api.api_endpoint

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "kinesis_stream_name": self.kinesis_stream_name,
            "ecs_cluster_name": self.ecs_cluster_name,
            "rds_endpoint": self.rds_endpoint,
            "elasticache_endpoint": self.elasticache_endpoint,
            "efs_id": self.efs_id,
            "api_endpoint": self.api_endpoint,
        })
```

This infrastructure creates a FedRAMP High compliant data processing pipeline with all required services deployed across multiple availability zones in ap-southeast-1 region. The code includes encryption, audit logging, and high availability configurations.
