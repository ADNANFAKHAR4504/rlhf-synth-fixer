"""
IAM infrastructure module.

This module creates IAM roles, policies, and instance profiles
with least-privilege access.

"""

import json

import pulumi_aws as aws
from pulumi import Output


class IAMStack:
    """
    IAM stack that creates roles, policies, and instance profiles.
    
    Creates:
    - EC2 instance role with least-privilege policies
    - S3 access policy (scoped to specific buckets)
    - CloudWatch access policy (scoped to specific log groups)
    - SSM access for secure management
    - Instance profile for EC2
    """
    
    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the IAM stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Get AWS account ID for ARN construction
        self.account_id = aws.get_caller_identity().account_id
        
        # Create EC2 instance role
        self.ec2_role = self._create_ec2_role()
        
        # Create CloudWatch policy and attach
        self.cloudwatch_policy = self._create_cloudwatch_policy()
        self._attach_cloudwatch_policy()
        
        # Attach SSM policy for secure management
        self._attach_ssm_policy()
        
        # Create instance profile
        self.instance_profile = self._create_instance_profile()
    
    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances.
        
        Returns:
            IAM role resource
        """
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'ec2.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            'ec2-role',
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.config.get_tags_for_resource(
                'IAMRole',
                Name=self.config.get_resource_name('ec2-role')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        return role
    
    def _create_cloudwatch_policy(self) -> aws.iam.Policy:
        """
        Create CloudWatch access policy with scoped permissions.
        
        Fixes wildcard permissions by scoping to specific log groups.
        
        Returns:
            IAM policy resource
        """
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogStreams'
                    ],
                    'Resource': [
                        f'arn:aws:logs:{self.config.primary_region}:{self.account_id}:log-group:/aws/ec2/{self.config.project_name}*',
                        f'arn:aws:logs:{self.config.primary_region}:{self.account_id}:log-group:/aws/ec2/{self.config.project_name}*:log-stream:*'
                    ]
                }
            ]
        }
        
        policy = aws.iam.Policy(
            'ec2-cloudwatch-policy',
            policy=json.dumps(policy_document),
            tags=self.config.get_tags_for_resource(
                'IAMPolicy',
                Name=self.config.get_resource_name('ec2-cloudwatch-policy')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        return policy
    
    def _attach_cloudwatch_policy(self):
        """Attach CloudWatch policy to EC2 role."""
        aws.iam.RolePolicyAttachment(
            'ec2-cloudwatch-policy-attachment',
            role=self.ec2_role.name,
            policy_arn=self.cloudwatch_policy.arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role, self.cloudwatch_policy],
                parent=self.parent
            )
        )
    
    def attach_s3_policy(self, bucket_arns: list, kms_key_arn=None):
        """
        Create and attach S3 access policy with scoped permissions.
        
        Fixes placeholder ARNs and wildcard permissions by using
        actual bucket ARNs. Also includes KMS permissions for S3 encryption.
        
        Args:
            bucket_arns: List of S3 bucket ARNs to grant access to
            kms_key_arn: Optional KMS key ARN for S3 encryption
        """
        # Wait for all bucket ARNs to be available
        if kms_key_arn:
            Output.all(*bucket_arns, kms_key_arn).apply(
                lambda args: self._create_s3_policy(args[:-1], args[-1])
            )
        else:
            Output.all(*bucket_arns).apply(lambda arns: self._create_s3_policy(arns))
    
    def _create_s3_policy(self, bucket_arns: list, kms_key_arn=None):
        """
        Internal method to create S3 policy with resolved ARNs.
        
        Args:
            bucket_arns: List of resolved S3 bucket ARNs
            kms_key_arn: Optional KMS key ARN for encryption/decryption
        """
        resources = []
        for arn in bucket_arns:
            resources.append(arn)
            resources.append(f'{arn}/*')
        
        statements = [
            {
                'Effect': 'Allow',
                'Action': [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject'
                ],
                'Resource': [f'{arn}/*' for arn in bucket_arns]
            },
            {
                'Effect': 'Allow',
                'Action': [
                    's3:ListBucket',
                    's3:GetBucketLocation'
                ],
                'Resource': bucket_arns
            }
        ]
        
        # Add KMS permissions if KMS key is provided
        if kms_key_arn:
            statements.append({
                'Effect': 'Allow',
                'Action': [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey'
                ],
                'Resource': kms_key_arn
            })
        
        policy_document = {
            'Version': '2012-10-17',
            'Statement': statements
        }
        
        policy = aws.iam.Policy(
            'ec2-s3-policy',
            policy=json.dumps(policy_document),
            tags=self.config.get_tags_for_resource(
                'IAMPolicy',
                Name=self.config.get_resource_name('ec2-s3-policy')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        aws.iam.RolePolicyAttachment(
            'ec2-s3-policy-attachment',
            role=self.ec2_role.name,
            policy_arn=policy.arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role, policy],
                parent=self.parent
            )
        )
        
        return policy
    
    def _attach_ssm_policy(self):
        """
        Attach SSM managed policy for secure management.
        
        Uses AWS managed policy for SSM access, which is acceptable
        for SSM as it's a well-scoped managed policy.
        """
        aws.iam.RolePolicyAttachment(
            'ec2-ssm-policy-attachment',
            role=self.ec2_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role],
                parent=self.parent
            )
        )
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.
        
        Returns:
            Instance profile resource
        """
        instance_profile = aws.iam.InstanceProfile(
            'ec2-instance-profile',
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource(
                'InstanceProfile',
                Name=self.config.get_resource_name('ec2-instance-profile')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role],
                parent=self.parent
            )
        )
        
        return instance_profile
    
    def get_ec2_role(self) -> aws.iam.Role:
        """Get EC2 IAM role."""
        return self.ec2_role
    
    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name
    
    def get_instance_profile_arn(self) -> Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn
    
    def get_instance_profile(self) -> aws.iam.InstanceProfile:
        """Get instance profile resource."""
        return self.instance_profile

