"""
database.py

RDS PostgreSQL database infrastructure with Secrets Manager integration.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional
import json
from .config import get_default_egress_rules


class DatabaseStack(pulumi.ComponentResource):
    """
    Creates RDS PostgreSQL database with environment-specific configuration.
    """

    def __init__(
        self,
        name: str,
        *,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        instance_class: str,
        enable_encryption: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        # Create KMS key if encryption is enabled
        self.kms_key = None
        if enable_encryption:
            self.kms_key = aws.kms.Key(
                f'db-kms-key-{environment_suffix}',
                description=f'KMS key for RDS encryption - {environment_suffix}',
                deletion_window_in_days=10,
                tags={**tags, 'Name': f'db-kms-key-{environment_suffix}'},
                opts=ResourceOptions(parent=self)
            )

            aws.kms.Alias(
                f'db-kms-alias-{environment_suffix}',
                name=f'alias/rds-{environment_suffix}',
                target_key_id=self.kms_key.id,
                opts=ResourceOptions(parent=self)
            )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            tags={**tags, 'Name': f'db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS
        self.db_security_group = aws.ec2.SecurityGroup(
            f'db-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for RDS PostgreSQL - {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=['10.0.0.0/8']  # Allow from VPC
                )
            ],
            egress=get_default_egress_rules(),
            tags={**tags, 'Name': f'db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Generate database credentials
        db_username = 'paymentadmin'
        db_password = aws.secretsmanager.Secret(
            f'db-password-{environment_suffix}',
            description=f'RDS PostgreSQL password - {environment_suffix}',
            tags={**tags, 'Name': f'db-password-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        db_password_version = aws.secretsmanager.SecretVersion(
            f'db-password-version-{environment_suffix}',
            secret_id=db_password.id,
            secret_string=pulumi.Output.secret('PaymentDB2024!Change'),
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        self.db_instance = aws.rds.Instance(
            f'db-instance-{environment_suffix}',
            identifier=f'payment-db-{environment_suffix}',
            engine='postgres',
            engine_version='16.3',
            instance_class=instance_class,
            allocated_storage=20,
            storage_type='gp2',
            storage_encrypted=enable_encryption,
            kms_key_id=self.kms_key.arn if enable_encryption else None,
            db_name='paymentdb',
            username=db_username,
            password=db_password_version.secret_string,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            skip_final_snapshot=True,
            backup_retention_period=1,
            multi_az=False,  # Single AZ for cost optimization
            publicly_accessible=False,
            tags={**tags, 'Name': f'db-instance-{environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[db_password_version])
        )

        # Store connection details in Secrets Manager
        connection_string = pulumi.Output.all(
            self.db_instance.endpoint,
            self.db_instance.db_name,
            db_username
        ).apply(lambda args: json.dumps({
            'host': args[0].split(':')[0],
            'port': 5432,
            'database': args[1],
            'username': args[2],
            'password': 'PaymentDB2024!Change'
        }))

        self.db_secret = aws.secretsmanager.Secret(
            f'db-connection-{environment_suffix}',
            description=f'RDS PostgreSQL connection details - {environment_suffix}',
            tags={**tags, 'Name': f'db-connection-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        aws.secretsmanager.SecretVersion(
            f'db-connection-version-{environment_suffix}',
            secret_id=self.db_secret.id,
            secret_string=connection_string,
            opts=ResourceOptions(parent=self, depends_on=[self.db_instance])
        )

        # Expose outputs
        self.db_endpoint = self.db_instance.endpoint
        self.db_secret_arn = self.db_secret.arn

        self.register_outputs({
            'db_endpoint': self.db_endpoint,
            'db_secret_arn': self.db_secret_arn
        })
