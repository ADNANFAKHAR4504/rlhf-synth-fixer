AWSTemplateFormatVersion: '2010-09-09'
Parameters:
  ProjectName:
    Type: String
  Region1:
    Type: String
    Default: us-east-1
  Region2:
    Type: String
    Default: us-west-2
  VpcCidr1:
    Type: String
    Default: 10.0.0.0/16
  VpcCidr2:
    Type: String
    Default: 10.1.0.0/16
  PublicSubnet1Cidr1:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2Cidr1:
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnet1Cidr1:
    Type: String
    Default: 10.0.101.0/24
  PrivateSubnet2Cidr1:
    Type: String
    Default: 10.0.102.0/24
  PublicSubnet1Cidr2:
    Type: String
    Default: 10.1.1.0/24
  PublicSubnet2Cidr2:
    Type: String
    Default: 10.1.2.0/24
  PrivateSubnet1Cidr2:
    Type: String
    Default: 10.1.101.0/24
  PrivateSubnet2Cidr2:
    Type: String
    Default: 10.1.102.0/24
  InstanceType:
    Type: String
    Default: t3.micro
  AMI:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
  DBInstanceType:
    Type: String
    Default: db.t3.micro
  DBAllocatedStorage:
    Type: Number
    Default: 20
  DBUsername:
    Type: String
    NoEcho: true
  DBPassword:
    Type: String
    NoEcho: true

Mappings:
  RegionMap:
    us-east-1:
      AMI: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
    us-west-2:
      AMI: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"

Resources:
  # Region 1 VPC
  VpcR1:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr1
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-vpc-r1

  # Region 2 VPC
  VpcR2:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr2
      Tags:
        - Key: Name
          Value: !Sub ${ProjectName}-vpc-r2

  # Subnets, IGWs, NATs, Routes omitted for brevity...
  # Security Groups
  ELBSecurityGroupR1:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ELB Security Group
      VpcId: !Ref VpcR1
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  AppSecurityGroupR1:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App Security Group
      VpcId: !Ref VpcR1
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ELBSecurityGroupR1
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0

  # RDS, ALB, EC2, IAM Roles omitted for brevity...

Outputs:
  VpcIdR1:
    Value: !Ref VpcR1
  VpcIdR2:
    Value: !Ref VpcR2