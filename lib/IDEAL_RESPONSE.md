AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Production-ready app environment in AWS (us-east-1). Uses the specified existing VPC,
  creates a dedicated secondary CIDR and subnet (no IAM roles), launches an EC2 instance
  on the latest Amazon Linux 2 AMI (via SSM), allows only SSH/HTTPS inbound, and provisions
  an S3 bucket with server-side encryption. All resources tagged Environment: Production.

Metadata:
  ProvidedData:
    ExistingVpcIdLiteral: "vpc-12345abcde"

Rules:
  MustBeUsEast1:
    Assertions:
      - Assert: !Equals [ !Ref "AWS::Region", "us-east-1" ]
        AssertDescription: "This stack must be deployed in us-east-1."

Parameters:
  # Real VPC you provided
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: Existing VPC ID in us-east-1.
    Default: vpc-002dd1e7eb944d35a

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedPattern: '^[a-z0-9]+\.[a-z0-9]+$'
    Description: EC2 instance type.

  IngressCidrSsh:
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: ^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)\/(3[0-2]|[12]?\d)$
    Description: IPv4 CIDR for SSH ingress (port 22).

  IngressCidrHttps:
    Type: String
    Default: 0.0.0.0/0
    AllowedPattern: ^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)\/(3[0-2]|[12]?\d)$
    Description: IPv4 CIDR for HTTPS ingress (port 443).

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM public parameter for latest Amazon Linux 2 AMI (us-east-1).

  # Keeps CI happy when it always passes this param
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Optional pipeline suffix (not used by resources).

  # Use a secondary CIDR from the same RFC1918 block (172.16/12) to avoid org restrictions.
  SecondaryVpcCidr:
    Type: String
    Default: 172.20.0.0/16
    AllowedPattern: ^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)\/(3[0-2]|[12]?\d)$
    Description: Secondary IPv4 CIDR to associate to the VPC for this stack.

  AppSubnetCidr:
    Type: String
    Default: 172.20.1.0/24
    AllowedPattern: ^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)\/(3[0-2]|[12]?\d)$
    Description: Subnet CIDR carved from SecondaryVpcCidr.

Resources:
  # Associate an additional CIDR (no IAM role needed; uses CFN service permissions)
  AppVpcCidrAssociation:
    Type: AWS::EC2::VPCCidrBlock
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !Ref SecondaryVpcCidr

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow SSH (22) and HTTPS (443) only
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref IngressCidrSsh
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref IngressCidrHttps
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Production

  AppSubnet:
    Type: AWS::EC2::Subnet
    DependsOn: AppVpcCidrAssociation
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !Ref AppSubnetCidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: Production

  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  AppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      SubnetId: !Ref AppSubnet
      SecurityGroupIds:
        - !Ref AppSecurityGroup
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  SecurityGroupId:
    Description: ID of the security group allowing SSH/HTTPS.
    Value: !Ref AppSecurityGroup
  InstanceId:
    Description: ID of the EC2 instance.
    Value: !Ref AppInstance
  InstancePublicIp:
    Description: Public IPv4 of the EC2 instance (if assigned).
    Value: !GetAtt AppInstance.PublicIp
  BucketName:
    Description: Name of the S3 bucket with SSE enabled.
    Value: !Ref AppBucket
  EnvironmentSuffixEcho:
    Description: Echo of the pipeline-provided EnvironmentSuffix parameter.
    Value: !Ref EnvironmentSuffix