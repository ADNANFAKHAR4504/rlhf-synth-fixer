
AWSTemplateFormatVersion: '2010-09-09'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties: 
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties: 
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties: 
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
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

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties: 
      GroupDescription: Enable HTTP and HTTPS access
      VpcId: !Ref VPC
      SecurityGroupIngress: 
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties: 
      Subnets: 
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups: 
        - !Ref WebServerSecurityGroup
      Scheme: internet-facing

  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties: 
      LoadBalancerArn: !Ref LoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates: 
        - CertificateArn: arn:aws:acm:region:account-id:certificate/certificate-id
      DefaultActions: 
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties: 
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      TargetType: instance

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties: 
      VPCZoneIdentifier: 
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchConfigurationName: !Ref LaunchConfig
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs: 
        - !Ref TargetGroup

  LaunchConfig:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties: 
      ImageId: ami-0abcdef1234567890
      InstanceType: t2.micro
      SecurityGroups: 
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties: 
      Roles: 
        - !Ref EC2InstanceRole

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties: 
      AssumeRolePolicyDocument: 
        Version: '2012-10-17'
        Statement: 
          - Effect: Allow
            Principal: 
              Service: 
                - ec2.amazonaws.com
            Action: 
              - sts:AssumeRole
      Policies: 
        - PolicyName: EC2S3Access
          PolicyDocument: 
            Version: '2012-10-17'
            Statement: 
              - Effect: Allow
                Action: 
                  - s3:*
                Resource: "*"

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
      DBInstanceClass: db.t2.micro
      Engine: MySQL
      MasterUsername: admin
      MasterUserPassword: password
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      StorageType: gp2
      AllocatedStorage: 20
      VPCSecurityGroups: 
        - !Ref DBSecurityGroup

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties: 
      GroupDescription: Enable database access
      VpcId: !Ref VPC

  CloudWatchAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties: 
      AlarmDescription: Alarm if CPU exceeds 70% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      AlarmActions: 
        - !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic

Outputs:
  WebsiteURL:
    Description: URL of the web application
    Value: !Sub "http://${LoadBalancer.DNSName}"