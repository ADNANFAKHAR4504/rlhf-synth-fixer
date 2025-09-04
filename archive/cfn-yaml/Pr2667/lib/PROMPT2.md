The CloudFormation template you provided (TapStack.yml) is giving lint errors when I run cfn-lint. The error message is:

E1020 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
is not one of ['DomainName', 'HostedZoneId', 'CertificateArn', 'InstanceType', 'KeyPairName', 'VPC', 'InternetGateway', 
'AttachGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'NatEIP', 'NatGateway', 
'StaticAssetsBucket', 'CloudFrontDistribution', 'AppDataTable', 'EC2Role', 'InstanceProfile', 'InstanceSecurityGroup', 
'LaunchTemplate', 'AutoScalingGroup', 'ApplicationLoadBalancer', 'TargetGroup', 'Listener', 'HighCPUAlarm', 'DNSRecord', 
'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix']


This happens at:

lib/TapStack.yml:252:9


where the LaunchTemplate resource is using:

ImageId: !Ref AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2


I need you to fix this error by correctly referencing the latest Amazon Linux 2 AMI in CloudFormation YAML. The solution should:

Work with cfn-lint (no validation errors).

Use AWS SSM Parameter Store for retrieving the latest Amazon Linux 2 AMI.

Be compatible with the us-east-1 region.

Keep the template production-ready with no hard-coded AMI IDs.

Please provide the corrected TapStack.yml code snippet for the LaunchTemplate section, ensuring it passes CloudFormation validation and lint checks.