from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_kms as kms,
  aws_s3 as s3,
  NestedStack,
  CfnOutput,
  RemovalPolicy,
  Tags
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


# ---------- SecureS3Bucket Construct (defined inline) ----------
class SecureS3Bucket(Construct):
  def __init__(self, scope: Construct, id: str, bucket_name: str):
    super().__init__(scope, id)

    # KMS key for encryption
    self.kms_key = kms.Key(
      self, "BucketEncryptionKey",
      alias=f"{bucket_name}-kms-key",
      enable_key_rotation=True
    )

    # Secure S3 bucket
    self.bucket = s3.Bucket(
      self,
      "SecureS3Bucket",
      bucket_name=bucket_name,
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.kms_key,
      enforce_ssl=True,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for prod
      auto_delete_objects=True
    )

    # Bucket policy to deny insecure transport
    self.bucket.add_to_resource_policy(
      iam.PolicyStatement(
        actions=["s3:*"],
        resources=[
          self.bucket.bucket_arn,
          f"{self.bucket.bucket_arn}/*"
        ],
        effect=iam.Effect.DENY,
        principals=[iam.AnyPrincipal()],
        conditions={"Bool": {"aws:SecureTransport": "false"}}
      )
    )


# ---------- VPC Stack ----------
class VPCStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    self.vpc = ec2.Vpc(
      self,
      f"TapVpc-{environment_suffix}",
      max_azs=2,
      cidr="10.0.0.0/16",
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="PublicSubnet",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
          name="PrivateSubnet",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24,
        ),
      ],
    )

    Tags.of(self.vpc).add("Environment", environment_suffix)
    Tags.of(self.vpc).add("Project", "Tap")

    CfnOutput(
      self,
      f"VpcIdOutput-{environment_suffix}",
      value=self.vpc.vpc_id,
      export_name=f"VpcId-{environment_suffix}",
    )


# ---------- IAM Stack ----------
class IAMStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    custom_policy = iam.PolicyDocument(
      statements=[
        iam.PolicyStatement(
          actions=[
            "ec2:DescribeInstances",
            "ec2:DescribeTags",
          ],
          resources=["*"],
        )
      ]
    )

    self.role = iam.Role(
      self,
      f"TapRole-{environment_suffix}",
      assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
      inline_policies={"CustomEC2ReadOnlyPolicy": custom_policy},
    )

    Tags.of(self.role).add("Environment", environment_suffix)
    Tags.of(self.role).add("Project", "Tap")

    CfnOutput(
      self,
      f"RoleArnOutput-{environment_suffix}",
      value=self.role.role_arn,
      export_name=f"RoleArn-{environment_suffix}",
    )

# ---------- Main Tap Stack ----------
class TapStack(cdk.Stack):
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[TapStackProps] = None,
    **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    # VPC stack
    self.vpc_stack = VPCStack(
      self,
      f"VpcStack-{environment_suffix}",
      environment_suffix=environment_suffix,
    )

    # IAM stack
    self.iam_stack = IAMStack(
      self,
      f"IamStack-{environment_suffix}",
      environment_suffix=environment_suffix,
    )

    # Secure S3 Bucket stack
    self.secure_bucket = SecureS3Bucket(
      self,
      "SecureBucketConstruct",
      bucket_name=f"tap-secure-data-{environment_suffix}"
    )

    # Output references
    self.vpc = self.vpc_stack.vpc
    self.iam_role = self.iam_stack.role
    self.s3_bucket = self.secure_bucket.bucket
    
    CfnOutput(
      self,
      "SecureBucketNameOutput",
      value=self.secure_bucket.bucket.bucket_name,
      export_name="TapStackSecureBucketName"
    )

    CfnOutput(
      self,
      "IamRoleNameOutput",
      value=self.iam_stack.role.role_name,
      export_name="TapStackIamRoleName"
    )

