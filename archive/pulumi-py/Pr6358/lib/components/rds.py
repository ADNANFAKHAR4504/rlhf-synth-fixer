"""
RDS Component - Creates RDS MySQL instance with Secrets Manager password
"""

import pulumi
import pulumi_aws as aws
import json
import random
import string
from pulumi import ComponentResource, ResourceOptions


class RdsComponent(ComponentResource):
    """
    Reusable RDS component with MySQL and Secrets Manager integration
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        environment: str,
        environment_suffix: str,
        instance_class: str,
        multi_az: bool,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:rds:RdsComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Generate random password
        password = "".join(
            random.choices(string.ascii_letters + string.digits, k=16)
        )

        # Create secret in Secrets Manager
        self.secret = aws.secretsmanager.Secret(
            f"rds-password-{environment}-{environment_suffix}",
            description=f"RDS MySQL password for {environment}",
            tags={**tags, "Name": f"rds-password-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for RDS in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow MySQL from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"rds-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"rds-subnet-group-{environment}-{environment_suffix}",
            subnet_ids=subnet_ids,
            tags={
                **tags,
                "Name": f"rds-subnet-group-{environment}-{environment_suffix}",
            },
            opts=child_opts,
        )

        # Create RDS instance
        self.rds_instance = aws.rds.Instance(
            f"rds-{environment}-{environment_suffix}",
            identifier=f"rds-{environment}-{environment_suffix}",
            engine="mysql",
            engine_version="8.0",
            instance_class=instance_class,
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp3",
            db_name=f"appdb_{environment}",
            username="admin",
            password=password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            multi_az=multi_az,
            skip_final_snapshot=True,
            backup_retention_period=7,
            enabled_cloudwatch_logs_exports=["error", "general", "slowquery"],
            tags={**tags, "Name": f"rds-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Store password in secret with actual endpoint after RDS is created
        self.secret_version = self.rds_instance.endpoint.apply(
            lambda endpoint: aws.secretsmanager.SecretVersion(
                f"rds-password-version-{environment}-{environment_suffix}",
                secret_id=self.secret.id,
                secret_string=json.dumps(
                    {
                        "username": "admin",
                        "password": password,
                        "engine": "mysql",
                        "host": endpoint.split(":")[0] if endpoint else "localhost",
                        "port": 3306,
                        "dbname": f"appdb_{environment}",
                    }
                ),
                opts=ResourceOptions(parent=self, depends_on=[self.rds_instance]),
            )
        )

        # Register outputs
        self.rds_endpoint = self.rds_instance.endpoint
        self.rds_arn = self.rds_instance.arn
        self.secret_arn = self.secret.arn
        self.security_group_id = self.rds_sg.id

        self.register_outputs(
            {
                "rds_endpoint": self.rds_endpoint,
                "rds_arn": self.rds_arn,
                "secret_arn": self.secret_arn,
                "security_group_id": self.security_group_id,
            }
        )
