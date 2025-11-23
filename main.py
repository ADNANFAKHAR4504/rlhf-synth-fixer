#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.imports.networking import NetworkingConstruct
from lib.imports.database import DatabaseConstruct
from lib.imports.compute import ComputeConstruct
from lib.imports.dns import DnsConstruct
from lib.imports.monitoring import MonitoringConstruct
import os


class MultiRegionDRStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Primary region provider (us-east-1)
        self.primary_provider = AwsProvider(
            self,
            "aws_primary",
            region="us-east-1",
            alias="primary"
        )

        # Secondary region provider (us-west-2)
        self.secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region="us-west-2",
            alias="secondary"
        )

        # Create networking in both regions
        self.networking = NetworkingConstruct(
            self,
            "networking",
            environment_suffix=environment_suffix,
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider
        )

        # Create Aurora Global Database
        self.database = DatabaseConstruct(
            self,
            "database",
            environment_suffix=environment_suffix,
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_private_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_private_subnet_ids,
            primary_security_group_id=self.networking.primary_db_sg_id,
            secondary_security_group_id=self.networking.secondary_db_sg_id
        )

        # Create Lambda functions and DynamoDB
        self.compute = ComputeConstruct(
            self,
            "compute",
            environment_suffix=environment_suffix,
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_private_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_private_subnet_ids,
            primary_lambda_sg_id=self.networking.primary_lambda_sg_id,
            secondary_lambda_sg_id=self.networking.secondary_lambda_sg_id,
            primary_db_secret_arn=self.database.primary_db_secret_arn,
            secondary_db_secret_arn=self.database.secondary_db_secret_arn
        )

        # Create Route 53 DNS failover
        self.dns = DnsConstruct(
            self,
            "dns",
            environment_suffix=environment_suffix,
            primary_provider=self.primary_provider,
            primary_endpoint=self.compute.primary_api_endpoint,
            secondary_endpoint=self.compute.secondary_api_endpoint
        )

        # Create CloudWatch monitoring and alarms
        self.monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            primary_provider=self.primary_provider,
            secondary_provider=self.secondary_provider,
            primary_db_cluster_id=self.database.primary_cluster_id,
            secondary_db_cluster_id=self.database.secondary_cluster_id,
            primary_lambda_name=self.compute.primary_payment_lambda_name,
            secondary_lambda_name=self.compute.secondary_payment_lambda_name,
            dynamodb_table_name=self.compute.dynamodb_table_name
        )

        # Outputs
        TerraformOutput(
            self,
            "primary_vpc_id",
            value=self.networking.primary_vpc_id
        )

        TerraformOutput(
            self,
            "secondary_vpc_id",
            value=self.networking.secondary_vpc_id
        )

        TerraformOutput(
            self,
            "global_database_id",
            value=self.database.global_cluster_id
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.compute.dynamodb_table_name
        )

        TerraformOutput(
            self,
            "dns_failover_domain",
            value=self.dns.failover_domain
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=self.monitoring.sns_topic_arn
        )


app = App()
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev-test")
MultiRegionDRStack(app, f"payment-dr-{environment_suffix}", environment_suffix)
app.synth()
