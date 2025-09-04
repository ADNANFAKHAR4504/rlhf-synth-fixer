The CloudFormation template provided earlier encountered a lint error with the ImageId property in the LaunchTemplate resource. The error:

E1020 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2' is not one of [...]

Root Cause

CloudFormation does support retrieving the latest Amazon Linux 2 AMI through SSM Parameter Store, but the syntax used in the template was invalid for cfn-lint. Specifically:

ImageId: !Ref AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2


This form incorrectly mixes intrinsic functions with the SSM parameter type.

Correct Fix

The correct way to fetch the latest Amazon Linux 2 AMI in CloudFormation is to declare a Parameter of type SSM and then reference it inside the LaunchTemplate. Example:

Parameters:
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID from SSM Parameter Store


Then update the Launch Template:

LaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateData:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: !Ref LatestAmiId
      SecurityGroupIds:
        - !Ref InstanceSG

Outcome

The template now validates successfully with cfn-lint.

AMI IDs are automatically updated whenever AWS refreshes the latest Amazon Linux 2 image.

The approach ensures future-proof deployments without requiring manual AMI updates.