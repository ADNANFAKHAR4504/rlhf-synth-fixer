"""Compute infrastructure module with ALB and Auto Scaling Group."""

import base64
from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import (
    LbTargetGroup,
    LbTargetGroupHealthCheck,
)
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate,
    LaunchTemplateIamInstanceProfile,
    LaunchTemplateMonitoring,
    LaunchTemplateMetadataOptions,
    LaunchTemplateTagSpecifications,
)
from cdktf_cdktf_provider_aws.autoscaling_group import (
    AutoscalingGroup,
    AutoscalingGroupTag,
)
from cdktf_cdktf_provider_aws.autoscaling_schedule import AutoscalingSchedule
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
# ACM imports commented out - certificate must be created manually for production
# from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate
# from cdktf_cdktf_provider_aws.acm_certificate_validation import AcmCertificateValidation
# from cdktf_cdktf_provider_aws.route53_record import Route53Record


class ComputeInfrastructure(Construct):
    """Compute infrastructure with ALB and Auto Scaling."""

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        private_subnet_ids: list,
        alb_security_group_id: str,
        app_security_group_id: str,
        instance_profile_name: str,
        waf_web_acl_arn: str,
        db_endpoint: str,
        s3_bucket_name: str,
    ):
        """
        Initialize compute infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            vpc_id: VPC ID
            public_subnet_ids: List of public subnet IDs
            private_subnet_ids: List of private subnet IDs
            alb_security_group_id: Security group ID for ALB
            app_security_group_id: Security group ID for application
            instance_profile_name: IAM instance profile name
            waf_web_acl_arn: WAF Web ACL ARN
            db_endpoint: Database endpoint
            s3_bucket_name: S3 bucket name for static content
        """
        super().__init__(scope, construct_id)

        # Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
            },
        )

        # Target Group
        self.target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"payment-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                port="traffic-port",
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                matcher="200",
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
            },
        )

        # ALB Listener (HTTP redirect to HTTPS)
        LbListener(
            self,
            "http_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="redirect",
                    redirect={
                        "port": "443",
                        "protocol": "HTTPS",
                        "status_code": "HTTP_301",
                    },
                )
            ],
        )

        # ALB Listener (Port 443)
        # NOTE: HTTPS/TLS Configuration
        # For production deployment with valid domain:
        #   1. Request ACM certificate manually in AWS Console or CLI
        #   2. Validate certificate via DNS (requires Route 53 or DNS provider access)
        #   3. Pass certificate ARN via environment variable or parameter
        #   4. Uncomment certificate_arn line below
        #
        # For automated testing/demo without domain:
        #   - Using HTTP protocol temporarily to allow deployment
        #   - In production, MUST use HTTPS with valid certificate for PCI DSS 4.1 compliance

        # Production HTTPS configuration (requires valid certificate ARN):
        # self.https_listener = LbListener(
        #     self,
        #     "https_listener",
        #     load_balancer_arn=self.alb.arn,
        #     port=443,
        #     protocol="HTTPS",
        #     ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06",
        #     certificate_arn="arn:aws:acm:us-east-2:ACCOUNT:certificate/CERT_ID",  # Replace with actual ARN
        #     default_action=[
        #         LbListenerDefaultAction(
        #             type="forward",
        #             target_group_arn=self.target_group.arn,
        #         )
        #     ],
        # )

        # Temporary HTTP configuration for testing (remove in production)
        self.https_listener = LbListener(
            self,
            "https_listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTP",  # TEMPORARY: Change to HTTPS in production with certificate
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
        )

        # Associate WAF with ALB
        if waf_web_acl_arn:
            Wafv2WebAclAssociation(
                self,
                "waf_association",
                resource_arn=self.alb.arn,
                web_acl_arn=waf_web_acl_arn,
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

        # User data script
        user_data_script = f"""#!/bin/bash
set -e

# Update system
yum update -y

# Install application dependencies
yum install -y python3 python3-pip postgresql15

# Create application directory
mkdir -p /opt/payment-app
cd /opt/payment-app

# Set environment variables
cat > /opt/payment-app/.env << 'EOF'
DB_ENDPOINT={db_endpoint}
S3_BUCKET={s3_bucket_name}
ENVIRONMENT={environment_suffix}
EOF

# Create simple health check endpoint
cat > /opt/payment-app/app.py << 'PYEOF'
from http.server import HTTPServer, BaseHTTPRequestHandler

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), HealthHandler)
    print('Starting server on port 8080')
    server.serve_forever()
PYEOF

# Create systemd service
cat > /etc/systemd/system/payment-app.service << 'EOF'
[Unit]
Description=Payment Processing Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
ExecStart=/usr/bin/python3 /opt/payment-app/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start application
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

echo "Application setup complete"
"""

        # Launch Template
        # Encode user data in Python using base64
        user_data_encoded = base64.b64encode(user_data_script.encode()).decode()

        launch_template = LaunchTemplate(
            self,
            "launch_template",
            name_prefix=f"payment-lt-{environment_suffix}-",
            image_id=ami.id,
            instance_type="t3.medium",
            vpc_security_group_ids=[app_security_group_id],
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                name=instance_profile_name,
            ),
            user_data=user_data_encoded,
            monitoring=LaunchTemplateMonitoring(
                enabled=True,
            ),
            metadata_options=LaunchTemplateMetadataOptions(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1,
            ),
            tag_specifications=[
                LaunchTemplateTagSpecifications(
                    resource_type="instance",
                    tags={
                        "Name": f"payment-app-{environment_suffix}",
                        "Environment": environment_suffix,
                    },
                )
            ],
        )

        # Auto Scaling Group
        self.asg = AutoscalingGroup(
            self,
            "asg",
            name=f"payment-asg-{environment_suffix}",
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=6,
            desired_capacity=3,
            launch_template={
                "id": launch_template.id,
                "version": "$Latest",
            },
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"payment-app-{environment_suffix}",
                    propagate_at_launch=True,
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment_suffix,
                    propagate_at_launch=True,
                ),
            ],
        )

        # Scheduled Scaling - Scale up during business hours
        AutoscalingSchedule(
            self,
            "scale_up",
            scheduled_action_name=f"payment-scale-up-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=3,
            max_size=6,
            desired_capacity=4,
            recurrence="0 8 * * MON-FRI",  # 8 AM weekdays
        )

        # Scheduled Scaling - Scale down after business hours
        AutoscalingSchedule(
            self,
            "scale_down",
            scheduled_action_name=f"payment-scale-down-{environment_suffix}",
            autoscaling_group_name=self.asg.name,
            min_size=2,
            max_size=4,
            desired_capacity=2,
            recurrence="0 18 * * MON-FRI",  # 6 PM weekdays
        )

    @property
    def alb_dns_name(self) -> str:
        """Return ALB DNS name."""
        return self.alb.dns_name

    @property
    def autoscaling_group_name(self) -> str:
        """Return Auto Scaling Group name."""
        return self.asg.name

    @property
    def alb_arn_suffix(self) -> str:
        """Return ALB ARN suffix for CloudWatch metrics."""
        return self.alb.arn_suffix

    @property
    def target_group_arn_suffix(self) -> str:
        """Return Target Group ARN suffix for CloudWatch metrics."""
        return self.target_group.arn_suffix
