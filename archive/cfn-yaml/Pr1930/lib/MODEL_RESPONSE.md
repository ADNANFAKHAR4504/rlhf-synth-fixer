AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to provision a secure, development-ready web hosting environment.

Parameters:
SSHLocation:
Description: The IP address range that can be used to SSH to the EC2 instances
Type: String
MinLength: '9'
MaxLength: '18'
Default: 0.0.0.0/0
AllowedPattern: (\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})
ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x.

Resources:
DevelopmentVPC:
Type: AWS::EC2::VPC
Properties:
CidrBlock: 10.0.0.0/16
EnableDnsSupport: true
EnableDnsHostnames: true
Tags: - Key: Name
Value: VPC-Development-UniqueId - Key: Environment
Value: Development

PublicSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref DevelopmentVPC
CidrBlock: 10.0.1.0/24
AvailabilityZone: us-west-2a
Tags: - Key: Name
Value: Subnet-Development-UniqueId1 - Key: Environment
Value: Development

PublicSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref DevelopmentVPC
CidrBlock: 10.0.2.0/24
AvailabilityZone: us-west-2b
Tags: - Key: Name
Value: Subnet-Development-UniqueId2 - Key: Environment
Value: Development

InternetGateway:
Type: AWS::EC2::InternetGateway
Properties:
Tags: - Key: Name
Value: IGW-Development-UniqueId - Key: Environment
Value: Development

InternetGatewayAttachment:
Type: AWS::EC2::VPCGatewayAttachment
Properties:
VpcId: !Ref DevelopmentVPC
InternetGatewayId: !Ref InternetGateway

PublicRouteTable:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref DevelopmentVPC
Tags: - Key: Name
Value: RouteTable-Development-UniqueId - Key: Environment
Value: Development

PublicRoute:
Type: AWS::EC2::Route
DependsOn: InternetGatewayAttachment
Properties:
RouteTableId: !Ref PublicRouteTable
DestinationCidrBlock: 0.0.0.0/0
GatewayId: !Ref InternetGateway

PublicSubnet1RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
SubnetId: !Ref PublicSubnet1
RouteTableId: !Ref PublicRouteTable

PublicSubnet2RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
SubnetId: !Ref PublicSubnet2
RouteTableId: !Ref PublicRouteTable

WebSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupDescription: Enable HTTP and SSH access
VpcId: !Ref DevelopmentVPC
SecurityGroupIngress: - IpProtocol: tcp
FromPort: 80
ToPort: 80
CidrIp: 0.0.0.0/0 - IpProtocol: tcp
FromPort: 22
ToPort: 22
CidrIp: !Ref SSHLocation
Tags: - Key: Name
Value: SG-Development-UniqueId - Key: Environment
Value: Development

EC2Instance:
Type: AWS::EC2::Instance
Properties:
InstanceType: t2.micro
SecurityGroupIds: - !Ref WebSecurityGroup
KeyName: your-key-pair-name
ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI for us-west-2
SubnetId: !Ref PublicSubnet1
Tags: - Key: Name
Value: EC2-Development-UniqueId - Key: Environment
Value: Development

S3Bucket:
Type: AWS::S3::Bucket
Properties:
BucketName: s3-bucket-development-uniqueid
VersioningConfiguration:
Status: Enabled
BucketEncryption:
ServerSideEncryptionConfiguration: - ServerSideEncryptionByDefault:
SSEAlgorithm: AES256
Tags: - Key: Name
Value: S3-Development-UniqueId - Key: Environment
Value: Development

EC2InstanceRole:
Type: AWS::IAM::Role
Properties:
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: ec2.amazonaws.com
Action: sts:AssumeRole
Policies: - PolicyName: S3AccessPolicy
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - s3:GetObject - s3:PutObject
Resource: !Sub arn:aws:s3:::s3-bucket-development-uniqueid/\*

EC2InstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
Roles: - !Ref EC2InstanceRole

EC2CloudWatchAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
ComparisonOperator: GreaterThanThreshold
EvaluationPeriods: 1
MetricName: CPUUtilization
Namespace: AWS/EC2
Period: 300
Statistic: Average
Threshold: 70
AlarmDescription: Alarm if CPU exceeds 70% for 5 minutes
Dimensions: - Name: InstanceId
Value: !Ref EC2Instance

Outputs:
VPCId:
Description: The ID of the VPC
Value: !Ref DevelopmentVPC
Subnet1Id:
Description: The ID of the first subnet
Value: !Ref PublicSubnet1
Subnet2Id:
Description: The ID of the second subnet
Value: !Ref PublicSubnet2
EC2PublicIP:
Description: Public IP address of the EC2 instance
Value: !GetAtt EC2Instance.PublicIp
