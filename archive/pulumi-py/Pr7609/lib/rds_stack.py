"""
rds_stack.py

RDS PostgreSQL instance for permanent transaction storage.
Configured with Multi-AZ, automated backups, and encryption.
"""

from typing import Optional, Dict, List
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import ec2, rds


class RdsStack(pulumi.ComponentResource):
    """
    RDS PostgreSQL stack for transaction storage.

    Creates:
    - RDS PostgreSQL instance with Multi-AZ
    - Security group with least privilege access
    - DB subnet group for private subnets
    - Automated backups
    - Encryption at rest
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        subnet_ids: List[Output[str]],
        db_secret_arn: Output[str],
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:rds:RdsStack', name, None, opts)

        resource_tags = tags or {}

        # Create security group for RDS
        self.security_group = ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            name=f"rds-sg-{environment_suffix}",
            description="Security group for RDS PostgreSQL instance",
            vpc_id=vpc_id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL from within VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **resource_tags,
                'Name': f"rds-sg-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group
        self.db_subnet_group = rds.SubnetGroup(
            f"rds-subnet-group-{environment_suffix}",
            name=f"rds-subnet-group-{environment_suffix}",
            description=f"Subnet group for RDS instance in {environment_suffix}",
            subnet_ids=subnet_ids,
            tags={
                **resource_tags,
                'Name': f"rds-subnet-group-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Import secret to get username and password
        from pulumi_aws import secretsmanager
        secret_value = secretsmanager.get_secret_version_output(
            secret_id=db_secret_arn
        )

        # Parse secret string to get credentials
        import json
        secret_data = secret_value.secret_string.apply(lambda s: json.loads(s))
        db_username = secret_data.apply(lambda d: d["username"])
        db_password = secret_data.apply(lambda d: d["password"])

        # Create RDS PostgreSQL instance
        self.db_instance = rds.Instance(
            f"postgres-{environment_suffix}",
            identifier=f"postgres-{environment_suffix}",
            engine="postgres",
            engine_version="15.15",
            instance_class="db.t3.micro",  # Small instance for cost optimization
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            db_name="transactions",
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.security_group.id],
            multi_az=True,
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            monitoring_interval=60,
            monitoring_role_arn=self._create_monitoring_role(environment_suffix, resource_tags),
            skip_final_snapshot=True,  # Allow clean deletion for testing
            deletion_protection=False,  # Allow deletion for testing
            tags={
                **resource_tags,
                'Name': f"postgres-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Export values
        self.instance_id = self.db_instance.id
        self.endpoint = self.db_instance.endpoint
        self.address = self.db_instance.address
        self.port = self.db_instance.port
        self.security_group_id = self.security_group.id

        self.register_outputs({
            'instance_id': self.instance_id,
            'endpoint': self.endpoint,
            'address': self.address,
            'port': self.port,
            'security_group_id': self.security_group_id
        })

    def _create_monitoring_role(self, environment_suffix: str, tags: Dict) -> Output[str]:
        """Create IAM role for RDS Enhanced Monitoring"""
        from pulumi_aws import iam

        # Create assume role policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "monitoring.rds.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        # Create IAM role
        monitoring_role = iam.Role(
            f"rds-monitoring-role-{environment_suffix}",
            name=f"rds-monitoring-role-{environment_suffix}",
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags={
                **tags,
                'Name': f"rds-monitoring-role-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for RDS Enhanced Monitoring
        iam.RolePolicyAttachment(
            f"rds-monitoring-policy-attachment-{environment_suffix}",
            role=monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(parent=self)
        )

        return monitoring_role.arn
