During validation of the TapStack.yml CloudFormation template with cfn-lint, an error was raised:

E1020 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2' 
is not one of [...]


This occurred in the LaunchTemplate resource when specifying the ImageId. The issue is caused by incorrect usage of the SSM Parameter Store dynamic reference syntax in CloudFormation.

Root Cause

In the original template, the following was used:

ImageId: !Ref AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2


This syntax is invalid in CloudFormation. !Ref cannot be used directly with SSM parameter dynamic references in this way, which triggers cfn-lint error E1020.

Corrected Implementation

The correct approach is to define a Parameter that resolves the Amazon Linux 2 AMI ID via SSM, and then reference that parameter inside the Launch Template.