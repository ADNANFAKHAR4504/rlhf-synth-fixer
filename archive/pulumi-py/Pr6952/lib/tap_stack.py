"""
AWS Migration Infrastructure Stack
Implements phased migration of Java API and PostgreSQL database from on-premises to AWS
"""
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """Configuration arguments for Migration Stack"""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix

class TapStack(pulumi.ComponentResource):
    """Main Migration Infrastructure Stack"""
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        config = pulumi.Config()
        env_suffix = args.environment_suffix
        db_password = config.get_secret("dbPassword") or pulumi.Output.secret("TempPassword123!")
        onprem_db_endpoint = config.get("onpremDbEndpoint") or "10.0.0.100"
        
        # VPC Configuration
        self.vpc = aws.ec2.Vpc(
            "migration-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"migration-vpc-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            "migration-igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"migration-igw-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Public Subnets
        public_subnet_1 = aws.ec2.Subnet(
            "public-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={"Name": f"public-subnet-1-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        public_subnet_2 = aws.ec2.Subnet(
            "public-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={"Name": f"public-subnet-2-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Private Subnets
        private_subnet_1 = aws.ec2.Subnet(
            "private-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1a",
            tags={"Name": f"private-subnet-1-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        private_subnet_2 = aws.ec2.Subnet(
            "private-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone="us-east-1b",
            tags={"Name": f"private-subnet-2-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # NAT Gateway
        eip = aws.ec2.Eip(
            "nat-eip",
            domain="vpc",
            tags={"Name": f"nat-eip-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        nat_gateway = aws.ec2.NatGateway(
            "nat-gateway",
            allocation_id=eip.id,
            subnet_id=public_subnet_1.id,
            tags={"Name": f"nat-gateway-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Route Tables
        public_rt = aws.ec2.RouteTable(
            "public-route-table",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags={"Name": f"public-rt-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        private_rt = aws.ec2.RouteTable(
            "private-route-table",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", nat_gateway_id=nat_gateway.id)],
            tags={"Name": f"private-rt-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Route Table Associations
        aws.ec2.RouteTableAssociation(
            "public-rta-1",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            "public-rta-2",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            "private-rta-1",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )
        aws.ec2.RouteTableAssociation(
            "private-rta-2",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )
        
        # Security Groups
        alb_sg = aws.ec2.SecurityGroup(
            "alb-sg",
            vpc_id=self.vpc.id,
            description="Security group for ALB",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"]),
                aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=443, to_port=443, cidr_blocks=["0.0.0.0/0"])
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"alb-sg-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        ecs_sg = aws.ec2.SecurityGroup(
            "ecs-sg",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            egress=[aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"ecs-sg-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        aws.ec2.SecurityGroupRule(
            "ecs-from-alb",
            type="ingress",
            security_group_id=ecs_sg.id,
            source_security_group_id=alb_sg.id,
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            opts=ResourceOptions(parent=self)
        )
        
        rds_sg = aws.ec2.SecurityGroup(
            "rds-sg",
            vpc_id=self.vpc.id,
            description="Security group for RDS",
            egress=[aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
            tags={"Name": f"rds-sg-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        aws.ec2.SecurityGroupRule(
            "rds-from-ecs",
            type="ingress",
            security_group_id=rds_sg.id,
            source_security_group_id=ecs_sg.id,
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            opts=ResourceOptions(parent=self)
        )
        
        dms_sg = aws.ec2.SecurityGroup(
            "dms-sg",
            vpc_id=self.vpc.id,
            description="Security group for DMS",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=["10.0.0.0/16"]
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={"Name": f"dms-sg-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        mgn_sg = aws.ec2.SecurityGroup(
            "mgn-sg",
            vpc_id=self.vpc.id,
            description="Security group for AWS MGN replication servers",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["10.0.0.0/16"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=1500,
                    to_port=1500,
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={"Name": f"mgn-sg-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.SecurityGroupRule(
            "rds-from-dms",
            type="ingress",
            security_group_id=rds_sg.id,
            source_security_group_id=dms_sg.id,
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Subnet Group
        db_subnet_group = aws.rds.SubnetGroup(
            "db-subnet-group",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"db-subnet-group-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # RDS PostgreSQL
        self.db_instance = aws.rds.Instance(
            "postgres-db",
            identifier=f"migration-postgres-{env_suffix}",
            engine="postgres",
            instance_class="db.t3.medium",
            allocated_storage=100,
            storage_type="gp3",
            storage_encrypted=True,
            db_name="appdb",
            username="dbadmin",
            password=db_password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True,
            deletion_protection=False,
            publicly_accessible=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={"Name": f"migration-postgres-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # DMS Subnet Group
        dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            "dms-subnet-group",
            replication_subnet_group_id=f"dms-subnet-group-{env_suffix}",
            replication_subnet_group_description="DMS replication subnet group",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={"Name": f"dms-subnet-group-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # DMS IAM Roles
        dms_vpc_role = aws.iam.Role(
            "dms-vpc-role",
            name=f"dms-vpc-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            "dms-vpc-policy",
            role=dms_vpc_role.name,
            policy_arn=(
                "arn:aws:iam::aws:policy/service-role/"
                "AmazonDMSVPCManagementRole"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        dms_cloudwatch_role = aws.iam.Role(
            "dms-cloudwatch-role",
            name=f"dms-cloudwatch-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            "dms-cloudwatch-policy",
            role=dms_cloudwatch_role.name,
            policy_arn=(
                "arn:aws:iam::aws:policy/service-role/"
                "AmazonDMSCloudWatchLogsRole"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # DMS Replication Instance
        dms_replication_instance = aws.dms.ReplicationInstance(
            "dms-replication-instance",
            replication_instance_id=f"dms-instance-{env_suffix}",
            replication_instance_class="dms.t3.medium",
            allocated_storage=100,
            vpc_security_group_ids=[dms_sg.id],
            replication_subnet_group_id=dms_subnet_group.replication_subnet_group_id,
            publicly_accessible=False,
            multi_az=False,
            tags={"Name": f"dms-replication-instance-{env_suffix}"},
            opts=ResourceOptions(parent=self, depends_on=[dms_vpc_role, dms_cloudwatch_role])
        )
        
        # DMS Endpoints
        dms_source_endpoint = aws.dms.Endpoint(
            "dms-source-endpoint",
            endpoint_id=f"source-postgres-{env_suffix}",
            endpoint_type="source",
            engine_name="postgres",
            server_name=onprem_db_endpoint,
            port=5432,
            database_name="sourcedb",
            username="sourceuser",
            password=db_password,
            ssl_mode="none",
            tags={"Name": f"dms-source-endpoint-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        dms_target_endpoint = aws.dms.Endpoint(
            "dms-target-endpoint",
            endpoint_id=f"target-postgres-{env_suffix}",
            endpoint_type="target",
            engine_name="postgres",
            server_name=self.db_instance.address,
            port=5432,
            database_name="appdb",
            username="dbadmin",
            password=db_password,
            ssl_mode="none",
            tags={"Name": f"dms-target-endpoint-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # DMS Replication Task
        dms_replication_task = aws.dms.ReplicationTask(
            "dms-replication-task",
            replication_task_id=f"replication-task-{env_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=dms_replication_instance.replication_instance_arn,
            source_endpoint_arn=dms_source_endpoint.endpoint_arn,
            target_endpoint_arn=dms_target_endpoint.endpoint_arn,
            table_mappings=json.dumps({
                "rules": [{
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {"schema-name": "public", "table-name": "%"},
                    "rule-action": "include"
                }]
            }),
            replication_task_settings=json.dumps({
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [
                        {"Id": "TRANSFORMATION", "Severity": "LOGGER_SEVERITY_DEFAULT"},
                        {"Id": "SOURCE_UNLOAD", "Severity": "LOGGER_SEVERITY_DEFAULT"},
                        {"Id": "TARGET_LOAD", "Severity": "LOGGER_SEVERITY_DEFAULT"}
                    ]
                }
            }),
            tags={"Name": f"dms-replication-task-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Cluster
        ecs_cluster = aws.ecs.Cluster(
            "ecs-cluster",
            name=f"migration-cluster-{env_suffix}",
            settings=[aws.ecs.ClusterSettingArgs(name="containerInsights", value="enabled")],
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Log Group
        ecs_log_group = aws.cloudwatch.LogGroup(
            "ecs-log-group",
            name=f"/ecs/java-api-{env_suffix}",
            retention_in_days=7,
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Task Roles
        ecs_task_execution_role = aws.iam.Role(
            "ecs-task-execution-role",
            name=f"ecs-task-execution-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            "ecs-task-execution-policy",
            role=ecs_task_execution_role.name,
            policy_arn=(
                "arn:aws:iam::aws:policy/service-role/"
                "AmazonECSTaskExecutionRolePolicy"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        ecs_task_role = aws.iam.Role(
            "ecs-task-role",
            name=f"ecs-task-role-{env_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Task Definition
        ecs_task_definition = aws.ecs.TaskDefinition(
            "ecs-task-definition",
            family=f"java-api-{env_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=ecs_task_execution_role.arn,
            task_role_arn=ecs_task_role.arn,
            container_definitions=pulumi.Output.all(ecs_log_group.name, self.db_instance.address).apply(
                lambda args: json.dumps([{
                    "name": "java-api",
                    "image": "public.ecr.aws/docker/library/tomcat:9-jdk17",
                    "cpu": 1024,
                    "memory": 2048,
                    "essential": True,
                    "portMappings": [{"containerPort": 8080, "protocol": "tcp"}],
                    "environment": [
                        {"name": "DB_HOST", "value": args[1]},
                        {"name": "DB_PORT", "value": "5432"},
                        {"name": "DB_NAME", "value": "appdb"},
                        {"name": "DB_USER", "value": "dbadmin"}
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": args[0],
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }])
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # Application Load Balancer
        alb = aws.lb.LoadBalancer(
            "application-lb",
            name=f"migration-alb-{env_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_1.id, public_subnet_2.id],
            enable_deletion_protection=False,
            opts=ResourceOptions(parent=self)
        )
        
        # Target Group
        target_group = aws.lb.TargetGroup(
            "target-group",
            name=f"java-api-tg-{env_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/",
                matcher="200-299"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # ALB Listener
        alb_listener = aws.lb.Listener(
            "alb-listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(type="forward", target_group_arn=target_group.arn)],
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Service
        ecs_service = aws.ecs.Service(
            "ecs-service",
            name=f"java-api-service-{env_suffix}",
            cluster=ecs_cluster.arn,
            task_definition=ecs_task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[private_subnet_1.id, private_subnet_2.id],
                security_groups=[ecs_sg.id],
                assign_public_ip=False
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=target_group.arn,
                container_name="java-api",
                container_port=8080
            )],
            health_check_grace_period_seconds=60,
            opts=ResourceOptions(parent=self, depends_on=[alb_listener])
        )
        
        # Route 53 Health Check
        health_check = aws.route53.HealthCheck(
            "alb-health-check",
            type="HTTP",
            resource_path="/",
            fqdn=alb.dns_name,
            port=80,
            request_interval=30,
            failure_threshold=3,
            tags={"Name": f"alb-health-check-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarms
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            "ecs-cpu-alarm",
            name=f"ecs-cpu-high-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"ClusterName": ecs_cluster.name, "ServiceName": ecs_service.name},
            opts=ResourceOptions(parent=self)
        )
        
        memory_alarm = aws.cloudwatch.MetricAlarm(
            "ecs-memory-alarm",
            name=f"ecs-memory-high-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"ClusterName": ecs_cluster.name, "ServiceName": ecs_service.name},
            opts=ResourceOptions(parent=self)
        )
        
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            "rds-cpu-alarm",
            name=f"rds-cpu-high-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"DBInstanceIdentifier": self.db_instance.identifier},
            opts=ResourceOptions(parent=self)
        )
        
        dms_lag_alarm = aws.cloudwatch.MetricAlarm(
            "dms-replication-lag-alarm",
            name=f"dms-replication-lag-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencySource",
            namespace="AWS/DMS",
            period=300,
            statistic="Average",
            threshold=300,
            dimensions={
                "ReplicationInstanceIdentifier": dms_replication_instance.replication_instance_id,
                "ReplicationTaskIdentifier": dms_replication_task.replication_task_id
            },
            opts=ResourceOptions(parent=self)
        )

        # SNS Topic for Alarm Notifications
        alarm_topic = aws.sns.Topic(
            "migration-alarms-topic",
            name=f"migration-alarms-{env_suffix}",
            display_name="Migration Infrastructure Alarms",
            opts=ResourceOptions(parent=self)
        )

        # Add SNS actions to alarms
        ecs_cpu_alarm_with_action = aws.cloudwatch.MetricAlarm(
            "ecs-cpu-alarm-with-sns",
            name=f"ecs-cpu-high-with-sns-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"ClusterName": ecs_cluster.name, "ServiceName": ecs_service.name},
            alarm_actions=[alarm_topic.arn],
            ok_actions=[alarm_topic.arn],
            opts=ResourceOptions(parent=self)
        )

        ecs_mem_alarm_with_action = aws.cloudwatch.MetricAlarm(
            "ecs-memory-alarm-with-sns",
            name=f"ecs-memory-high-with-sns-{env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"ClusterName": ecs_cluster.name, "ServiceName": ecs_service.name},
            alarm_actions=[alarm_topic.arn],
            ok_actions=[alarm_topic.arn],
            opts=ResourceOptions(parent=self)
        )

        # AWS Application Migration Service (MGN) Configuration
        # Note: MGN requires manual setup via AWS Console or CloudFormation
        # This placeholder documents the required MGN configuration
        mgn_config = {
            "replication_template": {
                "associate_default_security_group": True,
                "bandwidth_throttling": 0,
                "create_public_ip": False,
                "data_plane_routing": "PRIVATE_IP",
                "default_large_staging_disk_type": "GP3",
                "ebs_encryption": "ENABLED",
                "replication_server_instance_type": "t3.small",
                "staging_area_subnet_id": private_subnet_1.id,
                "staging_area_security_group_ids": [mgn_sg.id],
                "use_dedicated_replication_server": False
            }
        }

        # Create SSM Parameter to store MGN configuration for reference
        mgn_config_param = aws.ssm.Parameter(
            "mgn-config-param",
            name=f"/migration/{env_suffix}/mgn-config",
            type="String",
            value=pulumi.Output.all(private_subnet_1.id, mgn_sg.id).apply(
                lambda args: json.dumps({
                    "staging_subnet_id": args[0],
                    "security_group_id": args[1],
                    "replication_server_type": "t3.small",
                    "ebs_encryption": "ENABLED"
                })
            ),
            description="AWS MGN configuration for Java API migration",
            tags={"Name": f"mgn-config-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Route 53 Weighted Routing for Phased Cutover
        # Create hosted zone for the domain
        domain_name = config.get("domainName") or f"api-{env_suffix}.tapstack.local"
        hosted_zone = aws.route53.Zone(
            "api-hosted-zone",
            name=domain_name,
            comment=f"Hosted zone for {domain_name}",
            tags={"Name": f"api-hosted-zone-{env_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        hosted_zone_id = hosted_zone.zone_id

        # AWS endpoint weighted record (10% initial traffic)
        aws_weighted_record = aws.route53.Record(
            "api-aws-weighted-record",
            zone_id=hosted_zone_id,
            name=domain_name,
            type="A",
            set_identifier=f"AWS-{env_suffix}",
            aliases=[aws.route53.RecordAliasArgs(
                name=alb.dns_name,
                zone_id=alb.zone_id,
                evaluate_target_health=True
            )],
            weighted_routing_policies=[aws.route53.RecordWeightedRoutingPolicyArgs(
                weight=10
            )],
            health_check_id=health_check.id,
            opts=ResourceOptions(parent=self)
        )

        # On-premises endpoint (separate subdomain to avoid CNAME at apex)
        # Note: Requires on-premises endpoint configuration
        onprem_endpoint = config.get("onpremEndpoint") or "onprem.example.com"
        onprem_record = aws.route53.Record(
            "api-onprem-record",
            zone_id=hosted_zone_id,
            name=f"onprem.{domain_name}",
            type="CNAME",
            ttl=60,
            records=[onprem_endpoint],
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "alb_dns_name": alb.dns_name,
            "alb_url": pulumi.Output.concat("http://", alb.dns_name),
            "rds_endpoint": self.db_instance.endpoint,
            "rds_address": self.db_instance.address,
            "ecs_cluster_name": ecs_cluster.name,
            "ecs_service_name": ecs_service.name,
            "dms_replication_instance_arn": dms_replication_instance.replication_instance_arn,
            "dms_replication_task_arn": dms_replication_task.replication_task_arn,
            "health_check_id": health_check.id,
            "sns_topic_arn": alarm_topic.arn,
            "mgn_config_param_name": mgn_config_param.name,
            "mgn_security_group_id": mgn_sg.id,
            "weighted_dns_name": domain_name,
            "hosted_zone_id": hosted_zone.zone_id
        })
