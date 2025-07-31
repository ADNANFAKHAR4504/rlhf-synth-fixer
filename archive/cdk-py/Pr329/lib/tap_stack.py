from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2, aws_iam as iam, NestedStack, CfnOutput, Tags
from constructs import Construct


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


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

    if environment_suffix == "staging":
      pass

    self.vpc_stack = VPCStack(
      self,
      f"VpcStack-{environment_suffix}",
      environment_suffix=environment_suffix,
    )

    self.iam_stack = IAMStack(
      self,
      f"IamStack-{environment_suffix}",
      environment_suffix=environment_suffix,
    )

    self.vpc = self.vpc_stack.vpc
    self.iam_role = self.iam_stack.role
