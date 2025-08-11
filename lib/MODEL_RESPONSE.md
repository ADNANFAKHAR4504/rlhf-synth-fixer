```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Nova Application Baseline Infrastructure - Multi-Region StackSet Template'

# Region-specific AMI mappings for Amazon Linux 2
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type
    us-west-2:
      AMI: ami-0892d3c7ee96c0bf7  # Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type

Resources:
  # KMS Key for regional encryption
  NovaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for Nova application encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for S3 and EBS
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline
    DeletionPolicy: Retain

  # KMS Key Alias
  NovaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/nova-app-key
      TargetKeyId: !Ref NovaKMSKey

  # S3 Bucket with regional naming and encryption
  NovaDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-data-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # IAM Role for EC2 instances (Global resource)
  EC2AppRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaEC2Role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: NovaAppPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 read-only access to regional bucket
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${NovaDataBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref NovaDataBucket
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                  - logs:DescribeLogGroups
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              # KMS permissions for decryption
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:DescribeKey
                Resource: !GetAtt NovaKMSKey.Arn
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2AppRole

  # Security Group for EC2 instances
  NovaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Nova application EC2 instances'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS API calls'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # EC2 Instance with encrypted EBS volume
  NovaEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref NovaSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref NovaKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent

          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/nova-app/${AWS::Region}",
                      "log_stream_name": "{instance_id}/messages"
                    }
                  ]
                }
              }
            }
          }
          EOF

          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub 'Nova-App-Instance-${AWS::Region}'
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # AWS Config Configuration Recorder
  ConfigConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'nova-config-recorder-${AWS::Region}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: false

  # AWS Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'nova-config-delivery-${AWS::Region}'
      S3BucketName: !Ref ConfigBucket

  # S3 Bucket for Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'nova-config-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref NovaKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # Config Bucket Policy
  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${ConfigBucket}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub '${ConfigBucket}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  # IAM Role for Config
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Tags:
        - Key: Owner
          Value: YourName
        - Key: Purpose
          Value: Nova-App-Baseline

  # Config Rules
  S3BucketServerSideEncryptionEnabledRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  IAMRoleManagedPolicyCheckRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigConfigurationRecorder
    Properties:
      ConfigRuleName: iam-role-managed-policy-check
      InputParameters: |
        {
          "managedPolicyArns": "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        }
      Source:
        Owner: AWS
        SourceIdentifier: IAM_ROLE_MANAGED_POLICY_CHECK

Outputs:
  KMSKeyId:
    Description: 'KMS Key ID for Nova application'
    Value: !Ref NovaKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  S3BucketName:
    Description: 'S3 Bucket name for Nova application data'
    Value: !Ref NovaDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref NovaEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance'

  IAMRoleArn:
    Description: 'IAM Role ARN for EC2 instances'
    Value: !GetAtt EC2AppRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRole'

  Region:
    Description: 'Deployment Region'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```
