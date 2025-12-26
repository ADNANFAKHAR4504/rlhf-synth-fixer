```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready infrastructure with EC2, S3, IAM, and security configurations - Region-locked to us-west-2'

# Metadata
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - AllowedSSHIP
      - Label:
          default: "Compute Configuration"
        Parameters:
          - InstanceType
      - Label:
          default: "Storage Configuration"
        Parameters:
          - S3BucketNameSuffix
    ParameterLabels:
      AllowedSSHIP:
        default: "Allowed SSH IP Address"
      InstanceType:
        default: "EC2 Instance Type"
      S3BucketNameSuffix:
        default: "S3 Bucket Name Suffix"

# Parameters
Parameters:
  AllowedSSHIP:
    Description: 'IP address allowed to SSH to the EC2 instance (e.g., 203.0.113.0/32)'
    Type: String
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid IP CIDR range of the form x.x.x.x/x'
    Default: '10.0.0.1/32'
  
  InstanceType:
    Description: 'EC2 instance type for production workload'
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type (t3.micro or higher)'
  
  S3BucketNameSuffix:
    Description: 'Suffix for S3 bucket name to ensure global uniqueness'
    Type: String
    Default: 'prod-data'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
    MinLength: 3
    MaxLength: 20
  
  # AMI Parameter
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID from SSM Parameter Store'

# Rules
Rules:
  RegionRule:
    Assertions:
      - Assert: !Equals [!Ref 'AWS::Region', 'us-west-2']
        AssertDescription: 'This stack can only be deployed in us-west-2 region for production compliance'

Resources:
  # S3 Bucket
  ProdS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-data-${AWS::AccountId}-${S3BucketNameSuffix}'
      VersioningConfiguration:
        Status: Enabled  
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdS3Bucket
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Region
          Value: us-west-2

  # S3 Bucket Policy
  ProdS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdS3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ProdS3Bucket.Arn
              - !Sub '${ProdS3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # IAM Role
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ProdEC2Role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore  
      Policies:
        - PolicyName: ProdS3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 bucket specific read permissions
              - Sid: S3BucketReadAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:GetObjectVersionTagging'
                  - 's3:GetObjectTagging'
                  - 's3:ListBucket'
                  - 's3:ListBucketVersions'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !GetAtt ProdS3Bucket.Arn
                  - !Sub '${ProdS3Bucket.Arn}/*'
              # S3 list permissions
              - Sid: S3GeneralReadAccess
                Effect: Allow
                Action:
                  - 's3:ListAllMyBuckets'
                  - 's3:GetBucketLocation'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2Role
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Instance Profile
  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'ProdEC2InstanceProfile-${AWS::StackName}'
      Roles:
        - !Ref ProdEC2Role

  ProdKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub 'prod-keypair-${AWS::StackName}'
      KeyType: rsa
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdKeyPair
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Networking resources for production VPC
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdVPC
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdInternetGateway
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  ProdVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVPC
      InternetGatewayId: !Ref ProdInternetGateway

  ProdPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdPublicSubnet
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdPublicRouteTable
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  ProdPublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ProdInternetGateway

  ProdSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet
      RouteTableId: !Ref ProdPublicRouteTable

  # Security Group
  ProdSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ProdSecurityGroup-${AWS::StackName}'
      GroupDescription: 'Production security group for EC2 instance with restricted SSH access from specific IP'
      VpcId: !Ref ProdVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'SSH access from specified IP address only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS services and updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package repository access'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'DNS resolution'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: 'DNS resolution UDP'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdSecurityGroup
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  # EC2 Instance
  ProdEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId 
      InstanceType: !Ref InstanceType
      KeyName: !Ref ProdKeyPair
      IamInstanceProfile: !Ref ProdEC2InstanceProfile
      SubnetId: !Ref ProdPublicSubnet
      SecurityGroupIds:  
        - !GetAtt ProdSecurityGroup.GroupId
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
            Iops: 3000  
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          # Log all output for debugging
          exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
          
          # Update system packages
          yum update -y
          
          # Install essential tools
          yum install -y aws-cli amazon-cloudwatch-agent amazon-ssm-agent jq
          
          # Enable and start SSM agent for Session Manager access
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent
          
          # Create application directory structure
          mkdir -p /opt/prod-app/{data,logs,config}
          
          # Configure AWS CLI with region
          aws configure set region ${AWS::Region}
          aws configure set output json
          
          # Verify S3 bucket access
          echo "Testing S3 read access to ${ProdS3Bucket}"
          if aws s3 ls s3://${ProdS3Bucket}/ --region ${AWS::Region}; then
              echo "SUCCESS: S3 bucket access verified" > /opt/prod-app/s3-test.txt
          else
              echo "ERROR: Cannot access S3 bucket" > /opt/prod-app/s3-test.txt
          fi
          
          # Create detailed status file
          cat > /opt/prod-app/status.txt << EOF
          Production EC2 Instance Status Report
          =====================================
          Initialization Time: $(date)
          Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)
          Instance Type: $(ec2-metadata --instance-type | cut -d " " -f 2)
          Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)
          Region: ${AWS::Region}
          S3 Bucket: ${ProdS3Bucket}
          IAM Role: ${ProdEC2Role}
          Stack Name: ${AWS::StackName}
          Environment: Production
          EOF
          
          # Set up CloudWatch logs
          cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json << EOF
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/prod/system",
                      "log_stream_name": "{instance_id}"
                    }
                  ]
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config \
            -m ec2 \
            -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json \
            -s
          
          # Send CloudFormation success signal
          /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource ProdEC2Instance --region ${AWS::Region}
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2Instance
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'
        - Key: Backup
          Value: Daily
        - Key: OS
          Value: AmazonLinux2
    CreationPolicy:
      ResourceSignal:
        Timeout: PT15M  

  # CloudWatch Alarm for CPU monitoring
  ProdEC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ProdEC2-HighCPU-${AWS::StackName}'
      AlarmDescription: 'Alert when CPU utilization exceeds 80% for 5 minutes'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2CPUAlarm
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  # CloudWatch Alarm for disk space monitoring
  ProdEC2DiskAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ProdEC2-LowDiskSpace-${AWS::StackName}'
      AlarmDescription: 'Alert when disk usage exceeds 85%'
      MetricName: DiskSpaceUtilization
      Namespace: CWAgent
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
        - Name: ImageId
          Value: !Ref LatestAmiId
        - Name: InstanceType
          Value: !Ref InstanceType
        - Name: Path
          Value: '/'
        - Name: FileSystemType
          Value: xfs
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2DiskAlarm
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

# Outputs
Outputs:
  S3BucketName:
    Description: 'Name of the production S3 bucket with versioning enabled'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-ProdS3BucketName'
  
  EC2InstancePublicDNS:  
    Description: 'Public DNS name of the EC2 instance for external access'
    Value: !GetAtt ProdEC2Instance.PublicDnsName
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2PublicDNS'

  S3BucketArn:
    Description: 'ARN of the production S3 bucket for IAM policy references'
    Value: !GetAtt ProdS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ProdS3BucketArn'
  
  S3BucketDomainName:
    Description: 'Domain name of the S3 bucket for direct access'
    Value: !GetAtt ProdS3Bucket.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-ProdS3BucketDomain'
  
  EC2InstanceId:
    Description: 'Instance ID of the production EC2 instance'
    Value: !Ref ProdEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2InstanceId'
  
  EC2InstancePublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt ProdEC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2PublicIP'
  
  EC2InstancePrivateIP:
    Description: 'Private IP address of the EC2 instance for VPC internal communication'
    Value: !GetAtt ProdEC2Instance.PrivateIp
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2PrivateIP'
  
  EC2InstanceAvailabilityZone:
    Description: 'Availability Zone where the EC2 instance is deployed'
    Value: !GetAtt ProdEC2Instance.AvailabilityZone
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2AZ'
  
  IAMRoleArn:
    Description: 'ARN of the IAM role attached to EC2 instance'
    Value: !GetAtt ProdEC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2RoleArn'
  
  IAMRoleName:
    Description: 'Name of the IAM role for reference in policies'
    Value: !Ref ProdEC2Role
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2RoleName'
  
  SecurityGroupId:
    Description: 'Security Group ID for the EC2 instance'
    Value: !GetAtt ProdSecurityGroup.GroupId
    Export:
      Name: !Sub '${AWS::StackName}-ProdSecurityGroupId'
  
  SSHCommand:
    Description: 'Complete SSH connection command for administrative access'
    Value: !Sub 'ssh -i ~/.ssh/${ProdKeyPair}.pem ec2-user@${ProdEC2Instance.PublicDnsName}'
  
  SessionManagerURL:
    Description: 'AWS Session Manager URL for browser-based access'
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/systems-manager/session-manager/${ProdEC2Instance}?region=${AWS::Region}'
  
  S3BucketURL:
    Description: 'S3 bucket console URL for management'
    Value: !Sub 'https://s3.console.aws.amazon.com/s3/buckets/${ProdS3Bucket}?region=${AWS::Region}'
  
  StackRegion:
    Description: 'AWS Region where the stack is deployed (must be us-west-2)'
    Value: !Ref 'AWS::Region'
  
  CloudWatchDashboardURL:
    Description: 'URL to CloudWatch dashboard for monitoring'
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:'
  
  DeploymentTimestamp:
    Description: 'Timestamp when the stack was created or last updated'
    Value: !Ref 'AWS::StackId'
```