```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-08a6efd148b1f7504
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DevS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: dev-bucket-tapstack-test
      VersioningConfiguration:
        git: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  EC2InstanceId:
    Description: The InstanceId of the EC2 instance
    Value: !Ref DevEC2Instance

  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref DevS3Bucket
```