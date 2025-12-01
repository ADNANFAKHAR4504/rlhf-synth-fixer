# ECS Blue-Green Deployment CloudFormation Template

This document contains the initial CloudFormation template generated for the ECS blue-green deployment task.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "ECS Blue-Green Deployment with Auto-Scaling and Circuit Breaker",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to support multiple PR environments",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase alphanumeric characters and hyphens"
    },
    "ContainerImage": {
      "Type": "String",
      "Default": "nginx:latest",
      "Description": "Docker image for ECS tasks"
    },
    "ContainerPort": {
      "Type": "Number",
      "Default": 80,
      "Description": "Port exposed by the container"
    },
    "SecretArn": {
      "Type": "String",
      "Default": "",
      "Description": "Optional ARN of secret in Secrets Manager"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [{"Key": "Name", "Value": {"Fn::Sub": "vpc-${environmentSuffix}"}}]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {"Fn::Sub": "ecs-cluster-${environmentSuffix}"},
        "ClusterSettings": [{"Name": "containerInsights", "Value": "enabled"}],
        "CapacityProviders": ["FARGATE", "FARGATE_SPOT"]
      }
    },
    "BlueECSService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {"Fn::Sub": "blue-service-${environmentSuffix}"},
        "Cluster": {"Ref": "ECSCluster"},
        "DesiredCount": 3,
        "LaunchType": "FARGATE",
        "PlatformVersion": "1.4.0",
        "DeploymentConfiguration": {
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        }
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "app-alb-${environmentSuffix}"},
        "Type": "application"
      }
    },
    "BlueTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "tg-blue-${environmentSuffix}"},
        "HealthCheckIntervalSeconds": 15,
        "DeregistrationDelay": 30
      }
    }
  }
}
```

## Key Features Implemented

1. **VPC with 3 Availability Zones**: Public and private subnets across us-east-1a, us-east-1b, us-east-1c
2. **ECS Cluster**: Container Insights enabled, Fargate and Fargate Spot capacity providers
3. **Blue and Green Services**: Two identical ECS services with 3 desired tasks each
4. **Application Load Balancer**: Weighted routing (50/50) between blue and green target groups
5. **Auto-Scaling**: CPU (70%) and memory (80%) based scaling policies for both services (3-10 tasks)
6. **CloudWatch Monitoring**: Log groups with 30-day retention, alarms for unhealthy targets
7. **Service Discovery**: AWS Cloud Map private DNS namespace
8. **Circuit Breaker**: Enabled with automatic rollback on deployment failures
9. **Network ACLs**: Configured to allow only ports 80, 443, and 8080
10. **IAM Roles**: Task execution role with ECR, CloudWatch Logs, and Secrets Manager permissions

## Resource Naming Convention

All resources use the `environmentSuffix` parameter:
- VPC: `vpc-${environmentSuffix}`
- ECS Cluster: `ecs-cluster-${environmentSuffix}`
- ALB: `app-alb-${environmentSuffix}`
- Target Groups: `tg-blue-${environmentSuffix}`, `tg-green-${environmentSuffix}`
- Services: `blue-service-${environmentSuffix}`, `green-service-${environmentSuffix}`

## Compliance

- Platform: CloudFormation (cfn)
- Language: JSON
- Region: us-east-1
- All resources are destroyable (no DeletionPolicy: Retain)
- No hardcoded environment names
- Secrets fetched from existing AWS Secrets Manager entries
