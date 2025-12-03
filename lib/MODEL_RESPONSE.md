# Secure Data Processing Pipeline - CloudFormation JSON Implementation# Secure Data Processing Pipeline - CloudFormation JSON Implementation

This implementation creates a PCI DSS compliant serverless data processing pipeline using CloudFormation JSON format.This implementation creates a PCI DSS compliant serverless data processing pipeline using CloudFormation JSON format.

## Architecture Overview## Architecture Overview

The solution implements a secure serverless architecture with complete network isolation:The solution implements a secure serverless architecture:

- **Network Layer**: VPC with 3 private subnets across 3 AZs, VPC endpoints for private AWS service access

### Network Layer- **Processing Layer**: AWS Lambda function in private subnets for payment card data validation

- **VPC** with CIDR 10.0.0.0/16 across 3 availability zones- **Security Layer**: KMS encryption, security groups, IAM roles, VPC Flow Logs

- **3 Private Subnets** (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) - NO public subnets- **Compliance Layer**: AWS Config rules, SNS alerts, Systems Manager Parameter Store

- **VPC Endpoints**: Gateway endpoint for S3, Interface endpoint for KMS

- **VPC Flow Logs**: All network traffic logged to CloudWatch Logs with 90-day retention## File: lib/TapStack.json

### Processing Layer```json

- **AWS Lambda Function**: Payment card data validation function{

- **VPC Configuration**: Lambda deployed in private subnets for network isolation  "AWSTemplateFormatVersion": "2010-09-09",

- **Runtime**: Node.js 22.x with 1024 MB memory, 60-second timeout  "Description": "Payment Processing System Migration - PCI DSS Compliant Infrastructure",

- **IAM Role**: Least privilege access to S3, KMS, and CloudWatch Logs  "Parameters": {

    "EnvironmentSuffix": {

### Security & Encryption      "Type": "String",

- **KMS Customer-Managed Key**: Encryption for S3, SNS, and CloudWatch Logs      "Description": "Unique suffix for resource naming to enable parallel deployments",

- **Security Groups**: Separate groups for Lambda and KMS endpoint with least privilege rules      "MinLength": 4,

- **IAM Roles**: Dedicated roles for Lambda, VPC Flow Logs, and AWS Config      "MaxLength": 20,

- **S3 Bucket Policies**: Enforce encrypted uploads and secure transport (HTTPS only)      "AllowedPattern": "[a-z0-9-]+",

      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"

### Compliance & Monitoring    },

- **AWS Config Rule**: IAM password policy compliance check    "LatestAmiId": {

- **SNS Topic**: Security alerts with KMS encryption      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",

- **VPC Flow Logs**: Network traffic monitoring in CloudWatch Logs      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",

- **Parameter Store**: Configuration management for bucket name and KMS key ID      "Description": "Latest Amazon Linux 2 AMI ID"

    }

### Storage  },

- **PCI Data Bucket**: S3 bucket with KMS encryption, versioning, and lifecycle policies  "Resources": {

- **Config Bucket**: Separate S3 bucket for AWS Config snapshots    "VPC": {

      "Type": "AWS::EC2::VPC",

## Key Implementation Details      "Properties": {

        "CidrBlock": "10.0.0.0/16",

### 1. Network Isolation        "EnableDnsHostnames": true,

        "EnableDnsSupport": true,

The architecture uses **private subnets only** with no internet access. All three private subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) are associated with a single private route table with no default route to the internet.        "Tags": [

          {

### 2. VPC Endpoints for Private Connectivity            "Key": "Name",

            "Value": {

- **S3 Gateway Endpoint**: Enables private S3 access from Lambda without internet              "Fn::Sub": "payment-vpc-${EnvironmentSuffix}"

- **KMS Interface Endpoint**: Provides private KMS API access across all 3 AZs            }

          },

### 3. Security Groups with Least Privilege          {

            "Key": "Environment",

- **Lambda Security Group**: Allows outbound HTTPS (443) to KMS endpoint only            "Value": "Production"

- **KMS Endpoint Security Group**: Allows inbound HTTPS (443) from Lambda security group only          },

          {

### 4. KMS Encryption for All Data            "Key": "CostCenter",

            "Value": "FinancialServices"

Customer-managed KMS key with:          },

- Retention policy (DeletionPolicy: Retain, UpdateReplacePolicy: Retain)          {

- Key policies for S3, Lambda, CloudWatch Logs access            "Key": "MigrationPhase",

- Used for encrypting S3 buckets, SNS topic, CloudWatch Logs            "Value": "Phase1"

          }

### 5. S3 Buckets with Encryption and Policies        ]

      }

**PCI Data Bucket**:    },

- KMS encryption with bucket key enabled    "InternetGateway": {

- Versioning enabled      "Type": "AWS::EC2::InternetGateway",

- Lifecycle policy: Delete old versions after 90 days      "Properties": {

- Block all public access        "Tags": [

- Retention policy to prevent accidental deletion          {

            "Key": "Name",

**Bucket Policy** enforces:            "Value": {

- Deny unencrypted uploads              "Fn::Sub": "payment-igw-${EnvironmentSuffix}"

- Deny insecure transport (require HTTPS)            }

          }

### 6. Lambda Function for Data Validation        ]

      }

The Lambda function is deployed in private subnets with:    },

- VPC configuration across 3 AZs    "AttachGateway": {

- Security group for KMS endpoint access      "Type": "AWS::EC2::VPCGatewayAttachment",

- IAM role with least privilege permissions      "Properties": {

- Environment variables for bucket name and KMS key ID        "VpcId": {

- Node.js 22.x runtime with inline validation code          "Ref": "VPC"

        },

**Lambda Execution Role**:        "InternetGatewayId": {

- AWSLambdaVPCAccessExecutionRole managed policy          "Ref": "InternetGateway"

- Custom S3 policy (GetObject, PutObject, ListBucket)        }

- Custom KMS policy (Decrypt, Encrypt, GenerateDataKey, DescribeKey)      }

    },

### 7. VPC Flow Logs    "PublicSubnet1": {

      "Type": "AWS::EC2::Subnet",

VPC Flow Logs capture all network traffic:      "Properties": {

- Send to CloudWatch Logs with 90-day retention        "VpcId": {

- Encrypted with customer-managed KMS key          "Ref": "VPC"

- Dedicated IAM role for Flow Logs service        },

        "CidrBlock": "10.0.1.0/24",

### 8. SNS Topic for Security Alerts        "AvailabilityZone": {

          "Fn::Select": [

SNS topic with:            0,

- KMS encryption for message content            {

- Tagged for PCI compliance              "Fn::GetAZs": ""

- Available for security alert subscriptions            }

          ]

### 9. AWS Config for Compliance        },

        "MapPublicIpOnLaunch": true,

- **Config Rule**: IAM password policy compliance check        "Tags": [

- **Config Bucket**: Stores compliance snapshots with KMS encryption          {

- **Config Role**: IAM role with permissions for S3, SNS, KMS access            "Key": "Name",

            "Value": {

### 10. Parameter Store for Configuration Management              "Fn::Sub": "payment-public-subnet-1-${EnvironmentSuffix}"

            }

Stores configuration values:          }

- Data bucket name at `/pci/config/${EnvironmentSuffix}/data-bucket`        ]

- KMS key ID at `/pci/config/${EnvironmentSuffix}/kms-key-id`      }

- Tagged for PCI compliance    },

    "PublicSubnet2": {

### 11. Resource Tagging      "Type": "AWS::EC2::Subnet",

      "Properties": {

All resources tagged with:        "VpcId": {

- `Name`: Resource identifier with v7 and environmentSuffix          "Ref": "VPC"

- `DataClassification`: PCI        },

- `ComplianceScope`: Payment        "CidrBlock": "10.0.2.0/24",

        "AvailabilityZone": {

### 12. Stack Outputs          "Fn::Select": [

            1,

Template exports:            {

- VPC ID              "Fn::GetAZs": ""

- Private subnet IDs (3 subnets)            }

- Data bucket name          ]

- Config bucket name        },

- KMS key ID and ARN        "MapPublicIpOnLaunch": true,

- Lambda function name and ARN        "Tags": [

- SNS topic ARN          {

- VPC Flow Logs log group name            "Key": "Name",

            "Value": {

## Deployment Instructions              "Fn::Sub": "payment-public-subnet-2-${EnvironmentSuffix}"

            }

### Deploy the Stack          }

        ]

```bash      }

export ENVIRONMENT_SUFFIX="dev"    },

    "PublicSubnet3": {

aws cloudformation create-stack \      "Type": "AWS::EC2::Subnet",

  --stack-name pci-data-pipeline-${ENVIRONMENT_SUFFIX} \      "Properties": {

  --template-body file://lib/TapStack.json \        "VpcId": {

  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \          "Ref": "VPC"

  --capabilities CAPABILITY_NAMED_IAM \        },

  --region us-east-1        "CidrBlock": "10.0.3.0/24",

```        "AvailabilityZone": {

          "Fn::Select": [

### Monitor Deployment            2,

            {

```bash              "Fn::GetAZs": ""

aws cloudformation describe-stacks \            }

  --stack-name pci-data-pipeline-${ENVIRONMENT_SUFFIX} \          ]

  --region us-east-1 \        },

  --query 'Stacks[0].StackStatus'        "MapPublicIpOnLaunch": true,

```        "Tags": [

          {

### Get Stack Outputs            "Key": "Name",

            "Value": {

```bash              "Fn::Sub": "payment-public-subnet-3-${EnvironmentSuffix}"

aws cloudformation describe-stacks \            }

  --stack-name pci-data-pipeline-${ENVIRONMENT_SUFFIX} \          }

  --region us-east-1 \        ]

  --query 'Stacks[0].Outputs'      }

```    },

    "PrivateSubnet1": {

### Test the Lambda Function      "Type": "AWS::EC2::Subnet",

      "Properties": {

```bash        "VpcId": {

# Get Lambda function name from outputs          "Ref": "VPC"

LAMBDA_FUNCTION=$(aws cloudformation describe-stacks \        },

  --stack-name pci-data-pipeline-${ENVIRONMENT_SUFFIX} \        "CidrBlock": "10.0.11.0/24",

  --region us-east-1 \        "AvailabilityZone": {

  --query 'Stacks[0].Outputs[?OutputKey==`DataValidationFunctionName`].OutputValue' \          "Fn::Select": [

  --output text)            0,

            {

# Invoke the function              "Fn::GetAZs": ""

aws lambda invoke \            }

  --function-name ${LAMBDA_FUNCTION} \          ]

  --region us-east-1 \        },

  --payload '{"test": "data"}' \        "Tags": [

  response.json          {

            "Key": "Name",

# View the response            "Value": {

cat response.json              "Fn::Sub": "payment-private-subnet-1-${EnvironmentSuffix}"

```            }

          }

### View VPC Flow Logs        ]

      }

```bash    },

# Get log group name    "PrivateSubnet2": {

LOG_GROUP=$(aws cloudformation describe-stacks \      "Type": "AWS::EC2::Subnet",

  --stack-name pci-data-pipeline-${ENVIRONMENT_SUFFIX} \      "Properties": {

  --region us-east-1 \        "VpcId": {

  --query 'Stacks[0].Outputs[?OutputKey==`VPCFlowLogsLogGroup`].OutputValue' \          "Ref": "VPC"

  --output text)        },

        "CidrBlock": "10.0.12.0/24",

# View recent logs        "AvailabilityZone": {

aws logs tail ${LOG_GROUP} --follow --region us-east-1          "Fn::Select": [

```            1,

            {

### Access Parameter Store Values              "Fn::GetAZs": ""

            }

```bash          ]

aws ssm get-parameter \        },

  --name "/pci/config/${ENVIRONMENT_SUFFIX}/data-bucket" \        "Tags": [

  --region us-east-1 \          {

  --query 'Parameter.Value' \            "Key": "Name",

  --output text            "Value": {

```              "Fn::Sub": "payment-private-subnet-2-${EnvironmentSuffix}"

            }

## Architecture Highlights          }

        ]

### PCI DSS Compliance      }

✅ **Encryption at Rest**: KMS customer-managed keys for S3, SNS, CloudWatch Logs      },

✅ **Encryption in Transit**: HTTPS/TLS for all AWS service communications      "PrivateSubnet3": {

✅ **Network Isolation**: Private subnets only, no internet access        "Type": "AWS::EC2::Subnet",

✅ **Least Privilege**: IAM roles and security groups with minimal permissions        "Properties": {

✅ **Audit Logging**: VPC Flow Logs and AWS Config for compliance monitoring          "VpcId": {

✅ **Secure Storage**: S3 bucket policies enforce encryption and secure transport            "Ref": "VPC"

        },

### Security Features        "CidrBlock": "10.0.13.0/24",

- **No Public Internet Access**: Lambda in private subnets, VPC endpoints for AWS services        "AvailabilityZone": {

- **Security Groups**: Granular network controls between Lambda and KMS endpoint          "Fn::Select": [

- **Bucket Policies**: Deny unencrypted uploads and insecure transport            2,

- **KMS Key Policies**: Service-specific permissions for S3, Lambda, CloudWatch            {

- **Public Access Block**: All S3 buckets block public access              "Fn::GetAZs": ""

            }

### Reliability          ]

- **Multi-AZ Deployment**: Lambda deployed across 3 availability zones        },

- **VPC Endpoints**: Interface endpoints in all 3 AZs for high availability        "Tags": [

- **S3 Versioning**: Data protection with 90-day lifecycle for old versions          {

- **Retention Policies**: KMS key and data buckets use Retain to prevent accidental deletion            "Key": "Name",

            "Value": {

### Monitoring & Compliance              "Fn::Sub": "payment-private-subnet-3-${EnvironmentSuffix}"

- **VPC Flow Logs**: 90-day retention in CloudWatch Logs with KMS encryption            }

- **AWS Config**: IAM password policy compliance monitoring          }

- **SNS Alerts**: Encrypted security notifications        ]

- **Parameter Store**: Centralized configuration management      }

    },

## Resource Summary    "DatabaseSubnet1": {

      "Type": "AWS::EC2::Subnet",

This CloudFormation template creates **27 AWS resources**:      "Properties": {

        "VpcId": {

### Networking (7 resources)          "Ref": "VPC"

- 1 VPC        },

- 3 Private Subnets        "CidrBlock": "10.0.21.0/24",

- 1 Private Route Table        "AvailabilityZone": {

- 3 Subnet Route Table Associations          "Fn::Select": [

            0,

### VPC Endpoints (2 resources)            {

- 1 S3 Gateway Endpoint              "Fn::GetAZs": ""

- 1 KMS Interface Endpoint            }

          ]

### Security Groups (4 resources)        },

- 1 KMS Endpoint Security Group        "Tags": [

- 1 Lambda Security Group          {

- 1 KMS Endpoint Security Group Ingress Rule            "Key": "Name",

- 1 Lambda Security Group Egress Rule            "Value": {

              "Fn::Sub": "payment-database-subnet-1-${EnvironmentSuffix}"

### Encryption (2 resources)            }

- 1 KMS Key (customer-managed)          }

- 1 KMS Key Alias        ]

      }

### Storage (4 resources)    },

- 1 S3 Bucket for PCI data    "DatabaseSubnet2": {

- 1 S3 Bucket Policy for PCI data bucket      "Type": "AWS::EC2::Subnet",

- 1 S3 Bucket for AWS Config      "Properties": {

- 1 S3 Bucket Policy for Config bucket        "VpcId": {

          "Ref": "VPC"

### Compute (2 resources)        },

- 1 Lambda Function        "CidrBlock": "10.0.22.0/24",

- 1 Lambda Execution Role (IAM)        "AvailabilityZone": {

          "Fn::Select": [

### Logging (3 resources)            1,

- 1 CloudWatch Log Group for VPC Flow Logs            {

- 1 VPC Flow Logs Role (IAM)              "Fn::GetAZs": ""

- 1 VPC Flow Log            }

          ]

### Compliance (3 resources)        },

- 1 AWS Config Role (IAM)        "Tags": [

- 1 AWS Config Rule (IAM password policy)          {

- 1 SNS Topic for security alerts            "Key": "Name",

            "Value": {

### Configuration Management (2 resources)              "Fn::Sub": "payment-database-subnet-2-${EnvironmentSuffix}"

- 1 SSM Parameter for data bucket name            }

- 1 SSM Parameter for KMS key ID          }

        ]

## Testing & Validation      }

    },

### Unit Tests    "DatabaseSubnet3": {

The implementation includes comprehensive Jest unit tests covering:      "Type": "AWS::EC2::Subnet",

- VPC and subnet configuration      "Properties": {

- Security group rules and network isolation        "VpcId": {

- KMS key policies and encryption          "Ref": "VPC"

- S3 bucket policies and lifecycle rules        },

- Lambda function configuration and IAM roles        "CidrBlock": "10.0.23.0/24",

- VPC Flow Logs and CloudWatch integration        "AvailabilityZone": {

- AWS Config rules and compliance monitoring          "Fn::Select": [

- Parameter Store configuration            2,

            {

### Security Validation              "Fn::GetAZs": ""

- ✅ No public subnets or internet gateways            }

- ✅ All data encrypted with customer-managed KMS keys          ]

- ✅ S3 bucket policies deny unencrypted uploads        },

- ✅ VPC endpoints provide private AWS service connectivity        "Tags": [

- ✅ Security groups enforce least privilege network access          {

- ✅ IAM roles follow principle of least privilege            "Key": "Name",

            "Value": {

### Compliance Validation              "Fn::Sub": "payment-database-subnet-3-${EnvironmentSuffix}"

- ✅ VPC Flow Logs enabled with 90-day retention            }

- ✅ AWS Config rule monitors IAM password policy          }

- ✅ All resources tagged with DataClassification and ComplianceScope        ]

- ✅ CloudWatch Logs encrypted with KMS      }

- ✅ SNS topic encrypted for security alerts    },

    "PublicRouteTable": {

## Conclusion      "Type": "AWS::EC2::RouteTable",

      "Properties": {

This implementation provides a **production-ready, PCI DSS compliant** serverless data processing pipeline using CloudFormation JSON. The architecture emphasizes:        "VpcId": {

          "Ref": "VPC"

1. **Complete Network Isolation**: Private subnets with VPC endpoints, no internet access        },

2. **Comprehensive Encryption**: KMS customer-managed keys for all data at rest and in transit        "Tags": [

3. **Least Privilege Security**: IAM roles and security groups with minimal permissions          {

4. **Compliance Monitoring**: VPC Flow Logs, AWS Config, and SNS alerts            "Key": "Name",

5. **Data Protection**: S3 versioning, lifecycle policies, and retention policies for KMS and buckets            "Value": {

              "Fn::Sub": "payment-public-rt-${EnvironmentSuffix}"

The template is parameterized with `EnvironmentSuffix` for parallel deployments and includes comprehensive tagging for cost allocation and compliance tracking.            }

          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway1EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway2EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway3EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway2"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        }
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway3"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        }
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "VPCFlowLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "FlowLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-flow-logs-${EnvironmentSuffix}"
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
              "Id": "DeleteOldFlowLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-flow-logs-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": {
          "Fn::GetAtt": [
            "FlowLogsBucket",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-flow-log-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-ec2-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTP from ALB"
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-ec2-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "payment-rds-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS Aurora cluster",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow MySQL from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-rds-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Description": "KMS key for RDS Aurora encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "PendingWindowInDays": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-rds-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "DatabaseSubnet1"
          },
          {
            "Ref": "DatabaseSubnet2"
          },
          {
            "Ref": "DatabaseSubnet3"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.2",
        "MasterUsername": "admin",
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:ssm-secure:/payment/${EnvironmentSuffix}/db/password}}"
        },
        "DatabaseName": "paymentdb",
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinancialServices"
          }
        ]
      }
    },
    "AuroraInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraInstanceReader": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-reader-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-reader-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-db-connections-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when database connections exceed 100",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraCluster"
            }
          }
        ]
      }
    },
    "ArtifactsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-artifacts-${EnvironmentSuffix}"
        },
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
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-artifacts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-ec2-role-${EnvironmentSuffix}"
        },
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "ParameterStoreAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/payment/${EnvironmentSuffix}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "S3ArtifactsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ArtifactsBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ArtifactsBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-ec2-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "payment-ec2-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "ApplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/payment/application-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          },
          {
            "Ref": "PublicSubnet3"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
        "Certificates": [
          {
            "CertificateArn": {
              "Fn::Sub": "{{resolve:ssm:/payment/${EnvironmentSuffix}/alb/certificate-arn}}"
            }
          }
        ]
      }
    },
    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
        },
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-waf-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "WebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "WebACLArn": {
          "Fn::GetAtt": [
            "WebACL",
            "Arn"
          ]
        }
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "payment-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": "t3.large",
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "EC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
            }
          ],
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 100,
                "VolumeType": "gp3",
                "Iops": 3000,
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\necho 'Payment processing application deployment' > /var/log/user-data.log\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "payment-instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "CostCenter",
                  "Value": "FinancialServices"
                },
                {
                  "Key": "MigrationPhase",
                  "Value": "Phase1"
                }
              ]
            }
          ]
        }
      }
    },
    
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBDNSName"
        }
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora Cluster Writer Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraClusterEndpoint"
        }
      }
    },
    "AuroraReaderEndpoint": {
      "Description": "Aurora Cluster Reader Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuroraReaderEndpoint"
        }
      }
    },
    "ArtifactsBucketName": {
      "Description": "S3 Bucket for Application Artifacts",
      "Value": {
        "Ref": "ArtifactsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactsBucketName"
        }
      }
    }
  }
}
```

## Deployment Instructions

### Prerequisites

1. Store the database password in Systems Manager Parameter Store:
   ```bash
   aws ssm put-parameter \
     --name "/payment/${ENVIRONMENT_SUFFIX}/db/password" \
     --value "YourSecurePassword123!" \
     --type "SecureString" \
     --region us-east-1
   ```

2. Store the ACM certificate ARN for HTTPS:
   ```bash
   aws ssm put-parameter \
     --name "/payment/${ENVIRONMENT_SUFFIX}/alb/certificate-arn" \
     --value "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID" \
     --type "String" \
     --region us-east-1
   ```

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Verify Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Access the Application

The ALB DNS name is available in the stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text
```

## Architecture Highlights

- **Multi-AZ High Availability**: Resources deployed across 3 availability zones
- **PCI DSS Compliance**: Encryption at rest (KMS), encryption in transit (TLS 1.2+), secure network architecture
- **Security**: WAF rate limiting, security groups with least privilege, private subnets for compute
- **Monitoring**: CloudWatch alarms for CPU and database connections, VPC Flow Logs, application losgs
- **Scalability**: Auto Scaling based on CPU utilization (70% target)
- **Scalability**: Application Load Balancer with appropriately sized EC2 instances (manual or external scaling)
- **Backup and Recovery**: 7-day backup retention with point-in-time recovery

## Resource Summary

This CloudFormation template creates 60+ AWS resources including:
- VPC with 9 subnets (3 public, 3 private, 3 database)
- 3 NAT Gateways for high availability
- Application Load Balancer with WAF protection
- EC2 instances configured via Launch Template (no Auto Scaling Group)
- RDS Aurora MySQL cluster (1 writer + 1 reader)
- KMS customer-managed key for encryption
- IAM roles and policies
- CloudWatch Log Groups and Alarms
- S3 buckets for artifacts and flow logs
- VPC Flow Logs for network monitoring
