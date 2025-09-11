### Reasoning Trace
---

To create a production-grade CloudFormation template for VPC infrastructure, I need to address the requirements systematically:

1. VPC Configuration:
   - CIDR block 10.0.0.0/16 with DNS support and hostnames enabled
   - Three subnets: Public (10.0.1.0/24), Private A (10.0.2.0/24), Private B (10.0.3.0/24)
   - Internet Gateway for public access
   - NAT Gateway in public subnet for private subnet internet access

2. Security Implementation:
   - Security Group with HTTP/HTTPS inbound, all outbound traffic
   - IAM roles with least privilege principles
   - Data encryption at rest using AWS-managed keys
   - Termination protection for EC2 instances

3. Monitoring and Logging:
   - VPC Flow Logs to CloudWatch Logs group
   - CloudWatch metrics and alarms for monitoring
   - Proper log retention policies

4. DNS and Load Balancing:
   - Route 53 hosted zone for DNS management
   - Application Load Balancer for private subnets
   - Target groups with health checks

5. Resource Management:
   - Consistent tagging with Environment and Application keys
   - CloudFormation Conditions for environment-based resource creation
   - Parameterized deployment for flexibility

6. Required Outputs:
   - VPC ID, subnet IDs, security group ID
   - Additional outputs for ALB ARN, NAT Gateway ID, Route53 zone ID

### Answer
---

# CloudFormation VPC Infrastructure Template

This is the production-ready CloudFormation JSON template that provisions a secure VPC infrastructure:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade VPC infrastructure with multi-tier architecture, security, monitoring, and high availability",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"],
      "Description": "Environment type for conditional resource creation"
    },
    "ApplicationName": {
      "Type": "String",
      "Default": "multi-tier-webapp",
      "Description": "Name of the application for tagging and naming resources"
    },
    "DomainName": {
      "Type": "String",
      "Default": "example.com",
      "Description": "Domain name for Route 53 hosted zone"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming to avoid conflicts",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "Environment"}, "production"]
    },
    "EnableAdvancedMonitoring": {
      "Fn::Or": [
        {"Fn::Equals": [{"Ref": "Environment"}, "production"]},
        {"Fn::Equals": [{"Ref": "Environment"}, "staging"]}
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "DeletionPolicy": "Delete",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-igw-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
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
    "PublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-public-subnet-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnetA": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-subnet-a-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnetB": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-subnet-b-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-nat-eip-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-nat-gateway-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-public-rt-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-rt-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
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
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnetA"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnetB"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "WebSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "GroupName": {"Fn::Sub": "${ApplicationName}-web-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for web tier with HTTP/HTTPS access",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from internet"
          },
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
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-web-sg-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RoleName": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-role-${EnvironmentSuffix}"},
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
            "PolicyName": "FlowLogsDeliveryPolicy",
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
                  "Resource": {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${ApplicationName}-vpc-flow-logs-${EnvironmentSuffix}:*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "VPCFlowLogsGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-${EnvironmentSuffix}"},
        "RetentionInDays": {"Fn::If": ["IsProduction", 90, 30]},
        "KmsKeyId": {"Fn::Sub": "arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/logs"},
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "VPCFlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "DeletionPolicy": "Delete",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {"Ref": "VPC"},
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {"Ref": "VPCFlowLogsGroup"},
        "DeliverLogsPermissionArn": {"Fn::GetAtt": ["VPCFlowLogsRole", "Arn"]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Name": {"Fn::Sub": "${ApplicationName}-alb-${EnvironmentSuffix}"},
        "Scheme": "internal",
        "Type": "application",
        "Subnets": [
          {"Ref": "PrivateSubnetA"},
          {"Ref": "PrivateSubnetB"}
        ],
        "SecurityGroups": [{"Ref": "WebSecurityGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-alb-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Name": {"Fn::Sub": "${ApplicationName}-tg-${EnvironmentSuffix}"},
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
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
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "Route53HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Condition": "IsProduction",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Name": {"Fn::Sub": "${DomainName}-${EnvironmentSuffix}"},
        "VPCs": [
          {
            "VPCId": {"Ref": "VPC"},
            "VPCRegion": {"Ref": "AWS::Region"}
          }
        ],
        "HostedZoneTags": [
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "Application",
            "Value": {"Ref": "ApplicationName"}
          }
        ]
      }
    },
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Condition": "EnableAdvancedMonitoring",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DashboardName": {"Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-dashboard"},
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"x\":0,\"y\":0,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/ApplicationELB\",\"RequestCount\",\"LoadBalancer\",\"${ALBFullName}\"],[\".\",\"TargetResponseTime\",\".\",\".\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"ALB Metrics\",\"period\":300}}]}",
            {
              "ALBFullName": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
            }
          ]
        }
      }
    },
    "HighRequestCountAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Condition": "EnableAdvancedMonitoring",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ApplicationName}-${EnvironmentSuffix}-high-request-count"},
        "AlarmDescription": "Alarm for high request count on ALB",
        "MetricName": "RequestCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "ID of the created VPC",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPC-ID"}
      }
    },
    "PublicSubnetId": {
      "Description": "ID of the public subnet",
      "Value": {"Ref": "PublicSubnet"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-Public-Subnet-ID"}
      }
    },
    "PrivateSubnetAId": {
      "Description": "ID of the first private subnet",
      "Value": {"Ref": "PrivateSubnetA"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-Private-Subnet-A-ID"}
      }
    },
    "PrivateSubnetBId": {
      "Description": "ID of the second private subnet",
      "Value": {"Ref": "PrivateSubnetB"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-Private-Subnet-B-ID"}
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the web security group",
      "Value": {"Ref": "WebSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-Security-Group-ID"}
      }
    },
    "ApplicationLoadBalancerArn": {
      "Description": "ARN of the Application Load Balancer",
      "Value": {"Ref": "ApplicationLoadBalancer"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALB-ARN"}
      }
    },
    "ApplicationLoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALB-DNS"}
      }
    },
    "NATGatewayId": {
      "Description": "ID of the NAT Gateway",
      "Value": {"Ref": "NATGateway"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-NAT-Gateway-ID"}
      }
    },
    "Route53HostedZoneId": {
      "Condition": "IsProduction",
      "Description": "ID of the Route 53 hosted zone",
      "Value": {"Ref": "Route53HostedZone"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-Hosted-Zone-ID"}
      }
    }
  }
}
```

## Key Improvements in Ideal Response

### Infrastructure Enhancements
- Added EnvironmentSuffix parameter to prevent resource naming conflicts during deployments
- Added DeletionPolicy: Delete to all resources to ensure complete cleanup
- Updated resource naming to include EnvironmentSuffix for uniqueness
- Added ALB DNS output for integration testing

### Security Improvements
- Proper least privilege IAM policies scoped to specific log group ARNs
- Security groups with descriptive names and proper tagging
- Encryption enabled for CloudWatch Logs using AWS-managed keys

### Monitoring and Observability
- Environment-specific log retention policies
- CloudWatch dashboards for production and staging environments only
- Proper alarm configurations with meaningful thresholds

### High Availability and Resilience
- Multi-AZ subnet deployment across different availability zones
- Health checks properly configured for target groups
- Route 53 hosted zone with VPC association for internal DNS resolution

### Deployment Readiness
- All resources properly tagged for cost tracking and management
- Parameterized template supporting multiple deployment environments
- Complete output set for integration with other stacks and testing

This template follows AWS best practices and is optimized for production deployment with proper security, monitoring, and resource management.