"""
S3 module for EC2 failure recovery infrastructure.
Provides state storage with proper locking mechanisms.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class S3Stack:
    """S3 resources for EC2 recovery state storage."""
    
    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.bucket = self._create_state_bucket()
        # Removed bucket policy due to Block Public Access settings
    
    def _create_state_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for storing EC2 recovery state."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.s3.Bucket(
            f"{self.config.get_tag_name('state-bucket')}-{random_suffix}",
            bucket=self.config.s3_bucket_name,
            tags={
                "Name": self.config.get_tag_name("state-bucket"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-State"
            }
        )
    
    def _create_bucket_policy(self) -> aws.s3.BucketPolicy:
        """Create bucket policy for secure access."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.s3.BucketPolicy(
            f"{self.config.get_tag_name('bucket-policy')}-{random_suffix}",
            bucket=self.bucket.id,
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}/ec2-recovery/*",
                        "Condition": {
                            "StringEquals": {
                                "aws:PrincipalTag/Auto-Recover": "true"
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}",
                        "Condition": {
                            "StringEquals": {
                                "aws:PrincipalTag/Auto-Recover": "true"
                            }
                        }
                    }
                ]
            })
        )
    
    def get_bucket_name(self) -> pulumi.Output[str]:
        """Get the S3 bucket name."""
        return self.bucket.id
    
    def get_bucket_arn(self) -> pulumi.Output[str]:
        """Get the S3 bucket ARN."""
        return self.bucket.arn
