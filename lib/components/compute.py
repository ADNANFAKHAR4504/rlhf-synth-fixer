"""
Pulumi Component for Compute Infrastructure (EC2 Instances)
LocalStack Community Edition compatible - uses standalone EC2 instances instead of ASG
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, InvokeOptions

import base64

class ComputeInfrastructure(pulumi.ComponentResource):
    """
    Creates standalone EC2 instances for high availability.
    LocalStack Community Edition does not support Auto Scaling Groups (PRO-only),
    so we deploy multiple EC2 instances directly across availability zones.
    """
    def __init__(self,
                 name: str,
                 vpc_id: pulumi.Output,
                 private_subnet_ids: pulumi.Output,
                 security_group_id: pulumi.Output,
                 environment: str,
                 region: str,
                 tags: Optional[dict] = None,
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:components:ComputeInfrastructure', name, None, opts)

        # Get the latest Amazon Linux 2 AMI for the specific region
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
                {"name": "state", "values": ["available"]}
            ],
            opts=InvokeOptions(provider=opts.provider if opts and opts.provider else None)
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

        # Create a Launch Template for the EC2 instances (optional, but keeps parity)
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

        # Create multiple standalone EC2 instances for high availability
        # Deploy 2 instances per region across different subnets for HA
        self.instances = []
        instance_count = 2  # Reduced from 3 to 2 for LocalStack efficiency

        def create_instances(subnet_ids):
            """Create EC2 instances across available subnets"""
            created_instances = []
            for i in range(instance_count):
                # Distribute instances across available subnets (round-robin)
                subnet_index = i % len(subnet_ids)
                subnet_id = subnet_ids[subnet_index]

                instance = aws.ec2.Instance(
                    f"{name}-instance-{i+1}",
                    ami=ami_id,
                    instance_type=instance_type,
                    subnet_id=subnet_id,
                    vpc_security_group_ids=[security_group_id],
                    user_data=user_data,
                    tags={
                        **tags,
                        "Name": f"{name}-instance-{i+1}",
                        "Index": str(i+1),
                        "Environment": environment,
                        "Region": region
                    },
                    opts=ResourceOptions(parent=self, provider=opts.provider if opts and opts.provider else None)
                )
                created_instances.append(instance)

            return created_instances

        # Use apply to handle the Output from private_subnet_ids
        self.instances = private_subnet_ids.apply(create_instances)

        # Export key outputs - Return list of instance IDs
        self.instance_ids = self.instances.apply(lambda instances: [inst.id for inst in instances])
