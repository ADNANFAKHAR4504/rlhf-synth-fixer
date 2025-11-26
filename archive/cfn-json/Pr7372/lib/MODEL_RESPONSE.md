# CloudFormation Infrastructure for Product Catalog API

This document contains the complete CloudFormation JSON template for deploying a high-availability product catalog API infrastructure.

## File: lib/product-catalog-infrastructure.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "High-availability infrastructure for Product Catalog API with ALB, Auto Scaling, and CloudWatch monitoring",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 3,
      "MaxLength": 20
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where resources will be deployed"
    },
    "PublicSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of public subnet IDs for ALB (must span 3 AZs)"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of private subnet IDs for EC2 instances (must span 3 AZs)"
    },
    "CertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS termination on ALB"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID from SSM Parameter Store"
    }
  },
  "Resources": {
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer allowing HTTPS from internet",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from internet"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "DestinationSecurityGroupId": {
              "Ref": "InstanceSecurityGroup"
            },
            "Description": "Allow HTTP traffic to instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
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
    "InstanceSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "instance-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EC2 instances allowing HTTP from ALB only",
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
            "Description": "Allow HTTP traffic from ALB"
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
              "Fn::Sub": "instance-sg-${EnvironmentSuffix}"
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
    "InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "product-catalog-instance-role-${EnvironmentSuffix}"
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
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/product-catalog/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/product-catalog-${EnvironmentSuffix}:*"
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
    "InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "product-catalog-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "InstanceRole"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "product-catalog-alb-${EnvironmentSuffix}"
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-catalog-alb-${EnvironmentSuffix}"
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
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "product-catalog-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VpcId"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/api/v1/health",
        "HealthCheckProtocol": "HTTP",
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
          },
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-catalog-tg-${EnvironmentSuffix}"
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
    "ALBListener": {
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
              "Ref": "CertificateArn"
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
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "product-catalog-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": "t3.medium",
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "InstanceSecurityGroup"
            }
          ],
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\nmkdir -p /var/www/html/api/v1\necho '{\"status\":\"healthy\",\"service\":\"product-catalog\"}' > /var/www/html/api/v1/health\necho '<h1>Product Catalog API - ${EnvironmentSuffix}</h1>' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "product-catalog-instance-${EnvironmentSuffix}"
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
            },
            {
              "ResourceType": "volume",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "product-catalog-volume-${EnvironmentSuffix}"
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
          "Fn::Sub": "product-catalog-asg-${EnvironmentSuffix}"
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
        "MinSize": 2,
        "MaxSize": 8,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "VPCZoneIdentifier": {
          "Ref": "PrivateSubnetIds"
        },
        "TargetGroupARNs": [
          {
            "Ref": "TargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "product-catalog-asg-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": false
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
      },
      "DependsOn": [
        "ALBListener"
      ]
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
          "Fn::Sub": "product-catalog-high-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ASG average CPU exceeds 70%",
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
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LowCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "product-catalog-low-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ASG average CPU falls below 30%",
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
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer for deployment pipeline integration",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
        }
      }
    },
    "TargetGroupArn": {
      "Description": "ARN of the Target Group for CI/CD automation",
      "Value": {
        "Ref": "TargetGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TargetGroup-ARN"
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
          "Fn::Sub": "${AWS::StackName}-ASG-Name"
        }
      }
    },
    "InstanceSecurityGroupId": {
      "Description": "Security Group ID for EC2 instances",
      "Value": {
        "Ref": "InstanceSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Instance-SG"
        }
      }
    },
    "ALBSecurityGroupId": {
      "Description": "Security Group ID for Application Load Balancer",
      "Value": {
        "Ref": "ALBSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-SG"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Product Catalog API Infrastructure

CloudFormation template for deploying a high-availability product catalog API infrastructure with Auto Scaling, Application Load Balancer, and CloudWatch monitoring.

## Architecture Overview

This infrastructure deploys:
- Application Load Balancer across 3 availability zones with HTTPS termination
- Auto Scaling Group with t3.medium instances (min: 2, max: 8)
- Target Group with health checks on /api/v1/health
- CloudWatch alarms for CPU-based scaling (70% scale-out, 30% scale-in)
- IAM roles for Parameter Store and CloudWatch Logs access
- Security groups with proper isolation

## Prerequisites

1. **VPC Setup**: Existing VPC with:
   - 3 public subnets for ALB (in us-east-1a, us-east-1b, us-east-1c)
   - 3 private subnets for EC2 instances
   - Internet Gateway attached to public subnets
   - NAT Gateways or VPC Endpoints for private subnet internet access

2. **ACM Certificate**: Valid SSL/TLS certificate in ACM for HTTPS termination

3. **AWS CLI**: Version 2.x or later configured with appropriate permissions

## Deployment Instructions

### Step 1: Prepare Parameters

Create a parameters file `parameters.json`:

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "prod-001"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxx"
  },
  {
    "ParameterKey": "PublicSubnetIds",
    "ParameterValue": "subnet-xxxxx,subnet-yyyyy,subnet-zzzzz"
  },
  {
    "ParameterKey": "PrivateSubnetIds",
    "ParameterValue": "subnet-aaaaa,subnet-bbbbb,subnet-ccccc"
  },
  {
    "ParameterKey": "CertificateArn",
    "ParameterValue": "arn:aws:acm:us-east-1:xxxxxxxxxxxx:certificate/xxxxx"
  }
]
```

### Step 2: Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/product-catalog-infrastructure.json \
  --region us-east-1
```

### Step 3: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name product-catalog-api-prod-001 \
  --template-body file://lib/product-catalog-infrastructure.json \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags Key=Environment,Value=Production Key=Application,Value=ProductCatalogAPI
```

### Step 4: Monitor Deployment

```bash
aws cloudformation describe-stack-events \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1 \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table
```

### Step 5: Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Testing the Deployment

### Health Check

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

curl -k https://${ALB_DNS}/api/v1/health
```

Expected response:
```json
{"status":"healthy","service":"product-catalog"}
```

### Verify Auto Scaling

```bash
ASG_NAME=$(aws cloudformation describe-stacks \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AutoScalingGroupName`].OutputValue' \
  --output text)

aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names ${ASG_NAME} \
  --region us-east-1
```

### Verify CloudWatch Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix product-catalog \
  --region us-east-1
```

## Cleanup

To delete the infrastructure:

```bash
aws cloudformation delete-stack \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name product-catalog-api-prod-001 \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `resource-type-${EnvironmentSuffix}`

Examples:
- ALB: `product-catalog-alb-prod-001`
- ASG: `product-catalog-asg-prod-001`
- Target Group: `product-catalog-tg-prod-001`
- Security Groups: `alb-sg-prod-001`, `instance-sg-prod-001`

## Scaling Behavior

- **Scale Out**: Triggered when average CPU > 70% for 10 minutes (2 periods of 5 minutes)
- **Scale In**: Triggered when average CPU < 30% for 10 minutes (2 periods of 5 minutes)
- **Health Check Grace Period**: 5 minutes after instance launch
- **Target Tracking**: Automatically maintains 70% average CPU utilization

## Security Features

1. **ALB Security Group**: Only HTTPS (443) from internet
2. **Instance Security Group**: Only HTTP (80) from ALB
3. **IMDSv2**: Required for all EC2 instances
4. **IAM Least Privilege**: Scoped to specific Parameter Store paths and CloudWatch Logs
5. **SSL/TLS**: All external traffic encrypted via ACM certificate

## Monitoring and Alarms

CloudWatch alarms are configured for:
- High CPU utilization (>70%)
- Low CPU utilization (<30%)

Additional monitoring can be added for:
- ALB target response time
- ALB request count
- Unhealthy target count
- Network in/out

## Troubleshooting

### Instances Not Registering with Target Group

Check:
1. Security group allows ALB → Instance traffic on port 80
2. Health check path `/api/v1/health` is accessible
3. Instances are in private subnets specified in parameters
4. UserData script executed successfully (check /var/log/cloud-init-output.log)

### ALB Returns 503 Service Unavailable

Check:
1. At least one healthy target in target group
2. Health check passing (200 OK from /api/v1/health)
3. Instances have network connectivity

### Auto Scaling Not Working

Check:
1. CloudWatch alarms are in ALARM state
2. Scaling policy is attached to ASG
3. ASG has not reached max capacity (8 instances)
4. IAM permissions for Auto Scaling service

## Cost Optimization

Current configuration costs (approximate monthly):
- ALB: ~$22.50 (720 hours)
- t3.medium instances: ~$30/instance (2-8 instances)
- Data transfer: Variable based on traffic
- CloudWatch: Minimal (included in free tier for basic monitoring)

To reduce costs:
- Use t3.small instances if 2 vCPU not required
- Implement VPC Endpoints instead of NAT Gateways ($32.40/month per NAT Gateway)
- Schedule scaling for known traffic patterns
- Use Savings Plans or Reserved Instances for predictable workloads

## Additional Features (Optional)

To add optional features mentioned in requirements:

### RDS Aurora Serverless v2

Add to CloudFormation template for managed PostgreSQL database with automatic scaling.

### ElastiCache Redis

Add Redis cluster for session storage and caching to improve API response times.

### AWS WAF

Attach WAF WebACL to ALB for protection against:
- SQL injection
- Cross-site scripting (XSS)
- Rate-based rules
- Geographic restrictions
```

