"""
Pulumi Component for Security Infrastructure
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class SecurityInfrastructure(pulumi.ComponentResource):
    """
    Creates security groups for different layers of the application.
    """
    def __init__(self,
                 name: str,
                 vpc_id: pulumi.Output,
                 environment: str,
                 tags: Optional[dict] = None,
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:components:SecurityInfrastructure', name, None, opts)

        # Create a security group for web servers
        self.web_server_sg = aws.ec2.SecurityGroup(
            f"{name}-web-server-sg",
            vpc_id=vpc_id,
            description="Allow inbound traffic on port 80 and 443",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTP from anywhere",
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTPS from anywhere",
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "Allow all outbound traffic",
                }
            ],
            tags={**tags, "Name": f"{name}-web-server-sg"},
            opts=ResourceOptions(parent=self)
        )

        # Export key outputs
        self.web_server_sg_id = self.web_server_sg.id
