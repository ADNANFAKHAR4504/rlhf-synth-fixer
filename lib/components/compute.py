# lib/components/compute.py

from typing import Optional, List
import base64
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class ComputeInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    vpc_id: pulumi.Input[str],
    private_subnet_ids: pulumi.Input[List[str]],
    load_balancer_security_group_id: pulumi.Input[str],
    target_group_arn: pulumi.Input[str],
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('aws:components:ComputeInfrastructure', name, None, opts)

    self.tags = tags

    # Get the latest Amazon Linux 2 AMI
    self.ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[
        {
          "name": "name",
          "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        }
      ]
    )

    # Create EC2 Security Group
    self.ec2_security_group = aws.ec2.SecurityGroup(
      f"{name}-ec2-sg",
      name=f"{name}-ec2-sg",
      description="Security group for EC2 instances",
      vpc_id=vpc_id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 80,
          "to_port": 80,
          "security_groups": [load_balancer_security_group_id],
          "description": "HTTP from Load Balancer"
        },
        {
          "protocol": "tcp",
          "from_port": 22,
          "to_port": 22,
          "security_groups": [load_balancer_security_group_id],
          "description": "SSH from Load Balancer"
        }
      ],
      egress=[
        {
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "All outbound traffic"
        }
      ],
      tags={
        **tags,
        "Name": f"{name}-ec2-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # User data to install Apache and a simple HTML page
    self.user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AWS Nova Model Breaking - Production</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            flex-direction: column;
        }
        .container {
            background-color: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 600px;
            width: 90%;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .info {
            background-color: #e9f7ef;
            border-left: 5px solid #28a745;
            padding: 15px;
            margin-top: 20px;
            margin-bottom: 20px;
            text-align: left;
        }
        .info p {
            margin: 5px 0;
        }
        em {
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 AWS Nova Model Breaking - Production Environment</h1>
        <div class="info">
            <p><strong>Environment:</strong> Production</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>Private IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)</p>
        </div>
        <p>This instance is running in a private subnet and accessible only through the Application Load Balancer.</p>
        <p><em>Deployed with Pulumi Infrastructure as Code</em></p>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
systemctl restart httpd
"""

    # Create Key Pair for EC2 instances (commented out - use existing key or create manually)
    # self.key_pair = aws.ec2.KeyPair(
    #   f"{name}-keypair",
    #   key_name=f"{name}-keypair",
    #   public_key="ssh-rsa YOUR_PUBLIC_KEY_HERE", # Replace with your actual public key
    #   tags={
    #     **tags,
    #     "Name": f"{name}-keypair"
    #   },
    #   opts=ResourceOptions(parent=self)
    # )

    # Create Launch Template for EC2 instances
    self.launch_template = aws.ec2.LaunchTemplate(
      f"{name}-lt",
      name=f"{name}-launch-template",
      description="Launch template for EC2 instances",
      image_id=self.ami.id,
      instance_type="t3.micro",
      # key_name=self.key_pair.key_name,  # Uncomment if using key pair above
      vpc_security_group_ids=[self.ec2_security_group.id],
      user_data=pulumi.Output.from_input(self.user_data).apply(
        lambda ud: base64.b64encode(ud.encode()).decode()
      ),
      tag_specifications=[
        {
          "resource_type": "instance",
          "tags": {
            **tags,
            "Name": f"{name}-instance"
          }
        }
      ],
      opts=ResourceOptions(parent=self)
    )

    # Create EC2 instances in private subnets
    self.instances = []
    self.instance_ids = []

    # Get private subnet IDs as a list to iterate over
    subnet_count = 2  # We know we have 2 private subnets

    for i in range(subnet_count):
      instance = aws.ec2.Instance(
        f"{name}-instance-{i+1}",
        ami=self.ami.id,
        instance_type="t3.micro",
        # key_name=self.key_pair.key_name,  # Uncomment if using key pair above
        vpc_security_group_ids=[self.ec2_security_group.id],
        subnet_id=private_subnet_ids[i],  # Use subnet by index
        user_data=self.user_data,
        tags={
          **tags,
          "Name": f"{name}-instance-{i+1}"
        },
        opts=ResourceOptions(parent=self)
      )
      self.instances.append(instance)
      self.instance_ids.append(instance.id)

    # Create Auto Scaling Group
    self.auto_scaling_group = aws.autoscaling.Group(
      f"{name}-asg",
      name=f"{name}-asg",
      vpc_zone_identifiers=private_subnet_ids,
      target_group_arns=[target_group_arn],
      health_check_type="ELB",
      health_check_grace_period=300,
      launch_template={
        "id": self.launch_template.id,
        "version": "$Latest"
      },
      min_size=2,
      max_size=4,
      desired_capacity=2,
      tags=[
        {
          "key": "Name",
          "value": f"{name}-asg-instance",
          "propagate_at_launch": True
        },
        {
          "key": "Environment",
          "value": tags.get("Environment", "Production"),
          "propagate_at_launch": True
        }
      ],
      opts=ResourceOptions(parent=self)
    )

    # Create Target Group Attachments for manual instances
    self.target_group_attachments = []
    for i, instance in enumerate(self.instances):
      attachment = aws.lb.TargetGroupAttachment(
        f"{name}-tg-attachment-{i+1}",
        target_group_arn=target_group_arn,
        target_id=instance.id,
        port=80,
        opts=ResourceOptions(parent=self)
      )
      self.target_group_attachments.append(attachment)

    # Register outputs
    self.register_outputs({
      "instance_ids": self.instance_ids,
      "ec2_security_group_id": self.ec2_security_group.id,
      "launch_template_id": self.launch_template.id,
      "auto_scaling_group_name": self.auto_scaling_group.name,
      # "key_pair_name": self.key_pair.key_name  # Uncomment if using key pair
    })
