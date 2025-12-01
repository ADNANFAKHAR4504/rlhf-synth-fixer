# CloudFormation Multi-Account Payment Processing Infrastructure

This implementation provides a complete CloudFormation StackSet solution for deploying payment processing infrastructure consistently across multiple AWS accounts.

## File: lib/PaymentProcessingStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Payment Processing Infrastructure - Main StackSet Template for Multi-Account Deployment",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Environment Configuration" },
          "Parameters": ["EnvironmentName", "AccountId", "DomainName", "SnsEmail"]
        },
        {
          "Label": { "default": "Network Configuration" },
          "Parameters": ["VpcCidr", "AvailabilityZone1", "AvailabilityZone2", "AvailabilityZone3"]
        },
        {
          "Label": { "default": "Nested Stack Templates" },
          "Parameters": ["NetworkStackTemplateUrl", "ComputeStackTemplateUrl", "StorageStackTemplateUrl", "MonitoringStackTemplateUrl"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for resource naming and conditional logic"
    },
    "AccountId": {
      "Type": "String",
      "Description": "AWS Account ID for this environment",
      "AllowedPattern": "^[0-9]{12}$"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for this environment (e.g., dev.example.com)",
      "Default": "dev.payments.local"
    },
    "SnsEmail": {
      "Type": "String",
      "Description": "Email address for SNS alarm notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    "VpcCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "AvailabilityZone1": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "First Availability Zone"
    },
    "AvailabilityZone2": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Second Availability Zone"
    },
    "AvailabilityZone3": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Third Availability Zone"
    },
    "NetworkStackTemplateUrl": {
      "Type": "String",
      "Description": "S3 URL for Network nested stack template"
    },
    "ComputeStackTemplateUrl": {
      "Type": "String",
      "Description": "S3 URL for Compute nested stack template"
    },
    "StorageStackTemplateUrl": {
      "Type": "String",
      "Description": "S3 URL for Storage nested stack template"
    },
    "MonitoringStackTemplateUrl": {
      "Type": "String",
      "Description": "S3 URL for Monitoring nested stack template"
    }
  },
  "Conditions": {
    "IsProduction": { "Fn::Equals": [{ "Ref": "EnvironmentName" }, "prod"] }
  },
  "Resources": {
    "NetworkStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": { "Ref": "NetworkStackTemplateUrl" },
        "Parameters": {
          "EnvironmentName": { "Ref": "EnvironmentName" },
          "VpcCidr": { "Ref": "VpcCidr" },
          "AvailabilityZone1": { "Ref": "AvailabilityZone1" },
          "AvailabilityZone2": { "Ref": "AvailabilityZone2" },
          "AvailabilityZone3": { "Ref": "AvailabilityZone3" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } },
          { "Key": "StackType", "Value": "Network" }
        ]
      }
    },
    "StorageStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": { "Ref": "StorageStackTemplateUrl" },
        "Parameters": {
          "EnvironmentName": { "Ref": "EnvironmentName" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } },
          { "Key": "StackType", "Value": "Storage" }
        ]
      }
    },
    "ComputeStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkStack", "StorageStack"],
      "Properties": {
        "TemplateURL": { "Ref": "ComputeStackTemplateUrl" },
        "Parameters": {
          "EnvironmentName": { "Ref": "EnvironmentName" },
          "VpcId": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
          "PrivateSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1Id"] },
          "PrivateSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2Id"] },
          "PrivateSubnet3": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet3Id"] },
          "PublicSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet1Id"] },
          "PublicSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet2Id"] },
          "PublicSubnet3": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet3Id"] },
          "LambdaSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.LambdaSecurityGroupId"] },
          "AlbSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.AlbSecurityGroupId"] },
          "PaymentTableName": { "Fn::GetAtt": ["StorageStack", "Outputs.PaymentTableName"] },
          "PaymentTableArn": { "Fn::GetAtt": ["StorageStack", "Outputs.PaymentTableArn"] },
          "IsProduction": { "Fn::If": ["IsProduction", "true", "false"] }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } },
          { "Key": "StackType", "Value": "Compute" }
        ]
      }
    },
    "MonitoringStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["ComputeStack", "StorageStack"],
      "Properties": {
        "TemplateURL": { "Ref": "MonitoringStackTemplateUrl" },
        "Parameters": {
          "EnvironmentName": { "Ref": "EnvironmentName" },
          "SnsEmail": { "Ref": "SnsEmail" },
          "ValidationFunctionName": { "Fn::GetAtt": ["ComputeStack", "Outputs.ValidationFunctionName"] },
          "ProcessingFunctionName": { "Fn::GetAtt": ["ComputeStack", "Outputs.ProcessingFunctionName"] },
          "PaymentTableName": { "Fn::GetAtt": ["StorageStack", "Outputs.PaymentTableName"] },
          "StateMachineArn": { "Fn::GetAtt": ["ComputeStack", "Outputs.StateMachineArn"] }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } },
          { "Key": "StackType", "Value": "Monitoring" }
        ]
      }
    }
  },
  "Outputs": {
    "StackName": {
      "Description": "Name of the main CloudFormation stack",
      "Value": { "Ref": "AWS::StackName" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-StackName" } }
    },
    "EnvironmentName": {
      "Description": "Environment name for this deployment",
      "Value": { "Ref": "EnvironmentName" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-EnvironmentName" } }
    },
    "VpcId": {
      "Description": "VPC ID from Network stack",
      "Value": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VpcId" } }
    },
    "AlbDnsName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": { "Fn::GetAtt": ["ComputeStack", "Outputs.AlbDnsName"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-AlbDnsName" } }
    },
    "StateMachineArn": {
      "Description": "ARN of the payment processing state machine",
      "Value": { "Fn::GetAtt": ["ComputeStack", "Outputs.StateMachineArn"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-StateMachineArn" } }
    },
    "PaymentTableName": {
      "Description": "Name of the payment transactions table",
      "Value": { "Fn::GetAtt": ["StorageStack", "Outputs.PaymentTableName"] },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-PaymentTableName" } }
    }
  }
}
```

## File: lib/nested/NetworkStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Network Infrastructure - VPC, Subnets, Security Groups",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC"
    },
    "AvailabilityZone1": {
      "Type": "AWS::EC2::AvailabilityZone::Name"
    },
    "AvailabilityZone2": {
      "Type": "AWS::EC2::AvailabilityZone::Name"
    },
    "AvailabilityZone3": {
      "Type": "AWS::EC2::AvailabilityZone::Name"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VpcCidr" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-vpc-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-igw-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [0, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone1" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-public-subnet-1-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [1, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone2" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-public-subnet-2-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [2, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone3" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-public-subnet-3-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [3, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone1" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-private-subnet-1-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [4, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone2" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-private-subnet-2-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [5, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Ref": "AvailabilityZone3" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-private-subnet-3-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-public-rt-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet3" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-private-rt-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet3" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "payment-lambda-sg-${EnvironmentName}" },
        "GroupDescription": "Security group for payment processing Lambda functions",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-lambda-sg-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "AlbSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "payment-alb-sg-${EnvironmentName}" },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from anywhere"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-alb-sg-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "DynamoDBEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "ServiceName": { "Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb" },
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [{ "Ref": "PrivateRouteTable" }]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "PublicSubnet1" }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "PublicSubnet2" }
    },
    "PublicSubnet3Id": {
      "Description": "Public Subnet 3 ID",
      "Value": { "Ref": "PublicSubnet3" }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" }
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": { "Ref": "PrivateSubnet3" }
    },
    "LambdaSecurityGroupId": {
      "Description": "Lambda Security Group ID",
      "Value": { "Ref": "LambdaSecurityGroup" }
    },
    "AlbSecurityGroupId": {
      "Description": "ALB Security Group ID",
      "Value": { "Ref": "AlbSecurityGroup" }
    }
  }
}
```

## File: lib/nested/StorageStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Storage Infrastructure - DynamoDB Tables",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name"
    }
  },
  "Resources": {
    "PaymentTransactionsTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": { "Fn::Sub": "payment-transactions-${EnvironmentName}" },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "transactionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          },
          {
            "AttributeName": "customerId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "paymentStatus",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "transactionId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "customer-index",
            "KeySchema": [
              {
                "AttributeName": "customerId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          },
          {
            "IndexName": "status-index",
            "KeySchema": [
              {
                "AttributeName": "paymentStatus",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-transactions-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    }
  },
  "Outputs": {
    "PaymentTableName": {
      "Description": "Payment Transactions Table Name",
      "Value": { "Ref": "PaymentTransactionsTable" }
    },
    "PaymentTableArn": {
      "Description": "Payment Transactions Table ARN",
      "Value": { "Fn::GetAtt": ["PaymentTransactionsTable", "Arn"] }
    }
  }
}
```

## File: lib/nested/ComputeStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Compute Infrastructure - Lambda Functions, ALB, Step Functions",
  "Parameters": {
    "EnvironmentName": { "Type": "String" },
    "VpcId": { "Type": "String" },
    "PrivateSubnet1": { "Type": "String" },
    "PrivateSubnet2": { "Type": "String" },
    "PrivateSubnet3": { "Type": "String" },
    "PublicSubnet1": { "Type": "String" },
    "PublicSubnet2": { "Type": "String" },
    "PublicSubnet3": { "Type": "String" },
    "LambdaSecurityGroup": { "Type": "String" },
    "AlbSecurityGroup": { "Type": "String" },
    "PaymentTableName": { "Type": "String" },
    "PaymentTableArn": { "Type": "String" },
    "IsProduction": { "Type": "String", "AllowedValues": ["true", "false"] }
  },
  "Conditions": {
    "EnableProductionFeatures": { "Fn::Equals": [{ "Ref": "IsProduction" }, "true"] }
  },
  "Resources": {
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "payment-lambda-role-${EnvironmentName}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "lambda.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
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
                  "Resource": [
                    { "Ref": "PaymentTableArn" },
                    { "Fn::Sub": "${PaymentTableArn}/index/*" }
                  ]
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
                  "Resource": { "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/payment-*" }
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ValidationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "payment-validation-${EnvironmentName}" },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "MemorySize": 512,
        "Timeout": 30,
        "ReservedConcurrentExecutions": { "Fn::If": ["EnableProductionFeatures", 100, { "Ref": "AWS::NoValue" }] },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": { "Ref": "EnvironmentName" },
            "PAYMENT_TABLE": { "Ref": "PaymentTableName" }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1" },
            { "Ref": "PrivateSubnet2" },
            { "Ref": "PrivateSubnet3" }
          ]
        },
        "Code": {
          "ZipFile": "const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');\nconst { DynamoDBDocumentClient, GetItemCommand } = require('@aws-sdk/lib-dynamodb');\n\nconst client = new DynamoDBClient({});\nconst ddbDocClient = DynamoDBDocumentClient.from(client);\n\nexports.handler = async (event) => {\n  console.log('Validation event:', JSON.stringify(event));\n  \n  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;\n  const { transactionId, amount, customerId } = body;\n  \n  if (!transactionId || !amount || !customerId) {\n    return {\n      statusCode: 400,\n      body: JSON.stringify({ error: 'Missing required fields' })\n    };\n  }\n  \n  if (amount <= 0 || amount > 10000) {\n    return {\n      statusCode: 400,\n      body: JSON.stringify({ error: 'Invalid amount' })\n    };\n  }\n  \n  return {\n    statusCode: 200,\n    body: JSON.stringify({\n      valid: true,\n      transactionId,\n      customerId,\n      amount\n    })\n  };\n};\n"
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-validation-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ProcessingFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "payment-processing-${EnvironmentName}" },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "MemorySize": 512,
        "Timeout": 60,
        "ReservedConcurrentExecutions": { "Fn::If": ["EnableProductionFeatures", 100, { "Ref": "AWS::NoValue" }] },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": { "Ref": "EnvironmentName" },
            "PAYMENT_TABLE": { "Ref": "PaymentTableName" }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1" },
            { "Ref": "PrivateSubnet2" },
            { "Ref": "PrivateSubnet3" }
          ]
        },
        "Code": {
          "ZipFile": "const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');\nconst { DynamoDBDocumentClient, PutItemCommand } = require('@aws-sdk/lib-dynamodb');\n\nconst client = new DynamoDBClient({});\nconst ddbDocClient = DynamoDBDocumentClient.from(client);\n\nexports.handler = async (event) => {\n  console.log('Processing event:', JSON.stringify(event));\n  \n  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;\n  const { transactionId, amount, customerId } = body;\n  \n  const timestamp = Date.now();\n  \n  const params = {\n    TableName: process.env.PAYMENT_TABLE,\n    Item: {\n      transactionId,\n      timestamp,\n      customerId,\n      amount,\n      paymentStatus: 'COMPLETED',\n      processedAt: new Date().toISOString()\n    }\n  };\n  \n  try {\n    await ddbDocClient.send(new PutItemCommand(params));\n    \n    return {\n      statusCode: 200,\n      body: JSON.stringify({\n        success: true,\n        transactionId,\n        timestamp,\n        status: 'COMPLETED'\n      })\n    };\n  } catch (error) {\n    console.error('Error processing payment:', error);\n    throw error;\n  }\n};\n"
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-processing-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ValidationFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "ValidationFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com"
      }
    },
    "ProcessingFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "ProcessingFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com"
      }
    },
    "StepFunctionsFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "ValidationFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "states.amazonaws.com"
      }
    },
    "StepFunctionsProcessingPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "ProcessingFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "states.amazonaws.com"
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "payment-alb-${EnvironmentName}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          { "Ref": "PublicSubnet1" },
          { "Ref": "PublicSubnet2" },
          { "Ref": "PublicSubnet3" }
        ],
        "SecurityGroups": [{ "Ref": "AlbSecurityGroup" }],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-alb-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ValidationTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "DependsOn": "ValidationFunctionPermission",
      "Properties": {
        "Name": { "Fn::Sub": "payment-validation-tg-${EnvironmentName}" },
        "TargetType": "lambda",
        "Targets": [{ "Id": { "Fn::GetAtt": ["ValidationFunction", "Arn"] } }],
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 35,
        "HealthCheckTimeoutSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 2,
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ProcessingTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "DependsOn": "ProcessingFunctionPermission",
      "Properties": {
        "Name": { "Fn::Sub": "payment-processing-tg-${EnvironmentName}" },
        "TargetType": "lambda",
        "Targets": [{ "Id": { "Fn::GetAtt": ["ProcessingFunction", "Arn"] } }],
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 35,
        "HealthCheckTimeoutSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 2,
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "AlbListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ValidationTargetGroup" }
          }
        ]
      }
    },
    "AlbListenerRule": {
      "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
      "Properties": {
        "ListenerArn": { "Ref": "AlbListener" },
        "Priority": 1,
        "Conditions": [
          {
            "Field": "path-pattern",
            "Values": ["/process"]
          }
        ],
        "Actions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ProcessingTargetGroup" }
          }
        ]
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "payment-stepfunctions-role-${EnvironmentName}" },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "Service": "states.amazonaws.com" },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "LambdaInvoke",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["lambda:InvokeFunction"],
                  "Resource": [
                    { "Fn::GetAtt": ["ValidationFunction", "Arn"] },
                    { "Fn::GetAtt": ["ProcessingFunction", "Arn"] }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "PaymentStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": { "Fn::Sub": "payment-workflow-${EnvironmentName}" },
        "RoleArn": { "Fn::GetAtt": ["StepFunctionsRole", "Arn"] },
        "DefinitionString": {
          "Fn::Sub": [
            "{\n  \"Comment\": \"Payment Processing Workflow\",\n  \"StartAt\": \"ValidatePayment\",\n  \"States\": {\n    \"ValidatePayment\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": {\n        \"FunctionName\": \"${ValidationFunctionArn}\",\n        \"Payload.$\": \"$\"\n      },\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"States.TaskFailed\", \"States.Timeout\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2.0\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"Next\": \"ValidationFailed\"\n        }\n      ],\n      \"Next\": \"ProcessPayment\"\n    },\n    \"ProcessPayment\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": {\n        \"FunctionName\": \"${ProcessingFunctionArn}\",\n        \"Payload.$\": \"$.Payload.body\"\n      },\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"States.TaskFailed\", \"States.Timeout\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2.0\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"Next\": \"ProcessingFailed\"\n        }\n      ],\n      \"Next\": \"PaymentSucceeded\"\n    },\n    \"PaymentSucceeded\": {\n      \"Type\": \"Succeed\"\n    },\n    \"ValidationFailed\": {\n      \"Type\": \"Fail\",\n      \"Error\": \"ValidationError\",\n      \"Cause\": \"Payment validation failed\"\n    },\n    \"ProcessingFailed\": {\n      \"Type\": \"Fail\",\n      \"Error\": \"ProcessingError\",\n      \"Cause\": \"Payment processing failed\"\n    }\n  }\n}",
            {
              "ValidationFunctionArn": { "Fn::GetAtt": ["ValidationFunction", "Arn"] },
              "ProcessingFunctionArn": { "Fn::GetAtt": ["ProcessingFunction", "Arn"] }
            }
          ]
        },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "payment-workflow-${EnvironmentName}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    }
  },
  "Outputs": {
    "ValidationFunctionName": {
      "Description": "Validation Function Name",
      "Value": { "Ref": "ValidationFunction" }
    },
    "ValidationFunctionArn": {
      "Description": "Validation Function ARN",
      "Value": { "Fn::GetAtt": ["ValidationFunction", "Arn"] }
    },
    "ProcessingFunctionName": {
      "Description": "Processing Function Name",
      "Value": { "Ref": "ProcessingFunction" }
    },
    "ProcessingFunctionArn": {
      "Description": "Processing Function ARN",
      "Value": { "Fn::GetAtt": ["ProcessingFunction", "Arn"] }
    },
    "AlbDnsName": {
      "Description": "ALB DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] }
    },
    "AlbArn": {
      "Description": "ALB ARN",
      "Value": { "Ref": "ApplicationLoadBalancer" }
    },
    "StateMachineArn": {
      "Description": "State Machine ARN",
      "Value": { "Fn::GetAtt": ["PaymentStateMachine", "Arn"] }
    }
  }
}
```

## File: lib/nested/MonitoringStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Monitoring Infrastructure - CloudWatch Alarms and SNS Topics",
  "Parameters": {
    "EnvironmentName": { "Type": "String" },
    "SnsEmail": { "Type": "String" },
    "ValidationFunctionName": { "Type": "String" },
    "ProcessingFunctionName": { "Type": "String" },
    "PaymentTableName": { "Type": "String" },
    "StateMachineArn": { "Type": "String" }
  },
  "Resources": {
    "AlarmTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "payment-alarms-${EnvironmentName}" },
        "DisplayName": { "Fn::Sub": "Payment Processing Alarms - ${EnvironmentName}" },
        "Subscription": [
          {
            "Endpoint": { "Ref": "SnsEmail" },
            "Protocol": "email"
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentName" } }
        ]
      }
    },
    "ValidationFunctionErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "payment-validation-errors-${EnvironmentName}" },
        "AlarmDescription": "Alarm when validation function has errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "ValidationFunctionName" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "ProcessingFunctionErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "payment-processing-errors-${EnvironmentName}" },
        "AlarmDescription": "Alarm when processing function has errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "ProcessingFunctionName" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "payment-dynamodb-throttle-${EnvironmentName}" },
        "AlarmDescription": "Alarm when DynamoDB requests are throttled",
        "MetricName": "UserErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": { "Ref": "PaymentTableName" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "StateMachineFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "payment-workflow-failures-${EnvironmentName}" },
        "AlarmDescription": "Alarm when state machine executions fail",
        "MetricName": "ExecutionsFailed",
        "Namespace": "AWS/States",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 3,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "StateMachineArn",
            "Value": { "Ref": "StateMachineArn" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },
    "ValidationFunctionDurationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": { "Fn::Sub": "payment-validation-duration-${EnvironmentName}" },
        "AlarmDescription": "Alarm when validation function duration is high",
        "MetricName": "Duration",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 5000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "ValidationFunctionName" }
          }
        ],
        "AlarmActions": [{ "Ref": "AlarmTopic" }],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "AlarmTopicArn": {
      "Description": "SNS Topic ARN for alarms",
      "Value": { "Ref": "AlarmTopic" }
    },
    "AlarmTopicName": {
      "Description": "SNS Topic Name for alarms",
      "Value": { "Fn::GetAtt": ["AlarmTopic", "TopicName"] }
    }
  }
}
```

## File: lib/parameters/dev-params.json

```json
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "AccountId",
    "ParameterValue": "123456789012"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "dev.payments.example.com"
  },
  {
    "ParameterKey": "SnsEmail",
    "ParameterValue": "dev-team@example.com"
  },
  {
    "ParameterKey": "VpcCidr",
    "ParameterValue": "10.0.0.0/16"
  },
  {
    "ParameterKey": "AvailabilityZone1",
    "ParameterValue": "us-east-1a"
  },
  {
    "ParameterKey": "AvailabilityZone2",
    "ParameterValue": "us-east-1b"
  },
  {
    "ParameterKey": "AvailabilityZone3",
    "ParameterValue": "us-east-1c"
  },
  {
    "ParameterKey": "NetworkStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/NetworkStack.json"
  },
  {
    "ParameterKey": "ComputeStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/ComputeStack.json"
  },
  {
    "ParameterKey": "StorageStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/StorageStack.json"
  },
  {
    "ParameterKey": "MonitoringStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/MonitoringStack.json"
  }
]
```

## File: lib/parameters/staging-params.json

```json
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "staging"
  },
  {
    "ParameterKey": "AccountId",
    "ParameterValue": "234567890123"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "staging.payments.example.com"
  },
  {
    "ParameterKey": "SnsEmail",
    "ParameterValue": "staging-team@example.com"
  },
  {
    "ParameterKey": "VpcCidr",
    "ParameterValue": "10.1.0.0/16"
  },
  {
    "ParameterKey": "AvailabilityZone1",
    "ParameterValue": "us-east-1a"
  },
  {
    "ParameterKey": "AvailabilityZone2",
    "ParameterValue": "us-east-1b"
  },
  {
    "ParameterKey": "AvailabilityZone3",
    "ParameterValue": "us-east-1c"
  },
  {
    "ParameterKey": "NetworkStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/NetworkStack.json"
  },
  {
    "ParameterKey": "ComputeStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/ComputeStack.json"
  },
  {
    "ParameterKey": "StorageStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/StorageStack.json"
  },
  {
    "ParameterKey": "MonitoringStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/MonitoringStack.json"
  }
]
```

## File: lib/parameters/prod-params.json

```json
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "AccountId",
    "ParameterValue": "345678901234"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "payments.example.com"
  },
  {
    "ParameterKey": "SnsEmail",
    "ParameterValue": "ops-team@example.com"
  },
  {
    "ParameterKey": "VpcCidr",
    "ParameterValue": "10.2.0.0/16"
  },
  {
    "ParameterKey": "AvailabilityZone1",
    "ParameterValue": "us-east-1a"
  },
  {
    "ParameterKey": "AvailabilityZone2",
    "ParameterValue": "us-east-1b"
  },
  {
    "ParameterKey": "AvailabilityZone3",
    "ParameterValue": "us-east-1c"
  },
  {
    "ParameterKey": "NetworkStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/NetworkStack.json"
  },
  {
    "ParameterKey": "ComputeStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/ComputeStack.json"
  },
  {
    "ParameterKey": "StorageStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/StorageStack.json"
  },
  {
    "ParameterKey": "MonitoringStackTemplateUrl",
    "ParameterValue": "https://s3.amazonaws.com/your-bucket/nested/MonitoringStack.json"
  }
]
```

## File: lib/DEPLOYMENT.md

```markdown
# Payment Processing Infrastructure - Deployment Guide

## Overview

This deployment guide covers the CloudFormation StackSet deployment for multi-account payment processing infrastructure.

## Prerequisites

1. AWS CLI 2.x installed and configured
2. Access to management account (456789012345) with StackSet permissions
3. OrganizationAccountAccessRole configured in target accounts
4. S3 bucket for storing nested stack templates

## Preparation Steps

### 1. Upload Nested Stack Templates

Upload all nested stack templates to an S3 bucket accessible from all target accounts:

```bash
aws s3 cp lib/nested/NetworkStack.json s3://your-bucket/nested/NetworkStack.json
aws s3 cp lib/nested/ComputeStack.json s3://your-bucket/nested/ComputeStack.json
aws s3 cp lib/nested/StorageStack.json s3://your-bucket/nested/StorageStack.json
aws s3 cp lib/nested/MonitoringStack.json s3://your-bucket/nested/MonitoringStack.json
```

### 2. Update Parameter Files

Update the template URLs in all parameter files (dev-params.json, staging-params.json, prod-params.json) with your actual S3 bucket name.

## StackSet Deployment

### Create StackSet

```bash
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false \
  --description "Multi-account payment processing infrastructure" \
  --region us-east-1
```

### Deploy to Development Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/dev-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

### Deploy to Staging Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 234567890123 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/staging-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

### Deploy to Production Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 345678901234 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/prod-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

## Drift Detection

### Detect Drift on StackSet

```bash
aws cloudformation detect-stack-set-drift \
  --stack-set-name payment-processing-infrastructure \
  --region us-east-1
```

### Check Drift Status

```bash
aws cloudformation describe-stack-set-drift-detection-status \
  --operation-id <operation-id-from-detect-command> \
  --region us-east-1
```

### View Drift Results

```bash
aws cloudformation describe-stack-instance \
  --stack-set-name payment-processing-infrastructure \
  --stack-instance-account 123456789012 \
  --stack-instance-region us-east-1
```

## Stack Updates

### Update StackSet Template

```bash
aws cloudformation update-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1,RegionConcurrencyType=SEQUENTIAL
```

### Update Stack Instances with New Parameters

```bash
aws cloudformation update-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/dev-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

## Validation

### Validate Consistency Across Environments

```bash
# Check Lambda runtime versions
for account in 123456789012 234567890123 345678901234; do
  echo "Checking account $account"
  aws lambda get-function --function-name payment-validation-dev --query 'Configuration.Runtime' --profile account-$account
done

# Check DynamoDB billing mode
for account in 123456789012 234567890123 345678901234; do
  echo "Checking account $account"
  aws dynamodb describe-table --table-name payment-transactions-dev --query 'Table.BillingModeSummary.BillingMode' --profile account-$account
done
```

## Cleanup

### Delete Stack Instances

```bash
aws cloudformation delete-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 234567890123 345678901234 \
  --regions us-east-1 \
  --no-retain-stacks
```

### Delete StackSet

```bash
aws cloudformation delete-stack-set \
  --stack-set-name payment-processing-infrastructure
```

## Monitoring

Monitor stack operations:

```bash
aws cloudformation list-stack-set-operations \
  --stack-set-name payment-processing-infrastructure \
  --region us-east-1
```

Check specific operation:

```bash
aws cloudformation describe-stack-set-operation \
  --stack-set-name payment-processing-infrastructure \
  --operation-id <operation-id> \
  --region us-east-1
```
```

## File: lib/README.md

```markdown
# Multi-Account Payment Processing Infrastructure

CloudFormation StackSet solution for deploying payment processing infrastructure consistently across multiple AWS accounts (dev, staging, production).

## Architecture

### Components

1. **Network Stack** - VPC with 3 AZs, public/private subnets, security groups
2. **Storage Stack** - DynamoDB table with GSIs for payment transactions
3. **Compute Stack** - Lambda functions, ALB, Step Functions state machine
4. **Monitoring Stack** - CloudWatch alarms and SNS topics

### Key Features

- Multi-account deployment via CloudFormation StackSets
- Identical infrastructure across all environments
- Environment-specific parameters (account IDs, domain names, emails)
- Production-only features via CloudFormation Conditions
- Drift detection support
- Modular nested stack architecture

## Infrastructure Details

### Lambda Functions

- **Validation Function**: Validates payment requests (Node.js 18.x, 512 MB, 30s timeout)
- **Processing Function**: Processes payments and stores in DynamoDB (Node.js 18.x, 512 MB, 60s timeout)
- Reserved concurrency (100) enabled only in production

### DynamoDB Table

- **Table Name**: payment-transactions-{environment}
- **Partition Key**: transactionId (String)
- **Sort Key**: timestamp (Number)
- **GSI 1**: customer-index (customerId + timestamp)
- **GSI 2**: status-index (paymentStatus + timestamp)
- **Billing**: On-demand (PAY_PER_REQUEST)

### Application Load Balancer

- Internet-facing ALB in public subnets
- Target groups for Lambda functions
- Health checks configured
- HTTP listener on port 80

### Step Functions

- Orchestrates payment workflow: Validate → Process → Succeed/Fail
- Retry logic with exponential backoff
- Error handling for validation and processing failures

### CloudWatch Alarms

- Lambda error alarms (threshold: 5 errors in 5 minutes)
- DynamoDB throttle alarms
- State machine failure alarms
- Lambda duration alarms

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick start:

```bash
# 1. Upload nested templates to S3
aws s3 sync lib/nested/ s3://your-bucket/nested/

# 2. Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM

# 3. Deploy to accounts
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/dev-params.json
```

## Testing

Payment workflow execution:

```bash
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:payment-workflow-dev \
  --input '{"transactionId":"txn-001","customerId":"cust-123","amount":100.50}'
```

## Consistency Validation

The infrastructure ensures consistency across environments through:

1. **Single Template Source**: One StackSet template deployed to all accounts
2. **Limited Parameters**: Only environment-specific values parameterized
3. **Identical Resources**: Lambda runtime, memory, DynamoDB config identical
4. **Drift Detection**: CloudFormation drift detection available
5. **Automated Deployment**: StackSets ensure uniform deployment process

## Cleanup

```bash
# Delete stack instances
aws cloudformation delete-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 234567890123 345678901234 \
  --regions us-east-1 \
  --no-retain-stacks

# Delete StackSet
aws cloudformation delete-stack-set \
  --stack-set-name payment-processing-infrastructure
```
```
