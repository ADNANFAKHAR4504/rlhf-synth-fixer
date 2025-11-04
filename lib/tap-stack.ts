import { AppautoscalingPolicy } from "@cdktf/provider-aws/lib/appautoscaling-policy";
import { AppautoscalingTarget } from "@cdktf/provider-aws/lib/appautoscaling-target";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { EcrLifecyclePolicy } from "@cdktf/provider-aws/lib/ecr-lifecycle-policy";
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Password } from "@cdktf/provider-random/lib/password";
import { RandomProvider } from "@cdktf/provider-random/lib/provider";
import { Fn, S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";

export interface TapStackConfig {
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
  constructor(scope: Construct, id: string, config?: TapStackConfig) {
    super(scope, id);

    // Set default configuration if not provided
    const finalConfig: TapStackConfig = config || {
      environmentSuffix: 'dev',
      stateBucket: 'tap-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
      defaultTags: {
        tags: {
          Environment: 'dev',
          Project: 'client-dashboard',
        },
      },
    };

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: finalConfig.awsRegion,
      defaultTags: [finalConfig.defaultTags],
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, "random");

    // Configure S3 Backend for Terraform state
    new S3Backend(this, {
      bucket: finalConfig.stateBucket,
      key: `tap-stack-${finalConfig.environmentSuffix}/terraform.tfstate`,
      region: finalConfig.stateBucketRegion,
      encrypt: true,
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "available", {
      state: "available",
    });

    // Create VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `client-dashboard-vpc-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create public subnets in 2 AZs
    const publicSubnet1 = new Subnet(this, "public-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `client-dashboard-public-subnet-1-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    const publicSubnet2 = new Subnet(this, "public-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `client-dashboard-public-subnet-2-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create private subnets in 2 AZs
    const privateSubnet1 = new Subnet(this, "private-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.11.0/24",
      availabilityZone: Fn.element(azs.names, 0),
      tags: {
        Name: `client-dashboard-private-subnet-1-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    const privateSubnet2 = new Subnet(this, "private-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.12.0/24",
      availabilityZone: Fn.element(azs.names, 1),
      tags: {
        Name: `client-dashboard-private-subnet-2-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-igw-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, "nat-eip-1", {
      domain: "vpc",
      tags: {
        Name: `client-dashboard-nat-eip-1-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    const eip2 = new Eip(this, "nat-eip-2", {
      domain: "vpc",
      tags: {
        Name: `client-dashboard-nat-eip-2-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create NAT Gateways
    const natGw1 = new NatGateway(this, "nat-gw-1", {
      subnetId: publicSubnet1.id,
      allocationId: eip1.id,
      tags: {
        Name: `client-dashboard-nat-gw-1-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    const natGw2 = new NatGateway(this, "nat-gw-2", {
      subnetId: publicSubnet2.id,
      allocationId: eip2.id,
      tags: {
        Name: `client-dashboard-nat-gw-2-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-public-rt-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    new RouteTableAssociation(this, "public-rta-1", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, "public-rta-2", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Create private route tables
    const privateRouteTable1 = new RouteTable(this, "private-rt-1", {
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-private-rt-1-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new Route(this, "private-route-1", {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw1.id,
    });

    const privateRouteTable2 = new RouteTable(this, "private-rt-2", {
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-private-rt-2-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new Route(this, "private-route-2", {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw2.id,
    });

    // Associate private subnets with private route tables
    new RouteTableAssociation(this, "private-rta-1", {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    new RouteTableAssociation(this, "private-rta-2", {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Create ALB security group
    const albSg = new SecurityGroup(this, "alb-sg", {
      name: `client-dashboard-alb-sg-${finalConfig.environmentSuffix}`,
      description: "Security group for Application Load Balancer",
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-alb-sg-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new SecurityGroupRule(this, "alb-ingress-http", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, "alb-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id,
    });

    // Create ECS task security group
    const ecsSg = new SecurityGroup(this, "ecs-sg", {
      name: `client-dashboard-ecs-sg-${finalConfig.environmentSuffix}`,
      description: "Security group for ECS tasks",
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-ecs-sg-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new SecurityGroupRule(this, "ecs-ingress-from-alb", {
      type: "ingress",
      fromPort: 3000,
      toPort: 3000,
      protocol: "tcp",
      sourceSecurityGroupId: albSg.id,
      securityGroupId: ecsSg.id,
    });

    new SecurityGroupRule(this, "ecs-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ecsSg.id,
    });

    // Create RDS security group
    const rdsSg = new SecurityGroup(this, "rds-sg", {
      name: `client-dashboard-rds-sg-${finalConfig.environmentSuffix}`,
      description: "Security group for RDS database",
      vpcId: vpc.id,
      tags: {
        Name: `client-dashboard-rds-sg-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new SecurityGroupRule(this, "rds-ingress-from-ecs", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      sourceSecurityGroupId: ecsSg.id,
      securityGroupId: rdsSg.id,
    });

    new SecurityGroupRule(this, "rds-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: rdsSg.id,
    });

    // Generate secure random password for RDS
    const dbPassword = new Password(this, "db-password", {
      length: 32,
      special: true,
      overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
    });

    // Create Secrets Manager secret for database password
    const dbSecret = new SecretsmanagerSecret(this, "db-secret", {
      name: `client-dashboard-db-password-${finalConfig.environmentSuffix}`,
      description: "RDS PostgreSQL database password",
      tags: {
        Name: `client-dashboard-db-secret-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new SecretsmanagerSecretVersion(this, "db-secret-version", {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: "dbadmin",
        password: dbPassword.result,
      }),
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `client-dashboard-db-subnet-group-${finalConfig.environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `client-dashboard-db-subnet-group-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create RDS instance
    const dbInstance = new DbInstance(this, "rds-instance", {
      identifier: `client-dashboard-db-${finalConfig.environmentSuffix}`,
      engine: "postgres",
      engineVersion: "15.3",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      dbName: "clientdashboard",
      username: "dbadmin",
      password: dbPassword.result,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      backupRetentionPeriod: 7,
      storageEncrypted: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      multiAz: false,
      publiclyAccessible: false,
      tags: {
        Name: `client-dashboard-rds-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create ECS cluster
    const ecsCluster = new EcsCluster(this, "ecs-cluster", {
      name: `client-dashboard-cluster-${finalConfig.environmentSuffix}`,
      tags: {
        Name: `client-dashboard-cluster-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create ECR repository
    const ecrRepo = new EcrRepository(this, "ecr-repo", {
      name: `client-dashboard-app-${finalConfig.environmentSuffix}`,
      imageTagMutability: "MUTABLE",
      tags: {
        Name: `client-dashboard-ecr-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create ECR lifecycle policy
    new EcrLifecyclePolicy(this, "ecr-lifecycle", {
      repository: ecrRepo.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: "Keep only last 5 images",
            selection: {
              tagStatus: "any",
              countType: "imageCountMoreThan",
              countNumber: 5,
            },
            action: {
              type: "expire",
            },
          },
        ],
      }),
    });

    // Create CloudWatch log group
    const logGroup = new CloudwatchLogGroup(this, "ecs-log-group", {
      name: `/ecs/client-dashboard-${finalConfig.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `client-dashboard-logs-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create ECS task execution role
    const taskExecutionRole = new IamRole(this, "task-execution-role", {
      name: `client-dashboard-task-execution-role-${finalConfig.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "ecs-tasks.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
      tags: {
        Name: `client-dashboard-task-execution-role-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    new IamRolePolicyAttachment(this, "task-execution-policy", {
      role: taskExecutionRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });

    // Create custom policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, "secrets-policy", {
      name: `client-dashboard-secrets-policy-${finalConfig.environmentSuffix}`,
      description: "Policy for accessing Secrets Manager",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["secretsmanager:GetSecretValue"],
            Resource: dbSecret.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "secrets-policy-attachment", {
      role: taskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // Create ECS task definition
    const taskDefinition = new EcsTaskDefinition(this, "task-definition", {
      family: `client-dashboard-task-${finalConfig.environmentSuffix}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      executionRoleArn: taskExecutionRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: "client-dashboard-app",
          image: `${ecrRepo.repositoryUrl}:latest`,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              protocol: "tcp",
            },
          ],
          environment: [
            {
              name: "DB_HOST",
              value: dbInstance.address,
            },
            {
              name: "DB_PORT",
              value: "5432",
            },
            {
              name: "DB_NAME",
              value: "clientdashboard",
            },
          ],
          secrets: [
            {
              name: "DB_USERNAME",
              valueFrom: `${dbSecret.arn}:username::`,
            },
            {
              name: "DB_PASSWORD",
              valueFrom: `${dbSecret.arn}:password::`,
            },
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroup.name,
              "awslogs-region": finalConfig.awsRegion,
              "awslogs-stream-prefix": "ecs",
            },
          },
          healthCheck: {
            command: [
              "CMD-SHELL",
              "curl -f http://localhost:3000/health || exit 1",
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
      tags: {
        Name: `client-dashboard-task-def-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create Application Load Balancer
    const alb = new Lb(this, "alb", {
      name: `client-dashboard-alb-${finalConfig.environmentSuffix}`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSg.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: `client-dashboard-alb-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create target group
    const targetGroup = new LbTargetGroup(this, "target-group", {
      name: `client-dashboard-tg-${finalConfig.environmentSuffix}`,
      port: 3000,
      protocol: "HTTP",
      targetType: "ip",
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
      },
      stickiness: {
        enabled: true,
        type: "lb_cookie",
        cookieDuration: 3600,
      },
      tags: {
        Name: `client-dashboard-tg-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
    });

    // Create ALB listener
    new LbListener(this, "alb-listener", {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Create ECS service
    const ecsService = new EcsService(this, "ecs-service", {
      name: `client-dashboard-service-${finalConfig.environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: "FARGATE",
      platformVersion: "LATEST",
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsSg.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: "client-dashboard-app",
          containerPort: 3000,
        },
      ],
      tags: {
        Name: `client-dashboard-service-${finalConfig.environmentSuffix}`,
        Environment: "production",
        Project: "client-dashboard",
      },
      dependsOn: [targetGroup],
    });

    // Create auto-scaling target
    const scalingTarget = new AppautoscalingTarget(this, "scaling-target", {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: "ecs:service:DesiredCount",
      serviceNamespace: "ecs",
    });

    // Create auto-scaling policy for CPU
    new AppautoscalingPolicy(this, "cpu-scaling-policy", {
      name: `client-dashboard-cpu-scaling-${finalConfig.environmentSuffix}`,
      policyType: "TargetTrackingScaling",
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: "ECSServiceAverageCPUUtilization",
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      value: vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "alb-dns", {
      value: alb.dnsName,
      description: "Application Load Balancer DNS name",
    });

    new TerraformOutput(this, "ecs-cluster-name", {
      value: ecsCluster.name,
      description: "ECS Cluster name",
    });

    new TerraformOutput(this, "ecr-repository-url", {
      value: ecrRepo.repositoryUrl,
      description: "ECR repository URL",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: dbInstance.endpoint,
      description: "RDS database endpoint",
    });

    new TerraformOutput(this, "db-secret-arn", {
      value: dbSecret.arn,
      description: "Database credentials secret ARN",
    });

    new TerraformOutput(this, "ecs-service-name", {
      value: ecsService.name,
      description: "ECS Service name",
    });

    new TerraformOutput(this, "target-group-arn", {
      value: targetGroup.arn,
      description: "Target Group ARN",
    });
  }
}
