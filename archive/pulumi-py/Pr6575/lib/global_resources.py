"""
global_resources.py

Global resources including Route 53, DynamoDB Global Tables, and CloudWatch.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Input


class GlobalResourcesArgs:
    """Arguments for global resources."""
    def __init__(
        self,
        environment_suffix: str,
        primary_api_endpoint: Input[str],
        dr_api_endpoint: Input[str],
        primary_region: str,
        dr_region: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.primary_api_endpoint = primary_api_endpoint
        self.dr_api_endpoint = dr_api_endpoint
        self.primary_region = primary_region
        self.dr_region = dr_region
        self.tags = tags or {}


class GlobalResources(pulumi.ComponentResource):
    """
    Global resources for disaster recovery.

    Includes Route 53 for DNS failover, DynamoDB global tables,
    and CloudWatch dashboards.
    """

    def __init__(
        self,
        name: str,
        args: GlobalResourcesArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dr:GlobalResources', name, None, opts)

        # Create providers for both regions
        self.primary_provider = aws.Provider(
            f'global-primary-provider-{args.environment_suffix}',
            region=args.primary_region,
            opts=ResourceOptions(parent=self)
        )

        self.dr_provider = aws.Provider(
            f'global-dr-provider-{args.environment_suffix}',
            region=args.dr_region,
            opts=ResourceOptions(parent=self)
        )

        # Route 53 resources
        self._create_route53(args)

        # DynamoDB global table
        self._create_dynamodb_global_table(args)

        # CloudWatch resources
        self._create_cloudwatch_resources(args)

        # Export SNS topic ARNs from primary and DR regions
        self.sns_topic_primary_arn = pulumi.Output.concat(
            'arn:aws:sns:',
            args.primary_region,
            ':',
            pulumi.Output.from_input(aws.get_caller_identity()).account_id,
            ':dr-alerts-primary-',
            args.environment_suffix
        )

        self.sns_topic_dr_arn = pulumi.Output.concat(
            'arn:aws:sns:',
            args.dr_region,
            ':',
            pulumi.Output.from_input(aws.get_caller_identity()).account_id,
            ':dr-alerts-dr-',
            args.environment_suffix
        )

        self.register_outputs({})

    def _create_route53(self, args: GlobalResourcesArgs):
        """Create Route 53 hosted zone with failover routing."""
        # Hosted zone
        self.zone = aws.route53.Zone(
            f'dr-zone-{args.environment_suffix}',
            name=f'dr-payments-{args.environment_suffix}.test.local',
            tags={**args.tags, 'Name': f'dr-zone-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Primary region DNS record
        self.primary_record = aws.route53.Record(
            f'primary-record-{args.environment_suffix}',
            zone_id=self.zone.zone_id,
            name=f'primary.dr-payments-{args.environment_suffix}.test.local',
            type='CNAME',
            ttl=60,
            records=[args.primary_api_endpoint.apply(
                lambda url: url.replace('https://', '').split('/')[0]
            )],
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # DR region DNS record
        self.dr_record = aws.route53.Record(
            f'dr-record-{args.environment_suffix}',
            zone_id=self.zone.zone_id,
            name=f'dr.dr-payments-{args.environment_suffix}.test.local',
            type='CNAME',
            ttl=60,
            records=[args.dr_api_endpoint.apply(
                lambda url: url.replace('https://', '').split('/')[0]
            )],
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        self.zone_id = self.zone.zone_id
        self.failover_domain = pulumi.Output.concat(
            'api.dr-payments-',
            args.environment_suffix,
            '.test.local'
        )

    def _create_dynamodb_global_table(self, args: GlobalResourcesArgs):
        """Create DynamoDB global table for session state."""
        # Primary region table
        self.dynamodb_table_primary = aws.dynamodb.Table(
            f'sessions-primary-{args.environment_suffix}',
            name=f'sessions-{args.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='session_id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='session_id',
                    type='S'
                )
            ],
            stream_enabled=True,
            stream_view_type='NEW_AND_OLD_IMAGES',
            replicas=[aws.dynamodb.TableReplicaArgs(
                region_name=args.dr_region
            )],
            tags={**args.tags, 'Name': f'sessions-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider, protect=False)
        )

        self.dynamodb_table_name = self.dynamodb_table_primary.name

    def _create_cloudwatch_resources(self, args: GlobalResourcesArgs):
        """Create CloudWatch dashboard and alarms."""
        # CloudWatch dashboard in primary region
        dashboard_body = pulumi.Output.all(
            args.primary_region,
            args.dr_region,
            args.environment_suffix
        ).apply(lambda vals: f'''
{{
    "widgets": [
        {{
            "type": "metric",
            "properties": {{
                "metrics": [
                    ["AWS/RDS", "CPUUtilization", {{"region": "{vals[0]}", "stat": "Average"}}],
                    ["AWS/RDS", "CPUUtilization", {{"region": "{vals[1]}", "stat": "Average"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "{vals[0]}",
                "title": "Aurora CPU Utilization - Both Regions"
            }}
        }},
        {{
            "type": "metric",
            "properties": {{
                "metrics": [
                    ["AWS/Lambda", "Invocations", {{"region": "{vals[0]}", "stat": "Sum"}}],
                    ["AWS/Lambda", "Invocations", {{"region": "{vals[1]}", "stat": "Sum"}}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "{vals[0]}",
                "title": "Lambda Invocations - Both Regions"
            }}
        }},
        {{
            "type": "metric",
            "properties": {{
                "metrics": [
                    ["AWS/ApiGateway", "Count", {{"region": "{vals[0]}", "stat": "Sum"}}],
                    ["AWS/ApiGateway", "Count", {{"region": "{vals[1]}", "stat": "Sum"}}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "{vals[0]}",
                "title": "API Gateway Requests - Both Regions"
            }}
        }}
    ]
}}
''')

        self.dashboard = aws.cloudwatch.Dashboard(
            f'dr-dashboard-{args.environment_suffix}',
            dashboard_name=f'dr-dashboard-{args.environment_suffix}',
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
