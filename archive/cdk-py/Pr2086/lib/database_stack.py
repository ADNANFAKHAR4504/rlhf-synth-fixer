"""Database Stack with RDS MySQL Multi-AZ deployment."""

from aws_cdk import CfnOutput, Duration, NestedStack, RemovalPolicy
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_rds as rds
from aws_cdk import aws_secretsmanager as secretsmanager
from constructs import Construct


class DatabaseStack(NestedStack):
    """Creates RDS MySQL database with Multi-AZ deployment."""
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        db_security_group: ec2.SecurityGroup,
        environment_suffix: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.db_security_group = db_security_group
        self.environment_suffix = environment_suffix
        
        # Create database
        self._create_database()
    
    def _create_database(self):
        """Create RDS MySQL database with Multi-AZ deployment."""
        
        # Create database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self, "prod-db-secret-primary-1",
            description="Database credentials for production web application",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters='"@/\\',
                password_length=32,
            ),
        )
        
        # Create subnet group
        subnet_group = rds.SubnetGroup(
            self, "prod-db-subnet-group-primary-1",
            description="Subnet group for production database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )
        
        # Create parameter group for optimization
        parameter_group = rds.ParameterGroup(
            self, "prod-db-params-primary-1",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_39
            ),
            description="Parameter group for production MySQL database",
            parameters={
                "innodb_buffer_pool_size": "134217728",  # Optimized for t3.micro
                "max_connections": "100",
            },
        )
        
        # Create RDS instance
        self.database = rds.DatabaseInstance(
            self, "prod-database-primary-1",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_39
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            credentials=rds.Credentials.from_secret(self.db_secret),
            database_name="prodwebapp",
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.db_security_group],
            parameter_group=parameter_group,
            multi_az=True,  # High availability
            allocated_storage=20,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,  # Encryption at rest
            backup_retention=Duration.days(7),
            deletion_protection=False,  # Allow deletion for testing
            delete_automated_backups=False,
            enable_performance_insights=False,  # Performance Insights not supported for t3.micro
            monitoring_interval=Duration.seconds(60),
            auto_minor_version_upgrade=True,
            removal_policy=RemovalPolicy.DESTROY,  # Allow deletion for testing
        )
        
        # Output database information
        CfnOutput(self, "DatabaseEndpoint", value=self.database.instance_endpoint.hostname)
        CfnOutput(self, "DatabaseSecretArn", value=self.db_secret.secret_arn)