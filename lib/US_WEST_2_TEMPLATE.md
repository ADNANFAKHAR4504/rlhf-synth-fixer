# US-West-2 CloudFormation Template

Deploy this template in us-west-2 region after deploying the main template in us-east-1.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Region Web Application Infrastructure - US-West-2'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name'
  
  CostCenter:
    Type: String
    Default: 'engineering'
    Description: 'Cost center for resource tagging'
  
  CPUThresholdWest:
    Type: Number
    Default: 75
    MinValue: 1
    MaxValue: 100
    Description: 'CPU threshold for auto scaling in us-west-2'
  
  MemoryThresholdWest:
    Type: Number
    Default: 85
    MinValue: 1
    MaxValue: 100
    Description: 'Memory threshold for auto scaling in us-west-2'
  
  EastVPCId:
    Type: String
    Description: 'VPC ID from us-east-1 for peering'
  
  EastHostedZoneId:
    Type: String
    Description: 'Hosted Zone ID from us-east-1'
  
  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for Route 53 DNS'
  
  PrimaryDBEndpoint:
    Type: String
    Description: 'Primary database endpoint from us-east-1'

Resources:
  # VPC Infrastructure - US-West-2
  VPCWest:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.1.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Public Subnets - US-West-2
  PublicSubnetWest1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: '10.1.1.0/24'
      AvailabilityZone: 'us-west-2a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-west-2a'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PublicSubnetWest2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: '10.1.2.0/24'
      AvailabilityZone: 'us-west-2b'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-west-2b'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Private Subnets - US-West-2
  PrivateSubnetWest1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: '10.1.3.0/24'
      AvailabilityZone: 'us-west-2a'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-west-2a'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateSubnetWest2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCWest
      CidrBlock: '10.1.4.0/24'
      AvailabilityZone: 'us-west-2b'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-west-2b'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Internet Gateway
  InternetGatewayWest:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  AttachGatewayWest:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPCWest
      InternetGatewayId: !Ref InternetGatewayWest

  # NAT Gateway
  NATGatewayEIPWest:
    Type: AWS::EC2::EIP
    DependsOn: AttachGatewayWest
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  NATGatewayWest:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIPWest.AllocationId
      SubnetId: !Ref PublicSubnetWest1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Tables
  PublicRouteTableWest:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCWest
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  PrivateRouteTableWest:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCWest
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Routes
  PublicRouteWest:
    Type: AWS::EC2::Route
    DependsOn: AttachGatewayWest
    Properties:
      RouteTableId: !Ref PublicRouteTableWest
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGatewayWest

  PrivateRouteWest:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableWest
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayWest

  # VPC Peering Connection to us-east-1
  VPCPeeringConnection:
    Type: AWS::EC2::VPCPeeringConnection
    Properties:
      VpcId: !Ref VPCWest
      PeerVpcId: !Ref EastVPCId
      PeerRegion: 'us-east-1'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-peering-west-to-east'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route for VPC Peering
  PrivateRouteToPeering:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableWest
      DestinationCidrBlock: '10.0.0.0/16'
      VpcPeeringConnectionId: !Ref VPCPeeringConnection

  # Route Table Associations
  PublicSubnetRouteTableAssociationWest1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetWest1
      RouteTableId: !Ref PublicRouteTableWest

  PublicSubnetRouteTableAssociationWest2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetWest2
      RouteTableId: !Ref PublicRouteTableWest

  PrivateSubnetRouteTableAssociationWest1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetWest1
      RouteTableId: !Ref PrivateRouteTableWest

  PrivateSubnetRouteTableAssociationWest2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetWest2
      RouteTableId: !Ref PrivateRouteTableWest

  # Security Groups
  ALBSecurityGroupWest:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer in us-west-2'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-sg-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  WebServerSecurityGroupWest:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers in us-west-2'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroupWest
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.1.0.0/16'
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          CidrIp: '10.0.0.0/16'  # Allow access to us-east-1 database
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-sg-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Read Replica Subnet Group
  ReadReplicaSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS read replica'
      SubnetIds:
        - !Ref PrivateSubnetWest1
        - !Ref PrivateSubnetWest2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-read-replica-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Read Replica Security Group
  ReadReplicaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS read replica'
      VpcId: !Ref VPCWest
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroupWest
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-read-replica-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # RDS Read Replica
  DatabaseReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-postgres-read-replica'
      SourceDBInstanceIdentifier: !Ref PrimaryDBEndpoint
      DBInstanceClass: db.t3.micro
      PubliclyAccessible: false
      DBSubnetGroupName: !Ref ReadReplicaSubnetGroup
      VPCSecurityGroups:
        - !Ref ReadReplicaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-postgres-read-replica'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Log Groups
  WebServerLogGroupWest:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-webserver-west'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Launch Template
  LaunchTemplateWest:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-web-server-template-west'
      LaunchTemplateData:
        ImageId: ami-0c2d3e23f757b5d84  # Amazon Linux 2 AMI for us-west-2
        InstanceType: t3.micro
        SecurityGroupIds:
          - !Ref WebServerSecurityGroupWest
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment} environment - US-West-2</h1>" > /var/www/html/index.html
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent with memory metrics
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "CWAgent",
                "metrics_collected": {
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  },
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${WebServerLogGroupWest}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Environment}-web-server-west'
              - Key: Environment
                Value: !Ref Environment
              - Key: CostCenter
                Value: !Ref CostCenter

  # Application Load Balancer
  ApplicationLoadBalancerWest:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb-west'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnetWest1
        - !Ref PublicSubnetWest2
      SecurityGroups:
        - !Ref ALBSecurityGroupWest
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Target Group
  TargetGroupWest:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-tg-west'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPCWest
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-tg-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # ALB Listener
  ALBListenerWest:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroupWest
      LoadBalancerArn: !Ref ApplicationLoadBalancerWest
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  AutoScalingGroupWest:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-asg-west'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplateWest
        Version: !GetAtt LaunchTemplateWest.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnetWest1
        - !Ref PrivateSubnetWest2
      TargetGroupARNs:
        - !Ref TargetGroupWest
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-asg-instance-west'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicyWest:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroupWest
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      StepAdjustments:
        - MetricIntervalLowerBound: 0
          ScalingAdjustment: 1

  ScaleDownPolicyWest:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroupWest
      PolicyType: StepScaling
      AdjustmentType: ChangeInCapacity
      StepAdjustments:
        - MetricIntervalUpperBound: 0
          ScalingAdjustment: -1

  # CloudWatch Alarms
  CPUAlarmHighWest:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-cpu-high-west'
      AlarmDescription: 'Scale up on high CPU in us-west-2'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref CPUThresholdWest
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroupWest
      AlarmActions:
        - !Ref ScaleUpPolicyWest

  MemoryAlarmHighWest:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-memory-high-west'
      AlarmDescription: 'Scale up on high memory usage in us-west-2'
      MetricName: MemoryUtilization
      Namespace: CWAgent
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref MemoryThresholdWest
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroupWest
      AlarmActions:
        - !Ref ScaleUpPolicyWest

  # Route 53 Health Check for us-west-2
  HealthCheckWest:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancerWest.DNSName
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-health-check-west'
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route 53 Secondary Record
  DNSRecordSecondary:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref EastHostedZoneId
      Name: !Sub 'app.${DomainName}'
      Type: A
      SetIdentifier: 'secondary-west'
      Failover: SECONDARY
      HealthCheckId: !Ref HealthCheckWest
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancerWest.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancerWest.CanonicalHostedZoneID
        EvaluateTargetHealth: true

Outputs:
  VPCIdWest:
    Description: 'VPC ID for us-west-2'
    Value: !Ref VPCWest
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID-West'

  LoadBalancerDNSWest:
    Description: 'Load Balancer DNS Name for us-west-2'
    Value: !GetAtt ApplicationLoadBalancerWest.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS-West'

  ReadReplicaEndpoint:
    Description: 'RDS Read Replica Endpoint'
    Value: !GetAtt DatabaseReadReplica.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Read-Replica-Endpoint'

  VPCPeeringConnectionId:
    Description: 'VPC Peering Connection ID'
    Value: !Ref VPCPeeringConnection
    Export:
      Name: !Sub '${AWS::StackName}-VPC-Peering-ID'
```

## Deployment Instructions:

1. **Deploy us-east-1 template first** using the updated IDEAL_RESPONSE.md
2. **Get outputs** from us-east-1 stack (VPC ID, Hosted Zone ID, DB endpoint)
3. **Deploy this us-west-2 template** with the parameters from step 2
4. **Accept VPC peering** connection in us-east-1 console
5. **Add peering route** in us-east-1 private route table to 10.1.0.0/16

This completes the multi-region setup with all prompt requirements.