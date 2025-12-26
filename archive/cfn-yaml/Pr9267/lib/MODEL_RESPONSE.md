# MODEL RESPONSE

```yaml
# CloudFormation Template for Highly Available Web Application Infrastructure

Below is a complete CloudFormation YAML template that defines a highly available and auto-scaling web application infrastructure in AWS, meeting all the specified requirements.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for a highly available web application infrastructure in us-west-2'

Parameters:
  EnvironmentName:
    Description: Environment name that will be prefixed to resource names
    Type: String
    Default: production

  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16

  PublicSubnet1CIDR:
    Description: CIDR block for Public Subnet 1
    Type: String
    Default: 10.0.1.0/24

  PublicSubnet2CIDR:
    Description: CIDR block for Public Subnet 2
    Type: String
    Default: 10.0.2.0/24

  PrivateSubnet1CIDR:
    Description: CIDR block for Private Subnet 1
    Type: String
    Default: 10.0.3.0/24

  PrivateSubnet2CIDR:
    Description: CIDR block for Private Subnet 2
    Type: String
    Default: 10.0.4.0/24

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'

  DBName:
    Description: MySQL database name
    Type: String
    Default: mydb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBUser:
    Description: Username for MySQL database access
    Type: String
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBPassword:
    Description: Password for MySQL database access
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters

Resources:
  # VPC and Networking Components
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC
        - Key: Environment
          Value: production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: production

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2a
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PublicSubnet1
        - Key: Environment
          Value: production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2b
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PublicSubnet2
        - Key: Environment
          Value: production

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2a
      CidrBlock: !Ref PrivateSubnet1CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PrivateSubnet1
        - Key: Environment
          Value: production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-west-2b
      CidrBlock: !Ref PrivateSubnet2CIDR
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PrivateSubnet2
        - Key: Environment
          Value: production

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NATEIP
        - Key: Environment
          Value: production

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT
        - Key: Environment
          Value: production

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PublicRoutes
        - Key: Environment
          Value: production

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PrivateRoutes
        - Key: Environment
          Value: production

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for the Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-SG
        - Key: Environment
          Value: production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for the web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG
        - Key: Environment
          Value: production

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for the RDS instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-RDS-SG
        - Key: Environment
          Value: production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB
        - Key: Environment
          Value: production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      Port: 8080
      Protocol: HTTP
      UnhealthyThresholdCount: 5
      VpcId: !Ref VPC
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-TG
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

  # Auto Scaling Group and Launch Template
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-WebServerLT
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t2.micro
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash -xe
            yum update -y
            yum install -y java-17-amazon-corretto
            echo "#!/bin/bash" > /etc/rc.d/init.d/custom-startup
            echo "java -jar /tmp/app.jar --server.port=8080" >> /etc/rc.d/init.d/custom-startup
            chmod +x /etc/rc.d/init.d/custom-startup
            /etc/rc.d/init.d/custom-startup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer
              - Key: Environment
                Value: production

  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-WebServerASG
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer
          PropagateAtLaunch: true
        - Key: Environment
          Value: production
          PropagateAtLaunch: true

  # RDS MySQL Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-DBSubnetGroup
        - Key: Environment
          Value: production

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: 5.7
      MasterUsername: !Ref DBUser
      MasterUserPassword: !Ref DBPassword
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-RDS
        - Key: Environment
          Value: production

Outputs:
  VPC:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCID

  PublicSubnets:
    Description: List of public subnet IDs
    Value: !Join [ ",", [ !Ref PublicSubnet1, !Ref PublicSubnet2 ] ]
    Export:
      Name: !Sub ${EnvironmentName}-PublicSubnets

  PrivateSubnets:
    Description: List of private subnet IDs
    Value: !Join [ ",", [ !Ref PrivateSubnet1, !Ref PrivateSubnet2 ] ]
    Export:
      Name: !Sub ${EnvironmentName}-PrivateSubnets

  WebsiteURL:
    Description: URL for the ALB
    Value: !Sub http://${ApplicationLoadBalancer.DNSName}
    Export:
      Name: !Sub ${EnvironmentName}-WebsiteURL

  RDSEndpoint:
    Description: RDS endpoint address
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub ${EnvironmentName}-RDSEndpoint
```

## Template Explanation

This CloudFormation template creates a complete, highly available web application infrastructure in the us-west-2 region with the following components:

### 1. VPC Network Configuration
- A VPC with a CIDR block of 10.0.0.0/16
- Two public subnets (10.0.1.0/24 and 10.0.2.0/24) in different availability zones (us-west-2a and us-west-2b)
- Two private subnets (10.0.3.0/24 and 10.0.4.0/24) in different availability zones (us-west-2a and us-west-2b)
- An Internet Gateway for public subnet internet access
- A NAT Gateway in the first public subnet for private subnet outbound internet access
- Appropriate route tables for directing traffic

### 2. Security Groups
- ALB Security Group: Allows inbound HTTP (port 80) traffic from anywhere
- Web Server Security Group: Allows inbound traffic on port 8080 only from the ALB Security Group
- RDS Security Group: Allows inbound MySQL (port 3306) traffic only from the Web Server Security Group

### 3. Application Load Balancer
- Deployed across both public subnets
- Listener on port 80 that forwards traffic to port 8080 on the EC2 instances
- Target group for health checks and routing

### 4. Auto Scaling Group
- Launch Template using the latest Amazon Linux 2023 AMI
- t2.micro instance type
- Minimum 2, maximum 6 instances
- Deployed in the private subnets
- Basic user data script to run a web application on port 8080

### 5. RDS MySQL Database
- MySQL 5.7 engine
- Multi-AZ deployment for high availability
- Deployed in the private subnets
- Secured with the RDS Security Group

### 6. Resource Tagging
- All resources are tagged with "Environment: production"

This infrastructure design ensures high availability by distributing resources across multiple availability zones, implements security best practices with properly configured security groups, and provides scalability through the Auto Scaling Group configuration.
```
