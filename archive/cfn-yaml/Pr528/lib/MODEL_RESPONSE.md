Here's a comprehensive CloudFormation YAML template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure web environment setup with VPC, EC2, and Systems Manager Parameter Store integration - Batch 003 Expert CloudFormation YAML'

# Parameters section for customizable values
Parameters:
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
  
  AllowedSSHIPAddress:
    Type: String
    Description: IP address allowed to SSH to the EC2 instance (CIDR format)
    Default: '0.0.0.0/32'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: Must be a valid IP address in CIDR format (e.g., 192.168.1.1/32)
  
  ConfigurationValue:
    Type: String
    Description: Sensitive configuration value to store in Parameter Store
    Default: 'MySecretConfigurationString123'
    NoEcho: true

# Mappings for AMI IDs by region (Amazon Linux 2)
Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0c2d3e23d757b5d84  # Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type

# Resources section - all infrastructure components
Resources:
  # VPC Configuration
  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC

  # Public subnet for EC2 instance
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: us-west-2a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Route table for public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Default route to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate route table with public subnet
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Security group for EC2 instance
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServerSG'
      GroupDescription: Security group for web server allowing SSH from specific IP
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIPAddress
          Description: SSH access from allowed IP address
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServerSG'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # IAM role for EC2 instance with S3 read-only access
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2InstanceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Instance profile for EC2 role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2InstanceProfile'
      Roles:
        - !Ref EC2InstanceRole

  # Systems Manager Parameter Store for sensitive configuration
  ConfigurationParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/configuration/secret-value'
      Type: SecureString
      Value: !Ref ConfigurationValue
      Description: 'Sensitive configuration value for EC2 instance initialization'
      Tags:
        batchName: 'Batch 003 -Expert-CloudFormation-YAML'
        projectId: '166'
        projectName: 'IaC - AWS Nova Model Breaking'
        ProblemID: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # EC2 Instance with user data script
  WebServerInstance:
    Type: AWS::EC2::Instance
    DependsOn: 
      - ConfigurationParameter
      - PublicSubnetRouteTableAssociation
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      VpcSecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PublicSubnet
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli
          
          # Create log file for initialization
          LOG_FILE="/var/log/instance-init.log"
          echo "Starting instance initialization at $(date)" >> $LOG_FILE
          
          # Retrieve configuration from Parameter Store
          REGION=${AWS::Region}
          PARAM_NAME="/${AWS::StackName}/configuration/secret-value"
          
          echo "Retrieving parameter: $PARAM_NAME" >> $LOG_FILE
          CONFIG_VALUE=$(aws ssm get-parameter --region $REGION --name "$PARAM_NAME" --with-decryption --query 'Parameter.Value' --output text)
          
          if [ $? -eq 0 ]; then
            echo "Successfully retrieved configuration parameter" >> $LOG_FILE
            echo "Configuration value length: ${#CONFIG_VALUE}" >> $LOG_FILE
            
            # Store the configuration value in a local file (for demonstration)
            echo "$CONFIG_VALUE" > /opt/app-config.txt
            chmod 600 /opt/app-config.txt
            echo "Configuration stored in /opt/app-config.txt" >> $LOG_FILE
          else
            echo "Failed to retrieve configuration parameter" >> $LOG_FILE
          fi
          
          # Install and start a simple web server for testing
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          
          # Create a simple index page
          cat > /var/www/html/index.html << EOF
          <html>
          <head><title>Secure Web Server</title></head>
          <body>
            <h1>Secure Web Environment</h1>
            <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p>Configuration loaded: $([ -f /opt/app-config.txt ] && echo "Yes" || echo "No")</p>
            <p>Deployment: Batch 003 Expert CloudFormation YAML</p>
          </body>
          </html>
          EOF
          
          echo "Instance initialization completed at $(date)" >> $LOG_FILE
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

  # Elastic IP for the EC2 instance
  WebServerEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      InstanceId: !Ref WebServerInstance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServerEIP'
        - Key: batchName
          Value: 'Batch 003 -Expert-CloudFormation-YAML'
        - Key: projectId
          Value: '166'
        - Key: projectName
          Value: 'IaC - AWS Nova Model Breaking'
        - Key: ProblemID
          Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f'

# Outputs section - important resource information
Outputs:
  VPCId:
    Description: ID of the created VPC
    Value: !Ref MainVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: ID of the public subnet
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-ID'

  EC2InstanceId:
    Description: Instance ID of the web server
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance-ID'

  EC2PublicIP:
    Description: Public IP address of the web server (Elastic IP)
    Value: !Ref WebServerEIP
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Public-IP'

  SecurityGroupId:
    Description: ID of the security group
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup-ID'

  IAMRoleArn:
    Description: ARN of the IAM role attached to the EC2 instance
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAM-Role-ARN'

  ParameterStoreName:
    Description: Name of the Systems Manager parameter
    Value: !Ref ConfigurationParameter
    Export:
      Name: !Sub '${AWS::StackName}-Parameter-Name'

  WebServerURL:
    Description: URL of the web server
    Value: !Sub 'http://${WebServerEIP}'
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-URL'

  SSHCommand:
    Description: SSH command to connect to the instance
    Value: !Sub 'ssh -i your-key.pem ec2-user@${WebServerEIP}'
    Export:
      Name: !Sub '${AWS::StackName}-SSH-Command'
```

## Key Features and Explanations

### **Template Structure**
- **Parameters**: Configurable values for SSH key pair, allowed IP address, and sensitive configuration
- **Mappings**: AMI ID mapping for the us-west-2 region (Amazon Linux 2)
- **Resources**: All required AWS resources with proper dependencies
- **Outputs**: Important resource IDs and connection information

### **Security Implementation**
1. **VPC Isolation**: Custom VPC with dedicated subnets and routing
2. **Security Group**: Restricts SSH access to specified IP address only
3. **IAM Role**: Provides S3 read-only access using AWS managed policy
4. **Parameter Store**: Stores sensitive configuration as SecureString

### **Systems Manager Integration**
- Creates a SecureString parameter in Parameter Store
- EC2 user data script retrieves the parameter during initialization
- Includes error handling and logging for parameter retrieval

### **Resource Tagging**
All resources include the required tags:
- `batchName`: Batch 003 -Expert-CloudFormation-YAML
- `projectId`: 166
- `projectName`: IaC - AWS Nova Model Breaking
- `ProblemID`: Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f

### **Best Practices Implemented**
- Proper resource dependencies using `DependsOn`
- Export values for cross-stack references
- Descriptive resource names using stack name
- Comprehensive error handling in user data
- Security group with minimal required access
- Instance profile for secure role attachment

### **Deployment Instructions**
1. Save the template as `secure-web-environment.yaml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name secure-web-env \
  --template-body file://secure-web-environment.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=AllowedSSHIPAddress,ParameterValue=your.ip.address/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

The template is fully self-contained, follows AWS best practices, and meets all specified requirements for a secure web environment deployment.