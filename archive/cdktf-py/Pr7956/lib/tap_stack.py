from constructs import Construct
from cdktf import TerraformStack, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity

from lib.vpc import ZeroTrustVpc
from lib.iam import ZeroTrustIam
from lib.encryption import ZeroTrustEncryption
from lib.monitoring import ZeroTrustMonitoring
from lib.security import ZeroTrustSecurity
from lib.waf import ZeroTrustWaf
from lib.compliance import ZeroTrustCompliance


class TapStack(TerraformStack):
    """
    Main stack orchestrating all Zero Trust security components.

    This stack creates a comprehensive Zero Trust security framework including:
    - VPC with private subnets and VPC endpoints
    - IAM roles with MFA and external ID enforcement
    - KMS encryption keys with granular policies
    - CloudTrail, VPC Flow Logs, and CloudWatch monitoring
    - Security Hub and AWS Config for compliance
    - AWS WAF with rate-based rules
    - Service Control Policies (documentation)
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: dict,
    ):
        super().__init__(scope, construct_id)

        # Configure S3 backend for state management
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"zero-trust/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Configure AWS provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Get AWS account ID
        caller_identity = DataAwsCallerIdentity(self, "current")
        account_id = caller_identity.account_id

        # 1. Create VPC and networking infrastructure
        vpc_construct = ZeroTrustVpc(
            self,
            "vpc",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # 2. Create IAM roles
        iam_construct = ZeroTrustIam(
            self,
            "iam",
            environment_suffix=environment_suffix,
            account_id=account_id,
        )

        # 3. Create KMS encryption keys
        encryption_construct = ZeroTrustEncryption(
            self,
            "encryption",
            environment_suffix=environment_suffix,
            account_id=account_id,
            aws_region=aws_region,
        )

        # 4. Create monitoring infrastructure
        monitoring_construct = ZeroTrustMonitoring(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            account_id=account_id,
            aws_region=aws_region,
            vpc_id=vpc_construct.vpc.id,
            kms_key_id=encryption_construct.cloudtrail_key.arn,
        )

        # 5. Enable security services
        # Note: Config and Security Hub are disabled by default to avoid account limits
        security_construct = ZeroTrustSecurity(
            self,
            "security",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            config_role_arn=iam_construct.security_audit_role.arn,
            enable_config=False,  # Set to True if your account has no existing Config Recorder
            enable_security_hub=False,  # Set to True if your account is subscribed to Security Hub
        )

        # 6. Create WAF
        waf_construct = ZeroTrustWaf(
            self,
            "waf",
            environment_suffix=environment_suffix,
        )

        # 7. Generate compliance policy documents
        compliance_construct = ZeroTrustCompliance(
            self,
            "compliance",
            environment_suffix=environment_suffix,
        )
