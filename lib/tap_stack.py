import pulumi
import pulumi_aws as aws
import json

class TapStack(pulumi.ComponentResource):
    def __init__(self, name: str, environment_suffix: str, is_localstack: bool = False, opts=None):
        super().__init__('custom:stack:TapStack', name, {}, opts)

        self.environment_suffix = environment_suffix
        self.is_localstack = is_localstack

        # Get current region dynamically
        self.current_region = aws.get_region()
        self.region_name = self.current_region.name

        # Create KMS key for encryption
        self.kms_key = aws.kms.Key(
            f"encryption-key-{environment_suffix}",
            description="KMS key for payment processing encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={"Environment": environment_suffix, "Compliance": "PCI-DSS"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        kms_alias = aws.kms.Alias(
            f"kms-alias-{environment_suffix}",
            name=f"alias/payment-processing-{environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create VPCs for blue and green environments
        self.blue_vpc = self._create_vpc("blue", "10.0.0.0/16")
        self.green_vpc = self._create_vpc("green", "10.1.0.0/16")

        # Create Transit Gateway
        self.transit_gateway = aws.ec2transitgateway.TransitGateway(
            f"transit-gateway-{environment_suffix}",
            description="Transit Gateway for blue-green communication",
            auto_accept_shared_attachments="enable",
            default_route_table_association="enable",
            default_route_table_propagation="enable",
            tags={"Name": f"transit-gateway-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach VPCs to Transit Gateway
        blue_tgw_attachment = aws.ec2transitgateway.VpcAttachment(
            f"blue-tgw-attachment-{environment_suffix}",
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.blue_vpc["vpc"].id,
            subnet_ids=[subnet.id for subnet in self.blue_vpc["private_subnets"]],
            tags={"Name": f"blue-tgw-attachment-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        green_tgw_attachment = aws.ec2transitgateway.VpcAttachment(
            f"green-tgw-attachment-{environment_suffix}",
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.green_vpc["vpc"].id,
            subnet_ids=[subnet.id for subnet in self.green_vpc["private_subnets"]],
            tags={"Name": f"green-tgw-attachment-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create security groups
        self.alb_security_group = self._create_alb_security_group(self.blue_vpc["vpc"])
        self.lambda_security_group_blue = self._create_lambda_security_group(self.blue_vpc["vpc"], "blue")
        self.lambda_security_group_green = self._create_lambda_security_group(self.green_vpc["vpc"], "green")
        self.rds_security_group_blue = self._create_rds_security_group(self.blue_vpc["vpc"], "blue")
        self.rds_security_group_green = self._create_rds_security_group(self.green_vpc["vpc"], "green")

        # Create DB subnet groups
        blue_db_subnet_group = aws.rds.SubnetGroup(
            f"blue-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.blue_vpc["private_subnets"]],
            tags={"Name": f"blue-db-subnet-group-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        green_db_subnet_group = aws.rds.SubnetGroup(
            f"green-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.green_vpc["private_subnets"]],
            tags={"Name": f"green-db-subnet-group-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Secrets Manager secrets for DB credentials
        blue_db_secret = aws.secretsmanager.Secret(
            f"blue-db-secret-{environment_suffix}",
            name=f"blue-db-credentials-{environment_suffix}",
            kms_key_id=self.kms_key.id,
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        blue_db_secret_version = aws.secretsmanager.SecretVersion(
            f"blue-db-secret-version-{environment_suffix}",
            secret_id=blue_db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "ChangeMe123456!"
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )

        green_db_secret = aws.secretsmanager.Secret(
            f"green-db-secret-{environment_suffix}",
            name=f"green-db-credentials-{environment_suffix}",
            kms_key_id=self.kms_key.id,
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        green_db_secret_version = aws.secretsmanager.SecretVersion(
            f"green-db-secret-version-{environment_suffix}",
            secret_id=green_db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "ChangeMe123456!"
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Aurora clusters
        self.blue_aurora_cluster = aws.rds.Cluster(
            f"blue-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"blue-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=blue_db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group_blue.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            tags={"Environment": "blue", "Name": f"blue-aurora-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        blue_aurora_instance = aws.rds.ClusterInstance(
            f"blue-aurora-instance-{environment_suffix}",
            identifier=f"blue-aurora-instance-{environment_suffix}",
            cluster_identifier=self.blue_aurora_cluster.id,
            instance_class="db.t3.medium",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.green_aurora_cluster = aws.rds.Cluster(
            f"green-aurora-cluster-{environment_suffix}",
            cluster_identifier=f"green-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=green_db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group_green.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            tags={"Environment": "green", "Name": f"green-aurora-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        green_aurora_instance = aws.rds.ClusterInstance(
            f"green-aurora-instance-{environment_suffix}",
            identifier=f"green-aurora-instance-{environment_suffix}",
            cluster_identifier=self.green_aurora_cluster.id,
            instance_class="db.t3.medium",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create cross-region read replica (eu-west-1)
        eu_west_1_provider = aws.Provider(
            "eu-west-1-provider",
            region="eu-west-1",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create SQS queues
        self.dlq_blue = aws.sqs.Queue(
            f"payment-dlq-blue-{environment_suffix}",
            name=f"payment-dlq-blue-{environment_suffix}",
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_key.id,
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.queue_blue = aws.sqs.Queue(
            f"payment-queue-blue-{environment_suffix}",
            name=f"payment-queue-blue-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,
            kms_master_key_id=self.kms_key.id,
            redrive_policy=self.dlq_blue.arn.apply(
                lambda arn: json.dumps({"deadLetterTargetArn": arn, "maxReceiveCount": 3})
            ),
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.dlq_green = aws.sqs.Queue(
            f"payment-dlq-green-{environment_suffix}",
            name=f"payment-dlq-green-{environment_suffix}",
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_key.id,
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.queue_green = aws.sqs.Queue(
            f"payment-queue-green-{environment_suffix}",
            name=f"payment-queue-green-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,
            kms_master_key_id=self.kms_key.id,
            redrive_policy=self.dlq_green.arn.apply(
                lambda arn: json.dumps({"deadLetterTargetArn": arn, "maxReceiveCount": 3})
            ),
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda IAM role
        lambda_role_blue = self._create_lambda_role("blue")
        lambda_role_green = self._create_lambda_role("green")

        # Create Lambda functions
        self.lambda_blue = self._create_lambda_function(
            "blue",
            lambda_role_blue,
            self.lambda_security_group_blue,
            self.blue_vpc["private_subnets"],
            self.queue_blue.arn,
            self.blue_aurora_cluster.endpoint
        )

        self.lambda_green = self._create_lambda_function(
            "green",
            lambda_role_green,
            self.lambda_security_group_green,
            self.green_vpc["private_subnets"],
            self.queue_green.arn,
            self.green_aurora_cluster.endpoint
        )

        # Create ALB
        self.alb = aws.lb.LoadBalancer(
            f"payment-alb-{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.blue_vpc["public_subnets"]],
            security_groups=[self.alb_security_group.id],
            enable_deletion_protection=False,
            tags={"Name": f"payment-alb-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create target groups
        self.target_group_blue = aws.lb.TargetGroup(
            f"payment-tg-blue-{environment_suffix}",
            name=f"payment-tg-blue-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.blue_vpc["vpc"].id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=35,  # Must be greater than timeout
                timeout=30,   # Default Lambda timeout
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.target_group_green = aws.lb.TargetGroup(
            f"payment-tg-green-{environment_suffix}",
            name=f"payment-tg-green-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.green_vpc["vpc"].id,
            target_type="lambda",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=35,  # Must be greater than timeout
                timeout=30,   # Default Lambda timeout
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach Lambda to target groups
        blue_tg_attachment = aws.lb.TargetGroupAttachment(
            f"blue-tg-attachment-{environment_suffix}",
            target_group_arn=self.target_group_blue.arn,
            target_id=self.lambda_blue.arn,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.lambda_blue])
        )

        green_tg_attachment = aws.lb.TargetGroupAttachment(
            f"green-tg-attachment-{environment_suffix}",
            target_group_arn=self.target_group_green.arn,
            target_id=self.lambda_green.arn,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.lambda_green])
        )

        # Create ALB listener with weighted routing
        self.alb_listener = aws.lb.Listener(
            f"payment-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    forward=aws.lb.ListenerDefaultActionForwardArgs(
                        target_groups=[
                            aws.lb.ListenerDefaultActionForwardTargetGroupArgs(
                                arn=self.target_group_blue.arn,
                                weight=80
                            ),
                            aws.lb.ListenerDefaultActionForwardTargetGroupArgs(
                                arn=self.target_group_green.arn,
                                weight=20
                            )
                        ]
                    )
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create WAF WebACL (skip in LocalStack as WAFv2 is not supported)
        if not self.is_localstack:
            self.waf_acl = self._create_waf_acl()

            # Associate WAF with ALB
            waf_association = aws.wafv2.WebAclAssociation(
                f"waf-alb-association-{environment_suffix}",
                resource_arn=self.alb.arn,
                web_acl_arn=self.waf_acl.arn,
                opts=pulumi.ResourceOptions(parent=self)
            )
        else:
            self.waf_acl = None

        # Create Route 53 health checks
        self.blue_health_check = aws.route53.HealthCheck(
            f"blue-health-check-{environment_suffix}",
            type="HTTPS",
            resource_path="/health",
            fqdn=self.alb.dns_name,
            port=443,
            failure_threshold=3,
            request_interval=30,
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.green_health_check = aws.route53.HealthCheck(
            f"green-health-check-{environment_suffix}",
            type="HTTPS",
            resource_path="/health",
            fqdn=self.alb.dns_name,
            port=443,
            failure_threshold=3,
            request_interval=30,
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create SNS topics
        self.sns_topic = aws.sns.Topic(
            f"payment-alerts-{environment_suffix}",
            name=f"payment-alerts-{environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            tags={"Name": f"payment-alerts-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        sns_subscription = aws.sns.TopicSubscription(
            f"sns-email-subscription-{environment_suffix}",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch Dashboard
        self.dashboard = self._create_cloudwatch_dashboard()

        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()

        # Create Systems Manager parameters
        self._create_ssm_parameters()

        # Create AWS Config - REMOVED due to account-level quota limits
        # AWS Config allows only 1 recorder per region per account
        # self._create_aws_config()

        # Create VPC Endpoints - REMOVED due to VPC endpoint quota limits
        # self._create_vpc_endpoints()

        # Export outputs
        self.alb_dns = self.alb.dns_name
        self.blue_rds_endpoint = self.blue_aurora_cluster.endpoint
        self.green_rds_endpoint = self.green_aurora_cluster.endpoint
        self.dashboard_url = pulumi.Output.concat(
            f"https://console.aws.amazon.com/cloudwatch/home?region={self.region_name}#dashboards:name=",
            self.dashboard.dashboard_name
        )

        self.register_outputs({
            "alb_dns_name": self.alb_dns,
            "blue_rds_endpoint": self.blue_rds_endpoint,
            "green_rds_endpoint": self.green_rds_endpoint,
            "cloudwatch_dashboard_url": self.dashboard_url
        })

    def _create_vpc(self, environment: str, cidr: str):
        """Create VPC with subnets, NAT gateways, and flow logs"""
        vpc = aws.ec2.Vpc(
            f"{environment}-vpc-{self.environment_suffix}",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"{environment}-vpc-{self.environment_suffix}", "Environment": environment},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{environment}-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={"Name": f"{environment}-igw-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create subnets - dynamically get availability zones for current region
        current_region = aws.get_region()
        available_azs = aws.get_availability_zones(state="available")
        availability_zones = available_azs.names[:3]  # Use first 3 AZs
        public_subnets = []
        private_subnets = []
        nat_gateways = []

        # Parse base octets for CIDR calculation
        base_octets = cidr.split('/')[0].split('.')

        for i, az in enumerate(availability_zones):
            # Calculate subnet CIDR blocks (non-overlapping /20 subnets)
            # Public: 10.x.0.0/20, 10.x.16.0/20, 10.x.32.0/20
            # Private: 10.x.128.0/20, 10.x.144.0/20, 10.x.160.0/20
            public_third_octet = i * 16
            private_third_octet = 128 + (i * 16)

            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"{environment}-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{public_third_octet}.0/20",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"{environment}-public-{az}-{self.environment_suffix}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"{environment}-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{private_third_octet}.0/20",
                availability_zone=az,
                tags={"Name": f"{environment}-private-{az}-{self.environment_suffix}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            private_subnets.append(private_subnet)

        # Create a single NAT Gateway per VPC (cost optimization and EIP quota management)
        # Use the first public subnet for the NAT Gateway
        # Note: Using -0 suffix to match existing Pulumi state resource names
        eip = aws.ec2.Eip(
            f"{environment}-nat-eip-0-{self.environment_suffix}",
            domain="vpc",
            tags={"Name": f"{environment}-nat-eip-0-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        nat = aws.ec2.NatGateway(
            f"{environment}-nat-0-{self.environment_suffix}",
            subnet_id=public_subnets[0].id,
            allocation_id=eip.id,
            tags={"Name": f"{environment}-nat-0-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        nat_gateways.append(nat)

        # Create route tables
        public_route_table = aws.ec2.RouteTable(
            f"{environment}-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={"Name": f"{environment}-public-rt-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        public_route = aws.ec2.Route(
            f"{environment}-public-route-{self.environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{environment}-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # All private subnets use the single NAT Gateway
        for i, subnet in enumerate(private_subnets):
            private_route_table = aws.ec2.RouteTable(
                f"{environment}-private-rt-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={"Name": f"{environment}-private-rt-{i}-{self.environment_suffix}"},
                opts=pulumi.ResourceOptions(parent=self)
            )

            private_route = aws.ec2.Route(
                f"{environment}-private-route-{i}-{self.environment_suffix}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"{environment}-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Create VPC Flow Logs (skip in LocalStack as it doesn't fully support Flow Logs)
        if not self.is_localstack:
            flow_log_role = aws.iam.Role(
                f"{environment}-flow-log-role-{self.environment_suffix}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }),
                opts=pulumi.ResourceOptions(parent=self)
            )

            flow_log_policy = aws.iam.RolePolicy(
                f"{environment}-flow-log-policy-{self.environment_suffix}",
                role=flow_log_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "*"
                    }]
                }),
                opts=pulumi.ResourceOptions(parent=self)
            )

            flow_log_group = aws.cloudwatch.LogGroup(
                f"{environment}-vpc-flow-logs-{self.environment_suffix}",
                name=f"/aws/vpc/flow-logs/{environment}-{self.environment_suffix}",
                retention_in_days=7,
                opts=pulumi.ResourceOptions(parent=self)
            )

            flow_log = aws.ec2.FlowLog(
                f"{environment}-flow-log-{self.environment_suffix}",
                vpc_id=vpc.id,
                traffic_type="ALL",
                iam_role_arn=flow_log_role.arn,
                log_destination_type="cloud-watch-logs",
                log_destination=flow_log_group.arn,
                tags={"Name": f"{environment}-flow-log-{self.environment_suffix}"},
                opts=pulumi.ResourceOptions(parent=self, depends_on=[flow_log_policy])
            )

        return {
            "vpc": vpc,
            "public_subnets": public_subnets,
            "private_subnets": private_subnets,
            "nat_gateways": nat_gateways
        }

    def _create_alb_security_group(self, vpc):
        """Create security group for ALB"""
        sg = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Application Load Balancer",
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
            tags={"Name": f"alb-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        return sg

    def _create_lambda_security_group(self, vpc, environment: str):
        """Create security group for Lambda functions"""
        sg = aws.ec2.SecurityGroup(
            f"{environment}-lambda-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description=f"Security group for {environment} Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Name": f"{environment}-lambda-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        return sg

    def _create_rds_security_group(self, vpc, environment: str):
        """Create security group for RDS"""
        sg = aws.ec2.SecurityGroup(
            f"{environment}-rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description=f"Security group for {environment} RDS Aurora",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=[vpc.cidr_block]
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
            tags={"Name": f"{environment}-rds-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        return sg

    def _create_lambda_role(self, environment: str):
        """Create IAM role for Lambda"""
        # Get current region dynamically
        current_region = aws.get_region()
        region_name = current_region.name

        role = aws.iam.Role(
            f"{environment}-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Environment": environment},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f"{environment}-lambda-basic-policy-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create inline policy for SQS, Secrets Manager, RDS
        inline_policy = aws.iam.RolePolicy(
            f"{environment}-lambda-inline-policy-{self.environment_suffix}",
            role=role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes",
                            "sqs:SendMessage"
                        ],
                        "Resource": f"arn:aws:sqs:{region_name}:*:payment-*-{self.environment_suffix}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{region_name}:*:secret:{environment}-db-credentials-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )

        return role

    def _create_lambda_function(self, environment: str, role, security_group, subnets, queue_arn, db_endpoint):
        """Create Lambda function"""
        lambda_function = aws.lambda_.Function(
            f"{environment}-payment-processor-{self.environment_suffix}",
            name=f"{environment}-payment-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=role.arn,
            code=pulumi.FileArchive("./lib/lambda"),
            timeout=300,
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": environment,
                    "QUEUE_URL": queue_arn,
                    "DB_ENDPOINT": db_endpoint
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in subnets],
                security_group_ids=[security_group.id]
            ),
            tags={"Environment": environment},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Grant ALB permission to invoke Lambda
        lambda_permission = aws.lambda_.Permission(
            f"{environment}-lambda-alb-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="elasticloadbalancing.amazonaws.com",
            opts=pulumi.ResourceOptions(parent=self)
        )

        return lambda_function

    def _create_waf_acl(self):
        """Create WAF WebACL with OWASP rules"""
        waf_acl = aws.wafv2.WebAcl(
            f"payment-waf-{self.environment_suffix}",
            name=f"payment-waf-{self.environment_suffix}",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSet",
                        sampled_requests_enabled=True
                    )
                ),
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesSQLiRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            vendor_name="AWS",
                            name="AWSManagedRulesSQLiRuleSet"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesSQLiRuleSet",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"payment-waf-{self.environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={"Name": f"payment-waf-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        return waf_acl

    def _create_cloudwatch_dashboard(self):
        """Create CloudWatch Dashboard"""
        dashboard = aws.cloudwatch.Dashboard(
            f"payment-dashboard-{self.environment_suffix}",
            dashboard_name=f"payment-dashboard-{self.environment_suffix}",
            dashboard_body=pulumi.Output.json_dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                                [".", "RequestCount", {"stat": "Sum"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.region_name,
                            "title": "ALB Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                                [".", "CPUUtilization", {"stat": "Average"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.region_name,
                            "title": "RDS Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                                [".", "Errors", {"stat": "Sum"}],
                                [".", "Duration", {"stat": "Average"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.region_name,
                            "title": "Lambda Metrics"
                        }
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        return dashboard

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch Alarms"""
        # ALB 5xx errors alarm
        alb_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-5xx-alarm-{self.environment_suffix}",
            name=f"alb-5xx-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when ALB returns too many 5xx errors",
            alarm_actions=[self.sns_topic.arn],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # RDS CPU alarm
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{self.environment_suffix}",
            name=f"rds-high-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Lambda errors alarm
        lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{self.environment_suffix}",
            name=f"lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic.arn],
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_ssm_parameters(self):
        """Create SSM Parameter Store parameters"""
        # Blue environment parameters
        blue_config = aws.ssm.Parameter(
            f"blue-config-{self.environment_suffix}",
            name=f"/payment/blue/config/{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "environment": "blue",
                "version": "1.0",
                "features": {"new_payment_flow": False}
            }),
            key_id=self.kms_key.id,
            tags={"Environment": "blue"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Green environment parameters
        green_config = aws.ssm.Parameter(
            f"green-config-{self.environment_suffix}",
            name=f"/payment/green/config/{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "environment": "green",
                "version": "2.0",
                "features": {"new_payment_flow": True}
            }),
            key_id=self.kms_key.id,
            tags={"Environment": "green"},
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_aws_config(self):
        """Create AWS Config for compliance monitoring"""
        # Create S3 bucket for Config
        config_bucket = aws.s3.Bucket(
            f"config-bucket-{self.environment_suffix}",
            bucket=f"aws-config-{self.environment_suffix}",
            force_destroy=True,
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="AES256"
                            )
                        )
                    )
                )
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create IAM role for Config
        config_role = aws.iam.Role(
            f"config-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach AWS Config managed policy
        config_policy_attachment = aws.iam.RolePolicyAttachment(
            f"config-policy-{self.environment_suffix}",
            role=config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create S3 bucket policy for Config
        config_bucket_policy = aws.s3.BucketPolicy(
            f"config-bucket-policy-{self.environment_suffix}",
            bucket=config_bucket.id,
            policy=pulumi.Output.all(config_bucket.arn, config_role.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": args[0]
                    }, {
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"{args[0]}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Config Recorder
        config_recorder = aws.cfg.Recorder(
            f"config-recorder-{self.environment_suffix}",
            name=f"config-recorder-{self.environment_suffix}",
            role_arn=config_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True
            ),
            opts=pulumi.ResourceOptions(parent=self, depends_on=[config_policy_attachment])
        )

        # Create Config Delivery Channel
        delivery_channel = aws.cfg.DeliveryChannel(
            f"config-delivery-channel-{self.environment_suffix}",
            name=f"config-delivery-{self.environment_suffix}",
            s3_bucket_name=config_bucket.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[config_bucket_policy])
        )

        # Start Config Recorder
        recorder_status = aws.cfg.RecorderStatus(
            f"config-recorder-status-{self.environment_suffix}",
            name=config_recorder.name,
            is_enabled=True,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[delivery_channel])
        )

    def _create_vpc_endpoints(self):
        """Create VPC Endpoints for cost optimization"""
        # Get current region dynamically
        current_region = aws.get_region()
        region_name = current_region.name

        # S3 VPC Endpoint for Blue VPC
        blue_s3_endpoint = aws.ec2.VpcEndpoint(
            f"blue-s3-endpoint-{self.environment_suffix}",
            vpc_id=self.blue_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[],
            tags={"Name": f"blue-s3-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # S3 VPC Endpoint for Green VPC
        green_s3_endpoint = aws.ec2.VpcEndpoint(
            f"green-s3-endpoint-{self.environment_suffix}",
            vpc_id=self.green_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[],
            tags={"Name": f"green-s3-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # DynamoDB VPC Endpoint for Blue VPC
        blue_dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"blue-dynamodb-endpoint-{self.environment_suffix}",
            vpc_id=self.blue_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[],
            tags={"Name": f"blue-dynamodb-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # DynamoDB VPC Endpoint for Green VPC
        green_dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"green-dynamodb-endpoint-{self.environment_suffix}",
            vpc_id=self.green_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[],
            tags={"Name": f"green-dynamodb-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Secrets Manager VPC Endpoint for Blue VPC
        blue_secrets_endpoint = aws.ec2.VpcEndpoint(
            f"blue-secrets-endpoint-{self.environment_suffix}",
            vpc_id=self.blue_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.secretsmanager",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in self.blue_vpc["private_subnets"]],
            security_group_ids=[self.lambda_security_group_blue.id],
            private_dns_enabled=True,
            tags={"Name": f"blue-secrets-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Secrets Manager VPC Endpoint for Green VPC
        green_secrets_endpoint = aws.ec2.VpcEndpoint(
            f"green-secrets-endpoint-{self.environment_suffix}",
            vpc_id=self.green_vpc["vpc"].id,
            service_name=f"com.amazonaws.{region_name}.secretsmanager",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in self.green_vpc["private_subnets"]],
            security_group_ids=[self.lambda_security_group_green.id],
            private_dns_enabled=True,
            tags={"Name": f"green-secrets-endpoint-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
