from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Import the custom components
from lib.components.networking import NetworkingComponent
from lib.components.security import SecurityComponent
from lib.components.database import DatabaseComponent
from lib.components.serverless import ServerlessComponent
from lib.components.storage import StorageComponent
# LOCALSTACK FIX: CloudTrail removed (Pro-only feature)
# from lib.components.monitoring import CloudTrailComponent


class TapStackArgs:
  """
  Arguments for the TapStack component.

  This class defines the configurable parameters for the entire deployment,
  such as the environment suffix, target regions, and global tags.
  """

  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'prod'
    # LOCALSTACK FIX: Simplified to single region for LocalStack compatibility
    self.regions = ['us-east-1']
    self.tags = tags or {
        'Project': 'PulumiOptimization',
        'Environment': self.environment_suffix,
        'Application': 'multi-env',
        'ManagedBy': 'Pulumi'
    }

class TapStack(pulumi.ComponentResource):
  """
  The main Pulumi component that orchestrates the creation of all
  regional infrastructure. It loops through specified regions and deploys
  all the individual infrastructure components.
  """

  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    # Initialize component storage for regional resources
    self.regional_deployments = {}
    self.providers = {}
    self.networking = {}
    self.security = {}
    self.storage = {}
    self.database = {}
    self.serverless = {}
    self.monitoring = {}

    # Deploy to each region with proper multi-region setup
    for i, region in enumerate(self.regions):
      region_suffix = region.replace('-', '').replace('gov', '')
      is_primary = i == 0

      print(
          f" Setting up AWS provider for region: {region} ({'PRIMARY' if is_primary else 'SECONDARY'})")
      self.providers[region] = aws.Provider(
          f"aws-provider-{region_suffix}-{self.environment_suffix}",
          region=region,
          opts=ResourceOptions(parent=self)
      )

      def provider_opts(deps=None):
        return ResourceOptions(
            parent=self,
            provider=self.providers[region],
            depends_on=deps or []
        )

      print(f" Deploying infrastructure components for {region}...")

      print(f"  Creating networking infrastructure for {region}...")
      # 1. Deploy networking infrastructure
      # Creates VPC, subnets, route tables, NAT gateways, and internet gateway
      self.networking[region] = NetworkingComponent(
          f"networking-{region_suffix}-{self.environment_suffix}",
          region=region,
          tags=self.tags,
          opts=provider_opts()
      )

      print(f"  Creating security components for {region}...")
      # 2. Deploy security components
      # Creates security groups, WAF, and IAM roles with least privilege
      self.security[region] = SecurityComponent(
          f"security-{region_suffix}-{self.environment_suffix}",
          vpc_id=self.networking[region].vpc.id,
          subnets=self.networking[region].public_subnet_ids,
          region=region,
          tags=self.tags,
          opts=provider_opts([self.networking[region]])
      )

      print(f"  Creating storage components for {region}...")
      # 3. Deploy storage components
      # Creates S3 buckets with encryption, versioning, and cross-region replication
      self.storage[region] = StorageComponent(
          f"storage-{region_suffix}-{self.environment_suffix}",
          environment=self.environment_suffix,
          region_suffix=region_suffix,
          tags=self.tags,
          opts=provider_opts()
      )

      print(f"  Creating database components for {region}...")
      # 4. Deploy database components
      # Creates RDS Multi-AZ and DynamoDB with encryption and auto-scaling
      self.database[region] = DatabaseComponent(
          f"database-{region_suffix}-{self.environment_suffix}",
          vpc_id=self.networking[region].vpc.id,
          private_subnet_ids=self.networking[region].public_subnet_ids,
          database_security_group_id=self.security[region].database_security_group.id,
          region=region,
          is_primary=is_primary,
          tags=self.tags,
          opts=provider_opts([self.networking[region], self.security[region]])
      )

      print(f"  Creating serverless components for {region}...")
      # 5. Deploy serverless components
      # Creates Lambda functions with VPC access and proper IAM roles
      self.serverless[region] = ServerlessComponent(
          f"serverless-{region_suffix}-{self.environment_suffix}",
          environment=self.environment_suffix,
          lambda_role_arn=self.security[region].lambda_execution_role.arn,
          private_subnet_ids=self.networking[region].public_subnet_ids,
          lambda_security_group_id=self.security[region].lambda_security_group.id,
          rds_endpoint=self.database[region].rds_endpoint,
          tags=self.tags,
          opts=provider_opts(
              [self.networking[region], self.security[region], self.database[region], self.storage[region]])
      )

      # LOCALSTACK FIX: Removed CloudTrail monitoring (Pro-only feature)
      # print(f"  Creating monitoring and auditing for {region}...")

      self.regional_deployments[region] = {
          "networking": self.networking[region],
          "security": self.security[region],
          "storage": self.storage[region],
          "database": self.database[region],
          "serverless": self.serverless[region]
      }

    print(" Exporting Outputs for Single-Region Deployment...")

    # LOCALSTACK FIX: Removed VPC peering for single-region deployment

    # Single-region summary
    pulumi.export("deployed_regions", self.regions)
    pulumi.export("total_regions", len(self.regions))
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("tags", self.tags)
    pulumi.export("us_east_lambda_arn",
                  self.serverless["us-east-1"].lambda_function.arn)
    pulumi.export("us_east_rds_endpoint",
                  self.database["us-east-1"].rds_endpoint)
