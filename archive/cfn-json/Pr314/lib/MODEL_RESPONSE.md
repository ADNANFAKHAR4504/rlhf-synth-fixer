```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Modular CloudFormation stack for secure web application infrastructure",
  "Parameters": {
    "ProjectName": {"Type": "String"},
    "Environment": {"Type": "String"},
    "InstanceType": {"Type": "String", "Default": "t2.micro"},
    "AllowedIP": {"Type": "String", "Description": "CIDR block for SSH access"}
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "Tags": [
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": "cloud-team"}
        ]
      }
    },
    "AppS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${ProjectName}-${Environment}-app-bucket"},
        "VersioningConfiguration": {"Status": "Enabled"},
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": "cloud-team"}
        ]
      }
    },
    "AppSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Allow SSH and HTTP",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": "22",
            "ToPort": "22",
            "CidrIp": {"Ref": "AllowedIP"}
          },
          {
            "IpProtocol": "tcp",
            "FromPort": "80",
            "ToPort": "80",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectName}-${Environment}-sg"}}
        ]
      }
    },
    "AppInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "ec2.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3ReadOnly",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject"],
                  "Resource": {"Fn::Sub": "arn:aws:s3::::${ProjectName}-${Environment}-app-bucket/*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    "AppInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{"Ref": "AppInstanceRole"}]
      }
    },
    "AppInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {"Ref": "InstanceType"},
        "ImageId": "ami-0abcdef1234567890",
        "KeyName": "my-key-pair",
        "IamInstanceProfile": {"Ref": "AppInstanceProfile"},
        "NetworkInterfaces": [
          {
            "SubnetId": {"Ref": "PublicSubnet"},
            "GroupSet": [{"Ref": "AppSecurityGroup"}],
            "AssociatePublicIpAddress": true,
            "DeviceIndex": "0"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectName}-${Environment}-ec2"}}
        ]
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "Properties": {
        "IsLogging": true,
        "S3BucketName": {"Fn::Sub": "${ProjectName}-${Environment}-cloudtrail-logs"},
        "EnableLogFileValidation": true
      }
    }
  },
  "Outputs": {
    "VPCID": {"Value": {"Ref": "VPC"}},
    "BucketName": {"Value": {"Fn::Sub": "${ProjectName}-${Environment}-app-bucket"}}
  }
}
```