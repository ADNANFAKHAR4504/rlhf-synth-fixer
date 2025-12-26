# Highly Available Auto-Scaling Web Application Infrastructure

I'll design and implement a complete AWS infrastructure using CloudFormation that deploys a highly available, auto-scaling web application in the us-west-2 region. This solution will include a VPC with multi-tier architecture, Application Load Balancer, Auto Scaling Group, and RDS Multi-AZ database deployment.

## Infrastructure Components

### VPC Network Configuration

I'll create a Virtual Private Cloud (VPC) with the following multi-tier architecture:

**lib/TapStack.yml (VPC Section):**
```yaml
  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'TapVPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TapIGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC
```

The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses with DNS resolution enabled.

### Subnet Configuration

I'll create two public and two private subnets across different Availability Zones:

**lib/TapStack.yml (Subnets Section):**
```yaml
  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 0
        - !GetAZs ''
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs ''
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 0
        - !GetAZs ''
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select 
        - 1
        - !GetAZs ''
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
```

### NAT Gateway and Routing

A NAT Gateway in the public subnet provides outbound internet access for private subnet resources:

**lib/TapStack.yml (NAT Gateway Section):**
```yaml
  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatEIP-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
```

### Security Groups

I'll implement security groups following the principle of least privilege:

**lib/TapStack.yml (Security Groups Section):**
```yaml
  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapALBSecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapALBSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapWebServerSecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for EC2 web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB on port 8080
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapWebServerSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'TapDatabaseSecurityGroup-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL traffic from web servers
      Tags:
        - Key: Name
          Value: !Sub 'TapDatabaseSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
```

### Application Load Balancer

The ALB distributes incoming HTTP traffic across multiple EC2 instances:

**lib/TapStack.yml (ALB Section):**
```yaml
  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'TapALB-${EnvironmentSuffix}'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'TapALB-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'TapTargetGroup-${EnvironmentSuffix}'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'TapTargetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
```

### Auto Scaling Group and Launch Template

The Auto Scaling Group maintains 2-6 t2.micro instances running Amazon Linux 2023:

**lib/TapStack.yml (Auto Scaling Section):**
```yaml
  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'TapLaunchTemplate-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: ami-0c2d3e23eb7b4eeee
        InstanceType: t2.micro
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            echo "<h1>Hello from EC2 Instance in ${AWS::Region}</h1>" > /var/www/html/index.html
            systemctl start httpd
            systemctl enable httpd
            # Configure httpd to listen on port 8080
            echo "Listen 8080" >> /etc/httpd/conf/httpd.conf
            echo "<VirtualHost *:8080>" >> /etc/httpd/conf/httpd.conf
            echo "    DocumentRoot /var/www/html" >> /etc/httpd/conf/httpd.conf
            echo "</VirtualHost>" >> /etc/httpd/conf/httpd.conf
            systemctl restart httpd
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'TapWebServer-${EnvironmentSuffix}'
              - Key: Environment
                Value: production

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'TapAutoScalingGroup-${EnvironmentSuffix}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: '2'
      MaxSize: '6'
      DesiredCapacity: '2'
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'TapAutoScalingGroup-${EnvironmentSuffix}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: production
          PropagateAtLaunch: true
```

### RDS Multi-AZ Database

A MySQL 5.7 database with Multi-AZ deployment for high availability:

**lib/TapStack.yml (RDS Section):**
```yaml
  # Database Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'tap-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapDBSubnetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: production

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'tap-database-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '5.7.44'
      MasterUsername: admin
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: '20'
      StorageType: gp2
      MultiAZ: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 0
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub 'TapDatabase-${EnvironmentSuffix}'
        - Key: Environment
          Value: production
```

## Parameters and Configuration

**lib/TapStack.yml (Parameters Section):**
```yaml
Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  DatabasePassword:
    Type: String
    NoEcho: true
    Default: 'MySecurePassword123!'
    Description: 'Password for the RDS database master user'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]+$'
    ConstraintDescription: 'Must be between 8-41 characters and contain only alphanumeric and special characters'
```

## Outputs

The template exports all necessary resource identifiers:

**lib/TapStack.yml (Outputs Section):**
```yaml
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerDNS'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DatabasePort'
```

## Deployment Commands

**Deploy the infrastructure:**
```bash
# Using CloudFormation YAML
npm run cfn:deploy-yaml

# Or using JSON format
npm run cfn:deploy-json
```

**Destroy the infrastructure:**
```bash
npm run cfn:destroy
```

## Key Features Implemented

 **Multi-tier VPC Architecture**: Public and private subnets across multiple AZs
 **Internet Gateway**: Public subnet internet access
 **NAT Gateway**: Outbound internet access for private resources
 **Application Load Balancer**: HTTP traffic distribution on port 80
 **Auto Scaling Group**: 2-6 t2.micro instances with ELB health checks
 **Launch Template**: Amazon Linux 2023 with Apache on port 8080
 **RDS Multi-AZ**: MySQL 5.7 database with high availability
 **Security Groups**: Least privilege access controls
 **Resource Tagging**: All resources tagged with Environment: production
 **Regional Deployment**: All resources deployed in us-west-2
 **Parameter-based Configuration**: Environment suffix and database password

## Validation and Testing

The solution includes comprehensive unit and integration tests:

**Unit Tests (test/tap-stack.unit.test.ts):**
- Validates CloudFormation template structure
- Verifies resource configurations
- Ensures proper tagging and naming conventions

**Integration Tests (test/tap-stack.int.test.ts):**
- Tests actual AWS resource deployment
- Validates network connectivity
- Confirms security group configurations
- Tests end-to-end application functionality

This infrastructure provides a robust, scalable, and highly available web application platform that meets all specified requirements for production deployment in AWS us-west-2 region.