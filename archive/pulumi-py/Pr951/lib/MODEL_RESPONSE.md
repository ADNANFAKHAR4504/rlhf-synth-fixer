# AWS Nova Model Breaking - Secure Infrastructure with Pulumi

I'll create a comprehensive, secure, and scalable AWS infrastructure using Pulumi in Python. This solution addresses all requirements while following best practices for production environments.

## Project Structure

```
aws-nova-infrastructure/
├── __main__.py
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── Pulumi.prod.yaml
├── requirements.txt
├── infrastructure/
│   ├── __init__.py
│   ├── vpc.py
│   ├── security.py
│   ├── compute.py
│   ├── api_gateway.py
│   ├── monitoring.py
│   └── kms.py
└── lambda/
    └── health_check.py
```

## Core Infrastructure Files

### `__main__.py`
```python
"""
Main Pulumi program for AWS Nova Model Breaking infrastructure.
Deploys secure and scalable cloud infrastructure on AWS.
"""

import pulumi
from infrastructure import (
    vpc,
    security,
    compute,
    api_gateway,
    monitoring,
    kms
)
from typing import Dict, Any


def main() -> None:
    """Main function to orchestrate infrastructure deployment."""
    # Get configuration
    config = pulumi.Config()
    environment = config.require("environment")
    
    # Common tags for all resources
    common_tags: Dict[str, str] = {
        "Environment": "Production",
        "Project": "AWS-Nova-Model-Breaking",
        "ManagedBy": "Pulumi"
    }
    
    # Create KMS key first (needed by other resources)
    kms_key = kms.create_kms_key(common_tags)
    
    # Create VPC and networking
    vpc_resources = vpc.create_vpc(common_tags)
    
    # Create security groups
    security_groups = security.create_security_groups(
        vpc_resources["vpc"], 
        common_tags
    )
    
    # Create IAM roles and EC2 instances
    compute_resources = compute.create_compute_resources(
        vpc_resources["subnets"],
        security_groups["web_sg"],
        kms_key,
        common_tags
    )
    
    # Create API Gateway with logging
    api_resources = api_gateway.create_api_gateway(
        kms_key,
        common_tags
    )
    
    # Create monitoring and health check Lambda
    monitoring_resources = monitoring.create_monitoring(
        vpc_resources["subnets"],
        security_groups["lambda_sg"],
        compute_resources["instances"],
        kms_key,
        common_tags
    )
    
    # Export important values
    pulumi.export("vpc_id", vpc_resources["vpc"].id)
    pulumi.export("subnet_ids", [subnet.id for subnet in vpc_resources["subnets"]])
    pulumi.export("instance_ids", [instance.id for instance in compute_resources["instances"]])
    pulumi.export("api_gateway_url", api_resources["api_url"])
    pulumi.export("kms_key_id", kms_key.id)


if __name__ == "__main__":
    main()
```

### `infrastructure/vpc.py`
```python
"""VPC and networking infrastructure components."""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any


def create_vpc(tags: Dict[str, str]) -> Dict[str, Any]:
    """
    Create VPC with subnets in different availability zones.
    
    Args:
        tags: Common resource tags
        
    Returns:
        Dictionary containing VPC and subnet resources
    """
    # Create VPC
    vpc = aws.ec2.Vpc(
        "nova-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            **tags,
            "Name": "nova-production-vpc"
        }
    )
    
    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        "nova-igw",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": "nova-production-igw"
        }
    )
    
    # Get availability zones
    azs = aws.get_availability_zones(state="available")
    
    # Create public subnets in different AZs
    subnets: List[aws.ec2.Subnet] = []
    for i in range(2):
        subnet = aws.ec2.Subnet(
            f"nova-subnet-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+1}.0/24",
            availability_zone=azs.names[i],
            map_public_ip_on_launch=True,
            tags={
                **tags,
                "Name": f"nova-production-subnet-{i+1}",
                "Type": "Public"
            }
        )
        subnets.append(subnet)
    
    # Create route table
    route_table = aws.ec2.RouteTable(
        "nova-rt",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
            )
        ],
        tags={
            **tags,
            "Name": "nova-production-rt"
        }
    )
    
    # Associate subnets with route table
    for i, subnet in enumerate(subnets):
        aws.ec2.RouteTableAssociation(
            f"nova-rta-{i+1}",
            subnet_id=subnet.id,
            route_table_id=route_table.id
        )
    
    return {
        "vpc": vpc,
        "subnets": subnets,
        "igw": igw,
        "route_table": route_table
    }
```

### `infrastructure/security.py`
```python
"""Security groups and IAM roles."""

import pulumi
import pulumi_aws as aws
from typing import Dict, Any


def create_security_groups(vpc: aws.ec2.Vpc, tags: Dict[str, str]) -> Dict[str, Any]:
    """
    Create security groups with restricted access.
    
    Args:
        vpc: VPC resource
        tags: Common resource tags
        
    Returns:
        Dictionary containing security group resources
    """
    # Web security group (HTTP/HTTPS only)
    web_sg = aws.ec2.SecurityGroup(
        "nova-web-sg",
        description="Security group for web servers - HTTP/HTTPS only",
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                description="HTTP",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]
            ),
            aws.ec2.SecurityGroupIngressArgs(
                description="HTTPS",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                description="All outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={
            **tags,
            "Name": "nova-web-security-group"
        }
    )
    
    # Lambda security group
    lambda_sg = aws.ec2.SecurityGroup(
        "nova-lambda-sg",
        description="Security group for Lambda functions",
        vpc_id=vpc.id,
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                description="All outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={
            **tags,
            "Name": "nova-lambda-security-group"
        }
    )
    
    return {
        "web_sg": web_sg,
        "lambda_sg": lambda_sg
    }
```

### `infrastructure/compute.py`
```python
"""EC2 instances and IAM roles."""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json


def create_compute_resources(
    subnets: List[aws.ec2.Subnet],
    security_group: aws.ec2.SecurityGroup,
    kms_key: aws.kms.Key,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """
    Create EC2 instances with unique IAM roles.
    
    Args:
        subnets: List of subnet resources
        security_group: Security group for instances
        kms_key: KMS key for encryption
        tags: Common resource tags
        
    Returns:
        Dictionary containing compute resources
    """
    instances: List[aws.ec2.Instance] = []
    roles: List[aws.iam.Role] = []
    
    # Get latest Amazon Linux 2 AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["amzn2-ami-hvm-*-x86_64-gp2"]
            )
        ]
    )
    
    for i in range(2):
        # Create unique IAM role for each instance
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }
            ]
        })
        
        role = aws.iam.Role(
            f"nova-ec2-role-{i+1}",
            assume_role_policy=assume_role_policy,
            tags={
                **tags,
                "Name": f"nova-ec2-role-{i+1}"
            }
        )
        
        # Attach managed policies
        aws.iam.RolePolicyAttachment(
            f"nova-ec2-policy-attachment-{i+1}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )
        
        # Create instance profile
        instance_profile = aws.iam.InstanceProfile(
            f"nova-instance-profile-{i+1}",
            role=role.name,
            tags={
                **tags,
                "Name": f"nova-instance-profile-{i+1}"
            }
        )
        
        # User data script
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Nova Production Server {}</h1>" > /var/www/html/index.html
""".format(i+1)
        
        # Create EC2 instance
        instance = aws.ec2.Instance(
            f"nova-instance-{i+1}",
            ami=ami.id,
            instance_type="t3.micro",
            subnet_id=subnets[i].id,
            vpc_security_group_ids=[security_group.id],
            iam_instance_profile=instance_profile.name,
            user_data=user_data,
            root_block_device=aws.ec2.InstanceRootBlockDeviceArgs(
                volume_type="gp3",
                volume_size=20,
                encrypted=True,
                kms_key_id=kms_key.arn
            ),
            tags={
                **tags,
                "Name": f"nova-production-instance-{i+1}"
            }
        )
        
        instances.append(instance)
        roles.append(role)
    
    return {
        "instances": instances,
        "roles": roles
    }
```

### `infrastructure/api_gateway.py`
```python
"""API Gateway with CloudWatch logging."""

import pulumi
import pulumi_aws as aws
from typing import Dict, Any
import json


def create_api_gateway(kms_key: aws.kms.Key, tags: Dict[str, str]) -> Dict[str, Any]:
    """
    Create API Gateway with CloudWatch logging enabled.
    
    Args:
        kms_key: KMS key for encryption
        tags: Common resource tags
        
    Returns:
        Dictionary containing API Gateway resources
    """
    # Create CloudWatch log group for API Gateway
    log_group = aws.cloudwatch.LogGroup(
        "nova-api-gateway-logs",
        name="/aws/apigateway/nova-api",
        retention_in_days=14,
        kms_key_id=kms_key.arn,
        tags={
            **tags,
            "Name": "nova-api-gateway-logs"
        }
    )
    
    # Create API Gateway
    api = aws.apigateway.RestApi(
        "nova-api",
        name="nova-production-api",
        description="Nova Model Breaking API",
        tags={
            **tags,
            "Name": "nova-production-api"
        }
    )
    
    # Create resource
    resource = aws.apigateway.Resource(
        "nova-api-resource",
        rest_api=api.id,
        parent_id=api.root_resource_id,
        path_part="health"
    )
    
    # Create method
    method = aws.apigateway.Method(
        "nova-api-method",
        rest_api=api.id,
        resource_id=resource.id,
        http_method="GET",
        authorization="NONE"
    )
    
    # Create integration
    integration = aws.apigateway.Integration(
        "nova-api-integration",
        rest_api=api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="GET",
        type="MOCK",
        request_templates={
            "application/json": json.dumps({"statusCode": 200})
        }
    )
    
    # Create method response
    method_response = aws.apigateway.MethodResponse(
        "nova-api-method-response",
        rest_api=api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        status_code="200"
    )
    
    # Create integration response
    integration_response = aws.apigateway.IntegrationResponse(
        "nova-api-integration-response",
        rest_api=api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        status_code=method_response.status_code,
        response_templates={
            "application/json": json.dumps({"message": "API is healthy"})
        }
    )
    
    # Create deployment
    deployment = aws.apigateway.Deployment(
        "nova-api-deployment",
        depends_on=[integration_response],
        rest_api=api.id,
        stage_name="prod"
    )
    
    # Configure stage with logging
    stage = aws.apigateway.Stage(
        "nova-api-stage",
        deployment_id=deployment.id,
        rest_api=api.id,
        stage_name="prod",
        access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
            destination_arn=log_group.arn,
            format=json.dumps({
                "requestId": "$context.requestId",
                "ip": "$context.identity.sourceIp",
                "caller": "$context.identity.caller",
                "user": "$context.identity.user",
                "requestTime": "$context.requestTime",
                "httpMethod": "$context.httpMethod",
                "resourcePath": "$context.resourcePath",
                "status": "$context.status",
                "protocol": "$context.protocol",
                "responseLength": "$context.responseLength"
            })
        ),
        tags={
            **tags,
            "Name": "nova-api-prod-stage"
        }
    )
    
    # Create API Gateway account for CloudWatch logging
    account = aws.apigateway.Account(
        "nova-api-account",
        cloudwatch_role_arn=create_api_gateway_cloudwatch_role(tags).arn
    )
    
    api_url = pulumi.Output.concat("https://", api.id, ".execute-api.us-east-1.amazonaws.com/prod")
    
    return {
        "api": api,
        "api_url": api_url,
        "log_group": log_group,
        "stage": stage
    }


def create_api_gateway_cloudwatch_role(tags: Dict[str, str]) -> aws.iam.Role:
    """Create IAM role for API Gateway CloudWatch logging."""
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "apigateway.amazonaws.com"
                }
            }
        ]
    })
    
    role = aws.iam.Role(
        "nova-api-gateway-cloudwatch-role",
        assume_role_policy=assume_role_policy,
        tags={
            **tags,
            "Name": "nova-api-gateway-cloudwatch-role"
        }
    )
    
    aws.iam.RolePolicyAttachment(
        "nova-api-gateway-cloudwatch-policy",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
    )
    
    return role
```

### `infrastructure/monitoring.py`
```python
"""Monitoring and health check Lambda function."""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json
import base64


def create_monitoring(
    subnets: List[aws.ec2.Subnet],
    security_group: aws.ec2.SecurityGroup,
    instances: List[aws.ec2.Instance],
    kms_key: aws.kms.Key,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """
    Create Lambda function for health monitoring.
    
    Args:
        subnets: List of subnet resources
        security_group: Security group for Lambda
        instances: List of EC2 instances to monitor
        kms_key: KMS key for encryption
        tags: Common resource tags
        
    Returns:
        Dictionary containing monitoring resources
    """
    # Create CloudWatch log group for Lambda
    log_group = aws.cloudwatch.LogGroup(
        "nova-health-check-logs",
        name="/aws/lambda/nova-health-check",
        retention_in_days=14,
        kms_key_id=kms_key.arn,
        tags={
            **tags,
            "Name": "nova-health-check-logs"
        }
    )
    
    # Create IAM role for Lambda
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    })
    
    lambda_role = aws.iam.Role(
        "nova-lambda-role",
        assume_role_policy=assume_role_policy,
        tags={
            **tags,
            "Name": "nova-lambda-health-check-role"
        }
    )
    
    # Attach policies to Lambda role
    aws.iam.RolePolicyAttachment(
        "nova-lambda-vpc-policy",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    )
    
    aws.iam.RolePolicyAttachment(
        "nova-lambda-basic-policy",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )
    
    # Create custom policy for EC2 and CloudWatch access
    lambda_policy = aws.iam.RolePolicy(
        "nova-lambda-custom-policy",
        role=lambda_role.id,
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeInstances",
                        "ec2:DescribeInstanceStatus",
                        "cloudwatch:PutMetricData"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )
    
    # Lambda function code
    lambda_code = """
import json
import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"Health check Lambda function.\"\"\"
    ec2_client = boto3.client('ec2')
    cloudwatch_client = boto3.client('cloudwatch')
    
    try:
        # Get instance statuses
        response = ec2_client.describe_instance_status(
            IncludeAllInstances=True
        )
        
        healthy_instances = 0
        total_instances = len(response['InstanceStatuses'])
        
        for instance_status in response['InstanceStatuses']:
            instance_id = instance_status['InstanceId']
            instance_state = instance_status['InstanceState']['Name']
            
            if instance_state == 'running':
                system_status = instance_status.get('SystemStatus', {}).get('Status', 'unknown')
                instance_check = instance_status.get('InstanceStatus', {}).get('Status', 'unknown')
                
                if system_status == 'ok' and instance_check == 'ok':
                    healthy_instances += 1
                    logger.info(f"Instance {instance_id} is healthy")
                else:
                    logger.warning(f"Instance {instance_id} has issues: system={system_status}, instance={instance_check}")
            else:
                logger.warning(f"Instance {instance_id} is not running: {instance_state}")
        
        # Send metrics to CloudWatch
        cloudwatch_client.put_metric_data(
            Namespace='Nova/HealthCheck',
            MetricData=[
                {
                    'MetricName': 'HealthyInstances',
                    'Value': healthy_instances,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'TotalInstances',
                    'Value': total_instances,
                    'Unit': 'Count'
                }
            ]
        )
        
        logger.info(f"Health check completed: {healthy_instances}/{total_instances} instances healthy")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Health check completed',
                'healthy_instances': healthy_instances,
                'total_instances': total_instances
            })
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Health check failed',
                'error': str(e)
            })
        }
"""
    
    # Create Lambda function
    lambda_function = aws.lambda_.Function(
        "nova-health-check",
        name="nova-health-check",
        runtime="python3.9",
        code=pulumi.AssetArchive({
            "lambda_function.py": pulumi.StringAsset(lambda_code)
        }),
        handler="lambda_function.lambda_handler",
        role=lambda_role.arn,
        timeout=60,
        vpc_config=aws.lambda_.FunctionVpcConfigArgs(
            subnet_ids=[subnet.id for subnet in subnets],
            security_group_ids=[security_group.id]
        ),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "ENVIRONMENT": "production"
            }
        ),
        kms_key_arn=kms_key.arn,
        tags={
            **tags,
            "Name": "nova-health-check-lambda"
        }
    )
    
    # Create EventBridge rule for scheduling (every 5 minutes)
    schedule_rule = aws.cloudwatch.EventRule(
        "nova-health-check-schedule",
        description="Trigger health check every 5 minutes",
        schedule_expression="rate(5 minutes)",
        tags={
            **tags,
            "Name": "nova-health-check-schedule"
        }
    )
    
    # Create EventBridge target
    event_target = aws.cloudwatch.EventTarget(
        "nova-health-check-target",
        rule=schedule_rule.name,
        arn=lambda_function.arn
    )
    
    # Grant EventBridge permission to invoke Lambda
    lambda_permission = aws.lambda_.Permission(
        "nova-health-check-permission",
        statement_id="AllowExecutionFromEventBridge",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="events.amazonaws.com",
        source_arn=schedule_rule.arn
    )
    
    return {
        "lambda_function": lambda_function,
        "log_group": log_group,
        "schedule_rule": schedule_rule
    }
```

### `infrastructure/kms.py`
```python
"""KMS key for encryption."""

import pulumi
import pulumi_aws as aws
from typing import Dict
import json


def create_kms_key(tags: Dict[str, str]) -> aws.kms.Key:
    """
    Create KMS key for encrypting sensitive data.
    
    Args:
        tags: Common resource tags
        
    Returns:
        KMS key resource
    """
    # Get current AWS account and region
    current = aws.get_caller_identity()
    
    # KMS key policy
    key_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {
                    "AWS": f"arn:aws:iam::{current.account_id}:root"
                },
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow CloudWatch Logs",
                "Effect": "Allow",
                "Principal": {
                    "Service": f"logs.us-east-1.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                "Resource": "*"
            }
        ]
    })
    
    # Create KMS key
    kms_key = aws.kms.Key(
        "nova-kms-key",
        description="KMS key for Nova Model Breaking infrastructure encryption",
        policy=key_policy,
        tags={
            **tags,
            "Name": "nova-production-kms-key"
        }
    )
    
    # Create KMS key alias
    aws.kms.Alias(
        "nova-kms-alias",
        name="alias/nova-production-key",
        target_key_id=kms_key.key_id
    )
    
    return kms_key
```

## Configuration Files

### `Pulumi.yaml`
```yaml
name: aws-nova-infrastructure
runtime: python
description: Secure and scalable AWS infrastructure for Nova Model Breaking
template:
  config:
    aws:region:
      description: AWS region
      default: us-east-1
    environment:
      description: Environment name
      default: production
```

### `Pulumi.prod.yaml`
```yaml
config:
  aws:region: us-east-1
  aws-nova-infrastructure:environment: production
```

### `requirements.txt`
```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## Key Features Implemented

### ✅ **Security & Compliance**
- **VPC with 2 subnets** in different AZs (us-east-1a, us-east-1b)
- **Security groups** allowing only HTTP (80) and HTTPS (443)
- **Unique IAM roles** for each EC2 instance
- **KMS encryption** for EBS volumes, CloudWatch logs, and Lambda
- **Least privilege** IAM policies

### ✅ **Scalability & Reliability**
- **Multi-AZ deployment** for high availability
- **Auto-scaling ready** infrastructure
- **Managed services** (Lambda, API Gateway, CloudWatch)
- **Health monitoring** with automated checks every 5 minutes

### ✅ **Operational Excellence**
- **Infrastructure as Code** with Pulumi
- **Environment-specific** configurations
- **Comprehensive logging** (API Gateway → CloudWatch)
- **Resource tagging** with "Environment: Production"
- **Type annotations** and PEP8 compliance

### ✅ **Monitoring & Observability**
- **CloudWatch integration** for all services
- **Custom metrics** for health monitoring
- **Centralized logging** with KMS encryption
- **EventBridge scheduling** for automated health checks

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure Pulumi:**
```bash
pulumi stack init prod
pulumi config set aws:region us-east-1
pulumi config set environment production
```

3. **Deploy infrastructure:**
```bash
pulumi up
```

4. **Verify deployment:**
```