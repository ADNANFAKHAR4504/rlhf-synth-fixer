# Product Catalog API Infrastructure - CloudFormation Template

This CloudFormation template creates a highly available web application infrastructure for the product catalog API with auto-scaling, load balancing, and monitoring.

## Architecture Overview

The template deploys:
- Application Load Balancer across 3 availability zones
- Auto Scaling Group with EC2 instances
- CloudWatch alarms for auto-scaling
- IAM roles for EC2 instance permissions
- Security groups for network isolation

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Product Catalog API Infrastructure with ALB, ASG, and Auto-Scaling",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "Default": "dev"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where resources will be deployed"
    },
    "PublicSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "Public subnet IDs for ALB (3 subnets across 3 AZs)"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "Private subnet IDs for EC2 instances (3 subnets across 3 AZs)"
    },
    "AmiId": {
      "Type": "AWS::EC2::Image::Id",
      "Description": "Amazon Linux 2 AMI ID",
      "Default": "ami-0c55b159cbfafe1f0"
    },
    "SSLCertificateArn": {
      "Type": "String",
      "Description": "ARN of SSL certificate for HTTPS listener"
    }
  },
  "Resources": {
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VpcId"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-api-alb-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI"
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTP from ALB only"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-api-ec2-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "product-api-alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": {
          "Ref": "PublicSubnetIds"
        },
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI"
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "product-api-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VpcId"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/api/v1/health",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "TargetGroupAttributes": [
          {
            "Key": "stickiness.enabled",
            "Value": "true"
          },
          {
            "Key": "stickiness.type",
            "Value": "lb_cookie"
          },
          {
            "Key": "stickiness.lb_cookie.duration_seconds",
            "Value": "86400"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI"
          }
        ]
      }
    },
    "HTTPSListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": {
              "Ref": "SSLCertificateArn"
            }
          }
        ],
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "product-api-ec2-role-${EnvironmentSuffix}"
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
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/product-api/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI"
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "product-api-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "EC2Role"
          }
        ]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "product-api-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "AmiId"
          },
          "InstanceType": "t3.medium",
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
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<html><body><h1>Product Catalog API - ${EnvironmentSuffix}</h1></body></html>' > /var/www/html/index.html\nmkdir -p /var/www/html/api/v1\necho 'OK' > /var/www/html/api/v1/health\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "product-api-instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "Application",
                  "Value": "ProductCatalogAPI"
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
        "AutoScalingGroupName": {
          "Fn::Sub": "product-api-asg-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "2",
        "MaxSize": "8",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": {
          "Ref": "PrivateSubnetIds"
        },
        "TargetGroupARNs": [
          {
            "Ref": "TargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-api-asg-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          },
          {
            "Key": "Application",
            "Value": "ProductCatalogAPI",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "HighCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "product-api-high-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Trigger when CPU exceeds 70%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    },
    "LowCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "product-api-low-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Trigger when CPU falls below 30%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "product-api-alb-dns-${EnvironmentSuffix}"
        }
      }
    },
    "TargetGroupArn": {
      "Description": "ARN of the Target Group for CI/CD integration",
      "Value": {
        "Ref": "TargetGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "product-api-tg-arn-${EnvironmentSuffix}"
        }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Name of the Auto Scaling Group",
      "Value": {
        "Ref": "AutoScalingGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "product-api-asg-name-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Existing VPC with public and private subnets across 3 availability zones
3. SSL certificate in ACM for HTTPS
4. Amazon Linux 2 AMI ID for your region

### Deployment Steps

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name product-catalog-api-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PublicSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-aaa,subnet-bbb,subnet-ccc" \
    ParameterKey=AmiId,ParameterValue=ami-xxxxx \
    ParameterKey=SSLCertificateArn,ParameterValue=arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --capabilities CAPABILITY_NAMED_IAM

# Check stack status
aws cloudformation describe-stacks \
  --stack-name product-catalog-api-dev \
  --query 'Stacks[0].StackStatus'

# Get outputs
aws cloudformation describe-stacks \
  --stack-name product-catalog-api-dev \
  --query 'Stacks[0].Outputs'
```

### Testing

```bash
# Get the ALB DNS name from outputs
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name product-catalog-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Test the health endpoint
curl https://${ALB_DNS}/api/v1/health

# Monitor auto-scaling
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names product-api-asg-dev
```

## Features Implemented

- Application Load Balancer with SSL termination
- Auto Scaling Group with 2-8 instances
- Target Group with health checks on /api/v1/health
- CloudWatch alarms for CPU-based auto-scaling
- IAM role with Parameter Store and CloudWatch permissions
- Security groups with least privilege access
- IMDSv2 enforcement on EC2 instances
- Resource tagging for Production environment