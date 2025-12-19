"""
IAM infrastructure module.

This module creates IAM roles and policies for EC2 instances with least-privilege
access to S3 and Systems Manager (SSM) for secure instance management.
"""
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class IAMStack:
    """
    Creates and manages IAM roles and policies for EC2 instances.
    
    Provides least-privilege access to:
    - AWS Systems Manager (SSM) for secure instance management
    - S3 for object storage operations
    - CloudWatch Logs for logging
    """
    
    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Create EC2 IAM role
        self.ec2_role = self._create_ec2_role()
        
        # Attach SSM managed policy for Systems Manager access
        self.ssm_policy_attachment = self._attach_ssm_managed_policy()
        
        # Attach CloudWatch managed policy for logging
        self.cloudwatch_policy_attachment = self._attach_cloudwatch_managed_policy()
        
        # Create instance profile
        self.instance_profile = self._create_instance_profile()
    
    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances.
        
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-ec2', include_region=False)
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            description=f"IAM role for EC2 instances in {self.config.environment_suffix} environment",
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return role
    
    def _attach_ssm_managed_policy(self) -> aws.iam.RolePolicyAttachment:
        """
        Attach AWS managed SSM policy to EC2 role.
        
        This enables Systems Manager Session Manager for secure instance access
        without SSH keys.
        
        Returns:
            Role policy attachment resource
        """
        attachment_name = self.config.get_resource_name('attachment-ssm-ec2', include_region=False)
        
        attachment = aws.iam.RolePolicyAttachment(
            attachment_name,
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )
        
        return attachment
    
    def _attach_cloudwatch_managed_policy(self) -> aws.iam.RolePolicyAttachment:
        """
        Attach AWS managed CloudWatch policy to EC2 role.
        
        This enables CloudWatch Logs and metrics publishing.
        
        Returns:
            Role policy attachment resource
        """
        attachment_name = self.config.get_resource_name('attachment-cloudwatch-ec2', include_region=False)
        
        attachment = aws.iam.RolePolicyAttachment(
            attachment_name,
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )
        
        return attachment
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create IAM instance profile for EC2 instances.
        
        Returns:
            Instance profile resource
        """
        profile_name = self.config.get_resource_name('profile-ec2', include_region=False)
        
        profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource('InstanceProfile', Name=profile_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )
        
        return profile
    
    def attach_s3_policy(self, bucket_arn: Output[str]) -> aws.iam.RolePolicy:
        """
        Attach S3 access policy to EC2 role.
        
        Provides least-privilege access to the specified S3 bucket.
        
        Args:
            bucket_arn: ARN of the S3 bucket
            
        Returns:
            Role policy resource
        """
        policy_name = self.config.get_resource_name('policy-s3-ec2', include_region=False)
        
        def create_policy_document(arn: str) -> str:
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{arn}/*"
                    }
                ]
            })
        
        policy = aws.iam.RolePolicy(
            policy_name,
            role=self.ec2_role.id,
            policy=bucket_arn.apply(create_policy_document),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )
        
        return policy
    
    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn
    
    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name
    
    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name
    
    def get_instance_profile_arn(self) -> Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn

