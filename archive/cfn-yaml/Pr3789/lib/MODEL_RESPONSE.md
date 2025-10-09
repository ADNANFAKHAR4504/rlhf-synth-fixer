# TapStack Infrastructure Template

This CloudFormation template provisions a complete production infrastructure stack for web applications on AWS.

---

## Configuration Requirements

**Deployment Region**

This stack must be deployed in the `us-west-2` region. A CloudFormation rule enforces this constraint and will reject deployments attempted in other regions.

**Certificate Configuration**

Three approaches are supported for SSL/TLS certificates:

1. **HTTP-Only Mode**
   - Configuration: Leave the `DomainName` parameter blank
   - Behavior: ALB serves traffic on port 80 only
   - Use case: Development and testing environments

2. **Use Existing Certificate**
   - Requirements: 
     - Valid ACM certificate in us-west-2
     - Certificate status must be "Issued"
   - Configuration:
     - Provide domain name in `DomainName` parameter
     - Set `CreateCertificate` to "false"
     - Supply certificate ARN in `CertificateArn` parameter
   - Behavior: ALB serves HTTPS on port 443, redirects HTTP traffic

3. **Create New Certificate**
   - Requirements: DNS management access for domain validation
   - Configuration:
     - Provide domain name in `DomainName` parameter
     - Set `CreateCertificate` to "true"
     - Leave `CertificateArn` empty
   - Note: Certificate will be created in "Pending Validation" state. Manual DNS record addition required for activation. HTTPS will not function until validation completes.

**Important Certificate Notes**

ACM certificates are region-bound resources. For ALB use in us-west-2, the certificate must exist in the same region. Cross-region certificate use is not supported by AWS.

Verify certificate region:
```bash
aws acm list-certificates --region us-west-2
```

**Database Credentials**

The template creates a Secrets Manager secret for the RDS password. While a default value is provided, production deployments should update this credential:

```bash
aws secretsmanager update-secret \
  --secret-id TapApp-Production-db-password \
  --secret-string '{"username":"admin","password":"<new-password>"}' \
  --region us-west-2
```

---

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TapStack - Production-ready web application infrastructure for us-west-2'

Parameters:
  AppName:
    Type: String
    Default: TapApp
    Description: Name of the application
    MinLength: 1
    MaxLength: 50

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID where resources will be deployed

  PublicSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Public subnet IDs for ALB (comma-delimited)

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Private subnet IDs for EC2 instances and RDS (comma-delimited)

  CertificateArn:
    Type: String
    Description: ARN of the ACM certificate for HTTPS
    AllowedPattern: '^arn:aws:acm:.*'

  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type for the web servers
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access

  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: RDS instance class
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  DBName:
    Type: String
    Default: tapdb
    Description: Database name
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBUser:
    Type: String
    Default: admin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    Description: Database master password
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    NoEcho: true

  MinSize:
    Type: Number
    Default: 2
    Description: Minimum number of EC2 instances in Auto Scaling Group

  MaxSize:
    Type: Number
    Default: 6
    Description: Maximum number of EC2 instances in Auto Scaling Group

  DesiredCapacity:
    Type: Number
    Default: 2
    Description: Desired number of EC2 instances in Auto Scaling Group

Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0cf2b4e024cdb6960  # Amazon Linux 2023 AMI

Resources:
  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-alb-sg'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-alb-sg'
        - Key: Environment
          Value: Production

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-ec2-sg'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-ec2-sg'
        - Key: Environment
          Value: Production

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-rds-sg'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-rds-sg'
        - Key: Environment
          Value: Production

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-lambda-sg'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VpcId
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-lambda-sg'
        - Key: Environment
          Value: Production

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AppName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AppName}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: CloudWatchMetricsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - cloudwatch:GetMetricStatistics
                  - cloudwatch:ListMetrics
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - elasticloadbalancing:DescribeTargetHealth
                  - autoscaling:DescribeAutoScalingGroups
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Groups
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/webapp/${AppName}'
      RetentionInDays: 7
      Tags:
        - Key: Environment
          Value: Production

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AppName}-monitor'
      RetentionInDays: 7
      Tags:
        - Key: Environment
          Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AppName}-alb'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets: !Ref PublicSubnetIds
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-alb'
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AppName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-tg'
        - Key: Environment
          Value: Production

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            Host: '#{host}'
            Path: '/#{path}'
            Query: '#{query}'
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref CertificateArn
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AppName}-lt'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AppName}-instance'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nginx amazon-cloudwatch-agent
            
            # Configure nginx
            cat > /etc/nginx/conf.d/app.conf <<EOF
            server {
                listen 80;
                server_name _;
                location / {
                    return 200 '<h1>Welcome to ${AppName}</h1><p>Environment: Production</p><p>Instance: $HOSTNAME</p>';
                    add_header Content-Type text/html;
                }
                location /health {
                    return 200 'healthy';
                    add_header Content-Type text/plain;
                }
            }
            EOF
            
            # Start nginx
            systemctl start nginx
            systemctl enable nginx
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "${WebAppLogGroup}",
                        "log_stream_name": "{instance_id}/nginx-access"
                      },
                      {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "${WebAppLogGroup}",
                        "log_stream_name": "{instance_id}/nginx-error"
                      }
                    ]
                  }
                }
              },
              "metrics": {
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      "used_percent"
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AppName}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier: !Ref PrivateSubnetIds
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: 1Minute
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AppName}-high-cpu'
      AlarmDescription: Alarm when CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AppName}-low-cpu'
      AlarmDescription: Alarm when CPU is below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ALBRequestCountPerTarget
          ResourceLabel: !Join
            - '/'
            - - !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
              - !GetAtt ALBTargetGroup.TargetGroupFullName
        TargetValue: 100

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AppName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-db-subnet-group'
        - Key: Environment
          Value: Production

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AppName}-db'
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUser
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-db'
        - Key: Environment
          Value: Production

  # Lambda Function for Monitoring
  MonitoringLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AppName}-monitor'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          APP_NAME: !Ref AppName
          ALB_NAME: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
          ASG_NAME: !Ref AutoScalingGroup
          DB_INSTANCE_ID: !Ref RDSDatabase
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta

          def handler(event, context):
              cloudwatch = boto3.client('cloudwatch')
              elb = boto3.client('elbv2')
              asg = boto3.client('autoscaling')
              rds = boto3.client('rds')
              
              app_name = os.environ['APP_NAME']
              
              # Collect metrics
              metrics = {
                  'timestamp': datetime.utcnow().isoformat(),
                  'app_name': app_name,
                  'status': 'healthy'
              }
              
              # Get ALB metrics
              try:
                  response = cloudwatch.get_metric_statistics(
                      Namespace='AWS/ApplicationELB',
                      MetricName='TargetResponseTime',
                      Dimensions=[
                          {'Name': 'LoadBalancer', 'Value': os.environ['ALB_NAME']}
                      ],
                      StartTime=datetime.utcnow() - timedelta(minutes=5),
                      EndTime=datetime.utcnow(),
                      Period=300,
                      Statistics=['Average']
                  )
                  if response['Datapoints']:
                      metrics['alb_response_time'] = response['Datapoints'][0]['Average']
              except Exception as e:
                  print(f"Error getting ALB metrics: {e}")
              
              # Get ASG metrics
              try:
                  response = asg.describe_auto_scaling_groups(
                      AutoScalingGroupNames=[os.environ['ASG_NAME']]
                  )
                  if response['AutoScalingGroups']:
                      asg_info = response['AutoScalingGroups'][0]
                      metrics['asg_desired_capacity'] = asg_info['DesiredCapacity']
                      metrics['asg_instances'] = len(asg_info['Instances'])
              except Exception as e:
                  print(f"Error getting ASG metrics: {e}")
              
              # Get RDS metrics
              try:
                  response = rds.describe_db_instances(
                      DBInstanceIdentifier=os.environ['DB_INSTANCE_ID']
                  )
                  if response['DBInstances']:
                      db_info = response['DBInstances'][0]
                      metrics['db_status'] = db_info['DBInstanceStatus']
              except Exception as e:
                  print(f"Error getting RDS metrics: {e}")
              
              # Log metrics
              print(json.dumps(metrics))
              
              # Put custom metric
              try:
                  cloudwatch.put_metric_data(
                      Namespace=f'{app_name}/Monitoring',
                      MetricData=[
                          {
                              'MetricName': 'HealthCheck',
                              'Value': 1,
                              'Unit': 'Count',
                              'Timestamp': datetime.utcnow()
                          }
                      ]
                  )
              except Exception as e:
                  print(f"Error putting metric: {e}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps(metrics)
              }
      Tags:
        - Key: Environment
          Value: Production

  # Schedule Lambda execution
  LambdaScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AppName}-monitor-schedule'
      Description: Trigger monitoring Lambda every 5 minutes
      ScheduleExpression: 'rate(5 minutes)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt MonitoringLambda.Arn
          Id: MonitoringLambdaTarget

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref MonitoringLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt LambdaScheduleRule.Arn

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AppName}-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", {"stat": "Sum", "label": "ALB 5xx Errors"}],
                  [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum", "label": "ALB 4xx Errors"}],
                  [".", "HTTPCode_Target_2XX_Count", {"stat": "Sum", "label": "ALB 2xx Success"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "ALB Response Codes",
                "period": 300,
                "dimensions": {
                  "LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                  ["...", {"stat": "p99", "label": "p99 Response Time"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "ALB Response Times",
                "period": 300,
                "dimensions": {
                  "LoadBalancer": "${ApplicationLoadBalancer.LoadBalancerFullName}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average", "label": "Average CPU"}],
                  ["...", {"stat": "Maximum", "label": "Max CPU"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "ASG CPU Utilization",
                "period": 300,
                "dimensions": {
                  "AutoScalingGroupName": "${AutoScalingGroup}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/AutoScaling", "GroupDesiredCapacity", {"stat": "Average"}],
                  [".", "GroupInServiceInstances", {"stat": "Average"}],
                  [".", "GroupMinSize", {"stat": "Average"}],
                  [".", "GroupMaxSize", {"stat": "Average"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Auto Scaling Group Size",
                "period": 300,
                "dimensions": {
                  "AutoScalingGroupName": "${AutoScalingGroup}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "FreeStorageSpace", {"stat": "Average"}],
                  [".", "FreeableMemory", {"stat": "Average"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "RDS Storage and Memory",
                "period": 300,
                "dimensions": {
                  "DBInstanceIdentifier": "${RDSDatabase}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                  [".", "DatabaseConnections", {"stat": "Average"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "RDS CPU and Connections",
                "period": 300,
                "dimensions": {
                  "DBInstanceIdentifier": "${RDSDatabase}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["${AppName}/Monitoring", "HealthCheck", {"stat": "Sum", "label": "Health Checks"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Health Checks",
                "period": 300
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '${WebAppLogGroup}' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                "region": "${AWS::Region}",
                "stacked": false,
                "title": "Recent Application Logs",
                "view": "table"
              }
            }
          ]
        }

Outputs:
  WebAppURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'https://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebAppURL'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DatabasePort'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AppName}-dashboard'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardURL'

  MonitoringLambdaArn:
    Description: ARN of the monitoring Lambda function
    Value: !GetAtt MonitoringLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-MonitoringLambdaArn'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-AutoScalingGroupName'

  LogGroupName:
    Description: CloudWatch Logs Group for the application
    Value: !Ref WebAppLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroupName'
```