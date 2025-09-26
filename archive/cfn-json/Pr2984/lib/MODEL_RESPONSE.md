### Reasoning Trace
---

I need to create a comprehensive CloudFormation JSON template that meets all the requirements specified. Let me break down what I need to include:

1. VPC with CIDR 10.0.0.0/16
2. DNS support and hostnames enabled
3. Three subnets:
   - Public: 10.0.1.0/24
   - Private A: 10.0.2.0/24
   - Private B: 10.0.3.0/24
4. Internet Gateway
5. NAT Gateway in public subnet
6. Security Group with HTTP/HTTPS inbound, all outbound
7. IAM roles with least privilege
8. VPC Flow Logs to CloudWatch
9. CloudWatch metrics and alarms
10. Route 53 for DNS
11. Application Load Balancer
12. Consistent tagging
13. CloudFormation Conditions
14. Required outputs

Let me structure this properly:

Parameters:
- Environment (for conditions)
- Application name

Conditions:
- Based on environment parameter

Resources:
- VPC
- Internet Gateway
- VPC Gateway Attachment
- Public Subnet
- Private Subnet A
- Private Subnet B
- Route Tables (public and private)
- Routes
- Subnet Route Table Associations
- NAT Gateway
- Elastic IP for NAT Gateway
- Security Group
- IAM Role for VPC Flow Logs
- IAM Policy for VPC Flow Logs
- CloudWatch Log Group
- VPC Flow Logs
- Application Load Balancer
- Target Group
- ALB Listener
- Route 53 Hosted Zone
- CloudWatch Alarms

Outputs:
- VPC ID
- Public Subnet ID
- Private Subnet IDs
- Security Group ID

Let me make sure I include all the requirements and follow AWS best practices.
### Answer 
---

# CloudFormation VPC Infrastructure Template

Below is a production-grade CloudFormation JSON template that meets all your specified requirements:

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
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-vpc-${Environment}"}
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
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-igw-${Environment}"}
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
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-public-subnet-${Environment}"}
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
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-subnet-a-${Environment}"}
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
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-subnet-b-${Environment}"}
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
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-nat-eip-${Environment}"}
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
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-nat-gateway-${Environment}"}
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
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-public-rt-${Environment}"}
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
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ApplicationName}-private-rt-${Environment}"}
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
      "Properties": {
        "GroupName": {"Fn::Sub": "${ApplicationName}-web-sg-${Environment}"},
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
            "Value": {"Fn::Sub": "${ApplicationName}-web-sg-${Environment}"}
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
      "Properties": {
        "RoleName": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-role-${Environment}"},
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
                  "Resource": {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${ApplicationName}-vpc-flow-logs-${Environment}:*"}
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
      "Properties": {
        "LogGroupName": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-${Environment}"},
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
            "Value": {"Fn::Sub": "${ApplicationName}-vpc-flow-logs-${Environment}"}
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
      "Properties": {
        "Name": {"Fn::Sub": "${ApplicationName}-alb-${Environment}"},
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
            "Value": {"Fn::Sub": "${ApplicationName}-alb-${Environment}"}
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
      "Properties": {
        "Name": {"Fn::Sub": "${ApplicationName}-tg-${Environment}"},
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
      "Properties": {
        "Name": {"Ref": "DomainName"},
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
      "Properties": {
        "DashboardName": {"Fn::Sub": "${ApplicationName}-${Environment}-dashboard"},
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
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ApplicationName}-${Environment}-high-request-count"},
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

## Key Features Implemented

### 🏗️ **Infrastructure Components**
- **VPC**: 10.0.0.0/16 with DNS support enabled
- **Subnets**: Public (10.0.1.0/24), Private A (10.0.2.0/24), Private B (10.0.3.0/24)
- **Internet Gateway**: For public internet access
- **NAT Gateway**: Enables private subnet internet access
- **Route Tables**: Proper routing for public and private subnets

### 🔒 **Security Features**
- **Security Groups**: HTTP/HTTPS inbound, all outbound traffic allowed
- **IAM Roles**: Least privilege for VPC Flow Logs
- **Encryption**: AWS-managed keys for CloudWatch Logs
- **VPC Flow Logs**: Comprehensive network monitoring

### 📊 **Monitoring & Observability**
- **VPC Flow Logs**: All traffic logged to CloudWatch
- **CloudWatch Dashboard**: Visual monitoring (production/staging only)
- **CloudWatch Alarms**: High request count monitoring
- **Log Retention**: 90 days for production, 30 days for other environments

### 🌐 **DNS & Load Balancing**
- **Route 53**: Private hosted zone (production only)
- **Application Load Balancer**: Internal ALB for private subnets
- **Target Group**: Health checks configured
- **Multi-AZ**: High availability across availability zones

### 🏷️ **Resource Management**
- **Consistent Tagging**: Environment and Application tags on all resources
- **CloudFormation Conditions**: Environment-based resource creation
- **Parameterization**: Flexible deployment across environments
- **Outputs**: All required resource IDs exported

## Deployment Instructions

1. **Save** the template as `vpc_setup.json`
2. **Deploy** using AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name my-vpc-infrastructure \
     --template-body file://vpc_setup.json \
     --parameters ParameterKey=Environment,ParameterValue=production \
                  ParameterKey=ApplicationName,ParameterValue=my-webapp \
                  ParameterKey=DomainName,ParameterValue=mycompany.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

This template follows AWS best practices for production deployments, implements comprehensive security measures, and provides the foundation for a scalable multi-tier web application infrastructure.