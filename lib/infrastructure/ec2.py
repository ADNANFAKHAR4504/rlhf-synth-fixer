import base64

import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class EC2Stack:
    """EC2 launch template and security group configuration."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider, 
                 instance_profile_name: pulumi.Output[str], bucket_name: pulumi.Output[str], 
                 security_group_id: pulumi.Output[str]):
        self.config = config
        self.provider = provider
        self.instance_profile_name = instance_profile_name
        self.bucket_name = bucket_name
        self.security_group_id = security_group_id
        self.launch_template = self._create_launch_template()
    
    
    def _get_latest_amazon_linux_ami(self) -> pulumi.Output[str]:
        """Get the latest Amazon Linux 2 AMI ID."""
        return aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.provider)
        ).id
    
    def _create_user_data_script(self) -> pulumi.Output[str]:
        """Create user data script for EC2 instances."""
        return pulumi.Output.all(self.bucket_name).apply(
            lambda args: f"""#!/bin/bash
# Update system
yum update -y

# Install web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create logs directory
mkdir -p /var/log/webapp

# Configure CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{{
    "logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/httpd/access.log"
                    }},
                    {{
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/httpd/error.log"
                    }},
                    {{
                        "file_path": "/var/log/webapp/application.log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/webapp/application.log"
                    }}
                ]
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create a simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>Welcome to the Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Region: {self.config.region}</p>
    <p>Environment: {self.config.environment}</p>
</body>
</html>
EOF

# Upload logs to S3 (example)
echo "Application started at $(date)" > /var/log/webapp/application.log
aws s3 cp /var/log/webapp/application.log s3://{args[0]}/logs/$(curl -s http://169.254.169.254/latest/meta-data/instance-id)/application.log || true
"""
        )
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """Create launch template for EC2 instances."""
        return aws.ec2.LaunchTemplate(
            "webapp-launch-template",
            name=self.config.launch_template_name,
            image_id=self._get_latest_amazon_linux_ami(),
            instance_type=self.config.instance_type,
            vpc_security_group_ids=[self.security_group_id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            user_data=self._create_user_data_script().apply(
                lambda script: base64.b64encode(script.encode('utf-8')).decode('utf-8')
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self.config.get_common_tags()
                )
            ],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_launch_template_id(self) -> pulumi.Output[str]:
        """Get launch template ID."""
        return self.launch_template.id
    
    def get_security_group_id(self) -> pulumi.Output[str]:
        """Get security group ID."""
        return self.security_group_id
