# Ideal Response

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Secure & Highly Available Web Application with RTO < 4 Hours

Parameters:
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16
  PublicSubnet1CIDR:
    Type: String
    Default: 10.0.1.0/24
  PublicSubnet2CIDR:
    Type: String
    Default: 10.0.2.0/24
  PrivateSubnet1CIDR:
    Type: String
    Default: 10.0.3.0/24
  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.4.0/24
  KeyPair:
    Type: AWS::EC2::KeyPair::KeyName
  AMI:
    Type: AWS::EC2::Image::Id
  CertificateArn:
    Type: String
    Description: ACM Certificate ARN for HTTPS

Resources:

  # VPC and Subnets
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: WebAppVPC

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR

  # NAT Gateway + Routing (for outbound access)
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  EIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSG
      Scheme: internet-facing

  LoadBalancerSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTPS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref LoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckPath: /

  # IAM Role for EC2
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AllowLogging
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:*
                Resource: "*"

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref InstanceRole]

  # Auto Scaling Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        InstanceType: t3.micro
        ImageId: !Ref AMI
        KeyName: !Ref KeyPair
        IamInstanceProfile:
          Name: !Ref InstanceProfile
        SecurityGroupIds:
          - !Ref InstanceSG
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "Hello from $(hostname -f)" > /var/www/html/index.html

  InstanceSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP from ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSG

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref TargetGroup

  # CloudWatch Monitoring
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up if CPU > 70% for 2 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      AlarmActions: []
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

  # RDS with Multi-AZ and Backup Retention
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: WebAppDB
      Engine: mysql
      MasterUsername: admin
      MasterUserPassword: MySecurePass123
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      MultiAZ: true
      PubliclyAccessible: false
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      DBSubnetGroupName: !Ref DBSubnetGroup

Outputs:
  WebsiteURL:
    Value: !Join ["", ["https://", !GetAtt LoadBalancer.DNSName]]
    Description: URL of the web application
```