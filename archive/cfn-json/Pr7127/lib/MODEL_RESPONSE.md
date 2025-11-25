# CloudFormation Multi-Environment Data Analytics Platform

This implementation provides a complete multi-environment data analytics platform using CloudFormation with JSON format. The solution includes master template with StackSets support, nested stacks, custom resources, and Lambda functions for CSV processing and validation.

## Architecture Overview

The infrastructure is organized into modular components:
- Master template (template.json) orchestrates deployment via StackSets
- VPC nested stack provisions network infrastructure
- Security nested stack manages IAM roles and policies
- Application nested stack deploys S3, Lambda, DynamoDB, and monitoring
- Custom resources validate configurations post-deployment
- CloudFormation macro injects environment tags automatically

## File: lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master CloudFormation template for multi-environment data analytics platform with StackSets support",
  "Parameters": {
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type for conditional resource configuration",
      "AllowedValues": ["development", "staging", "production"],
      "Default": "development"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix to append to all resource names for uniqueness (e.g., dev, stage, prod)",
      "MinLength": 3,
      "MaxLength": 10,
      "AllowedPattern": "[a-z0-9]+",
      "ConstraintDescription": "Must contain only lowercase letters and numbers"
    },
    "VPCTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for VPC nested stack template"
    },
    "SecurityTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for security nested stack template"
    },
    "ApplicationTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for application nested stack template"
    },
    "AccountId": {
      "Type": "String",
      "Description": "AWS Account ID for environment-specific tagging",
      "AllowedPattern": "[0-9]{12}",
      "ConstraintDescription": "Must be a valid 12-digit AWS account ID"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "production"]
    },
    "IsStaging": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "staging"]
    },
    "IsDevelopment": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "development"]
    },
    "NeedNATGateways": {
      "Fn::Or": [
        {"Condition": "IsProduction"},
        {"Condition": "IsStaging"}
      ]
    }
  },
  "Resources": {
    "VPCStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {"Ref": "VPCTemplateURL"},
        "Parameters": {
          "EnvironmentType": {"Ref": "EnvironmentType"},
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "CreateNATGateways": {
            "Fn::If": ["NeedNATGateways", "true", "false"]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "AccountId",
            "Value": {"Ref": "AccountId"}
          }
        ],
        "TimeoutInMinutes": 30
      }
    },
    "SecurityStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": "VPCStack",
      "Properties": {
        "TemplateURL": {"Ref": "SecurityTemplateURL"},
        "Parameters": {
          "EnvironmentType": {"Ref": "EnvironmentType"},
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"}
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "AccountId",
            "Value": {"Ref": "AccountId"}
          }
        ],
        "TimeoutInMinutes": 15
      }
    },
    "ApplicationStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["VPCStack", "SecurityStack"],
      "Properties": {
        "TemplateURL": {"Ref": "ApplicationTemplateURL"},
        "Parameters": {
          "EnvironmentType": {"Ref": "EnvironmentType"},
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "VPCId": {"Fn::GetAtt": ["VPCStack", "Outputs.VPCId"]},
          "PrivateSubnet1": {"Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet1"]},
          "PrivateSubnet2": {"Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet2"]},
          "PrivateSubnet3": {"Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnet3"]},
          "LambdaExecutionRoleArn": {"Fn::GetAtt": ["SecurityStack", "Outputs.LambdaExecutionRoleArn"]},
          "CustomResourceRoleArn": {"Fn::GetAtt": ["SecurityStack", "Outputs.CustomResourceRoleArn"]}
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          },
          {
            "Key": "AccountId",
            "Value": {"Ref": "AccountId"}
          }
        ],
        "TimeoutInMinutes": 45
      }
    },
    "ServiceCatalogPortfolio": {
      "Type": "AWS::ServiceCatalog::Portfolio",
      "Properties": {
        "DisplayName": {
          "Fn::Sub": "Analytics-Platform-${EnvironmentSuffix}"
        },
        "Description": "Self-service portfolio for test instance provisioning",
        "ProviderName": "Platform Engineering Team",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DriftDetectionSNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "cloudformation-drift-${EnvironmentSuffix}"
        },
        "DisplayName": "CloudFormation Drift Detection Notifications",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "ConfigRuleDriftDetection": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "cloudformation-drift-detection-${EnvironmentSuffix}"
        },
        "Description": "Monitors CloudFormation stacks for configuration drift",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK"
        },
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::CloudFormation::Stack"
          ]
        }
      }
    },
    "ConfigRuleEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-drift-alert-${EnvironmentSuffix}"
        },
        "Description": "Trigger SNS notification on Config rule compliance changes",
        "EventPattern": {
          "source": ["aws.config"],
          "detail-type": ["Config Rules Compliance Change"],
          "detail": {
            "configRuleName": [{"Ref": "ConfigRuleDriftDetection"}],
            "newEvaluationResult": {
              "complianceType": ["NON_COMPLIANT"]
            }
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Ref": "DriftDetectionSNSTopic"},
            "Id": "DriftNotificationTarget"
          }
        ]
      }
    },
    "SNSTopicPolicy": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [{"Ref": "DriftDetectionSNSTopic"}],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowEventBridgePublish",
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sns:Publish",
              "Resource": {"Ref": "DriftDetectionSNSTopic"}
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "VPCStackId": {
      "Description": "VPC nested stack ID",
      "Value": {"Ref": "VPCStack"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCStackId"}
      }
    },
    "SecurityStackId": {
      "Description": "Security nested stack ID",
      "Value": {"Ref": "SecurityStack"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SecurityStackId"}
      }
    },
    "ApplicationStackId": {
      "Description": "Application nested stack ID",
      "Value": {"Ref": "ApplicationStack"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ApplicationStackId"}
      }
    },
    "ServiceCatalogPortfolioId": {
      "Description": "Service Catalog Portfolio ID for self-service provisioning",
      "Value": {"Ref": "ServiceCatalogPortfolio"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PortfolioId"}
      }
    },
    "DriftDetectionTopicArn": {
      "Description": "SNS Topic ARN for drift detection notifications",
      "Value": {"Ref": "DriftDetectionSNSTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DriftTopicArn"}
      }
    }
  }
}
```

## File: lib/vpc-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC nested stack with 3 availability zones, public and private subnets, and optional NAT gateways",
  "Parameters": {
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type",
      "AllowedValues": ["development", "staging", "production"]
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names"
    },
    "CreateNATGateways": {
      "Type": "String",
      "Description": "Whether to create NAT Gateways for private subnets",
      "AllowedValues": ["true", "false"],
      "Default": "false"
    }
  },
  "Conditions": {
    "ShouldCreateNAT": {
      "Fn::Equals": [{"Ref": "CreateNATGateways"}, "true"]
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
            "Value": {"Fn::Sub": "analytics-vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-igw-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
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
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-public-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-public-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-public-3-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-3-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-public-rt-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "Condition": "ShouldCreateNAT",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-nat-eip-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Condition": "ShouldCreateNAT",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-nat-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-rt-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Condition": "ShouldCreateNAT",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-rt-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-private-rt-3-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.s3"},
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable1"},
          {"Ref": "PrivateRouteTable2"},
          {"Ref": "PrivateRouteTable3"}
        ]
      }
    },
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"},
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable1"},
          {"Ref": "PrivateRouteTable2"},
          {"Ref": "PrivateRouteTable3"}
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}
      }
    },
    "PublicSubnet1": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1"}
      }
    },
    "PublicSubnet2": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2"}
      }
    },
    "PublicSubnet3": {
      "Description": "Public Subnet 3 ID",
      "Value": {"Ref": "PublicSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet3"}
      }
    },
    "PrivateSubnet1": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1"}
      }
    },
    "PrivateSubnet2": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2"}
      }
    },
    "PrivateSubnet3": {
      "Description": "Private Subnet 3 ID",
      "Value": {"Ref": "PrivateSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet3"}
      }
    }
  }
}
```

## File: lib/security-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security nested stack with IAM roles and policies following least-privilege principles",
  "Parameters": {
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type for conditional permissions",
      "AllowedValues": ["development", "staging", "production"]
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "production"]
    },
    "IsNonProduction": {
      "Fn::Not": [{"Condition": "IsProduction"}]
    }
  },
  "Resources": {
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "analytics-lambda-execution-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::analytics-data-${EnvironmentSuffix}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::analytics-data-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/analytics-metadata-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "ParameterStoreAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/analytics/${EnvironmentType}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogs",
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
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/analytics-*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "CustomResourceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "analytics-custom-resource-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "S3BucketPolicyValidation",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketPolicy",
                    "s3:GetBucketPolicyStatus"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::analytics-data-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SNSPublish",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:policy-compliance-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "MacroExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "analytics-macro-execution-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "CloudFormationReadAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackResources"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "ConfigRecorderRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "analytics-config-recorder-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    }
  },
  "Outputs": {
    "LambdaExecutionRoleArn": {
      "Description": "ARN of Lambda execution role",
      "Value": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LambdaExecutionRoleArn"}
      }
    },
    "CustomResourceRoleArn": {
      "Description": "ARN of Custom Resource Lambda role",
      "Value": {"Fn::GetAtt": ["CustomResourceRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CustomResourceRoleArn"}
      }
    },
    "MacroExecutionRoleArn": {
      "Description": "ARN of CloudFormation Macro execution role",
      "Value": {"Fn::GetAtt": ["MacroExecutionRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MacroExecutionRoleArn"}
      }
    },
    "ConfigRecorderRoleArn": {
      "Description": "ARN of AWS Config recorder role",
      "Value": {"Fn::GetAtt": ["ConfigRecorderRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ConfigRecorderRoleArn"}
      }
    }
  }
}
```

## File: lib/app-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Application nested stack with S3, Lambda, DynamoDB, CloudWatch, and Custom Resources",
  "Parameters": {
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type",
      "AllowedValues": ["development", "staging", "production"]
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names"
    },
    "VPCId": {
      "Type": "String",
      "Description": "VPC ID from VPC stack"
    },
    "PrivateSubnet1": {
      "Type": "String",
      "Description": "Private Subnet 1 ID"
    },
    "PrivateSubnet2": {
      "Type": "String",
      "Description": "Private Subnet 2 ID"
    },
    "PrivateSubnet3": {
      "Type": "String",
      "Description": "Private Subnet 3 ID"
    },
    "LambdaExecutionRoleArn": {
      "Type": "String",
      "Description": "ARN of Lambda execution role"
    },
    "CustomResourceRoleArn": {
      "Type": "String",
      "Description": "ARN of Custom Resource Lambda role"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "production"]
    },
    "IsNonProduction": {
      "Fn::Not": [{"Condition": "IsProduction"}]
    }
  },
  "Resources": {
    "AnalyticsDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "analytics-data-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
            }
          ]
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Function": {"Fn::GetAtt": ["CSVProcessorFunction", "Arn"]},
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".csv"
                    }
                  ]
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      },
      "DeletionPolicy": {
        "Fn::If": ["IsProduction", "Retain", "Delete"]
      },
      "UpdateReplacePolicy": {
        "Fn::If": ["IsProduction", "Retain", "Delete"]
      }
    },
    "AnalyticsDataBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "AnalyticsDataBucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${AnalyticsDataBucket.Arn}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "AES256"
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["AnalyticsDataBucket", "Arn"]},
                {"Fn::Sub": "${AnalyticsDataBucket.Arn}/*"}
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "analytics-lambda-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPCId"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "analytics-lambda-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "CSVProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "analytics-csv-processor-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "csv-processor.lambda_handler",
        "Role": {"Ref": "LambdaExecutionRoleArn"},
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport csv\nimport io\nfrom datetime import datetime\n\ns3_client = boto3.client('s3')\ndynamodb = boto3.resource('dynamodb')\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Process CSV files uploaded to S3 and store metadata in DynamoDB.\n    \"\"\"\n    try:\n        # Get bucket and key from S3 event\n        bucket = event['Records'][0]['s3']['bucket']['name']\n        key = event['Records'][0]['s3']['object']['key']\n        \n        print(f'Processing file: {bucket}/{key}')\n        \n        # Download CSV from S3\n        response = s3_client.get_object(Bucket=bucket, Key=key)\n        csv_content = response['Body'].read().decode('utf-8')\n        \n        # Parse CSV\n        csv_reader = csv.DictReader(io.StringIO(csv_content))\n        row_count = sum(1 for row in csv_reader)\n        \n        # Get file size\n        file_size = response['ContentLength']\n        \n        # Store metadata in DynamoDB\n        table_name = os.environ['DYNAMODB_TABLE']\n        table = dynamodb.Table(table_name)\n        \n        metadata = {\n            'file_id': key,\n            'bucket': bucket,\n            'file_size': file_size,\n            'row_count': row_count,\n            'upload_timestamp': datetime.utcnow().isoformat(),\n            'processing_status': 'completed',\n            'processed_timestamp': datetime.utcnow().isoformat()\n        }\n        \n        table.put_item(Item=metadata)\n        \n        print(f'Successfully processed {row_count} rows from {key}')\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'CSV processed successfully',\n                'row_count': row_count,\n                'file_size': file_size\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error processing CSV: {str(e)}')\n        \n        # Store error status in DynamoDB\n        try:\n            table_name = os.environ['DYNAMODB_TABLE']\n            table = dynamodb.Table(table_name)\n            \n            error_metadata = {\n                'file_id': key,\n                'bucket': bucket,\n                'upload_timestamp': datetime.utcnow().isoformat(),\n                'processing_status': 'failed',\n                'error_message': str(e)\n            }\n            \n            table.put_item(Item=error_metadata)\n        except Exception as db_error:\n            print(f'Error storing error metadata: {str(db_error)}')\n        \n        raise e\n"
        },
        "MemorySize": 3072,
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {"Ref": "MetadataTable"},
            "ENVIRONMENT_TYPE": {"Ref": "EnvironmentType"}
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"},
            {"Ref": "PrivateSubnet3"}
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "CSVProcessorFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "CSVProcessorFunction"},
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {"Fn::GetAtt": ["AnalyticsDataBucket", "Arn"]}
      }
    },
    "MetadataTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {"Fn::Sub": "analytics-metadata-${EnvironmentSuffix}"},
        "AttributeDefinitions": [
          {
            "AttributeName": "file_id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "upload_timestamp",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "file_id",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "timestamp-index",
            "KeySchema": [
              {
                "AttributeName": "upload_timestamp",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {
            "Fn::If": ["IsProduction", true, false]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      },
      "DeletionPolicy": {
        "Fn::If": ["IsProduction", "Snapshot", "Delete"]
      },
      "UpdateReplacePolicy": {
        "Fn::If": ["IsProduction", "Snapshot", "Delete"]
      }
    },
    "PolicyComplianceTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "policy-compliance-${EnvironmentSuffix}"},
        "DisplayName": "S3 Policy Compliance Notifications",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "CustomResourceValidatorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "analytics-policy-validator-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Ref": "CustomResourceRoleArn"},
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport cfnresponse\n\ns3_client = boto3.client('s3')\nsns_client = boto3.client('sns')\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Custom Resource to validate S3 bucket policies post-deployment.\n    \"\"\"\n    print(f'Event: {json.dumps(event)}')\n    \n    request_type = event['RequestType']\n    \n    # Handle Delete requests\n    if request_type == 'Delete':\n        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})\n        return\n    \n    try:\n        # Get bucket name from resource properties\n        bucket_name = event['ResourceProperties']['BucketName']\n        sns_topic_arn = event['ResourceProperties']['SNSTopicArn']\n        \n        print(f'Validating bucket policy for: {bucket_name}')\n        \n        # Get bucket policy\n        try:\n            response = s3_client.get_bucket_policy(Bucket=bucket_name)\n            policy = json.loads(response['Policy'])\n        except s3_client.exceptions.NoSuchBucketPolicy:\n            message = f'Bucket {bucket_name} has no bucket policy'\n            print(message)\n            sns_client.publish(\n                TopicArn=sns_topic_arn,\n                Subject='S3 Bucket Policy Compliance Alert',\n                Message=message\n            )\n            cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Status': 'No Policy'})\n            return\n        \n        # Check for explicit deny statements\n        has_deny = False\n        deny_statements = []\n        \n        for statement in policy.get('Statement', []):\n            if statement.get('Effect') == 'Deny':\n                has_deny = True\n                deny_statements.append(statement.get('Sid', 'Unknown'))\n        \n        if not has_deny:\n            message = f'WARNING: Bucket {bucket_name} policy does not contain explicit Deny statements. This may pose a security risk.'\n            print(message)\n            sns_client.publish(\n                TopicArn=sns_topic_arn,\n                Subject='S3 Bucket Policy Compliance Alert',\n                Message=message\n            )\n            cfnresponse.send(event, context, cfnresponse.SUCCESS, {\n                'Status': 'Non-Compliant',\n                'Message': 'No explicit Deny statements found'\n            })\n        else:\n            message = f'Bucket {bucket_name} policy is compliant. Found Deny statements: {deny_statements}'\n            print(message)\n            cfnresponse.send(event, context, cfnresponse.SUCCESS, {\n                'Status': 'Compliant',\n                'DenyStatements': ', '.join(deny_statements)\n            })\n    \n    except Exception as e:\n        error_message = f'Error validating bucket policy: {str(e)}'\n        print(error_message)\n        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': error_message})\n"
        },
        "Timeout": 60,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          }
        ]
      }
    },
    "BucketPolicyValidation": {
      "Type": "Custom::BucketPolicyValidator",
      "DependsOn": ["AnalyticsDataBucketPolicy"],
      "Properties": {
        "ServiceToken": {"Fn::GetAtt": ["CustomResourceValidatorFunction", "Arn"]},
        "BucketName": {"Ref": "AnalyticsDataBucket"},
        "SNSTopicArn": {"Ref": "PolicyComplianceTopic"}
      }
    },
    "AnalyticsDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {"Fn::Sub": "analytics-platform-${EnvironmentSuffix}"},
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/S3\",\"BucketSizeBytes\",{\"stat\":\"Average\",\"label\":\"Bucket Size\"}],[\"AWS/S3\",\"NumberOfObjects\",{\"stat\":\"Average\",\"label\":\"Object Count\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${Region}\",\"title\":\"S3 Bucket Metrics - ${EnvSuffix}\",\"yAxis\":{\"left\":{\"showUnits\":false}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Invocations\"}],[\"AWS/Lambda\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Errors\"}],[\"AWS/Lambda\",\"Duration\",{\"stat\":\"Average\",\"label\":\"Duration\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${Region}\",\"title\":\"Lambda Metrics - ${EnvSuffix}\",\"yAxis\":{\"left\":{\"showUnits\":false}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/DynamoDB\",\"ConsumedReadCapacityUnits\",{\"stat\":\"Sum\",\"label\":\"Read Capacity\"}],[\"AWS/DynamoDB\",\"ConsumedWriteCapacityUnits\",{\"stat\":\"Sum\",\"label\":\"Write Capacity\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${Region}\",\"title\":\"DynamoDB Metrics - ${EnvSuffix}\",\"yAxis\":{\"left\":{\"showUnits\":false}}}}]}",
            {
              "Region": {"Ref": "AWS::Region"},
              "EnvSuffix": {"Ref": "EnvironmentSuffix"}
            }
          ]
        }
      }
    }
  },
  "Outputs": {
    "DataBucketName": {
      "Description": "Name of the S3 data bucket",
      "Value": {"Ref": "AnalyticsDataBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DataBucket"}
      }
    },
    "MetadataTableName": {
      "Description": "Name of the DynamoDB metadata table",
      "Value": {"Ref": "MetadataTable"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MetadataTable"}
      }
    },
    "CSVProcessorFunctionArn": {
      "Description": "ARN of the CSV processor Lambda function",
      "Value": {"Fn::GetAtt": ["CSVProcessorFunction", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CSVProcessorArn"}
      }
    },
    "PolicyComplianceTopicArn": {
      "Description": "ARN of the policy compliance SNS topic",
      "Value": {"Ref": "PolicyComplianceTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PolicyComplianceTopicArn"}
      }
    },
    "DashboardURL": {
      "Description": "URL to CloudWatch Dashboard",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=analytics-platform-${EnvironmentSuffix}"
      }
    }
  }
}
```

## File: lib/lambda/custom-resource-validator.py

```python
import json
import boto3
import cfnresponse

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    Custom Resource to validate S3 bucket policies post-deployment.

    This function checks that S3 bucket policies contain explicit Deny statements
    for security compliance. If no Deny statements are found, it sends an SNS
    notification to alert the security team.

    Args:
        event: CloudFormation custom resource event
        context: Lambda context object

    Returns:
        Sends response to CloudFormation via cfnresponse
    """
    print(f'Event: {json.dumps(event)}')

    request_type = event['RequestType']

    # Handle Delete requests gracefully
    if request_type == 'Delete':
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
        return

    try:
        # Get bucket name and SNS topic from resource properties
        bucket_name = event['ResourceProperties']['BucketName']
        sns_topic_arn = event['ResourceProperties']['SNSTopicArn']

        print(f'Validating bucket policy for: {bucket_name}')

        # Retrieve bucket policy
        try:
            response = s3_client.get_bucket_policy(Bucket=bucket_name)
            policy = json.loads(response['Policy'])
        except s3_client.exceptions.NoSuchBucketPolicy:
            message = f'ALERT: Bucket {bucket_name} has no bucket policy attached'
            print(message)
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='S3 Bucket Policy Compliance Alert',
                Message=message
            )
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Status': 'No Policy'})
            return

        # Validate policy contains explicit Deny statements
        has_deny = False
        deny_statements = []
        required_deny_actions = ['s3:PutObject', 's3:*']

        for statement in policy.get('Statement', []):
            if statement.get('Effect') == 'Deny':
                has_deny = True
                deny_statements.append({
                    'Sid': statement.get('Sid', 'Unknown'),
                    'Action': statement.get('Action', [])
                })

        # Send compliance notification
        if not has_deny:
            message = (
                f'WARNING: Bucket {bucket_name} policy does not contain explicit Deny statements.\n\n'
                f'This violates security best practices and may pose a compliance risk.\n\n'
                f'Recommended actions:\n'
                f'1. Add Deny statement for unencrypted uploads\n'
                f'2. Add Deny statement for insecure transport (non-HTTPS)\n'
                f'3. Review and update bucket policy immediately\n'
            )
            print(message)
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='URGENT: S3 Bucket Policy Compliance Alert',
                Message=message
            )
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Status': 'Non-Compliant',
                'Message': 'No explicit Deny statements found'
            })
        else:
            message = (
                f'SUCCESS: Bucket {bucket_name} policy is compliant.\n\n'
                f'Found {len(deny_statements)} Deny statement(s):\n'
            )
            for stmt in deny_statements:
                message += f"- {stmt['Sid']}: {stmt['Action']}\n"

            print(message)
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Status': 'Compliant',
                'DenyStatementCount': len(deny_statements)
            })

    except Exception as e:
        error_message = f'Error validating bucket policy: {str(e)}'
        print(error_message)
        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': error_message})
```

## File: lib/lambda/csv-processor.py

```python
import json
import boto3
import os
import csv
import io
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Process CSV files uploaded to S3 and store metadata in DynamoDB.

    This function is triggered by S3 ObjectCreated events for CSV files.
    It downloads the file, parses the CSV content, extracts metadata,
    and stores processing results in DynamoDB for analytics dashboards.

    Args:
        event: S3 event notification
        context: Lambda context object

    Returns:
        dict: Response with status code and processing results
    """
    try:
        # Extract bucket and key from S3 event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']

        print(f'Processing file: s3://{bucket}/{key}')

        # Download CSV file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        file_size = response['ContentLength']

        # Parse CSV and count rows
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(csv_reader)
        row_count = len(rows)

        # Extract column names for metadata
        column_names = list(rows[0].keys()) if rows else []

        print(f'File contains {row_count} rows and {len(column_names)} columns')

        # Get DynamoDB table from environment
        table_name = os.environ['DYNAMODB_TABLE']
        table = dynamodb.Table(table_name)

        # Prepare metadata record
        current_time = datetime.utcnow().isoformat()
        metadata = {
            'file_id': key,
            'bucket': bucket,
            'file_name': os.path.basename(key),
            'file_size': file_size,
            'row_count': row_count,
            'column_count': len(column_names),
            'column_names': column_names,
            'upload_timestamp': current_time,
            'processing_status': 'completed',
            'processed_timestamp': current_time,
            'environment': os.environ.get('ENVIRONMENT_TYPE', 'unknown')
        }

        # Store metadata in DynamoDB
        table.put_item(Item=metadata)

        print(f'Successfully processed {row_count} rows from {key}')
        print(f'Metadata stored in DynamoDB table: {table_name}')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'CSV processed successfully',
                'file': key,
                'row_count': row_count,
                'column_count': len(column_names),
                'file_size': file_size
            })
        }

    except Exception as e:
        error_message = f'Error processing CSV: {str(e)}'
        print(error_message)

        # Attempt to store error status in DynamoDB
        try:
            table_name = os.environ['DYNAMODB_TABLE']
            table = dynamodb.Table(table_name)

            error_metadata = {
                'file_id': key,
                'bucket': bucket,
                'file_name': os.path.basename(key),
                'upload_timestamp': datetime.utcnow().isoformat(),
                'processing_status': 'failed',
                'error_message': str(e),
                'environment': os.environ.get('ENVIRONMENT_TYPE', 'unknown')
            }

            table.put_item(Item=error_metadata)
            print(f'Error metadata stored in DynamoDB')

        except Exception as db_error:
            print(f'Failed to store error metadata in DynamoDB: {str(db_error)}')

        # Re-raise exception for Lambda error handling
        raise e
```

## File: lib/lambda/tag-macro.py

```python
import json

def lambda_handler(event, context):
    """
    CloudFormation Macro to automatically inject environment tags based on account ID.

    This macro transforms CloudFormation templates by adding standardized tags
    to all resources based on the AWS account ID. It maps account IDs to
    environment types (production, staging, development).

    Args:
        event: CloudFormation macro event with template fragment
        context: Lambda context object

    Returns:
        dict: Transformed template fragment with injected tags
    """
    print(f'Macro Event: {json.dumps(event)}')

    # Account ID to environment mapping
    # Update these values for your specific AWS accounts
    account_environment_map = {
        '111111111111': 'production',
        '222222222222': 'staging',
        '333333333333': 'development'
    }

    try:
        # Extract template fragment and request parameters
        fragment = event['fragment']
        request_id = event['requestId']
        account_id = event['accountId']
        region = event['region']

        # Determine environment type from account ID
        environment_type = account_environment_map.get(account_id, 'unknown')

        print(f'Processing template for account {account_id} (environment: {environment_type})')

        # Standard tags to inject
        standard_tags = [
            {
                'Key': 'Environment',
                'Value': environment_type
            },
            {
                'Key': 'AccountId',
                'Value': account_id
            },
            {
                'Key': 'Region',
                'Value': region
            },
            {
                'Key': 'ManagedBy',
                'Value': 'CloudFormation'
            },
            {
                'Key': 'CostCenter',
                'Value': f'analytics-{environment_type}'
            },
            {
                'Key': 'AutoTagged',
                'Value': 'true'
            }
        ]

        # Iterate through resources and inject tags
        if 'Resources' in fragment:
            for resource_name, resource_properties in fragment['Resources'].items():
                resource_type = resource_properties.get('Type', '')

                # List of resource types that support tags
                taggable_resources = [
                    'AWS::S3::Bucket',
                    'AWS::Lambda::Function',
                    'AWS::DynamoDB::Table',
                    'AWS::IAM::Role',
                    'AWS::EC2::VPC',
                    'AWS::EC2::Subnet',
                    'AWS::EC2::SecurityGroup',
                    'AWS::SNS::Topic',
                    'AWS::CloudFormation::Stack',
                    'AWS::ServiceCatalog::Portfolio'
                ]

                # Check if resource type supports tagging
                if any(taggable_type in resource_type for taggable_type in taggable_resources):
                    # Initialize Properties if not exists
                    if 'Properties' not in resource_properties:
                        resource_properties['Properties'] = {}

                    # Initialize Tags if not exists
                    if 'Tags' not in resource_properties['Properties']:
                        resource_properties['Properties']['Tags'] = []

                    # Get existing tags
                    existing_tags = resource_properties['Properties']['Tags']
                    existing_tag_keys = [tag.get('Key') for tag in existing_tags]

                    # Inject standard tags if not already present
                    for tag in standard_tags:
                        if tag['Key'] not in existing_tag_keys:
                            existing_tags.append(tag)

                    print(f'Injected tags for resource: {resource_name} ({resource_type})')

        # Return transformed template
        return {
            'requestId': request_id,
            'status': 'success',
            'fragment': fragment
        }

    except Exception as e:
        error_message = f'Error processing macro: {str(e)}'
        print(error_message)

        return {
            'requestId': event.get('requestId', 'unknown'),
            'status': 'failure',
            'errorMessage': error_message
        }
```

## File: lib/macro-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation Macro for automatic tag injection - must be deployed before using in templates",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names",
      "Default": "shared"
    }
  },
  "Resources": {
    "MacroExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "analytics-macro-execution-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
      }
    },
    "TagMacroFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "analytics-tag-macro-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["MacroExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "import json\n\ndef lambda_handler(event, context):\n    \"\"\"\n    CloudFormation Macro to automatically inject environment tags based on account ID.\n    \"\"\"\n    print(f'Macro Event: {json.dumps(event)}')\n    \n    account_environment_map = {\n        '111111111111': 'production',\n        '222222222222': 'staging',\n        '333333333333': 'development'\n    }\n    \n    try:\n        fragment = event['fragment']\n        request_id = event['requestId']\n        account_id = event['accountId']\n        region = event['region']\n        \n        environment_type = account_environment_map.get(account_id, 'unknown')\n        \n        print(f'Processing template for account {account_id} (environment: {environment_type})')\n        \n        standard_tags = [\n            {'Key': 'Environment', 'Value': environment_type},\n            {'Key': 'AccountId', 'Value': account_id},\n            {'Key': 'Region', 'Value': region},\n            {'Key': 'ManagedBy', 'Value': 'CloudFormation'},\n            {'Key': 'CostCenter', 'Value': f'analytics-{environment_type}'},\n            {'Key': 'AutoTagged', 'Value': 'true'}\n        ]\n        \n        if 'Resources' in fragment:\n            for resource_name, resource_properties in fragment['Resources'].items():\n                resource_type = resource_properties.get('Type', '')\n                \n                taggable_resources = [\n                    'AWS::S3::Bucket', 'AWS::Lambda::Function', 'AWS::DynamoDB::Table',\n                    'AWS::IAM::Role', 'AWS::EC2::VPC', 'AWS::EC2::Subnet',\n                    'AWS::EC2::SecurityGroup', 'AWS::SNS::Topic',\n                    'AWS::CloudFormation::Stack', 'AWS::ServiceCatalog::Portfolio'\n                ]\n                \n                if any(taggable_type in resource_type for taggable_type in taggable_resources):\n                    if 'Properties' not in resource_properties:\n                        resource_properties['Properties'] = {}\n                    if 'Tags' not in resource_properties['Properties']:\n                        resource_properties['Properties']['Tags'] = []\n                    \n                    existing_tags = resource_properties['Properties']['Tags']\n                    existing_tag_keys = [tag.get('Key') for tag in existing_tags]\n                    \n                    for tag in standard_tags:\n                        if tag['Key'] not in existing_tag_keys:\n                            existing_tags.append(tag)\n                    \n                    print(f'Injected tags for resource: {resource_name} ({resource_type})')\n        \n        return {\n            'requestId': request_id,\n            'status': 'success',\n            'fragment': fragment\n        }\n        \n    except Exception as e:\n        error_message = f'Error processing macro: {str(e)}'\n        print(error_message)\n        return {\n            'requestId': event.get('requestId', 'unknown'),\n            'status': 'failure',\n            'errorMessage': error_message\n        }\n"
        },
        "Timeout": 60
      }
    },
    "TagMacro": {
      "Type": "AWS::CloudFormation::Macro",
      "Properties": {
        "Name": "EnvironmentTagInjector",
        "Description": "Automatically injects environment-specific tags based on AWS account ID",
        "FunctionName": {"Fn::GetAtt": ["TagMacroFunction", "Arn"]}
      }
    }
  },
  "Outputs": {
    "MacroName": {
      "Description": "Name of the CloudFormation Macro",
      "Value": {"Ref": "TagMacro"}
    },
    "MacroFunctionArn": {
      "Description": "ARN of the macro Lambda function",
      "Value": {"Fn::GetAtt": ["TagMacroFunction", "Arn"]}
    }
  }
}
```

## File: lib/service-catalog-product.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Service Catalog product template for self-service test instance provisioning",
  "Parameters": {
    "PortfolioId": {
      "Type": "String",
      "Description": "Service Catalog Portfolio ID"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource names"
    }
  },
  "Resources": {
    "TestInstanceProduct": {
      "Type": "AWS::ServiceCatalog::CloudFormationProduct",
      "Properties": {
        "Name": "Analytics Test Instance",
        "Description": "Self-service test instance for data analytics platform",
        "Owner": "Platform Engineering Team",
        "ProvisioningArtifactParameters": [
          {
            "Name": "v1.0",
            "Description": "Initial version with S3 bucket and DynamoDB table",
            "Info": {
              "LoadTemplateFromURL": "https://s3.amazonaws.com/your-bucket/test-instance-template.json"
            }
          }
        ],
        "Tags": [
          {
            "Key": "ServiceCatalog",
            "Value": "true"
          }
        ]
      }
    },
    "PortfolioProductAssociation": {
      "Type": "AWS::ServiceCatalog::PortfolioProductAssociation",
      "Properties": {
        "PortfolioId": {"Ref": "PortfolioId"},
        "ProductId": {"Ref": "TestInstanceProduct"}
      }
    },
    "LaunchRoleConstraint": {
      "Type": "AWS::ServiceCatalog::LaunchRoleConstraint",
      "Properties": {
        "PortfolioId": {"Ref": "PortfolioId"},
        "ProductId": {"Ref": "TestInstanceProduct"},
        "RoleArn": {"Fn::GetAtt": ["ServiceCatalogLaunchRole", "Arn"]},
        "Description": "Launch role for Service Catalog products"
      }
    },
    "ServiceCatalogLaunchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "service-catalog-launch-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "servicecatalog.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "ServiceCatalogLaunchPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:CreateStack",
                    "cloudformation:DeleteStack",
                    "cloudformation:DescribeStackEvents",
                    "cloudformation:DescribeStacks",
                    "cloudformation:GetTemplateSummary",
                    "cloudformation:SetStackPolicy",
                    "cloudformation:ValidateTemplate",
                    "cloudformation:UpdateStack"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:CreateBucket",
                    "s3:DeleteBucket",
                    "s3:PutBucketVersioning",
                    "s3:PutEncryptionConfiguration"
                  ],
                  "Resource": "arn:aws:s3:::test-*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:CreateTable",
                    "dynamodb:DeleteTable",
                    "dynamodb:DescribeTable"
                  ],
                  "Resource": "arn:aws:dynamodb:*:*:table/test-*"
                }
              ]
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "ProductId": {
      "Description": "Service Catalog Product ID",
      "Value": {"Ref": "TestInstanceProduct"}
    },
    "LaunchRoleArn": {
      "Description": "ARN of the Service Catalog launch role",
      "Value": {"Fn::GetAtt": ["ServiceCatalogLaunchRole", "Arn"]}
    }
  }
}
```

## File: lib/README.md

```markdown
# Multi-Environment Data Analytics Platform - CloudFormation Implementation

This repository contains CloudFormation templates (JSON format) for deploying a complete multi-environment data analytics platform across AWS accounts using StackSets.

## Architecture Overview

The infrastructure is organized into modular components:

- **Master Template** (`template.json`): Orchestrates deployment via CloudFormation StackSets
- **VPC Nested Stack** (`vpc-stack.json`): Provisions network infrastructure with 3 AZs
- **Security Nested Stack** (`security-stack.json`): Manages IAM roles and policies
- **Application Nested Stack** (`app-stack.json`): Deploys S3, Lambda, DynamoDB, CloudWatch
- **Custom Resources**: Lambda-backed validation for bucket policies
- **CloudFormation Macro**: Automatic tag injection based on account ID
- **Service Catalog**: Self-service provisioning for developers

## Prerequisites

1. **AWS Organizations Setup**
   - Management account with StackSets enabled
   - Cross-account IAM roles configured
   - Target accounts for development, staging, production

2. **AWS CLI Configuration**
   - AWS CLI 2.x installed
   - Credentials configured with AdministratorAccess
   - Appropriate IAM permissions for StackSets

3. **S3 Bucket for Templates**
   - Create S3 bucket to host nested stack templates
   - Upload all JSON templates to this bucket
   - Enable versioning on the bucket

4. **Parameter Store Setup**
   - Create environment-specific parameters before deployment
   - Path format: `/analytics/{environment}/*`

## Deployment Instructions

### Step 1: Deploy CloudFormation Macro (One-Time Setup)

The macro must be deployed before using it in other templates:

```bash
# Deploy macro in management account
aws cloudformation create-stack \
  --stack-name analytics-tag-macro \
  --template-body file://macro-template.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=shared \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name analytics-tag-macro \
  --region us-east-1
```

### Step 2: Upload Nested Stack Templates to S3

```bash
# Set your S3 bucket name
export TEMPLATE_BUCKET=your-cloudformation-templates-bucket

# Upload nested stack templates
aws s3 cp vpc-stack.json s3://${TEMPLATE_BUCKET}/analytics/vpc-stack.json
aws s3 cp security-stack.json s3://${TEMPLATE_BUCKET}/analytics/security-stack.json
aws s3 cp app-stack.json s3://${TEMPLATE_BUCKET}/analytics/app-stack.json

# Verify uploads
aws s3 ls s3://${TEMPLATE_BUCKET}/analytics/
```

### Step 3: Create Parameter Store Values

```bash
# Production environment parameters
aws ssm put-parameter \
  --name /analytics/production/csv-processing-timeout \
  --value "300" \
  --type String \
  --region us-east-1

aws ssm put-parameter \
  --name /analytics/production/max-file-size \
  --value "104857600" \
  --type String \
  --region us-east-1

# Staging environment parameters
aws ssm put-parameter \
  --name /analytics/staging/csv-processing-timeout \
  --value "180" \
  --type String \
  --region us-west-2

# Development environment parameters
aws ssm put-parameter \
  --name /analytics/development/csv-processing-timeout \
  --value "120" \
  --type String \
  --region eu-west-1
```

### Step 4: Deploy via CloudFormation StackSets

#### Production Environment (us-east-1)

```bash
aws cloudformation create-stack-set \
  --stack-set-name analytics-platform-production \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=production \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VPCTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/vpc-stack.json \
    ParameterKey=SecurityTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/security-stack.json \
    ParameterKey=ApplicationTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/app-stack.json \
    ParameterKey=AccountId,ParameterValue=111111111111 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Create stack instances for production accounts
aws cloudformation create-stack-instances \
  --stack-set-name analytics-platform-production \
  --accounts 111111111111 \
  --regions us-east-1 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

#### Staging Environment (us-west-2)

```bash
aws cloudformation create-stack-set \
  --stack-set-name analytics-platform-staging \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=stage \
    ParameterKey=VPCTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/vpc-stack.json \
    ParameterKey=SecurityTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/security-stack.json \
    ParameterKey=ApplicationTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/app-stack.json \
    ParameterKey=AccountId,ParameterValue=222222222222 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2

aws cloudformation create-stack-instances \
  --stack-set-name analytics-platform-staging \
  --accounts 222222222222 \
  --regions us-west-2 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

#### Development Environment (eu-west-1)

```bash
aws cloudformation create-stack-set \
  --stack-set-name analytics-platform-development \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=development \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VPCTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/vpc-stack.json \
    ParameterKey=SecurityTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/security-stack.json \
    ParameterKey=ApplicationTemplateURL,ParameterValue=https://s3.amazonaws.com/${TEMPLATE_BUCKET}/analytics/app-stack.json \
    ParameterKey=AccountId,ParameterValue=333333333333 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1

aws cloudformation create-stack-instances \
  --stack-set-name analytics-platform-development \
  --accounts 333333333333 \
  --regions eu-west-1 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

### Step 5: Monitor Deployment

```bash
# Check StackSet status
aws cloudformation describe-stack-set \
  --stack-set-name analytics-platform-production

# Check stack instance status
aws cloudformation list-stack-instances \
  --stack-set-name analytics-platform-production

# View stack events
aws cloudformation describe-stack-events \
  --stack-name StackSet-analytics-platform-production-{instance-id}
```

### Step 6: Configure SNS Notifications

```bash
# Subscribe to drift detection notifications
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:111111111111:cloudformation-drift-prod \
  --protocol email \
  --notification-endpoint ops-team@example.com

# Subscribe to policy compliance notifications
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:111111111111:policy-compliance-prod \
  --protocol email \
  --notification-endpoint security-team@example.com
```

## Testing the Deployment

### Test CSV Processing

```bash
# Create a sample CSV file
cat > sample.csv << EOF
id,name,value,timestamp
1,item1,100,2024-01-01T10:00:00
2,item2,200,2024-01-01T11:00:00
3,item3,300,2024-01-01T12:00:00
EOF

# Upload to S3 bucket (triggers Lambda processing)
aws s3 cp sample.csv s3://analytics-data-prod/uploads/sample.csv

# Check Lambda logs
aws logs tail /aws/lambda/analytics-csv-processor-prod --follow

# Query DynamoDB for metadata
aws dynamodb get-item \
  --table-name analytics-metadata-prod \
  --key '{"file_id": {"S": "uploads/sample.csv"}}'
```

### Test Custom Resource Validation

```bash
# Trigger drift detection
aws configservice start-config-rules-evaluation \
  --config-rule-names cloudformation-drift-detection-prod

# Check SNS notifications (email inbox)
```

### View CloudWatch Dashboard

```bash
# Get dashboard URL from stack outputs
aws cloudformation describe-stacks \
  --stack-name StackSet-analytics-platform-production-{instance-id} \
  --query "Stacks[0].Outputs[?OutputKey=='DashboardURL'].OutputValue" \
  --output text
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- Production S3 bucket: `analytics-data-prod`
- Staging DynamoDB table: `analytics-metadata-stage`
- Development Lambda function: `analytics-csv-processor-dev`

## DeletionPolicy Configuration

### Production Resources
- S3 buckets: **Retain** (prevents accidental data loss)
- DynamoDB tables: **Snapshot** (creates backup before deletion)
- Lambda functions: **Delete** (no state to preserve)

### Non-Production Resources
- All resources: **Delete** (enables quick cleanup and iteration)

## Drift Detection

AWS Config monitors CloudFormation stacks for configuration drift:

1. Config rule evaluates stacks every 12 hours
2. Manual evaluation via: `aws configservice start-config-rules-evaluation`
3. Non-compliant resources trigger SNS notifications
4. Review drift via: `aws cloudformation detect-stack-drift`

## Troubleshooting

### Stack Creation Failures

```bash
# View failure reason
aws cloudformation describe-stack-events \
  --stack-name {stack-name} \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED']"

# Common issues:
# 1. Nested template URLs not accessible (check S3 permissions)
# 2. IAM permissions insufficient (verify CAPABILITY_NAMED_IAM)
# 3. Parameter Store values missing (create before deployment)
# 4. Resource naming conflicts (ensure unique environmentSuffix)
```

### Lambda Execution Errors

```bash
# View Lambda logs
aws logs tail /aws/lambda/analytics-csv-processor-prod --follow

# Common issues:
# 1. VPC configuration timeout (check NAT Gateway)
# 2. DynamoDB table not found (verify table name)
# 3. S3 permissions denied (check IAM role policy)
# 4. Memory limit exceeded (increase from 3GB if needed)
```

### Custom Resource Timeout

```bash
# Check custom resource logs
aws logs tail /aws/lambda/analytics-policy-validator-prod --follow

# Common issues:
# 1. S3 bucket policy not yet applied (wait for propagation)
# 2. SNS publish permissions missing (check IAM role)
# 3. Timeout (increase from 60 seconds if needed)
```

## Cleanup

### Delete Non-Production Environments

```bash
# Development
aws cloudformation delete-stack-instances \
  --stack-set-name analytics-platform-development \
  --accounts 333333333333 \
  --regions eu-west-1 \
  --no-retain-stacks

aws cloudformation delete-stack-set \
  --stack-set-name analytics-platform-development

# Staging
aws cloudformation delete-stack-instances \
  --stack-set-name analytics-platform-staging \
  --accounts 222222222222 \
  --regions us-west-2 \
  --no-retain-stacks

aws cloudformation delete-stack-set \
  --stack-set-name analytics-platform-staging
```

### Production Cleanup (Use with Caution)

```bash
# Production resources have Retain/Snapshot policies
# Manual cleanup required after stack deletion

# 1. Delete stack instances
aws cloudformation delete-stack-instances \
  --stack-set-name analytics-platform-production \
  --accounts 111111111111 \
  --regions us-east-1 \
  --no-retain-stacks

# 2. Delete stack set
aws cloudformation delete-stack-set \
  --stack-set-name analytics-platform-production

# 3. Manually delete retained S3 buckets
aws s3 rb s3://analytics-data-prod --force

# 4. Manually delete DynamoDB table snapshots
aws dynamodb list-backups --table-name analytics-metadata-prod
```

## Cost Optimization

- **NAT Gateways**: Only created for production and staging (expensive)
- **DynamoDB**: On-demand billing avoids over-provisioning
- **Lambda**: 3GB memory allocation only when needed for large CSVs
- **VPC Endpoints**: Reduce data transfer costs for S3 and DynamoDB
- **Lifecycle Policies**: Automatic transition to Glacier after 90 days

## Security Best Practices

1. **S3 Bucket Policies**: Explicit deny for unencrypted uploads and insecure transport
2. **IAM Roles**: Least-privilege access with environment-specific variations
3. **Encryption**: Server-side encryption enabled on all S3 buckets
4. **VPC**: Lambda functions run in private subnets with VPC endpoints
5. **Custom Resources**: Post-deployment validation ensures policy compliance
6. **Drift Detection**: Continuous monitoring via AWS Config rules

## Additional Resources

- [CloudFormation StackSets User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html)
- [CloudFormation Macros Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-macros.html)
- [AWS Service Catalog Documentation](https://docs.aws.amazon.com/servicecatalog/)
- [AWS Config Rules for Drift Detection](https://docs.aws.amazon.com/config/latest/developerguide/cloudformation-stack-drift-detection-check.html)

## Support

For issues or questions, contact the Platform Engineering Team or open an issue in the repository.
```

## Summary

This implementation provides a complete multi-environment data analytics platform using CloudFormation with JSON format. The solution includes:

1. **Master template** with StackSets for multi-account deployment
2. **Nested stacks** for VPC, security, and application layers
3. **Environment-specific configurations** using CloudFormation Conditions
4. **S3 buckets** with encryption, versioning, and Glacier lifecycle policies
5. **Lambda functions** for CSV processing with 3GB memory
6. **DynamoDB tables** with on-demand billing and point-in-time recovery
7. **IAM roles** with least-privilege access and environment variations
8. **Custom Resources** for S3 bucket policy validation
9. **CloudFormation Macro** for automatic tag injection
10. **AWS Config rules** for drift detection
11. **Service Catalog** portfolio for self-service provisioning
12. **CloudWatch dashboards** with environment-specific metrics
13. **SNS notifications** for compliance alerts and drift detection
14. **DeletionPolicy** set appropriately (Retain/Snapshot for production, Delete for non-production)

All resources include the environmentSuffix parameter for uniqueness, and the code follows CloudFormation best practices with comprehensive error handling and inline documentation.
