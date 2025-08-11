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
from lib.components.monitoring import CloudTrailComponent

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
    # Defaulting to the project's required regions
    self.regions = ['us-east-1', 'us-west-2']
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

        # Deploy to each region with proper multi-region setup
        for i, region in enumerate(self.regions):
            region_suffix = region.replace('-', '').replace('gov', '')
            is_primary = i == 0

            print(f" Setting up AWS provider for region: {region} ({'PRIMARY' if is_primary else 'SECONDARY'})")
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
            self.networking = NetworkingComponent(
                f"networking-{region_suffix}-{self.environment_suffix}",
                region=region,
                tags=self.tags,
                opts=provider_opts()
            )
            
            print(f"  Creating security components for {region}...")
            # 2. Deploy security components
            # Creates security groups, WAF, and IAM roles with least privilege
            self.security = SecurityComponent(
                f"security-{region_suffix}-{self.environment_suffix}",
                vpc_id=self.networking.vpc.id,
                subnets=self.networking.public_subnet_ids,
                region=region,
                tags=self.tags,
                opts=provider_opts([self.networking])
            )
            
            print(f"  Creating storage components for {region}...")
            # 3. Deploy storage components
            # Creates S3 buckets with encryption, versioning, and cross-region replication
            self.storage = StorageComponent(
                f"storage-{region_suffix}-{self.environment_suffix}",
                environment=self.environment_suffix,
                tags=self.tags,
                opts=provider_opts()
            )
            
            print(f"  Creating database components for {region}...")
            # 4. Deploy database components
            # Creates RDS Multi-AZ and DynamoDB with encryption and auto-scaling
            self.database = DatabaseComponent(
                f"database-{region_suffix}-{self.environment_suffix}",
                vpc_id=self.networking.vpc.id,
                private_subnet_ids=self.networking.private_subnet_ids,
                database_security_group_id=self.security.database_security_group.id,
                region=region,
                is_primary=is_primary,
                tags=self.tags,
                opts=provider_opts([self.networking, self.security])
            )
            
            print(f"  Creating serverless components for {region}...")
            # 5. Deploy serverless components
            # Creates Lambda functions with VPC access and proper IAM roles
            self.serverless = ServerlessComponent(
                f"serverless-{region_suffix}-{self.environment_suffix}",
                environment=self.environment_suffix,
                lambda_role_arn=self.security.lambda_execution_role.arn,
                private_subnet_ids=self.networking.private_subnet_ids,
                lambda_security_group_id=self.security.lambda_security_group.id,
                rds_endpoint=self.database.rds_endpoint,
                tags=self.tags,
                opts=provider_opts([self.networking, self.security, self.database, self.storage])
            )
            
            print(f"  Creating monitoring and auditing for {region}...")
            # 6. Deploy monitoring and auditing
            # Creates CloudTrail
            self.monitoring = CloudTrailComponent(
                f"monitoring-{region_suffix}-{self.environment_suffix}",
                bucket_id=self.storage.bucket.bucket,
                opts=provider_opts([self.storage])
            )
            
            self.regional_deployments[region] = {
                "networking": self.networking,
                "security": self.security,
                "storage": self.storage,
                "database": self.database,
                "serverless": self.serverless,
                "monitoring": self.monitoring
            }

        print(" Exporting Outputs for Multi-Region Deployment...")
        
        # Multi-region summary
        pulumi.export("deployed_regions", self.regions)
        pulumi.export("total_regions", len(self.regions))
        pulumi.export("environment", self.environment_suffix)
        pulumi.export("tags", self.tags)

        # # Export primary and secondary region specific outputs
        # primary_region = self.regions[0]
        # secondary_region = self.regions[1] if len(self.regions) > 1 else None

        # pulumi.export("primary_region", primary_region)
        # if secondary_region:
        #     pulumi.export("secondary_region", secondary_region)

        # # Export ALB DNS names
        # pulumi.export("primary_alb_dns", 
        #              self.regional_deployments[primary_region]["serverless"].alb.dns_name)
        # if secondary_region:
        #     pulumi.export("secondary_alb_dns", 
        #                  self.regional_deployments[secondary_region]["serverless"].alb.dns_name)

        # # Export RDS endpoints
        # pulumi.export("primary_rds_endpoint", 
        #              self.regional_deployments[primary_region]["database"].rds_endpoint)
        # if secondary_region:
        #     pulumi.export("secondary_rds_endpoint", 
        #                  self.regional_deployments[secondary_region]["database"].rds_endpoint)

        # # Export a comprehensive summary of all regional resources
        # all_regions_data_outputs = {}
        # for region in self.regions:
        #     deployment = self.regional_deployments[region]
        #     all_regions_data_outputs[region] = pulumi.Output.all(
        #         vpc_id=deployment["networking"].vpc.id,
        #         private_subnet_ids=deployment["networking"].private_subnet_ids,
        #         alb_dns=deployment["serverless"].alb.dns_name,
        #         rds_endpoint=deployment["database"].rds_endpoint,
        #         dynamodb_table=deployment["database"].dynamodb_table.name,
        #         app_bucket=deployment["storage"].app_bucket.bucket,
        #         logging_bucket=deployment["storage"].logging_bucket.bucket,
        #     )
        
        # pulumi.export("all_regions_data", pulumi.Output.all(all_regions_data_outputs))