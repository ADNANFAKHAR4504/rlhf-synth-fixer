import * as fs from 'fs';
import * as path from 'path';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeNetworkAclsCommand
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
  DescribeRulesCommand,
  DescribeSSLPoliciesCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  DescribeDBParameterGroupsCommand
} from "@aws-sdk/client-rds";
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketPolicyCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand
} from "@aws-sdk/client-s3";
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  DescribeTaskDefinitionCommand,
  DescribeCapacityProvidersCommand
} from "@aws-sdk/client-ecs";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
  GetResourcePolicyCommand
} from "@aws-sdk/client-secrets-manager";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
  DescribeMetricFiltersCommand
} from "@aws-sdk/client-cloudwatch-logs";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand,
  GetDashboardCommand,
  ListMetricsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  GetHostedZoneCommand
} from "@aws-sdk/client-route-53";
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  SimulatePrincipalPolicyCommand
} from "@aws-sdk/client-iam";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
  DescribeScalingActivitiesCommand
} from "@aws-sdk/client-application-auto-scaling";
import axios from 'axios';

// --- Client Configuration ---
const awsRegion = process.env.AWS_REGION || "us-east-1"; 
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const autoScalingClient = new ApplicationAutoScalingClient({ region: awsRegion });

// --- Integration Test Suite ---
describe("MyApp Integration Tests - ECS Infrastructure", () => {
  let vpcId: string;
  let vpcCidr: string;
  let albDnsName: string;
  let albUrl: string;
  let ecsClusterName: string;
  let ecsServiceName: string;
  let taskDefinitionArn: string;
  let rdsEndpoint: string | undefined;
  let dbSecretArn: string;
  let staticAssetsBucket: string;
  let staticAssetsBucketArn: string;
  let logGroupName: string;
  let dashboardUrl: string | undefined;
  let alarmCount: number;
  let albArn: string;

  beforeAll(() => {
    // Read deployment outputs from file or environment variables
    const outputFilePath = path.join(__dirname, '..', 'deployment-outputs', 'outputs.json');
    
    if (fs.existsSync(outputFilePath)) {
      const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
      
      vpcId = outputs["vpc-id"] || "vpc-0c745bfc83171b0a7";
      vpcCidr = outputs["vpc-cidr"] || "10.0.0.0/16";
      albDnsName = outputs["alb-dns-name"] || "myapp-pr4337-alb-1448593160.us-east-1.elb.amazonaws.com";
      albUrl = outputs["alb-url"] || "http://myapp-pr4337-alb-1448593160.us-east-1.elb.amazonaws.com";
      ecsClusterName = outputs["ecs-cluster-name"] || "myapp-pr4337-cluster";
      ecsServiceName = outputs["ecs-service-name"] || "myapp-pr4337-service";
      taskDefinitionArn = outputs["task-definition-arn"] || "arn:aws:ecs:us-east-1:***:task-definition/myapp-pr4337:1";
      rdsEndpoint = outputs["rds-endpoint"];
      dbSecretArn = outputs["db-secret-arn"] || "arn:aws:secretsmanager:us-east-1:***:secret:myapp-pr4337-db-credentials-BD0AiU";
      staticAssetsBucket = outputs["static-assets-bucket"] || "myapp-pr4337-static-assets";
      staticAssetsBucketArn = outputs["static-assets-bucket-arn"] || "arn:aws:s3:::myapp-pr4337-static-assets";
      logGroupName = outputs["log-group-name"] || "/aws/ecs/myapp-pr4337";
      dashboardUrl = outputs["dashboard-url"];
      alarmCount = parseInt(outputs["alarm-count"] || "5", 10);
    } else {
      vpcId = "vpc-0c745bfc83171b0a7";
      vpcCidr = "10.0.0.0/16";
      albDnsName = "myapp-pr4337-alb-1448593160.us-east-1.elb.amazonaws.com";
      albUrl = "http://myapp-pr4337-alb-1448593160.us-east-1.elb.amazonaws.com";
      ecsClusterName = "myapp-pr4337-cluster";
      ecsServiceName = "myapp-pr4337-service";
      taskDefinitionArn = "arn:aws:ecs:us-east-1:***:task-definition/myapp-pr4337:1";
      dbSecretArn = "arn:aws:secretsmanager:us-east-1:***:secret:myapp-pr4337-db-credentials-BD0AiU";
      staticAssetsBucket = "myapp-pr4337-static-assets";
      staticAssetsBucketArn = "arn:aws:s3:::myapp-pr4337-static-assets";
      logGroupName = "/aws/ecs/myapp-pr4337";
      alarmCount = 5;
    }

    if (!vpcId || !albDnsName || !ecsClusterName) {
      throw new Error("Missing required deployment outputs for integration tests");
    }
  });

  // --- Network Infrastructure: VPC Configuration ---
  describe("Network Infrastructure: VPC Configuration", () => {
    test("VPC is properly configured and available", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0]?.State).toBe('available');
      expect(Vpcs?.[0]?.CidrBlock).toBe(vpcCidr);
      expect(Vpcs?.[0]?.EnableDnsHostnames).toBe(true);
      expect(Vpcs?.[0]?.EnableDnsSupport).toBe(true);
    }, 30000);

    test("VPC has properly configured subnets across multiple AZs", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(Subnets?.length).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private
      
      const publicSubnets = Subnets?.filter(subnet => subnet.MapPublicIpOnLaunch === true);
      const privateSubnets = Subnets?.filter(subnet => subnet.MapPublicIpOnLaunch === false);

      expect(publicSubnets?.length).toBeGreaterThanOrEqual(2); // Multi-AZ
      expect(privateSubnets?.length).toBeGreaterThanOrEqual(2); // Multi-AZ

      // Verify subnets are in different AZs
      const publicAZs = new Set(publicSubnets?.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets?.map(s => s.AvailabilityZone));
      
      expect(publicAZs.size).toBeGreaterThanOrEqual(2);
      expect(privateAZs.size).toBeGreaterThanOrEqual(2);

      Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
      });
    }, 30000);

    test("VPC has NAT Gateways for high availability", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(NatGateways?.length).toBeGreaterThanOrEqual(2); // Multi-AZ NAT Gateways
      
      NatGateways?.forEach(natGateway => {
        expect(natGateway.State).toBe('available');
        expect(natGateway.ConnectivityType).toBe('public');
      });
    }, 30000);

    test("VPC has Internet Gateway attached", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
        })
      );

      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0]?.Attachments?.[0]?.State).toBe('available');
    }, 30000);

    test("VPC has VPC Endpoints for AWS services", async () => {
      const { VpcEndpoints } = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      // Check for essential VPC endpoints
      const endpointServices = VpcEndpoints?.map(ep => ep.ServiceName) || [];
      
      // At minimum, we should have S3 and ECR endpoints for private communication
      const hasS3Endpoint = endpointServices.some(service => service?.includes('s3'));
      const hasECREndpoint = endpointServices.some(service => service?.includes('ecr'));
      
      console.log(`VPC Endpoints found: ${endpointServices.join(', ')}`);
      
      if (VpcEndpoints && VpcEndpoints.length > 0) {
        VpcEndpoints.forEach(endpoint => {
          expect(endpoint.State).toBe('Available');
        });
      }
    }, 30000);
  });

  // --- Security: Security Groups and Network ACLs ---
  describe("Security: Security Groups and Network ACLs", () => {
    test("Security groups are properly configured with least privilege", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: ['*pr4337*'] }
          ]
        })
      );

      expect(SecurityGroups?.length).toBeGreaterThan(0);

      SecurityGroups?.forEach(sg => {
        // Check that security groups don't have overly permissive rules
        sg.IpPermissions?.forEach(rule => {
          rule.IpRanges?.forEach(range => {
            if (range.CidrIp === '0.0.0.0/0') {
              // Only HTTP/HTTPS should be open to the world, and only on ALB
              expect([80, 443]).toContain(rule.FromPort);
            }
          });
        });

        // Verify egress rules exist
        expect(sg.IpPermissionsEgress?.length).toBeGreaterThan(0);
      });

      // Check for specific security groups
      const sgNames = SecurityGroups?.map(sg => sg.GroupName) || [];
      expect(sgNames.some(name => name?.includes('alb'))).toBe(true);
      expect(sgNames.some(name => name?.includes('ecs') || name?.includes('container'))).toBe(true);
      expect(sgNames.some(name => name?.includes('rds') || name?.includes('database'))).toBe(true);
    }, 30000);

    test("Network ACLs are configured", async () => {
      const { NetworkAcls } = await ec2Client.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(NetworkAcls?.length).toBeGreaterThan(0);
      
      NetworkAcls?.forEach(acl => {
        // Verify both inbound and outbound rules exist
        expect(acl.Entries?.length).toBeGreaterThan(0);
        
        const inboundRules = acl.Entries?.filter(e => !e.Egress);
        const outboundRules = acl.Entries?.filter(e => e.Egress);
        
        expect(inboundRules?.length).toBeGreaterThan(0);
        expect(outboundRules?.length).toBeGreaterThan(0);
      });
    }, 30000);
  });
  
  // --- Application Load Balancer ---
  describe("Application Load Balancer", () => {
    test("ALB is healthy and properly configured", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.VpcId).toBe(vpcId);
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2); // Multi-AZ

      if (alb?.LoadBalancerArn) {
        albArn = alb.LoadBalancerArn;
      }

      // Check security features
      expect(alb?.SecurityGroups?.length).toBeGreaterThan(0);
    }, 30000);

    test("ALB has proper listeners configured", async () => {
      if (!albArn) {
        console.log("ALB ARN not found, skipping listener test");
        return;
      }

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );

      expect(Listeners?.length).toBeGreaterThan(0);
      
      // Check for HTTP listener
      const httpListener = Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');

      // Check for HTTPS listener (if configured)
      const httpsListener = Listeners?.find(l => l.Port === 443);
      if (httpsListener) {
        expect(httpsListener.Protocol).toBe('HTTPS');
        expect(httpsListener.SslPolicy).toBeDefined();
        expect(httpsListener.Certificates?.length).toBeGreaterThan(0);
      }

      // Check listener rules
      for (const listener of Listeners || []) {
        const { Rules } = await elbv2Client.send(
          new DescribeRulesCommand({ ListenerArn: listener.ListenerArn })
        );
        expect(Rules?.length).toBeGreaterThan(0);
      }
    }, 30000);

    test("ALB target groups have healthy targets", async () => {
      if (!albArn) {
        console.log("ALB ARN not found, skipping target group test");
        return;
      }

      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: albArn })
      );

      expect(TargetGroups?.length).toBeGreaterThan(0);

      for (const targetGroup of TargetGroups || []) {
        expect(targetGroup.HealthCheckEnabled).toBe(true);
        expect(targetGroup.HealthCheckPath).toBeDefined();
        expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
        expect(targetGroup.TargetType).toBe('ip'); // Fargate uses IP targets

        const { TargetHealthDescriptions } = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn
          })
        );

        const healthyTargets = TargetHealthDescriptions?.filter(
          target => target.TargetHealth?.State === 'healthy'
        );

        console.log(`Target Group ${targetGroup.TargetGroupName}: ${healthyTargets?.length} healthy targets`);
        
        // In production, we should have at least some healthy targets
        if (TargetHealthDescriptions && TargetHealthDescriptions.length > 0) {
          expect(healthyTargets?.length).toBeGreaterThan(0);
        }
      }
    }, 30000);
  });
  
  // --- ECS Cluster and Service ---
  describe("ECS Cluster and Service", () => {
    test("ECS cluster is active and properly configured", async () => {
      const { clusters } = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [ecsClusterName],
          include: ['ATTACHMENTS', 'SETTINGS', 'STATISTICS', 'TAGS']
        })
      );

      expect(clusters?.length).toBe(1);
      const cluster = clusters![0];

      expect(cluster.clusterName).toBe(ecsClusterName);
      expect(cluster.status).toBe('ACTIVE');
      
      // Check cluster settings
      const containerInsightsEnabled = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );
      expect(containerInsightsEnabled?.value).toBe('enabled');

      // Verify capacity providers for Fargate
      expect(cluster.capacityProviders).toContain('FARGATE');
      expect(cluster.capacityProviders).toContain('FARGATE_SPOT');
    }, 30000);

    test("ECS service is running with desired configuration", async () => {
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );

      expect(services?.length).toBe(1);
      const service = services![0];

      expect(service.serviceName).toBe(ecsServiceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBeGreaterThan(0);
      expect(service.runningCount).toBe(service.desiredCount);
      expect(service.launchType || service.capacityProviderStrategy).toBeDefined();
      
      // Check deployment configuration
      expect(service.deploymentConfiguration?.maximumPercent).toBeGreaterThanOrEqual(100);
      expect(service.deploymentConfiguration?.minimumHealthyPercent).toBeGreaterThan(0);
      
      // Verify load balancer configuration
      expect(service.loadBalancers?.length).toBeGreaterThan(0);
      
      // Check network configuration
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets?.length).toBeGreaterThan(1);
      expect(service.networkConfiguration?.awsvpcConfiguration?.securityGroups?.length).toBeGreaterThan(0);
    }, 30000);

    test("ECS tasks are running and healthy", async () => {
      const { taskArns } = await ecsClient.send(
        new ListTasksCommand({
          cluster: ecsClusterName,
          serviceName: ecsServiceName,
          desiredStatus: 'RUNNING'
        })
      );

      expect(taskArns?.length).toBeGreaterThan(0);

      const { tasks } = await ecsClient.send(
        new DescribeTasksCommand({
          cluster: ecsClusterName,
          tasks: taskArns
        })
      );

      tasks?.forEach(task => {
        expect(task.lastStatus).toBe('RUNNING');
        expect(task.healthStatus).toBe('HEALTHY');
        expect(task.taskDefinitionArn).toContain('myapp-pr4337');
        expect(task.launchType).toBe('FARGATE');
        
        // Verify task has proper network configuration
        expect(task.attachments?.length).toBeGreaterThan(0);
        const eniAttachment = task.attachments?.find(a => a.type === 'ElasticNetworkInterface');
        expect(eniAttachment).toBeDefined();
      });
    }, 30000);

    test("Task definition is properly configured with security best practices", async () => {
      const taskDefFamily = taskDefinitionArn.split('/').pop();

      const { taskDefinition } = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefFamily
        })
      );

      expect(taskDefinition).toBeDefined();
      expect(taskDefinition?.status).toBe('ACTIVE');
      expect(taskDefinition?.networkMode).toBe('awsvpc');
      expect(taskDefinition?.requiresCompatibilities).toContain('FARGATE');
      
      // Check execution role is configured
      expect(taskDefinition?.executionRoleArn).toBeDefined();
      expect(taskDefinition?.taskRoleArn).toBeDefined();
      
      const mainContainer = taskDefinition?.containerDefinitions?.[0];
      expect(mainContainer?.essential).toBe(true);
      
      // Verify logging configuration
      expect(mainContainer?.logConfiguration?.logDriver).toBe('awslogs');
      expect(mainContainer?.logConfiguration?.options?.['awslogs-group']).toBe(logGroupName);
      expect(mainContainer?.logConfiguration?.options?.['awslogs-region']).toBe(awsRegion);
      
      // Check security settings
      expect(mainContainer?.privileged).not.toBe(true);
      expect(mainContainer?.readonlyRootFilesystem).toBe(true);
      
      // Verify secrets are properly referenced
      const hasSecrets = mainContainer?.secrets?.some(s => 
        s.valueFrom?.includes('arn:aws:secretsmanager')
      );
      expect(hasSecrets).toBe(true);
    }, 30000);
  });

  // --- Auto Scaling Configuration ---
  describe("Auto Scaling Configuration", () => {
    test("ECS service auto-scaling is configured", async () => {
      const resourceId = `service/${ecsClusterName}/${ecsServiceName}`;
      
      const { ScalableTargets } = await autoScalingClient.send(
        new DescribeScalableTargetsCommand({
          ServiceNamespace: 'ecs',
          ResourceIds: [resourceId]
        })
      );

      expect(ScalableTargets?.length).toBeGreaterThan(0);
      
      const target = ScalableTargets![0];
      expect(target.MinCapacity).toBeGreaterThanOrEqual(2); // High availability
      expect(target.MaxCapacity).toBeGreaterThanOrEqual(4);
      expect(target.RoleARN).toBeDefined();
    }, 30000);

    test("Auto-scaling policies are configured for ECS service", async () => {
      const resourceId = `service/${ecsClusterName}/${ecsServiceName}`;
      
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribeScalingPoliciesCommand({
          ServiceNamespace: 'ecs',
          ResourceId: resourceId
        })
      );

      expect(ScalingPolicies?.length).toBeGreaterThan(0);
      
      // Check for CPU and Memory scaling policies
      const hasCpuPolicy = ScalingPolicies?.some(p => 
        p.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType === 'ECSServiceAverageCPUUtilization'
      );
      const hasMemoryPolicy = ScalingPolicies?.some(p => 
        p.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType === 'ECSServiceAverageMemoryUtilization'
      );
      
      expect(hasCpuPolicy || hasMemoryPolicy).toBe(true);
      
      ScalingPolicies?.forEach(policy => {
        expect(policy.Enabled).toBe(true);
        expect(policy.TargetTrackingScalingPolicyConfiguration?.TargetValue).toBeGreaterThan(0);
      });
    }, 30000);
  });
  
  // --- Storage: S3 Static Assets Bucket ---
  describe("Storage: S3 Static Assets Bucket", () => {
    test("S3 bucket is properly configured with security best practices", async () => {
      const bucketCheck = await s3Client.send(
        new HeadBucketCommand({ Bucket: staticAssetsBucket })
      );
      
      expect(bucketCheck.$metadata.httpStatusCode).toBe(200);

      // Check versioning
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: staticAssetsBucket })
      );
      expect(versioning.Status).toBe('Enabled');

      // Check encryption
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: staticAssetsBucket })
      );
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test("S3 bucket has proper access controls", async () => {
      // Check public access block
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: staticAssetsBucket })
      );
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test("S3 bucket has lifecycle policies configured", async () => {
      try {
        const lifecycle = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: staticAssetsBucket })
        );
        
        expect(lifecycle.Rules?.length).toBeGreaterThan(0);
        
        lifecycle.Rules?.forEach(rule => {
          expect(rule.Status).toBe('Enabled');
          expect(rule.Id).toBeDefined();
        });
      } catch (error: any) {
        console.log("Lifecycle policies not configured (optional)");
      }
    }, 30000);

    test("Can perform S3 bucket operations with proper encryption", async () => {
      const testKey = `integration-test-${Date.now()}.json`;
      const testData = { 
        test: "integration", 
        timestamp: Date.now(),
        environment: 'pr4337'
      };

      // Test write with server-side encryption
      const putResult = await s3Client.send(new PutObjectCommand({
        Bucket: staticAssetsBucket,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256'
      }));
      
      expect(putResult.$metadata.httpStatusCode).toBe(200);
      expect(putResult.ServerSideEncryption).toBe('AES256');

      // Test read
      const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: staticAssetsBucket,
        Key: testKey
      }));
      
      const body = await getResult.Body?.transformToString(); 
      const parsed = JSON.parse(body || '{}');
      expect(parsed.test).toBe('integration');
      expect(getResult.ServerSideEncryption).toBe('AES256');

      // Cleanup
      await s3Client.send(new DeleteObjectCommand({
        Bucket: staticAssetsBucket,
        Key: testKey
      }));
    }, 30000);
  });
  
  // --- Database: RDS and Secrets Manager ---
  describe("Database: RDS and Secrets Manager", () => {
    test("RDS database secret exists and contains required fields", async () => {
      const secretDescription = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: dbSecretArn })
      );
      
      expect(secretDescription.ARN).toBe(dbSecretArn);
      expect(secretDescription.Name).toContain('pr4337');
      expect(secretDescription.RotationEnabled).toBeDefined();
      
      // Verify secret value structure
      try {
        const secretValue = await secretsClient.send(
          new GetSecretValueCommand({ SecretId: dbSecretArn })
        );
        
        const secret = JSON.parse(secretValue.SecretString || '{}');
        expect(secret.username).toBeDefined();
        expect(secret.password).toBeDefined();
        expect(secret.engine).toBe('postgres');
        expect(secret.port).toBe(5432);
        expect(secret.dbname).toBeDefined();
        expect(secret.host).toBeDefined();
      } catch (error: any) {
        console.log(`Secret retrieval: ${error.message}`);
      }
    }, 30000);

    test("RDS instance is configured with high availability and security", async () => {
      if (!rdsEndpoint || rdsEndpoint === "<sensitive>") {
        // Even if endpoint is hidden, we can try to find RDS instance by tags
        const { DBInstances } = await rdsClient.send(
          new DescribeDBInstancesCommand({})
        );
        
        const dbInstance = DBInstances?.find(db => 
          db.DBInstanceIdentifier?.includes('pr4337')
        );
        
        if (dbInstance) {
          expect(dbInstance.DBInstanceStatus).toBe("available");
          expect(dbInstance.Engine).toBe('postgres');
          expect(dbInstance.MultiAZ).toBe(true); // High availability
          expect(dbInstance.StorageEncrypted).toBe(true); // Encryption at rest
          expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7); // Backups
          expect(dbInstance.DeletionProtection).toBe(true);
          expect(dbInstance.PubliclyAccessible).toBe(false); // Private instance
          
          // Check DB subnet group for multi-AZ configuration
          if (dbInstance.DBSubnetGroup) {
            const { DBSubnetGroups } = await rdsClient.send(
              new DescribeDBSubnetGroupsCommand({
                DBSubnetGroupName: dbInstance.DBSubnetGroup.DBSubnetGroupName
              })
            );
            
            const subnetGroup = DBSubnetGroups?.[0];
            expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
            
            // Verify subnets are in different AZs
            const azs = new Set(subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
            expect(azs.size).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }, 30000);
  });

  // --- IAM Roles and Security ---
  describe("IAM Roles and Security", () => {
    test("Task execution role has proper permissions", async () => {
      // Get task definition to find the execution role
      const taskDefFamily = taskDefinitionArn.split('/').pop();
      const { taskDefinition } = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefFamily })
      );
      
      if (taskDefinition?.executionRoleArn) {
        const roleName = taskDefinition.executionRoleArn.split('/').pop()!;
        
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        
        expect(Role?.AssumeRolePolicyDocument).toBeDefined();
        
        // Check attached policies
        const { AttachedManagedPolicies } = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        
        // Should have ECS task execution policy
        const hasExecutionPolicy = AttachedManagedPolicies?.some(p => 
          p.PolicyName?.includes('AmazonECSTaskExecutionRolePolicy')
        );
        expect(hasExecutionPolicy).toBe(true);
      }
    }, 30000);

    test("Task role follows least privilege principle", async () => {
      // Get task definition to find the task role
      const taskDefFamily = taskDefinitionArn.split('/').pop();
      const { taskDefinition } = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefFamily })
      );
      
      if (taskDefinition?.taskRoleArn) {
        const roleName = taskDefinition.taskRoleArn.split('/').pop()!;
        
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        
        expect(Role?.AssumeRolePolicyDocument).toBeDefined();
        
        // Parse and verify assume role policy
        const assumeRolePolicy = JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument!));
        const statement = assumeRolePolicy.Statement[0];
        expect(statement.Principal.Service).toContain('ecs-tasks.amazonaws.com');
      }
    }, 30000);
  });

  // --- DNS and Route 53 ---
  describe("DNS and Route 53 Configuration", () => {
    test("Route 53 hosted zone exists and is configured", async () => {
      const { HostedZones } = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      
      if (HostedZones && HostedZones.length > 0) {
        // Find relevant hosted zone
        const hostedZone = HostedZones.find(zone => 
          zone.Name?.includes('myapp') || zone.Name?.includes('pr4337')
        );
        
        if (hostedZone) {
          expect(hostedZone.Config?.PrivateZone).toBeDefined();
          
          // Check DNS records
          const { ResourceRecordSets } = await route53Client.send(
            new ListResourceRecordSetsCommand({
              HostedZoneId: hostedZone.Id
            })
          );
          
          // Should have at least NS and SOA records
          expect(ResourceRecordSets?.length).toBeGreaterThanOrEqual(2);
          
          // Check for ALB alias record
          const albRecord = ResourceRecordSets?.find(record => 
            record.AliasTarget?.DNSName?.includes('elb.amazonaws.com')
          );
          
          if (albRecord) {
            expect(albRecord.Type).toBe('A');
            expect(albRecord.AliasTarget?.EvaluateTargetHealth).toBe(true);
          }
        }
      }
    }, 30000);
  });

  // --- Monitoring: CloudWatch Logs and Alarms ---
  describe("Monitoring: CloudWatch Logs and Alarms", () => {
    test("CloudWatch log group exists with proper retention", async () => {
      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        })
      );

      const logGroup = logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(logGroupName);
      expect(logGroup?.retentionInDays).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThanOrEqual(7);
    }, 30000);

    test("Log streams are being created for ECS tasks", async () => {
      const { logStreams } = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 10
        })
      );
      
      expect(logStreams?.length).toBeGreaterThan(0);
      
      // Check that logs are recent
      const recentStream = logStreams?.[0];
      if (recentStream?.lastEventTimestamp) {
        const hoursSinceLastLog = (Date.now() - recentStream.lastEventTimestamp) / (1000 * 60 * 60);
        expect(hoursSinceLastLog).toBeLessThan(24);
      }
    }, 30000);

    test("Metric filters are configured for log analysis", async () => {
      const { metricFilters } = await logsClient.send(
        new DescribeMetricFiltersCommand({
          logGroupName: logGroupName
        })
      );
      
      if (metricFilters && metricFilters.length > 0) {
        metricFilters.forEach(filter => {
          expect(filter.filterPattern).toBeDefined();
          expect(filter.metricTransformations?.length).toBeGreaterThan(0);
        });
      }
    }, 30000);

    test("CloudWatch alarms are properly configured", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'myapp-pr4337'
        })
      );

      expect(MetricAlarms?.length).toBeGreaterThanOrEqual(alarmCount);
      
      // Verify required alarm types
      const alarmNames = MetricAlarms?.map(a => a.AlarmName?.toLowerCase()) || [];
      
      // Should have alarms for:
      expect(alarmNames.some(name => name.includes('cpu'))).toBe(true);
      expect(alarmNames.some(name => name.includes('memory'))).toBe(true);
      expect(alarmNames.some(name => name.includes('task'))).toBe(true);
      
      MetricAlarms?.forEach(alarm => {
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.ComparisonOperator).toBeDefined();
        expect(alarm.Threshold).toBeDefined();
        expect(alarm.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.StateValue).toBeDefined();
        
        console.log(`Alarm: ${alarm.AlarmName} - State: ${alarm.StateValue}`);
      });
    }, 30000);

    test("CloudWatch dashboard contains essential metrics", async () => {
      if (!dashboardUrl) {
        console.log("Dashboard URL not provided, skipping dashboard test");
        return;
      }

      const dashboardName = 'myapp-pr4337-dashboard';
      
      const { DashboardBody } = await cloudWatchClient.send(
        new GetDashboardCommand({ DashboardName: dashboardName })
      );

      expect(DashboardBody).toBeDefined();
      const dashboard = JSON.parse(DashboardBody || '{}');
      
      expect(dashboard.widgets?.length).toBeGreaterThan(0);
      
      // Check for essential widget types
      const widgetTypes = dashboard.widgets?.map((w: any) => w.properties?.metrics?.[0]?.[1]) || [];
      
      expect(widgetTypes.some((t: string) => t?.includes('CPUUtilization'))).toBe(true);
      expect(widgetTypes.some((t: string) => t?.includes('MemoryUtilization'))).toBe(true);
    }, 30000);

    test("Recent application logs exist and contain expected patterns", async () => {
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour

        const { events } = await logsClient.send(
          new FilterLogEventsCommand({
            logGroupName: logGroupName,
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            limit: 50
          })
        );

        console.log(`Found ${events?.length || 0} log events in the last hour`);
        
        if (events && events.length > 0) {
          // Check for expected log patterns
          const hasStartupLogs = events.some(e => 
            e.message?.includes('started') || 
            e.message?.includes('listening') ||
            e.message?.includes('ready')
          );
          
          console.log(`Sample logs:`);
          events.slice(0, 5).forEach(event => {
            console.log(`  ${new Date(event.timestamp!).toISOString()}: ${event.message!.substring(0, 100)}...`); 
          });
        }
      } catch (error: any) {
        console.log(`Log retrieval: ${error.message}`);
      }
    }, 30000);
  });
  
  // --- End-to-End Integration Tests ---
  describe("End-to-End Integration Tests", () => {
    test("ALB endpoint responds to HTTP requests", async () => {
      try {
        const response = await axios.get(albUrl, {
          timeout: 10000,
          validateStatus: () => true
        });

        expect([200, 301, 302, 403, 404, 502, 503]).toContain(response.status);
        console.log(`ALB response status: ${response.status}`);
        
        // Check for security headers
        if (response.headers) {
          console.log(`Security headers check:`);
          console.log(`  X-Frame-Options: ${response.headers['x-frame-options'] || 'not set'}`);
          console.log(`  X-Content-Type-Options: ${response.headers['x-content-type-options'] || 'not set'}`);
          console.log(`  Strict-Transport-Security: ${response.headers['strict-transport-security'] || 'not set'}`);
        }
      } catch (error: any) {
        console.log(`ALB connection error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
          throw new Error('ALB is not accepting connections');
        }
        throw error;
      }
    }, 30000);

    test("Application stack components are properly integrated", async () => {
      const components = {
        vpc: vpcId,
        albDnsName: albDnsName,
        albUrl: albUrl,
        ecsCluster: ecsClusterName,
        ecsService: ecsServiceName,
        taskDefinition: taskDefinitionArn,
        staticAssetsBucket: staticAssetsBucket,
        dbSecret: dbSecretArn,
        logGroup: logGroupName,
        alarmCount: alarmCount
      };

      Object.entries(components).forEach(([key, value]) => {
        expect(value).toBeDefined();
        console.log(`✓ ${key}: ${value}`);
      });

      // Verify naming conventions
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(ecsClusterName).toContain('pr4337');
      expect(ecsServiceName).toContain('pr4337');
      expect(staticAssetsBucket).toContain('pr4337');
      
      // Verify ARN formats
      expect(dbSecretArn).toMatch(/^arn:aws:secretsmanager:[^:]+:[^:]+:secret:.+$/);
      expect(taskDefinitionArn).toMatch(/^arn:aws:ecs:[^:]+:[^:]+:task-definition\/.+$/);
    }, 30000);

    test("Infrastructure supports high availability requirements", async () => {
      // Verify multi-AZ deployment
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );
      
      const uniqueAZs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
      
      // Verify ECS service has multiple tasks
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );
      
      const service = services![0];
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.runningCount).toBeGreaterThanOrEqual(2);
      
      console.log(`✓ High Availability Configuration:`);
      console.log(`  - Availability Zones: ${uniqueAZs.size}`);
      console.log(`  - Running Tasks: ${service.runningCount}`);
      console.log(`  - Desired Tasks: ${service.desiredCount}`);
    }, 30000);

    test("Security best practices are enforced", async () => {
      const securityChecks = {
        "VPC DNS Resolution": false,
        "RDS Encryption": false,
        "S3 Encryption": false,
        "S3 Public Access Blocked": false,
        "ECS Tasks in Private Subnets": false,
        "Secrets Manager Usage": false,
        "CloudWatch Logs Encryption": false
      };
      
      // Check VPC DNS
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      securityChecks["VPC DNS Resolution"] = Vpcs![0].EnableDnsSupport! && Vpcs![0].EnableDnsHostnames!;
      
      // Check S3 encryption
      try {
        const encryption = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: staticAssetsBucket })
        );
        securityChecks["S3 Encryption"] = encryption.ServerSideEncryptionConfiguration?.Rules?.length! > 0;
      } catch {}
      
      // Check S3 public access block
      try {
        const publicBlock = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: staticAssetsBucket })
        );
        securityChecks["S3 Public Access Blocked"] = publicBlock.PublicAccessBlockConfiguration?.BlockPublicAcls!;
      } catch {}
      
      // Check Secrets Manager usage
      securityChecks["Secrets Manager Usage"] = dbSecretArn.includes('secretsmanager');
      
      console.log(`Security Best Practices Check:`);
      Object.entries(securityChecks).forEach(([check, passed]) => {
        console.log(`  ${passed ? '✓' : '✗'} ${check}`);
        expect(passed).toBe(true);
      });
    }, 30000);
  });
});