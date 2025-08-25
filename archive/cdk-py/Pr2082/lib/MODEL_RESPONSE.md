I'll help you create a basic cloud environment using AWS CDK with Python. Based on your requirements, I'll create a stack with an EC2 instance and S3 bucket in us-east-1 region, both properly tagged for your development environment.

Here's the complete CDK Python application:

## lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Tags,
    aws_ec2 as ec2,
    aws_s3 as s3,
    RemovalPolicy
)
from constructs import Construct

class TapStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create a VPC for the EC2 instance
        vpc = ec2.Vpc(self, "DevelopmentVPC",
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
        security_group = ec2.SecurityGroup(self, "DevelopmentSecurityGroup",
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
        instance = ec2.Instance(self, "DevelopmentInstance",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machine_image=ec2.AmazonLinuxImage(generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2),
            vpc=vpc,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            user_data=ec2.UserData.for_linux()
        )

        # Create S3 bucket with versioning enabled
        bucket = s3.Bucket(self, "DevelopmentBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,  # For development environment
            auto_delete_objects=True  # For development environment cleanup
        )

        # Apply tags to all resources in the stack
        Tags.of(self).add("Environment", "Development")
```

## tap.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Read the region from AWS_REGION file
region = "us-east-1"  # Default region
try:
    with open("lib/AWS_REGION", "r") as f:
        region = f.read().strip()
except FileNotFoundError:
    pass

TapStack(app, "TapStack",
    env=cdk.Environment(
        region=region
    )
)

app.synth()
```

## cdk.json

```json
{
  "app": "python tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib.CfnOutput",
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipal": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfigurationForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

This solution provides:

1. **EC2 Instance**: A t2.micro instance running Amazon Linux 2 in a public subnet
2. **S3 Bucket**: Versioning enabled with S3-managed encryption
3. **VPC Setup**: Basic VPC with public subnet (no NAT gateway to keep costs low)
4. **Security Group**: Allows SSH access (port 22) from anywhere
5. **Tags**: All resources tagged with 'Environment': 'Development'
6. **Region**: Deployed to us-east-1 as specified

The infrastructure uses AWS CDK's latest patterns and includes some optimizations for faster deployment. The S3 bucket is configured for easy cleanup in development environments, and the EC2 instance is placed in a public subnet to avoid NAT gateway costs.

To deploy this:
1. Ensure your AWS credentials are configured
2. Run `cdk bootstrap` (if first time using CDK in this region)
3. Run `cdk deploy` to create the resources

All resources will be properly tagged and ready for your development team to use!