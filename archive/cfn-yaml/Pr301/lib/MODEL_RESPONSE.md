```yml

AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy an EC2 instance and an S3 bucket for a development environment.

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0abcdef1234567890 # Replace with a valid Amazon Linux 2 AMI ID in us-east-1
      Tags:
        - Key: Environment
          Value: Development

  DevS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  EC2InstanceId:
    Description: The InstanceId of the EC2 instance
    Value: !Ref DevEC2Instance

  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref DevS3Bucket

```