``````python
#!/usr/bin/env python3

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnParameter,
    CfnOutput,
    Tags,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_logs as logs,
    aws_s3_deployment as s3deploy,
)
from constructs import Construct
import json


class CloudMigrationInfrastructureStack(Stack):
    """
    Main infrastructure stack for the CloudMigration project.
    
    This stack creates a complete web application infrastructure including:
    - VPC with public/private subnets
    - EC2 instance with Apache web server
    - S3 bucket for storage and logging
    - CloudFront distribution for content delivery
    - Comprehensive monitoring and alerting
    - Security groups and IAM roles
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Apply project-wide tags to all resources
        Tags.of(self).add("Project", "CloudMigration")
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Owner", "CloudInfrastructureTeam")
        Tags.of(self).add("CostCenter", "IT-Infrastructure")

        # ===== PARAMETERS =====
        self._create_parameters()
        
        # ===== NETWORKING =====
        self._create_vpc_and_subnets()
        
        # ===== STORAGE =====
        self._create_s3_bucket()
        
        # ===== SECURITY =====
        self._create_security_groups()
        self._create_iam_roles()
        
        # ===== COMPUTE =====
        self._create_ec2_instance()
        
        # ===== CONTENT DELIVERY =====
        self._create_cloudfront_distribution()
        
        # ===== MONITORING =====
        self._create_monitoring_and_alerting()
        
        # ===== OUTPUTS =====
        self._create_outputs()

    def _create_parameters(self):
        """Create CloudFormation parameters for stack customization."""
        
        self.instance_type_param = CfnParameter(
            self, "InstanceType",
            type="String",
            default="t3.micro",
            allowed_values=["t3.micro", "t3.small", "t3.medium", "t3.large"],
            description="EC2 instance type for the web server",
            constraint_description="Must be a valid EC2 instance type"
        )
        
        self.key_pair_param = CfnParameter(
            self, "KeyPairName",
            type="String",
            default="cloudmigration-cdkpy-task",
            description="Name of the EC2 Key Pair for SSH access",
            min_length=1,
            max_length=255
        )
        
        self.ssh_ip_param = CfnParameter(
            self, "AllowedSSHIP",
            type="String",
            default="192.168.1.1/32",
            description="IP address allowed for SSH access (CIDR format)",
            allowed_pattern=r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$",
            constraint_description="Must be a valid CIDR notation (e.g., 192.168.1.1/32)"
        )
        
        self.notification_email_param = CfnParameter(
            self, "NotificationEmail",
            type="String",
            description="Email address for CloudWatch alarm notifications",
            allowed_pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            constraint_description="Must be a valid email address"
        )
        
        self.cpu_threshold_param = CfnParameter(
            self, "CPUAlarmThreshold",
            type="Number",
            default=80,
            min_value=1,
            max_value=100,
            description="CPU utilization threshold for CloudWatch alarm (%)"
        )

    def _create_vpc_and_subnets(self):
        """Create VPC with public and private subnets."""
        
        # Create VPC with DNS support
        self.vpc = ec2.Vpc(
            self, "CloudMigrationVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            enable_dns_hostnames=True,
            enable_dns_support=True,
            max_azs=2,  # Use 2 AZs for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,  # 10.0.1.0/24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,  # 10.0.2.0/24
                )
            ]
        )
        
        # Get the first public and private subnets
        self.public_subnet = self.vpc.public_subnets[0]
        self.private_subnet = self.vpc.private_subnets[0]
        
        # Enable VPC Flow Logs for security monitoring
        flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/VPCFlowLogsDeliveryRolePolicy")
            ]
        )
        
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, "VPCFlowLogGroup",
                    retention=logs.RetentionDays.ONE_MONTH,
                    removal_policy=RemovalPolicy.DESTROY
                ),
                flow_log_role
            )
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for logs and static content with security best practices."""
        
        # Create access logging bucket first
        self.access_log_bucket = s3.Bucket(
            self, "AccessLogBucket",
            bucket_name=f"cloudmigration-access-logs-{self.account}-{self.region}",
            versioned=False,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="AccessLogLifecycle",
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(60)
                        )
                    ]
                )
            ]
        )
        
        # Main S3 bucket for application data and logs
        self.s3_bucket = s3.Bucket(
            self, "CloudMigrationS3Bucket",
            bucket_name="cloudmigration-s3",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=self.access_log_bucket,
            server_access_logs_prefix="main-bucket-access-logs/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRotationRule",
                    enabled=True,
                    prefix="logs/",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(365)
                        )
                    ],
                    expiration=Duration.days(2555)  # 7 years retention
                ),
                s3.LifecycleRule(
                    id="IncompleteMultipartUploads",
                    enabled=True,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )
        
        # CloudFront access logging bucket
        self.cloudfront_log_bucket = s3.Bucket(
            self, "CloudFrontLogBucket",
            bucket_name=f"cloudmigration-cloudfront-logs-{self.account}-{self.region}",
            versioned=False,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="CloudFrontLogLifecycle",
                    enabled=True,
                    expiration=Duration.days(365),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )

    def _create_security_groups(self):
        """Create security groups for web traffic and SSH access."""
        
        # Web traffic security group
        self.web_sg = ec2.SecurityGroup(
            self, "WebTrafficSecurityGroup",
            vpc=self.vpc,
            description="Security group for web traffic (HTTP/HTTPS)",
            allow_all_outbound=True
        )
        
        # Add inbound rules for web traffic
        self.web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from anywhere"
        )
        
        self.web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from anywhere"
        )
        
        # SSH access security group
        self.ssh_sg = ec2.SecurityGroup(
            self, "SSHAccessSecurityGroup",
            vpc=self.vpc,
            description="Security group for SSH access",
            allow_all_outbound=False
        )
        
        # Add SSH rule with parameterized IP
        self.ssh_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.ssh_ip_param.value_as_string),
            connection=ec2.Port.tcp(22),
            description=f"Allow SSH access from {self.ssh_ip_param.value_as_string}"
        )
        
        # Add outbound rules for SSH security group
        self.ssh_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS outbound for package updates"
        )
        
        self.ssh_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP outbound for package updates"
        )

    def _create_iam_roles(self):
        """Create IAM roles and policies for EC2 instance."""
        
        # Create IAM role for EC2 instance
        self.ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for CloudMigration EC2 instance",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Custom policy for S3 access (least privilege)
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            resources=[
                self.s3_bucket.bucket_arn,
                f"{self.s3_bucket.bucket_arn}/*"
            ]
        )
        
        # Custom policy for CloudWatch metrics
        cloudwatch_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogStreams"
            ],
            resources=["*"]
        )
        
        # Add policies to role
        self.ec2_role.add_to_policy(s3_policy)
        self.ec2_role.add_to_policy(cloudwatch_policy)
        
        # Create instance profile
        self.instance_profile = iam.CfnInstanceProfile(
            self, "EC2InstanceProfile",
            roles=[self.ec2_role.role_name]
        )

    def _create_ec2_instance(self):
        """Create EC2 instance with Apache web server and monitoring."""
        
        # User data script for instance initialization
        user_data_script = f"""#!/bin/bash
set -e

# Update system packages
apt-get update -y
apt-get upgrade -y

# Install required packages
apt-get install -y apache2 awscli amazon-cloudwatch-agent htop curl wget unzip

# Configure Apache
systemctl start apache2
systemctl enable apache2

# Create custom index.html with instance information
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CloudMigration Web Server</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }}
        .container {{ background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ color: #232F3E; border-bottom: 2px solid #FF9900; padding-bottom: 10px; }}
        .info {{ margin: 20px 0; }}
        .metric {{ background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #FF9900; }}
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🚀 CloudMigration Web Server</h1>
        <div class="info">
            <h2>Instance Information</h2>
            <div class="metric"><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></div>
            <div class="metric"><strong>Instance Type:</strong> <span id="instance-type">Loading...</span></div>
            <div class="metric"><strong>Availability Zone:</strong> <span id="az">Loading...</span></div>
            <div class="metric"><strong>Public IP:</strong> <span id="public-ip">Loading...</span></div>
            <div class="metric"><strong>Private IP:</strong> <span id="private-ip">Loading...</span></div>
            <div class="metric"><strong>Server Time:</strong> <span id="server-time">Loading...</span></div>
        </div>
        <div class="info">
            <h2>System Status</h2>
            <div class="metric"><strong>Apache Status:</strong> <span style="color: green;">✅ Running</span></div>
            <div class="metric"><strong>CloudWatch Agent:</strong> <span style="color: green;">✅ Active</span></div>
        </div>
    </div>
    
    <script>
        // Fetch instance metadata
        function fetchMetadata() {{
            const token = fetch('http://169.254.169.254/latest/api/token', {{
                method: 'PUT',
                headers: {{ 'X-aws-ec2-metadata-token-ttl-seconds': '21600' }}
            }})
            .then(response => response.text())
            .then(token => {{
                const headers = {{ 'X-aws-ec2-metadata-token': token }};
                
                Promise.all([
                    fetch('http://169.254.169.254/latest/meta-data/instance-id', {{ headers }}).then(r => r.text()),
                    fetch('http://169.254.169.254/latest/meta-data/instance-type', {{ headers }}).then(r => r.text()),
                    fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone', {{ headers }}).then(r => r.text()),
                    fetch('http://169.254.169.254/latest/meta-data/public-ipv4', {{ headers }}).then(r => r.text()),
                    fetch('http://169.254.169.254/latest/meta-data/local-ipv4', {{ headers }}).then(r => r.text())
                ]).then(([instanceId, instanceType, az, publicIp, privateIp]) => {{
                    document.getElementById('instance-id').textContent = instanceId;
                    document.getElementById('instance-type').textContent = instanceType;
                    document.getElementById('az').textContent = az;
                    document.getElementById('public-ip').textContent = publicIp;
                    document.getElementById('private-ip').textContent = privateIp;
                    document.getElementById('server-time').textContent = new Date().toLocaleString();
                }});
            }});
        }}
        
        fetchMetadata();
        setInterval(() => {{
            document.getElementById('server-time').textContent = new Date().toLocaleString();
        }}, 1000);
    </script>
</body>
</html>
EOF

# Configure Apache logging
mkdir -p /var/log/apache2/custom
chown www-data:www-data /var/log/apache2/custom

# Configure log rotation
cat > /etc/logrotate.d/apache2-custom << 'EOF'
/var/log/apache2/custom/*.log {{
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    postrotate
        /usr/bin/systemctl reload apache2 > /dev/null 2>&1 || true
    endrotate
}}
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
    "agent": {{
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    }},
    "metrics": {{
        "namespace": "CloudMigration/EC2",
        "metrics_collected": {{
            "cpu": {{
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            }},
            "disk": {{
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            }},
            "diskio": {{
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            }},
            "mem": {{
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }},
            "netstat": {{
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            }},
            "swap": {{
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }}
        }}
    }},
    "logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/apache2/access.log",
                        "log_group_name": "/aws/ec2/apache/access",
                        "log_stream_name": "{{instance_id}}"
                    }},
                    {{
                        "file_path": "/var/log/apache2/error.log",
                        "log_group_name": "/aws/ec2/apache/error",
                        "log_stream_name": "{{instance_id}}"
                    }}
                ]
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create log upload script
cat > /usr/local/bin/upload-logs-to-s3.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
S3_BUCKET="{self.s3_bucket.bucket_name}"

# Compress and upload Apache logs
tar -czf /tmp/apache-logs-$DATE.tar.gz /var/log/apache2/*.log
aws s3 cp /tmp/apache-logs-$DATE.tar.gz s3://$S3_BUCKET/logs/apache/$INSTANCE_ID/$DATE/
rm -f /tmp/apache-logs-$DATE.tar.gz

# Compress and upload system logs
tar -czf /tmp/system-logs-$DATE.tar.gz /var/log/syslog /var/log/auth.log
aws s3 cp /tmp/system-logs-$DATE.tar.gz s3://$S3_BUCKET/logs/system/$INSTANCE_ID/$DATE/
rm -f /tmp/system-logs-$DATE.tar.gz
EOF

chmod +x /usr/local/bin/upload-logs-to-s3.sh

# Schedule log uploads (daily at 2 AM)
echo "0 2 * * * root /usr/local/bin/upload-logs-to-s3.sh" >> /etc/crontab

# Configure Apache virtual host for better monitoring
cat > /etc/apache2/sites-available/cloudmigration.conf << 'EOF'
<VirtualHost *:80>
    ServerName cloudmigration
    DocumentRoot /var/www/html
    
    # Custom log format for better analytics
    LogFormat "%h %l %u %t \\"%r\\" %>s %O \\"%{{Referer}}i\\" \\"%{{User-Agent}}i\\" %D" combined_with_time
    CustomLog /var/log/apache2/custom/access.log combined_with_time
    ErrorLog /var/log/apache2/custom/error.log
    
    # Enable server status for monitoring
    <Location "/server-status">
        SetHandler server-status
        Require ip 127.0.0.1
        Require ip 10.0.0.0/16
    </Location>
    
    # Enable server info
    <Location "/server-info">
        SetHandler server-info
        Require ip 127.0.0.1
        Require ip 10.0.0.0/16
    </Location>
</VirtualHost>
EOF

# Enable the site and required modules
a2enmod status
a2enmod info
a2ensite cloudmigration.conf
a2dissite 000-default.conf
systemctl restart apache2

# Install and configure fail2ban for additional security
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Create a simple health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for monitoring

# Check Apache status
if ! systemctl is-active --quiet apache2; then
    echo "ERROR: Apache is not running"
    exit 1
fi

# Check disk space (alert if less than 20% free)
DISK_USAGE=$(df / | awk 'NR==2 {{print $5}}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is $DISK_USAGE%"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{{printf("%.1f", $3/$2 * 100.0)}}')
echo "Memory usage: $MEM_USAGE%"

# Check if CloudWatch agent is running
if ! systemctl is-active --quiet amazon-cloudwatch-agent; then
    echo "WARNING: CloudWatch agent is not running"
fi

echo "Health check completed successfully"
EOF

chmod +x /usr/local/bin/health-check.sh

# Schedule health checks every 5 minutes
echo "*/5 * * * * root /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1" >> /etc/crontab

# Final system restart to ensure all services are running
systemctl restart cron
systemctl restart apache2

echo "Instance initialization completed successfully!"
"""

        # Get the latest Ubuntu AMI
        ubuntu_ami = ec2.MachineImage.latest_amazon_linux2023(
            cpu_type=ec2.AmazonLinuxCpuType.X86_64
        )
        
        # Create EC2 instance
        self.ec2_instance = ec2.Instance(
            self, "CloudMigrationWebServer",
            instance_type=ec2.InstanceType(self.instance_type_param.value_as_string),
            machine_image=ubuntu_ami,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnets=[self.public_subnet]),
            security_groups=[self.web_sg, self.ssh_sg],
            role=self.ec2_role,
            key_name=self.key_pair_param.value_as_string,
            user_data=ec2.UserData.custom(user_data_script),
            require_imdsv2=True,  # Security best practice
            detailed_monitoring=True,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        delete_on_termination=True
                    )
                )
            ]
        )

    def _create_cloudfront_distribution(self):
        """Create CloudFront distribution with S3 origin."""
        
        # Create Origin Access Control (OAC) for secure S3 access
        oac = cloudfront.OriginAccessControl(
            self, "S3OriginAccessControl",
            origin_access_control_origin_type=cloudfront.OriginAccessControlOriginType.S3,
            signing=cloudfront.Signing.SIGV4_ALWAYS
        )
        
        # Create CloudFront distribution
        self.cloudfront_distribution = cloudfront.Distribution(
            self, "CloudMigrationDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    bucket=self.s3_bucket,
                    origin_access_control=oac
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_