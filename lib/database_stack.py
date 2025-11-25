"""Database infrastructure for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json
import random
import string


class DatabaseStack(Construct):
    """Database stack with Aurora PostgreSQL Serverless v2"""

    # pylint: disable=redefined-builtin,too-many-arguments
    def __init__(self, scope: Construct, id: str, vpc_id: str, private_subnet_ids: list,
                 environment_suffix: str):
        super().__init__(scope, id)

        # Generate random password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))

        # Database Security Group
        self.db_sg = SecurityGroup(self, 'db_sg',
            name=f'bluegreen-db-sg-{environment_suffix}',
            description='Security group for RDS Aurora cluster',
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow PostgreSQL from VPC'
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound'
                )
            ],
            tags={'Name': f'bluegreen-db-sg-{environment_suffix}'}
        )

        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(self, 'db_subnet_group',
            name=f'bluegreen-db-subnet-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            tags={'Name': f'bluegreen-db-subnet-{environment_suffix}'}
        )

        # Secrets Manager for DB credentials
        self.db_secret = SecretsmanagerSecret(self, 'db_secret',
            name=f'bluegreen-db-credentials-{environment_suffix}',
            description='Database credentials for Blue-Green deployment',
            tags={'Name': f'bluegreen-db-credentials-{environment_suffix}'}
        )

        secret_value = {
            'username': 'dbadmin',
            'password': password,
            'engine': 'postgres',
            'host': '',  # Will be updated after cluster creation
            'port': 5432,
            'dbname': 'appdb'
        }

        SecretsmanagerSecretVersion(self, 'db_secret_version',
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value)
        )

        # RDS Aurora Cluster
        self.rds_cluster = RdsCluster(self, 'rds_cluster',
            cluster_identifier=f'bluegreen-cluster-{environment_suffix}',
            engine='aurora-postgresql',
            engine_mode='provisioned',
            engine_version='15.4',
            database_name='appdb',
            master_username='dbadmin',
            master_password=password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            serverlessv2_scaling_configuration={
                'min_capacity': 0.5,
                'max_capacity': 1.0
            },
            skip_final_snapshot=True,
            tags={'Name': f'bluegreen-cluster-{environment_suffix}'}
        )

        # Cluster Instance
        RdsClusterInstance(self, 'rds_instance',
            identifier=f'bluegreen-instance-{environment_suffix}',
            cluster_identifier=self.rds_cluster.id,
            instance_class='db.serverless',
            engine='aurora-postgresql',
            engine_version='15.4',
            tags={'Name': f'bluegreen-instance-{environment_suffix}'}
        )

    @property
    def cluster_endpoint(self):
        return self.rds_cluster.endpoint

    @property
    def secret_arn(self):
        return self.db_secret.arn
