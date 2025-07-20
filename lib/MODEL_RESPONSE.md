# Note: AWS region is specified during stack deployment, not in the template
Resources:
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0abcdef1234567890 # Replace with valid AMI ID in us-east-1
      IamInstanceProfile: !Ref EC2InstanceRoleProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience

  EC2InstanceRoleProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP/HTTPS from 203.0.113.0/24 only
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 203.0.113.0/24
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 203.0.113.0/24
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience