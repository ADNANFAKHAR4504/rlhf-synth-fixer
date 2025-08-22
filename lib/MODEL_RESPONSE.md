```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Highly Available Web Application with Auto Scaling, RDS Failover, Static EIP, Monitoring, and IAM.

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t2.micro
      - t3.micro
      - t3.small
    Description: EC2 instance type

  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access

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

  DBUsername:
    NoEcho: true
    Type: String

  DBPassword:
    NoEcho: true
    Type: String

Resources:

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: HA-VPC

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
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: true

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [ 0, !GetAZs '' ]

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [ 1, !GetAZs '' ]

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  EIP:
    Type: AWS::EC2::EIP

  NLB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: HA-NLB
      Type: network
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: load_balancing.cross_zone.enabled
          Value: true

  NLBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref NLB
      Port: 80
      Protocol: TCP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NLBTargetGroup

  NLBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: TCP
      TargetType: instance
      HealthCheckProtocol: TCP

  EIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      AllocationId: !GetAtt EIP.AllocationId
      NetworkInterfaceId: !Select [ 0, !GetAtt NLB.NetworkInterfaces ]

  WebAppRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      Policies:
        - PolicyName: WebAppPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:*
                Resource: '*'

  WebAppInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebAppRole

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: WebAppTemplate
      LaunchTemplateData:
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        IamInstanceProfile:
          Arn: !GetAtt WebAppInstanceProfile.Arn
        ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI (Update with latest)
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum install -y httpd
            systemctl enable httpd
            systemctl start httpd
            echo "Healthy" > /var/www/html/index.html

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref NLBTargetGroup
      HealthCheckType: EC2
      HealthCheckGracePeriod: 60
      MetricsCollection:
        - Granularity: "1Minute"
      Tags:
        - Key: Name
          Value: WebApp
          PropagateAtLaunch: true

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: 8.0.37
      MultiAZ: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      DBInstanceIdentifier: WebAppDB
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: RDS Subnet Group
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: RDS Access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref InstanceSecurityGroup

  CloudWatchAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "Trigger if any instance CPU > 80%"
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      Statistic: Average
      Period: 60
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmTopic
      OKActions:
        - !Ref AlarmTopic

  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      Subscription:
        - Endpoint: your-email@example.com
          Protocol: email
      TopicName: AlarmNotifications

Outputs:

  VPCId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2

  ElasticIPAddress:
    Description: Elastic IP associated with Load Balancer
    Value: !Ref EIP

  LoadBalancerDNS:
    Description: Network Load Balancer DNS Name
    Value: !GetAtt NLB.DNSName

  LoadBalancerArn:
    Description: ARN of the Network Load Balancer
    Value: !Ref NLB

  TargetGroupArn:
    Description: Target Group ARN for EC2 instances
    Value: !Ref NLBTargetGroup

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup

  LaunchTemplateId:
    Description: ID of the EC2 Launch Template
    Value: !Ref LaunchTemplate

  LaunchTemplateLatestVersion:
    Description: Latest version of the Launch Template
    Value: !GetAtt LaunchTemplate.LatestVersionNumber

  IAMRoleName:
    Description: Name of IAM Role assigned to EC2 instances
    Value: !Ref WebAppRole

  InstanceProfileArn:
    Description: ARN of the EC2 Instance Profile
    Value: !GetAtt WebAppInstanceProfile.Arn

  RDSEndpoint:
    Description: RDS Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address

  RDSInstanceIdentifier:
    Description: RDS Instance Identifier
    Value: !Ref RDSInstance

  RDSSubnetGroupName:
    Description: Name of the RDS Subnet Group
    Value: !Ref DBSubnetGroup

  RDSSecurityGroupId:
    Description: RDS Security Group ID
    Value: !Ref RDSSecurityGroup

  InstanceSecurityGroupId:
    Description: EC2 Instance Security Group ID
    Value: !Ref InstanceSecurityGroup

  CloudWatchAlarmName:
    Description: Name of the CPU Alarm
    Value: !Ref CloudWatchAlarm

  AlarmSNSTopicArn:
    Description: SNS Topic for Alarm Notifications
    Value: !Ref AlarmTopic

```