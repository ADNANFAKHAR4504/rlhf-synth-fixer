"""
tap_stack.py

Multi-tenant SaaS Infrastructure with Pulumi Python
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json
import random
import string


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): Suffix for identifying the deployment environment
        tags (Optional[dict]): Optional default tags to apply to resources
        tenants (List[str]): List of tenant IDs
    """

    def __init__(
        self,
        environment_suffix: str = 'dev',
        tags: Optional[dict] = None,
        tenants: Optional[List[str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}
        self.tenants = tenants or ['acme-corp', 'globex-inc', 'initech-llc']


class TapStack(pulumi.ComponentResource):
    """
    Multi-tenant SaaS infrastructure with resource isolation.

    Creates:
    - VPC with public and private subnets across 3 AZs
    - Aurora PostgreSQL cluster with tenant schemas
    - S3 buckets per tenant
    - ALB with tenant-specific routing
    - ECS Fargate services per tenant
    - CloudWatch Log Groups per tenant
    - Secrets Manager for tenant credentials
    - Security groups with proper isolation
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.tenants = args.tenants

        # Create VPC and networking
        self._create_vpc()

        # Create security groups
        self._create_security_groups()

        # Create Aurora PostgreSQL cluster
        self._create_aurora_cluster()

        # Create tenant-specific resources
        self.tenant_resources = {}
        for tenant_id in self.tenants:
            self.tenant_resources[tenant_id] = self._create_tenant_resources(tenant_id)

        # Create ALB
        self._create_alb()

        # Register outputs
        self._register_outputs()

    def _create_vpc(self):
        """Create VPC with 3 public and 3 private subnets across AZs"""

        # VPC
        self.vpc = aws.ec2.Vpc(
            f"saas-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"saas-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"saas-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"saas-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
        self.public_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"saas-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"saas-public-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
        self.private_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"saas-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+11}.0/24",
                availability_zone=azs.names[i],
                tags={**self.tags, "Name": f"saas-private-subnet-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(3):
            eip = aws.ec2.Eip(
                f"saas-nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, "Name": f"saas-nat-eip-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.eips.append(eip)

        # NAT Gateways
        self.nat_gateways = []
        for i in range(3):
            nat = aws.ec2.NatGateway(
                f"saas-nat-{i+1}-{self.environment_suffix}",
                allocation_id=self.eips[i].id,
                subnet_id=self.public_subnets[i].id,
                tags={**self.tags, "Name": f"saas-nat-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)

        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"saas-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"saas-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"saas-public-route-{self.environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"saas-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private route tables (one per NAT Gateway)
        for i, nat in enumerate(self.nat_gateways):
            rt = aws.ec2.RouteTable(
                f"saas-private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"saas-private-rt-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"saas-private-route-{i+1}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"saas-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

    def _create_security_groups(self):
        """Create security groups for ALB, ECS, and RDS"""

        # ALB security group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"saas-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
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
            tags={**self.tags, "Name": f"saas-alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS security groups (per tenant)
        self.ecs_sgs = {}
        for tenant_id in self.tenants:
            sg = aws.ec2.SecurityGroup(
                f"saas-ecs-{tenant_id}-sg-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                description=f"Security group for ECS tasks - {tenant_id}",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=80,
                        to_port=80,
                        security_groups=[self.alb_sg.id]
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
                    **self.tags,
                    "Name": f"saas-ecs-{tenant_id}-sg-{self.environment_suffix}",
                    "tenant_id": tenant_id,
                    "cost_center": tenant_id
                },
                opts=ResourceOptions(parent=self)
            )
            self.ecs_sgs[tenant_id] = sg

        # RDS security group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"saas-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Aurora PostgreSQL cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[sg.id for sg in self.ecs_sgs.values()]
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
            tags={**self.tags, "Name": f"saas-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

    def _create_aurora_cluster(self):
        """Create Aurora PostgreSQL cluster with parameter group"""

        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"saas-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, "Name": f"saas-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # DB Cluster Parameter Group
        self.db_cluster_param_group = aws.rds.ClusterParameterGroup(
            f"saas-db-cluster-pg-{self.environment_suffix}",
            family="aurora-postgresql15",
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="shared_preload_libraries",
                    value="pg_stat_statements"
                )
            ],
            tags={**self.tags, "Name": f"saas-db-cluster-pg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Master password in Secrets Manager
        self.master_secret = aws.secretsmanager.Secret(
            f"saas-rds-master-secret-{self.environment_suffix}",
            name=f"rds/master/{self.environment_suffix}/password",
            tags={**self.tags, "Name": f"saas-rds-master-secret-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        master_password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        self.master_secret_version = aws.secretsmanager.SecretVersion(
            f"saas-rds-master-secret-version-{self.environment_suffix}",
            secret_id=self.master_secret.id,
            secret_string=master_password,
            opts=ResourceOptions(parent=self)
        )

        # Aurora Cluster
        self.aurora_cluster = aws.rds.Cluster(
            f"saas-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"saas-aurora-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.8",
            database_name="saasdb",
            master_username="postgres",
            master_password=master_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            db_cluster_parameter_group_name=self.db_cluster_param_group.name,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={**self.tags, "Name": f"saas-aurora-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Aurora Instance
        self.aurora_instance = aws.rds.ClusterInstance(
            f"saas-aurora-instance-{self.environment_suffix}",
            identifier=f"saas-aurora-instance-{self.environment_suffix}",
            cluster_identifier=self.aurora_cluster.id,
            instance_class="db.t3.medium",
            engine="aurora-postgresql",
            publicly_accessible=False,
            tags={**self.tags, "Name": f"saas-aurora-instance-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

    def _create_tenant_resources(self, tenant_id: str):
        """Create tenant-specific resources"""

        resources = {}

        # Tenant database password in Secrets Manager
        letters = [chr(random.randint(65, 90)) if random.random() > 0.5
                   else chr(random.randint(97, 122)) for _ in range(16)]
        digits = [str(random.randint(0, 9)) for _ in range(8)]
        tenant_password = ''.join(letters + digits)

        resources['secret'] = aws.secretsmanager.Secret(
            f"saas-tenant-{tenant_id}-secret-{self.environment_suffix}",
            name=f"rds/tenant/{tenant_id}/{self.environment_suffix}/password",
            tags={
                **self.tags,
                "Name": f"saas-tenant-{tenant_id}-secret-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        resources['secret_version'] = aws.secretsmanager.SecretVersion(
            f"saas-tenant-{tenant_id}-secret-version-{self.environment_suffix}",
            secret_id=resources['secret'].id,
            secret_string=tenant_password,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket for tenant
        resources['bucket'] = aws.s3.Bucket(
            f"saas-platform-{tenant_id}-data-{self.environment_suffix}",
            bucket=f"saas-platform-{tenant_id}-data-{self.environment_suffix}",
            force_destroy=True,
            tags={
                **self.tags,
                "Name": f"saas-platform-{tenant_id}-data-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task
        resources['task_role'] = aws.iam.Role(
            f"saas-ecs-task-role-{tenant_id}-{self.environment_suffix}",
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
            tags={
                **self.tags,
                "Name": f"saas-ecs-task-role-{tenant_id}-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        # IAM policy for S3 access (tenant-specific)
        resources['s3_policy'] = aws.iam.RolePolicy(
            f"saas-ecs-s3-policy-{tenant_id}-{self.environment_suffix}",
            role=resources['task_role'].id,
            policy=resources['bucket'].arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        arn,
                        f"{arn}/*"
                    ]
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # ECS execution role
        resources['execution_role'] = aws.iam.Role(
            f"saas-ecs-execution-role-{tenant_id}-{self.environment_suffix}",
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
            tags={
                **self.tags,
                "Name": f"saas-ecs-execution-role-{tenant_id}-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"saas-ecs-execution-policy-{tenant_id}-{self.environment_suffix}",
            role=resources['execution_role'].name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group
        resources['log_group'] = aws.cloudwatch.LogGroup(
            f"saas-ecs-log-{tenant_id}-{self.environment_suffix}",
            name=f"/ecs/tenant/{tenant_id}/{self.environment_suffix}",
            retention_in_days=30,
            tags={
                **self.tags,
                "Name": f"saas-ecs-log-{tenant_id}-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        resources['task_definition'] = aws.ecs.TaskDefinition(
            f"saas-task-{tenant_id}-{self.environment_suffix}",
            family=f"saas-task-{tenant_id}-{self.environment_suffix}",
            cpu="1024",
            memory="2048",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            execution_role_arn=resources['execution_role'].arn,
            task_role_arn=resources['task_role'].arn,
            container_definitions=pulumi.Output.all(
                resources['log_group'].name
            ).apply(lambda args: json.dumps([{
                "name": f"app-{tenant_id}",
                "image": "nginx:latest",
                "cpu": 1024,
                "memory": 2048,
                "essential": True,
                "portMappings": [{
                    "containerPort": 80,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[0],
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }])),
            tags={
                **self.tags,
                "Name": f"saas-task-{tenant_id}-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        # Target Group (name limited to 32 chars, let Pulumi auto-generate)
        resources['target_group'] = aws.lb.TargetGroup(
            f"saas-tg-{tenant_id}-{self.environment_suffix}",
            name=f"tg-{tenant_id[:8]}-{self.environment_suffix[:8]}",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/",
                protocol="HTTP",
                matcher="200-399"
            ),
            tags={
                **self.tags,
                "Name": f"saas-tg-{tenant_id}-{self.environment_suffix}",
                "tenant_id": tenant_id,
                "cost_center": tenant_id
            },
            opts=ResourceOptions(parent=self)
        )

        return resources

    def _create_alb(self):
        """Create Application Load Balancer with tenant routing"""

        # ALB
        self.alb = aws.lb.LoadBalancer(
            f"saas-alb-{self.environment_suffix}",
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            tags={**self.tags, "Name": f"saas-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Default target group (for default action)
        self.default_tg = aws.lb.TargetGroup(
            f"saas-default-tg-{self.environment_suffix}",
            name=f"tg-default-{self.environment_suffix[:14]}",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            tags={**self.tags, "Name": f"saas-default-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"saas-alb-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="fixed-response",
                fixed_response=aws.lb.ListenerDefaultActionFixedResponseArgs(
                    content_type="text/plain",
                    message_body="Invalid tenant",
                    status_code="404"
                )
            )],
            opts=ResourceOptions(parent=self)
        )

        # Listener rules for each tenant
        self.listener_rules = {}
        for i, tenant_id in enumerate(self.tenants):
            rule = aws.lb.ListenerRule(
                f"saas-rule-{tenant_id}-{self.environment_suffix}",
                listener_arn=self.alb_listener.arn,
                priority=i + 1,
                actions=[aws.lb.ListenerRuleActionArgs(
                    type="forward",
                    target_group_arn=self.tenant_resources[tenant_id]['target_group'].arn
                )],
                conditions=[aws.lb.ListenerRuleConditionArgs(
                    host_header=aws.lb.ListenerRuleConditionHostHeaderArgs(
                        values=[f"{tenant_id}.example.com", f"*.{tenant_id}.example.com"]
                    )
                )],
                opts=ResourceOptions(parent=self)
            )
            self.listener_rules[tenant_id] = rule

        # ECS Cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"saas-ecs-cluster-{self.environment_suffix}",
            name=f"saas-ecs-cluster-{self.environment_suffix}",
            tags={**self.tags, "Name": f"saas-ecs-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ECS Services for each tenant
        self.ecs_services = {}
        for tenant_id in self.tenants:
            service = aws.ecs.Service(
                f"saas-service-{tenant_id}-{self.environment_suffix}",
                cluster=self.ecs_cluster.arn,
                task_definition=self.tenant_resources[tenant_id]['task_definition'].arn,
                desired_count=2,
                launch_type="FARGATE",
                network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                    subnets=[subnet.id for subnet in self.private_subnets],
                    security_groups=[self.ecs_sgs[tenant_id].id],
                    assign_public_ip=False
                ),
                load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                    target_group_arn=self.tenant_resources[tenant_id]['target_group'].arn,
                    container_name=f"app-{tenant_id}",
                    container_port=80
                )],
                tags={
                    **self.tags,
                    "Name": f"saas-service-{tenant_id}-{self.environment_suffix}",
                    "tenant_id": tenant_id,
                    "cost_center": tenant_id
                },
                opts=ResourceOptions(parent=self, depends_on=[self.alb_listener])
            )
            self.ecs_services[tenant_id] = service

            # Auto-scaling target
            scaling_target = aws.appautoscaling.Target(
                f"saas-scaling-target-{tenant_id}-{self.environment_suffix}",
                max_capacity=8,
                min_capacity=2,
                resource_id=pulumi.Output.all(self.ecs_cluster.name, service.name).apply(
                    lambda args: f"service/{args[0]}/{args[1]}"
                ),
                scalable_dimension="ecs:service:DesiredCount",
                service_namespace="ecs",
                opts=ResourceOptions(parent=self)
            )

            # Auto-scaling policy
            # Disable line-too-long for complex AWS class names
            # pylint: disable=line-too-long
            metric_spec_args = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization"
            )

            scaling_config_args = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=metric_spec_args,
                target_value=70.0
            )
            # pylint: enable=line-too-long

            aws.appautoscaling.Policy(
                f"saas-scaling-policy-{tenant_id}-{self.environment_suffix}",
                policy_type="TargetTrackingScaling",
                resource_id=scaling_target.resource_id,
                scalable_dimension=scaling_target.scalable_dimension,
                service_namespace=scaling_target.service_namespace,
                target_tracking_scaling_policy_configuration=scaling_config_args,
                opts=ResourceOptions(parent=self)
            )

    def _register_outputs(self):
        """Register stack outputs"""

        outputs = {
            "vpc_id": self.vpc.id,
            "alb_dns_name": self.alb.dns_name,
            "aurora_cluster_endpoint": self.aurora_cluster.endpoint,
            "aurora_cluster_reader_endpoint": self.aurora_cluster.reader_endpoint
        }

        # Tenant-specific outputs
        for tenant_id in self.tenants:
            outputs[f"{tenant_id}_endpoint"] = pulumi.Output.concat(tenant_id, ".example.com")
            outputs[f"{tenant_id}_bucket"] = self.tenant_resources[tenant_id]['bucket'].bucket
            tenant_username = tenant_id.replace('-', '_')
            outputs[f"{tenant_id}_db_connection"] = pulumi.Output.all(
                self.aurora_cluster.endpoint,
                self.tenant_resources[tenant_id]['secret'].name
            ).apply(
                lambda args, username=tenant_username:
                    f"postgresql://tenant_{username}@{args[0]}/saasdb?secret={args[1]}"
            )

        self.register_outputs(outputs)
