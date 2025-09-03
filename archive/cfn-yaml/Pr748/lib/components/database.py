"""
RDS module for PostgreSQL database instance.
Creates RDS with encryption, backup, and proper subnet group configuration.
"""

import pulumi
import pulumi_aws as aws


class DatabaseComponent(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      environment: str,
      db_security_group_id: pulumi.Output[str],
      username: str,
      password: pulumi.Output[str],
      private_subnet_ids: list,
      opts=None
  ):
    super().__init__("custom:aws:Database", name, None, opts)

    # Create DB subnet group for multi-AZ deployment
    self.db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{environment}",
        name=f"db-subnet-group-{environment}",
        subnet_ids=private_subnet_ids,
        tags={
            "Name": f"db-subnet-group-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Create RDS parameter group for PostgreSQL optimization
    self.db_parameter_group = aws.rds.ParameterGroup(
        f"db-params-{environment}",
        name=f"db-params-{environment}",
        family="postgres17",
        description=f"Parameter group for {environment} PostgreSQL",
        tags={
            "Name": f"db-params-{environment}",
            "Environment": environment
        },
        opts=pulumi.ResourceOptions(parent=self),
    )

    # Determine instance class based on environment
    self.instance_class_map = {
        "dev": "db.t3.micro",
        "staging": "db.t3.small",
        "prod": "db.t3.medium"
    }
    instance_class = self.instance_class_map.get(environment, "db.t3.micro")

    # Create RDS instance with encryption and backup
    self.rds_instance = aws.rds.Instance(
        f"postgres-{environment}",
        identifier=f"postgres-{environment}",
        engine="postgres",
        engine_version="17.5",
        instance_class=instance_class,
        allocated_storage=20,
        max_allocated_storage=100,  # Enable storage autoscaling
        storage_type="gp2",
        storage_encrypted=True,  # Encrypt storage at rest

        # Database configuration
        db_name="appdb",
        username=username,
        password=password,
        port=5432,

        # Network and security
        vpc_security_group_ids=[db_security_group_id],
        db_subnet_group_name=self.db_subnet_group.name,
        parameter_group_name=self.db_parameter_group.name,
        publicly_accessible=False,  # Keep in private subnet

        # Backup and maintenance
        backup_retention_period=7,
        auto_minor_version_upgrade=True,

        # Monitoring and performance
        performance_insights_enabled=True,
        performance_insights_retention_period=7,

        # Deletion protection for production
        deletion_protection=False,
        skip_final_snapshot=True,

        tags={
            "Name": f"postgres-{environment}",
            "Environment": environment,
            "Engine": "PostgreSQL"
        },
        opts=pulumi.ResourceOptions(parent=self),
    )
