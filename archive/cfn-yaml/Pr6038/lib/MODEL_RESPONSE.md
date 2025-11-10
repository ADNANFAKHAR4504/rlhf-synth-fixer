### Reasoning Trace
---

This is a comprehensive CloudFormation template request for a fintech startup's infrastructure. Let me break down the requirements:

1. **Region**: us-east-1
2. **Networking**:
   - VPC: 10.0.0.0/16
   - 2 Public Subnets: 10.0.1.0/24 and 10.0.2.0/24 (for ALB and NAT Gateways)
   - 2 Private Subnets: 10.0.10.0/24 and 10.0.20.0/24 (for EC2 and RDS)
   - Internet Gateway
   - 2 NAT Gateways (one in each public subnet)
   - Route tables for public and private subnets

3. **Application Layer**:
   - Application Load Balancer in public subnets
   - HTTPS listener on port 443 with ACM certificate
   - Target group for Node.js API servers
   - Auto Scaling group (min: 2, max: 6, desired: 3) with t3.medium EC2 instances
   - Target tracking scaling based on CPU utilization (target: 70%)
   - Launch template with user data for Node.js app

4. **Database**:
   - RDS PostgreSQL 13.7
   - Multi-AZ deployment
   - db.t3.medium instance
   - 100GB storage
   - DB subnet group in private subnets
   - Password stored in AWS Secrets Manager
   - 7-day backup retention

5. **Security Groups**:
   - ALB SG: Allow HTTPS (443) from 0.0.0.0/0
   - EC2 SG: Allow HTTP (80) from ALB SG
   - RDS SG: Allow PostgreSQL (5432) from EC2 SG

6. **DNS**:
   I'll set up a Route 53 A record that directs api.fintech-portal.com to the Application Load Balancer, ensuring seamless domain routing for the API endpoint. This will provide a clean, professional domain for the fintech portal's API access.

7. **Monitoring**:
   I'll implement comprehensive CloudWatch monitoring with two key alarms. The first will track unhealthy host counts, triggering an alert if more than one host becomes unresponsive. The second will monitor CPU utilization, sending notifications if it exceeds 80%. An SNS topic will be created to distribute these critical infrastructure alerts.

8. **Other Requirements**:
   The template will incorporate flexible parameters for customization, implement a consistent tagging approach, and leverage CloudFormation's intrinsic functions to enhance template intelligence and dynamic resource management.
### Answer 
---

# CloudFormation Template for Fintech Customer Portal Infrastructure

Below is a production-ready CloudFormation template that deploys the complete infrastructure stack for your fintech customer portal API backend:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete infrastructure stack for fintech customer portal API backend with high availability and security'

Parameters:
  EnvironmentName:
    Description: Environment name prefix for all resources
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production

  KeyName:
    Description: EC2 KeyPair to enable SSH access to the instances
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  InstanceType:
    Description: EC2 instance type for API servers
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.small
      - t3.medium
      - t3.large

  DBInstanceClass:
    Description: Database instance class
    Type: String
    Default: db.t3.medium
    AllowedValues:
      - db.t3.small
      - db.t3.medium
      - db.t3.large

  DBUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  OwnerTag:
    Description: Owner tag for resource tagging
    Type: String
    Default: DevOps-Team

  ApplicationName:
    Description: Application name for tagging
    Type: String
    Default: CustomerPortalAPI

  DomainName:
    Description: Domain name for the API
    Type: String
    Default: api.fintech-portal.com

  HostedZoneId:
    Description: Route53 Hosted Zone ID for the domain
    Type: AWS::Route53::HostedZone::Id

  CertificateArn:
    Description: ACM Certificate ARN for HTTPS listener
    Type: String

  NotificationEmail:
    Description: Email address for CloudWatch alarm notifications
    Type: String
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

Mappings:
  AWSRegionToAMI:
    us-east-1:
      AMI: ami-0230bd60aa48260c6  # Amazon Linux 2023 AMI

Resources:
  # ==================== NETWORKING ====================
  
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.20.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

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
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ==================== SECURITY GROUPS ====================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-EC2-SG'
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-SG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-RDS-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow PostgreSQL from EC2 instances
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-SG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==================== DATABASE ====================
  
  DBPassword:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-RDS-Password'
      Description: RDS Master Password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-SubnetGroup'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-postgres-db'
      DBName: customerportal
      Engine: postgres
      EngineVersion: '13.7'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: '100'
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPassword}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-Instance'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  # ==================== APPLICATION LAYER ====================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  ALBListener:
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

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
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
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DBPassword
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-Profile'
      Roles:
        - !Ref EC2Role

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [AWSRegionToAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nodejs npm postgresql15
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Create application directory
            mkdir -p /opt/app
            cd /opt/app
            
            # Create a sample Node.js application
            cat > app.js << 'EOF'
            const express = require('express');
            const app = express();
            const port = 80;
            
            app.get('/health', (req, res) => {
              res.status(200).send('OK');
            });
            
            app.get('/', (req, res) => {
              res.json({ message: 'Customer Portal API', environment: '${EnvironmentName}' });
            });
            
            app.listen(port, () => {
              console.log(`API server running on port ${port}`);
            });
            EOF
            
            # Install dependencies
            npm init -y
            npm install express
            
            # Create systemd service
            cat > /etc/systemd/system/nodeapp.service << EOF
            [Unit]
            Description=Node.js Application
            After=network.target
            
            [Service]
            Type=simple
            User=ec2-user
            WorkingDirectory=/opt/app
            ExecStart=/usr/bin/node app.js
            Restart=on-failure
            RestartSec=10
            Environment=NODE_ENV=production
            Environment=DB_HOST=${RDSInstance.Endpoint.Address}
            Environment=DB_NAME=customerportal
            Environment=DB_USER=${DBUsername}
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            # Set permissions and start service
            chown -R ec2-user:ec2-user /opt/app
            systemctl daemon-reload
            systemctl enable nodeapp
            systemctl start nodeapp
            
            # Configure CloudWatch logs
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${EnvironmentName}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
              -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-API-Instance'
              - Key: Environment
                Value: !Ref EnvironmentName
              - Key: Application
                Value: !Ref ApplicationName
              - Key: Owner
                Value: !Ref OwnerTag

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: '2'
      MaxSize: '6'
      DesiredCapacity: '3'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Application
          Value: !Ref ApplicationName
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true

  TargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # ==================== DNS ====================
  
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZoneId
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName

  # ==================== MONITORING ====================
  
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentName}-Alerts'
      DisplayName: !Sub '${EnvironmentName} CloudWatch Alerts'
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Owner
          Value: !Ref OwnerTag

  UnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-UnHealthyHosts'
      AlarmDescription: Alert when there are unhealthy target instances
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-HighCPU'
      AlarmDescription: Alert when CPU exceeds 80%
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
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  # ==================== OUTPUTS ====================
  
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${EnvironmentName}-ALB-DNS'

  APIDomainName:
    Description: API Domain Name
    Value: !Ref DomainName
    Export:
      Name: !Sub '${EnvironmentName}-API-Domain'

  RDSEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${EnvironmentName}-RDS-Endpoint'

  DBSecretArn:
    Description: ARN of the database password secret
    Value: !Ref DBPassword
    Export:
      Name: !Sub '${EnvironmentName}-DB-Secret-ARN'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${EnvironmentName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${EnvironmentName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${EnvironmentName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${EnvironmentName}-PrivateSubnet2-ID'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${EnvironmentName}-ASG-Name'
```

## Template Overview

This CloudFormation template implements a complete, production-ready infrastructure with the following key features:

### 🔒 **Security Architecture**
- **Network Isolation**: Private subnets for compute and database resources
- **Layered Security Groups**: Restrictive ingress rules following least privilege
- **Secrets Management**: RDS password stored in AWS Secrets Manager with automatic generation
- **SSL/TLS Termination**: HTTPS listener on ALB with ACM certificate

### 🌐 **High Availability**
- **Multi-AZ Deployment**: Resources span two availability zones
- **Redundant NAT Gateways**: One per AZ for fault tolerance
- **RDS Multi-AZ**: Automatic failover for database
- **Auto Scaling**: Maintains minimum 2 instances across AZs

### 📊 **Monitoring & Alerting**
- **CloudWatch Alarms**: Monitors unhealthy hosts and CPU utilization
- **SNS Notifications**: Email alerts for critical events
- **CloudWatch Logs**: Application logs collection configured

### 🏷️ **Best Practices**
- **Consistent Tagging**: Environment, Application, and Owner tags on all resources
- **Parameterization**: Configurable values for different environments
- **Intrinsic Functions**: Dynamic resource referencing and string manipulation
- **Export Outputs**: Key resource IDs for cross-stack references

## Deployment Instructions

1. **Prerequisites**:
   - Create an ACM certificate for your domain
   - Set up a Route53 hosted zone
   - Create an EC2 key pair
   - Ensure you have appropriate AWS permissions

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name fintech-portal-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=KeyName,ParameterValue=your-key-pair \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:xxxx:certificate/yyyy \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=NotificationEmail,ParameterValue=alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Verify deployment**:
   - Check CloudFormation stack status
   - Confirm SNS email subscription
   - Test API endpoint at https://api.fintech-portal.com

This template provides a robust, secure, and scalable foundation for your fintech customer portal API, adhering to AWS best practices and financial services security requirements.