"""
Compute infrastructure module.

This module creates EC2 instances with proper configuration.

"""

import pulumi
import pulumi_aws as aws
from pulumi import Output


class ComputeStack:
    """
    Compute stack that creates EC2 instances.
    
    Creates:
    - EC2 instances across multiple AZs
    - Dynamic AMI lookup
    - Proper user data for monitoring and SSM
    """
    
    def __init__(self, config, provider_manager, private_subnet_ids, 
                 security_group_id, instance_profile_name, instance_profile, parent=None):
        """
        Initialize the compute stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            private_subnet_ids: List of private subnet IDs
            security_group_id: Security group ID
            instance_profile_name: Instance profile name
            instance_profile: Instance profile resource for dependency
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.instance_profile = instance_profile
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI dynamically
        self.ami = self._get_latest_ami()
        
        # Create EC2 instances
        self.instances = self._create_ec2_instances()
    
    def _get_latest_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get latest Amazon Linux 2023 AMI dynamically.
        
        Fixes hardcoded AMI failure by using dynamic lookup.
        
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
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='root-device-type',
                    values=['ebs']
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )
        
        return ami
    
    def _get_user_data(self, instance_index: int) -> str:
        """
        Generate user data script for EC2 instance.
          
        Args:
            instance_index: Index of the instance
            
        Returns:
            User data script
        """
        user_data = f"""#!/bin/bash
set -e

# Configure logging
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"
echo "Instance: {self.config.project_name}-ec2-{instance_index}-{self.config.environment_suffix}"

# Update system packages
dnf update -y

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Install and configure SSM agent (should be pre-installed on AL2023, but ensure it's there)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo "SSM agent status:"
systemctl status amazon-ssm-agent --no-pager

# Create instance info file
cat > /home/ec2-user/instance-info.txt <<'EOFINFO'
Instance: {self.config.project_name}-ec2-{instance_index}-{self.config.environment_suffix}
Region: {self.config.primary_region}
Environment: {self.config.environment_suffix}
Initialized: $(date)
EOFINFO

# Create helper script for S3 interaction
cat > /home/ec2-user/s3-helper.sh <<'EOFSCRIPT'
#!/bin/bash
# Helper script for interacting with S3 buckets
# Usage examples:
#   ./s3-helper.sh upload-data myfile.txt
#   ./s3-helper.sh upload-log application.log
#   ./s3-helper.sh list-data
#   ./s3-helper.sh list-logs

DATA_BUCKET="{self.config.get_resource_name('data-bucket')}"
LOGS_BUCKET="{self.config.get_resource_name('logs-bucket')}"

case "$1" in
    upload-data)
        aws s3 cp "$2" "s3://$DATA_BUCKET/" --sse aws:kms
        echo "Uploaded $2 to $DATA_BUCKET"
        ;;
    upload-log)
        aws s3 cp "$2" "s3://$LOGS_BUCKET/" --sse aws:kms
        echo "Uploaded $2 to $LOGS_BUCKET"
        ;;
    list-data)
        aws s3 ls "s3://$DATA_BUCKET/"
        ;;
    list-logs)
        aws s3 ls "s3://$LOGS_BUCKET/"
        ;;
    *)
        echo "Usage: $0 {{upload-data|upload-log|list-data|list-logs}} [file]"
        exit 1
        ;;
esac
EOFSCRIPT

chmod +x /home/ec2-user/s3-helper.sh
chown ec2-user:ec2-user /home/ec2-user/s3-helper.sh

# Create a test file to verify S3 access
echo "Test file created at $(date)" > /home/ec2-user/test-file.txt
chown ec2-user:ec2-user /home/ec2-user/test-file.txt

echo "User data script completed successfully at $(date)"
"""
        return user_data
    
    def _create_ec2_instances(self) -> list:
        """
        Create EC2 instances across multiple AZs.
        
        Returns:
            List of EC2 instance resources
        """
        instances = []
        
        for i, subnet_id in enumerate(self.private_subnet_ids):
            instance = aws.ec2.Instance(
                f'ec2-instance-{i}',
                ami=self.ami.id,
                instance_type=self.config.instance_type,
                subnet_id=subnet_id,
                vpc_security_group_ids=[self.security_group_id],
                iam_instance_profile=self.instance_profile_name,
                user_data=self._get_user_data(i),
                tags=self.config.get_tags_for_resource(
                    'EC2Instance',
                    Name=self.config.get_resource_name('ec2', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.instance_profile],
                    parent=self.parent
                )
            )
            
            instances.append(instance)
        
        return instances
    
    def get_instance_ids(self) -> list:
        """Get list of EC2 instance IDs."""
        return [instance.id for instance in self.instances]
    
    def get_instances(self) -> list:
        """Get list of EC2 instance resources."""
        return self.instances

