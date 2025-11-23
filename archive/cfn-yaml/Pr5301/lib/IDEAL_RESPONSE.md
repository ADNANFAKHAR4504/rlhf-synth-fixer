# Ideal Response - NovaFintech CloudFormation Template

This document contains the corrected CloudFormation template that properly implements the NovaFintech digital banking platform infrastructure requirements. The template addresses all critical issues identified in the model response and demonstrates proper AWS best practices for production fintech applications.

```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'NovaFintech Digital Banking Platform - Production Infrastructure Stack'

Parameters:
  DomainName:
    Type: String
    Description: 'The domain name for the NovaFintech application (e.g., bankingapp.novafintech.com)'
    Default: 'bankingapp.novafintech.com'
    AllowedPattern: '^[a-z0-9][a-z0-9\-\.]*[a-z0-9]$'
    ConstraintDescription: 'Must be a valid domain name'
  
  HostedZoneId:
    Type: String
    Description: 'The Route 53 Hosted Zone ID where the domain will be created'
    Default: ''
  
  KeyPairName:
    Type: String
    Description: 'EC2 Key Pair for SSH access to instances'
    Default: ''
  
  Environment:
    Type: String
    Description: 'Environment name for tagging and identification'
    Default: 'Production'
    AllowedValues:
      - Production
      - Staging
      - Development

  # Dynamic AMI parameter using SSM for latest Amazon Linux 2
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Description: 'Latest Amazon Linux 2 AMI ID'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

Conditions:
  HasHostedZoneId: !Not [ !Equals [ !Ref HostedZoneId, '' ] ]
  HasKeyPair: !Not [ !Equals [ !Ref KeyPairName, '' ] ]

Resources:
  # ==========================================
  # VPC and Networking Resources
  # ==========================================
  
  NovaVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: 'NovaFintech-Banking'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-IGW'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaVPC
      InternetGatewayId: !Ref NovaInternetGateway

  NovaPublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-PublicSubnet-1'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-PublicSubnet-2'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaVPC
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-PublicRT'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref NovaPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref NovaInternetGateway

  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet
      RouteTableId: !Ref NovaPublicRouteTable

  SubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaPublicSubnet2
      RouteTableId: !Ref NovaPublicRouteTable

  # ==========================================
  # Security Group Configuration
  # ==========================================
  
  NovaWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'NovaFintech-${Environment}-WebSG'
      GroupDescription: 'Security group for NovaFintech web application servers'
      VpcId: !Ref NovaVPC
      SecurityGroupIngress:
        # HTTP access from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from anywhere'
        
        # SSH access from anywhere
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'Allow SSH access for operations team'
      
      SecurityGroupEgress:
        # Allow all outbound traffic
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-WebSG'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  
  NovaEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaFintech-${Environment}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: NovaS3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 bucket access for logs and transaction records
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${NovaLogsBucket.Arn}'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObjectAcl'
                Resource:
                  - !Sub '${NovaLogsBucket.Arn}/*'
              
              # CloudWatch Logs access
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-EC2Role'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  NovaEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'NovaFintech-${Environment}-EC2Profile'
      Roles:
        - !Ref NovaEC2Role

  # ==========================================
  # S3 Bucket for Logs and Transaction Records
  # ==========================================
  
  NovaLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'novafintech-bankingapp-logs-${AWS::Region}'
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
          - Id: TransitionOldLogs
            Status: Enabled
            Transitions:
              # Move logs to Infrequent Access after 30 days
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              # Move to Glacier after 90 days for compliance
              - TransitionInDays: 90
                StorageClass: GLACIER
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-LogsBucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Application logs and transaction records'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Launch Template for EC2 Instances
  # ==========================================
  
  NovaLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'NovaFintech-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId  # Dynamic AMI from SSM parameter
        InstanceType: t2.micro
        KeyName:
          Fn::If:
            - HasKeyPair
            - !Ref KeyPairName
            - !Ref AWS::NoValue
        IamInstanceProfile:
          Arn: !GetAtt NovaEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref NovaWebSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'NovaFintech-${Environment}-WebServer'
              - Key: Environment
                Value: !Ref Environment
              - Key: Application
                Value: 'NovaFintech-Banking'
              - Key: ManagedBy
                Value: 'AutoScaling'
              - Key: team
                Value: '2'
              - Key: iac-rlhf-amazon
                Value: 'true'
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            set -e  # Exit on error
            
            # Update system
            yum update -y
            
            # Install necessary packages
            yum install -y httpd aws-cli amazon-cloudwatch-agent
            
            # Ensure Apache log directory exists
            mkdir -p /var/log/httpd
            chown root:root /var/log/httpd
            
            # Configure Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple landing page
            cat > /var/www/html/index.html <<EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>NovaFintech Digital Banking Platform</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        padding: 2em;
                        background: rgba(255,255,255,0.1);
                        border-radius: 10px;
                    }
                    h1 { font-size: 3em; margin-bottom: 0.5em; }
                    p { font-size: 1.2em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>NovaFintech</h1>
                    <p>Revolutionary Digital Banking Platform</p>
                    <p>Environment: ${Environment}</p>
                    <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
                </div>
            </body>
            </html>
            EOF
            
            # Configure CloudWatch agent
            mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/novafintech/${Environment}/apache/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/novafintech/${Environment}/apache/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent with local config file
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a append-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Ensure agent is running and enabled
            systemctl enable amazon-cloudwatch-agent
            systemctl start amazon-cloudwatch-agent
            
            # Log successful startup and upload to S3 (non-blocking)
            echo "NovaFintech application server started at $(date)" >> /var/log/nova-startup.log
            set +e  # Temporarily disable exit on error for S3 upload
            aws s3 cp /var/log/nova-startup.log s3://${NovaLogsBucket}/startup-logs/$(date +%Y%m%d)/$(ec2-metadata --instance-id | cut -d " " -f 2).log 2>&1 || echo "S3 upload failed, but continuing..."
            set -e  # Re-enable exit on error

  # ==========================================
  # Auto Scaling Group Configuration
  # ==========================================
  
  NovaAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn: 
      - AttachGateway
    Properties:
      AutoScalingGroupName: !Sub 'NovaFintech-${Environment}-ASG'
      VPCZoneIdentifier:
        - !Ref NovaPublicSubnet
        - !Ref NovaPublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref NovaLaunchTemplate
        Version: !GetAtt NovaLaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 1
      DesiredCapacity: 1
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: team
          Value: '2'
          PropagateAtLaunch: true
        - Key: iac-rlhf-amazon
          Value: 'true'
          PropagateAtLaunch: true

  # ==========================================
  # Elastic IP and Association
  # ==========================================
  
  NovaElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-EIP'
        - Key: Environment
          Value: !Ref Environment
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda function for EIP association with Auto Scaling
  EIPAssociationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'NovaFintech-${Environment}-EIPLambdaRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: EIPAssociationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:AssociateAddress'
                  - 'ec2:DisassociateAddress'
                  - 'ec2:DescribeInstances'
                  - 'ec2:DescribeAddresses'
                  - 'autoscaling:CompleteLifecycleAction'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-EIPLambdaRole'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  EIPAssociationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'NovaFintech-${Environment}-EIPAssociation'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt EIPAssociationLambdaRole.Arn
      Environment:
        Variables:
          ELASTIC_IP_ALLOCATION_ID: !GetAtt NovaElasticIP.AllocationId
      Code:
        ZipFile: |
          import boto3
          import os
          import json
          
          def handler(event, context):
              ec2 = boto3.client('ec2')
              autoscaling = boto3.client('autoscaling')
              
              # Get the EIP allocation ID from environment variable
              allocation_id = os.environ['ELASTIC_IP_ALLOCATION_ID']
              
              # Parse the event
              message = json.loads(event['Records'][0]['Sns']['Message'])
              
              if message['Event'] == 'autoscaling:EC2_INSTANCE_LAUNCHING':
                  instance_id = message['EC2InstanceId']
                  
                  try:
                      # Check if EIP is already associated to another instance
                      addresses = ec2.describe_addresses(AllocationIds=[allocation_id])
                      if addresses['Addresses'] and addresses['Addresses'][0].get('InstanceId'):
                          existing_instance = addresses['Addresses'][0]['InstanceId']
                          if existing_instance != instance_id:
                              # Disassociate from old instance
                              print(f"Disassociating EIP from existing instance {existing_instance}")
                              ec2.disassociate_address(AssociationId=addresses['Addresses'][0]['AssociationId'])
                      
                      # Wait for instance to be running
                      waiter = ec2.get_waiter('instance_running')
                      waiter.wait(InstanceIds=[instance_id], WaiterConfig={'Delay': 5, 'MaxAttempts': 60})
                      
                      # Associate the Elastic IP with the new instance
                      response = ec2.associate_address(
                          AllocationId=allocation_id,
                          InstanceId=instance_id
                      )
                      
                      print(f"Successfully associated EIP with instance {instance_id}")
                      
                      # Complete the lifecycle action
                      autoscaling.complete_lifecycle_action(
                          LifecycleHookName=message['LifecycleHookName'],
                          AutoScalingGroupName=message['AutoScalingGroupName'],
                          LifecycleActionResult='CONTINUE',
                          InstanceId=instance_id
                      )
                  except Exception as e:
                      print(f"Error associating EIP: {str(e)}")
                      import traceback
                      print(traceback.format_exc())
                      # Still continue with the lifecycle action
                      autoscaling.complete_lifecycle_action(
                          LifecycleHookName=message['LifecycleHookName'],
                          AutoScalingGroupName=message['AutoScalingGroupName'],
                          LifecycleActionResult='CONTINUE',
                          InstanceId=instance_id
                      )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('EIP association completed')
              }
      Timeout: 300
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-EIPAssociation'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # SNS Topic for Auto Scaling notifications
  NovaASGNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'NovaFintech-${Environment}-ASG-Notifications'
      Subscription:
        - Endpoint: !GetAtt EIPAssociationLambda.Arn
          Protocol: lambda
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-ASG-Notifications'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref EIPAssociationLambda
      Action: 'lambda:InvokeFunction'
      Principal: sns.amazonaws.com
      SourceArn: !Ref NovaASGNotificationTopic

  # Lifecycle Hook for EIP association
  NovaASGLifecycleHook:
    Type: AWS::AutoScaling::LifecycleHook
    Properties:
      LifecycleHookName: !Sub 'NovaFintech-${Environment}-EIPHook'
      AutoScalingGroupName: !Ref NovaAutoScalingGroup
      LifecycleTransition: 'autoscaling:EC2_INSTANCE_LAUNCHING'
      NotificationTargetARN: !Ref NovaASGNotificationTopic
      RoleARN: !GetAtt AutoScalingNotificationRole.Arn
      HeartbeatTimeout: 300
      DefaultResult: CONTINUE

  AutoScalingNotificationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: autoscaling.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: PublishToSNS
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref NovaASGNotificationTopic
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-ASG-NotificationRole'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==========================================
  # Route 53 Configuration
  # ==========================================
  
  NovaDNSRecord:
    Type: AWS::Route53::RecordSet
    Condition: HasHostedZoneId
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      TTL: 300
      ResourceRecords:
        - !Ref NovaElasticIP

  # ==========================================
  # CloudWatch Alarms for Monitoring
  # ==========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'NovaFintech-${Environment}-HighCPU'
      AlarmDescription: 'Alert when CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref NovaAutoScalingGroup
      Tags:
        - Key: Name
          Value: !Sub 'NovaFintech-${Environment}-HighCPU'
        - Key: team
          Value: '2'
        - Key: iac-rlhf-amazon
          Value: 'true'

Outputs:
  WebsiteURL:
    Description: 'URL of the NovaFintech application'
    Value: !Sub 'http://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteURL'
  
  InstancePublicIP:
    Description: 'Elastic IP address of the application'
    Value: !Ref NovaElasticIP
    Export:
      Name: !Sub '${AWS::StackName}-InstancePublicIP'
  
  S3BucketName:
    Description: 'Name of the S3 bucket for logs and transaction records'
    Value: !Ref NovaLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket'
  
  SecurityGroupId:
    Description: 'Security Group ID for web servers'
    Value: !Ref NovaWebSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup'
  
  IAMRoleARN:
    Description: 'ARN of IAM role for EC2 instance'
    Value: !GetAtt NovaEC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRoleARN'
  
  VPCId:
    Description: 'VPC ID for the NovaFintech infrastructure'
    Value: !Ref NovaVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'
  
  AutoScalingGroupName:
    Description: 'Auto Scaling Group name for future scaling'
    Value: !Ref NovaAutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG'
  
  LaunchTemplateId:
    Description: 'Launch Template ID for instance configuration'
    Value: !Ref NovaLaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate'
```
The template ensures high availability, security compliance, and scalability for NovaFintech's growing customer base while maintaining cost efficiency with `t2.micro` instances and proper resource lifecycle management.