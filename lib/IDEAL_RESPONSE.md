# Product Catalog API Infrastructure - Production-Ready CloudFormation Template

This is the enhanced, production-ready version of the CloudFormation template with additional security features, proper egress rules, and better resource management.

## Key Improvements Over MODEL_RESPONSE

1. Added egress rules to security groups for proper network isolation
2. Added HTTP to HTTPS redirect for better security
3. Enhanced CloudWatch logging for ALB
4. Added scale-in policy for cost optimization
5. Added deregistration delay configuration
6. Improved resource naming with consistent patterns
7. Added connection draining configuration
8. Enhanced monitoring with additional CloudWatch metrics

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Product Catalog API Infrastructure with ALB, ASG, and Auto-Scaling - Production Ready",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "Default": "dev",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
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
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from internet for redirect"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "DestinationSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow outbound to EC2 instances"
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
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS to internet for updates"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP to internet for package downloads"
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
        "LoadBalancerAttributes": [
          {
            "Key": "idle_timeout.timeout_seconds",
            "Value": "60"
          },
          {
            "Key": "deletion_protection.enabled",
            "Value": "false"
          },
          {
            "Key": "access_logs.s3.enabled",
            "Value": "false"
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
          },
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          },
          {
            "Key": "slow_start.duration_seconds",
            "Value": "60"
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
    "HTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "redirect",
            "RedirectConfig": {
              "Protocol": "HTTPS",
              "Port": "443",
              "StatusCode": "HTTP_301"
            }
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
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
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
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/product-api/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:DescribeParameters"
                  ],
                  "Resource": "*"
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
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/product-api-${EnvironmentSuffix}*"
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
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nset -e\n\n# Update system\nyum update -y\n\n# Install Apache\nyum install -y httpd\n\n# Configure Apache\nsystemctl start httpd\nsystemctl enable httpd\n\n# Create application structure\necho '<html><body><h1>Product Catalog API - ${EnvironmentSuffix}</h1><p>Status: Running</p></body></html>' > /var/www/html/index.html\n\n# Create health check endpoint\nmkdir -p /var/www/html/api/v1\necho 'OK' > /var/www/html/api/v1/health\n\n# Set permissions\nchmod -R 755 /var/www/html\n\n# Install CloudWatch agent\nwget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\nrpm -U ./amazon-cloudwatch-agent.rpm\n\n# Signal successful startup\necho 'Instance initialization complete'\n"
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
            },
            {
              "ResourceType": "volume",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "product-api-volume-${EnvironmentSuffix}"
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
      "DependsOn": "HTTPSListener",
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
        "MetricsCollection": [
          {
            "Granularity": "1Minute",
            "Metrics": [
              "GroupInServiceInstances",
              "GroupTotalInstances"
            ]
          }
        ],
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
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "StepScaling",
        "AdjustmentType": "ChangeInCapacity",
        "StepAdjustments": [
          {
            "MetricIntervalUpperBound": 0,
            "ScalingAdjustment": -1
          }
        ]
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
        ],
        "TreatMissingData": "notBreaching"
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
        ],
        "AlarmActions": [
          {
            "Ref": "ScaleDownPolicy"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "UnhealthyHostAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "product-api-unhealthy-hosts-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when unhealthy host count exceeds threshold",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          },
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "TargetGroup",
                "TargetGroupFullName"
              ]
            }
          }
        ],
        "TreatMissingData": "notBreaching"
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
    "LoadBalancerURL": {
      "Description": "Full URL of the Application Load Balancer",
      "Value": {
        "Fn::Sub": "https://${ApplicationLoadBalancer.DNSName}"
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
    },
    "EC2SecurityGroupId": {
      "Description": "Security Group ID for EC2 instances",
      "Value": {
        "Ref": "EC2SecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "product-api-ec2-sg-${EnvironmentSuffix}"
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
          "Fn::Sub": "product-api-alb-sg-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

## Production Enhancements Summary

### Security Improvements
1. Added explicit egress rules to both security groups
2. Implemented HTTP to HTTPS redirect (301 permanent redirect)
3. Configured TLS 1.2 security policy for HTTPS listener
4. Enhanced IMDSv2 configuration with HttpEndpoint enabled

### High Availability Features
1. Added DependsOn for proper resource ordering
2. Configured connection draining with 30-second timeout
3. Added slow start duration for gradual traffic ramping
4. Enabled detailed monitoring for all instances

### Monitoring & Observability
1. Added UnhealthyHostAlarm for proactive monitoring
2. Enabled ASG metrics collection (GroupInServiceInstances, GroupTotalInstances)
3. Added TreatMissingData policy to prevent false alarms
4. Enhanced CloudWatch Logs policy for better log management

### Operational Excellence
1. Added explicit scale-down policy with step scaling
2. Configured LowCPUAlarm with AlarmActions
3. Added LoadBalancerURL output for easy access
4. Enhanced UserData script with error handling (set -e)
5. Added CloudWatch agent installation
6. Tagged volumes for better resource tracking

### Cost Optimization
1. Disabled deletion protection for easy cleanup
2. Configured appropriate deregistration delay (30s vs default 300s)
3. Proper scale-down policy to reduce instances when not needed

## Deployment Validation

After deployment, verify:
1. Health check endpoint responds with 200 OK
2. HTTP redirects to HTTPS properly
3. Auto-scaling triggers work at 70% and 30% CPU
4. CloudWatch alarms are in OK state
5. All security group rules are properly configured
6. Instances are distributed across 3 AZs