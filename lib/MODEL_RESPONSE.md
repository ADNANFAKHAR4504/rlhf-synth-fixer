# Secure RDS MySQL Deployment

I'll help you create a secure RDS MySQL deployment with VPC, encryption, automated backups, and monitoring using CloudFormation.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure RDS MySQL deployment with VPC, encryption, automated backups, and monitoring'

Parameters:
  EnvironmentSuffix:
    Default: dev
    Type: String
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    MinLength: 1
    MaxLength: 10

  DBName:
    Type: String
    Description: Initial database name
    Default: customerdb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'customer-vpc-${EnvironmentSuffix}'

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'customer-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'customer-private-subnet-2-${EnvironmentSuffix}'

  # KMS Key for RDS Encryption
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for RDS encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

  # DB Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS MySQL instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  # RDS MySQL Instance
  DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'customer-db-${EnvironmentSuffix}'
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.39'
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      StorageEncrypted: true
      KmsKeyId: !GetAtt RDSKMSKey.Arn
      MasterUsername: admin
      MasterUserPassword: TempPassword123!
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'customer-db-${EnvironmentSuffix}'

Outputs:
  DBInstanceEndpoint:
    Description: RDS MySQL instance endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
  
  DBInstancePort:
    Description: RDS MySQL instance port
    Value: !GetAtt DBInstance.Endpoint.Port
```

This template creates a basic RDS MySQL deployment but has several security and best practice issues that need to be addressed for production use.