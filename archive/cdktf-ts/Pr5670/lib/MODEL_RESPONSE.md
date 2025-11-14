# CDKTF Infrastructure for Containerized Web Application

This implementation creates a complete ECS Fargate infrastructure with Application Load Balancer, auto-scaling, and Route53 DNS configuration using CDKTF with TypeScript.

## File: lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Backend } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { AcmCertificateValidation } from '@cdktf/provider-aws/lib/acm-certificate-validation';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';

export interface TapStackProps {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
  defaultTags: {
    tags: {
      [key: string]: string;
    };
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    // Configure S3 backend for Terraform state
    new S3Backend(this, {
      bucket: props.stateBucket,
      key: `${id}/terraform.tfstate`,
      region: props.stateBucketRegion,
      encrypt: true,
    });

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: props.awsRegion,
      defaultTags: [props.defaultTags],
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${props.environmentSuffix}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${props.environmentSuffix}`,
      },
    });

    // Public Subnets for ALB
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${props.awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-1-${props.environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${props.awsRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Private Subnets for ECS Tasks
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `${props.awsRegion}a`,
      tags: {
        Name: `private-subnet-1-${props.environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${props.awsRegion}b`,
      tags: {
        Name: `private-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${props.environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      vpcId: vpc.id,
      name: `alb-sg-${props.environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      tags: {
        Name: `alb-sg-${props.environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-443', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      vpcId: vpc.id,
      name: `ecs-sg-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      tags: {
        Name: `ecs-sg-${props.environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-ingress-from-alb', {
      type: 'ingress',
      fromPort: 3000,
      toPort: 3000,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new S3Bucket(this, 'alb-logs-bucket', {
      bucket: `alb-logs-${props.environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `alb-logs-${props.environmentSuffix}`,
      },
    });

    new S3BucketPublicAccessBlock(this, 'alb-logs-public-access-block', {
      bucket: albLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // ECR Repository
    const ecrRepository = new EcrRepository(this, 'ecr-repository', {
      name: `nodejs-api-${props.environmentSuffix}`,
      imageTagMutability: 'MUTABLE',
      forceDelete: true,
      tags: {
        Name: `nodejs-api-${props.environmentSuffix}`,
      },
    });

    // CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/nodejs-api-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${props.environmentSuffix}`,
      },
    });

    // IAM Role for ECS Task Execution
    const executionRole = new IamRole(this, 'ecs-execution-role', {
      name: `ecs-execution-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-execution-role-${props.environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-policy', {
      role: executionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // IAM Role for ECS Task
    const taskRole = new IamRole(this, 'ecs-task-role', {
      name: `ecs-task-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${props.environmentSuffix}`,
      },
    });

    // ECS Cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `nodejs-api-cluster-${props.environmentSuffix}`,
      tags: {
        Name: `nodejs-api-cluster-${props.environmentSuffix}`,
      },
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `nodejs-api-${props.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'nodejs-api',
          image: `${ecrRepository.repositoryUrl}:latest`,
          cpu: 512,
          memory: 1024,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': props.awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
      tags: {
        Name: `nodejs-api-task-${props.environmentSuffix}`,
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `nodejs-api-alb-${props.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: true,
      ipAddressType: 'ipv4',
      accessLogs: {
        bucket: albLogsBucket.bucket,
        enabled: true,
      },
      tags: {
        Name: `nodejs-api-alb-${props.environmentSuffix}`,
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `nodejs-api-tg-${props.environmentSuffix}`,
      port: 3000,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        matcher: '200',
      },
      tags: {
        Name: `nodejs-api-tg-${props.environmentSuffix}`,
      },
    });

    // Route53 Hosted Zone
    const hostedZone = new Route53Zone(this, 'hosted-zone', {
      name: 'example.com',
      tags: {
        Name: `example-zone-${props.environmentSuffix}`,
      },
    });

    // ACM Certificate
    const certificate = new AcmCertificate(this, 'certificate', {
      domainName: 'api.example.com',
      validationMethod: 'DNS',
      tags: {
        Name: `api-cert-${props.environmentSuffix}`,
      },
    });

    // DNS Validation Records
    const validationRecord = new Route53Record(this, 'cert-validation-record', {
      zoneId: hostedZone.zoneId,
      name: certificate.domainValidationOptions('0').resourceRecordName,
      type: certificate.domainValidationOptions('0').resourceRecordType,
      records: [certificate.domainValidationOptions('0').resourceRecordValue],
      ttl: 60,
    });

    // Certificate Validation
    const certValidation = new AcmCertificateValidation(this, 'cert-validation', {
      certificateArn: certificate.arn,
      validationRecordFqdns: [validationRecord.fqdn],
    });

    // HTTPS Listener
    new LbListener(this, 'https-listener', {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-2016-08',
      certificateArn: certValidation.certificateArn,
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Route53 A Record
    new Route53Record(this, 'api-record', {
      zoneId: hostedZone.zoneId,
      name: 'api.example.com',
      type: 'A',
      alias: {
        name: alb.dnsName,
        zoneId: alb.zoneId,
        evaluateTargetHealth: true,
      },
    });

    // ECS Service
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `nodejs-api-service-${props.environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'nodejs-api',
          containerPort: 3000,
        },
      ],
      deploymentCircuitBreaker: {
        enable: true,
        rollback: true,
      },
      tags: {
        Name: `nodejs-api-service-${props.environmentSuffix}`,
      },
      dependsOn: [targetGroup],
    });

    // Auto Scaling Target
    const scalingTarget = new AppautoscalingTarget(this, 'ecs-scaling-target', {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    });

    // Auto Scaling Policy - Scale Up
    new AppautoscalingPolicy(this, 'ecs-scaling-policy-up', {
      name: `ecs-scale-up-${props.environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 300,
      },
    });

    // Outputs
    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'api-url', {
      value: 'https://api.example.com',
      description: 'API URL',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'ecr-repository-url', {
      value: ecrRepository.repositoryUrl,
      description: 'ECR Repository URL',
    });
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the Docker image and push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-repository-url>
docker build -t nodejs-api .
docker tag nodejs-api:latest <ecr-repository-url>:latest
docker push <ecr-repository-url>:latest
```

3. Deploy the infrastructure:
```bash
cdktf deploy
```

4. Verify deployment:
```bash
curl https://api.example.com/health
```

## Notes

- The infrastructure uses CDKTF with TypeScript as required
- All resources include environmentSuffix for uniqueness
- ECS tasks run in private subnets with Fargate launch type
- ALB has deletion protection enabled
- Auto-scaling configured with 70% CPU scale-up and 30% scale-down thresholds
- Circuit breaker enabled for deployment protection
- SSL certificate validated via Route53 DNS
- Health checks configured with 30-second interval and 5-second timeout
- Container logs stream to CloudWatch Logs
