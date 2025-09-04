your provided TapStack.yml code is giving me a lint error:

E1020 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2' is not one of ['EnvironmentName', 'VpcCIDR', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'InstanceType', 'KeyName', 'CertificateArn', 'VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PublicRoute', 'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation', 'NatEIP1', 'NatGateway1', 'NatEIP2', 'NatGateway2', 'PrivateRouteTable1', 'PrivateRoute1', 'PrivateSubnet1RouteTableAssociation', 'PrivateRouteTable2', 'PrivateRoute2', 'PrivateSubnet2RouteTableAssociation', 'LoadBalancerSG', 'InstanceSG', 'LaunchTemplate', 'AutoScalingGroup', 'LoadBalancer', 'TargetGroup', 'Listener', 'CPUAlarmHigh', 'CPUAlarmLow', 'ScaleUpPolicy', 'ScaleDownPolicy', 'LogBucket', 'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix']


File: lib/TapStack.yml:231:9

It looks like the issue is with the LaunchTemplate → ImageId section.
Please fix the code to correctly reference the latest Amazon Linux 2 AMI using SSM Parameter Store in CloudFormation so that cfn-lint passes without errors.