# AWS CloudFormation Template - CI/CD Pipeline Infrastructure

## Template Overview

### Version Information
- **AWS Template Format Version**: 2010-09-09
- **Description**: Production-grade CI/CD pipeline infrastructure for microservices architecture with comprehensive security, monitoring, and scalability features

### Parameters

#### Environment Configuration
- **Environment Name**:
  - Type: String
  - Default: Production
  - Description: Environment name for resource tagging
    "ProjectName": {
      "Type": "String",
      "Default": "MicroservicesPlatform",
      "Description": "Project name for resource naming"
    },
    "VpcCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC"
    },
    "PublicSubnetCidr": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for public subnet"
    },
    "PrivateSubnetCidr": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for private subnet"
    },
    "DatabaseUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "RDS database username"
    },
    "DatabasePassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "Description": "RDS database password"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for notifications"
    },
    "GitHubRepoName": {
      "Type": "String",
      "Default": "microservices-app",
      "Description": "GitHub repository name"
    },
    "GitHubOwner": {
      "Type": "String",
      "Description": "GitHub repository owner"
    }
  },

  "Mappings": {
    "AmazonLinuxAMI": {
      "us-east-1": {
        "AMI": "ami-0abcdef1234567890"
      }
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
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-VPC" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "Value": { "Fn::Sub": "${ProjectName}-IGW" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": { "Ref": "InternetGateway" },
        "VpcId": { "Ref": "VPC" }
      }
    },

    "PublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1a",
        "CidrBlock": { "Ref": "PublicSubnetCidr" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-Public-Subnet" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-east-1b",
        "CidrBlock": { "Ref": "PrivateSubnetCidr" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-Private-Subnet" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-NAT-Gateway" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-Public-Routes" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "SubnetId": { "Ref": "PublicSubnet" }
      }
    },

    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-Private-Routes" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "DefaultPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway" }
      }
    },

    "PrivateSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "SubnetId": { "Ref": "PrivateSubnet" }
      }
    },

    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS Key for encrypting pipeline artifacts and SNS messages",
        "KeyPolicy": {
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
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/${ProjectName}-pipeline-key" },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },

    "ArtifactStoreBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "${ProjectName}-pipeline-artifacts-${AWS::AccountId}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CodeBuildServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "codebuild.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CodeBuildServicePolicy",
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
                  "Resource": { "Fn::Sub": "arn:aws:logs:us-east-1:${AWS::AccountId}:*" }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:GetBucketLocation",
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["ArtifactStoreBucket", "Arn"] },
                    { "Fn::Sub": "${ArtifactStoreBucket}/*" }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CodePipelineServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "codepipeline.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CodePipelineServicePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:GetBucketLocation",
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["ArtifactStoreBucket", "Arn"] },
                    { "Fn::Sub": "${ArtifactStoreBucket}/*" }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetApplication",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:RegisterApplicationRevision"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CodeBuildProject": {
      "Type": "AWS::CodeBuild::Project",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-build" },
        "Description": "Build project for microservices application",
        "ServiceRole": { "Fn::GetAtt": ["CodeBuildServiceRole", "Arn"] },
        "Artifacts": {
          "Type": "CODEPIPELINE"
        },
        "Environment": {
          "Type": "LINUX_CONTAINER",
          "ComputeType": "BUILD_GENERAL1_MEDIUM",
          "Image": "aws/codebuild/amazonlinux2-x86_64-standard:3.0"
        },
        "Source": {
          "Type": "CODEPIPELINE",
          "BuildSpec": {
            "version": "0.2",
            "phases": {
              "pre_build": {
                "commands": [
                  "echo Logging in to Amazon ECR...",
                  "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
                ]
              },
              "build": {
                "commands": [
                  "echo Build started on `date`",
                  "echo Building the Docker image...",
                  "docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .",
                  "docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG"
                ]
              },
              "post_build": {
                "commands": [
                  "echo Build completed on `date`",
                  "echo Pushing the Docker image...",
                  "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG"
                ]
              }
            }
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CodePipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-pipeline" },
        "RoleArn": { "Fn::GetAtt": ["CodePipelineServiceRole", "Arn"] },
        "ArtifactStore": {
          "Type": "S3",
          "Location": { "Ref": "ArtifactStoreBucket" },
          "EncryptionKey": {
            "Id": { "Fn::GetAtt": ["KMSKey", "Arn"] },
            "Type": "KMS"
          }
        },
        "Stages": [
          {
            "Name": "Source",
            "Actions": [
              {
                "Name": "SourceAction",
                "ActionTypeId": {
                  "Category": "Source",
                  "Owner": "ThirdParty",
                  "Provider": "GitHub",
                  "Version": "1"
                },
                "Configuration": {
                  "Owner": { "Ref": "GitHubOwner" },
                  "Repo": { "Ref": "GitHubRepoName" },
                  "Branch": "main",
                  "OAuthToken": "{{resolve:secretsmanager:github-token}}"
                },
                "OutputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ]
              }
            ]
          },
          {
            "Name": "Build",
            "Actions": [
              {
                "Name": "BuildAction",
                "ActionTypeId": {
                  "Category": "Build",
                  "Owner": "AWS",
                  "Provider": "CodeBuild",
                  "Version": "1"
                },
                "Configuration": {
                  "ProjectName": { "Ref": "CodeBuildProject" }
                },
                "InputArtifacts": [
                  {
                    "Name": "SourceOutput"
                  }
                ],
                "OutputArtifacts": [
                  {
                    "Name": "BuildOutput"
                  }
                ]
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "LambdaDynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "${ProjectName}-api-function" },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n    const response = {\n        statusCode: 200,\n        body: JSON.stringify('Hello from Lambda!'),\n    };\n    return response;\n};"
        },
        "Description": "API Lambda function for microservices",
        "Timeout": 30,
        "MemorySize": 128,
        "Environment": {
          "Variables": {
            "TABLE_NAME": { "Ref": "DynamoDBTable" }
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Lambda function error rate alarm",
        "AlarmName": { "Fn::Sub": "${ProjectName}-lambda-errors" },
        "ComparisonOperator": "GreaterThanThreshold",
        "EvaluationPeriods": 2,
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Period": 300,
        "Statistic": "Sum",
        "Threshold": 5,
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": { "Ref": "LambdaFunction" }
          }
        ],
        "AlarmActions": [
          { "Ref": "SNSTopic" }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "APIGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-api" },
        "Description": "API Gateway for microservices",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "APIGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": { "Ref": "APIGateway" },
        "ParentId": { "Fn::GetAtt": ["APIGateway", "RootResourceId"] },
        "PathPart": "api"
      }
    },

    "APIGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": { "Ref": "APIGateway" },
        "ResourceId": { "Ref": "APIGatewayResource" },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": { "Fn::Sub": "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations" }
        }
      }
    },

    "APIGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "APIGatewayMethod",
      "Properties": {
        "RestApiId": { "Ref": "APIGateway" },
        "StageName": "prod"
      }
    },

    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": { "Ref": "LambdaFunction" },
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": { "Fn::Sub": "arn:aws:execute-api:us-east-1:${AWS::AccountId}:${APIGateway}/*/*/*" }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [
            {
              "DomainName": { "Fn::Sub": "${APIGateway}.execute-api.us-east-1.amazonaws.com" },
              "Id": "APIGatewayOrigin",
              "CustomOriginConfig": {
                "HTTPPort": 443,
                "OriginProtocolPolicy": "https-only"
              }
            }
          ],
          "Enabled": true,
          "DefaultCacheBehavior": {
            "TargetOriginId": "APIGatewayOrigin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            "CachedMethods": ["GET", "HEAD"],
            "ForwardedValues": {
              "QueryString": true,
              "Headers": ["Authorization"]
            }
          },
          "Comment": { "Fn::Sub": "${ProjectName} CloudFront Distribution" }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "10.0.0.0/16"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-EC2-SG" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-ALB-SG" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-ALB" },
        "Scheme": "internet-facing",
        "Type": "application",
        "Subnets": [
          { "Ref": "PublicSubnet" },
          { "Ref": "PrivateSubnet" }
        ],
        "SecurityGroups": [
          { "Ref": "ALBSecurityGroup" }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-TG" },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ],
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01"
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "${ProjectName}-launch-template" },
        "LaunchTemplateData": {
          "ImageId": { "Fn::FindInMap": ["AmazonLinuxAMI", { "Ref": "AWS::Region" }, "AMI"] },
          "InstanceType": "t3.micro",
          "SecurityGroupIds": [
            { "Ref": "EC2SecurityGroup" }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\necho '<h1>Hello from ${ProjectName}</h1>' > /var/www/html/index.html\necho 'OK' > /var/www/html/health\nsystemctl start httpd\nsystemctl enable httpd\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "${ProjectName}-instance" }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                }
              ]
            }
          ]
        }
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "${ProjectName}-ASG" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": 1,
        "MaxSize": 3,
        "DesiredCapacity": 2,
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet" }
        ],
        "TargetGroupARNs": [
          { "Ref": "ALBTargetGroup" }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-ASG" },
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          }
        ]
      }
    },

    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": { "Fn::Sub": "${ProjectName}-data" },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "KMSMasterKeyId": { "Ref": "KMSKey" }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "RDSSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "PublicSubnet" },
          { "Ref": "PrivateSubnet" }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "EC2SecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${ProjectName}-RDS-SG" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "${ProjectName}-database" },
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "AllocatedStorage": 20,
        "StorageType": "gp2",
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "KMSKey" },
        "DBName": "microservicesdb",
        "MasterUsername": { "Ref": "DatabaseUsername" },
        "MasterUserPassword": { "Ref": "DatabasePassword" },
        "VPCSecurityGroups": [
          { "Ref": "RDSSecurityGroup" }
        ],
        "DBSubnetGroupName": { "Ref": "RDSSubnetGroup" },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "DeletionProtection": true,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "${ProjectName}-notifications" },
        "DisplayName": "Pipeline Notifications",
        "KmsMasterKeyId": { "Ref": "KMSKey" },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "SNSSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "TopicArn": { "Ref": "SNSTopic" },
        "Protocol": "email",
        "Endpoint": { "Ref": "NotificationEmail" }
      }
    },

    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StepFunctionsExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": { "Fn::GetAtt": ["LambdaFunction", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "StepFunctionsStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": { "Fn::Sub": "${ProjectName}-orchestrator" },
        "RoleArn": { "Fn::GetAtt": ["StepFunctionsRole", "Arn"] },
        "DefinitionString": {
          "Fn::Sub": "{\n  \"Comment\": \"Lambda orchestration workflow\",\n  \"StartAt\": \"InvokeLambda\",\n  \"States\": {\n    \"InvokeLambda\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${LambdaFunction.Arn}\",\n      \"End\": true\n    }\n  }\n}"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "Properties": {
        "TrailName": { "Fn::Sub": "${ProjectName}-cloudtrail" },
        "S3BucketName": { "Ref": "CloudTrailBucket" },
        "IncludeGlobalServiceEvents": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "KMSKeyId": { "Ref": "KMSKey" },
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": ["arn:aws:s3:::*/*"]
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "${ProjectName}-cloudtrail-logs-${AWS::AccountId}" },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },

    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "CloudTrailBucket" },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${CloudTrailBucket}/*" },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            },
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": { "Ref": "CloudTrailBucket" }
            }
          ]
        }
      }
    },

    "CostAndUsageReport": {
      "Type": "AWS::CUR::ReportDefinition",
      "Properties": {
        "ReportName": { "Fn::Sub": "${ProjectName}-cost-usage-report" },
        "TimeUnit": "DAILY",
        "Format": "textORcsv",
        "Compression": "GZIP",
        "AdditionalSchemaElements": ["RESOURCES"],
        "S3Bucket": { "Ref": "CostReportBucket" },
        "S3Prefix": "cost-reports/",
        "S3Region": "us-east-1",
        "AdditionalArtifacts": ["REDSHIFT", "QUICKSIGHT"],
        "RefreshClosedReports": true,
        "ReportVersioning": "OVERWRITE_REPORT"
      }
    },

    "CostReportBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "${ProjectName}-cost-reports-${AWS::AccountId}" },
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC-ID" }
      }
    },
    "APIGatewayURL": {
      "Description": "API Gateway URL",
      "Value": { "Fn::Sub": "https://${APIGateway}.execute-api.us-east-1.amazonaws.com/prod" }
    },
    "CloudFrontURL": {
      "Description": "CloudFront Distribution URL",
      "Value": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] }
    },
    "CodePipelineName": {
      "Description": "CodePipeline Name",
      "Value": { "Ref": "CodePipeline" }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": { "Fn::GetAtt": ["LambdaFunction", "Arn"] }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Table Name",
      "Value": { "Ref": "DynamoDBTable" }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"] }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for notifications",
      "Value": { "Ref": "SNSTopic" }
    },
    "StepFunctionsArn": {
      "Description": "Step Functions State Machine ARN",
      "Value": { "Ref": "StepFunctionsStateMachine" }
    }
  }
}