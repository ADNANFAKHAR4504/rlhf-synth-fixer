/**
 * Main Pulumi stack for the fintech loan processing application.
 *
 * This stack provisions a production-grade infrastructure with:
 * - Multi-AZ VPC with public and private subnets
 * - ECS Fargate cluster with auto-scaling
 * - RDS PostgreSQL Multi-AZ with encryption
 * - Application Load Balancer
 * - CloudWatch logging and monitoring
 * - Comprehensive security and compliance controls
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackProps {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infra:TapStack', name, {}, opts);

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const region = process.env.AWS_REGION || 'us-east-1';

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      'encryption-key',
      {
        description: `Encryption key for fintech resources ${environmentSuffix}`,
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: {
          Name: `fintech-kms-key-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      'encryption-key-alias',
      {
        name: `alias/fintech-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // VPC
    const vpc = new aws.ec2.Vpc(
      'main-vpc',
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `fintech-vpc-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      'internet-gateway',
      {
        vpcId: vpc.id,
        tags: {
          Name: `fintech-igw-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // Public Subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const azs = availabilityZones.names.apply(names => names.slice(0, 3));

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.apply(names => names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `fintech-public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
            ...props.tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: azs.apply(names => names[i]),
          tags: {
            Name: `fintech-private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
            ...props.tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Elastic IPs for NAT Gateways
    const natEips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i}`,
        {
          domain: 'vpc',
          tags: {
            Name: `fintech-nat-eip-${i}-${environmentSuffix}`,
            ...props.tags,
          },
        },
        { parent: this, dependsOn: [igw] }
      );
      natEips.push(eip);
    }

    // NAT Gateways (one per AZ)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `nat-gateway-${i}`,
        {
          allocationId: natEips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `fintech-nat-${i}-${environmentSuffix}`,
            ...props.tags,
          },
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      'public-route-table',
      {
        vpcId: vpc.id,
        tags: {
          Name: `fintech-public-rt-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      'public-route',
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-route-table-${i}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `fintech-private-rt-${i}-${environmentSuffix}`,
            ...props.tags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${i}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      'alb-security-group',
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `fintech-alb-sg-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      'ecs-security-group',
      {
        vpcId: vpc.id,
        description: 'Security group for ECS Fargate tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `fintech-ecs-sg-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // Security Group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-security-group',
      {
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ecsSecurityGroup.id],
            description: 'Allow PostgreSQL traffic from ECS',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `fintech-rds-sg-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new aws.s3.Bucket(
      'alb-logs-bucket',
      {
        bucket: `fintech-alb-logs-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          Name: `fintech-alb-logs-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // Enable versioning on ALB logs bucket
    new aws.s3.BucketVersioning(
      'alb-logs-bucket-versioning',
      {
        bucket: albLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Bucket Lifecycle Configuration
    new aws.s3.BucketLifecycleConfiguration(
      'alb-logs-bucket-lifecycle-rule',
      {
        bucket: albLogsBucket.id,
        rules: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 2555, // ~7 years
            },
          },
        ],
      },
      { parent: this }
    );

    // Get ELB service account for ALB logs
    const elbServiceAccount = aws.elb.getServiceAccountOutput({
      region: region,
    });

    // S3 Bucket Policy for ALB Logs
    const albLogsBucketPolicy = new aws.s3.BucketPolicy(
      'alb-logs-bucket-policy',
      {
        bucket: albLogsBucket.id,
        policy: pulumi
          .all([albLogsBucket.arn, elbServiceAccount.arn])
          .apply(([bucketArn, elbArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSLogDeliveryWrite',
                  Effect: 'Allow',
                  Principal: {
                    AWS: elbArn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                },
                {
                  Sid: 'AWSLogDeliveryAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'elasticloadbalancing.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      'application-load-balancer',
      {
        name: `fintech-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(s => s.id),
        accessLogs: {
          bucket: albLogsBucket.id,
          enabled: true,
        },
        tags: {
          Name: `fintech-alb-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this, dependsOn: [albLogsBucketPolicy] }
    );

    this.albDnsName = alb.dnsName;

    // CloudWatch Log Group for ECS
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      'ecs-log-group',
      {
        name: `/ecs/fintech/loan-processing-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `fintech-ecs-logs-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // IAM Role for ECS Task Execution
    const ecsTaskExecutionRole = new aws.iam.Role(
      'ecs-task-execution-role',
      {
        name: `fintech-ecs-exec-role-${environmentSuffix}`,
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
          Name: `fintech-ecs-exec-role-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      'ecs-task-execution-policy',
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for CloudWatch Logs
    new aws.iam.RolePolicy(
      'ecs-logs-policy',
      {
        role: ecsTaskExecutionRole.id,
        policy: ecsLogGroup.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: `${arn}:*`,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM Role for ECS Task
    const ecsTaskRole = new aws.iam.Role(
      'ecs-task-role',
      {
        name: `fintech-ecs-task-role-${environmentSuffix}`,
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
          Name: `fintech-ecs-task-role-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(
      'ecs-cluster',
      {
        name: `fintech-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `fintech-cluster-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    this.ecsClusterName = ecsCluster.name;

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      'rds-subnet-group',
      {
        name: `fintech-rds-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnets.map(s => s.id),
        tags: {
          Name: `fintech-rds-subnet-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // RDS PostgreSQL Instance
    const rdsInstance = new aws.rds.Instance(
      'rds-instance',
      {
        identifier: `fintech-db-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '16.3',
        instanceClass: 'db.t3.small',
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'fintechdb',
        username: 'dbadmin',
        password: pulumi.secret('TempPassword123!'), // In production, use Secrets Manager
        dbSubnetGroupName: rdsSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: true,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        publiclyAccessible: false,
        tags: {
          Name: `fintech-db-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    this.rdsEndpoint = rdsInstance.endpoint;

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      'ecs-task-definition',
      {
        family: `fintech-task-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: ecsTaskExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([ecsLogGroup.name, rdsInstance.endpoint])
          .apply(([logGroupName, dbEndpoint]) =>
            JSON.stringify([
              {
                name: 'loan-processing-app',
                image: 'nginx:latest', // Placeholder - replace with actual app image
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'ENVIRONMENT',
                    value: environmentSuffix,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          Name: `fintech-task-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // ALB Target Group
    const targetGroup = new aws.lb.TargetGroup(
      'alb-target-group',
      {
        name: `fintech-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200-299',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `fintech-tg-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // ALB Listener
    const listener = new aws.lb.Listener(
      'alb-listener',
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // ECS Service
    const ecsService = new aws.ecs.Service(
      'ecs-service',
      {
        name: `fintech-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'loan-processing-app',
            containerPort: 80,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `fintech-service-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    // Auto Scaling Target
    const ecsTarget = new aws.appautoscaling.Target(
      'ecs-autoscaling-target',
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Auto Scaling Policy - CPU Based
    new aws.appautoscaling.Policy(
      'ecs-scaling-policy',
      {
        name: `fintech-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: ecsTarget.resourceId,
        scalableDimension: ecsTarget.scalableDimension,
        serviceNamespace: ecsTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for High CPU
    new aws.cloudwatch.MetricAlarm(
      'high-cpu-alarm',
      {
        name: `fintech-high-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        alarmDescription: 'Alert when ECS service CPU exceeds 80%',
        tags: {
          Name: `fintech-cpu-alarm-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for RDS CPU
    new aws.cloudwatch.MetricAlarm(
      'rds-high-cpu-alarm',
      {
        name: `fintech-rds-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBInstanceIdentifier: rdsInstance.identifier,
        },
        alarmDescription: 'Alert when RDS CPU exceeds 80%',
        tags: {
          Name: `fintech-rds-alarm-${environmentSuffix}`,
          ...props.tags,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      ecsClusterName: this.ecsClusterName,
      rdsEndpoint: this.rdsEndpoint,
      albLogsBucket: albLogsBucket.bucket,
      ecsLogGroup: ecsLogGroup.name,
      kmsKeyId: kmsKey.id,
    });
  }
}
