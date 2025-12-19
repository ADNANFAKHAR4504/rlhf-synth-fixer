"""
Payment Infrastructure Component
Defines the reusable multi-environment payment processing infrastructure.
"""
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Optional, Dict, Any
import json


class PaymentInfrastructureArgs:
    """Arguments for the PaymentInfrastructure component."""
    
    def __init__(
        self,
        environment: str,
        vpc_cidr: str,
        rds_instance_count: int,
        rds_instance_class: str,
        rds_backup_retention: int,
        lambda_memory_size: int,
        dynamodb_billing_mode: str,
        dynamodb_read_capacity: Optional[int] = None,
        dynamodb_write_capacity: Optional[int] = None,
        enable_cloudwatch_alarms: bool = False,
        cloudwatch_cpu_threshold: float = 80,
        use_nat_gateway: bool = False,
        enable_pitr: bool = False,
        enable_s3_lifecycle: bool = False,
    ):
        self.environment = environment
        self.vpc_cidr = vpc_cidr
        self.rds_instance_count = rds_instance_count
        self.rds_instance_class = rds_instance_class
        self.rds_backup_retention = rds_backup_retention
        self.lambda_memory_size = lambda_memory_size
        self.dynamodb_billing_mode = dynamodb_billing_mode
        self.dynamodb_read_capacity = dynamodb_read_capacity
        self.dynamodb_write_capacity = dynamodb_write_capacity
        self.enable_cloudwatch_alarms = enable_cloudwatch_alarms
        self.cloudwatch_cpu_threshold = cloudwatch_cpu_threshold
        self.use_nat_gateway = use_nat_gateway
        self.enable_pitr = enable_pitr
        self.enable_s3_lifecycle = enable_s3_lifecycle


class PaymentInfrastructure(ComponentResource):
    """
    Multi-environment payment processing infrastructure component.
    Creates all necessary AWS resources for payment processing across environments.
    """
    
    def __init__(
        self,
        name: str,
        args: PaymentInfrastructureArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("payment:infrastructure:PaymentInfrastructure", name, None, opts)
        
        self.args = args
        self.environment_suffix = args.environment
        self.environment_suffix_lower = args.environment.lower()
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": args.environment,
            "Team": "fintech-payments",
            "CostCenter": "payment-processing",
            "Project": "multi-env-infrastructure",
        }
        
        # Create VPC and networking
        self._create_vpc()
        
        # Create security groups
        self._create_security_groups()
        
        # Create RDS Aurora cluster
        self._create_rds_cluster()
        
        # Create Lambda functions
        self._create_lambda_functions()
        
        # Create DynamoDB tables
        self._create_dynamodb_tables()
        
        # Create S3 buckets
        self._create_s3_buckets()
        
        # Create CloudWatch alarms if enabled
        if args.enable_cloudwatch_alarms:
            self._create_cloudwatch_alarms()
        
        # Register outputs
        self.register_outputs({})
    
    def _create_vpc(self):
        """Create VPC with public and private subnets across 3 AZs."""
        # Get available AZs
        azs = aws.get_availability_zones()
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{self.environment_suffix}",
            cidr_block=self.args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"payment-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"payment-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Create public and private subnets
        self.public_subnets = []
        self.private_subnets = []
        
        # Define subnet CIDR blocks (properly aligned)
        public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        private_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
        
        # Adjust for environment-specific VPC CIDR
        base_octets = self.args.vpc_cidr.split('/')[0].split('.')
        base_network = f"{base_octets[0]}.{base_octets[1]}"
        
        for i in range(3):  # 3 AZs
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_network}.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"payment-public-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_network}.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"payment-private-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)
        
        # Create NAT Gateway or NAT Instance based on environment
        if self.args.use_nat_gateway:
            # Elastic IP for NAT Gateway
            self.nat_eip = aws.ec2.Eip(
                f"payment-nat-eip-{self.environment_suffix}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"payment-nat-eip-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            
            # NAT Gateway
            self.nat_gateway = aws.ec2.NatGateway(
                f"payment-nat-gateway-{self.environment_suffix}",
                allocation_id=self.nat_eip.id,
                subnet_id=self.public_subnets[0].id,
                tags={**self.common_tags, "Name": f"payment-nat-gateway-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
        else:
            # NAT Instance (cost-optimized for dev)
            self.nat_instance = aws.ec2.Instance(
                f"payment-nat-instance-{self.environment_suffix}",
                ami="ami-00a9d4a05375b2763",  # NAT AMI
                instance_type="t3.micro",
                subnet_id=self.public_subnets[0].id,
                security_groups=[],  # Will be set after security group creation
                source_dest_check=False,
                tags={**self.common_tags, "Name": f"payment-nat-instance-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
        
        # Create route tables
        self.public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={**self.common_tags, "Name": f"payment-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Private route table  
        route_args = {
            "cidr_block": "0.0.0.0/0"
        }
        if self.args.use_nat_gateway:
            route_args["nat_gateway_id"] = self.nat_gateway.id
        else:
            route_args["network_interface_id"] = self.nat_instance.primary_network_interface_id
        
        self.private_route_table = aws.ec2.RouteTable(
            f"payment-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(**route_args)],
            tags={**self.common_tags, "Name": f"payment-private-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )
    
    def _create_security_groups(self):
        """Create security groups for different components."""
        # RDS security group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"payment-rds-sg-{self.environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[],  # Will be updated after Lambda SG creation
                )
            ],
            tags={**self.common_tags, "Name": f"payment-rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda security group
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"payment-lambda-sg-{self.environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.common_tags, "Name": f"payment-lambda-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_rds_cluster(self):
        """Create RDS Aurora PostgreSQL cluster."""
        # DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{self.environment_suffix_lower}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.common_tags, "Name": f"payment-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Aurora cluster
        self.rds_cluster = aws.rds.Cluster(
            f"payment-aurora-cluster-{self.environment_suffix_lower}",
            engine="aurora-postgresql",
            engine_version="13.21",
            database_name="payments",
            master_username="paymentuser",
            master_password="ChangeMe123!",  # In production, use AWS Secrets Manager
            backup_retention_period=self.args.rds_backup_retention,
            preferred_backup_window="07:00-09:00",
            preferred_maintenance_window="sun:05:00-sun:06:00",
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            skip_final_snapshot=True,  # For easier cleanup
            tags={**self.common_tags, "Name": f"payment-aurora-cluster-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Aurora cluster instances
        self.rds_instances = []
        for i in range(self.args.rds_instance_count):
            instance = aws.rds.ClusterInstance(
                f"payment-aurora-instance-{i}-{self.environment_suffix_lower}",
                identifier=f"payment-aurora-instance-{i}-{self.environment_suffix_lower}",
                cluster_identifier=self.rds_cluster.id,
                instance_class=self.args.rds_instance_class,
                engine=self.rds_cluster.engine,
                engine_version=self.rds_cluster.engine_version,
                tags={**self.common_tags, "Name": f"payment-aurora-instance-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.rds_instances.append(instance)
    
    def _create_lambda_functions(self):
        """Create Lambda functions for payment processing."""
        # IAM role for Lambda
        lambda_role = aws.iam.Role(
            f"payment-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com",
                        },
                    }
                ],
            }),
            tags={**self.common_tags, "Name": f"payment-lambda-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"payment-lambda-basic-execution-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        # Create Lambda layer for common dependencies
        lambda_layer = aws.lambda_.LayerVersion(
            f"payment-common-layer-{self.environment_suffix}",
            layer_name=f"payment-common-{self.environment_suffix}",
            compatible_runtimes=["python3.9"],
            code=pulumi.AssetArchive({
                "python": pulumi.FileArchive("./lib/lambda_layer")
            }),
            opts=ResourceOptions(parent=self)
        )
        
        # Payment processor Lambda
        self.payment_processor_lambda = aws.lambda_.Function(
            f"payment-processor-{self.environment_suffix}",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda_functions/payment_processor")
            }),
            handler="main.handler",
            role=lambda_role.arn,
            memory_size=self.args.lambda_memory_size,
            timeout=30,
            layers=[lambda_layer.arn],
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id],
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.args.environment,
                    "RDS_ENDPOINT": self.rds_cluster.endpoint,
                    "DYNAMODB_TABLE": f"payment-transactions-{self.environment_suffix}",
                }
            ),
            tags={**self.common_tags, "Name": f"payment-processor-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Transaction validator Lambda
        self.transaction_validator_lambda = aws.lambda_.Function(
            f"transaction-validator-{self.environment_suffix}",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda_functions/transaction_validator")
            }),
            handler="main.handler",
            role=lambda_role.arn,
            memory_size=self.args.lambda_memory_size,
            timeout=15,
            layers=[lambda_layer.arn],
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id],
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.args.environment,
                    "RDS_ENDPOINT": self.rds_cluster.endpoint,
                    "DYNAMODB_TABLE": f"payment-transactions-{self.environment_suffix}",
                }
            ),
            tags={**self.common_tags, "Name": f"transaction-validator-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
    
    def _create_dynamodb_tables(self):
        """Create DynamoDB tables for transaction logs."""
        # Configure billing mode and capacity
        billing_mode_args = {"billing_mode": self.args.dynamodb_billing_mode}
        
        if self.args.dynamodb_billing_mode == "PROVISIONED":
            billing_mode_args.update({
                "read_capacity": self.args.dynamodb_read_capacity,
                "write_capacity": self.args.dynamodb_write_capacity,
            })
        
        # Transactions table
        self.transactions_table = aws.dynamodb.Table(
            f"payment-transactions-{self.environment_suffix}",
            **billing_mode_args,
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="S"),
                aws.dynamodb.TableAttributeArgs(name="user_id", type="S"),
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="UserIndex",
                    hash_key="user_id",
                    range_key="timestamp",
                    projection_type="ALL",
                    **billing_mode_args if self.args.dynamodb_billing_mode == "PROVISIONED" else {}
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.args.enable_pitr
            ),
            tags={**self.common_tags, "Name": f"payment-transactions-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Audit logs table
        self.audit_logs_table = aws.dynamodb.Table(
            f"payment-audit-logs-{self.environment_suffix}",
            **billing_mode_args,
            hash_key="log_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="log_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="S"),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.args.enable_pitr
            ),
            tags={**self.common_tags, "Name": f"payment-audit-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Configure auto-scaling for production
        if self.args.dynamodb_billing_mode == "PROVISIONED" and self.args.environment == "prod":
            # Auto-scaling for transactions table
            aws.appautoscaling.Target(
                f"transactions-read-target-{self.environment_suffix}",
                max_capacity=100,
                min_capacity=5,
                resource_id=pulumi.Output.concat("table/", self.transactions_table.name),
                scalable_dimension="dynamodb:table:ReadCapacityUnits",
                service_namespace="dynamodb",
                opts=ResourceOptions(parent=self)
            )
            
            aws.appautoscaling.Target(
                f"transactions-write-target-{self.environment_suffix}",
                max_capacity=100,
                min_capacity=5,
                resource_id=pulumi.Output.concat("table/", self.transactions_table.name),
                scalable_dimension="dynamodb:table:WriteCapacityUnits",
                service_namespace="dynamodb",
                opts=ResourceOptions(parent=self)
            )
    
    def _create_s3_buckets(self):
        """Create S3 buckets for audit storage."""
        # Audit storage bucket
        self.audit_storage_bucket = aws.s3.Bucket(
            f"fintech-payment-{self.args.environment}-audit",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={**self.common_tags, "Name": f"fintech-payment-{self.args.environment}-audit"},
            opts=ResourceOptions(parent=self)
        )
        
        # Transaction data bucket
        self.transaction_data_bucket = aws.s3.Bucket(
            f"fintech-payment-{self.args.environment}-data",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={**self.common_tags, "Name": f"fintech-payment-{self.args.environment}-data"},
            opts=ResourceOptions(parent=self)
        )
        
        # S3 lifecycle policy for production
        if self.args.enable_s3_lifecycle:
            aws.s3.BucketLifecycleConfiguration(
                f"audit-lifecycle-{self.environment_suffix}",
                bucket=self.audit_storage_bucket.id,
                rules=[
                    aws.s3.BucketLifecycleConfigurationRuleArgs(
                        id="transition-to-glacier",
                        status="Enabled",
                        transitions=[
                            aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                                days=90,
                                storage_class="GLACIER"
                            )
                        ]
                    )
                ],
                opts=ResourceOptions(parent=self)
            )
    
    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for RDS monitoring."""
        for i, instance in enumerate(self.rds_instances):
            aws.cloudwatch.MetricAlarm(
                f"rds-cpu-alarm-{i}-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods="2",
                metric_name="CPUUtilization",
                namespace="AWS/RDS",
                period="120",
                statistic="Average",
                threshold=self.args.cloudwatch_cpu_threshold,
                alarm_description=f"RDS CPU utilization alarm for instance {i}",
                dimensions={
                    "DBInstanceIdentifier": instance.identifier,
                },
                tags={**self.common_tags, "Name": f"rds-cpu-alarm-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
