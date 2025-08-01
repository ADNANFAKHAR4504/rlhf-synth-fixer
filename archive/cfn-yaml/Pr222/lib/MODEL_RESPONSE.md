<yaml_code>
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Highly available web application infrastructure with ALB, ASG, RDS, and S3

Parameters:
  ACMCertificateARN:
    Type: String
    Description: ARN of the ACM certificate
  HostedZoneId:
    Type: String
    Description: Route 53 Hosted Zone ID
  DomainName:
    Type: String
    Description: Custom domain name
  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: Master password for RDS

Resources:
  # VPC & Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties: 
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      Tags: [{Key: Environment, Value: Production}]

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-west-2a
      Tags: [{Key: Environment, Value: Production}]

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-west-2b
      Tags: [{Key: Environment, Value: Production}]

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties: {}

  IGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTPS from internet
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags: [{Key: Environment, Value: Production}]

  ASGSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP from ALB
      VpcId: !Ref VPC
      Tags: [{Key: Environment, Value: Production}]

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow MySQL from ASG
      VpcId: !Ref VPC
      Tags: [{Key: Environment, Value: Production}]

  RDSIngressRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref RDSSecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      SourceSecurityGroupId: !Ref ASGSecurityGroup

  # ALB & Target Group
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: WebAppALB
      Subnets: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      SecurityGroups: [!Ref ALBSecurityGroup]
      Scheme: internet-facing

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates: [!Ref ACMCertificateARN]
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebAppTargetGroup

  WebAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      HealthCheckPath: /health

  # EC2 & ASG
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: {Service: ec2.amazonaws.com}
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: s3:GetObject
                Resource: !Sub arn:aws:s3:::${StaticAssetsBucket}/*

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: WebAppLaunchTemplate
      LaunchTemplateData:
        InstanceType: t3.micro
        ImageId: ami-0abcdef1234567890 # Amazon Linux 2
        SecurityGroupIds: [!Ref ASGSecurityGroup]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceRole.Arn
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            echo "Hello World" > /var/www/html/index.html

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier: [!Ref PublicSubnet1, !Ref PublicSubnet2]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      TargetGroupARNs: [!Ref WebAppTargetGroup]
      Tags:
        - Key: Name
          Value: WebAppInstance
          PropagateAtLaunch: true

  # RDS Database
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      Engine: mysql
      MasterUsername: admin
      MasterUserPassword: !Ref DBMasterPassword
      MultiAZ: true
      VPCSecurityGroups: [!Ref RDSSecurityGroup]
      DBSubnetGroupName: !Ref DefaultDBSubnetGroup

  # S3 Buckets
  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${AWS::StackName}-alb-logs
      AccessControl: LogDeliveryWrite

  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${AWS::StackName}-static-assets
      WebsiteConfiguration:
        IndexDocument: index.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        IgnorePublicAcls: false
        BlockPublicPolicy: false
        RestrictPublicBuckets: false

  # Route 53
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID

Outputs:
  ALBDNSName:
    Value: !GetAtt ApplicationLoadBalancer.DNSName
  StaticAssetsURL:
    Value: !Sub http://${StaticAssetsBucket}.s3-website-${AWS::Region}.amazonaws.com
  Route53Record:
    Value: !Ref DNSRecord
</yaml_code>

**Key Security Considerations:**
1. HTTPS enforced through ALB
2. RDS Multi-AZ with restricted security group
3. IAM role with minimal S3 permissions
4. NoEcho parameter for database password
5. Security groups with least privilege access
```

This implementation follows AWS best practices for high availability through multi-AZ deployments, security through IAM roles and security groups, and maintainability through proper resource tagging and parameterization. The template is structured for clarity and uses intrinsic functions for dynamic configuration.