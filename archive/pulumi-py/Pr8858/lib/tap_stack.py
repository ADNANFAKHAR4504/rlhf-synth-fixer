"""
AWS Multi-Region GovCloud Web Application Deployment
IaC - Pulumi TapStack - Main Stack

This is the main Pulumi Python program that orchestrates the deployment
of a web application across multiple AWS GovCloud regions using the
custom TapStack component model.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from lib.components.networking import NetworkingInfrastructure
from lib.components.compute import ComputeInfrastructure
from lib.components.security import SecurityInfrastructure
from lib.components.monitoring import MonitoringInfrastructure

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
        # Defaulting to us-east-1 and us-west-2 for multi-region deployment
        self.regions = regions or ['us-east-1', 'us-west-2']
        self.tags = tags or {
            'Project': 'Pulumi-Tap-Stack',
            'Environment': self.environment_suffix,
            'Application': 'custom-app',
            'ManagedBy': 'Pulumi'
        }

class TapStack(pulumi.ComponentResource):
    """
    The main Pulumi component that orchestrates the creation of all
    regional infrastructure. It loops through specified regions and deploys
    a full set of networking, compute, security, and monitoring resources.
    """
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.regions = args.regions
        self.tags = args.tags

        # Initialize component storage for regional resources
        self.regional_networks = {}
        self.regional_security = {}
        self.regional_compute = {}
        self.regional_monitoring = {}
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

            print(f" Creating Networking Infrastructure for {region}...")
            # FIX: Use simple string concatenation for resource names
            self.regional_networks[region] = NetworkingInfrastructure(
                name=f"network-{region_suffix}-{self.environment_suffix}",
                environment=self.environment_suffix,
                region=region,
                tags=self.tags,
                opts=provider_opts()
            )

            print(f" Creating Security Infrastructure for {region}...")
            # FIX: Use simple string concatenation for resource names
            self.regional_security[region] = SecurityInfrastructure(
                name=f"security-{region_suffix}-{self.environment_suffix}",
                vpc_id=self.regional_networks[region].vpc_id,
                environment=self.environment_suffix,
                tags=self.tags,
                opts=provider_opts([self.regional_networks[region]])
            )

            print(f" Creating Compute Infrastructure for {region}...")
            # FIX: Use simple string concatenation for resource names
            self.regional_compute[region] = ComputeInfrastructure(
                name=f"compute-{region_suffix}-{self.environment_suffix}",
                vpc_id=self.regional_networks[region].vpc_id,
                region=region,
                private_subnet_ids=self.regional_networks[region].private_subnet_ids,
                security_group_id=self.regional_security[region].web_server_sg_id, # Assumed output
                environment=self.environment_suffix,
                tags=self.tags,
                opts=provider_opts([
                    self.regional_networks[region],
                    self.regional_security[region]
                ])
            )

            print(f" Creating Monitoring Infrastructure for {region}...")
            # FIX: Use simple string concatenation for resource names
            self.regional_monitoring[region] = MonitoringInfrastructure(
                name=f"monitoring-{region_suffix}-{self.environment_suffix}",
                instance_ids=self.regional_compute[region].instance_ids, # Assumed output
                environment=self.environment_suffix,
                region=region,
                tags=self.tags,
                opts=provider_opts([
                    self.regional_networks[region],
                    self.regional_security[region],
                    self.regional_compute[region]
                ])
            )

        print(" Exporting Outputs for Multi-Region Deployment...")

        # Multi-region summary
        pulumi.export("deployed_regions", self.regions)
        pulumi.export("total_regions", len(self.regions))
        pulumi.export("environment", self.environment_suffix)
        pulumi.export("tags", self.tags)

        if self.regions:
            primary_region = self.regions[0]
            pulumi.export("primary_region", primary_region)
            pulumi.export("primary_vpc_id", self.regional_networks[primary_region].vpc_id)
            pulumi.export("primary_instance_ids", self.regional_compute[primary_region].instance_ids)
            pulumi.export("primary_web_server_sg_id", self.regional_security[primary_region].web_server_sg_id)
            pulumi.export("primary_dashboard_name", self.regional_monitoring[primary_region].dashboard_name)

        all_regions_data_outputs = {}
        for region in self.regions:
            all_regions_data_outputs[region] = pulumi.Output.all(
                vpc_id=pulumi.Output.from_input(self.regional_networks[region].vpc_id),
                instance_ids=pulumi.Output.from_input(self.regional_compute[region].instance_ids),
                security_group_id=pulumi.Output.from_input(self.regional_security[region].web_server_sg_id),
                dashboard_name=pulumi.Output.from_input(self.regional_monitoring[region].dashboard_name),
            )

        pulumi.export("all_regions_data", pulumi.Output.all(all_regions_data_outputs))
