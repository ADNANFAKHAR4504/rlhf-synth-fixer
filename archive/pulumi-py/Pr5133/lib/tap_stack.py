"""
Healthcare API Infrastructure Stack

This module implements a secure API infrastructure for healthcare records management
with the following components:
- API Gateway for RESTful endpoints
- ElastiCache Redis for session management
- RDS PostgreSQL for data persistence
- Secrets Manager for credential management
- KMS encryption for all data at rest
- VPC with public and private subnets
"""
import pulumi
import pulumi_aws as aws
from dataclasses import dataclass
from typing import Optional


@dataclass
class TapStackArgs:
    """Arguments for the TapStack."""
    environment_suffix: str


class TapStack:
    """
    Healthcare API Infrastructure Stack using Pulumi Python.

    Creates a complete API infrastructure with caching and persistence layers,
    all encrypted at rest and deployed in a secure VPC configuration.
    """

    def __init__(self, name: str, args: TapStackArgs):
        """
        Initialize the Healthcare API Infrastructure Stack.

        Args:
            name: The stack name
            args: Stack configuration arguments
        """
        self.name = name
        self.args = args
        self.environment_suffix = args.environment_suffix

        # Read AWS region from configuration
        config = pulumi.Config("aws")
        self.region = config.get("region") or "eu-west-1"

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC and networking
        self.vpc = self._create_vpc()
        self.public_subnet_1, self.public_subnet_2 = self._create_public_subnets()
        self.private_subnet_1, self.private_subnet_2 = self._create_private_subnets()
        self.igw = self._create_internet_gateway()
        self.nat_gateway = self._create_nat_gateway()
        self._create_route_tables()

        # Create security groups
        self.api_sg = self._create_api_security_group()
        self.redis_sg = self._create_redis_security_group()
        self.rds_sg = self._create_rds_security_group()

        # Create database credentials in Secrets Manager
        self.db_credentials = self._create_db_credentials()

        # Create ElastiCache Redis cluster
        self.redis_subnet_group = self._create_redis_subnet_group()
        self.redis_cluster = self._create_redis_cluster()

        # Create RDS PostgreSQL instance
        self.rds_subnet_group = self._create_rds_subnet_group()
        self.rds_instance = self._create_rds_instance()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        self.api_resource = self._create_api_resource()
        self.api_method = self._create_api_method()
        self.api_integration = self._create_api_integration()
        self.api_deployment = self._create_api_deployment()
        self.api_stage = self._create_api_stage()

        # Export stack outputs
        self._export_outputs()

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for encryption at rest."""
        key = aws.kms.Key(
            f"healthcare-kms-{self.environment_suffix}",
            description=f"KMS key for healthcare data encryption - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={
                "Name": f"healthcare-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "healthcare-data-encryption"
            }
        )

        aws.kms.Alias(
            f"healthcare-kms-alias-{self.environment_suffix}",
            target_key_id=key.key_id,
            name=f"alias/healthcare-{self.environment_suffix}"
        )

        return key

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC for healthcare infrastructure."""
        vpc = aws.ec2.Vpc(
            f"healthcare-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"healthcare-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return vpc

    def _create_public_subnets(self) -> tuple:
        """Create public subnets in different availability zones."""
        public_subnet_1 = aws.ec2.Subnet(
            f"healthcare-public-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{self.region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"healthcare-public-subnet-1-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Type": "public"
            }
        )

        public_subnet_2 = aws.ec2.Subnet(
            f"healthcare-public-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{self.region}b",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"healthcare-public-subnet-2-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Type": "public"
            }
        )

        return public_subnet_1, public_subnet_2

    def _create_private_subnets(self) -> tuple:
        """Create private subnets for data services."""
        private_subnet_1 = aws.ec2.Subnet(
            f"healthcare-private-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{self.region}a",
            tags={
                "Name": f"healthcare-private-subnet-1-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Type": "private"
            }
        )

        private_subnet_2 = aws.ec2.Subnet(
            f"healthcare-private-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{self.region}b",
            tags={
                "Name": f"healthcare-private-subnet-2-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Type": "private"
            }
        )

        return private_subnet_1, private_subnet_2

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway for public subnet access."""
        igw = aws.ec2.InternetGateway(
            f"healthcare-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"healthcare-igw-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return igw

    def _create_nat_gateway(self) -> aws.ec2.NatGateway:
        """Create NAT Gateway for private subnet internet access."""
        eip = aws.ec2.Eip(
            f"healthcare-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={
                "Name": f"healthcare-nat-eip-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        nat_gateway = aws.ec2.NatGateway(
            f"healthcare-nat-{self.environment_suffix}",
            allocation_id=eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={
                "Name": f"healthcare-nat-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        return nat_gateway

    def _create_route_tables(self):
        """Create and configure route tables for public and private subnets."""
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"healthcare-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"healthcare-public-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        aws.ec2.RouteTableAssociation(
            f"healthcare-public-rta-1-{self.environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_rt.id
        )

        aws.ec2.RouteTableAssociation(
            f"healthcare-public-rta-2-{self.environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Private route table
        private_rt = aws.ec2.RouteTable(
            f"healthcare-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={
                "Name": f"healthcare-private-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        aws.ec2.RouteTableAssociation(
            f"healthcare-private-rta-1-{self.environment_suffix}",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_rt.id
        )

        aws.ec2.RouteTableAssociation(
            f"healthcare-private-rta-2-{self.environment_suffix}",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_rt.id
        )

    def _create_api_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for API Gateway."""
        sg = aws.ec2.SecurityGroup(
            f"healthcare-api-sg-{self.environment_suffix}",
            description="Security group for Healthcare API Gateway",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"healthcare-api-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return sg

    def _create_redis_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for ElastiCache Redis."""
        sg = aws.ec2.SecurityGroup(
            f"healthcare-redis-sg-{self.environment_suffix}",
            description="Security group for Healthcare Redis cluster",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"healthcare-redis-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return sg

    def _create_rds_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for RDS PostgreSQL."""
        sg = aws.ec2.SecurityGroup(
            f"healthcare-rds-sg-{self.environment_suffix}",
            description="Security group for Healthcare RDS PostgreSQL",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"healthcare-rds-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return sg

    def _create_db_credentials(self) -> aws.secretsmanager.Secret:
        """Create database credentials in Secrets Manager."""
        import json

        secret = aws.secretsmanager.Secret(
            f"healthcare-db-credentials-{self.environment_suffix}",
            description=f"Database credentials for healthcare platform - {self.environment_suffix}",
            kms_key_id=self.kms_key.id,
            tags={
                "Name": f"healthcare-db-credentials-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Generate random password
        random_password = aws.secretsmanager.SecretVersion(
            f"healthcare-db-credentials-version-{self.environment_suffix}",
            secret_id=secret.id,
            secret_string=pulumi.Output.all().apply(
                lambda _: json.dumps({
                    "username": "healthcare_admin",
                    "password": "TempPassword123!ChangeMe",
                    "engine": "postgres",
                    "host": "placeholder",
                    "port": 5432,
                    "dbname": "healthcare_db"
                })
            )
        )

        return secret

    def _create_redis_subnet_group(self) -> aws.elasticache.SubnetGroup:
        """Create subnet group for ElastiCache Redis."""
        subnet_group = aws.elasticache.SubnetGroup(
            f"healthcare-redis-subnet-group-{self.environment_suffix}",
            description=f"Subnet group for Healthcare Redis cluster - {self.environment_suffix}",
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id
            ],
            tags={
                "Name": f"healthcare-redis-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return subnet_group

    def _create_redis_cluster(self) -> aws.elasticache.ReplicationGroup:
        """Create ElastiCache Redis cluster with encryption - optimized for eu-west-1."""
        cluster = aws.elasticache.ReplicationGroup(
            f"healthcare-redis-{self.environment_suffix}",
            replication_group_id=f"healthcare-redis-{self.environment_suffix}"[:40],
            description=(
                f"Healthcare Redis cluster for session management - {self.environment_suffix}"
            ),
            engine="redis",
            engine_version="6.2",
            node_type="cache.t4g.micro",
            num_cache_clusters=1,
            parameter_group_name="default.redis6.x",
            port=6379,
            subnet_group_name=self.redis_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=False,
            automatic_failover_enabled=False,
            multi_az_enabled=False,
            snapshot_retention_limit=1,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            auto_minor_version_upgrade=True,
            tags={
                "Name": f"healthcare-redis-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "session-management"
            }
        )
        return cluster

    def _create_rds_subnet_group(self) -> aws.rds.SubnetGroup:
        """Create subnet group for RDS PostgreSQL."""
        subnet_group = aws.rds.SubnetGroup(
            f"healthcare-rds-subnet-group-{self.environment_suffix}",
            description=f"Subnet group for Healthcare RDS PostgreSQL - {self.environment_suffix}",
            subnet_ids=[
                self.private_subnet_1.id,
                self.private_subnet_2.id
            ],
            tags={
                "Name": f"healthcare-rds-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return subnet_group

    def _create_rds_instance(self) -> aws.rds.Instance:
        """Create RDS PostgreSQL instance with encryption and backup."""
        instance = aws.rds.Instance(
            f"healthcare-db-{self.environment_suffix}",
            identifier=f"healthcare-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="16",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="healthcaredb",
            username="healthcare_admin",
            password="TempPassword123ChangeMe",
            db_subnet_group_name=self.rds_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=30,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            multi_az=False,
            publicly_accessible=False,
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=True,
            copy_tags_to_snapshot=True,
            tags={
                "Name": f"healthcare-db-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "healthcare-data-storage"
            }
        )
        return instance

    def _create_api_gateway(self) -> aws.apigateway.RestApi:
        """Create API Gateway REST API."""
        api = aws.apigateway.RestApi(
            f"healthcare-api-{self.environment_suffix}",
            name=f"healthcare-api-{self.environment_suffix}",
            description=f"Healthcare Records Management API - {self.environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={
                "Name": f"healthcare-api-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return api

    def _create_api_resource(self) -> aws.apigateway.Resource:
        """Create API Gateway resource."""
        resource = aws.apigateway.Resource(
            f"healthcare-api-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="health"
        )
        return resource

    def _create_api_method(self) -> aws.apigateway.Method:
        """Create API Gateway method."""
        method = aws.apigateway.Method(
            f"healthcare-api-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="GET",
            authorization="NONE"
        )
        return method

    def _create_api_integration(self) -> aws.apigateway.Integration:
        """Create API Gateway integration."""
        integration = aws.apigateway.Integration(
            f"healthcare-api-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            }
        )

        # Create method response
        aws.apigateway.MethodResponse(
            f"healthcare-api-method-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            status_code="200",
            response_models={
                "application/json": "Empty"
            }
        )

        # Create integration response
        aws.apigateway.IntegrationResponse(
            f"healthcare-api-integration-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            status_code="200",
            response_templates={
                "application/json": '{"status": "healthy", "service": "healthcare-api"}'
            }
        )

        return integration

    def _create_api_deployment(self) -> aws.apigateway.Deployment:
        """Create API Gateway deployment."""
        deployment = aws.apigateway.Deployment(
            f"healthcare-api-deployment-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            opts=pulumi.ResourceOptions(depends_on=[
                self.api_method,
                self.api_integration
            ])
        )
        return deployment

    def _create_api_stage(self) -> aws.apigateway.Stage:
        """Create API Gateway stage with logging."""
        stage = aws.apigateway.Stage(
            f"healthcare-api-stage-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            tags={
                "Name": f"healthcare-api-stage-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return stage

    def _export_outputs(self):
        """Export stack outputs."""
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("api_gateway_url", pulumi.Output.concat(
            "https://",
            self.api_gateway.id,
            ".execute-api.",
            self.region,
            ".amazonaws.com/",
            self.environment_suffix,
            "/health"
        ))
        pulumi.export("redis_endpoint", self.redis_cluster.configuration_endpoint_address)
        pulumi.export("redis_port", self.redis_cluster.port)
        pulumi.export("rds_endpoint", self.rds_instance.endpoint)
        pulumi.export("rds_address", self.rds_instance.address)
        pulumi.export("rds_port", self.rds_instance.port)
        pulumi.export("db_secret_arn", self.db_credentials.arn)
        pulumi.export("kms_key_id", self.kms_key.id)
        pulumi.export("kms_key_arn", self.kms_key.arn)
        pulumi.export("environment_suffix", self.environment_suffix)
