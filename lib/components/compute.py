import base64

import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, InvokeOptions


class ComputeComponent(ComponentResource):
  def __init__(self, name: str, config_data: dict, opts: ResourceOptions = None):
    super().__init__('custom:compute:ComputeComponent', name, None, opts)
    
    self.region = config_data['region']
    self.config = config_data['config']
    self.dependencies = config_data['dependencies']

    # Get latest Amazon Linux 2 AMI for the specific region
    invoke_opts = InvokeOptions(provider=opts.provider) if opts and opts.provider else None
    ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[
        {"name": "name", "values": ["amzn2-ami-hvm-*"]},
        {"name": "architecture", "values": ["x86_64"]}
      ],
      opts=invoke_opts
    )
    self.ami_id = ami.id

    # Create Launch Template
    self._create_launch_template(name)

    # Create Application Load Balancer
    self._create_alb(name)

    # Create Auto Scaling Group
    self._create_asg(name)

    self.register_outputs({
      "alb_arn": self.alb.arn,
      "alb_dns_name": self.alb.dns_name,
      "target_group_arn": self.target_group.arn
    })

  def _create_launch_template(self, name: str):
    # User data script for EC2 instances
    user_data_script = f"""#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent awslogs

# Install application dependencies
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
    "logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/{self.config.app_name}-{self.config.environment}",
                        "log_stream_name": "{{instance_id}}/messages"
                    }},
                    {{
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/{self.config.app_name}-{self.config.environment}",
                        "log_stream_name": "{{instance_id}}/secure"
                    }},
                    {{
                        "file_path": "/var/log/docker",
                        "log_group_name": "/aws/ec2/{self.config.app_name}-{self.config.environment}",
                        "log_stream_name": "{{instance_id}}/docker"
                    }}
                ]
            }}
        }}
    }},
    "metrics": {{
        "namespace": "AWS/EC2/Custom",
        "metrics_collected": {{
            "mem": {{
                "measurement": ["mem_used_percent"]
            }},
            "disk": {{
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure awslogs
cat > /etc/awslogs/awslogs.conf << 'EOF'
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = /aws/ec2/{self.config.app_name}-{self.config.environment}
log_stream_name = {{instance_id}}/messages

[/var/log/secure]
file = /var/log/secure
log_group_name = /aws/ec2/{self.config.app_name}-{self.config.environment}
log_stream_name = {{instance_id}}/secure
EOF

systemctl start awslogsd
systemctl enable awslogsd

# Create application directory
mkdir -p /opt/app

# Create health check endpoint
cat > /opt/app/health.py << 'EOF'
#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({{"status": "healthy"}}).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 80), HealthHandler)
    server.serve_forever()
EOF

# Start health check service
python3 /opt/app/health.py &

# Signal successful completion
/opt/aws/bin/cfn-signal -e $? --stack {self.config.app_name}-{self.config.environment} --resource AutoScalingGroup --region {self.region}
"""

    user_data = base64.b64encode(user_data_script.encode()).decode()

    self.launch_template = aws.ec2.LaunchTemplate(
      f"{name}-lt",
      image_id=self.ami_id,
      instance_type=self.config.compute.instance_type,
      vpc_security_group_ids=[self.dependencies.ec2_sg_id],
      user_data=user_data,
      iam_instance_profile={"name": self.dependencies.instance_profile_name},
      metadata_options={
        "http_endpoint": "enabled",
        "http_tokens": "required",  # Enforce IMDSv2
        "http_put_response_hop_limit": 2,
        "instance_metadata_tags": "enabled"
      },
      monitoring={"enabled": self.config.compute.enable_detailed_monitoring},
      block_device_mappings=[{
        "device_name": "/dev/xvda",
        "ebs": {
          "volume_size": 20,
          "volume_type": "gp3",
          "encrypted": True,
          "delete_on_termination": True
        }
      }],
      tag_specifications=[{
        "resource_type": "instance",
        "tags": {
          **self.config.tags,
          "Name": f"{self.config.app_name}-{self.config.environment}-instance"
        }
      }],
      tags={
        **self.config.tags,
        "Name": f"{self.config.app_name}-{self.config.environment}-lt"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_alb(self, name: str):
    # Application Load Balancer
    self.alb = aws.lb.LoadBalancer(
      f"{name}-alb",
      load_balancer_type="application",
      subnets=self.dependencies.public_subnet_ids,
      security_groups=[self.dependencies.alb_sg_id],
      enable_deletion_protection=False,  # Set to True for production
      enable_cross_zone_load_balancing=True,
      enable_http2=True,
      tags={
        **self.config.tags,
        "Name": f"{self.config.app_name}-{self.config.environment}-alb"
      },
      opts=ResourceOptions(parent=self)
    )

    # Target Group
    self.target_group = aws.lb.TargetGroup(
      f"{name}-tg",
      port=80,
      protocol="HTTP",
      vpc_id=self.dependencies.vpc_id,
      target_type="instance",
      health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "interval": 30,
        "matcher": "200",
        "path": "/health",
        "port": "traffic-port",
        "protocol": "HTTP",
        "timeout": 5,
        "unhealthy_threshold": 3
      },
      tags={
        **self.config.tags,
        "Name": f"{self.config.app_name}-{self.config.environment}-tg"
      },
      opts=ResourceOptions(parent=self)
    )

    # HTTPS Listener
    self.https_listener = aws.lb.Listener(
      f"{name}-https-listener",
      load_balancer_arn=self.alb.arn,
      port=443,
      protocol="HTTPS",
      ssl_policy=self.config.security.ssl_policy,
      certificate_arn=self.dependencies.certificate_arn,
      default_actions=[{
        "type": "forward",
        "target_group_arn": self.target_group.arn
      }],
      opts=ResourceOptions(parent=self)
    )

    # HTTP Listener (redirect to HTTPS)
    self.http_listener = aws.lb.Listener(
      f"{name}-http-listener",
      load_balancer_arn=self.alb.arn,
      port=80,
      protocol="HTTP",
      default_actions=[{
        "type": "redirect",
        "redirect": {
          "port": "443",
          "protocol": "HTTPS",
          "status_code": "HTTP_301"
        }
      }],
      opts=ResourceOptions(parent=self)
    )

  def _create_asg(self, name: str):
    # Auto Scaling Group
    self.asg = aws.autoscaling.Group(
      f"{name}-asg",
      vpc_zone_identifiers=self.dependencies.private_subnet_ids,
      target_group_arns=[self.target_group.arn],
      health_check_type="ELB",
      health_check_grace_period=300,
      min_size=self.config.compute.min_size,
      max_size=self.config.compute.max_size,
      desired_capacity=self.config.compute.desired_capacity,
      launch_template={
        "id": self.launch_template.id,
        "version": "$Latest"
      },
      enabled_metrics=[
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances"
      ],
      tags=[{
        "key": "Name",
        "value": f"{self.config.app_name}-{self.config.environment}-asg",
        "propagate_at_launch": True
      }, {
        "key": "Environment",
        "value": self.config.environment,
        "propagate_at_launch": True
      }, {
        "key": "Application",
        "value": self.config.app_name,
        "propagate_at_launch": True
      }],
      opts=ResourceOptions(parent=self)
    )

    # Auto Scaling Policies
    self.scale_up_policy = aws.autoscaling.Policy(
      f"{name}-scale-up",
      scaling_adjustment=1,
      adjustment_type="ChangeInCapacity",
      cooldown=300,
      autoscaling_group_name=self.asg.name,
      opts=ResourceOptions(parent=self)
    )

    self.scale_down_policy = aws.autoscaling.Policy(
      f"{name}-scale-down",
      scaling_adjustment=-1,
      adjustment_type="ChangeInCapacity",
      cooldown=300,
      autoscaling_group_name=self.asg.name,
      opts=ResourceOptions(parent=self)
    )

    # CloudWatch Alarms for Auto Scaling
    aws.cloudwatch.MetricAlarm(
      f"{name}-cpu-high",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=120,
      statistic="Average",
      threshold=80,
      alarm_description="This metric monitors ec2 cpu utilization",
      alarm_actions=[self.scale_up_policy.arn],
      dimensions={
        "AutoScalingGroupName": self.asg.name
      },
      tags=self.config.tags,
      opts=ResourceOptions(parent=self)
    )

    aws.cloudwatch.MetricAlarm(
      f"{name}-cpu-low",
      comparison_operator="LessThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=120,
      statistic="Average",
      threshold=30,
      alarm_description="This metric monitors ec2 cpu utilization",
      alarm_actions=[self.scale_down_policy.arn],
      dimensions={
        "AutoScalingGroupName": self.asg.name
      },
      tags=self.config.tags,
      opts=ResourceOptions(parent=self)
    )
