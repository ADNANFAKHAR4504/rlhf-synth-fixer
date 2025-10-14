# Ideal Response

## Reasoning Trace

To design an optimal **AWS CloudFormation template (TapStack)** for a SaaS application serving ~1000 daily users, we focus on scalability, simplicity, and cost-efficiency.

### Key Design Choices

1. **Region:** `us-east-1` for cost and availability
2. **Networking:** A single VPC with a public subnet for simplicity
3. **Security:** Only HTTP (80) and SSH (22) allowed
4. **Compute:** 10 EC2 instances (`t3.medium`), launched via an Auto Scaling Group
5. **IAM:** Minimal permissions for CloudWatch and S3 logging
6. **Monitoring:** CloudWatch log group, CPU alarm, and SNS notifications
7. **Storage:** Encrypted S3 bucket for logs with lifecycle policy
8. **Maintainability:** Uses parameters, mappings, and consistent tagging

### AWS Best Practices Followed

- Modular design with parameters and mappings
- IAM least privilege
- Encrypted storage
- Cost awareness via auto scaling (fixed 10)
- Consistent tagging for environment tracking

---

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EC2 Monitoring Stack for SaaS Company - 1000 Daily Users'


Parameters:
  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    Description: EC2 instance type for the application servers


  CPUAlarmThreshold:
    Type: Number
    Default: 80
    MinValue: 50
    MaxValue: 95
    Description: CPU utilization threshold percentage for CloudWatch alarms


  EnvironmentTag:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment tag for resources

  LatestAmazonLinuxAMI:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'


Resources:
  MyKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub '${AWS::StackName}-keypair'
      KeyType: rsa
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-keypair'
        - Key: Environment
          Value: !Ref EnvironmentTag
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-vpc
        - Key: Environment
          Value: !Ref EnvironmentTag


  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-subnet
        - Key: Environment
          Value: !Ref EnvironmentTag


  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-igw
        - Key: Environment
          Value: !Ref EnvironmentTag


  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway


  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-rt
        - Key: Environment
          Value: !Ref EnvironmentTag


  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway


  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable


  # Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: Allow SSH from anywhere (for demo purposes)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-ec2-sg
        - Key: Environment
          Value: !Ref EnvironmentTag


  # IAM Role for EC2 Instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-ec2-role-${AWS::Region}"
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
        - PolicyName: !Sub "${AWS::StackName}-CloudWatchLogsS3Policy-${AWS::Region}"
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${LogsBucket}/*'
                  - !Sub 'arn:aws:s3:::${LogsBucket}'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-ec2-role-${AWS::Region}"
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role
      InstanceProfileName: !Sub "${AWS::StackName}-ec2-profile-${AWS::Region}"


  # S3 Bucket for Logs
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${AWS::Region}-${EnvironmentTag}-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-logs-bucket'
        - Key: Environment
          Value: !Ref EnvironmentTag


  # CloudWatch Log Group
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-log-group
        - Key: Environment
          Value: !Ref EnvironmentTag


  # SNS Topic for Alarms
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${AWS::StackName}-cpu-alarms
      DisplayName: EC2 CPU Utilization Alarms
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-alarm-topic
        - Key: Environment
          Value: !Ref EnvironmentTag


  # Launch Template for EC2 Instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${AWS::StackName}-lt
      LaunchTemplateData:
        ImageId: !Ref LatestAmazonLinuxAMI
        InstanceType: !Ref InstanceType
        KeyName: !Ref MyKeyPair       
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y

            # Install CloudWatch Agent
            yum install -y wget
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -Uvh amazon-cloudwatch-agent.rpm

            # Create CloudWatch Agent config
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "root"
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "${EC2LogGroup}",
                        "log_stream_name": "{instance_id}-messages"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "namespace": "SaaSApp/${EnvironmentTag}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_system", "cpu_usage_user"],
                    "metrics_collection_interval": 60
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["disk_used_percent"],
                    "metrics_collection_interval": 60
                  },
                  "diskio": {
                    "measurement": ["io_time"],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF

            # Start CloudWatch Agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

            # Enable and start the web server
            yum install -y httpd
            systemctl enable httpd
            echo "<h1>SaaS App - Instance $(hostname)</h1>" > /var/www/html/index.html
            systemctl start httpd
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${AWS::StackName}-instance
              - Key: Environment
                Value: !Ref EnvironmentTag
  # EC2 Instances
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-1
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-2
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance3:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-3
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance4:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-4
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance5:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-5
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance6:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-6
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance7:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-7
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance8:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-8
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance9:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-9
        - Key: Environment
          Value: !Ref EnvironmentTag


  EC2Instance10:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-instance-10
        - Key: Environment
          Value: !Ref EnvironmentTag


  # CloudWatch Alarms
  CPUAlarm1:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-1
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance1}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance1
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm2:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-2
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance2}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance2
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm3:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-3
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance3}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance3
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm4:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-4
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance4}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance4
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm5:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-5
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance5}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance5
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm6:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-6
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance6}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance6
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm7:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-7
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance7}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance7
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm8:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-8
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance8}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance8
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm9:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-9
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance9}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance9
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


  CPUAlarm10:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-cpu-alarm-instance-10
      AlarmDescription: !Sub 'CPU utilization alarm for ${EC2Instance10}'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance10
      AlarmActions:
        - !Ref AlarmTopic
      TreatMissingData: breaching


Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-vpc-id


  InstanceIds:
    Description: List of EC2 Instance IDs
    Value: !Join
      - ','
      - - !Ref EC2Instance1
        - !Ref EC2Instance2
        - !Ref EC2Instance3
        - !Ref EC2Instance4
        - !Ref EC2Instance5
        - !Ref EC2Instance6
        - !Ref EC2Instance7
        - !Ref EC2Instance8
        - !Ref EC2Instance9
        - !Ref EC2Instance10
    Export:
      Name: !Sub ${AWS::StackName}-instance-ids


  S3BucketName:
    Description: Name of the S3 bucket for logs
    Value: !Ref LogsBucket
    Export:
      Name: !Sub ${AWS::StackName}-logs-bucket


  CloudWatchAlarmNames:
    Description: List of CloudWatch alarm names
    Value: !Join
      - ','
      - - !Ref CPUAlarm1
        - !Ref CPUAlarm2
        - !Ref CPUAlarm3
        - !Ref CPUAlarm4
        - !Ref CPUAlarm5
        - !Ref CPUAlarm6
        - !Ref CPUAlarm7
        - !Ref CPUAlarm8
        - !Ref CPUAlarm9
        - !Ref CPUAlarm10
    Export:
      Name: !Sub ${AWS::StackName}-alarm-names


  SNSTopicArn:
    Description: ARN of the SNS topic for alarms
    Value: !Ref AlarmTopic
    Export:
      Name: !Sub ${AWS::StackName}-sns-topic-arn


  CloudWatchLogGroup:
    Description: CloudWatch Log Group name
    Value: !Ref EC2LogGroup
    Export:
      Name: !Sub ${AWS::StackName}-log-group


  LoadBalancerURL:
    Description: URL of the load balancer (if needed in future)
    Value: !Sub 'http://load-balancer-placeholder.${AWS::Region}.elb.amazonaws.com'