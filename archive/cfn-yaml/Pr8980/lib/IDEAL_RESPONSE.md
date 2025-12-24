### The Ideal resposne for the stack is below:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure production-ready application environment in AWS'

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Default: vpc-12345abcde
    Description: 'Existing VPC ID - must be vpc-12345abcde'
    
  SubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: 'Subnet ID that belongs to vpc-12345abcde'
    
  InstanceType:
    Type: String
    Default: t3.micro
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      
  IngressCidrSsh:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block for SSH access'
    
  IngressCidrHttps:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block for HTTPS access'
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: 'Latest Amazon Linux 2 AMI ID'

Resources:
  ApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group allowing SSH and HTTPS traffic only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref IngressCidrSsh
          Description: 'SSH access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref IngressCidrHttps
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Environment
          Value: Production

  ApplicationInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      SubnetId: !Ref SubnetId
      SecurityGroupIds:
        - !Ref ApplicationSecurityGroup
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ApplicationInstance

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Environment
          Value: Production

Outputs:
  SecurityGroupId:
    Description: 'ID of the created security group'
    Value: !Ref ApplicationSecurityGroup
    
  InstanceId:
    Description: 'ID of the created EC2 instance'
    Value: !Ref ApplicationInstance
    
  InstancePublicIp:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt ApplicationInstance.PublicIp
    
  BucketName:
    Description: 'Name of the created S3 bucket'
    Value: !Ref ApplicationBucket
```