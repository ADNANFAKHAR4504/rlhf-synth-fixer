```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready stack for a highly available web application. Provisions VPC, Subnets, ALB, RDS, S3, IAM Role, and Lambda.'

Parameters:
  DBMasterUsername:
    Type: String
    Description: Username for the RDS PostgreSQL database master user.
    Default: 'webappadmin'
  DynamoDBTableArnParameter:
    Type: String
    Description: The ARN of the DynamoDB table for the Lambda function to access.
    Default: 'arn:aws:dynamodb:*:*:table/placeholder-table' # Default placeholder ARN

Resources:
  # ------------------------------------------------------------#
  #  VPC & Networking
  # ------------------------------------------------------------#
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: WebApp-VPC
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-A
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: WebApp-Public-Subnet-B
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.101.0/24
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-A
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.102.0/24
      Tags:
        - Key: Name
          Value: WebApp-Private-Subnet-B
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  NatGatewayEIPA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayEIPB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIPA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIPB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

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

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  # ------------------------------------------------------------#
  #  Security Groups (Least Privilege)
  # ------------------------------------------------------------#
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow HTTP traffic from the internet'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: WebApp-ALB-SG
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow HTTP traffic from the ALB'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !GetAtt ALBSecurityGroup.GroupId
      Tags:
        - Key: Name
          Value: WebApp-WebServer-SG
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow PostgreSQL traffic from the Web Servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !GetAtt WebServerSecurityGroup.GroupId
      Tags:
        - Key: Name
          Value: WebApp-Database-SG
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # ------------------------------------------------------------#
  #  Application Load Balancer
  # ------------------------------------------------------------#
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: WebApp-ALB
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Protocol: HTTP
      Port: 80
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      TargetType: instance
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ------------------------------------------------------------#
  #  Database (RDS) & Secrets Manager
  # ------------------------------------------------------------#
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'Credentials for the WebApp RDS Database'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'DB Subnet group for the web app'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: webappdb
      Engine: postgres
      EngineVersion: '16.3'
      DBInstanceClass: db.t3.micro
      AllocatedStorage: '20'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref DBSecret,
            ':SecretString:password}}',
          ],
        ]
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      PubliclyAccessible: false
      StorageEncrypted: true
      MultiAZ: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # ------------------------------------------------------------#
  #  Storage (S3)
  # ------------------------------------------------------------#
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-assets-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # ------------------------------------------------------------#
  #  IAM & Lambda
  # ------------------------------------------------------------#
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Path: '/'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  LambdaDynamoDBPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${AWS::StackName}-DynamoDBReadPolicy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:Scan
            Resource: !Ref DynamoDBTableArnParameter
      Roles:
        - !Ref LambdaExecutionRole

  PlaceholderLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: WebApp-Placeholder-Function
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: nodejs20.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
              console.log('Event:', JSON.stringify(event, null, 2));
              return {
                  statusCode: 200,
                  body: JSON.stringify({
                      message: 'Hello from Lambda!',
                      timestamp: new Date().toISOString(),
                      event: event
                  })
              };
          };
      Timeout: 30
      MemorySize: 512
      VpcConfig:
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: WebAppTeam

  # ------------------------------------------------------------#
  #  Monitoring
  # ------------------------------------------------------------#
  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'WebApp-RDS-High-CPU-${AWS::StackName}'
      AlarmDescription: 'Alarm if RDS CPU utilization exceeds 80%'
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [] # Add SNS topic ARN here for notifications

Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref VPC
  ALBDNSName:
    Description: 'DNS Name of the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
  S3BucketName:
    Description: 'Name of the S3 Bucket for application assets'
    Value: !Ref S3Bucket
  RDSInstanceEndpoint:
    Description: 'Endpoint address of the RDS database instance'
    Value: !GetAtt RDSInstance.Endpoint.Address
  DBSecretARN:
    Description: 'ARN of the Secrets Manager secret for the DB credentials'
    Value: !Ref DBSecret
```
