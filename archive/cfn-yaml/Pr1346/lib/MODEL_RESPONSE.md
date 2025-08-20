I'll create a comprehensive CloudFormation template that meets all your requirements for a high-availability web application. Here's the complete `TapStack.yml` template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High-Availability Web Application Stack with ALB, Auto Scaling, and Multi-AZ deployment'

Parameters:
  # Environment and naming parameters
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment name for resource tagging'
  
  ProjectName:
    Type: String
    Default: 'TapWebApp'
    Description: 'Project name for resource naming and tagging'
  
  # Network parameters
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
  
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet in AZ1'
  
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet in AZ2'
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for private subnet in AZ1'
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    Description: 'CIDR block for private subnet in AZ2'
  
  # Security parameters
  SSHAllowedCidr:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  
  # EC2 parameters
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type for web servers'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
  
  # Auto Scaling parameters
  MinSize:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: 'Minimum number of instances in Auto Scaling Group'
  
  MaxSize:
    Type: Number
    Default: 6
    MinValue: 2
    MaxValue: 20
    Description: 'Maximum number of instances in Auto Scaling Group'
  
  DesiredCapacity:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10
    Description: 'Desired number of instances in Auto Scaling Group'
  
  # Application parameters
  S3BucketName:
    Type: String
    Default: 'tap-webapp-code-bucket'
    Description: 'S3 bucket name for application code (must be globally unique)'

Mappings:
  # AMI mapping for different regions (Amazon Linux 2)
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890
    us-west-2:
      AMI: ami-0abcdef1234567890
    eu-west-1:
      AMI: ami-0abcdef1234567890
    # Add more regions as needed

Resources:
  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: 'Engineering'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

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
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateways for private subnets
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Routes'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

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
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ1'

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
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ2'

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

  # ==================== Security Groups ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-WebServer-SG'
      GroupDescription: 'Security group for web server instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTPS traffic from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCidr
          Description: 'Allow SSH access from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-WebServer-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== S3 Bucket for Application Code ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketName}-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Code-Bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==================== IAM Role for EC2 Instances ====================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-EC2-Role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${S3Bucket}/*'
                  - !Ref S3Bucket
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-EC2-Profile'
      Roles:
        - !Ref EC2Role

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-ALB'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-TG'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==================== Launch Template ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd aws-cli
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Start and enable Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple index page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>${ProjectName} - ${Environment}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
                    .info { margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${ProjectName} Web Application</h1>
                    <h2>Environment: ${Environment}</h2>
                </div>
                <div class="info">
                    <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                    <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                    <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
                    <p><strong>Local IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)</p>
                    <p><strong>Timestamp:</strong> $(date)</p>
                </div>
                <div class="info">
                    <h3>Application Status</h3>
                    <p style="color: green;">✓ Web server is running successfully</p>
                    <p style="color: green;">✓ Load balancer health check: PASSED</p>
                </div>
            </body>
            </html>
            EOF
            
            # Download application code from S3 (if available)
            aws s3 sync s3://${S3Bucket}/ /var/www/html/ --region ${AWS::Region} || echo "No additional application code found in S3"
            
            # Set proper permissions
            chown -R apache:apache /var/www/html
            chmod -R 644 /var/www/html
            
            # Configure CloudWatch agent (basic configuration)
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
                "metrics": {
                    "namespace": "${ProjectName}/${Environment}",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Signal CloudFormation that the instance is ready
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-WebServer'
              - Key: Environment
                Value: !Ref Environment
              - Key: Project
                Value: !Ref ProjectName
              - Key: CostCenter
                Value: 'Engineering'

  # ==================== Auto Scaling Group ====================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ASG'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: 'Engineering'
          PropagateAtLaunch: true
    CreationPolicy:
      ResourceSignal:
        Count: !Ref DesiredCapacity
        Timeout: PT10M
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT10M
        WaitOnResourceSignals: true

  # ==================== Auto Scaling Policies ====================
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # ==================== CloudWatch Alarms ====================
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-CPU-High'
      AlarmDescription: 'Scale up on high CPU'
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
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-CPU-Low'
      AlarmDescription: 'Scale down on low CPU'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

# ==================== Outputs ====================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'

  LoadBalancerDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  S3BucketName:
    Description: 'S3 Bucket for application code'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  PublicSubnets:
    Description: 'Public Subnets'
    Value: !Sub '${PublicSubnet1}, ${PublicSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: 'Private Subnets'
    Value: !Sub '${PrivateSubnet1}, ${PrivateSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'
```

## Key Features Explained

### 1. **High Availability Architecture**
- **Multi-AZ Deployment**: Resources are distributed across two Availability Zones
- **Load Balancer**: Internet-facing ALB distributes traffic across multiple AZs
- **Auto Scaling**: Ensures application availability and handles traffic spikes

### 2. **Network Security**
- **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from anywhere
- **EC2 Security Group**: Allows traffic from ALB and SSH from specified CIDR
- **Private Subnets**: EC2 instances are in private subnets for security

### 3. **Auto Scaling Configuration**
- **CPU-based Scaling**: Scales up at 70% CPU, scales down at 25% CPU
- **Health Checks**: ELB health checks ensure only healthy instances receive traffic
- **Rolling Updates**: Ensures zero-downtime deployments

### 4. **S3 Integration**
- **Application Code Storage**: S3 bucket for storing application code
- **IAM Permissions**: EC2 instances have read access to the S3 bucket
- **Automatic Download**: User data script downloads code during instance launch

### 5. **Comprehensive Tagging**
- **Cost Tracking**: Environment, Project, and CostCenter tags
- **Organization**: Consistent naming and tagging across all resources

## Deployment Instructions

### 1. **Prerequisites**
```bash
# Ensure you have AWS CLI configured
aws configure

# Create an EC2 Key Pair (if you don't have one)
aws ec2 create-key-pair --key-name MyKeyPair --query 'KeyMaterial' --output text > MyKeyPair.pem
chmod 400 MyKeyPair.pem
```

### 2. **Deploy the Stack**
```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name TapWebAppStack \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=KeyPairName,ParameterValue=MyKeyPair \
               ParameterKey=SSHAllowedCidr,ParameterValue=10.0.0.0/8 \
  --capabilities CAPABILITY_NAMED_IAM

# Monitor the deployment
aws cloudformation describe-stacks --stack-name TapWebAppStack --query 'Stacks[0].StackStatus'
```

### 3. **Upload Application Code (Optional)**
```bash
# Get the S3 bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name TapWebAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)

# Upload your application code
aws s3 sync ./your-app-directory/ s3://$BUCKET_NAME/
```

### 4. **Testing the Deployment**

#### **Load Balancer Testing**
```bash
# Get the Load Balancer URL
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name TapWebAppStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text)

# Test the application
curl $ALB_URL

# Test multiple times to see different instances
for i in {1..10}