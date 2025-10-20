"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups for
highly-available application instances across multiple AZs.
"""
import base64
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class ComputeStack:
    """
    Creates and manages EC2 Launch Templates and Auto Scaling Groups
    for highly-available application deployment.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        private_subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        target_group_arn: Output[str] = None,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the compute stack.
        
        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG instances
            security_group_id: Security group ID for instances
            instance_profile_name: IAM instance profile name
            target_group_arn: Target group ARN for ASG (optional, for ALB integration)
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.target_group_arn = target_group_arn
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_ami()
        
        # Create Launch Template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Create Auto Scaling Policies
        self.scaling_policy = self._create_scaling_policy()
    
    def _get_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get the latest Amazon Linux 2023 AMI.
        
        Returns:
            AMI data
        """
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='virtualization-type',
                    values=['hvm']
                )
            ]
        )
        
        return ami
    
    def _get_user_data(self) -> str:
        """
        Generate user data script for EC2 instances.
        
        Returns:
            Base64-encoded user data script
        """
        user_data_script = f"""#!/bin/bash
set -e

# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install Apache web server using dnf (Amazon Linux 2023)
dnf install -y httpd

# Create a simple health check endpoint
cat > /var/www/html/health <<'EOF'
OK
EOF

# Create a simple index page
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Application</title>
</head>
<body>
    <h1>TAP Application - Environment: {self.config.environment_suffix}</h1>
    <p>Instance ID: <span id="instance-id">Loading...</span></p>
    <p>Availability Zone: <span id="az">Loading...</span></p>
    <script>
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(r => r.text())
            .then(id => document.getElementById('instance-id').textContent = id);
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(r => r.text())
            .then(az => document.getElementById('az').textContent = az);
    </script>
</body>
</html>
EOF

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Signal that instance is ready
echo "Instance ready at $(date)" > /var/log/user-data-complete.log
"""
        
        return user_data_script
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for Auto Scaling Group.
        
        Returns:
            Launch Template resource
        """
        lt_name = self.config.get_resource_name('launch-template')
        
        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=base64.b64encode(self._get_user_data().encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            vpc_security_group_ids=[self.security_group_id],
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint='enabled',
                http_tokens='required',  # Require IMDSv2
                http_put_response_hop_limit=1
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags=self.config.get_tags_for_resource('EC2Instance', Name=f"{lt_name}-instance")
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags=self.config.get_tags_for_resource('EBSVolume', Name=f"{lt_name}-volume")
                )
            ],
            tags=self.config.get_tags_for_resource('LaunchTemplate', Name=lt_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return launch_template
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group across multiple AZs.
        
        Returns:
            Auto Scaling Group resource
        """
        asg_name = self.config.get_resource_name('asg')
        
        # Build ASG arguments
        asg_args = {
            'name': asg_name,
            'min_size': self.config.asg_min_size,
            'max_size': self.config.asg_max_size,
            'desired_capacity': self.config.asg_desired_capacity,
            'health_check_grace_period': self.config.health_check_grace_period,
            'health_check_type': self.config.health_check_type,
            'vpc_zone_identifiers': self.private_subnet_ids,
            'launch_template': aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            'enabled_metrics': [
                'GroupMinSize',
                'GroupMaxSize',
                'GroupDesiredCapacity',
                'GroupInServiceInstances',
                'GroupTotalInstances'
            ],
            'tags': [
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in self.config.get_tags_for_resource('AutoScalingGroup', Name=asg_name).items()
            ],
            'opts': ResourceOptions(parent=self.parent)
        }
        
        # Only add target_group_arns if ALB is enabled
        if self.target_group_arn is not None:
            asg_args['target_group_arns'] = [self.target_group_arn]
        
        auto_scaling_group = aws.autoscaling.Group(asg_name, **asg_args)
        
        return auto_scaling_group
    
    def _create_scaling_policy(self) -> aws.autoscaling.Policy:
        """
        Create target tracking scaling policy.
        
        Returns:
            Scaling Policy resource
        """
        policy_name = self.config.get_resource_name('scaling-policy')
        
        scaling_policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            policy_type='TargetTrackingScaling',
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='ASGAverageCPUUtilization'
                ),
                target_value=70.0
            ),
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )
        
        return scaling_policy
    
    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name
    
    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn

