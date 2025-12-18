### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates a multi-tier web application infrastructure. Let me break down the requirements:

1. **VPC and Networking:**
   - Create a VPC with proper network isolation
   - At least 2 public subnets and 2 private subnets
   - Proper availability zone distribution
   - Internet Gateway for public subnet connectivity
   - NAT Gateway/Instance for private subnet outbound connectivity (though not explicitly mentioned)

2. **Compute Layer:**
   - EC2 instances (t2.micro) in public subnets
   - Elastic IP for each instance
   - Auto Scaling Group to maintain at least 1 instance per public subnet (minimum 2 instances)
   - Security group allowing HTTP (port 80) from anywhere

3. **Storage:**
   - S3 bucket with versioning enabled
   - No public access allowed
   - IAM role for EC2 instances to read/write to S3

4. **Load Balancing:**
   - Application Load Balancer (ALB) or Classic Load Balancer
   - Health checks
   - Route traffic to EC2 instances in public subnets

5. **Best Practices:**
   - Valid CloudFormation YAML
   - Infrastructure as Code best practices
   - Proper resource dependencies

Let me create a comprehensive CloudFormation template that meets all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that establishes a complete multi-tier web application infrastructure with high availability. This template will include all the components you've requested, properly configured and integrated.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-tier web application infrastructure with high availability'

Parameters:
  EnvironmentName:
    Description: An environment name that is prefixed to resource names
    Type: String
    Default: WebApp
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.20.0/24'

Resources:
  # ==========================================
  # Network Infrastructure
  # ==========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

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

  # ==========================================
  # Public Subnets
  # ==========================================
  
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2

  # ==========================================
  # Private Subnets
  # ==========================================
  
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ2

  # ==========================================
  # NAT Gateways for Private Subnets
  # ==========================================
  
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP-AZ1

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-EIP-AZ2

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-AZ1

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NAT-AZ2

  # ==========================================
  # Route Tables
  # ==========================================
  
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ1

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
          Value: !Sub ${EnvironmentName}-Private-Routes-AZ2

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

  # ==========================================
  # Security Groups
  # ==========================================
  
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-LoadBalancer-SG
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-LoadBalancer-SG

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
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: Allow HTTP from Load Balancer
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-WebServer-SG

  # ==========================================
  # IAM Role for EC2 Instances
  # ==========================================
  
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub ${EnvironmentName}-EC2-S3-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                  - s3:GetBucketVersioning
                  - s3:GetObjectVersion
                  - s3:DeleteObjectVersion
                Resource:
                  - !Sub 'arn:aws:s3:::${S3Bucket}'
                  - !Sub 'arn:aws:s3:::${S3Bucket}/*'
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2-Role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub ${EnvironmentName}-EC2-Profile
      Roles:
        - !Ref EC2InstanceRole

  # ==========================================
  # S3 Bucket
  # ==========================================
  
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-storage-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-S3-Bucket

  # ==========================================
  # Application Load Balancer
  # ==========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-ALB
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ALB

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub ${EnvironmentName}-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200-399
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-TG

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==========================================
  # Launch Template
  # ==========================================
  
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub ${EnvironmentName}-LaunchTemplate
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple index page
            cat << 'EOF' > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>Multi-Tier Web Application</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 50px;
                        background-color: #f0f0f0;
                    }
                    .container {
                        background-color: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #333;
                        border-bottom: 2px solid #007bff;
                        padding-bottom: 10px;
                    }
                    .info {
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #e8f4f8;
                        border-left: 4px solid #007bff;
                    }
                    .instance-id {
                        font-weight: bold;
                        color: #007bff;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Multi-Tier Web Application Infrastructure</h1>
                    <div class="info">
                        <p>Welcome to the ${EnvironmentName} environment!</p>
                        <p>Instance ID: <span class="instance-id">$(ec2-metadata --instance-id | cut -d " " -f 2)</span></p>
                        <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
                        <p>Instance Type: $(ec2-metadata --instance-type | cut -d " " -f 2)</p>
                        <p>S3 Bucket: ${S3Bucket}</p>
                    </div>
                    <p>This instance has access to the S3 bucket for read/write operations.</p>
                    <p>All traffic is distributed through the Application Load Balancer for high availability.</p>
                </div>
            </body>
            </html>
            EOF
            
            # Configure AWS CLI
            aws configure set region ${AWS::Region}
            
            # Test S3 access by creating a test file
            echo "Web server initialized at $(date)" > /tmp/init.txt
            aws s3 cp /tmp/init.txt s3://${S3Bucket}/instances/$(ec2-metadata --instance-id | cut -d " " -f 2)/init.txt
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub ${EnvironmentName}-WebServer

  # ==========================================
  # Auto Scaling Group
  # ==========================================
  
  WebServerAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub ${EnvironmentName}-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-ASG-Instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # ==========================================
  # Auto Scaling Policies
  # ==========================================
  
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref WebServerAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-HighCPU
      AlarmDescription: Scale up when CPU exceeds 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${EnvironmentName}-LowCPU
      AlarmDescription: Scale down when CPU is below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref WebServerAutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub ${EnvironmentName}-ALB-DNS

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'

  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub ${EnvironmentName}-S3-Bucket

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub ${EnvironmentName}-PublicSubnet1-ID

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub ${EnvironmentName}-PublicSubnet2-ID

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub ${EnvironmentName}-PrivateSubnet1-ID

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub ${EnvironmentName}-PrivateSubnet2-ID

  WebServerSecurityGroupId:
    Description: Security Group ID for Web Servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-WebServer-SG-ID
```

## Template Overview

This CloudFormation template creates a complete multi-tier web application infrastructure with the following components:

### 1. **Network Architecture**
- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs
- **Private Subnets**: Two subnets (10.0.10.0/24, 10.0.20.0/24) in different AZs
- **Internet Gateway**: For public subnet internet access
- **NAT Gateways**: High-availability NAT gateways in each AZ for private subnet outbound traffic
- **Route Tables**: Separate routing for public and private subnets

### 2. **Compute Layer**
- **Auto Scaling Group**: Maintains minimum 2 instances (one per AZ)
- **Launch Template**: Configures t2.micro instances with:
  - Latest Amazon Linux 2 AMI
  - Apache web server installation
  - Custom HTML page showing instance information
  - IAM instance profile for S3 access
- **Scaling Policies**: CPU-based auto-scaling (scale up at 70%, scale down at 30%)

### 3. **Storage**
- **S3 Bucket**: 
  - Versioning enabled for object history
  - Public access completely blocked
  - Server-side encryption with AES256
  - Lifecycle policy to delete old versions after 30 days
- **IAM Role**: Grants EC2 instances read/write access to the S3 bucket

### 4. **Load Balancing**
- **Application Load Balancer**: 
  - Internet-facing configuration
  - Distributed across both public subnets
  - HTTP listener on port 80
- **Target Group**: 
  - Health checks every 30 seconds
  - Routes to healthy instances only

### 5. **Security**
- **Load Balancer Security Group**: Allows HTTP (port 80) from anywhere
- **Web Server Security Group**: Only accepts HTTP traffic from the load balancer
- **IAM Principle of Least Privilege**: Role grants only necessary S3 permissions

## Key Features

1. **High Availability**: Resources distributed across multiple availability zones
2. **Auto-Healing**: Auto Scaling Group automatically replaces failed instances
3. **Scalability**: Auto-scaling based on CPU utilization
4. **Security**: 
   - No direct internet access to web servers (only through ALB)
   - S3 bucket with strict access controls
   - Security groups following least privilege principle
5. **Best Practices**:
   - Use of parameters for environment naming
   - Exported outputs for cross-stack references
   - Proper tagging for resource identification
   - Rolling update policy for ASG updates

## Deployment Instructions

1. Save the template as `webapp-infrastructure.yaml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name webapp-stack \
  --template-body file://webapp-infrastructure.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=Production \
  --capabilities CAPABILITY_NAMED_IAM
```

3. Monitor stack creation:
```bash
aws cloudformation describe-stacks \
  --stack-name webapp-stack \
  --query 'Stacks[0].StackStatus'
```

4. Once complete, get the load balancer URL:
```bash
aws cloudformation describe-stacks \
  --stack-name webapp-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

The infrastructure will be fully operational once the stack creation completes, with the web application accessible through the Application Load Balancer URL provided in the outputs.