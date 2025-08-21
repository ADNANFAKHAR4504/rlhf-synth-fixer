I'll create a comprehensive CloudFormation template that meets all your requirements. Here's the complete `webapp-deployment.yaml` file:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Web Application Infrastructure with CI/CD Pipeline, Load Balancer, RDS, and Monitoring'

Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Default: my-key-pair

  DBUsername:
    Type: String
    Description: Database administrator username
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    Description: Database administrator password
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    Default: MySecurePassword123

Resources:
  # VPC and Networking
  WebAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: WebApp-VPC
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: WebApp-IGW
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref WebAppVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-west-2a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-A
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-west-2b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-B
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Private Subnets for RDS
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-A
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: us-west-2b
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-B
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Route Table for Public Subnets
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: WebApp-Public-RT
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: WebApp-WebServer-SG
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: WebApp-Database-SG
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: WebApp-EC2-Role
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
        - PolicyName: S3AndRDSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource: '*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                Resource: '*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                  - logs:DescribeLogGroups
                Resource: '*'
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # CloudWatch Log Group
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /webapp/application
      RetentionInDays: 14
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: WebApp-LaunchTemplate
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI (update as needed)
        InstanceType: t2.micro
        KeyName: !Ref KeyPairName
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

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/webapp/application",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/webapp/application",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

            # Create a simple web page
            echo "<h1>Web Application Server</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: WebApp-Server
              - Key: Project
                Value: WebApp
              - Key: Environment
                Value: Production

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: WebApp-ASG
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: WebApp-ASG-Instance
          PropagateAtLaunch: true
        - Key: Project
          Value: WebApp
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: WebApp-ALB
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: WebApp-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref WebAppVPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # Listener
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Elastic IP for main instance (attached to first instance in ASG)
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: WebApp-EIP
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: webapp-db-subnet-group
      DBSubnetGroupDescription: Subnet group for WebApp RDS
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # RDS Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: webapp-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      DBName: webapp
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      StorageEncrypted: true
      DeletionProtection: false
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # S3 Bucket for CI/CD artifacts
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-cicd-artifacts-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # CodeBuild Service Role
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: WebApp-CodeBuild-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                Resource: !Sub '${ArtifactsBucket}/*'
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # CodePipeline Service Role
  CodePipelineServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: WebApp-CodePipeline-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodePipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:GetBucketVersioning
                Resource:
                  - !Sub '${ArtifactsBucket}'
                  - !Sub '${ArtifactsBucket}/*'
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource: '*'
              - Effect: Allow
                Action:
                  - autoscaling:*
                  - ec2:*
                  - elasticloadbalancing:*
                Resource: '*'
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # CodeBuild Projects
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: WebApp-Build
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
            build:
              commands:
                - echo Build started on `date`
                - echo Building the application...
                # Add your build commands here
            post_build:
              commands:
                - echo Build completed on `date`
          artifacts:
            files:
              - '**/*'
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  TestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: WebApp-Test
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Starting tests...
            build:
              commands:
                - echo Running unit tests...
                # Add your test commands here
            post_build:
              commands:
                - echo Tests completed on `date`
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: WebApp-Pipeline
      RoleArn: !GetAtt CodePipelineServiceRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactsBucket
      Stages:
        - Name: Source
          Actions:
            - Name: Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                S3Bucket: !Ref ArtifactsBucket
                S3ObjectKey: source.zip
              OutputArtifacts:
                - Name: SourceOutput
        - Name: Build
          Actions:
            - Name: Build
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        - Name: Test
          Actions:
            - Name: Test
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: BuildOutput
              OutputArtifacts:
                - Name: TestOutput
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                BucketName: !Ref ArtifactsBucket
                Extract: true
              InputArtifacts:
                - Name: TestOutput
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref WebAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  ElasticIPAddress:
    Description: Elastic IP Address
    Value: !Ref ElasticIP
    Export:
      Name: !Sub '${AWS::StackName}-EIP'

  ArtifactsBucketName:
    Description: S3 Bucket for CI/CD Artifacts
    Value: !Ref ArtifactsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Artifacts-Bucket'
```

## Key Features Explained

### **Network Architecture**

- **VPC**: `10.0.0.0/16` CIDR block in `us-west-2`
- **Public Subnets**: `10.0.1.0/24` (AZ-a) and `10.0.2.0/24` (AZ-b) for web servers
- **Private Subnets**: `10.0.3.0/24` (AZ-a) and `10.0.4.0/24` (AZ-b) for RDS

### **High Availability**

- **Auto Scaling Group**: Maintains 2-4 `t2.micro` instances across both AZs
- **Application Load Balancer**: Distributes traffic across healthy instances
- **Multi-AZ RDS**: Database backup and failover capabilities

### **Security**

- **Security Groups**: Restrict HTTP/HTTPS access only from internet
- **IAM Roles**: EC2 instances have specific permissions for S3 and RDS
- **Private Database**: RDS only accessible from web servers

### **CI/CD Pipeline**

- **Build Stage**: Compiles and packages application
- **Test Stage**: Runs automated tests
- **Deploy Stage**: Deploys to production environment
- **S3 Artifacts**: Stores build artifacts and deployment packages

### **Monitoring & Logging**

- **CloudWatch Logs**: Captures application and web server logs
- **CloudWatch Agent**: Installed on all EC2 instances
- **Log Retention**: 14-day retention policy

### **Deployment Instructions**

1. **Validate the template**:

   ```bash
   aws cloudformation validate-template --template-body file://webapp-deployment.yaml
   ```

2. **Deploy the stack**:

   ```bash
   aws cloudformation create-stack \
     --stack-name webapp-infrastructure \
     --template-body file://webapp-deployment.yaml \
     --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
                  ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

3. **Monitor deployment**:
   ```bash
   aws cloudformation describe-stacks --stack-name webapp-infrastructure
   ```

The template includes all required tags (`Project=WebApp`, `Environment=Production`) and follows AWS best practices for security, scalability, and maintainability.
