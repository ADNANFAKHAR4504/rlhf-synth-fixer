A comprehensive CloudFormation template for a web application environment that meets all your requirements. Here's the complete YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Web application environment with ALB, EC2 instances, and proper security configuration'

# Parameters for flexibility and reusability
Parameters:
  EnvironmentName:
    Description: An environment name that is prefixed to resource names
    Type: String
    Default: WebApp
    
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16
    
  PublicSubnet1CIDR:
    Description: CIDR block for the public subnet in AZ1
    Type: String
    Default: 10.0.1.0/24
    
  PublicSubnet2CIDR:
    Description: CIDR block for the public subnet in AZ2
    Type: String
    Default: 10.0.2.0/24
    
  InstanceType:
    Description: EC2 instance type for web servers
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t2.micro
      - t2.small
      - t2.medium
    ConstraintDescription: Must be a valid EC2 instance type
    
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
    
  SSHLocation:
    Description: IP address range that can SSH to the EC2 instances
    Type: String
    MinLength: 9
    MaxLength: 18
    Default: 0.0.0.0/0
    AllowedPattern: (\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x

# Mappings for AMI IDs by region (using Amazon Linux 2)
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets in different AZs for high availability
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2

  # Route Table for public subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Routes

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

  # Security Groups
  # ALB Security Group - allows HTTP and HTTPS from anywhere
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-ALB-SG
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic from anywhere
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB-SecurityGroup

  # Web Server Security Group - allows traffic from ALB and SSH access
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-WebServer-SG
      GroupDescription: Security group for web server instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS traffic from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
          Description: Allow SSH access for administration
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SecurityGroup

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-ALB
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB

  # Target Group for the ALB
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-TG
      Port: 80
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
          Value: !Sub ${EnvironmentName}-TargetGroup

  # ALB Listener for HTTP traffic
  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ALB Listener for HTTPS traffic (redirects to HTTP for simplicity)
  # In production, you would configure SSL certificate here
  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTP
            Port: 80
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTP

  # Launch Template for EC2 instances
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${EnvironmentName} Web Server</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer

  # EC2 Instance 1 in first AZ
  WebServerInstance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-1

  # EC2 Instance 2 in second AZ for high availability
  WebServerInstance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-2

  # Register instances with target group
  TargetGroupAttachment1:
    Type: AWS::ElasticLoadBalancingV2::TargetGroupAttachment
    Properties:
      TargetGroupArn: !Ref ALBTargetGroup
      TargetId: !Ref WebServerInstance1
      Port: 80

  TargetGroupAttachment2:
    Type: AWS::ElasticLoadBalancingV2::TargetGroupAttachment
    Properties:
      TargetGroupArn: !Ref ALBTargetGroup
      TargetId: !Ref WebServerInstance2
      Port: 80

# Outputs for useful information
Outputs:
  VPC:
    Description: A reference to the created VPC
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPCID

  PublicSubnets:
    Description: A list of the public subnets
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-PUB-NETS

  WebServerSecurityGroup:
    Description: Security group ID for web servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-WebServer-SG

  ALBSecurityGroup:
    Description: Security group ID for Application Load Balancer
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-ALB-SG

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALB-DNS

  ApplicationLoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub http://${ApplicationLoadBalancer.DNSName}
    Export:
      Name: !Sub ${EnvironmentName}-ALB-URL

  WebServerInstance1PublicIP:
    Description: Public IP address of Web Server Instance 1
    Value: !GetAtt WebServerInstance1.PublicIp
    Export:
      Name: !Sub ${EnvironmentName}-WebServer1-PublicIP

  WebServerInstance2PublicIP:
    Description: Public IP address of Web Server Instance 2
    Value: !GetAtt WebServerInstance2.PublicIp
    Export:
      Name: !Sub ${EnvironmentName}-WebServer2-PublicIP

  WebServerInstance1PrivateIP:
    Description: Private IP address of Web Server Instance 1
    Value: !GetAtt WebServerInstance1.PrivateIp
    Export:
      Name: !Sub ${EnvironmentName}-WebServer1-PrivateIP

  WebServerInstance2PrivateIP:
    Description: Private IP address of Web Server Instance 2
    Value: !GetAtt WebServerInstance2.PrivateIp
    Export:
      Name: !Sub ${EnvironmentName}-WebServer2-PrivateIP
```

## Key Features and Design Decisions

### **Security Considerations:**

1. **Security Groups**:
    - ALB security group only allows HTTP (80) and HTTPS (443) from anywhere
    - Web server security group only allows traffic from ALB and SSH from specified CIDR
    - Principle of least privilege applied

2. **SSH Access**:
    - Configurable SSH source IP range via parameter
    - Default allows from anywhere (0.0.0.0/0) but should be restricted in production

3. **Network Segmentation**:
    - Resources deployed in public subnets for simplicity
    - In production, consider private subnets for web servers with NAT Gateway

### **High Availability:**

1. **Multi-AZ Deployment**:
    - Resources deployed across two availability zones
    - ALB distributes traffic across both instances

2. **Load Balancer**:
    - Application Load Balancer with health checks
    - Automatic failover if one instance becomes unhealthy

3. **Health Checks**:
    - Configured with appropriate thresholds and intervals

### **Best Practices Implemented:**

1. **Parameterization**: Template is flexible with configurable parameters
2. **Resource Naming**: Consistent naming convention using environment prefix
3. **Tagging**: All resources properly tagged for management
4. **Outputs**: Comprehensive outputs for integration with other stacks
5. **Documentation**: Extensive comments explaining design decisions

### **Deployment Instructions:**

1. Save the template as `web-app-infrastructure.yaml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name my-web-app \
  --template-body file://web-app-infrastructure.yaml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-pair-name \
  --region us-east-1
```

### **Production Considerations:**

1. **SSL Certificate**: Add ACM certificate for HTTPS listener
2. **Auto Scaling**: Consider adding Auto Scaling Group for dynamic scaling
3. **Monitoring**: Add CloudWatch alarms and logging
4. **Backup**: Implement backup strategies for data persistence
5. **Private Subnets**: Move web servers to private subnets with NAT Gateway

This template provides a solid foundation for a web application environment that can be easily extended and customized based on specific requirements.
