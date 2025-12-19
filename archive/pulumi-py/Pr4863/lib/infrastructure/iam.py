"""
IAM infrastructure module.

This module creates IAM roles and policies with least-privilege access
for EC2 instances and other AWS services.
"""
import json

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class IAMStack:
    """
    Creates and manages IAM roles and policies with least-privilege access.
    """
    
    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the IAM stack.
        
        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent
        
        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.ec2_instance_profile = self._create_instance_profile()
    
    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances with least-privilege policies.
        
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-ec2')
        
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
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Attach AWS managed policy for CloudWatch Agent (includes Logs)
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('ec2-cloudwatch-agent-attachment'),
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
            opts=ResourceOptions(parent=role)
        )
        
        # Attach AWS managed policy for SSM (includes Session Manager)
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('ec2-ssm-managed-attachment'),
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(parent=role)
        )
        
        # Attach CloudWatch metrics policy (custom for namespace restriction)
        self._attach_cloudwatch_policy(role)
        
        # Attach SSM policy for parameter store access (custom for scoped access)
        self._attach_ssm_policy(role)
        
        return role
    
    def _attach_cloudwatch_policy(self, role: aws.iam.Role):
        """
        Attach CloudWatch metrics policy to role.
        
        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('policy-cloudwatch')
        
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:ListMetrics"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "cloudwatch:namespace": f"{self.config.project_name}/application"
                    }
                }
            }]
        }
        
        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=json.dumps(policy_document),
            opts=ResourceOptions(parent=role)
        )
    
    def _attach_ssm_policy(self, role: aws.iam.Role):
        """
        Attach SSM policy to role for parameter store access.
        
        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('policy-ssm')
        
        # Build ARN for SSM parameters scoped to this project
        ssm_parameter_arn = Output.concat(
            'arn:aws:ssm:',
            self.config.primary_region,
            ':',
            aws.get_caller_identity().account_id,
            ':parameter/',
            self.config.project_name,
            '/',
            self.config.environment_suffix,
            '/*'
        )
        
        policy_document = ssm_parameter_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                "Resource": arn
            }]
        }))
        
        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )
    
    def attach_s3_read_policy(self, role: aws.iam.Role, bucket_arn: Output[str]):
        """
        Attach S3 read and write policy to role for a specific bucket.
        
        Args:
            role: IAM role to attach policy to
            bucket_arn: ARN of the S3 bucket
        """
        policy_name = self.config.get_resource_name('policy-s3-readwrite')
        
        policy_document = bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    arn,
                    f"{arn}/*"
                ]
            }]
        }))
        
        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )
    
    def attach_secrets_manager_policy(self, role: aws.iam.Role, secret_arn: Output[str]):
        """
        Attach Secrets Manager policy to role for a specific secret.
        
        Args:
            role: IAM role to attach policy to
            secret_arn: ARN of the secret
        """
        policy_name = self.config.get_resource_name('policy-secrets')
        
        policy_document = secret_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": arn
            }]
        }))
        
        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.
        
        Returns:
            Instance Profile resource
        """
        profile_name = self.config.get_resource_name('instance-profile')
        
        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource('InstanceProfile', Name=profile_name),
            opts=ResourceOptions(parent=self.ec2_role)
        )
        
        return instance_profile
    
    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.ec2_instance_profile.name
    
    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn

