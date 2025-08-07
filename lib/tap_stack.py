from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.components.database import DatabaseComponent
from lib.components.serverless import ServerlessComponent


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags



class TapStack(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # self.register_outputs({})

    # config = pulumi.Config()
    # environment_specific_vars = pulumi.Config("aws-multi-environment-infrastructure")
    # environment = environment_specific_vars.require("environment")

    # Get current AWS region
    current_region = aws.get_region()

    # 2. Create IAM roles and policies
    self.iam_component = IAMComponent(
        f"iam-{self.environment_suffix}-turing",
        environment=self.environment_suffix,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 1. Create compute resources (Vpc, EC2, LoadBalancer)
    self.compute_component = ComputeComponent(
        f"vpc-{self.environment_suffix}",
        environment=self.environment_suffix,
        cidr_block="10.0.0.0/16",
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 4. Create DynamoDB tables with PITR
    self.database_component = DatabaseComponent(
        f"database-{self.environment_suffix}",
        environment=self.environment_suffix,
        db_security_group_id=self.compute_component.db_sg.id,
        username="POSTGRES",
        password="POSTGRES",
        private_subnet_ids=self.compute_component.private_subnet_ids,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 5. Create serverless resources (Lambda)
    self.serverless_component = ServerlessComponent(
        f"serverless-{self.environment_suffix}",
        environment=self.environment_suffix,
        lambda_role_arn=self.iam_component.lambda_role.arn,
        private_subnet_ids=self.compute_component.private_subnet_ids,
        lambda_security_group_id=self.compute_component.lambda_sg.id,
        rds_endpoint=self.database_component.rds_instance.endpoint,
        db_name="appdb",
        db_username="POSTGRES",
        db_password="POSTGRES",
        opts=pulumi.ResourceOptions(parent=self, depends_on=[
            self.database_component
        ])
    )

    # Export important resource information
    pulumi.export("vpc_id", self.compute_component.vpc.id)
    pulumi.export("lambda_function_name",
                  self.serverless_component.lambda_function.name)
    pulumi.export("api_gateway_address", self.serverless_component.api_url)
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("region", current_region.name)
