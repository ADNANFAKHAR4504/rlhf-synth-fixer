```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Automated failover between primary and standby EC2 instances using Route 53 health checks"

Parameters:
  HostedZoneId:
    Type: String
    Description: Existing Route 53 Hosted Zone ID (required)
    Default: Z0457876OLTG958Q3IXN
  RecordName:
    Type: String
    Description: FQDN for failover record (e.g., tap-us-east-1.turing229221.com. or without trailing dot)
    Default: tap-us-east-1.turing229221.com.
  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]
  KeyName:
    Type: String
    Description: Existing EC2 Key Pair name (optional)
    Default: cf-task-keypair-TapStackpr104
  AllowedSSHCidr:
    Type: String
    Description: CIDR allowed for SSH (restrict in production)
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
    Description: Latest Amazon Linux 2023 AMI

Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, ""]]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-VPC"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-IGW"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

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
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PublicSubnet1"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PublicSubnet2"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PublicRouteTable"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

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
          Description: HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: SSH from allowed CIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all egress
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-SecurityGroup"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  PrimaryInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref "AWS::NoValue"]
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds: [!Ref SecurityGroup]
      UserData:
        Fn::Base64: |
          #!/bin/bash
          set -euxo pipefail
          dnf update -y
          dnf install -y httpd
          systemctl enable --now httpd
          cat >/var/www/html/index.html <<'HTML'
          <html><body>
          <h1>Primary Instance</h1>
          <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
          <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
          </body></html>
          HTML
          systemctl restart httpd
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PrimaryInstance"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"
        - Key: Role
          Value: Primary

  StandbyInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !If [HasKeyName, !Ref KeyName, !Ref "AWS::NoValue"]
      SubnetId: !Ref PublicSubnet2
      SecurityGroupIds: [!Ref SecurityGroup]
      UserData:
        Fn::Base64: |
          #!/bin/bash
          set -euxo pipefail
          dnf update -y
          dnf install -y httpd
          systemctl enable --now httpd
          cat >/var/www/html/index.html <<'HTML'
          <html><body>
          <h1>Standby Instance</h1>
          <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
          <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
          </body></html>
          HTML
          systemctl restart httpd
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-StandbyInstance"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"
        - Key: Role
          Value: Standby

  PrimaryEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PrimaryEIP"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  StandbyEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-StandbyEIP"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  PrimaryEIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      AllocationId: !GetAtt PrimaryEIP.AllocationId
      InstanceId: !Ref PrimaryInstance

  StandbyEIPAssociation:
    Type: AWS::EC2::EIPAssociation
    Properties:
      AllocationId: !GetAtt StandbyEIP.AllocationId
      InstanceId: !Ref StandbyInstance

  PrimaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTP
        IPAddress: !Ref PrimaryEIP
        Port: !Ref HealthCheckPort
        ResourcePath: !Ref HealthCheckPath
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PrimaryHealthCheck"
        - Key: Project
          Value: "IaC - AWS Nova Model Breaking"

  PrimaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref RecordName
      Type: A
      SetIdentifier: Primary
      Failover: PRIMARY
      TTL: 60
      ResourceRecords: [!Ref PrimaryEIP]
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
      ResourceRecords: [!Ref StandbyEIP]

Outputs:
  PrimaryInstanceId:
    Description: Primary instance ID
    Value: !Ref PrimaryInstance
    Export:
      Name: !Sub "${AWS::StackName}-PrimaryInstanceId"

  StandbyInstanceId:
    Description: Standby instance ID
    Value: !Ref StandbyInstance
    Export:
      Name: !Sub "${AWS::StackName}-StandbyInstanceId"

  PrimaryEIPOut:
    Description: Primary instance Elastic IP
    Value: !Ref PrimaryEIP
    Export:
      Name: !Sub "${AWS::StackName}-PrimaryEIP"

  StandbyEIPOut:
    Description: Standby instance Elastic IP
    Value: !Ref StandbyEIP
    Export:
      Name: !Sub "${AWS::StackName}-StandbyEIP"

  DNSName:
    Description: Full DNS name for failover (echoes RecordName)
    Value: !Ref RecordName
    Export:
      Name: !Sub "${AWS::StackName}-DNSName"

  HealthCheckId:
    Description: Primary health check ID
    Value: !Ref PrimaryHealthCheck
    Export:
      Name: !Sub "${AWS::StackName}-HealthCheckId"

  HostedZoneIdOutput:
    Description: Hosted Zone ID used for DNS
    Value: !Ref HostedZoneId
    Export:
      Name: !Sub "${AWS::StackName}-HostedZoneId"

  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"
```