"""
AWS Multi-Region GovCloud Web Application Deployment
IaC - Pulumi TapStack - Main Stack

This is the main Pulumi Python program that orchestrates the deployment
of a web application across multiple AWS GovCloud regions using the
custom TapStack component model.

This version is adapted for the "IaC - AWS Nova Model Breaking" project,
focusing on the DualStackInfrastructure component.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Import the custom dual-stack component
from lib.components.dual_stack import DualStackInfrastructure

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
    self.regions = ['us-east-1', 'eu-west-1']
    self.tags = tags or {
      'Project': 'Pulumi-Nova-Model-Breaking',
      'Environment': self.environment_suffix,
      'Application': 'dual-stack-app',
      'ManagedBy': 'Pulumi'
    }

class TapStack(pulumi.ComponentResource):
  """
  The main Pulumi component that orchestrates the creation of all
  regional infrastructure. It loops through specified regions and deploys
  the DualStackInfrastructure component.
  """
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    # Initialize component storage for regional resources
    self.regional_dual_stack_infra = {}
    self.providers = {}

    # Define the CIDR blocks for each region
    ipv4_cidrs = {'us-east-1': '10.1.0.0/16', 'eu-west-1': '10.2.0.0/16'}
    # ipv6_cidrs = {'us-east-1': 'fd00:10:1::/56', 'eu-west-1': 'fd00:10:2::/56'}
    
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

      print(f" Creating Dual Stack Infrastructure for {region}...")
      self.regional_dual_stack_infra[region] = DualStackInfrastructure(
        name=f"dual-stack-{region_suffix}-{self.environment_suffix}",
        region=region,
        ipv4_cidr=ipv4_cidrs[region],
        # The ipv6_cidr argument has been removed to match the updated DualStackInfrastructure component.
        opts=provider_opts()
      )

    print(" Creating VPC Peering Connection...")
    
    # Create the peering connection after both regional stacks are ready
    us_east_1_infra = self.regional_dual_stack_infra['us-east-1']
    eu_west_1_infra = self.regional_dual_stack_infra['eu-west-1']

    peer_connection = aws.ec2.VpcPeeringConnection(
      "vpc-peering",
      peer_vpc_id=eu_west_1_infra.vpc.id,
      vpc_id=us_east_1_infra.vpc.id,
    #   auto_accept=True,
      peer_region="eu-west-1",
      tags={
        "Name": "us-east-1-to-eu-west-1-peering",
        "Project": self.tags.get('Project', ''),
      },
      opts=ResourceOptions(provider=self.providers['us-east-1'], parent=self)
    )

    # Add routes for the VPC peering connection in each route table
    aws.ec2.Route(
      "us-east-1-peering-route-ipv4",
      route_table_id=us_east_1_infra.public_rt.id,
      destination_cidr_block="10.2.0.0/16",
      vpc_peering_connection_id=peer_connection.id,
      opts=ResourceOptions(provider=self.providers['us-east-1'], parent=self)
    )
    aws.ec2.Route(
      "us-east-1-peering-route-ipv6",
      route_table_id=us_east_1_infra.public_rt.id,
      destination_ipv6_cidr_block=eu_west_1_infra.vpc.ipv6_cidr_block,
      vpc_peering_connection_id=peer_connection.id,
      opts=ResourceOptions(provider=self.providers['us-east-1'], parent=self)
    )

    aws.ec2.Route(
      "eu-west-1-peering-route-ipv4",
      route_table_id=eu_west_1_infra.public_rt.id,
      destination_cidr_block="10.1.0.0/16",
      vpc_peering_connection_id=peer_connection.id,
      opts=ResourceOptions(provider=self.providers['eu-west-1'], parent=self)
    )
    aws.ec2.Route(
      "eu-west-1-peering-route-ipv6",
      route_table_id=eu_west_1_infra.public_rt.id,
      destination_ipv6_cidr_block=us_east_1_infra.vpc.ipv6_cidr_block,
      vpc_peering_connection_id=peer_connection.id,
      opts=ResourceOptions(provider=self.providers['eu-west-1'], parent=self)
    )
    
    print(" Exporting Outputs for Multi-Region Deployment...")
    
    # Multi-region summary
    pulumi.export("deployed_regions", self.regions)
    pulumi.export("total_regions", len(self.regions))
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("tags", self.tags)

    # Export a summary of the regional resources
    all_regions_data_outputs = {}
    for region in self.regions:
      all_regions_data_outputs[region] = pulumi.Output.all(
        vpc_id=self.regional_dual_stack_infra[region].vpc.id,
        public_subnet_id=self.regional_dual_stack_infra[region].public_subnet.id,
        private_subnet_id=self.regional_dual_stack_infra[region].private_subnet.id,
        public_rt_id=self.regional_dual_stack_infra[region].public_rt.id,
        private_rt_id=self.regional_dual_stack_infra[region].private_rt.id,
      )
    
    pulumi.export("all_regions_data", pulumi.Output.all(all_regions_data_outputs))
