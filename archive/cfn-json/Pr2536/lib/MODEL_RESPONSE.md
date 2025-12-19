# Model Response

Below is an example of a CloudFormation template in JSON. It creates a VPC, subnets, an S3 bucket, IAM role, CloudTrail, and a Security Group.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure AWS environment with VPC, S3, IAM, CloudTrail, and Security Group",
  "Resources": {
    "MyVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "Tags": [{ "Key": "Name", "Value": "prod-vpc" }]
      }
    },
    "PublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [{ "Key": "Name", "Value": "prod-public-subnet" }]
      }
    },
    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [{ "Key": "Name", "Value": "prod-private-subnet" }]
      }
    },
    "LogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "prod-log-bucket",
        "VersioningConfiguration": { "Status": "Enabled" }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "Properties": {
        "TrailName": "prod-cloudtrail",
        "IsLogging": true,
        "S3BucketName": { "Ref": "LogBucket" }
      }
    },
    "InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "ec2.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "VpcId": { "Ref": "MyVPC" },
        "GroupDescription": "Allow SSH access",
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "0.0.0.0/0"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": { "Value": { "Ref": "MyVPC" } },
    "PublicSubnetId": { "Value": { "Ref": "PublicSubnet" } },
    "PrivateSubnetId": { "Value": { "Ref": "PrivateSubnet" } },
    "SecurityGroupId": { "Value": { "Ref": "EC2SecurityGroup" } }
  }
}
```
