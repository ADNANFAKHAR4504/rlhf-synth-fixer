AWSTemplateFormatVersion: '2010-09-09'

Resources:
  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 
                  - s3:Get*
                  - s3:List*
                Resource: arn:aws:s3:::*
              - Effect: Deny
                Action: 
                  - s3:Put*
                  - s3:Delete*
                Resource: arn:aws:s3:::*

  # IAM Policy for a Specific User
  S3ReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: S3SpecificBucketReadOnly
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action: 
              - s3:Get*
              - s3:List*
            Resource: 
              - arn:aws:s3:::my-specific-bucket
              - arn:aws:s3:::my-specific-bucket/*

  # Attach the S3ReadOnlyPolicy to a specific IAM User
  AttachPolicyToUser:
    Type: AWS::IAM::UserPolicy
    Properties:
      UserName: my-specific-user
      PolicyName: S3SpecificBucketReadOnly

Outputs:
  EC2InstanceRoleARN:
    Description: ARN of the EC2 Instance Role
    Value: !GetAtt EC2InstanceRole.Arn

  S3ReadOnlyPolicyARN:
    Description: ARN of the S3 Read-Only Policy
    Value: !Ref S3ReadOnlyPolicy