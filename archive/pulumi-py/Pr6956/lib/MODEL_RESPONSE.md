# Infrastructure Migration Solution - Pulumi Python Implementation

This implementation provides a complete infrastructure migration solution using Pulumi with Python, deploying modern containerized infrastructure in us-west-2.

## File: __main__.py

```python
"""Pulumi program entry point for infrastructure migration."""
import pulumi
from lib.tap_stack import TapStack

# Create the infrastructure stack
stack = TapStack("migration-stack")

# Export all stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)
pulumi.export("ecs_service_name", stack.ecs_service.name)
pulumi.export("alb_dns_name", stack.alb.dns_name)
pulumi.export("alb_arn", stack.alb.arn)
pulumi.export("aurora_cluster_endpoint", stack.aurora_cluster.endpoint)
pulumi.export("aurora_reader_endpoint", stack.aurora_cluster.reader_endpoint)
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)
pulumi.export("dms_replication_instance_arn", stack.dms_replication_instance.replication_instance_arn)
pulumi.export("dms_replication_task_arn", stack.dms_replication_task.replication_task_arn)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
pulumi.export("route53_record_name", stack.route53_record.name)
pulumi.export("cloudwatch_dashboard_name", stack.cloudwatch_dashboard.dashboard_name)
```

## File: lib/tap_stack.py

```python
"""Main infrastructure stack for migration from legacy to containerized architecture."""
import pulumi
import pulumi_aws as aws
import json

class TapStack:
    """Infrastructure stack for migrating legacy three-tier app to modern containerized setup."""

    def __init__(self, name: str):
        """Initialize the infrastructure stack.

        Args:
            name: Stack name prefix
        """
        # Get configuration
        config = pulumi.Config()
        self.environment_suffix = config.get("environmentSuffix") or "dev"
        self.source_rds_endpoint = config.get("sourceRdsEndpoint") or "legacy-db.example.com:3306"
        self.hosted_zone_id = config.get("hostedZoneId") or "Z1234567890ABC"
        self.domain_name = config.get("domainName") or "migration.example.com"

        # Common tags for all resources
        self.common_tags = {
            "Environment": self.environment_suffix,
            "Owner": "infrastructure-team",
            "Project": "legacy-migration",
            "ManagedBy": "pulumi"
        }

        # Create VPC and networking
        self._create_vpc()

        # Create ECR repository
        self._create_ecr()

        # Create Secrets Manager secret for database credentials
        self._create_secrets()

        # Create Aurora MySQL cluster
        self._create_aurora()

        # Create IAM roles
        self._create_iam_roles()

        # Create Application Load Balancer
        self._create_alb()

        # Create ECS Fargate cluster and service
        self._create_ecs()

        # Create DMS resources for database migration
        self._create_dms()

        # Create CloudWatch dashboard and alarms
        self._create_cloudwatch()

        # Create Route 53 weighted routing
        self._create_route53()

    def _create_vpc(self):
        """Create VPC with 3 AZs, public and private subnets."""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"migration-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"migration-vpc-{self.environment_suffix}"}
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"migration-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"migration-igw-{self.environment_suffix}"}
        )

        # Create public subnets (one per AZ)
        self.public_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"migration-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"migration-public-subnet-{i}-{self.environment_suffix}"}
            )
            self.public_subnets.append(subnet)

        # Create private subnets for ECS (one per AZ)
        self.private_subnets_ecs = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"migration-private-ecs-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"migration-private-ecs-subnet-{i}-{self.environment_suffix}"}
            )
            self.private_subnets_ecs.append(subnet)

        # Create private subnets for database (one per AZ)
        self.private_subnets_db = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"migration-private-db-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{20+i}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"migration-private-db-subnet-{i}-{self.environment_suffix}"}
            )
            self.private_subnets_db.append(subnet)

        # Create private subnets for DMS (one per AZ)
        self.private_subnets_dms = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"migration-private-dms-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{30+i}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"migration-private-dms-subnet-{i}-{self.environment_suffix}"}
            )
            self.private_subnets_dms.append(subnet)

        # Create Elastic IPs for NAT Gateways
        self.nat_eips = []
        for i in range(3):
            eip = aws.ec2.Eip(
                f"migration-nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"migration-nat-eip-{i}-{self.environment_suffix}"}
            )
            self.nat_eips.append(eip)

        # Create NAT Gateways (one per AZ)
        self.nat_gateways = []
        for i in range(3):
            nat = aws.ec2.NatGateway(
                f"migration-nat-{i}-{self.environment_suffix}",
                allocation_id=self.nat_eips[i].id,
                subnet_id=self.public_subnets[i].id,
                tags={**self.common_tags, "Name": f"migration-nat-{i}-{self.environment_suffix}"}
            )
            self.nat_gateways.append(nat)

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"migration-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"migration-public-rt-{self.environment_suffix}"}
        )

        # Add route to Internet Gateway
        aws.ec2.Route(
            f"migration-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"migration-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Create private route tables (one per NAT Gateway)
        self.private_route_tables = []
        for i in range(3):
            rt = aws.ec2.RouteTable(
                f"migration-private-rt-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"migration-private-rt-{i}-{self.environment_suffix}"}
            )

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"migration-private-route-{i}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateways[i].id
            )

            # Associate private ECS subnet
            aws.ec2.RouteTableAssociation(
                f"migration-private-ecs-rta-{i}-{self.environment_suffix}",
                subnet_id=self.private_subnets_ecs[i].id,
                route_table_id=rt.id
            )

            # Associate private DB subnet
            aws.ec2.RouteTableAssociation(
                f"migration-private-db-rta-{i}-{self.environment_suffix}",
                subnet_id=self.private_subnets_db[i].id,
                route_table_id=rt.id
            )

            # Associate private DMS subnet
            aws.ec2.RouteTableAssociation(
                f"migration-private-dms-rta-{i}-{self.environment_suffix}",
                subnet_id=self.private_subnets_dms[i].id,
                route_table_id=rt.id
            )

            self.private_route_tables.append(rt)

    def _create_ecr(self):
        """Create ECR repository for container images."""
        self.ecr_repository = aws.ecr.Repository(
            f"migration-app-{self.environment_suffix}",
            name=f"migration-app-{self.environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            image_tag_mutability="MUTABLE",
            tags=self.common_tags
        )

    def _create_secrets(self):
        """Create Secrets Manager secret for database credentials."""
        db_secret_value = {
            "username": "admin",
            "password": "ChangeMe123456!",
            "engine": "mysql",
            "host": "placeholder",
            "port": 3306,
            "dbname": "appdb"
        }

        self.db_secret = aws.secretsmanager.Secret(
            f"migration-db-secret-{self.environment_suffix}",
            name=f"migration-db-secret-{self.environment_suffix}",
            description="Database credentials for Aurora MySQL cluster",
            tags=self.common_tags
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"migration-db-secret-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=pulumi.Output.all().apply(lambda _: json.dumps(db_secret_value))
        )

    def _create_aurora(self):
        """Create Aurora MySQL cluster with reader instances."""
        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"migration-db-subnet-group-{self.environment_suffix}",
            name=f"migration-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets_db],
            tags={**self.common_tags, "Name": f"migration-db-subnet-group-{self.environment_suffix}"}
        )

        # Create security group for Aurora
        self.aurora_sg = aws.ec2.SecurityGroup(
            f"migration-aurora-sg-{self.environment_suffix}",
            name=f"migration-aurora-sg-{self.environment_suffix}",
            description="Security group for Aurora MySQL cluster",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.0.0.0/16"],
                    description="MySQL access from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.common_tags, "Name": f"migration-aurora-sg-{self.environment_suffix}"}
        )

        # Create Aurora cluster
        self.aurora_cluster = aws.rds.Cluster(
            f"migration-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"migration-aurora-cluster-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            database_name="appdb",
            master_username="admin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.aurora_sg.id],
            backup_retention_period=1,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["error", "slowquery"],
            tags=self.common_tags
        )

        # Create writer instance
        self.aurora_writer = aws.rds.ClusterInstance(
            f"migration-aurora-writer-{self.environment_suffix}",
            identifier=f"migration-aurora-writer-{self.environment_suffix}",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-mysql",
            publicly_accessible=False,
            tags={**self.common_tags, "Name": f"migration-aurora-writer-{self.environment_suffix}"}
        )

        # Create reader instances
        self.aurora_readers = []
        for i in range(2):
            reader = aws.rds.ClusterInstance(
                f"migration-aurora-reader-{i}-{self.environment_suffix}",
                identifier=f"migration-aurora-reader-{i}-{self.environment_suffix}",
                cluster_identifier=self.aurora_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-mysql",
                publicly_accessible=False,
                tags={**self.common_tags, "Name": f"migration-aurora-reader-{i}-{self.environment_suffix}"}
            )
            self.aurora_readers.append(reader)

    def _create_iam_roles(self):
        """Create IAM roles for ECS tasks and DMS."""
        # ECS task execution role
        self.ecs_task_execution_role = aws.iam.Role(
            f"migration-ecs-task-execution-role-{self.environment_suffix}",
            name=f"migration-ecs-task-execution-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.common_tags
        )

        # Attach managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"migration-ecs-task-execution-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Add policy for Secrets Manager access
        aws.iam.RolePolicy(
            f"migration-ecs-secrets-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=self.db_secret.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": arn
                }]
            }))
        )

        # ECS task role (for application)
        self.ecs_task_role = aws.iam.Role(
            f"migration-ecs-task-role-{self.environment_suffix}",
            name=f"migration-ecs-task-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.common_tags
        )

        # DMS IAM roles
        self.dms_vpc_role = aws.iam.Role(
            f"dms-vpc-role-{self.environment_suffix}",
            name=f"dms-vpc-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.common_tags
        )

        aws.iam.RolePolicyAttachment(
            f"dms-vpc-policy-{self.environment_suffix}",
            role=self.dms_vpc_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        )

        self.dms_cloudwatch_role = aws.iam.Role(
            f"dms-cloudwatch-role-{self.environment_suffix}",
            name=f"dms-cloudwatch-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.common_tags
        )

        aws.iam.RolePolicyAttachment(
            f"dms-cloudwatch-policy-{self.environment_suffix}",
            role=self.dms_cloudwatch_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
        )

    def _create_alb(self):
        """Create Application Load Balancer with sticky sessions."""
        # Create security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"migration-alb-sg-{self.environment_suffix}",
            name=f"migration-alb-sg-{self.environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.common_tags, "Name": f"migration-alb-sg-{self.environment_suffix}"}
        )

        # Create ALB
        self.alb = aws.lb.LoadBalancer(
            f"migration-alb-{self.environment_suffix}",
            name=f"migration-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            tags=self.common_tags
        )

        # Create target group
        self.alb_target_group = aws.lb.TargetGroup(
            f"migration-tg-{self.environment_suffix}",
            name=f"migration-tg-{self.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            deregistration_delay=30,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
                matcher="200"
            ),
            stickiness=aws.lb.TargetGroupStickinessArgs(
                enabled=True,
                type="lb_cookie",
                cookie_duration=60
            ),
            tags=self.common_tags
        )

        # Create listener
        self.alb_listener = aws.lb.Listener(
            f"migration-alb-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.alb_target_group.arn
                )
            ]
        )

    def _create_ecs(self):
        """Create ECS Fargate cluster and service with auto-scaling."""
        # Create ECS cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"migration-cluster-{self.environment_suffix}",
            name=f"migration-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags=self.common_tags
        )

        # Create security group for ECS tasks
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"migration-ecs-sg-{self.environment_suffix}",
            name=f"migration-ecs-sg-{self.environment_suffix}",
            description="Security group for ECS Fargate tasks",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[self.alb_sg.id],
                    description="HTTP from ALB"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.common_tags, "Name": f"migration-ecs-sg-{self.environment_suffix}"}
        )

        # Create task definition
        self.ecs_task_definition = aws.ecs.TaskDefinition(
            f"migration-task-{self.environment_suffix}",
            family=f"migration-task-{self.environment_suffix}",
            cpu="512",
            memory="1024",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                self.ecr_repository.repository_url,
                self.db_secret.arn
            ).apply(lambda args: json.dumps([{
                "name": "app",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 80,
                    "protocol": "tcp"
                }],
                "environment": [
                    {"name": "ENVIRONMENT", "value": self.environment_suffix},
                    {"name": "REGION", "value": "us-west-2"}
                ],
                "secrets": [{
                    "name": "DB_SECRET",
                    "valueFrom": args[1]
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": f"/ecs/migration-{self.environment_suffix}",
                        "awslogs-region": "us-west-2",
                        "awslogs-stream-prefix": "app"
                    }
                }
            }])),
            tags=self.common_tags
        )

        # Create CloudWatch log group
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"migration-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/migration-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.common_tags
        )

        # Create ECS service
        self.ecs_service = aws.ecs.Service(
            f"migration-service-{self.environment_suffix}",
            name=f"migration-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.ecs_task_definition.arn,
            desired_count=4,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[subnet.id for subnet in self.private_subnets_ecs],
                security_groups=[self.ecs_sg.id]
            ),
            load_balancers=[
                aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.alb_target_group.arn,
                    container_name="app",
                    container_port=80
                )
            ],
            health_check_grace_period_seconds=60,
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(depends_on=[self.alb_listener])
        )

        # Create auto-scaling target
        self.ecs_autoscaling_target = aws.appautoscaling.Target(
            f"migration-ecs-autoscaling-{self.environment_suffix}",
            service_namespace="ecs",
            resource_id=pulumi.Output.all(
                self.ecs_cluster.name,
                self.ecs_service.name
            ).apply(lambda args: f"service/{args[0]}/{args[1]}"),
            scalable_dimension="ecs:service:DesiredCount",
            min_capacity=4,
            max_capacity=12
        )

        # Create auto-scaling policy
        self.ecs_autoscaling_policy = aws.appautoscaling.Policy(
            f"migration-ecs-cpu-policy-{self.environment_suffix}",
            name=f"migration-ecs-cpu-policy-{self.environment_suffix}",
            service_namespace="ecs",
            resource_id=self.ecs_autoscaling_target.resource_id,
            scalable_dimension="ecs:service:DesiredCount",
            policy_type="TargetTrackingScaling",
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=60
            )
        )

    def _create_dms(self):
        """Create DMS resources for database migration."""
        # Create DMS subnet group
        self.dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            f"migration-dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_id=f"migration-dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_description="Subnet group for DMS replication instance",
            subnet_ids=[subnet.id for subnet in self.private_subnets_dms],
            tags=self.common_tags
        )

        # Create security group for DMS
        self.dms_sg = aws.ec2.SecurityGroup(
            f"migration-dms-sg-{self.environment_suffix}",
            name=f"migration-dms-sg-{self.environment_suffix}",
            description="Security group for DMS replication instance",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.common_tags, "Name": f"migration-dms-sg-{self.environment_suffix}"}
        )

        # Create DMS replication instance
        self.dms_replication_instance = aws.dms.ReplicationInstance(
            f"migration-dms-instance-{self.environment_suffix}",
            replication_instance_id=f"migration-dms-{self.environment_suffix}",
            replication_instance_class="dms.t3.medium",
            allocated_storage=100,
            vpc_security_group_ids=[self.dms_sg.id],
            replication_subnet_group_id=self.dms_subnet_group.replication_subnet_group_id,
            publicly_accessible=False,
            multi_az=False,
            auto_minor_version_upgrade=True,
            apply_immediately=True,
            tags=self.common_tags
        )

        # Create source endpoint (legacy RDS)
        self.dms_source_endpoint = aws.dms.Endpoint(
            f"migration-dms-source-{self.environment_suffix}",
            endpoint_id=f"migration-source-{self.environment_suffix}",
            endpoint_type="source",
            engine_name="mysql",
            server_name=self.source_rds_endpoint.split(":")[0],
            port=3306,
            database_name="appdb",
            username="admin",
            password="SourcePassword123!",
            ssl_mode="none",
            tags=self.common_tags
        )

        # Create target endpoint (Aurora)
        self.dms_target_endpoint = aws.dms.Endpoint(
            f"migration-dms-target-{self.environment_suffix}",
            endpoint_id=f"migration-target-{self.environment_suffix}",
            endpoint_type="target",
            engine_name="aurora",
            server_name=self.aurora_cluster.endpoint,
            port=3306,
            database_name="appdb",
            username="admin",
            password="ChangeMe123456!",
            ssl_mode="none",
            tags=self.common_tags
        )

        # Create DMS replication task
        table_mappings = {
            "rules": [
                {
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {
                        "schema-name": "%",
                        "table-name": "%"
                    },
                    "rule-action": "include"
                }
            ]
        }

        self.dms_replication_task = aws.dms.ReplicationTask(
            f"migration-dms-task-{self.environment_suffix}",
            replication_task_id=f"migration-task-{self.environment_suffix}",
            replication_instance_arn=self.dms_replication_instance.replication_instance_arn,
            source_endpoint_arn=self.dms_source_endpoint.endpoint_arn,
            target_endpoint_arn=self.dms_target_endpoint.endpoint_arn,
            migration_type="full-load-and-cdc",
            table_mappings=json.dumps(table_mappings),
            replication_task_settings=json.dumps({
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [
                        {
                            "Id": "SOURCE_CAPTURE",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        },
                        {
                            "Id": "TARGET_APPLY",
                            "Severity": "LOGGER_SEVERITY_INFO"
                        }
                    ]
                },
                "ChangeProcessingTuning": {
                    "BatchApplyTimeoutMin": 1,
                    "BatchApplyTimeoutMax": 30,
                    "BatchApplyMemoryLimit": 500,
                    "BatchSplitSize": 0,
                    "MinTransactionSize": 1000,
                    "CommitTimeout": 1,
                    "MemoryLimitTotal": 1024,
                    "MemoryKeepTime": 60,
                    "StatementCacheSize": 50
                }
            }),
            tags=self.common_tags
        )

    def _create_cloudwatch(self):
        """Create CloudWatch dashboard and alarms."""
        # Create CloudWatch dashboard
        dashboard_body = pulumi.Output.all(
            self.ecs_cluster.name,
            self.ecs_service.name,
            self.alb.arn_suffix,
            self.alb_target_group.arn_suffix,
            self.dms_replication_task.replication_task_id,
            self.aurora_cluster.cluster_identifier
        ).apply(lambda args: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
                            [".", "MemoryUtilization", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-2",
                        "title": "ECS Cluster Metrics",
                        "yAxis": {"left": {"min": 0, "max": 100}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                            [".", "RequestCount", {"stat": "Sum"}],
                            [".", "HealthyHostCount", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-2",
                        "title": "ALB Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DMS", "CDCLatencySource", {"dimensions": {"ReplicationTaskIdentifier": args[4]}}],
                            [".", "CDCLatencyTarget", {"dimensions": {"ReplicationTaskIdentifier": args[4]}}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-2",
                        "title": "DMS Replication Lag"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"dimensions": {"DBClusterIdentifier": args[5]}}],
                            [".", "DatabaseConnections", {"dimensions": {"DBClusterIdentifier": args[5]}}],
                            [".", "AuroraReplicaLag", {"dimensions": {"DBClusterIdentifier": args[5]}}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-west-2",
                        "title": "Aurora Cluster Metrics"
                    }
                }
            ]
        }))

        self.cloudwatch_dashboard = aws.cloudwatch.Dashboard(
            f"migration-dashboard-{self.environment_suffix}",
            dashboard_name=f"migration-dashboard-{self.environment_suffix}",
            dashboard_body=dashboard_body
        )

        # Create SNS topic for alarms
        self.sns_topic = aws.sns.Topic(
            f"migration-alarms-{self.environment_suffix}",
            name=f"migration-alarms-{self.environment_suffix}",
            tags=self.common_tags
        )

        # Create CloudWatch alarm for DMS replication lag
        self.dms_lag_alarm = aws.cloudwatch.MetricAlarm(
            f"migration-dms-lag-alarm-{self.environment_suffix}",
            name=f"migration-dms-lag-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencySource",
            namespace="AWS/DMS",
            period=60,
            statistic="Average",
            threshold=60,
            alarm_description="Alert when DMS replication lag exceeds 60 seconds",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ReplicationTaskIdentifier": self.dms_replication_task.replication_task_id
            },
            tags=self.common_tags
        )

        # Create alarm for ECS high CPU
        self.ecs_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"migration-ecs-cpu-alarm-{self.environment_suffix}",
            name=f"migration-ecs-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=85,
            alarm_description="Alert when ECS CPU utilization exceeds 85%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ClusterName": self.ecs_cluster.name,
                "ServiceName": self.ecs_service.name
            },
            tags=self.common_tags
        )

        # Create alarm for ALB unhealthy targets
        self.alb_unhealthy_alarm = aws.cloudwatch.MetricAlarm(
            f"migration-alb-unhealthy-alarm-{self.environment_suffix}",
            name=f"migration-alb-unhealthy-alarm-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=2,
            alarm_description="Alert when healthy host count is less than 2",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TargetGroup": self.alb_target_group.arn_suffix,
                "LoadBalancer": self.alb.arn_suffix
            },
            tags=self.common_tags
        )

    def _create_route53(self):
        """Create Route 53 weighted routing for gradual traffic shifting."""
        # Get the hosted zone
        # Note: This assumes the hosted zone already exists
        # In production, you would use the actual hosted zone ID

        # Create Route 53 record with weighted routing
        self.route53_record = aws.route53.Record(
            f"migration-route53-record-{self.environment_suffix}",
            zone_id=self.hosted_zone_id,
            name=self.domain_name,
            type="A",
            set_identifier=f"new-stack-{self.environment_suffix}",
            aliases=[
                aws.route53.RecordAliasArgs(
                    name=self.alb.dns_name,
                    zone_id=self.alb.zone_id,
                    evaluate_target_health=True
                )
            ],
            weighted_routing_policy=aws.route53.RecordWeightedRoutingPolicyArgs(
                weight=0
            )
        )
```

## File: lib/__init__.py

```python
"""Migration infrastructure library."""
```

## File: Pulumi.yaml

```yaml
name: migration-infrastructure
runtime: python
description: Infrastructure migration from legacy EC2/RDS/ELB to modern ECS Fargate/Aurora/ALB
config:
  aws:region:
    value: us-west-2
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```
