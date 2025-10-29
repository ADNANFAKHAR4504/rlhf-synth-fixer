"""
IAM infrastructure module for roles, policies, and instance profiles.

This module creates IAM roles with least-privilege policies for EC2 instances
and Lambda functions
to specific resources instead of using "Resource": "*".
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Manages IAM roles, policies, and instance profiles.
    
    Creates:
    - EC2 role with SSM access and scoped permissions
    - Lambda role with scoped permissions for EC2 and Auto Scaling
    - Instance profile for EC2 instances
    """
    
    def __init__(
        self,
        config: InfraConfig,
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: Infrastructure configuration
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.parent = parent
        
        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.lambda_role = self._create_lambda_role()
        
        # Create instance profile for EC2
        self.ec2_instance_profile = self._create_ec2_instance_profile()
    
    def _create_ec2_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances with SSM access."""
        role_name = self.config.get_resource_name('ec2-role')
        
        # Trust policy for EC2
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
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Attach AWS managed policy for SSM
        aws.iam.RolePolicyAttachment(
            f"{role_name}-ssm-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=role)
        )
        
        # Attach AWS managed policy for CloudWatch Agent
        aws.iam.RolePolicyAttachment(
            f"{role_name}-cloudwatch-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def _create_lambda_role(self) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with scoped permissions.
        """
        role_name = self.config.get_resource_name('lambda-role')
        
        # Trust policy for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Attach AWS managed policy for Lambda basic execution
        aws.iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )
        
        # Create custom policy with scoped permissions for EC2 and Auto Scaling
        policy_name = self.config.get_resource_name('lambda-ec2-policy')
        
        # Get account ID for scoped ARNs
        caller_identity = aws.get_caller_identity()
        account_id = caller_identity.account_id
        
        policy_document = Output.all(account_id).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus"
                        ],
                        "Resource": "*"  # DescribeInstances requires wildcard
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances"
                        ],
                        "Resource": "*"  # Describe actions require wildcard
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:SetInstanceHealth",
                            "autoscaling:TerminateInstanceInAutoScalingGroup"
                        ],
                        "Resource": f"arn:aws:autoscaling:{self.config.primary_region}:{args[0]}:autoScalingGroup:*:autoScalingGroupName/{self.config.project_name}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*",  # PutMetricData requires wildcard
                        "Condition": {
                            "StringEquals": {
                                "cloudwatch:namespace": f"{self.config.project_name}/HealthCheck"
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": f"arn:aws:sns:{self.config.primary_region}:{args[0]}:{self.config.project_name}-*"
                    }
                ]
            })
        )
        
        custom_policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            policy=policy_document,
            tags={
                **self.config.get_common_tags(),
                'Name': policy_name
            },
            opts=ResourceOptions(parent=role)
        )
        
        # Attach custom policy to role
        aws.iam.RolePolicyAttachment(
            f"{role_name}-custom-policy",
            role=role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def _create_ec2_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create instance profile for EC2 instances."""
        profile_name = self.config.get_resource_name('ec2-instance-profile')
        
        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags={
                **self.config.get_common_tags(),
                'Name': profile_name
            },
            opts=ResourceOptions(parent=self.ec2_role)
        )
        
        return instance_profile
    
    # Getter methods for outputs
    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn
    
    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name
    
    def get_lambda_role_arn(self) -> Output[str]:
        """Get Lambda role ARN."""
        return self.lambda_role.arn
    
    def get_lambda_role_name(self) -> Output[str]:
        """Get Lambda role name."""
        return self.lambda_role.name
    
    def get_ec2_instance_profile_name(self) -> Output[str]:
        """Get EC2 instance profile name."""
        return self.ec2_instance_profile.name
    
    def get_ec2_instance_profile_arn(self) -> Output[str]:
        """Get EC2 instance profile ARN."""
        return self.ec2_instance_profile.arn
    
    def get_ec2_instance_profile(self) -> aws.iam.InstanceProfile:
        """Get EC2 instance profile resource for dependency management."""
        return self.ec2_instance_profile

