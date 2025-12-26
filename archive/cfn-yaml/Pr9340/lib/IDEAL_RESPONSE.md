# Ideal Response

This document contains all the infrastructure code and test files for this project.

## Infrastructure Code


### TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  A robust CloudFormation template that provisions a web application environment.
  LocalStack compatibility: Uses parameter for database password instead of Secrets Manager dynamic reference.
  WARNING: The default IP for SSH is 0.0.0.0/0. Please change this for production.

Metadata:
  cfn-lint:
    config:
      ignore_checks:
        - W1011  # LocalStack compatibility: Using parameter for password instead of Secrets Manager

Parameters:
  EnvironmentName:
    Type: String
    Description: "An environment identifier (e.g., dev, qa, prod)."
    Default: dev
  OwnerName:
    Type: String
    Description: "The name of the resource owner."
    Default: TechTeam
  ProjectName:
    Type: String
    Description: "The name of the project."
    Default: WebAppProject

  # No default value is provided for the KeyPair for security reasons.
  # This ensures you consciously select a key that you own.
  WebAppServerKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: "Name of an existing EC2 KeyPair to enable SSH access to the instance."
    Default: iac-rlhf-aws-trainer-instance

  DBMasterUsername:
    Type: String
    Description: "Username for the RDS master user. Use only letters and numbers."
    Default: "dbadmin"

  DBMasterPassword:
    Type: String
    Description: "Password for the RDS master user (min 8 characters)."
    NoEcho: true
    MinLength: 8
    Default: "TempPassword123!"

  MyIpAddress:
    Type: String
    Description: "Your IP in CIDR notation (e.g., 203.0.113.5/32) for secure SSH access."
    Default: "0.0.0.0/0" # WARNING: Insecure. Allows SSH from anywhere.

  WebAppAssetsBucketName:
    Type: String
    Description: "Globally unique, all-lowercase S3 bucket name for static assets (must be lowercase, no uppercase allowed)"
    Default: "webapp-assets-s3-bucket-name-east-1" # <-- Change this to a unique, lowercase value per deployment

Resources:
  WebAppAssets:
    Type: AWS::S3::Bucket
    Properties:
      # CloudFormation does not support Fn::ToLower, so use a parameter for lowercase bucket name.
      BucketName: !Ref WebAppAssetsBucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

  # -- Security Groups --
  WebAppServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Enable HTTP and SSH access for the web application server"
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref MyIpAddress
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

  WebAppDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Allow database access from the web server security group"
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !GetAtt WebAppServerSecurityGroup.GroupId
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

  # -- EC2 Instance --
  WebAppServer:
    Type: AWS::EC2::Instance
    Properties:
      # FIXED: Changed instance type from t3.micro to t2.micro to meet compliance.
      InstanceType: t2.micro
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      KeyName: !Ref WebAppServerKeyName
      SecurityGroupIds:
        - !GetAtt WebAppServerSecurityGroup.GroupId
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName
        - Key: Name
          Value: !Sub '${ProjectName}-WebAppServer-${EnvironmentName}'

  # -- RDS Database --
  WebAppDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.37'
      AllocatedStorage: '20'
      StorageType: gp2
      # FIXED: Set MultiAZ to true to ensure high availability and meet compliance.
      MultiAZ: true
      DBName: !Sub '${ProjectName}${EnvironmentName}DB'
      MasterUsername: !Ref DBMasterUsername
      # LocalStack compatibility: Use parameter instead of Secrets Manager dynamic reference
      # Original: '{{resolve:secretsmanager:MyProdDbCredentials:SecretString:password}}'
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !GetAtt WebAppDatabaseSecurityGroup.GroupId
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref OwnerName
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  WebAppServerId:
    Description: "Instance ID of the Web Application Server"
    Value: !Ref WebAppServer
    Export:
      Name: !Sub "${AWS::StackName}-WebAppServerId"

  WebAppServerPublicIp:
    Description: "Public IP address of the Web Application Server"
    Value: !GetAtt WebAppServer.PublicIp
    Export:
      Name: !Sub "${AWS::StackName}-WebAppServerPublicIp"

  WebAppAssetsBucketName:
    Description: "Name of the S3 bucket for static assets"
    Value: !Ref WebAppAssets
    Export:
      Name: !Sub "${AWS::StackName}-WebAppAssetsBucketName"

  WebAppDatabaseEndpoint:
    Description: "Endpoint address for the RDS database"
    Value: !GetAtt WebAppDatabase.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-WebAppDatabaseEndpoint"

  WebAppDatabasePort:
    Description: "Port for the RDS database"
    Value: !GetAtt WebAppDatabase.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-WebAppDatabasePort"```

### TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "A robust CloudFormation template that provisions a web application environment. LocalStack compatibility: Uses parameter for database password instead of Secrets Manager dynamic reference. WARNING: The default IP for SSH is 0.0.0.0/0. Please change this for production.\n",
    "Metadata": {
        "cfn-lint": {
            "config": {
                "ignore_checks": [
                    "W1011"
                ]
            }
        }
    },
    "Parameters": {
        "EnvironmentName": {
            "Type": "String",
            "Description": "An environment identifier (e.g., dev, qa, prod).",
            "Default": "dev"
        },
        "OwnerName": {
            "Type": "String",
            "Description": "The name of the resource owner.",
            "Default": "TechTeam"
        },
        "ProjectName": {
            "Type": "String",
            "Description": "The name of the project.",
            "Default": "WebAppProject"
        },
        "WebAppServerKeyName": {
            "Type": "AWS::EC2::KeyPair::KeyName",
            "Description": "Name of an existing EC2 KeyPair to enable SSH access to the instance.",
            "Default": "iac-rlhf-aws-trainer-instance"
        },
        "DBMasterUsername": {
            "Type": "String",
            "Description": "Username for the RDS master user. Use only letters and numbers.",
            "Default": "dbadmin"
        },
        "DBMasterPassword": {
            "Type": "String",
            "Description": "Password for the RDS master user (min 8 characters).",
            "NoEcho": true,
            "MinLength": 8,
            "Default": "TempPassword123!"
        },
        "MyIpAddress": {
            "Type": "String",
            "Description": "Your IP in CIDR notation (e.g., 203.0.113.5/32) for secure SSH access.",
            "Default": "0.0.0.0/0"
        },
        "WebAppAssetsBucketName": {
            "Type": "String",
            "Description": "Globally unique, all-lowercase S3 bucket name for static assets (must be lowercase, no uppercase allowed)",
            "Default": "webapp-assets-s3-bucket-name-east-1"
        }
    },
    "Resources": {
        "WebAppAssets": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Ref": "WebAppAssetsBucketName"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms"
                            }
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "BlockPublicPolicy": true,
                    "IgnorePublicAcls": true,
                    "RestrictPublicBuckets": true
                },
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentName"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": {
                            "Ref": "OwnerName"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "WebAppServerSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "Enable HTTP and SSH access for the web application server",
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 80,
                        "ToPort": 80,
                        "CidrIp": "0.0.0.0/0"
                    },
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 22,
                        "ToPort": 22,
                        "CidrIp": {
                            "Ref": "MyIpAddress"
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentName"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": {
                            "Ref": "OwnerName"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "WebAppDatabaseSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "Allow database access from the web server security group",
                "SecurityGroupIngress": [
                    {
                        "IpProtocol": "tcp",
                        "FromPort": 3306,
                        "ToPort": 3306,
                        "SourceSecurityGroupId": {
                            "Fn::GetAtt": [
                                "WebAppServerSecurityGroup",
                                "GroupId"
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentName"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": {
                            "Ref": "OwnerName"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        },
        "WebAppServer": {
            "Type": "AWS::EC2::Instance",
            "Properties": {
                "InstanceType": "t2.micro",
                "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
                "KeyName": {
                    "Ref": "WebAppServerKeyName"
                },
                "SecurityGroupIds": [
                    {
                        "Fn::GetAtt": [
                            "WebAppServerSecurityGroup",
                            "GroupId"
                        ]
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentName"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": {
                            "Ref": "OwnerName"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    },
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${ProjectName}-WebAppServer-${EnvironmentName}"
                        }
                    }
                ]
            }
        },
        "WebAppDatabase": {
            "Type": "AWS::RDS::DBInstance",
            "Properties": {
                "DBInstanceClass": "db.t3.micro",
                "Engine": "mysql",
                "EngineVersion": "8.0.37",
                "AllocatedStorage": "20",
                "StorageType": "gp2",
                "MultiAZ": true,
                "DBName": {
                    "Fn::Sub": "${ProjectName}${EnvironmentName}DB"
                },
                "MasterUsername": {
                    "Ref": "DBMasterUsername"
                },
                "MasterUserPassword": {
                    "Ref": "DBMasterPassword"
                },
                "VPCSecurityGroups": [
                    {
                        "Fn::GetAtt": [
                            "WebAppDatabaseSecurityGroup",
                            "GroupId"
                        ]
                    }
                ],
                "PubliclyAccessible": false,
                "DeletionProtection": true,
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentName"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": {
                            "Ref": "OwnerName"
                        }
                    },
                    {
                        "Key": "Project",
                        "Value": {
                            "Ref": "ProjectName"
                        }
                    }
                ]
            }
        }
    },
    "Outputs": {
        "WebAppServerId": {
            "Description": "Instance ID of the Web Application Server",
            "Value": {
                "Ref": "WebAppServer"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebAppServerId"
                }
            }
        },
        "WebAppServerPublicIp": {
            "Description": "Public IP address of the Web Application Server",
            "Value": {
                "Fn::GetAtt": [
                    "WebAppServer",
                    "PublicIp"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebAppServerPublicIp"
                }
            }
        },
        "WebAppAssetsBucketName": {
            "Description": "Name of the S3 bucket for static assets",
            "Value": {
                "Ref": "WebAppAssets"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebAppAssetsBucketName"
                }
            }
        },
        "WebAppDatabaseEndpoint": {
            "Description": "Endpoint address for the RDS database",
            "Value": {
                "Fn::GetAtt": [
                    "WebAppDatabase",
                    "Endpoint.Address"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebAppDatabaseEndpoint"
                }
            }
        },
        "WebAppDatabasePort": {
            "Description": "Port for the RDS database",
            "Value": {
                "Fn::GetAtt": [
                    "WebAppDatabase",
                    "Endpoint.Port"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-WebAppDatabasePort"
                }
            }
        }
    }
}```

## Test Files

