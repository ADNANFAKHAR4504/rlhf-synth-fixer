# MODEL_RESPONSE.md

## Prompt

**Task Title:** security-configuration-as-code_CloudFormation_YAML_y8dhye9sj3ab  
**Complexity:** Expert  
**Platform:** AWS CloudFormation  
**Language:** YAML  

**Prompt Instruction:**

Use AWS CloudFormation to define your infrastructure as code.

Ensure the VPC spans multiple Availability Zones for fault tolerance.  
Use AWS Identity and Access Management (IAM) to define custom roles and policies that limit permissions according to the principle of least privilege.  
Implement Amazon RDS for MySQL and ensure it uses Multi-AZ deployments for high availability.  
Set up S3 buckets with appropriate bucket policies and use server-side encryption.  
Utilize Amazon CloudWatch for monitoring and alerts setup to keep track of resources and performance.  
Incorporate auto-scaling groups for EC2 instances to maintain the necessary number of instances.  
Deploy a CloudFront distribution to serve content through S3 buckets, optimizing delivery by caching at edge locations.  
Apply AWS WAF to protect your application from web exploits and bots.  
Configure an Elastic Load Balancer to distribute incoming requests across multiple instances.  
Ensure all logs are securely stored in a dedicated logging bucket, using SSE.  
Utilize AWS Key Management Service (KMS) to manage encryption keys for sensitive data.  
Ensure all instances are launched with IAM roles instead of baking access keys into AMIs.  
VPC should have network ACLs and security groups configured according to best practices.

## Generated Output (CloudFormation YAML)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Highly secure and scalable web infrastructure

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

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties: 
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties: 
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP and SSH
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0

  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnets for RDS
      SubnetIds:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.medium
      Engine: MySQL
      MasterUsername: admin
      MasterUserPassword: SecretPassword123
      MultiAZ: true
      DBSubnetGroupName: !Ref RDSSubnetGroup
      VPCSecurityGroups:
        - !GetAtt EC2SecurityGroup.GroupId

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      BucketPolicy:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: ""
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none

  WAF:
    Type: AWS::WAFv2::WebACL
    Properties:
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: waf-metric

  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !GetAtt EC2SecurityGroup.GroupId

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP

  LaunchConfiguration:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: ami-0abcdef1234567890
      SecurityGroups:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      InstanceType: t2.micro

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AvailabilityZones: 
        - !Select [0, !GetAZs '']
        - !Select [1, !GetAZs '']
        - !Select [2, !GetAZs '']
      LaunchConfigurationName: !Ref LaunchConfiguration
      MinSize: 2
      MaxSize: 10
      LoadBalancerNames:
        - !Ref ALB
      TargetGroupARNs:
        - !Ref TargetGroup

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  EC2Role:
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
        - PolicyName: EC2S3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub "arn:aws:s3:::${S3Bucket}/*"

  CloudWatchAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      AlarmActions: 
        - !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic

Outputs:
  WebsiteURL:
    Description: URL for CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
```

# Evaluation Summary

| Feature | Result | Notes |
|--------|--------|--------|
| VPC with AZs | ✅ | Implemented with 3 AZs |
| IAM roles | ✅ | Included, but least privilege policy could be improved |
| RDS Multi-AZ | ✅ | `MultiAZ: true` set |
| Secure subnets for RDS | ❌ | Uses public subnets |
| S3 encryption | ✅ | AES256 |
| S3 bucket policy | ❌ | Self-reference in `!Sub` is invalid inside resource |
| CloudFront | ✅ | Setup with S3 origin |
| WAF association | ❌ | WAF defined but not associated |
| Logging | ❌ | No log bucket |
| KMS | ❌ | No CMK used |
| Secrets | ❌ | Hardcoded RDS password |
| Network ACLs | ❌ | Not defined |
| Use of deprecated LaunchConfiguration | ❌ | Should use LaunchTemplate |

## Verdict

❌ **FAIL** – Major security and production-readiness gaps.

---
