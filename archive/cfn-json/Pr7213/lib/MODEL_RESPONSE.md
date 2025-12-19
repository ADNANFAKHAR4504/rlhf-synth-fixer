# MODEL RESPONSE - Initial Generated Code

This document contains the initial infrastructure code generated for the EC2 Auto Scaling infrastructure with hybrid node groups.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "EC2 Auto Scaling Groups Infrastructure with Hybrid Node Group Architecture",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 1
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "eks-vpc-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-1"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-2"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "private-subnet-3"
          }
        ]
      }
    },
    "ClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS cluster",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.0.0/16"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "cluster-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for EKS envelope encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        }
      }
    },
    "ClusterRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "eks-cluster-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "eks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
          "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        ]
      }
    },
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": { "Fn::Sub": "eks-cluster-${EnvironmentSuffix}" },
        "Version": "1.28",
        "RoleArn": { "Fn::GetAtt": ["ClusterRole", "Arn"] },
        "ResourcesVpcConfig": {
          "SecurityGroupIds": [{ "Ref": "ClusterSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1" },
            { "Ref": "PrivateSubnet2" },
            { "Ref": "PrivateSubnet3" }
          ],
          "EndpointPrivateAccess": true,
          "EndpointPublicAccess": false
        },
        "EncryptionConfig": [
          {
            "Resources": ["secrets"],
            "Provider": {
              "KeyArn": { "Fn::GetAtt": ["EncryptionKey", "Arn"] }
            }
          }
        ],
        "Logging": {
          "ClusterLogging": {
            "EnabledTypes": [
              { "Type": "api" },
              { "Type": "audit" },
              { "Type": "controllerManager" }
            ]
          }
        }
      }
    },
    "NodeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "eks-node-role-${EnvironmentSuffix}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
          "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        ]
      }
    },
    "ManagedNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "Properties": {
        "ClusterName": { "Ref": "EKSCluster" },
        "NodegroupName": { "Fn::Sub": "managed-nodes-${EnvironmentSuffix}" },
        "NodeRole": { "Fn::GetAtt": ["NodeRole", "Arn"] },
        "Subnets": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" },
          { "Ref": "PrivateSubnet3" }
        ],
        "ScalingConfig": {
          "MinSize": 2,
          "MaxSize": 6,
          "DesiredSize": 2
        },
        "InstanceTypes": ["t3.medium"],
        "AmiType": "AL2_x86_64"
      }
    },
    "SelfManagedLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "self-managed-lt-${EnvironmentSuffix}" },
        "LaunchTemplateData": {
          "InstanceType": "m5.large",
          "ImageId": "ami-0c55b159cbfafe1f0",
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["NodeInstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "ClusterSecurityGroup" }],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ${EKSCluster}\n"
            }
          }
        }
      }
    },
    "NodeInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": { "Fn::Sub": "eks-node-profile-${EnvironmentSuffix}" },
        "Roles": [{ "Ref": "NodeRole" }]
      }
    },
    "SelfManagedAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "self-managed-asg-${EnvironmentSuffix}" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "SelfManagedLaunchTemplate" },
          "Version": { "Fn::GetAtt": ["SelfManagedLaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": "1",
        "MaxSize": "3",
        "DesiredCapacity": "1",
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" },
          { "Ref": "PrivateSubnet3" }
        ]
      }
    }
  },
  "Outputs": {
    "ClusterName": {
      "Description": "Name of the EKS cluster",
      "Value": { "Ref": "EKSCluster" }
    },
    "ClusterEndpoint": {
      "Description": "Endpoint for EKS cluster",
      "Value": { "Fn::GetAtt": ["EKSCluster", "Endpoint"] }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" }
    }
  }
}
```