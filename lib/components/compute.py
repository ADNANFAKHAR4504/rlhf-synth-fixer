"""
Pulumi Component for Compute Infrastructure (EC2 Auto Scaling)
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

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

    # Use a default instance type and AMI
    ami_id = "ami-0c55b159cbfafe1f0" # Example AMI for us-east-1
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
        user_data=pulumi.Output.apply(user_data, lambda data: pulumi.Output.encode_base64(data)),
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

    # Export key outputs
    self.instance_ids = self.autoscaling_group.id.apply(
        lambda asg_id: pulumi_aws.get_autoscaling_group_instance_ids(asg_id).ids
    )
