### Model provided response below
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Scalable web application infrastructure with S3, EC2, and RDS

Parameters:
  EnvironmentName:
    Type: String
    Description: Environment identifier (e.g., dev, prod)
  
  OwnerName:
    Type: String
    Description: Resource owner's name
  
  ProjectName:
    Type: String
    Description: Project identifier

Resources:
  WebAppAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

  WebAppServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

  WebAppDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: mysql
      AllocatedStorage: 20
      StorageType: gp2
      MultiAZ: true
      MasterUsername: admin
      MasterUserPassword: SecurePassword123!
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName
```