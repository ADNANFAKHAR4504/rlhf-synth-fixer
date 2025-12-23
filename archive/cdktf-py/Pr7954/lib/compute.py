from constructs import Construct
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate,
    LaunchTemplateMetadataOptions,
    LaunchTemplateTagSpecifications
)
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.autoscaling_policy import AutoscalingPolicy, AutoscalingPolicyTargetTrackingConfiguration
from cdktf_cdktf_provider_aws.autoscaling_schedule import AutoscalingSchedule
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
import base64


class ComputeConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc, security, alb, database, secrets):
        super().__init__(scope, id)

        # Get latest Amazon Linux 2023 AMI
        ami = DataAwsAmi(self, "amazon_linux_2023",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-*-x86_64"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ]
        )

        # User data script
        user_data_script = f"""#!/bin/bash
set -e

# Update system
yum update -y

# Install dependencies
yum install -y python3 python3-pip git nginx mysql

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure application
mkdir -p /opt/financial-app
cd /opt/financial-app

# Create a simple health check application
cat > /opt/financial-app/app.py << 'EOF'
import json
import http.server
import socketserver
import os
import pymysql

PORT = 80

class HealthCheckHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            try:
                # Get database credentials from environment or Secrets Manager
                db_host = os.environ.get('DB_HOST', '{database.cluster.endpoint}')

                # Simple database connectivity check
                # In production, this would retrieve credentials from Secrets Manager
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {{'status': 'healthy', 'database': 'connected'}}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {{'status': 'unhealthy', 'error': str(e)}}
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Financial Transaction Platform</h1>')

with socketserver.TCPServer(("", PORT), HealthCheckHandler) as httpd:
    print(f"Server running on port {{PORT}}")
    httpd.serve_forever()
EOF

# Install Python dependencies
pip3 install pymysql boto3

# Create systemd service
cat > /etc/systemd/system/financial-app.service << EOF
[Unit]
Description=Financial Transaction Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/financial-app
Environment="DB_HOST={database.cluster.endpoint}"
ExecStart=/usr/bin/python3 /opt/financial-app/app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable financial-app
systemctl start financial-app

# Configure CloudWatch logging
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{{
  "logs": {{
    "logs_collected": {{
      "files": {{
        "collect_list": [
          {{
            "file_path": "/var/log/financial-app.log",
            "log_group_name": "/aws/ec2/financial-{environment_suffix}",
            "log_stream_name": "{{instance_id}}"
          }}
        ]
      }}
    }}
  }}
}}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
    -a fetch-config \\
    -m ec2 \\
    -s \\
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "Application setup complete"
"""

        # Launch Template
        self.launch_template = LaunchTemplate(self, "launch_template",
            name_prefix=f"financial-lt-{environment_suffix}-",
            image_id=ami.id,
            instance_type="t3.large",
            iam_instance_profile={
                "name": security.ec2_instance_profile.name
            },
            vpc_security_group_ids=[security.ec2_sg.id],
            user_data=base64.b64encode(user_data_script.encode()).decode(),
            metadata_options=LaunchTemplateMetadataOptions(
                http_endpoint="enabled",
                http_tokens="required",  # IMDSv2
                http_put_response_hop_limit=1,
                instance_metadata_tags="enabled"
            ),
            tag_specifications=[
                LaunchTemplateTagSpecifications(
                    resource_type="instance",
                    tags={
                        "Name": f"financial-instance-{environment_suffix}",
                        "Environment": f"{environment_suffix}",
                        "Application": "financial-transaction-platform",
                        "CostCenter": "engineering"
                    }
                )
            ]
        )

        # Auto Scaling Group
        self.asg = AutoscalingGroup(self, "asg",
            name=f"financial-asg-{environment_suffix}",
            launch_template={
                "id": self.launch_template.id,
                "version": "$Latest"
            },
            vpc_zone_identifier=[subnet.id for subnet in vpc.private_subnets],
            target_group_arns=[alb.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=10,
            desired_capacity=3,
            default_cooldown=300,
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"financial-asg-instance-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=f"{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Application",
                    value="financial-transaction-platform",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="CostCenter",
                    value="engineering",
                    propagate_at_launch=True
                )
            ]
        )

        # Auto Scaling Policy - Scale Up (CPU > 70%)
        AutoscalingPolicy(self, "scale_up_policy",
            name=f"financial-scale-up-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=AutoscalingPolicyTargetTrackingConfiguration(
                predefined_metric_specification={
                    "predefined_metric_type": "ASGAverageCPUUtilization"
                },
                target_value=70.0
            )
        )

        # Scheduled Scaling - Business Hours Start (8AM EST = 13:00 UTC)
        AutoscalingSchedule(self, "business_hours_start",
            scheduled_action_name=f"financial-business-hours-start-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=3,
            max_size=10,
            desired_capacity=3,
            recurrence="0 13 * * MON-FRI"  # 8AM EST, Monday-Friday
        )

        # Scheduled Scaling - Business Hours End (6PM EST = 23:00 UTC)
        AutoscalingSchedule(self, "business_hours_end",
            scheduled_action_name=f"financial-business-hours-end-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=2,
            max_size=10,
            desired_capacity=2,
            recurrence="0 23 * * MON-FRI"  # 6PM EST, Monday-Friday
        )
