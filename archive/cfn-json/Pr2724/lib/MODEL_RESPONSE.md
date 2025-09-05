### Reasoning Trace
---

I need to create a comprehensive CloudFormation template that meets all the specified requirements. Let me break down what I need to include:

1. **Parameters**: I should include some parameters for flexibility
2. **VPC and Networking**:
   - VPC
   - Internet Gateway
   - 3 public subnets (one in each AZ in us-east-1)
   - 3 private subnets (one in each AZ in us-east-1)
   - NAT Gateway (at least one, ideally one per AZ for HA)
   - Route tables for public and private subnets
   - Routes

3. **Security Groups**:
   - ALB security group (ports 80, 443)
   - EC2 security group (only accepts from ALB SG)

4. **Load Balancer**:
   - Application Load Balancer in public subnets
   - Target Group
   - Listener

5. **Auto Scaling**:
   - Launch Template
   - Auto Scaling Group (min=2, max=6)
   - Scaling across private subnets

6. **IAM**:
   - IAM role for EC2 instances
   - Instance profile
   - Policy for S3 access (least privilege)

7. **S3**:
   - S3 bucket for logs
   - Lifecycle policy (30 days)

8. **Outputs**:
   - Load Balancer DNS name
   - S3 bucket name

Let me think about the naming convention: <project-name>-<resource-type>-<unique-id>

I should use a parameter for project name and use Ref functions to build consistent names.

For AZs in us-east-1: us-east-1a, us-east-1b, us-east-1c

Let me start building the template:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly available web application stack with ALB, Auto Scaling Group, and S3 logging",
  "Parameters": {
    "ProjectName": {
      "Type": "String",
      "Default": "webapp",
      "Description": "Project name for resource naming convention"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type"
    }
  },
  "Resources": {
    // VPC
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {

I'll focus on the key parameters and initial resource configuration. The template sets up fundamental infrastructure parameters, allowing flexibility with project name and instance type. I'm establishing a framework for a scalable, configurable web application deployment with clear naming conventions and resource definitions.

The VPC configuration includes a standard 10.0.0.0/16 network range, enabling DNS hostnames and support for seamless network integration. I'll tag the VPC with a dynamic name using the project parameter to ensure clear resource identification.

I'm setting up three public subnets across different availability zones (us-east-1a, us-east-1b, us-east-1c) to enhance network resilience. Each subnet uses a unique /24 CIDR block within the main VPC range, configured to automatically assign public IP addresses for instances launched within them. The subnets are strategically distributed to provide high availability and fault tolerance across multiple zones.

Now I'll define three private subnets in corresponding availability zones, using distinct CIDR blocks from 10.0.11.0/24 to 10.0.13.0/24. These private subnets will support resources that don't require direct internet access, providing an additional layer of network segmentation and security. Each subnet is tagged with a descriptive name incorporating the project name and specific availability zone.

I'm preparing to establish a NAT Gateway, which will enable private subnet resources to access the internet while maintaining network isolation.

The NAT Gateway requires an Elastic IP address, which I'll allocate in the VPC. This EIP will be associated with the NAT Gateway, positioned in the first public subnet to facilitate outbound internet connectivity for private network resources.

I'll create route tables to manage network traffic routing. The public route table will handle internet-facing traffic, while the private route table will direct internal network communications and manage internet access through the NAT Gateway.

I'll establish route table associations to connect subnets with their appropriate routing configuration. Public subnets will be linked to the public route table, ensuring direct internet gateway access, while private subnets will connect to the private route table for controlled external communication.

The routing setup ensures network segmentation and secure internet connectivity, with explicit routes defined for both public and private network segments across multiple availability zones. I'll continue the security group configuration, focusing on the ingress rules for the EC2 instances:

          "ToPort": 22,
          "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 80,
          "ToPort": 80,
          "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
        }
      ],
      "Tags": [
        {
          "Key": "Name",
          "Value": {"Fn::Sub": "${ProjectName}-sg-ec2"}
        }
      ]
    },

I'm defining the EC2 security group with specific ingress rules. The group allows SSH access and HTTP traffic, but only from the Application Load Balancer's security group, ensuring controlled network access.

The S3 logs bucket configuration follows, implementing strict access controls and a 30-day retention policy for log management.

I'll define an IAM role policy that enables specific S3 object interactions, granting the EC2 instance permissions to write and read objects within the designated logs bucket. The policy uses a sub-referenced resource path to ensure precise access scoping.

The role includes a tag for clear identification, maintaining consistent naming conventions across the infrastructure deployment.

I'll create an instance profile that associates the previously defined EC2 role, enabling seamless integration with the launch template. This profile will allow the EC2 instances to assume the specified IAM role permissions.

The launch template configures an Amazon Linux 2 instance with predefined settings, including the instance profile, security group, and a base user data script for initial system updates. The template uses parameter references and sub-expressions to dynamically populate configuration values.

The application load balancer is designed as an internet-facing service, spanning multiple public subnets to ensure high availability and distributed traffic management. It will be configured with a specific security group to control inbound and outbound network access.

I'll set up a target group to route incoming HTTP traffic to the web servers, implementing health checks to monitor the instances' responsiveness. The configuration includes detailed parameters for assessing instance health, such as checking the root path every 30 seconds and defining thresholds for determining instance status.

The listener will be configured to forward traffic from the application load balancer to the target group on port 80, using standard HTTP protocol. This ensures seamless routing of web traffic to the appropriate backend instances.

An auto scaling group will be established to dynamically manage the web server instances, using a launch template to define the instance configuration. The group will be named according to the project, enabling flexible and scalable infrastructure management.

The auto scaling group is set to maintain between 2 and 6 instances, with an initial desired capacity of 2. It will distribute instances across three private subnets for high availability and fault tolerance. Health checks will be performed via the Elastic Load Balancer, with a 300-second grace period to allow instances time to initialize before being considered unhealthy.

The outputs section provides the DNS name of the Application Load Balancer and the name of the S3 bucket for application logs, enabling easy access to these critical infrastructure resources.

I'll use the Systems Manager Parameter Store to dynamically fetch the latest Amazon Linux 2 AMI, which provides a flexible and up-to-date approach to selecting the correct machine image. This method ensures I'm always using a current, supported AMI without manual updates.

I'll carefully review the template, focusing on:
- Updating the AMI selection method
- Verifying resource naming
- Checking intrinsic function accuracy
- Ensuring IAM policies follow least privilege principles

The parameter store path for the latest Amazon Linux 2 AMI in us-east-1 will help maintain template flexibility and currency.

I'll use the AWS Systems Manager Parameter Store to dynamically fetch the most recent Amazon Linux 2 AMI, which ensures I'm always using an up-to-date image.
### Answer 
---

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly available web application stack with ALB, Auto Scaling Group, and S3 logging",
  "Parameters": {
    "ProjectName": {
      "Type": "String",
      "Default": "webapp",
      "Description": "Project name for resource naming convention"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"],
      "Description": "EC2 instance type"
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
            "Value": {"Fn::Sub": "${ProjectName}-vpc-main"}
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
            "Value": {"Fn::Sub": "${ProjectName}-igw-main"}
          }
        ]
      }
    },
    "AttachGateway": {
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
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-public-1a"}
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-public-1b"}
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-public-1c"}
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-private-1a"}
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-private-1b"}
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": "us-east-1c",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-subnet-private-1c"}
          }
        ]
      }
    },
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-eip-nat"}
          }
        ]
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-nat-main"}
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
            "Value": {"Fn::Sub": "${ProjectName}-rt-public"}
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
            "Value": {"Fn::Sub": "${ProjectName}-rt-private"}
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
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
        "NatGatewayId": {"Ref": "NatGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VPC"},
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
            "Value": {"Fn::Sub": "${ProjectName}-sg-alb"}
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-sg-ec2"}
          }
        ]
      }
    },
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${ProjectName}-logs-${AWS::AccountId}-${AWS::Region}"},
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteLogsAfter30Days",
              "Status": "Enabled",
              "ExpirationInDays": 30
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
            "Value": {"Fn::Sub": "${ProjectName}-s3-logs"}
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "${ProjectName}-role-ec2"},
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
        "Policies": [
          {
            "PolicyName": {"Fn::Sub": "${ProjectName}-policy-s3logs"},
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {"Fn::Sub": "${LogsBucket}/*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-role-ec2"}
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "${ProjectName}-profile-ec2"},
        "Roles": [{"Ref": "EC2Role"}]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "${ProjectName}-lt-web"},
        "LaunchTemplateData": {
          "ImageId": {"Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2:1}}"},
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {
            "Name": {"Ref": "EC2InstanceProfile"}
          },
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Hello from ${AWS::Region}!</h1>' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {"Fn::Sub": "${ProjectName}-ec2-web"}
                }
              ]
            }
          ]
        }
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "${ProjectName}-alb-main"},
        "Scheme": "internet-facing",
        "Type": "application",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-alb-main"}
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "${ProjectName}-tg-web"},
        "Protocol": "HTTP",
        "Port": 80,
        "VpcId": {"Ref": "VPC"},
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 5,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-tg-web"}
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
            "TargetGroupArn": {"Ref": "TargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "${ProjectName}-asg-web"},
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": "2",
        "MaxSize": "6",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "TargetGroup"}],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "${ProjectName}-asg-web"},
            "PropagateAtLaunch": false
          }
        ]
      }
    }
  },
  "Outputs": {
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]}
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for application logs",
      "Value": {"Ref": "LogsBucket"}
    }
  }
}
```