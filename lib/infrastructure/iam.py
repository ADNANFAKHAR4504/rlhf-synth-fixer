"""
IAM roles and policies with least-privilege access.

This module creates IAM roles with scoped ARNs and conditions
to address the least-privilege IAM requirement.
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class IAMStack:
    """
    Manages IAM roles and policies with least-privilege principles.
    
    All policies use scoped ARNs instead of "*" where possible.
    """
    
    def __init__(self, config: Config):
        """
        Initialize IAM stack.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}
        
        # Get AWS account ID and region for ARN scoping
        self.account_id = aws.get_caller_identity().account_id
        self.region = config.primary_region
        
        # Create roles
        self._create_rollback_role()
        self._create_monitoring_role()
        self._create_cleanup_role()
        self._create_instance_role()
    
    def _create_rollback_role(self) -> aws.iam.Role:
        """Create IAM role for rollback Lambda with scoped permissions."""
        role_name = self.config.get_resource_name('rollback-lambda-role')
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            description="Role for rollback Lambda function",
            tags=self.config.get_tags({'Purpose': 'RollbackAutomation'})
        )
        
        # Scoped policy for rollback operations
        policy_name = self.config.get_resource_name('rollback-policy')
        
        # Build scoped policy with specific ARNs
        policy_document = Output.all(self.account_id, self.config.app_name, self.config.environment_suffix).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AutoScalingOperations",
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:UpdateAutoScalingGroup",
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances"
                        ],
                        "Resource": f"arn:aws:autoscaling:{self.region}:{args[0]}:autoScalingGroup:*:autoScalingGroupName/{args[1]}-{args[2]}-*"
                    },
                    {
                        "Sid": "EC2Describe",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "SSMParameterAccess",
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:PutParameter"
                        ],
                        "Resource": f"arn:aws:ssm:{self.region}:{args[0]}:parameter/{args[1]}/*"
                    },
                    {
                        "Sid": "S3StateAccess",
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"arn:aws:s3:::{args[1]}-{args[2]}-state-{args[0]}/*"
                    },
                    {
                        "Sid": "S3StateBucketList",
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"],
                        "Resource": f"arn:aws:s3:::{args[1]}-{args[2]}-state-{args[0]}"
                    },
                    {
                        "Sid": "CloudWatchLogs",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.region}:{args[0]}:log-group:/aws/lambda/{args[1]}-{args[2]}-*"
                    },
                    {
                        "Sid": "SNSPublish",
                        "Effect": "Allow",
                        "Action": ["sns:Publish"],
                        "Resource": f"arn:aws:sns:{self.region}:{args[0]}:{args[1]}-{args[2]}-*"
                    }
                ]
            })
        )
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            description="Scoped policy for rollback operations",
            policy=policy_document,
            tags=self.config.get_tags()
        )
        
        aws.iam.RolePolicyAttachment(
            f"{role_name}-policy-attachment",
            role=role.name,
            policy_arn=policy.arn
        )
        
        self.roles['rollback'] = role
        self.policies['rollback'] = policy
        return role
    
    def _create_monitoring_role(self) -> aws.iam.Role:
        """Create IAM role for health monitoring Lambda."""
        role_name = self.config.get_resource_name('monitoring-lambda-role')
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            description="Role for health monitoring Lambda",
            tags=self.config.get_tags({'Purpose': 'HealthMonitoring'})
        )
        
        policy_name = self.config.get_resource_name('monitoring-policy')
        
        policy_document = Output.all(self.account_id, self.config.app_name, self.config.environment_suffix).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "CloudWatchMetrics",
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "cloudwatch:namespace": self.config.metric_namespace
                            }
                        }
                    },
                    {
                        "Sid": "EC2ReadOnly",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "LambdaInvoke",
                        "Effect": "Allow",
                        "Action": ["lambda:InvokeFunction"],
                        "Resource": f"arn:aws:lambda:{self.region}:{args[0]}:function:{args[1]}-{args[2]}-rollback-*"
                    },
                    {
                        "Sid": "CloudWatchLogs",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.region}:{args[0]}:log-group:/aws/lambda/{args[1]}-{args[2]}-*"
                    }
                ]
            })
        )
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            description="Scoped policy for monitoring operations",
            policy=policy_document,
            tags=self.config.get_tags()
        )
        
        aws.iam.RolePolicyAttachment(
            f"{role_name}-policy-attachment",
            role=role.name,
            policy_arn=policy.arn
        )
        
        self.roles['monitoring'] = role
        self.policies['monitoring'] = policy
        return role
    
    def _create_cleanup_role(self) -> aws.iam.Role:
        """Create IAM role for cleanup Lambda with safe permissions."""
        role_name = self.config.get_resource_name('cleanup-lambda-role')
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            description="Role for cleanup Lambda",
            tags=self.config.get_tags({'Purpose': 'ResourceCleanup'})
        )
        
        policy_name = self.config.get_resource_name('cleanup-policy')
        
        policy_document = Output.all(self.account_id, self.config.app_name).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "EC2SnapshotManagement",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeSnapshots",
                            "ec2:DeleteSnapshot"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "ec2:ResourceTag/Application": args[1]
                            }
                        }
                    },
                    {
                        "Sid": "EC2VolumeManagement",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeVolumes",
                            "ec2:DeleteVolume"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "ec2:ResourceTag/Application": args[1]
                            }
                        }
                    },
                    {
                        "Sid": "CloudWatchLogs",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.region}:{args[0]}:log-group:/aws/lambda/*"
                    }
                ]
            })
        )
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            description="Scoped policy for cleanup operations",
            policy=policy_document,
            tags=self.config.get_tags()
        )
        
        aws.iam.RolePolicyAttachment(
            f"{role_name}-policy-attachment",
            role=role.name,
            policy_arn=policy.arn
        )
        
        self.roles['cleanup'] = role
        self.policies['cleanup'] = policy
        return role
    
    def _create_instance_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances with S3 log write permissions."""
        role_name = self.config.get_resource_name('instance-role')
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            description="Role for EC2 instances with S3, SSM, and CloudWatch access",
            tags=self.config.get_tags({'Purpose': 'EC2Instance'})
        )
        
        # Attach AWS managed policies for SSM and CloudWatch
        aws.iam.RolePolicyAttachment(
            f"{role_name}-cloudwatch-agent",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )
        
        aws.iam.RolePolicyAttachment(
            f"{role_name}-ssm-managed",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )
        
        # Create custom policy for S3 log bucket write access
        # Scoped to log buckets only (least privilege)
        s3_policy_name = self.config.get_resource_name('instance-s3-policy')
        
        s3_policy_document = Output.all(self.account_id, self.config.app_name, self.config.environment_suffix).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "S3LogBucketWrite",
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl",
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{args[1]}-{args[2]}-logs-{args[0]}/*"
                        ]
                    },
                    {
                        "Sid": "S3LogBucketList",
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{args[1]}-{args[2]}-logs-{args[0]}"
                        ]
                    }
                ]
            })
        )
        
        s3_policy = aws.iam.Policy(
            s3_policy_name,
            name=s3_policy_name,
            description="Scoped S3 policy for EC2 instances to write logs",
            policy=s3_policy_document,
            tags=self.config.get_tags()
        )
        
        # Attach custom S3 policy
        aws.iam.RolePolicyAttachment(
            f"{role_name}-s3-logs",
            role=role.name,
            policy_arn=s3_policy.arn
        )
        
        self.roles['instance'] = role
        self.policies['instance_s3'] = s3_policy
        return role
    
    def get_role(self, role_type: str) -> aws.iam.Role:
        """
        Get IAM role by type.
        
        Args:
            role_type: Type of role ('rollback', 'monitoring', 'cleanup', 'instance')
            
        Returns:
            IAM Role
        """
        if role_type not in self.roles:
            raise ValueError(f"Role type {role_type} not found")
        return self.roles[role_type]
    
    def get_role_arn(self, role_type: str) -> Output[str]:
        """
        Get IAM role ARN by type.
        
        Args:
            role_type: Type of role
            
        Returns:
            Role ARN as Output[str]
        """
        return self.get_role(role_type).arn

