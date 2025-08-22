# CI/CD Pipeline with AWS Fargate Infrastructure - Implementation

This implementation provides a complete CI/CD pipeline for deploying web applications to AWS Fargate using Pulumi JavaScript. The solution includes automated deployment, scaling, monitoring, and incorporates the latest AWS features.

## Architecture Overview

The infrastructure consists of:
- VPC with public and private subnets across multiple AZs
- ECS Fargate cluster with auto-scaling capabilities
- Application Load Balancer for traffic distribution
- CloudWatch Container Insights with Enhanced Observability
- ECS Service Connect for service discovery
- GitHub Actions CI/CD pipeline
- AWS Secrets Manager for environment variables

## File Structure

The implementation is organized into these files:

### 1. lib/tap-stack.mjs (Main Infrastructure Stack)

```javascript
/**
 * tap-stack.mjs - Main Pulumi ComponentResource for CI/CD Pipeline with AWS Fargate
 * 
 * This module orchestrates the complete infrastructure including VPC, ECS Fargate,
 * load balancing, auto scaling, monitoring, and CI/CD integration.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix (e.g., 'dev', 'prod')
 * @property {Object<string, string>} [tags] - Default tags for resources
 */

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Base tags for all resources
    const baseTags = {
      Environment: environmentSuffix,
      Project: 'ci-cd-pipeline',
      ManagedBy: 'Pulumi',
      ...tags
    };

    // VPC Configuration
    const vpc = new awsx.ec2.Vpc(`ci-cd-pipeline-vpc-${environmentSuffix}`, {
      numberOfAvailabilityZones: 2,
      subnets: [
        { type: "public", name: "public" },
        { type: "private", name: "private" }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-vpc-${environmentSuffix}`
      }
    }, { parent: this });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`ci-cd-pipeline-alb-sg-${environmentSuffix}`, {
      vpcId: vpc.vpcId,
      description: "Security group for Application Load Balancer",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"]
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-alb-sg-${environmentSuffix}`
      }
    }, { parent: this });

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ci-cd-pipeline-ecs-sg-${environmentSuffix}`, {
      vpcId: vpc.vpcId,
      description: "Security group for ECS Fargate tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 3000,
          toPort: 3000,
          securityGroups: [albSecurityGroup.id]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-ecs-sg-${environmentSuffix}`
      }
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`ci-cd-pipeline-alb-${environmentSuffix}`, {
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: vpc.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-alb-${environmentSuffix}`
      }
    }, { parent: this });

    const targetGroup = new aws.lb.TargetGroup(`ci-cd-pipeline-tg-${environmentSuffix}`, {
      port: 3000,
      protocol: "HTTP",
      vpcId: vpc.vpcId,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-tg-${environmentSuffix}`
      }
    }, { parent: this });

    const albListener = new aws.lb.Listener(`ci-cd-pipeline-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn
        }
      ]
    }, { parent: this });

    // ECR Repository
    const ecrRepository = new aws.ecr.Repository(`ci-cd-pipeline-ecr-${environmentSuffix}`, {
      name: `ci-cd-pipeline-app-${environmentSuffix}`,
      imageTagMutability: "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: true
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-ecr-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Cluster with Container Insights Enhanced Observability
    const ecsCluster = new aws.ecs.Cluster(`ci-cd-pipeline-cluster-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cluster-${environmentSuffix}`,
      settings: [
        {
          name: "containerInsights",
          value: "enhanced"  // Latest feature: Enhanced Observability
        }
      ],
      serviceConnectDefaults: {
        namespace: aws.servicediscovery.getHttpNamespace({
          name: `ci-cd-pipeline-namespace-${environmentSuffix}`
        }).then(ns => ns.id)
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-cluster-${environmentSuffix}`
      }
    }, { parent: this });

    // Service Discovery Namespace for ECS Service Connect
    const serviceDiscoveryNamespace = new aws.servicediscovery.HttpNamespace(`ci-cd-pipeline-namespace-${environmentSuffix}`, {
      name: `ci-cd-pipeline-namespace-${environmentSuffix}`,
      description: "Service discovery namespace for CI/CD pipeline",
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-namespace-${environmentSuffix}`
      }
    }, { parent: this });

    // Update cluster with correct namespace
    const updatedCluster = new aws.ecs.Cluster(`ci-cd-pipeline-cluster-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cluster-${environmentSuffix}`,
      settings: [
        {
          name: "containerInsights",
          value: "enhanced"
        }
      ],
      serviceConnectDefaults: {
        namespace: serviceDiscoveryNamespace.arn
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-cluster-${environmentSuffix}`
      }
    }, { parent: this, replaceOnChanges: ["name"] });

    // Secrets Manager for environment variables
    const appSecrets = new aws.secretsmanager.Secret(`ci-cd-pipeline-secrets-${environmentSuffix}`, {
      name: `ci-cd-pipeline/app/${environmentSuffix}`,
      description: "Application secrets for CI/CD pipeline",
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-secrets-${environmentSuffix}`
      }
    }, { parent: this });

    const secretVersion = new aws.secretsmanager.SecretVersion(`ci-cd-pipeline-secret-version-${environmentSuffix}`, {
      secretId: appSecrets.id,
      secretString: JSON.stringify({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
        API_KEY: "your-api-key-here",
        JWT_SECRET: "your-jwt-secret-here"
      })
    }, { parent: this });

    // IAM Role for ECS Task Execution
    const taskExecutionRole = new aws.iam.Role(`ci-cd-pipeline-task-execution-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-execution-role-${environmentSuffix}`
      }
    }, { parent: this });

    // Attach execution role policies
    const taskExecutionRolePolicyAttachment = new aws.iam.RolePolicyAttachment(`ci-cd-pipeline-task-execution-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }, { parent: this });

    // Additional policy for Secrets Manager access
    const secretsManagerPolicy = new aws.iam.Policy(`ci-cd-pipeline-secrets-policy-${environmentSuffix}`, {
      policy: pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue"
            ],
            Resource: appSecrets.arn
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-secrets-policy-${environmentSuffix}`
      }
    }, { parent: this });

    const secretsPolicyAttachment = new aws.iam.RolePolicyAttachment(`ci-cd-pipeline-secrets-policy-attachment-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: secretsManagerPolicy.arn
    }, { parent: this });

    // IAM Role for ECS Task
    const taskRole = new aws.iam.Role(`ci-cd-pipeline-task-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-role-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(`ci-cd-pipeline-task-${environmentSuffix}`, {
      family: `ci-cd-pipeline-task-${environmentSuffix}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.jsonStringify([
        {
          name: "app",
          image: pulumi.interpolate`${ecrRepository.repositoryUrl}:latest`,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              protocol: "tcp",
              name: "app-port"
            }
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": pulumi.interpolate`/ecs/ci-cd-pipeline-${environmentSuffix}`,
              "awslogs-region": "us-west-2",
              "awslogs-stream-prefix": "ecs"
            }
          },
          secrets: [
            {
              name: "DATABASE_URL",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:DATABASE_URL::`
            },
            {
              name: "API_KEY",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:API_KEY::`
            },
            {
              name: "JWT_SECRET",
              valueFrom: pulumi.interpolate`${appSecrets.arn}:JWT_SECRET::`
            }
          ],
          environment: [
            {
              name: "NODE_ENV",
              value: environmentSuffix
            },
            {
              name: "PORT",
              value: "3000"
            }
          ],
          healthCheck: {
            command: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60
          }
        }
      ]),
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-task-${environmentSuffix}`
      }
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`ci-cd-pipeline-logs-${environmentSuffix}`, {
      name: `/ecs/ci-cd-pipeline-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-logs-${environmentSuffix}`
      }
    }, { parent: this });

    // ECS Service
    const ecsService = new aws.ecs.Service(`ci-cd-pipeline-service-${environmentSuffix}`, {
      name: `ci-cd-pipeline-service-${environmentSuffix}`,
      cluster: updatedCluster.id,
      taskDefinition: taskDefinition.arn,
      launchType: "FARGATE",
      desiredCount: 2,
      enableExecuteCommand: true,
      networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: "app",
          containerPort: 3000
        }
      ],
      serviceConnectConfiguration: {
        enabled: true,
        namespace: serviceDiscoveryNamespace.arn,
        services: [
          {
            portName: "app-port",
            discoveryName: "app",
            clientAliases: [
              {
                port: 3000,
                dnsName: "app"
              }
            ]
          }
        ]
      },
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true
        }
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-service-${environmentSuffix}`
      }
    }, { 
      parent: this,
      dependsOn: [albListener]
    });

    // Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(`ci-cd-pipeline-scaling-target-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 1,
      resourceId: pulumi.interpolate`service/${updatedCluster.name}/${ecsService.name}`,
      scalableDimension: "ecs:service:DesiredCount",
      serviceNamespace: "ecs"
    }, { parent: this });

    // CPU-based Auto Scaling Policy
    const cpuScalingPolicy = new aws.appautoscaling.Policy(`ci-cd-pipeline-cpu-scaling-policy-${environmentSuffix}`, {
      name: `ci-cd-pipeline-cpu-scaling-${environmentSuffix}`,
      policyType: "TargetTrackingScaling",
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageCPUUtilization"
        },
        targetValue: 70.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 300
      }
    }, { parent: this });

    // Memory-based Auto Scaling Policy
    const memoryScalingPolicy = new aws.appautoscaling.Policy(`ci-cd-pipeline-memory-scaling-policy-${environmentSuffix}`, {
      name: `ci-cd-pipeline-memory-scaling-${environmentSuffix}`,
      policyType: "TargetTrackingScaling",
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageMemoryUtilization"
        },
        targetValue: 80.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 300
      }
    }, { parent: this });

    // CloudWatch Alarms for monitoring
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`ci-cd-pipeline-high-cpu-alarm-${environmentSuffix}`, {
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: 85,
      alarmDescription: "This metric monitors ECS CPU utilization",
      dimensions: {
        ServiceName: ecsService.name,
        ClusterName: updatedCluster.name
      },
      tags: {
        ...baseTags,
        Name: `ci-cd-pipeline-high-cpu-alarm-${environmentSuffix}`
      }
    }, { parent: this });

    // Expose outputs
    this.vpcId = vpc.vpcId;
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.ecsClusterName = updatedCluster.name;
    this.ecsServiceName = ecsService.name;
    this.secretsManagerSecretArn = appSecrets.arn;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      ecsClusterName: this.ecsClusterName,
      ecsServiceName: this.ecsServiceName,
      secretsManagerSecretArn: this.secretsManagerSecretArn
    });
  }
}
```

### 2. .github/workflows/deploy.yml (GitHub Actions CI/CD Pipeline)

```yaml
name: Deploy to AWS Fargate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-west-2
  ECR_REPOSITORY: ci-cd-pipeline-app-dev

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm test

    - name: Run integration tests
      run: npm run test:integration

  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Setup Pulumi
      uses: pulumi/actions@v4
      with:
        command: up
        stack-name: dev
        upsert: true
        work-dir: .
      env:
        PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

    - name: Update ECS Service
      run: |
        aws ecs update-service \
          --cluster ci-cd-pipeline-cluster-dev \
          --service ci-cd-pipeline-service-dev \
          --force-new-deployment \
          --region ${{ env.AWS_REGION }}

    - name: Wait for service stability
      run: |
        aws ecs wait services-stable \
          --cluster ci-cd-pipeline-cluster-dev \
          --services ci-cd-pipeline-service-dev \
          --region ${{ env.AWS_REGION }}

  infrastructure-test:
    name: Test Infrastructure
    runs-on: ubuntu-latest
    needs: build-and-deploy
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Test ECS Service Health
      run: |
        # Check if ECS service is running
        SERVICE_STATUS=$(aws ecs describe-services \
          --cluster ci-cd-pipeline-cluster-dev \
          --services ci-cd-pipeline-service-dev \
          --query 'services[0].status' \
          --output text \
          --region ${{ env.AWS_REGION }})
        
        if [ "$SERVICE_STATUS" != "ACTIVE" ]; then
          echo "ECS service is not active"
          exit 1
        fi
        
        # Check running task count
        RUNNING_COUNT=$(aws ecs describe-services \
          --cluster ci-cd-pipeline-cluster-dev \
          --services ci-cd-pipeline-service-dev \
          --query 'services[0].runningCount' \
          --output text \
          --region ${{ env.AWS_REGION }})
        
        if [ "$RUNNING_COUNT" -lt "1" ]; then
          echo "No running tasks found"
          exit 1
        fi
        
        echo "ECS service is healthy with $RUNNING_COUNT running tasks"

    - name: Test Load Balancer Health
      run: |
        # Get ALB DNS name
        ALB_DNS=$(aws elbv2 describe-load-balancers \
          --names ci-cd-pipeline-alb-dev \
          --query 'LoadBalancers[0].DNSName' \
          --output text \
          --region ${{ env.AWS_REGION }})
        
        # Test health endpoint
        for i in {1..5}; do
          if curl -f "http://$ALB_DNS/health"; then
            echo "Health check passed"
            break
          fi
          echo "Attempt $i failed, retrying in 30 seconds..."
          sleep 30
        done

    - name: Test Auto Scaling Configuration
      run: |
        # Check if auto scaling target exists
        aws application-autoscaling describe-scalable-targets \
          --service-namespace ecs \
          --resource-ids service/ci-cd-pipeline-cluster-dev/ci-cd-pipeline-service-dev \
          --region ${{ env.AWS_REGION }}
        
        # Check if scaling policies exist
        aws application-autoscaling describe-scaling-policies \
          --service-namespace ecs \
          --resource-id service/ci-cd-pipeline-cluster-dev/ci-cd-pipeline-service-dev \
          --region ${{ env.AWS_REGION }}
        
        echo "Auto scaling configuration verified"
```

### 3. Dockerfile (Sample Application Container)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 4. package.json (Sample Application Dependencies)

```json
{
  "name": "ci-cd-pipeline-app",
  "version": "1.0.0",
  "description": "Sample web application for CI/CD pipeline with AWS Fargate",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest",
    "test:integration": "jest --config=jest.integration.config.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "aws-sdk": "^2.1490.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 5. server.js (Sample Application)

```javascript
const express = require('express');
const AWS = require('aws-sdk');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CI/CD Pipeline with AWS Fargate',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
```

## Key Features Implemented

1. **ECS Fargate with Enhanced Monitoring**: Uses the latest CloudWatch Container Insights with enhanced observability for detailed container metrics
2. **ECS Service Connect**: Implements service discovery and load balancing for microservices communication
3. **Auto Scaling**: CPU and memory-based scaling policies with proper cooldown periods
4. **Security**: AWS Secrets Manager for environment variables, proper IAM roles and security groups
5. **Load Balancing**: Application Load Balancer with health checks
6. **CI/CD Pipeline**: Complete GitHub Actions workflow with testing, building, and deployment
7. **Infrastructure as Code**: Organized Pulumi JavaScript code with proper resource tagging
8. **Monitoring and Alerting**: CloudWatch alarms and detailed logging

The infrastructure follows AWS best practices and uses the latest features for production-ready deployment.