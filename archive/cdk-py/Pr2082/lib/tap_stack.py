"""AWS CDK Stack for Development Environment."""
import os
from aws_cdk import (
  Stack,
  Tags,
  aws_ec2 as ec2,
  aws_s3 as s3,
  RemovalPolicy,
  CfnOutput
)
from constructs import Construct


class TapStack(Stack):
    """Development environment stack with EC2 instance and S3 bucket."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from context or environment variable
        environment_suffix = (
            self.node.try_get_context('environmentSuffix') or
            os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        )

        # Create a VPC for the EC2 instance
        vpc = ec2.Vpc(self, f"DevelopmentVPC{environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # No NAT gateway to keep costs low
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Create a security group for the EC2 instance
        security_group = ec2.SecurityGroup(
            self, f"DevelopmentSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for development EC2 instance",
            allow_all_outbound=True
        )

        # Allow SSH access from anywhere (you may want to restrict this)
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access"
        )

        # Create the EC2 instance
        instance = ec2.Instance(
            self, f"DevelopmentInstance{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T2, ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            vpc=vpc,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            user_data=ec2.UserData.for_linux()
        )

        # Create S3 bucket with versioning enabled
        bucket = s3.Bucket(self, f"DevelopmentBucket{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,  # For development environment
            auto_delete_objects=True  # For development environment cleanup
        )

        # Apply tags to all resources in the stack
        Tags.of(self).add("Environment", "Development")

        # Add outputs for integration testing
        CfnOutput(self, "VPCId",
            value=vpc.vpc_id,
            description="VPC ID")

        CfnOutput(self, "EC2InstanceId",
            value=instance.instance_id,
            description="EC2 Instance ID")

        CfnOutput(self, "EC2InstancePublicIp",
            value=instance.instance_public_ip,
            description="EC2 Instance Public IP")

        CfnOutput(self, "S3BucketName",
            value=bucket.bucket_name,
            description="S3 Bucket Name")

        CfnOutput(self, "SecurityGroupId",
            value=security_group.security_group_id,
            description="Security Group ID")
