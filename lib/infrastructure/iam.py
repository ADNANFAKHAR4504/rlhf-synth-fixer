import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class IAMStack:
    """IAM roles and policies with least privilege principles."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.instance_role = self._create_instance_role()
        self.instance_profile = self._create_instance_profile()
    
    def _create_instance_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances with least privilege."""
        return aws.iam.Role(
            "ec2-instance-role",
            name=self.config.iam_role_name,
            assume_role_policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create instance profile for EC2 instances."""
        return aws.iam.InstanceProfile(
            "ec2-instance-profile",
            name=f"{self.config.iam_role_name}-profile",
            role=self.instance_role.name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_s3_policy(self, bucket_name: pulumi.Output[str]) -> aws.iam.Policy:
        """Create least privilege S3 policy for log access."""
        return aws.iam.Policy(
            "ec2-s3-policy",
            name=f"{self.config.get_tag_name('s3-policy')}-v2",
            description="Least privilege S3 access for application logs",
            policy=bucket_name.apply(
                lambda name: {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": f"arn:aws:s3:::{name}/logs/*"
                    }, {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{name}"
                    }]
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_cloudwatch_policy(self) -> aws.iam.Policy:
        """Create CloudWatch logs policy for EC2 instances."""
        return aws.iam.Policy(
            "ec2-cloudwatch-policy",
            name=f"{self.config.get_tag_name('cloudwatch-policy')}-v2",
            description="CloudWatch logs access for EC2 instances",
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": f"arn:aws:logs:{self.config.region}:*:log-group:{self.config.log_group_name}*"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def attach_policies_to_role(self, bucket_name: pulumi.Output[str]) -> None:
        """Attach policies to the instance role."""
        s3_policy = self._create_s3_policy(bucket_name)
        cloudwatch_policy = self._create_cloudwatch_policy()
        
        # Attach S3 policy
        aws.iam.RolePolicyAttachment(
            "ec2-s3-policy-attachment",
            role=self.instance_role.name,
            policy_arn=s3_policy.arn,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
        
        # Attach CloudWatch policy
        aws.iam.RolePolicyAttachment(
            "ec2-cloudwatch-policy-attachment",
            role=self.instance_role.name,
            policy_arn=cloudwatch_policy.arn,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_instance_profile_arn(self) -> pulumi.Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn
    
    def get_instance_profile_name(self) -> pulumi.Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name
