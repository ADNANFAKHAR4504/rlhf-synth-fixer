```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated failover between primary and standby EC2 instances using Route 53 health checks'

Parameters:
  HostedZoneId:
    Type: String
    Description: Route 53 Hosted Zone ID
    
  RecordName:
    Type: String
    Description: DNS record name for failover
    
  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      
  KeyName:
    Type: String
    Description: EC2 Key Pair name (optional)
    Default: ''
    
  AllowedSSHCidr:
    Type: String
    Description: CIDR block allowed for SSH access
    Default: 0.0.0.0/0
    
  HealthCheckPort:
    Type: Number
    Description: Port for health check
    Default: 80
    MinValue: 1
    MaxValue: 65535
    
  HealthCheckPath:
    Type: String
    Description: Path for health check
    Default: /
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
    Description: Latest Amazon Linux AMI ID

Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, '']]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  AttachGateway:
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
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

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

  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for primary and standby instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: SSH access from allowed CIDR
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-SecurityGroup'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  PrimaryInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref SecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<html><body><h1>Primary Instance</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/index.html
          systemctl restart httpd
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrimaryInstance'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: Role
          Value: Primary

  StandbyInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref 'AWS::NoValue']
      SubnetId: !Ref PublicSubnet2
      SecurityGroupIds:
        - !Ref SecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<html><body><h1>Standby Instance</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/index.html
          systemctl restart httpd
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-StandbyInstance'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: Role
          Value: Standby

  PrimaryEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      InstanceId: !Ref PrimaryInstance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrimaryEIP'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  StandbyEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      InstanceId: !Ref StandbyInstance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-StandbyEIP'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  PrimaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: !Ref HealthCheckPath
      FullyQualifiedDomainName: !Ref PrimaryEIP
      Port: !Ref HealthCheckPort
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrimaryHealthCheck'
        - Key: Project
          Value: 'IaC - AWS Nova Model Breaking'

  PrimaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref RecordName
      Type: A
      SetIdentifier: Primary
      Failover: PRIMARY
      TTL: 60
      ResourceRecords:
        - !Ref PrimaryEIP
      HealthCheckId: !Ref PrimaryHealthCheck

  StandbyRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref RecordName
      Type: A
      SetIdentifier: Standby
      Failover: SECONDARY
      TTL: 60
      ResourceRecords:
        - !Ref StandbyEIP

Outputs:
  PrimaryInstanceId:
    Description: Primary instance ID
    Value: !Ref PrimaryInstance
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryInstanceId'

  StandbyInstanceId:
    Description: Standby instance ID
    Value: !Ref StandbyInstance
    Export:
      Name: !Sub '${AWS::StackName}-StandbyInstanceId'

  PrimaryEIP:
    Description: Primary instance Elastic IP
    Value: !Ref PrimaryEIP
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryEIP'

  StandbyEIP:
    Description: Standby instance Elastic IP
    Value: !Ref StandbyEIP
    Export:
      Name: !Sub '${AWS::StackName}-StandbyEIP'

  DNSName:
    Description: Full DNS name for failover
    Value: !Ref RecordName
    Export:
      Name: !Sub '${AWS::StackName}-DNSName'

  HealthCheckId:
    Description: Primary health check ID
    Value: !Ref PrimaryHealthCheck
    Export:
      Name: !Sub '${AWS::StackName}-HealthCheckId'
```