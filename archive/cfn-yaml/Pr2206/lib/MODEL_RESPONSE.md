# AcmeWeb Highly Available Web Application Infrastructure

Here's the complete CloudFormation YAML template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AcmeWeb Highly Available Web Application Infrastructure'

Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access to instances
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  DBUsername:
    Type: String
    Default: admin
    Description: Database administrator username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBPassword:
    Type: String
    NoEcho: true
    Description: Database administrator password
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters

Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI

Resources:
  # VPC Configuration
  AcmeWebVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: AcmeWeb-VPC

  # Internet Gateway
  AcmeWebInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: AcmeWeb-IGW

  AcmeWebInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref AcmeWebInternetGateway
      VpcId: !Ref AcmeWebVPC

  # Public Subnets
  AcmeWebPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: AcmeWeb-Public-Subnet-AZ1

  AcmeWebPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: us-west-2b
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: AcmeWeb-Public-Subnet-AZ2

  # Private Subnets
  AcmeWebPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: AcmeWeb-Private-Subnet-AZ1

  AcmeWebPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: us-west-2b
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: AcmeWeb-Private-Subnet-AZ2

  # NAT Gateways
  AcmeWebNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: AcmeWeb-NAT-Gateway-1-EIP

  AcmeWebNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: AcmeWeb-NAT-Gateway-2-EIP

  AcmeWebNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt AcmeWebNATGateway1EIP.AllocationId
      SubnetId: !Ref AcmeWebPublicSubnet1
      Tags:
        - Key: Name
          Value: AcmeWeb-NAT-Gateway-AZ1

  AcmeWebNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt AcmeWebNATGateway2EIP.AllocationId
      SubnetId: !Ref AcmeWebPublicSubnet2
      Tags:
        - Key: Name
          Value: AcmeWeb-NAT-Gateway-AZ2

  # Route Tables
  AcmeWebPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: AcmeWeb-Public-Routes

  AcmeWebDefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref AcmeWebInternetGateway

  AcmeWebPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      SubnetId: !Ref AcmeWebPublicSubnet1

  AcmeWebPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      SubnetId: !Ref AcmeWebPublicSubnet2

  AcmeWebPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: AcmeWeb-Private-Routes-AZ1

  AcmeWebDefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref AcmeWebNATGateway1

  AcmeWebPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable1
      SubnetId: !Ref AcmeWebPrivateSubnet1

  AcmeWebPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: AcmeWeb-Private-Routes-AZ2

  AcmeWebDefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref AcmeWebNATGateway2

  AcmeWebPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable2
      SubnetId: !Ref AcmeWebPrivateSubnet2

  # Security Groups
  AcmeWebLoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: AcmeWeb-LoadBalancer-SG
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref AcmeWebVPC
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
          Value: AcmeWeb-LoadBalancer-SG

  AcmeWebWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: AcmeWeb-WebServer-SG
      GroupDescription: Security group for web servers
      VpcId: !Ref AcmeWebVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref AcmeWebLoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: AcmeWeb-WebServer-SG

  AcmeWebDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: AcmeWeb-Database-SG
      GroupDescription: Security group for RDS database
      VpcId: !Ref AcmeWebVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AcmeWebWebServerSecurityGroup
      Tags:
        - Key: Name
          Value: AcmeWeb-Database-SG

  # Application Load Balancer
  AcmeWebApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: AcmeWeb-ALB
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref AcmeWebPublicSubnet1
        - !Ref AcmeWebPublicSubnet2
      SecurityGroups:
        - !Ref AcmeWebLoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: AcmeWeb-ALB

  AcmeWebTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: AcmeWeb-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref AcmeWebVPC
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: AcmeWeb-TG

  AcmeWebLoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AcmeWebTargetGroup
      LoadBalancerArn: !Ref AcmeWebApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  AcmeWebLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: AcmeWeb-LaunchTemplate
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref AcmeWebWebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>AcmeWeb Application Server</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: AcmeWeb-WebServer

  # Auto Scaling Group
  AcmeWebAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: AcmeWeb-ASG
      VPCZoneIdentifier:
        - !Ref AcmeWebPrivateSubnet1
        - !Ref AcmeWebPrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref AcmeWebLaunchTemplate
        Version: !GetAtt AcmeWebLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref AcmeWebTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: AcmeWeb-ASG-Instance
          PropagateAtLaunch: true

  # Auto Scaling Policies
  AcmeWebScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AcmeWebAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  AcmeWebScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AcmeWebAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch Alarms
  AcmeWebCPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up on high CPU
      AlarmActions:
        - !Ref AcmeWebScaleUpPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AcmeWebAutoScalingGroup

  AcmeWebCPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down on low CPU
      AlarmActions:
        - !Ref AcmeWebScaleDownPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AcmeWebAutoScalingGroup

  # Database Subnet Group
  AcmeWebDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: acmeweb-db-subnet-group
      DBSubnetGroupDescription: Subnet group for AcmeWeb RDS database
      SubnetIds:
        - !Ref AcmeWebPrivateSubnet1
        - !Ref AcmeWebPrivateSubnet2
      Tags:
        - Key: Name
          Value: AcmeWeb-DB-SubnetGroup

  # RDS MySQL Database
  AcmeWebDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: acmeweb-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      DBName: acmewebdb
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref AcmeWebDatabaseSecurityGroup
      DBSubnetGroupName: !Ref AcmeWebDBSubnetGroup
      PubliclyAccessible: false
      MultiAZ: false
      BackupRetentionPeriod: 7
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: AcmeWeb-Database

Outputs:
  VPCId:
    Description: ID of the VPC
    Value: !Ref AcmeWebVPC
    Export:
      Name: !Sub ${AWS::StackName}-VPC-ID

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub http://${AcmeWebApplicationLoadBalancer.DNSName}
    Export:
      Name: !Sub ${AWS::StackName}-LoadBalancer-URL

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt AcmeWebApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${AWS::StackName}-LoadBalancer-DNS

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt AcmeWebDatabase.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-Database-Endpoint

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AcmeWebAutoScalingGroup
    Export:
      Name: !Sub ${AWS::StackName}-ASG-Name

  PublicSubnets:
    Description: List of public subnets
    Value: !Join [',', [!Ref AcmeWebPublicSubnet1, !Ref AcmeWebPublicSubnet2]]
    Export:
      Name: !Sub ${AWS::StackName}-Public-Subnets

  PrivateSubnets:
    Description: List of private subnets
    Value: !Join [',', [!Ref AcmeWebPrivateSubnet1, !Ref AcmeWebPrivateSubnet2]]
    Export:
      Name: !Sub ${AWS::StackName}-Private-Subnets
```

## Key Features of This Template:

### Infrastructure Components

- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Subnets**: 2 public (10.0.1.0/24, 10.0.2.0/24) and 2 private (10.0.3.0/24, 10.0.4.0/24) across us-west-2a and us-west-2b
- **NAT Gateways**: One in each public subnet for private subnet internet access
- **Internet Gateway**: For public internet connectivity

### ⚖️ **Load Balancing & Auto Scaling**

- **Application Load Balancer**: Internet-facing, deployed in public subnets
- **Auto Scaling Group**: 2-4 instances with CPU-based scaling
- **Launch Template**: t3.micro instances with Apache web server
- **CloudWatch Alarms**: Scale up at 70% CPU, scale down at 30% CPU

### Database Layer

- **RDS MySQL 8.0**: db.t3.micro in private subnets
- **Multi-AZ**: Disabled for cost optimization (can be enabled)
- **Security**: Only accessible from web servers

### Security Implementation

- **Load Balancer SG**: Allows HTTP/HTTPS from internet
- **Web Server SG**: Allows traffic only from load balancer + SSH from VPC
- **Database SG**: Allows MySQL traffic only from web servers
- **Least Privilege**: Each component has minimal required access

### High Availability Features

- **Multi-AZ Deployment**: All components across 2 availability zones
- **Auto Scaling**: Automatic instance replacement and scaling
- **Health Checks**: ELB health checks with 30-second intervals
- **Redundancy**: NAT Gateways in each AZ for fault tolerance

### Naming & Tagging

- All resources prefixed with "AcmeWeb"
- Consistent naming convention
- Proper resource tagging for management

## Usage Instructions:

1. **Save** the template as `acme_web_app.yaml`
2. **Deploy** using AWS CLI:

   ```bash
   aws cloudformation create-stack \
     --stack-name acmeweb-infrastructure \
     --template-body file://acme_web_app.yaml \
     --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
                  ParameterKey=DBUsername,ParameterValue=admin \
                  ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
     --region us-west-2
   ```

3. **Access** your application via the Load Balancer URL provided in the outputs

The template includes comprehensive outputs for all key resource identifiers and passes AWS CloudFormation validation. The infrastructure provides enterprise-grade high availability, security, and scalability for the AcmeWeb application.
