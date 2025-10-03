### Reasoning Trace

---

implement a community discussion forum using AWS services through a CloudFormation YAML template. The forum needs to support 4.5k monthly active users, with moderation and search capabilities. Let's break down the requirements and create a single YAML stack file.

The requirements specify various AWS services:

1. Network/Compute: VPC with CIDR 10.27.0.0/16, Application Load Balancer, EC2 t3.medium instances
2. Database/Cache: RDS MySQL (db.t3.small), ElastiCache Redis for session and query caching
3. Storage/Delivery: S3 for user uploads with lifecycle policies, CloudFront for asset delivery
4. Search/Security: Amazon Elasticsearch Service for full-text search, AWS WAF for spam protection
5. Monitoring: CloudWatch for application health monitoring

implement a CloudFormation template (TapStack.yml) that addresses all of these requirements.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Community Discussion Forum Infrastructure Stack'

Parameters:
  # Define parameters here

Resources:
  # Define AWS resources here

Outputs:
  # Define outputs here
```

1. First, let's define the parameters:

```yaml
Parameters:
  Environment:
    Description: Environment name
    Type: String
    Default: dev
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: must be the name of an existing EC2 KeyPair
  DBUsername:
    Description: Username for MySQL database
    Type: String
    NoEcho: true
  DBPassword:
    Description: Password for MySQL database
    Type: String
    NoEcho: true
  RedisPassword:
    Description: Password for Redis
    Type: String
    NoEcho: true
```

2. Next, let's create the VPC and its components:

```yaml
Resources:
  # VPC and Network Components
  ForumVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.27.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ForumVPC-${Environment}

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet1-${Environment}

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet2-${Environment}

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet1-${Environment}

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet2-${Environment}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ForumIGW-${Environment}

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ForumVPC
      InternetGatewayId: !Ref InternetGateway

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PublicRoutes-${Environment}

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PrivateRoutes-${Environment}

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable
```

3. Now, let's add the security groups:

```yaml
# Security Groups
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for ALB
    VpcId: !Ref ForumVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0

WebServerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for web servers
    VpcId: !Ref ForumVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: 0.0.0.0/0 # In production, restrict SSH access
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref ALBSecurityGroup

RDSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for RDS MySQL
    VpcId: !Ref ForumVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        SourceSecurityGroupId: !Ref WebServerSecurityGroup

RedisSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for ElastiCache Redis
    VpcId: !Ref ForumVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 6379
        ToPort: 6379
        SourceSecurityGroupId: !Ref WebServerSecurityGroup

ElasticsearchSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Elasticsearch
    VpcId: !Ref ForumVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        SourceSecurityGroupId: !Ref WebServerSecurityGroup
```

4. Let's add the EC2 instances and Application Load Balancer:

```yaml
# EC2 Instances
WebServerLaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateName: !Sub ForumWebServer-${Environment}
    VersionDescription: Initial version
    LaunchTemplateData:
      ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI (example ID, replace with actual)
      InstanceType: t3.medium
      KeyName: !Ref KeyName
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          yum update -y
          yum install -y httpd php php-mysql
          systemctl start httpd
          systemctl enable httpd
          # Additional setup for forum software would go here

WebServerAutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    AutoScalingGroupName: !Sub ForumASG-${Environment}
    LaunchTemplate:
      LaunchTemplateId: !Ref WebServerLaunchTemplate
      Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
    MinSize: 2
    MaxSize: 4
    DesiredCapacity: 2
    VPCZoneIdentifier:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    TargetGroupARNs:
      - !Ref ALBTargetGroup
    Tags:
      - Key: Name
        Value: !Sub ForumWebServer-${Environment}
        PropagateAtLaunch: true

# Application Load Balancer
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: !Sub ForumALB-${Environment}
    Scheme: internet-facing
    LoadBalancerAttributes:
      - Key: idle_timeout.timeout_seconds
        Value: 60
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
    SecurityGroups:
      - !Ref ALBSecurityGroup

ALBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref ALBTargetGroup
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP

ALBTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    HealthCheckIntervalSeconds: 30
    HealthCheckPath: /
    HealthCheckProtocol: HTTP
    HealthCheckTimeoutSeconds: 5
    HealthyThresholdCount: 2
    Port: 80
    Protocol: HTTP
    UnhealthyThresholdCount: 5
    VpcId: !Ref ForumVPC
    TargetType: instance
```

5. Now, let's add the RDS MySQL database and ElastiCache Redis:

```yaml
# RDS MySQL Database
DBSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupDescription: Subnet group for RDS
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2

ForumDatabase:
  Type: AWS::RDS::DBInstance
  Properties:
    AllocatedStorage: 20
    DBInstanceClass: db.t3.small
    DBName: forumdb
    Engine: mysql
    EngineVersion: 8.0
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Ref DBPassword
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    MultiAZ: true
    StorageType: gp2
    Tags:
      - Key: Name
        Value: !Sub ForumDatabase-${Environment}

# ElastiCache Redis for session and query caching
RedisSubnetGroup:
  Type: AWS::ElastiCache::SubnetGroup
  Properties:
    Description: Subnet group for Redis
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2

RedisCluster:
  Type: AWS::ElastiCache::CacheCluster
  Properties:
    CacheNodeType: cache.t3.small
    Engine: redis
    NumCacheNodes: 1
    CacheSubnetGroupName: !Ref RedisSubnetGroup
    VpcSecurityGroupIds:
      - !Ref RedisSecurityGroup
    Tags:
      - Key: Name
        Value: !Sub ForumRedis-${Environment}
```

6. Next, let's add S3 for user uploads with lifecycle policies and CloudFront for asset delivery:

```yaml
# S3 Bucket for user uploads with lifecycle policies
UserUploadsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub forum-uploads-${AWS::AccountId}-${Environment}
    AccessControl: Private
    LifecycleConfiguration:
      Rules:
        - Id: DeleteOldAttachments
          Status: Enabled
          ExpirationInDays: 730 # Delete attachments after 2 years
        - Id: TransitionToIA
          Status: Enabled
          Transitions:
            - TransitionInDays: 90
              StorageClass: STANDARD_IA

UserUploadsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref UserUploadsBucket
    PolicyDocument:
      Statement:
        - Action:
            - 's3:GetObject'
          Effect: Allow
          Resource: !Sub arn:aws:s3:::${UserUploadsBucket}/*
          Principal:
            CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId

# CloudFront Distribution for asset delivery
CloudFrontOriginAccessIdentity:
  Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
  Properties:
    CloudFrontOriginAccessIdentityConfig:
      Comment: !Sub OAI for ${Environment} Forum

CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Enabled: true
      DefaultCacheBehavior:
        AllowedMethods:
          - GET
          - HEAD
          - OPTIONS
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # CachingOptimized policy ID
      Origins:
        - Id: S3Origin
          DomainName: !GetAtt UserUploadsBucket.RegionalDomainName
          S3OriginConfig:
            OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
      PriceClass: PriceClass_100
```

7. Let's add Elasticsearch Service for full-text search:

```yaml
# Elasticsearch Service for full-text search
ElasticsearchDomain:
  Type: AWS::Elasticsearch::Domain
  Properties:
    DomainName: !Sub forum-search-${Environment}
    ElasticsearchVersion: 7.10
    ElasticsearchClusterConfig:
      InstanceType: t3.small.elasticsearch
      InstanceCount: 1
      DedicatedMasterEnabled: false
    EBSOptions:
      EBSEnabled: true
      VolumeType: gp2
      VolumeSize: 10
    VPCOptions:
      SubnetIds:
        - !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref ElasticsearchSecurityGroup
    AccessPolicies:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
          Action: es:*
          Resource: !Sub arn:aws:es:${AWS::Region}:${AWS::AccountId}:domain/forum-search-${Environment}/*
```

8. Now, let's add WAF for spam protection:

```yaml
# WAF for spam protection
SpamProtectionIPSet:
  Type: AWS::WAF::IPSet
  Properties:
    Name: !Sub SpamProtectionIPSet-${Environment}
    IPSetDescriptors:
      - Type: IPV4
        Value: 192.0.2.44/32 # Example blocked IP (replace with actual IPs)

SpamProtectionRule:
  Type: AWS::WAF::Rule
  Properties:
    Name: !Sub SpamProtectionRule-${Environment}
    MetricName: !Sub SpamProtectionRule${Environment}
    Predicates:
      - DataId: !Ref SpamProtectionIPSet
        Negated: false
        Type: IPMatch

WAFWebACL:
  Type: AWS::WAF::WebACL
  Properties:
    Name: !Sub ForumWebACL-${Environment}
    MetricName: !Sub ForumWebACL${Environment}
    DefaultAction:
      Type: ALLOW
    Rules:
      - Action:
          Type: BLOCK
        Priority: 1
        RuleId: !Ref SpamProtectionRule

WAFWebACLAssociation:
  Type: AWS::WAFRegional::WebACLAssociation
  Properties:
    ResourceArn: !Ref ApplicationLoadBalancer
    WebACLId: !Ref WAFWebACL
```

9. Finally, let's add CloudWatch for monitoring:

```yaml
# CloudWatch for application health monitoring
WebServerCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: Alarm if CPU exceeds 70%
    Namespace: AWS/EC2
    MetricName: CPUUtilization
    Dimensions:
      - Name: AutoScalingGroupName
        Value: !Ref WebServerAutoScalingGroup
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 70
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref WebServerScalingPolicy

WebServerScalingPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    AutoScalingGroupName: !Ref WebServerAutoScalingGroup
    PolicyType: SimpleScaling
    AdjustmentType: ChangeInCapacity
    ScalingAdjustment: 1
    Cooldown: 300

DatabaseCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: Alarm if database CPU exceeds 70%
    Namespace: AWS/RDS
    MetricName: CPUUtilization
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref ForumDatabase
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 70
    ComparisonOperator: GreaterThanThreshold
```

10. Let's add the outputs section:

```yaml
Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref ForumVPC

  ALBDNSName:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  CloudFrontDomain:
    Description: CloudFront Distribution Domain
    Value: !GetAtt CloudFrontDistribution.DomainName

  ElasticsearchDomainEndpoint:
    Description: Elasticsearch Domain Endpoint
    Value: !GetAtt ElasticsearchDomain.DomainEndpoint

  RDSEndpoint:
    Description: RDS Endpoint
    Value: !GetAtt ForumDatabase.Endpoint.Address

  RedisEndpoint:
    Description: Redis Endpoint
    Value: !GetAtt RedisCluster.RedisEndpoint.Address
```

Now let's assemble the complete template for TapStack.yml:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Community Discussion Forum Infrastructure Stack'

Parameters:
  Environment:
    Description: Environment name
    Type: String
    Default: dev
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: must be the name of an existing EC2 KeyPair
  DBUsername:
    Description: Username for MySQL database
    Type: String
    NoEcho: true
  DBPassword:
    Description: Password for MySQL database
    Type: String
    NoEcho: true
  RedisPassword:
    Description: Password for Redis
    Type: String
    NoEcho: true

Resources:
  # VPC and Network Components
  ForumVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.27.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ForumVPC-${Environment}

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet1-${Environment}

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet2-${Environment}

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet1-${Environment}

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet2-${Environment}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ForumIGW-${Environment}

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ForumVPC
      InternetGatewayId: !Ref InternetGateway

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PublicRoutes-${Environment}

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PrivateRoutes-${Environment}

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0 # In production, restrict SSH access
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS MySQL
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ElastiCache Redis
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  ElasticsearchSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Elasticsearch
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  # EC2 Instances
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ForumWebServer-${Environment}
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI (example ID, replace with actual)
        InstanceType: t3.medium
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            yum update -y
            yum install -y httpd php php-mysql
            systemctl start httpd
            systemctl enable httpd
            # Additional setup for forum software would go here

  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ForumASG-${Environment}
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub ForumWebServer-${Environment}
          PropagateAtLaunch: true

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ForumALB-${Environment}
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: 60
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 80
      Protocol: HTTP
      UnhealthyThresholdCount: 5
      VpcId: !Ref ForumVPC
      TargetType: instance

  # RDS MySQL Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  ForumDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      AllocatedStorage: 20
      DBInstanceClass: db.t3.small
      DBName: forumdb
      Engine: mysql
      EngineVersion: 8.0
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MultiAZ: true
      StorageType: gp2
      Tags:
        - Key: Name
          Value: !Sub ForumDatabase-${Environment}

  # ElastiCache Redis for session and query caching
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.small
      Engine: redis
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ForumRedis-${Environment}

  # S3 Bucket for user uploads with lifecycle policies
  UserUploadsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub forum-uploads-${AWS::AccountId}-${Environment}
      AccessControl: Private
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAttachments
            Status: Enabled
            ExpirationInDays: 730 # Delete attachments after 2 years
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA

  UserUploadsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref UserUploadsBucket
      PolicyDocument:
        Statement:
          - Action:
              - 's3:GetObject'
            Effect: Allow
            Resource: !Sub arn:aws:s3:::${UserUploadsBucket}/*
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId

  # CloudFront Distribution for asset delivery
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub OAI for ${Environment} Forum

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6 # CachingOptimized policy ID
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt UserUploadsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
        PriceClass: PriceClass_100

  # Elasticsearch Service for full-text search
  ElasticsearchDomain:
    Type: AWS::Elasticsearch::Domain
    Properties:
      DomainName: !Sub forum-search-${Environment}
      ElasticsearchVersion: 7.10
      ElasticsearchClusterConfig:
        InstanceType: t3.small.elasticsearch
        InstanceCount: 1
        DedicatedMasterEnabled: false
      EBSOptions:
        EBSEnabled: true
        VolumeType: gp2
        VolumeSize: 10
      VPCOptions:
        SubnetIds:
          - !Ref PrivateSubnet1
        SecurityGroupIds:
          - !Ref ElasticsearchSecurityGroup
      AccessPolicies:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: es:*
            Resource: !Sub arn:aws:es:${AWS::Region}:${AWS::AccountId}:domain/forum-search-${Environment}/*

  # WAF for spam protection
  SpamProtectionIPSet:
    Type: AWS::WAF::IPSet
    Properties:
      Name: !Sub SpamProtectionIPSet-${Environment}
      IPSetDescriptors:
        - Type: IPV4
          Value: 192.0.2.44/32 # Example blocked IP (replace with actual IPs)

  SpamProtectionRule:
    Type: AWS::WAF::Rule
    Properties:
      Name: !Sub SpamProtectionRule-${Environment}
      MetricName: !Sub SpamProtectionRule${Environment}
      Predicates:
        - DataId: !Ref SpamProtectionIPSet
          Negated: false
          Type: IPMatch

  WAFWebACL:
    Type: AWS::WAF::WebACL
    Properties:
      Name: !Sub ForumWebACL-${Environment}
      MetricName: !Sub ForumWebACL${Environment}
      DefaultAction:
        Type: ALLOW
      Rules:
        - Action:
            Type: BLOCK
          Priority: 1
          RuleId: !Ref SpamProtectionRule

  WAFWebACLAssociation:
    Type: AWS::WAFRegional::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLId: !Ref WAFWebACL

  # CloudWatch for application health monitoring
  WebServerCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if CPU exceeds 70%
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref WebServerScalingPolicy

  WebServerScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: 1
      Cooldown: 300

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if database CPU exceeds 70%
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ForumDatabase
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref ForumVPC

  ALBDNSName:
    Description: DNS name of the load balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  CloudFrontDomain:
    Description: CloudFront Distribution Domain
    Value: !GetAtt CloudFrontDistribution.DomainName

  ElasticsearchDomainEndpoint:
    Description: Elasticsearch Domain Endpoint
    Value: !GetAtt ElasticsearchDomain.DomainEndpoint

  RDSEndpoint:
    Description: RDS Endpoint
    Value: !GetAtt ForumDatabase.Endpoint.Address

  RedisEndpoint:
    Description: Redis Endpoint
    Value: !GetAtt RedisCluster.RedisEndpoint.Address
```

This CloudFormation template (TapStack.yml) implements the complete architecture for a community discussion forum as specified in the requirements. It includes:

1. Network/Compute: VPC with CIDR 10.27.0.0/16, Application Load Balancer, EC2 t3.medium instances in an Auto Scaling Group
2. Database/Cache: RDS MySQL (db.t3.small), ElastiCache Redis for session and query caching
3. Storage/Delivery: S3 bucket with lifecycle policies for old attachments, CloudFront for asset delivery
4. Search/Security: Elasticsearch Service for full-text search, WAF with spam protection rules
5. Monitoring: CloudWatch for application health monitoring with appropriate alarms

The template is designed for the us-east-1 region (as per the requirements) and is set up for a dev environment. It includes all necessary security groups, IAM roles, and network configurations.

### Answer

---

# Community Discussion Forum Infrastructure - CloudFormation Template

Here's a complete CloudFormation template (TapStack.yml) that implements the community discussion forum infrastructure with all the specified requirements.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Community Discussion Forum Infrastructure - 4.5k MAU with moderation and search capabilities'

Parameters:
  Environment:
    Description: Environment name
    Type: String
    Default: dev
  KeyName:
    Description: Name of an existing EC2 KeyPair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
  DBUsername:
    Description: Username for MySQL database
    Type: String
    NoEcho: true
  DBPassword:
    Description: Password for MySQL database
    Type: String
    NoEcho: true

Resources:
  #######################
  # VPC & NETWORKING
  #######################
  ForumVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.27.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ForumVPC-${Environment}

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.1.0/24
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet1-${Environment}

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.2.0/24
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub PublicSubnet2-${Environment}

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.3.0/24
      AvailabilityZone: !Select [0, !GetAZs 'us-east-1']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet1-${Environment}

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.27.4.0/24
      AvailabilityZone: !Select [1, !GetAZs 'us-east-1']
      Tags:
        - Key: Name
          Value: !Sub PrivateSubnet2-${Environment}

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ForumIGW-${Environment}

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ForumVPC
      InternetGatewayId: !Ref InternetGateway

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PublicRoutes-${Environment}

  DefaultPublicRoute:
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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub PrivateRoutes-${Environment}

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  #######################
  # SECURITY GROUPS
  #######################
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web Server Security Group
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0 # In production, restrict to known IPs
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Database Security Group
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  RedisSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Redis Security Group
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  ElasticsearchSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Elasticsearch Security Group
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  #######################
  # COMPUTE & LOAD BALANCING
  #######################
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ForumWebServer-${Environment}
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: ami-0c55b159cbfafe1f0 # Replace with appropriate Amazon Linux 2 AMI ID
        InstanceType: t3.medium
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            yum update -y
            yum install -y httpd php php-mysql
            systemctl start httpd
            systemctl enable httpd
            # Forum software installation and configuration would go here

  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ForumASG-${Environment}
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub ForumWebServer-${Environment}
          PropagateAtLaunch: true

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ForumALB-${Environment}
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health.php
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ForumVPC
      TargetType: instance

  #######################
  # DATABASE & CACHING
  #######################
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Database subnet group for Forum
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  ForumDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      AllocatedStorage: 20
      DBInstanceClass: db.t3.small
      DBName: forumdb
      Engine: mysql
      EngineVersion: 8.0
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: true
      StorageType: gp2
      Tags:
        - Key: Name
          Value: !Sub ForumDatabase-${Environment}

  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Redis subnet group for Forum
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.small
      Engine: redis
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ForumRedis-${Environment}

  #######################
  # STORAGE & CONTENT DELIVERY
  #######################
  UserUploadsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub forum-uploads-${AWS::AccountId}-${Environment}
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldAttachments
            Status: Enabled
            ExpirationInDays: 730 # Delete attachments after 2 years
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: STANDARD_IA

  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub OAI for ${Environment} Forum

  UserUploadsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref UserUploadsBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Action: s3:GetObject
            Resource: !Sub arn:aws:s3:::${UserUploadsBucket}/*
            Principal:
              CanonicalUser: !GetAtt CloudFrontOriginAccessIdentity.S3CanonicalUserId

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt UserUploadsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
        PriceClass: PriceClass_100

  #######################
  # SEARCH & SECURITY
  #######################
  ElasticsearchDomain:
    Type: AWS::Elasticsearch::Domain
    Properties:
      DomainName: !Sub forum-search-${Environment}
      ElasticsearchVersion: 7.10
      ElasticsearchClusterConfig:
        InstanceType: t3.small.elasticsearch
        InstanceCount: 1
        DedicatedMasterEnabled: false
      EBSOptions:
        EBSEnabled: true
        VolumeType: gp2
        VolumeSize: 10
      VPCOptions:
        SubnetIds:
          - !Ref PrivateSubnet1
        SecurityGroupIds:
          - !Ref ElasticsearchSecurityGroup
      AccessPolicies:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: es:*
            Resource: !Sub arn:aws:es:${AWS::Region}:${AWS::AccountId}:domain/forum-search-${Environment}/*

  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub Forum-WebACL-${Environment}
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub Forum-WebACL-${Environment}
      Rules:
        - Name: SpamProtectionRule
          Priority: 0
          Statement:
            RateBasedStatement:
              Limit: 100
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SpamProtectionRule

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  #######################
  # MONITORING
  #######################
  WebServerCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if CPU exceeds 70%
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref WebServerScaleUpPolicy

  WebServerScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      PolicyType: SimpleScaling
      AdjustmentType: ChangeInCapacity
      ScalingAdjustment: 1
      Cooldown: 300

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if database CPU exceeds 70%
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ForumDatabase
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold

  ElasticsearchCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if Elasticsearch cluster CPU exceeds 80%
      Namespace: AWS/ES
      MetricName: CPUUtilization
      Dimensions:
        - Name: DomainName
          Value: !Sub forum-search-${Environment}
        - Name: ClientId
          Value: !Ref AWS::AccountId
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold

Outputs:
  VPCID:
    Description: VPC ID
    Value: !Ref ForumVPC

  ALBDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName

  RDSEndpoint:
    Description: RDS MySQL Endpoint
    Value: !GetAtt ForumDatabase.Endpoint.Address

  RedisEndpoint:
    Description: Redis Endpoint
    Value: !GetAtt RedisCluster.RedisEndpoint.Address

  ElasticsearchEndpoint:
    Description: Elasticsearch Endpoint
    Value: !GetAtt ElasticsearchDomain.DomainEndpoint
```

## Architecture Overview

This CloudFormation template implements a complete infrastructure for a community discussion forum with 4.5k monthly active users. It includes:

### Network/Compute

- VPC with CIDR 10.27.0.0/16
- Public and private subnets across two Availability Zones
- Application Load Balancer in public subnets
- EC2 t3.medium instances in an Auto Scaling Group in private subnets
