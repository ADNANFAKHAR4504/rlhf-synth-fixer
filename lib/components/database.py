# lib/components/database.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions

class DatabaseInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    vpc_id: pulumi.Input[str],
    private_subnet_ids: pulumi.Input[List[str]],
    vpc_security_group_id: pulumi.Input[str],
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('aws:components:DatabaseInfrastructure', name, None, opts)

    self.tags = tags

    # Create DB Subnet Group
    self.db_subnet_group = aws.rds.SubnetGroup(
      f"{name}-db-subnet-group",
      name=f"{name}-db-subnet-group",
      subnet_ids=private_subnet_ids,
      description="DB subnet group for RDS PostgreSQL instance",
      tags={
        **tags,
        "Name": f"{name}-db-subnet-group"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create RDS Security Group
    self.rds_security_group = aws.ec2.SecurityGroup(
      f"{name}-rds-sg",
      name=f"{name}-rds-sg",
      description="Security group for RDS PostgreSQL instance",
      vpc_id=vpc_id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 5432,
          "to_port": 5432,
          "security_groups": [vpc_security_group_id],
          "description": "PostgreSQL from VPC"
        }
      ],
      egress=[
        {
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "All outbound traffic"
        }
      ],
      tags={
        **tags,
        "Name": f"{name}-rds-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create RDS Parameter Group
    self.db_parameter_group = aws.rds.ParameterGroup(
      f"{name}-db-param-group",
      name=f"{name}-db-param-group",
      family="postgres15",
      description="Parameter group for PostgreSQL 15",
      parameters=[
        {
          "name": "shared_preload_libraries",
          "value": "pg_stat_statements"
        },
        {
          "name": "log_statement",
          "value": "all"
        },
        {
          "name": "log_min_duration_statement",
          "value": "1000"
        }
      ],
      tags={
        **tags,
        "Name": f"{name}-db-param-group"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create RDS Option Group
    self.db_option_group = aws.rds.OptionGroup(
      f"{name}-db-option-group",
      name=f"{name}-db-option-group",
      option_group_description="Option group for PostgreSQL",
      engine_name="postgres",
      major_engine_version="15",
      tags={
        **tags,
        "Name": f"{name}-db-option-group"
      },
      opts=ResourceOptions(parent=self)
    )

    # Generate random password for RDS
    self.db_password_random = random.RandomPassword(
      f"{name}-db-password-random",
      length=16,
      special=True,
      override_special='!#$%&*()-_=+[]{}<>:?',  # Exclude problematic characters
      opts=ResourceOptions(parent=self)
    )

    # Create secret to store the password
    self.db_password = aws.secretsmanager.Secret(
      f"{name}-db-password",
      name=f"{name}-db-password",
      description="Password for RDS PostgreSQL instance",
      tags={
        **tags,
        "Name": f"{name}-db-password"
      },
      opts=ResourceOptions(parent=self)
    )

    # Store the password in the secret
    self.db_password_version = aws.secretsmanager.SecretVersion(
      f"{name}-db-password-version",
      secret_id=self.db_password.id,
      secret_string=self.db_password_random.result,
      opts=ResourceOptions(parent=self.db_password)
    )

    # Create RDS Instance
    self.rds_instance = aws.rds.Instance(
      f"{name}-postgres",
      identifier=f"{name}-postgres",
      engine="postgres",
      engine_version="15.13",
      instance_class="db.t3.micro",
      allocated_storage=20,
      max_allocated_storage=100,
      storage_type="gp2",
      storage_encrypted=True,

      # Database configuration
      db_name="novamodel",
      username="dbadmin",
      password=self.db_password_random.result,

      # Network and security
      vpc_security_group_ids=[self.rds_security_group.id],
      db_subnet_group_name=self.db_subnet_group.name,
      parameter_group_name=self.db_parameter_group.name,
      option_group_name=self.db_option_group.name,

      # Availability and backup
      multi_az=False,  # Set to True for production
      publicly_accessible=False,
      backup_retention_period=7,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",

      # Monitoring and performance
      monitoring_interval=60,
      # monitoring_role_arn=self._create_monitoring_role().arn,
      performance_insights_enabled=True,
      performance_insights_retention_period=7,

      # Deletion protection
      deletion_protection=False,  # Set to True for production
      skip_final_snapshot=True,    # Set to False for production

      tags={
        **tags,
        "Name": f"{name}-postgres"
      },
      opts=ResourceOptions(parent=self, depends_on=[self.db_subnet_group, self.rds_security_group])
    )

    # Create read replica (optional for production)
    # self.rds_read_replica = aws.rds.Instance(
    #   f"{name}-postgres-replica",
    #   identifier=f"{name}-postgres-replica",
    #   replicate_source_db=self.rds_instance.identifier,
    #   instance_class="db.t3.micro",
    #   publicly_accessible=False,
    #   tags={
    #     **tags,
    #     "Name": f"{name}-postgres-replica"
    #   },
    #   opts=ResourceOptions(parent=self, depends_on=[self.rds_instance])
    # )

    # Register outputs
    self.register_outputs({
      "rds_instance_id": self.rds_instance.id,
      "rds_endpoint": self.rds_instance.endpoint,
      "rds_port": self.rds_instance.port,
      "rds_security_group_id": self.rds_security_group.id,
      "db_subnet_group_name": self.db_subnet_group.name,
      "db_password_secret_id": self.db_password.id,
      "db_password_secret_arn": self.db_password.arn
    })

  def _create_monitoring_role(self) -> aws.iam.Role:
    """Create IAM role for RDS Enhanced Monitoring"""

    # Trust policy for RDS monitoring
    trust_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "",
          "Effect": "Allow",
          "Principal": {
            "Service": "monitoring.rds.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    # Create monitoring role
    monitoring_role = aws.iam.Role(
      f"{self._name}-rds-monitoring-role",
      name=f"{self._name}-rds-monitoring-role",
      assume_role_policy=pulumi.Output.from_input(trust_policy).apply(
        lambda policy: __import__('json').dumps(policy)
      ),
      tags={
        **self.tags,
        "Name": f"{self._name}-rds-monitoring-role"
      },
      opts=ResourceOptions(parent=self)
    )

    # Attach AWS managed policy for RDS Enhanced Monitoring
    monitoring_policy_attachment = aws.iam.RolePolicyAttachment(
      f"{self._name}-rds-monitoring-policy",
      role=monitoring_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
      opts=ResourceOptions(parent=self)
    )

    return monitoring_role