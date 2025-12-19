"""Compute Stack - ALB, Auto Scaling Group, Launch Template."""

import base64
from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate,
    LaunchTemplateIamInstanceProfile,
    LaunchTemplateMetadataOptions,
    LaunchTemplateMonitoring,
)
from cdktf_cdktf_provider_aws.autoscaling_group import (
    AutoscalingGroup,
    AutoscalingGroupLaunchTemplate,
    AutoscalingGroupTag,
)
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_acm_certificate import DataAwsAcmCertificate


class ComputeStack(Construct):
    """Compute infrastructure for Node.js API servers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        private_subnet_ids: list,
        alb_security_group_id: str,
        api_security_group_id: str,
        instance_profile_arn: str,
        waf_web_acl_id: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize compute stack."""
        super().__init__(scope, construct_id)

        # Application Load Balancer
        self._alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            enable_http2=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
            },
        )

        # Target Group
        self._target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"payment-tg-{environment_suffix}",
            port=3000,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200",
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
            },
        )

        # ALB Listener (HTTPS would require ACM certificate)
        # For demo purposes, using HTTP listener
        # In production, use HTTPS with ACM certificate
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=self._alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self._target_group.arn,
                )
            ],
        )

        # Associate WAF with ALB
        Wafv2WebAclAssociation(
            self,
            "waf_alb_association",
            resource_arn=self._alb.arn,
            web_acl_arn=waf_web_acl_id,
        )

        # Get latest Amazon Linux 2023 AMI
        ami = DataAwsAmi(
            self,
            "amazon_linux_2023",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-*-x86_64"],
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"],
                ),
            ],
        )

        # User Data Script for Node.js API
        user_data = f"""#!/bin/bash
# Update system
dnf update -y

# Install Node.js 18
dnf install -y nodejs npm

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Create app directory
mkdir -p /opt/payment-api
cd /opt/payment-api

# Create a simple Node.js API (placeholder)
cat > index.js << 'EOF'
const http = require('http');
const port = 3000;

const server = http.createServer((req, res) => {{
  if (req.url === '/health') {{
    res.writeHead(200, {{'Content-Type': 'application/json'}});
    res.end(JSON.stringify({{ status: 'healthy', environment: '{environment_suffix}' }}));
  }} else {{
    res.writeHead(200, {{'Content-Type': 'application/json'}});
    res.end(JSON.stringify({{ message: 'Payment API', environment: '{environment_suffix}' }}));
  }}
}});

server.listen(port, '0.0.0.0', () => {{
  console.log('Payment API listening on port ' + port);
}});
EOF

# Create systemd service
cat > /etc/systemd/system/payment-api.service << 'SVCEOF'
[Unit]
Description=Payment API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-api
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

# Start service
systemctl daemon-reload
systemctl enable payment-api
systemctl start payment-api
"""

        # Encode user_data in base64 for launch template
        user_data_encoded = base64.b64encode(user_data.encode('utf-8')).decode('utf-8')

        # Launch Template
        launch_template = LaunchTemplate(
            self,
            "launch_template",
            name=f"payment-api-lt-{environment_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            vpc_security_group_ids=[api_security_group_id],
            user_data=user_data_encoded,
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=instance_profile_arn,
            ),
            metadata_options=LaunchTemplateMetadataOptions(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1,
            ),
            monitoring=LaunchTemplateMonitoring(
                enabled=True,
            ),
            tags={
                "Name": f"payment-api-lt-{environment_suffix}",
            },
        )

        # Auto Scaling Group
        self._asg = AutoscalingGroup(
            self,
            "asg",
            name=f"payment-api-asg-{environment_suffix}",
            min_size=2,
            max_size=6,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self._target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=AutoscalingGroupLaunchTemplate(
                id=launch_template.id,
                version="$Latest",
            ),
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"payment-api-{environment_suffix}",
                    propagate_at_launch=True,
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment_suffix,
                    propagate_at_launch=True,
                ),
            ],
        )

    @property
    def alb_dns_name(self) -> str:
        """Return ALB DNS name."""
        return self._alb.dns_name

    @property
    def alb_arn(self) -> str:
        """Return ALB ARN."""
        return self._alb.arn

    @property
    def alb_arn_suffix(self) -> str:
        """Return ALB ARN suffix."""
        return self._alb.arn_suffix

    @property
    def alb_target_group_arn_suffix(self) -> str:
        """Return target group ARN suffix."""
        return self._target_group.arn_suffix

    @property
    def asg_name(self) -> str:
        """Return Auto Scaling Group name."""
        return self._asg.name
