```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: Multi-region, multi-AZ infrastructure with failover and compliance

Parameters:
  Environment:
    Type: String
    Default: dev
  ComplianceTag:
    Type: String
    Default: HIPAA

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-123456
    us-west-2:
      AMI: ami-654321
    eu-central-1:
      AMI: ami-abcdef

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      Tags:
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PublicSubnet1

  # Repeat for other subnets and AZs

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
      LaunchConfigurationName: !Ref LaunchConfig
      MinSize: 1
      MaxSize: 3
      Tags:
        - Key: Environment
          Value: !Ref Environment

  LaunchConfig:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroups:
        - !Ref EC2SecurityGroup

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.medium
      Engine: postgres
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      MultiAZ: true

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref S3KMSKey

  WAF:
    Type: AWS::WAFv2::WebACL
    Properties:
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: AWS-AWSManagedRulesCommonRuleSet
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet

  SecretsManagerSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: DB credentials
      KmsKeyId: !Ref SecretsManagerKMSKey

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt ALB.DNSName
            Id: regionalALB
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
        Enabled: true

Outputs:
  ALBDNSName:
    Value: !GetAtt ALB.DNSName

Conditions:
  IsUSRegion: !Or [!Equals [!Ref "AWS::Region", us-east-1], !Equals [!Ref "AWS::Region", us-west-2]]

Resources:
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                aws:RequestedRegion: !Ref "AWS::Region"
```
  # Add policies, KMS keys, Config, CloudTrail, etc.