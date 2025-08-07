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
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('tap:components:MonitoringInfrastructure', name, None, opts)

    # A simple CloudWatch Dashboard for the EC2 instances
    self.dashboard_name = f"{name}-dashboard"

    self.dashboard = aws.cloudwatch.Dashboard(
        f"{name}-dashboard",
        dashboard_name=self.dashboard_name,
        dashboard_body=instance_ids.apply(lambda ids:
            f"""
            {{
                "widgets": [
                    {{
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                [ "AWS/EC2", "CPUUtilization", "InstanceId", "{ids[0]}" ]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "{opts.provider.region}",
                            "title": "EC2 CPU Utilization"
                        }}
                    }}
                ]
            }}
            """ if ids else
            """
            {
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
            }
            """
        ),
        opts=ResourceOptions(parent=self)
    )
    
    # Export key outputs
    self.dashboard_name = self.dashboard.dashboard_name

