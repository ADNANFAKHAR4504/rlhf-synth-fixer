#!/usr/bin/env python
"""
Secure multi-account / multi-region CDKTF stack.
Implements strong RDS passwords, KMS encryption, no-SSH SG, GuardDuty, Shield, etc.
"""

import os, json
from constructs import Construct


from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import (
    AwsProvider,
    AwsProviderAssumeRole,
    AwsProviderDefaultTags,
)
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.guardduty_detector import GuarddutyDetector
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionViewerCertificate,
)
from cdktf_cdktf_provider_aws.shield_protection import ShieldProtection
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_random.provider import RandomProvider
from cdktf_cdktf_provider_random.password import Password as RandomPassword

#global env config
ENV_SUFFIX     = os.getenv("ENVIRONMENT_SUFFIX", "dev")
REPO_NAME      = os.getenv("REPOSITORY", "unknown")
COMMIT_AUTHOR  = os.getenv("COMMIT_AUTHOR", "unknown")

DEV_ACCOUNT_ID  = os.getenv("DEV_ACCOUNT_ID")
PROD_ACCOUNT_ID = os.getenv("PROD_ACCOUNT_ID")
if not DEV_ACCOUNT_ID or not PROD_ACCOUNT_ID:
    raise ValueError("DEV_ACCOUNT_ID and PROD_ACCOUNT_ID must be set")

app = App()

#secure stack definition
class SecureAwsEnvironment(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, *, account_id: str, region: str, environment: str):
        super().__init__(scope, stack_id)

        # provider (with correct AwsProviderDefaultTags struct)
        AwsProvider(
            self,
            f"aws-{region}",
            region=region,
            alias=f"aws_{region.replace('-', '_')}",
            assume_role=[AwsProviderAssumeRole(
                role_arn=f"arn:aws:iam::{account_id}:role/TerraformExecutionRole"
            )],
            default_tags=[AwsProviderDefaultTags(tags={
                "Environment": environment,
                "Repository":  REPO_NAME,
                "Author":      COMMIT_AUTHOR,
            })],
        )
        RandomProvider(self, "random")

        tags = {
            "Environment": environment,
            "Project":     "SecureCloudProject",
            "Owner":       "DevSecOpsTeam",
        }

        # VPC & subnets
        vpc = Vpc(self, f"Vpc-{region}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"main-vpc-{environment}-{region}"},
        )
        subnet_a = Subnet(self, f"PrivA-{region}",
            vpc_id=vpc.id, cidr_block="10.0.1.0/24",
            availability_zone=f"{region}a", map_public_ip_on_launch=False,
            tags={**tags, "Name": f"priv-a-{environment}-{region}"})
        subnet_b = Subnet(self, f"PrivB-{region}",
            vpc_id=vpc.id, cidr_block="10.0.2.0/24",
            availability_zone=f"{region}b", map_public_ip_on_launch=False,
            tags={**tags, "Name": f"priv-b-{environment}-{region}"})

        # security groups
        rds_sg = SecurityGroup(self, f"RdsSg-{region}",
            name=f"rds-sg-{environment}-{region}",
            vpc_id=vpc.id,
            description="Allow Postgres within VPC",
            ingress=[SecurityGroupIngress(
                description="PostgreSQL", protocol="tcp",
                from_port=5432, to_port=5432, cidr_blocks=[vpc.cidr_block])],
            tags={**tags, "Name": f"rds-sg-{environment}-{region}"})
        SecurityGroup(self, f"NoSsh-{region}",
            name=f"no-ssh-sg-{environment}-{region}",
            vpc_id=vpc.id, description="No SSH ingress",
            tags={**tags, "Name": f"no-ssh-{environment}-{region}"})

        # KMS key
        kms = KmsKey(self, f"Kms-{region}",
            description=f"KMS for RDS {region}", enable_key_rotation=True,
            tags={**tags, "Name": f"kms-rds-{environment}-{region}"})

        # secret + random password
        secret = SecretsmanagerSecret(self, f"DbSecret-{region}",
            name=f"rds-password-{environment}-{region}",
            description="RDS master password",
            tags={**tags, "Name": f"rds-secret-{environment}-{region}"})
        pwd = RandomPassword(self, f"DbPwd-{region}", length=32, special=True, override_special="_@")
        SecretsmanagerSecretVersion(self, f"DbSecretVer-{region}",
            secret_id=secret.id,
            secret_string=json.dumps({"password": pwd.result}),
            version_stages=["AWSCURRENT"])

        # DB subnet group
        db_subnet_group = DbSubnetGroup(self, f"DbSubnets-{region}",
            name=f"db-subnet-{environment}-{region}",
            subnet_ids=[subnet_a.id, subnet_b.id],
            tags={**tags, "Name": f"db-subnet-{environment}-{region}"})

        # RDS instance
        DbInstance(self, f"AppDb-{region}",
            allocated_storage=20,
            engine="postgres", engine_version="16.1",
            instance_class="db.t3.micro",
            db_name="appdb", username="dbuser", password=pwd.result,
            vpc_security_group_ids=[rds_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            storage_encrypted=True, kms_key_id=kms.arn,
            skip_final_snapshot=True,
            tags={**tags, "Name": f"app-db-{environment}-{region}"})

        # S3 bucket & access block
        bucket_name = f"secure-data-bucket-{environment}-{account_id}-{region}"
        bucket = S3Bucket(self, f"Bucket-{region}",
            bucket=bucket_name,
            tags={**tags, "Name": bucket_name})
        S3BucketPublicAccessBlock(self, f"PAB-{region}",
            bucket=bucket.id,
            block_public_acls=True, block_public_policy=True,
            ignore_public_acls=True, restrict_public_buckets=True)

        # read-only IAM role + policy
        role = IamRole(self, f"S3Role-{region}",
            name=f"s3-read-role-{environment}-{region}",
            assume_role_policy=json.dumps({
                "Version":"2012-10-17",
                "Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}),
            tags={**tags, "Name": f"s3-role-{environment}-{region}"})
        policy = IamPolicy(self, f"S3Policy-{region}",
            name=f"s3-read-policy-{environment}-{region}",
            policy=json.dumps({
                "Version":"2012-10-17",
                "Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:ListBucket"],
                              "Resource":[f"arn:aws:s3:::{bucket_name}",f"arn:aws:s3:::{bucket_name}/*"]}]}),
            tags={**tags, "Name": f"s3-policy-{environment}-{region}"})
        IamRolePolicyAttachment(self, f"S3Attach-{region}", role=role.name, policy_arn=policy.arn)

        # GuardDuty
        GuarddutyDetector(self, f"GD-{region}", enable=True, tags={**tags, "Name": f"gd-{environment}-{region}"})

        # CloudFront + Shield (us-east-1 only)
        if region == "us-east-1":
            origin_id = f"s3-origin-{bucket_name}"
            cf = CloudfrontDistribution(self, "CF",
                enabled=True, is_ipv6_enabled=True,
                origin=[CloudfrontDistributionOrigin(
                    domain_name=bucket.bucket_regional_domain_name, origin_id=origin_id)],
                default_root_object="index.html",
                default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                    target_origin_id=origin_id, viewer_protocol_policy="redirect-to-https",
                    allowed_methods=["GET","HEAD","OPTIONS"], cached_methods=["GET","HEAD"],
                    min_ttl=0, default_ttl=3600, max_ttl=86400),
                restrictions=CloudfrontDistributionRestrictions(
                    geo_restriction={"restriction_type":"none"}),
                viewer_certificate=CloudfrontDistributionViewerCertificate(
                    cloudfront_default_certificate=True),
                tags={**tags, "Name":"app-cloudfront"})
            ShieldProtection(self, "Shield", name=f"shield-{environment}", resource_arn=cf.arn)
            TerraformOutput(self, "cloudfront_domain_name", value=cf.domain_name)
