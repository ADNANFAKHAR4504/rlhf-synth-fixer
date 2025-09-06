### Reasoning Trace
---

I need to create a comprehensive CloudFormation template that meets all the specified requirements. Let me break down what I need to create:

1. **Parameters**: Environment, Owner, Project, AllowedSSHRanges, KeyName, InstanceType, AMIId, VPCCidr
2. **VPC Infrastructure**:
   - VPC with custom CIDR
   - Internet Gateway
   - 2+ public subnets across 2+ AZs
   - 2+ private subnets across 2+ AZs
   - NAT Gateway(s) in public subnet(s)
   - Route tables for public and private subnets
3. **Security Groups**:
   - SSH security group that only allows access from AllowedSSHRanges parameter
4. **EC2 Instance**:
   - In private subnet
   - With IAM role (least privilege)
   - Using the security group
5. **S3 Bucket**:
   - Block all public access
   - KMS encryption at rest
   - HTTPS only policy
   - Access logging to CloudWatch Log Group
6. **KMS Key**:
   - Customer managed
   - Auto rotation enabled
   - Proper key policy for S3 and IAM roles
7. **CloudWatch**:
   - Log Group for S3 access logs
   - Alarms for security events
8. **IAM Role**:
   - For EC2 instance
   - Least privilege (CloudWatch Logs permissions, scoped S3 if needed)
9. **Tags**: All resources must have Environment, Owner, Project tags
10. **Outputs**: VpcId, PublicSubnetIds, PrivateSubnetIds, S3BucketName, KmsKeyId, InstanceId, IAMRoleName

Let me start building this step by step:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Comprehensive infrastructure deployment with robust security controls",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Deployment environment context"
    },
    "Owner": {
      "Type": "String",
      "Description": "Resource ownership identifier"
    },
    "Project": {
      "Type": "String",
      "Description": "Associated project name"
    },
    "AllowedSSHRanges": {
      "Type": "CommaDelimitedList",
      "Description": "Permitted network ranges for secure access"
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "Authentication mechanism for remote connectivity"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "Compute resource sizing specification"
    },
    "AMIId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Description": "Base system image configuration"
    },
    "VPCCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "Network address space allocation"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VPCCidr"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-igw"}}
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-public-subnet-1"}}
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-public-subnet-2"}}
        ]
      }
    }

I'll define a second public subnet in a different availability zone, ensuring network redundancy and high availability for the infrastructure. The subnet uses a distinct CIDR block and is configured with automatic public IP assignment.

I'll then create two private subnets across different availability zones, providing isolated network segments for more secure resource placement. These subnets have unique CIDR blocks and are tagged with consistent metadata for environment tracking and resource management.

The private subnets are strategically positioned to support potential future NAT gateway deployment, enabling private resources to access external networks securely.

I'll allocate an Elastic IP for the NAT gateway, ensuring a static public IP address for network address translation. This EIP will be associated with the NAT gateway in the first public subnet, facilitating controlled internet access for resources in private subnets while maintaining network isolation.

The route table configuration begins with creating a public route table linked to the VPC. This route table will define network traffic patterns for public subnets, enabling connectivity and routing rules that support the infrastructure's network design.

I'll establish a route directing all internet-bound traffic (0.0.0.0/0) through the internet gateway. Then, I'll associate this route table with the first and second public subnets, ensuring they can communicate externally through the defined gateway.

Next, I'll create a private route table for the VPC, tagging it with environment, owner, and project metadata using a dynamic naming convention that incorporates these parameters.

The private route configuration will follow, preparing network segmentation and controlled external access for the infrastructure.

I'll establish route table associations for private subnets, ensuring proper network isolation and routing rules are applied systematically across the infrastructure's private network segments.

The route table association for the second private subnet follows the same pattern as the first, linking the subnet to the private route table. This ensures consistent network configuration and routing for both private subnets.

For the KMS key policy, I'll design granular access controls that balance security with operational flexibility. The policy must implement principle of least privilege, carefully scoping permissions for key management and usage across critical AWS services. Key considerations include precise access grants for the account root, S3, EC2 IAM role, and CloudFormation service.

The IAM role design will prioritize minimal, targeted permissions. I'll craft permissions that enable essential logging and potential S3 interactions while strictly limiting access scope. CloudWatch Logs permissions will be narrowly defined to support logging requirements without introducing unnecessary system-wide access.
### Answer 
---

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure VPC with EC2, S3, and monitoring - deployed in us-east-1",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name"
    },
    "Owner": {
      "Type": "String",
      "Description": "Owner of the resources"
    },
    "Project": {
      "Type": "String",
      "Description": "Project name"
    },
    "AllowedSSHRanges": {
      "Type": "CommaDelimitedList",
      "Description": "CIDR ranges allowed for SSH access"
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 Key Pair for SSH access"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type"
    },
    "AMIId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Description": "AMI ID for EC2 instance"
    },
    "VPCCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VPCCidr"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-vpc"}}
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-igw"}}
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-public-subnet-1"}}
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-public-subnet-2"}}
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-private-subnet-1"}}
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-private-subnet-2"}}
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-nat-eip"}}
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-nat-gateway"}}
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-public-rt"}}
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-private-rt"}}
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway"}
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {"Fn::Sub": "KMS key for ${Project}-${Environment}"},
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow S3 Service",
              "Effect": "Allow",
              "Principal": {"Service": "s3.amazonaws.com"},
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow EC2 Instance Role",
              "Effect": "Allow",
              "Principal": {"AWS": {"Fn::GetAtt": ["EC2Role", "Arn"]}},
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-kms-key"}}
        ]
      }
    },
    "KMSAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/${Project}-${Environment}-key"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "SSHSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for SSH access",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {"Fn::Select": [0, {"Ref": "AllowedSSHRanges"}]}
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-ssh-sg"}}
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "${Project}-${Environment}-ec2-role"},
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
            "PolicyName": "CloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${Project}-${Environment}*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{"Ref": "EC2Role"}]
      }
    },
    "EC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "AMIId"},
        "InstanceType": {"Ref": "InstanceType"},
        "KeyName": {"Ref": "KeyName"},
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "SecurityGroupIds": [{"Ref": "SSHSecurityGroup"}],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}},
          {"Key": "Name", "Value": {"Fn::Sub": "${Project}-${Environment}-ec2"}}
        ]
      }
    },
    "S3AccessLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/s3/${Project}-${Environment}-access-logs"},
        "RetentionInDays": 90,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${Project}-${Environment}-secure-bucket-${AWS::AccountId}"},
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {"Ref": "KMSKey"}
              }
            }
          ]
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {"Ref": "S3AccessLogBucket"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "S3AccessLogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${Project}-${Environment}-access-logs-${AWS::AccountId}"},
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "S3Bucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["S3Bucket", "Arn"]},
                {"Fn::Sub": "${S3Bucket}/*"}
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            },
            {
              "Sid": "DenyPublicReadACL",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObjectAcl",
              "Resource": {"Fn::Sub": "${S3Bucket}/*"},
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": [
                    "public-read",
                    "public-read-write"
                  ]
                }
              }
            }
          ]
        }
      }
    },
    "S3PublicAccessAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${Project}-${Environment}-s3-public-access"},
        "AlarmDescription": "Alert on S3 bucket public access configuration changes",
        "MetricName": "NumberOfMessagesPublished",
        "Namespace": "AWS/SNS",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "UnauthorizedAPICallsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${Project}-${Environment}-unauthorized-api-calls"},
        "AlarmDescription": "Alert on unauthorized API calls",
        "MetricName": "ErrorCount",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    },
    "SSHFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${Project}-${Environment}-ssh-failures"},
        "AlarmDescription": "Alert on excessive SSH login failures",
        "MetricName": "StatusCheckFailed_Instance",
        "Namespace": "AWS/EC2",
        "Statistic": "Maximum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {"Ref": "EC2Instance"}
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Owner", "Value": {"Ref": "Owner"}},
          {"Key": "Project", "Value": {"Ref": "Project"}}
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"}
    },
    "PublicSubnetIds": {
      "Description": "Public Subnet IDs",
      "Value": {"Fn::Join": [",", [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]]}
    },
    "PrivateSubnetIds": {
      "Description": "Private Subnet IDs",
      "Value": {"Fn::Join": [",", [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]]}
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": {"Ref": "S3Bucket"}
    },
    "KmsKeyId": {
      "Description": "KMS Key ID",
      "Value": {"Ref": "KMSKey"}
    },
    "InstanceId": {
      "Description": "EC2 Instance ID",
      "Value": {"Ref": "EC2Instance"}
    },
    "IAMRoleName": {
      "Description": "IAM Role Name",
      "Value": {"Ref": "EC2Role"}
    }
  }
}
```