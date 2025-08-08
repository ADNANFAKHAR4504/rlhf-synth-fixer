"""
Pulumi Component for Compute Infrastructure (EC2 Auto Scaling)
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

import base64

class ComputeInfrastructure(pulumi.ComponentResource):
  """
  Creates an Auto Scaling Group and Launch Template for EC2 instances.
  """
  def __init__(self,
               name: str,
               vpc_id: pulumi.Output,
               private_subnet_ids: pulumi.Output,
               security_group_id: pulumi.Output,
               environment: str,
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('tap:components:ComputeInfrastructure', name, None, opts)

    # Get the latest Amazon Linux 2 AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
            {"name": "state", "values": ["available"]}
        ]
    )
    ami_id = ami.id
    instance_type = "t3.micro"

    # Define user data to install a web server on the instances
    user_data = """#!/bin/bash
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
echo "<h1>Hello from Pulumi!</h1>" > /var/www/html/index.html
"""

    # Create a Launch Template for the EC2 instances
    self.launch_template = aws.ec2.LaunchTemplate(
        f"{name}-launch-template",
        name_prefix=f"{name}-lt-",
        image_id=ami_id,
        instance_type=instance_type,
        user_data=base64.b64encode(user_data.encode('utf-8')).decode('utf-8'),
        vpc_security_group_ids=[security_group_id],
        tags={**tags, "Name": f"{name}-launch-template"},
        opts=ResourceOptions(parent=self)
    )

    # Create an Auto Scaling Group
    self.autoscaling_group = aws.autoscaling.Group(
        f"{name}-asg",
        vpc_zone_identifiers=private_subnet_ids,
        min_size=1,
        max_size=3,
        desired_capacity=1,
        launch_template={
            "id": self.launch_template.id,
            "version": "$Latest"
        },
        tags=[
            {"key": k, "value": v, "propagate_at_launch": True}
            for k, v in {**tags, "Name": f"{name}-asg-instance"}.items()
        ],
        opts=ResourceOptions(parent=self)
    )

    # Export key outputs - FIX: Return a proper Output instead of trying to call AWS API
    # For Auto Scaling Groups, we'll return the ASG ARN as a list since individual instance IDs
    # are dynamic and may not be available immediately
    self.instance_ids = pulumi.Output.from_input([self.autoscaling_group.arn])