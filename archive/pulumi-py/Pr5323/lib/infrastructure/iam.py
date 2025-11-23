"""
IAM infrastructure module.

This module creates IAM roles and policies with least-privilege permissions
for EC2 instances and other AWS services.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Creates and manages IAM roles and policies with least-privilege principles.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Create EC2 role
        self.ec2_role = self._create_ec2_role()
        
        # Create instance profile
        self.instance_profile = self._create_instance_profile()
    
    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances with least-privilege policies.
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('ec2-role')
        
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
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags={
                **self.config.get_tags_for_resource('IAM-Role'),
                'Name': role_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        # Attach SSM policy for Systems Manager access
        aws.iam.RolePolicyAttachment(
            f"{role_name}-ssm-policy",
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        
        # Attach CloudWatch policy for logging and metrics
        self._attach_cloudwatch_policy(role)
        
        return role
    
    def _attach_cloudwatch_policy(self, role: aws.iam.Role):
        """
        Attach CloudWatch policy to role with scoped permissions.
        
        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('ec2-cloudwatch-policy')
        
        # Create scoped CloudWatch policy (no Resource: *)
        policy_document = Output.all(self.config.primary_region).apply(
            lambda args: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": [
                            f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*",
                            f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*:log-stream:*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeTags"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )
        
        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
    
    def attach_s3_policy(self, role: aws.iam.Role, *bucket_arns: Output[str]):
        """
        Attach S3 policy to role with scoped permissions for multiple buckets.
        
        Args:
            role: IAM role to attach policy to
            *bucket_arns: S3 bucket ARNs to scope permissions
        """
        policy_name = self.config.get_resource_name('ec2-s3-policy')
        
        # Create scoped S3 policy (no Resource: *)
        policy_document = Output.all(*bucket_arns).apply(
            lambda arns: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                        "s3:GetBucketVersioning",
                        "s3:ListBucketVersions"
                    ],
                    "Resource": list(arns) + [f"{arn}/*" for arn in arns]
                }]
            })
        )
        
        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.
        
        Returns:
            Instance Profile
        """
        profile_name = self.config.get_resource_name('ec2-instance-profile')
        
        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags={
                **self.config.get_tags_for_resource('IAM-InstanceProfile'),
                'Name': profile_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.ec2_role
            )
        )
        
        return instance_profile
    
    # Getter methods
    
    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn
    
    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name
    
    def get_ec2_instance_profile_name(self) -> Output[str]:
        """Get EC2 instance profile name."""
        return self.instance_profile.name
    
    def get_ec2_instance_profile_arn(self) -> Output[str]:
        """Get EC2 instance profile ARN."""
        return self.instance_profile.arn
    
    def get_ec2_instance_profile(self) -> aws.iam.InstanceProfile:
        """Get EC2 instance profile resource."""
        return self.instance_profile
