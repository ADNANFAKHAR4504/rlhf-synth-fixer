```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Optimized Trading Platform Infrastructure - Refactored for performance, cost, and maintainability'

# Organize parameters for better user experience
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcId
          - PublicSubnetAId
          - PublicSubnetBId
          - PrivateSubnetAId
          - PrivateSubnetBId
      - Label:
          default: "Application Configuration"
        Parameters:
          - Environment
          - ProjectName
          - Owner
      - Label:
          default: "Instance Configuration"
        Parameters:
          - InstanceType
          - KeyPairName
          - MinInstances
          - MaxInstances
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - EnableCloudWatchAlarms
          - SNSAlertTopic
    ParameterLabels:
      VpcId:
        default: "VPC ID"
      Environment:
        default: "Environment Name"
      EnableCloudWatchAlarms:
        default: "Enable CloudWatch Monitoring"

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Default: vpc-0123456789abcdef0
    Description: ID of existing VPC where resources will be deployed

  PublicSubnetAId:
    Type: AWS::EC2::Subnet::Id
    Description: Public subnet in AZ-A for ALB

  PublicSubnetBId:
    Type: AWS::EC2::Subnet::Id
    Description: Public subnet in AZ-B for ALB

  PrivateSubnetAId:
    Type: AWS::EC2::Subnet::Id
    Description: Private subnet in AZ-A for EC2 instances

  PrivateSubnetBId:
    Type: AWS::EC2::Subnet::Id
    Description: Private subnet in AZ-B for EC2 instances

  Environment:
    Type: String
    Default: production
    AllowedValues:
      - production
      - staging
      - development
    Description: Environment name for tagging and configuration

  ProjectName:
    Type: String
    Default: TradingPlatform
    Description: Project name for resource identification

  Owner:
    Type: String
    Default: FinanceTeam
    Description: Team or individual responsible for these resources

  InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type for application servers
    AllowedValues:
      - t3.small
      - t3.medium
      - t3.large
      - t3a.small
      - t3a.medium
      - t3a.large

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 key pair for SSH access

  MinInstances:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 4
    Description: Minimum number of instances in Auto Scaling Group

  MaxInstances:
    Type: Number
    Default: 4
    MinValue: 2
    MaxValue: 10
    Description: Maximum number of instances in Auto Scaling Group

  EnableCloudWatchAlarms:
    Type: String
    Default: 'Yes'
    AllowedValues:
      - 'Yes'
      - 'No'
    Description: Enable CloudWatch alarms for monitoring

  SNSAlertTopic:
    Type: String
    Default: ''
    Description: SNS topic ARN for alarm notifications (optional)

# Conditions for optional resources
Conditions:
  CreateAlarms: !Equals [!Ref EnableCloudWatchAlarms, 'Yes']
  HasSNSTopic: !Not [!Equals [!Ref SNSAlertTopic, '']]

# Region-specific mappings
Mappings:
  RegionMap:
    us-east-1:
      AMIParameterName: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    us-west-2:
      AMIParameterName: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    eu-west-1:
      AMIParameterName: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    eu-central-1:
      AMIParameterName: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Resources:
  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Consolidated Security Group - optimized from 3 redundant groups
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'Consolidated security group for ${ProjectName} trading platform'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        # HTTPS from internet (via ALB)
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
        # HTTP only from ALB (will be self-referenced after ALB SG creation)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner

  # ALB Security Group
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'ALB security group for ${ProjectName}'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from internet
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-alb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner

  # Allow HTTP from ALB to instances
  ApplicationSecurityGroupIngressFromALB:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref ApplicationSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: HTTP from ALB only

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-alb'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnetAId
        - !Ref PublicSubnetBId
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
    # Protect ALB from accidental deletion
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  # Target Group for ALB
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckEnabled: true
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      DeregistrationDelay: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Sub 'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/placeholder'  # Replace with actual cert
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # Launch Template with SSM parameter for latest AMI
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-lt'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:${RegionMap}}'
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ApplicationSecurityGroup
        UserData:
          # Using Fn::Sub for cleaner UserData instead of multiple Fn::Join
          Fn::Base64: !Sub |
            #!/bin/bash
            # Trading Platform Bootstrap Script
            set -e
            
            # Update system
            yum update -y
            
            # Install required packages
            yum install -y amazon-cloudwatch-agent httpd
            
            # Configure application
            cat > /var/www/html/index.html << EOF
            <h1>${ProjectName} - ${Environment}</h1>
            <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
            <p>Region: ${AWS::Region}</p>
            EOF
            
            # Health check endpoint
            cat > /var/www/html/health << EOF
            {"status": "healthy", "environment": "${Environment}"}
            EOF
            
            # Start services
            systemctl enable httpd
            systemctl start httpd
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
            {
              "metrics": {
                "namespace": "${ProjectName}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_active"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": true
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
              -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
            
            # Signal completion
            /opt/aws/bin/cfn-signal -e $? \
              --stack ${AWS::StackName} \
              --resource AutoScalingGroup \
              --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: Owner
                Value: !Ref Owner

  # Auto Scaling Group - Fixed circular dependency with DependsOn
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    DependsOn: TargetGroup  # Prevents circular dependency
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-asg'
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref MinInstances
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - !Ref PrivateSubnetAId
        - !Ref PrivateSubnetBId
      # Mixed instances policy for cost optimization
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref LaunchTemplate
            Version: !GetAtt LaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: !Ref InstanceType
            - InstanceType: !If 
              - CreateAlarms
              - t3a.medium  # Cost-optimized alternative
              - !Ref InstanceType
        InstancesDistribution:
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: capacity-optimized
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: !Ref MinInstances
        Timeout: PT15M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: true

  # Scaling Policy
  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization

  # CloudWatch Alarms (Conditional)
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: CreateAlarms
    Properties:
      AlarmName: !Sub '${ProjectName}-high-cpu'
      AlarmDescription: Triggers when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !If [HasSNSTopic, !Ref SNSAlertTopic, !Ref 'AWS::NoValue']
      TreatMissingData: notBreaching

  LowHealthyInstancesAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: CreateAlarms
    Properties:
      AlarmName: !Sub '${ProjectName}-low-healthy-instances'
      AlarmDescription: Triggers when healthy instances drop below 2
      MetricName: HealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 3
      Threshold: 2
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !If [HasSNSTopic, !Ref SNSAlertTopic, !Ref 'AWS::NoValue']
      TreatMissingData: breaching

# Outputs for cross-stack references
Outputs:
  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  SecurityGroupId:
    Description: ID of the consolidated security group
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup-ID'

  TargetGroupArn:
    Description: ARN of the Target Group
    Value: !Ref TargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TargetGroup-ARN'