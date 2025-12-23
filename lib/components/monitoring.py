"""
Pulumi Component for Monitoring Infrastructure
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class MonitoringInfrastructure(pulumi.ComponentResource):
    """
    Creates CloudWatch dashboards and alarms.
    """
    def __init__(self,
                 name: str,
                 instance_ids: pulumi.Output,
                 environment: str,
                 region: str,
                 tags: Optional[dict] = None,
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:components:MonitoringInfrastructure', name, None, opts)

        # A simple CloudWatch Dashboard for the EC2 instances
        # Updated to handle multiple EC2 instances instead of ASG ARNs
        dashboard_name_str = f"{name}-dashboard"

        # Capture region in closure
        dashboard_region = region

        def create_dashboard_body(ids):
            """Create dashboard JSON with metrics for all EC2 instances"""
            import json

            if not ids or len(ids) == 0:
                return json.dumps({
                    "widgets": [
                        {
                            "type": "text",
                            "x": 0,
                            "y": 0,
                            "width": 12,
                            "height": 2,
                            "properties": {
                                "markdown": "### No instances found to monitor."
                            }
                        }
                    ]
                })

            # Create metrics for each instance
            metrics = []
            for instance_id in ids:
                # Ensure instance_id is a string (not Output)
                if isinstance(instance_id, str):
                    metrics.append(["AWS/EC2", "CPUUtilization", "InstanceId", instance_id])

            dashboard_config = {
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": metrics,
                            "period": 300,
                            "stat": "Average",
                            "region": dashboard_region,
                            "title": "EC2 Instances CPU Utilization"
                        }
                    }
                ]
            }

            return json.dumps(dashboard_config)

        self.dashboard = aws.cloudwatch.Dashboard(
            f"{name}-dashboard",
            dashboard_name=dashboard_name_str,
            dashboard_body=instance_ids.apply(create_dashboard_body),
            opts=ResourceOptions(parent=self)
        )

        # Export key outputs - FIX: Use the dashboard's actual output, not the string
        self.dashboard_name = self.dashboard.dashboard_name
