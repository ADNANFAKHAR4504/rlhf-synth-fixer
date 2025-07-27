AWSTemplateFormatVersion: '2010-09-09'
Description: >
  This CloudFormation template creates a secure AWS VPC, S3 bucket, and IAM role
  with environment-based tagging in the us-east-1 region.

Parameters:
  Environment:
    Type: String
    Description: Environment name (e.g., dev, stage, prod)
    AllowedValues:
      - dev
      - stage
      - prod
  ProjectName:
    Type: String
    Description: Project name for tagging and naming resources
  IAMGroupARN:
    Type: String
    Description: ARN of the IAM Group to trust for the S3 read role

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-storage'
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  S3ReadRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Ref IAMGroupARN
            Action: sts:AssumeRole
      Path: /
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  VPCId:
    Description: The ID of the VPC
    Value: !Ref MyVPC
  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref S3Bucket
  S3ReadRoleARN:
    Description: The ARN of the S3 read role
    Value: !GetAtt S3ReadRole.Arn