"""
database_stack.py

RDS MySQL database with environment-specific configuration.
Single-AZ for dev/staging, Multi-AZ for production with automated backups.
"""

from typing import List

import pulumi
from pulumi import Config, Output, ResourceOptions
import pulumi_aws as aws


class DatabaseStack(pulumi.ComponentResource):
    """
    Database infrastructure component.

    Creates RDS MySQL with environment-specific configuration:
    - Single-AZ for dev and staging
    - Multi-AZ for production with automated backups
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        app_security_group_id: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        config = Config()

        # Environment-specific configuration
        db_config = {
            'dev': {
                'instance_class': 'db.t3.micro',
                'allocated_storage': 20,
                'multi_az': False,
                'backup_retention': 1,
            },
            'staging': {
                'instance_class': 'db.t3.small',
                'allocated_storage': 50,
                'multi_az': False,
                'backup_retention': 3,
            },
            'prod': {
                'instance_class': 'db.t3.medium',
                'allocated_storage': 100,
                'multi_az': True,
                'backup_retention': 7,
            }
        }
        db_settings = db_config.get(environment_suffix, db_config['dev'])

        # Get database credentials from config (or use defaults for testing)
        db_username = config.get('dbUsername') or 'admin'
        db_password = config.get_secret('dbPassword') or pulumi.Output.secret('TempPassword123!')

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{environment_suffix}',
            name=f'db-subnet-group-{environment_suffix}',
            subnet_ids=private_subnet_ids,
            description=f'DB subnet group for {environment_suffix}',
            tags={**tags, 'Name': f'db-subnet-group-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create security group for RDS
        self.db_sg = aws.ec2.SecurityGroup(
            f'db-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for RDS in {environment_suffix}',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description='Allow MySQL from application instances',
                    from_port=3306,
                    to_port=3306,
                    protocol='tcp',
                    security_groups=[app_security_group_id],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description='Allow all outbound traffic',
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                ),
            ],
            tags={**tags, 'Name': f'db-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create parameter group
        self.db_parameter_group = aws.rds.ParameterGroup(
            f'db-params-{environment_suffix}',
            name=f'db-params-{environment_suffix}',
            family='mysql8.0',
            description=f'Custom parameter group for {environment_suffix}',
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name='max_connections',
                    value='100' if environment_suffix == 'prod' else '50',
                ),
            ],
            tags={**tags, 'Name': f'db-params-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        self.db_instance = aws.rds.Instance(
            f'db-{environment_suffix}',
            identifier=f'db-{environment_suffix}',
            engine='mysql',
            engine_version='8.0',
            instance_class=db_settings['instance_class'],
            allocated_storage=db_settings['allocated_storage'],
            storage_type='gp3',
            storage_encrypted=True,
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_sg.id],
            parameter_group_name=self.db_parameter_group.name,
            multi_az=db_settings['multi_az'],
            backup_retention_period=db_settings['backup_retention'],
            backup_window='03:00-04:00',
            maintenance_window='mon:04:00-mon:05:00',
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            enabled_cloudwatch_logs_exports=['error', 'general', 'slowquery'],
            tags={**tags, 'Name': f'db-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.db_instance_id = self.db_instance.id
        self.db_endpoint = self.db_instance.endpoint
        self.db_address = self.db_instance.address
        self.db_port = self.db_instance.port
        self.db_name = self.db_instance.db_name

        self.register_outputs({
            'db_instance_id': self.db_instance_id,
            'db_endpoint': self.db_endpoint,
            'db_address': self.db_address,
            'db_port': self.db_port,
        })
