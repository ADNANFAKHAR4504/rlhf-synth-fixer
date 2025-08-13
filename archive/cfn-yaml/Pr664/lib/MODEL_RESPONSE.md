```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready web application infrastructure with secure, scalable, and highly available architecture'

Parameters:
  DynamoDBTableArn:
    Type: String
    Description: ARN of the DynamoDB table for Lambda access
    Default: 'arn:aws:dynamodb:us-east-1:123456789012:table/example-table'

  ECRImageURI:
    Type: String
    Description: ECR repository URI for Lambda function
    Default: '123456789012.dkr.ecr.us-east-1.amazonaws.com/lambda-function:latest'

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
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # Internet Gateway
  WebAppIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: WebApp-IGW
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref WebAppVPC
      InternetGatewayId: !Ref WebAppIGW

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-1
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-2
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-1
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: us-east-1b
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-2
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: WebApp-NAT-EIP-1
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: WebApp-NAT-EIP-2
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: WebApp-NAT-Gateway-1
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: WebApp-NAT-Gateway-2
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: WebApp-Public-RouteTable
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref WebAppIGW

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
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: WebApp-Private-RouteTable-1
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Name
          Value: WebApp-Private-RouteTable-2
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic from anywhere
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow outbound to web servers
      Tags:
        - Key: Name
          Value: WebApp-ALB-SecurityGroup
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB only
      Tags:
        - Key: Name
          Value: WebApp-WebServer-SecurityGroup
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow PostgreSQL traffic from web servers only
      Tags:
        - Key: Name
          Value: WebApp-Database-SecurityGroup
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # Application Load Balancer
  WebAppALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: WebApp-ALB
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: WebApp-ALB
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  WebAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: WebApp-TargetGroup
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
        - Key: Name
          Value: WebApp-TargetGroup
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  WebAppALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebAppTargetGroup
      LoadBalancerArn: !Ref WebAppALB
      Port: 80
      Protocol: HTTP

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: WebApp-DB-SubnetGroup
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  WebAppDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: webapp-database
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '14.9'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      DBName: webappdb
      MasterUsername: dbadmin
      ManageMasterUserPassword: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: WebApp-Database
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # S3 Bucket
  WebAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-storage-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: WebApp-Storage-Bucket
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # IAM Role for Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: WebApp-Lambda-ExecutionRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:Scan
                Resource: !Ref DynamoDBTableArn
      Tags:
        - Key: Name
          Value: WebApp-Lambda-ExecutionRole
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # Lambda Function
  WebAppLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: WebApp-ProcessorFunction
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ImageUri: !Ref ECRImageURI
      PackageType: Image
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: Production
      Tags:
        - Key: Name
          Value: WebApp-ProcessorFunction
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # CloudWatch Alarm for RDS CPU Utilization
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: WebApp-Database-HighCPU
      AlarmDescription: Alarm when database CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref WebAppDatabase
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref WebAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt WebAppALB.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt WebAppDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref WebAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt WebAppLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'
```
