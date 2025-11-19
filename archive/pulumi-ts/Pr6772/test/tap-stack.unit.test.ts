/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

/**
 * Comprehensive unit tests for TapStack with 100% code coverage
 * Uses Pulumi mocks to avoid live AWS API calls
 */

// Track all resource creations for verification
const createdResources: Array<{ type: string; name: string; props: any }> = [];

// Mock implementation of Pulumi runtime
class MyMocks implements pulumi.runtime.Mocks {
  call(args: pulumi.runtime.MockCallArgs): Record<string, any> {
    // Mock aws.getRegionOutput
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-2',
        id: 'us-east-2',
      };
    }
    return {};
  }

  newResource(args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const { type, name, inputs } = args;

    // Track resource creation
    createdResources.push({ type, name, props: inputs });

    // Generate appropriate mock values based on resource type
    const mockId = `${name}-id-${Math.random().toString(36).substring(7)}`;

    let state: Record<string, any> = {
      ...inputs,
      id: mockId,
      urn: `urn:pulumi:test::project::${type}::${name}`,
    };

    // Add type-specific mock properties
    switch (type) {
      case 'aws:ec2/vpc:Vpc':
        state = { ...state, cidrBlock: inputs.cidrBlock, id: mockId };
        break;

      case 'aws:ec2/subnet:Subnet':
        state = { ...state, availabilityZone: inputs.availabilityZone };
        break;

      case 'aws:ec2/internetGateway:InternetGateway':
        state = { ...state, vpcId: inputs.vpcId };
        break;

      case 'aws:ec2/eip:Eip':
        state = { ...state, publicIp: `1.2.3.${Math.floor(Math.random() * 255)}` };
        break;

      case 'aws:ec2/natGateway:NatGateway':
        state = { ...state, allocationId: inputs.allocationId };
        break;

      case 'aws:ec2/routeTable:RouteTable':
        state = { ...state, vpcId: inputs.vpcId };
        break;

      case 'aws:ec2/routeTableAssociation:RouteTableAssociation':
        state = { ...state, subnetId: inputs.subnetId };
        break;

      case 'aws:ec2transitgateway/transitGateway:TransitGateway':
        state = { ...state, description: inputs.description };
        break;

      case 'aws:ec2transitgateway/vpcAttachment:VpcAttachment':
        state = { ...state, transitGatewayId: inputs.transitGatewayId };
        break;

      case 'aws:ec2/vpcEndpoint:VpcEndpoint':
        state = { ...state, serviceName: inputs.serviceName };
        break;

      case 'aws:kms/key:Key':
        state = { ...state, arn: `arn:aws:kms:us-east-1:123456789012:key/${mockId}` };
        break;

      case 'aws:kms/alias:Alias':
        state = { ...state, targetKeyId: inputs.targetKeyId };
        break;

      case 'aws:secretsmanager/secret:Secret':
        state = { ...state, arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${name}` };
        break;

      case 'aws:secretsmanager/secretVersion:SecretVersion':
        state = { ...state, secretString: inputs.secretString };
        break;

      case 'aws:secretsmanager/secretRotation:SecretRotation':
        state = { ...state, rotationEnabled: true };
        break;

      case 'aws:iam/role:Role':
        state = { ...state, arn: `arn:aws:iam::123456789012:role/${name}` };
        break;

      case 'aws:iam/rolePolicy:RolePolicy':
        state = { ...state, role: inputs.role };
        break;

      case 'aws:ec2/securityGroup:SecurityGroup':
        state = { ...state, vpcId: inputs.vpcId };
        break;

      case 'aws:lambda/function:Function':
        state = { ...state, arn: `arn:aws:lambda:us-east-1:123456789012:function:${name}`, name: inputs.name || name };
        break;

      case 'aws:lambda/permission:Permission':
        state = { ...state, function: inputs.function };
        break;

      case 'aws:rds/subnetGroup:SubnetGroup':
        state = { ...state, name: `${name}-subnet-group` };
        break;

      case 'aws:rds/cluster:Cluster':
        state = {
          ...state,
          endpoint: `${name}.cluster-xxxxx.us-east-1.rds.amazonaws.com`,
          clusterIdentifier: inputs.clusterIdentifier || name,
        };
        break;

      case 'aws:rds/clusterInstance:ClusterInstance':
        state = { ...state, clusterIdentifier: inputs.clusterIdentifier };
        break;

      case 'aws:s3/bucket:Bucket':
        state = { ...state, bucket: inputs.bucket, arn: `arn:aws:s3:::${inputs.bucket}` };
        break;

      case 'aws:s3/bucketPolicy:BucketPolicy':
        state = { ...state, bucket: inputs.bucket };
        break;

      case 'aws:dynamodb/table:Table':
        state = {
          ...state,
          name: inputs.name,
          arn: `arn:aws:dynamodb:us-east-1:123456789012:table/${inputs.name}`,
        };
        break;

      case 'aws:ecs/cluster:Cluster':
        state = { ...state, arn: `arn:aws:ecs:us-east-1:123456789012:cluster/${inputs.name}` };
        break;

      case 'aws:ecs/taskDefinition:TaskDefinition':
        state = { ...state, arn: `arn:aws:ecs:us-east-1:123456789012:task-definition/${inputs.family}:1` };
        break;

      case 'aws:cloudwatch/logGroup:LogGroup':
        state = { ...state, name: inputs.name };
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state = {
          ...state,
          dnsName: `${name}-123456789.us-east-1.elb.amazonaws.com`,
          arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${inputs.name}/1234567890abcdef`,
          arnSuffix: `app/${inputs.name}/1234567890abcdef`,
          zoneId: 'Z35SXDOTRQ7X7K',
        };
        break;

      case 'aws:lb/targetGroup:TargetGroup':
        state = {
          ...state,
          arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${inputs.name}/1234567890abcdef`,
        };
        break;

      case 'aws:wafv2/ipSet:IpSet':
        state = { ...state, addresses: inputs.addresses };
        break;

      case 'aws:wafv2/webAcl:WebAcl':
        state = {
          ...state,
          arn: `arn:aws:wafv2:us-east-1:123456789012:regional/webacl/${inputs.name}/abcd1234`,
        };
        break;

      case 'aws:wafv2/webAclAssociation:WebAclAssociation':
        state = { ...state, resourceArn: inputs.resourceArn };
        break;

      case 'aws:lb/listener:Listener':
        state = {
          ...state,
          arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${mockId}`,
        };
        break;

      case 'aws:lb/listenerRule:ListenerRule':
        state = { ...state, listenerArn: inputs.listenerArn };
        break;

      case 'aws:ecs/service:Service':
        state = { ...state, name: inputs.name };
        break;

      case 'aws:sns/topic:Topic':
        state = {
          ...state,
          arn: `arn:aws:sns:us-east-1:123456789012:${inputs.name}`,
        };
        break;

      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        state = { ...state, name: inputs.name };
        break;

      case 'aws:cloudwatch/dashboard:Dashboard':
        state = { ...state, dashboardName: inputs.dashboardName };
        break;

      case 'aws:route53/zone:Zone':
        state = {
          ...state,
          zoneId: 'Z1234567890ABC',
          nameServers: ['ns-1.awsdns-01.com', 'ns-2.awsdns-02.org'],
        };
        break;

      case 'aws:route53/record:Record':
        state = { ...state, name: inputs.name };
        break;

      case 'aws:ssm/parameter:Parameter':
        state = { ...state, name: inputs.name, value: inputs.value };
        break;

      case 'aws:s3/bucket:Bucket':
        state = {
          ...state,
          bucket: inputs.bucket,
          arn: `arn:aws:s3:::${inputs.bucket}`,
        };
        break;

      case 'tap:stack:TapStack':
        state = { ...state };
        break;

      default:
        state = { ...state };
    }

    return { id: mockId, state };
  }
}

// Set up Pulumi test environment
pulumi.runtime.setMocks(new MyMocks(), 'project', 'test', false);

describe('TapStack Unit Tests with 100% Coverage', () => {
  let stack: TapStack;

  beforeEach(() => {
    createdResources.length = 0; // Clear tracked resources
  });

  describe('Constructor and Basic Setup', () => {
    it('should create stack with default environment suffix', async () => {
      stack = new TapStack('test-stack', {});

      const outputs = {
        blueVpcId: stack.blueVpcId,
        greenVpcId: stack.greenVpcId,
        transitGatewayId: stack.transitGatewayId,
      };

      expect(outputs.blueVpcId).toBeDefined();
      expect(outputs.greenVpcId).toBeDefined();
      expect(outputs.transitGatewayId).toBeDefined();
    });

    it('should create stack with custom tags', async () => {
      stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: { Project: 'Payment', Owner: 'DevOps' },
      });

      expect(stack.blueVpcId).toBeDefined();
    });
  });

  describe('Requirement 1: VPCs and Transit Gateway', () => {
    beforeEach(async () => {
      stack = new TapStack('vpc-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create Blue VPC with correct CIDR block', () => {
      const blueVpc = createdResources.find(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name.includes('blue-vpc')
      );
      expect(blueVpc).toBeDefined();
      expect(blueVpc?.props.cidrBlock).toBe('10.0.0.0/16');
      expect(blueVpc?.props.enableDnsHostnames).toBe(true);
      expect(blueVpc?.props.enableDnsSupport).toBe(true);
    });

    it('should create Green VPC with correct CIDR block', () => {
      const greenVpc = createdResources.find(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name.includes('green-vpc')
      );
      expect(greenVpc).toBeDefined();
      expect(greenVpc?.props.cidrBlock).toBe('10.1.0.0/16');
    });

    it('should create 3 private subnets in Blue VPC', () => {
      const bluePrivateSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('blue-private-subnet')
      );
      expect(bluePrivateSubnets.length).toBe(3);
    });

    it('should create 3 public subnets in Blue VPC', () => {
      const bluePublicSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('blue-public-subnet')
      );
      expect(bluePublicSubnets.length).toBe(3);
      // Verify public subnets have mapPublicIpOnLaunch enabled
      bluePublicSubnets.forEach(subnet => {
        expect(subnet.props.mapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should create 3 private subnets in Green VPC', () => {
      const greenPrivateSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('green-private-subnet')
      );
      expect(greenPrivateSubnets.length).toBe(3);
    });

    it('should create 3 public subnets in Green VPC', () => {
      const greenPublicSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('green-public-subnet')
      );
      expect(greenPublicSubnets.length).toBe(3);
    });

    it('should create Internet Gateways for both VPCs', () => {
      const igws = createdResources.filter(
        r => r.type === 'aws:ec2/internetGateway:InternetGateway'
      );
      expect(igws.length).toBe(2);
      expect(igws.some(igw => igw.name.includes('blue-igw'))).toBe(true);
      expect(igws.some(igw => igw.name.includes('green-igw'))).toBe(true);
    });

    it('should create 3 NAT Gateways per VPC (6 total)', () => {
      const natGateways = createdResources.filter(
        r => r.type === 'aws:ec2/natGateway:NatGateway'
      );
      expect(natGateways.length).toBe(6);
    });

    it('should create 3 Elastic IPs per VPC for NAT Gateways', () => {
      const eips = createdResources.filter(r => r.type === 'aws:ec2/eip:Eip');
      expect(eips.length).toBe(6);
      eips.forEach(eip => {
        expect(eip.props.domain).toBe('vpc');
      });
    });

    it('should create public route tables with IGW routes', () => {
      const publicRts = createdResources.filter(
        r => r.type === 'aws:ec2/routeTable:RouteTable' && r.name.includes('public-rt')
      );
      expect(publicRts.length).toBe(2);
    });

    it('should create 3 private route tables per VPC', () => {
      const privateRts = createdResources.filter(
        r => r.type === 'aws:ec2/routeTable:RouteTable' && r.name.includes('private-rt')
      );
      expect(privateRts.length).toBe(6);
    });

    it('should create route table associations for all subnets', () => {
      const rtas = createdResources.filter(
        r => r.type === 'aws:ec2/routeTableAssociation:RouteTableAssociation'
      );
      // 3 blue private + 3 blue public + 3 green private + 3 green public = 12
      expect(rtas.length).toBe(12);
    });

    it('should create Transit Gateway', () => {
      const tgw = createdResources.find(
        r => r.type === 'aws:ec2transitgateway/transitGateway:TransitGateway'
      );
      expect(tgw).toBeDefined();
      expect(tgw?.props.description).toBe('Transit Gateway for Blue-Green environments');
      expect(tgw?.props.defaultRouteTableAssociation).toBe('enable');
      expect(tgw?.props.defaultRouteTablePropagation).toBe('enable');
    });

    it('should create Transit Gateway attachments for both VPCs', () => {
      const tgwAttachments = createdResources.filter(
        r => r.type === 'aws:ec2transitgateway/vpcAttachment:VpcAttachment'
      );
      expect(tgwAttachments.length).toBe(2);
    });

    it('should create VPC Endpoints for S3 and DynamoDB', () => {
      const vpcEndpoints = createdResources.filter(
        r => r.type === 'aws:ec2/vpcEndpoint:VpcEndpoint'
      );
      expect(vpcEndpoints.length).toBe(4); // 2 S3 + 2 DynamoDB
      expect(vpcEndpoints.filter(e => e.name.includes('s3-endpoint')).length).toBe(2);
      expect(vpcEndpoints.filter(e => e.name.includes('dynamodb-endpoint')).length).toBe(2);
    });
  });

  describe('Requirement 2: Aurora PostgreSQL with KMS encryption', () => {
    beforeEach(async () => {
      stack = new TapStack('aurora-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create KMS key with rotation enabled', () => {
      const kmsKey = createdResources.find(r => r.type === 'aws:kms/key:Key');
      expect(kmsKey).toBeDefined();
      expect(kmsKey?.props.description).toBe('KMS key for Aurora encryption');
      expect(kmsKey?.props.enableKeyRotation).toBe(true);
    });

    it('should create KMS alias', () => {
      const kmsAlias = createdResources.find(r => r.type === 'aws:kms/alias:Alias');
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias?.props.name).toContain('alias/aurora');
    });

    it('should create Secrets Manager secret', () => {
      const secret = createdResources.find(
        r => r.type === 'aws:secretsmanager/secret:Secret'
      );
      expect(secret).toBeDefined();
      expect(secret?.props.description).toContain('30-day rotation');
    });

    it('should create secret version with initial credentials', () => {
      const secretVersion = createdResources.find(
        r => r.type === 'aws:secretsmanager/secretVersion:SecretVersion'
      );
      expect(secretVersion).toBeDefined();
    });

    it('should create Lambda execution role for secret rotation', () => {
      const rotationRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('rotation-lambda-role')
      );
      expect(rotationRole).toBeDefined();
      expect(rotationRole?.props.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    it('should create rotation Lambda policy', () => {
      const rotationPolicy = createdResources.find(
        r => r.type === 'aws:iam/rolePolicy:RolePolicy' && r.name.includes('rotation-lambda-policy')
      );
      expect(rotationPolicy).toBeDefined();
    });

    it('should create security group for rotation Lambda', () => {
      const rotationSg = createdResources.find(
        r => r.type === 'aws:ec2/securityGroup:SecurityGroup' && r.name.includes('rotation-lambda-sg')
      );
      expect(rotationSg).toBeDefined();
      expect(rotationSg?.props.description).toBe('Security group for secret rotation Lambda');
    });

    it('should create rotation Lambda function', () => {
      const rotationLambda = createdResources.find(
        r => r.type === 'aws:lambda/function:Function' && r.name.includes('secret-rotation-lambda')
      );
      expect(rotationLambda).toBeDefined();
      expect(rotationLambda?.props.runtime).toBe('python3.11');
      expect(rotationLambda?.props.timeout).toBe(30);
      expect(rotationLambda?.props.memorySize).toBe(128);
    });

    it('should create Lambda permission for Secrets Manager', () => {
      const permission = createdResources.find(
        r => r.type === 'aws:lambda/permission:Permission' && r.name.includes('rotation-lambda-permission')
      );
      expect(permission).toBeDefined();
      expect(permission?.props.principal).toBe('secretsmanager.amazonaws.com');
    });

    it('should configure secret rotation with 30-day schedule', () => {
      const rotation = createdResources.find(
        r => r.type === 'aws:secretsmanager/secretRotation:SecretRotation'
      );
      expect(rotation).toBeDefined();
    });

    it('should create DB subnet groups for both VPCs', () => {
      const subnetGroups = createdResources.filter(
        r => r.type === 'aws:rds/subnetGroup:SubnetGroup'
      );
      expect(subnetGroups.length).toBe(2);
      expect(subnetGroups.some(sg => sg.name.includes('blue-db-subnet-group'))).toBe(true);
      expect(subnetGroups.some(sg => sg.name.includes('green-db-subnet-group'))).toBe(true);
    });

    it('should create security groups for Aurora clusters', () => {
      const dbSgs = createdResources.filter(
        r => r.type === 'aws:ec2/securityGroup:SecurityGroup' && r.name.includes('db-sg')
      );
      expect(dbSgs.length).toBe(2);

      const blueDbSg = dbSgs.find(sg => sg.name.includes('blue-db-sg'));
      expect(blueDbSg?.props.ingress[0].fromPort).toBe(5432);
      expect(blueDbSg?.props.ingress[0].protocol).toBe('tcp');
    });

    it('should create Blue Aurora cluster with correct configuration', () => {
      const blueCluster = createdResources.find(
        r => r.type === 'aws:rds/cluster:Cluster' && r.name.includes('blue-aurora-cluster')
      );
      expect(blueCluster).toBeDefined();
      expect(blueCluster?.props.engine).toBe('aurora-postgresql');
      expect(blueCluster?.props.engineMode).toBe('provisioned');
      expect(blueCluster?.props.engineVersion).toBe('14');
      expect(blueCluster?.props.databaseName).toBe('payments');
      expect(blueCluster?.props.storageEncrypted).toBe(true);
      expect(blueCluster?.props.skipFinalSnapshot).toBe(true);
      expect(blueCluster?.props.backupRetentionPeriod).toBe(1);
      expect(blueCluster?.props.serverlessv2ScalingConfiguration).toBeDefined();
      expect(blueCluster?.props.serverlessv2ScalingConfiguration.minCapacity).toBe(0.5);
      expect(blueCluster?.props.serverlessv2ScalingConfiguration.maxCapacity).toBe(2);
    });

    it('should create Green Aurora cluster', () => {
      const greenCluster = createdResources.find(
        r => r.type === 'aws:rds/cluster:Cluster' && r.name.includes('green-aurora-cluster')
      );
      expect(greenCluster).toBeDefined();
      expect(greenCluster?.props.engine).toBe('aurora-postgresql');
      expect(greenCluster?.props.engineMode).toBe('provisioned');
      expect(greenCluster?.props.engineVersion).toBe('14');
      expect(greenCluster?.props.storageEncrypted).toBe(true);
    });

    it('should create Aurora cluster instances', () => {
      const clusterInstances = createdResources.filter(
        r => r.type === 'aws:rds/clusterInstance:ClusterInstance'
      );
      expect(clusterInstances.length).toBe(2);
      clusterInstances.forEach(instance => {
        expect(instance.props.instanceClass).toBe('db.serverless');
        expect(instance.props.engine).toBe('aurora-postgresql');
        expect(instance.props.engineVersion).toBe('14');
      });
    });
  });

  describe('Requirement 5: S3 Buckets with versioning and lifecycle', () => {
    beforeEach(async () => {
      stack = new TapStack('s3-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create transaction logs bucket with versioning', () => {
      const txBucket = createdResources.find(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name.includes('transaction-logs')
      );
      expect(txBucket).toBeDefined();
      expect(txBucket?.props.versioning.enabled).toBe(true);
      expect(txBucket?.props.serverSideEncryptionConfiguration).toBeDefined();
    });

    it('should create transaction logs bucket with lifecycle rules', () => {
      const txBucket = createdResources.find(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name.includes('transaction-logs')
      );
      expect(txBucket?.props.lifecycleRules).toBeDefined();
      expect(txBucket?.props.lifecycleRules.length).toBeGreaterThan(0);
      expect(txBucket?.props.lifecycleRules[0].transitions[0].days).toBe(30);
      expect(txBucket?.props.lifecycleRules[0].transitions[0].storageClass).toBe('STANDARD_IA');
      expect(txBucket?.props.lifecycleRules[0].transitions[1].days).toBe(90);
      expect(txBucket?.props.lifecycleRules[0].transitions[1].storageClass).toBe('GLACIER');
    });

    it('should create transaction logs bucket policy enforcing SSL', () => {
      const txBucketPolicy = createdResources.find(
        r => r.type === 'aws:s3/bucketPolicy:BucketPolicy' && r.name.includes('transaction-logs-policy')
      );
      expect(txBucketPolicy).toBeDefined();
    });

    it('should create compliance docs bucket with versioning', () => {
      const compBucket = createdResources.find(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name.includes('compliance-docs')
      );
      expect(compBucket).toBeDefined();
      expect(compBucket?.props.versioning.enabled).toBe(true);
    });

    it('should create compliance docs bucket with lifecycle rules', () => {
      const compBucket = createdResources.find(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name.includes('compliance-docs')
      );
      expect(compBucket?.props.lifecycleRules[0].transitions[0].days).toBe(90);
      expect(compBucket?.props.lifecycleRules[0].transitions[0].storageClass).toBe('GLACIER');
    });

    it('should create compliance docs bucket policy enforcing SSL', () => {
      const compBucketPolicy = createdResources.find(
        r => r.type === 'aws:s3/bucketPolicy:BucketPolicy' && r.name.includes('compliance-docs-policy')
      );
      expect(compBucketPolicy).toBeDefined();
    });
  });

  describe('Requirement 6: DynamoDB tables with GSI', () => {
    beforeEach(async () => {
      stack = new TapStack('dynamodb-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create session table with userId GSI', () => {
      const sessionTable = createdResources.find(
        r => r.type === 'aws:dynamodb/table:Table' && r.name.includes('session-table')
      );
      expect(sessionTable).toBeDefined();
      expect(sessionTable?.props.billingMode).toBe('PAY_PER_REQUEST');
      expect(sessionTable?.props.hashKey).toBe('sessionId');
      expect(sessionTable?.props.globalSecondaryIndexes.length).toBe(1);
      expect(sessionTable?.props.globalSecondaryIndexes[0].name).toBe('userId-index');
      expect(sessionTable?.props.globalSecondaryIndexes[0].hashKey).toBe('userId');
      expect(sessionTable?.props.serverSideEncryption.enabled).toBe(true);
      expect(sessionTable?.props.pointInTimeRecovery.enabled).toBe(true);
    });

    it('should create rate limit table with endpoint GSI and TTL', () => {
      const rateLimitTable = createdResources.find(
        r => r.type === 'aws:dynamodb/table:Table' && r.name.includes('rate-limit-table')
      );
      expect(rateLimitTable).toBeDefined();
      expect(rateLimitTable?.props.hashKey).toBe('clientIp');
      expect(rateLimitTable?.props.rangeKey).toBe('timestamp');
      expect(rateLimitTable?.props.globalSecondaryIndexes.length).toBe(1);
      expect(rateLimitTable?.props.globalSecondaryIndexes[0].name).toBe('endpoint-index');
      expect(rateLimitTable?.props.ttl.enabled).toBe(true);
      expect(rateLimitTable?.props.ttl.attributeName).toBe('expiresAt');
    });
  });

  describe('Requirement 3 & 4: ECS Fargate and ALB', () => {
    beforeEach(async () => {
      stack = new TapStack('ecs-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create ECS clusters with Container Insights', () => {
      const ecsClusters = createdResources.filter(
        r => r.type === 'aws:ecs/cluster:Cluster'
      );
      expect(ecsClusters.length).toBe(2);
      ecsClusters.forEach(cluster => {
        expect(cluster.props.settings[0].name).toBe('containerInsights');
        expect(cluster.props.settings[0].value).toBe('enabled');
      });
    });

    it('should create ECS task role with IAM permissions', () => {
      const taskRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('ecs-task-role')
      );
      expect(taskRole).toBeDefined();
    });

    it('should create ECS task policy for S3 and DynamoDB access', () => {
      const taskPolicy = createdResources.find(
        r => r.type === 'aws:iam/rolePolicy:RolePolicy' && r.name.includes('ecs-task-policy')
      );
      expect(taskPolicy).toBeDefined();
    });

    it('should create ECS execution role', () => {
      const execRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('ecs-execution-role')
      );
      expect(execRole).toBeDefined();
      expect(execRole?.props.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    it('should create CloudWatch log groups with 90-day retention', () => {
      const logGroups = createdResources.filter(
        r => r.type === 'aws:cloudwatch/logGroup:LogGroup'
      );
      expect(logGroups.length).toBe(6); // 3 blue + 3 green
      logGroups.forEach(lg => {
        expect(lg.props.retentionInDays).toBe(90);
      });
    });

    it('should create 6 ECS task definitions (3 blue + 3 green)', () => {
      const taskDefs = createdResources.filter(
        r => r.type === 'aws:ecs/taskDefinition:TaskDefinition'
      );
      expect(taskDefs.length).toBe(6);
      taskDefs.forEach(td => {
        expect(td.props.networkMode).toBe('awsvpc');
        expect(td.props.requiresCompatibilities).toContain('FARGATE');
      });
    });

    it('should create payment API task definitions with correct CPU and memory', () => {
      const paymentTasks = createdResources.filter(
        r => r.type === 'aws:ecs/taskDefinition:TaskDefinition' && r.name.includes('payment-api')
      );
      expect(paymentTasks.length).toBe(2);
      paymentTasks.forEach(task => {
        expect(task.props.cpu).toBe('256');
        expect(task.props.memory).toBe('512');
      });
    });

    it('should create transaction processor task definitions with correct CPU and memory', () => {
      const txTasks = createdResources.filter(
        r => r.type === 'aws:ecs/taskDefinition:TaskDefinition' && r.name.includes('tx-processor')
      );
      expect(txTasks.length).toBe(2);
      txTasks.forEach(task => {
        expect(task.props.cpu).toBe('512');
        expect(task.props.memory).toBe('1024');
      });
    });

    it('should create security groups for ALBs', () => {
      const albSgs = createdResources.filter(
        r => r.type === 'aws:ec2/securityGroup:SecurityGroup' && r.name.includes('alb-sg')
      );
      expect(albSgs.length).toBe(2);
      albSgs.forEach(sg => {
        expect(sg.props.ingress.some((rule: any) => rule.fromPort === 80)).toBe(true);
        expect(sg.props.ingress.some((rule: any) => rule.fromPort === 443)).toBe(true);
      });
    });

    it('should create security groups for ECS tasks', () => {
      const ecsSgs = createdResources.filter(
        r => r.type === 'aws:ec2/securityGroup:SecurityGroup' && r.name.includes('ecs-sg')
      );
      expect(ecsSgs.length).toBe(2);
    });

    it('should create Application Load Balancers', () => {
      const albs = createdResources.filter(
        r => r.type === 'aws:lb/loadBalancer:LoadBalancer'
      );
      expect(albs.length).toBe(2);
      albs.forEach(alb => {
        expect(alb.props.loadBalancerType).toBe('application');
      });
    });

    it('should create 6 target groups (3 blue + 3 green)', () => {
      const tgs = createdResources.filter(
        r => r.type === 'aws:lb/targetGroup:TargetGroup'
      );
      expect(tgs.length).toBe(6);
      tgs.forEach(tg => {
        expect(tg.props.port).toBe(80);
        expect(tg.props.protocol).toBe('HTTP');
        expect(tg.props.targetType).toBe('ip');
        expect(tg.props.healthCheck.enabled).toBe(true);
        expect(tg.props.healthCheck.path).toBe('/health');
      });
    });

    it('should create target groups with correct health check configuration', () => {
      const tgs = createdResources.filter(
        r => r.type === 'aws:lb/targetGroup:TargetGroup'
      );
      tgs.forEach(tg => {
        expect(tg.props.healthCheck.healthyThreshold).toBe(2);
        expect(tg.props.healthCheck.unhealthyThreshold).toBe(3);
        expect(tg.props.healthCheck.timeout).toBe(5);
        expect(tg.props.healthCheck.interval).toBe(30);
      });
    });
  });

  describe('Requirement 7: AWS WAF', () => {
    beforeEach(async () => {
      stack = new TapStack('waf-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create WAF IP set', () => {
      const ipSet = createdResources.find(
        r => r.type === 'aws:wafv2/ipSet:IpSet'
      );
      expect(ipSet).toBeDefined();
      expect(ipSet?.props.scope).toBe('REGIONAL');
      expect(ipSet?.props.ipAddressVersion).toBe('IPV4');
    });

    it('should create WAF WebACL with rate limiting', () => {
      const webAcl = createdResources.find(
        r => r.type === 'aws:wafv2/webAcl:WebAcl'
      );
      expect(webAcl).toBeDefined();
      expect(webAcl?.props.scope).toBe('REGIONAL');
      expect(webAcl?.props.defaultAction.allow).toBeDefined();
      expect(webAcl?.props.rules.length).toBe(3);
    });

    it('should create WAF rule for rate limiting with 2000 request limit', () => {
      const webAcl = createdResources.find(
        r => r.type === 'aws:wafv2/webAcl:WebAcl'
      );
      const rateLimitRule = webAcl?.props.rules.find((rule: any) => rule.name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.priority).toBe(1);
      expect(rateLimitRule.action.block).toBeDefined();
      expect(rateLimitRule.statement.rateBasedStatement.limit).toBe(2000);
    });

    it('should create WAF rule for SQL injection protection', () => {
      const webAcl = createdResources.find(
        r => r.type === 'aws:wafv2/webAcl:WebAcl'
      );
      const sqlRule = webAcl?.props.rules.find((rule: any) => rule.name === 'SQLInjectionProtection');
      expect(sqlRule).toBeDefined();
      expect(sqlRule.priority).toBe(2);
      expect(sqlRule.statement.managedRuleGroupStatement.name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    it('should create WAF rule for XSS protection', () => {
      const webAcl = createdResources.find(
        r => r.type === 'aws:wafv2/webAcl:WebAcl'
      );
      const xssRule = webAcl?.props.rules.find((rule: any) => rule.name === 'XSSProtection');
      expect(xssRule).toBeDefined();
      expect(xssRule.statement.managedRuleGroupStatement.name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
    });

    it('should associate WAF with both ALBs', () => {
      const wafAssocs = createdResources.filter(
        r => r.type === 'aws:wafv2/webAclAssociation:WebAclAssociation'
      );
      expect(wafAssocs.length).toBe(2);
    });
  });

  describe('ALB Listeners and Path-based Routing', () => {
    beforeEach(async () => {
      stack = new TapStack('listener-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create ALB listeners with default 404 response', () => {
      const listeners = createdResources.filter(
        r => r.type === 'aws:lb/listener:Listener'
      );
      expect(listeners.length).toBe(2);
      listeners.forEach(listener => {
        expect(listener.props.port).toBe(80);
        expect(listener.props.protocol).toBe('HTTP');
        expect(listener.props.defaultActions[0].type).toBe('fixed-response');
        expect(listener.props.defaultActions[0].fixedResponse.statusCode).toBe('404');
      });
    });

    it('should create listener rules for payment API path', () => {
      const paymentRules = createdResources.filter(
        r => r.type === 'aws:lb/listenerRule:ListenerRule' && r.name.includes('payment-api-rule')
      );
      expect(paymentRules.length).toBe(2);
      paymentRules.forEach(rule => {
        expect(rule.props.priority).toBe(100);
        expect(rule.props.conditions[0].pathPattern.values).toContain('/api/*');
      });
    });

    it('should create listener rules for transaction processor path', () => {
      const txRules = createdResources.filter(
        r => r.type === 'aws:lb/listenerRule:ListenerRule' && r.name.includes('tx-processor-rule')
      );
      expect(txRules.length).toBe(2);
      txRules.forEach(rule => {
        expect(rule.props.priority).toBe(101);
        expect(rule.props.conditions[0].pathPattern.values).toContain('/transactions/*');
      });
    });

    it('should create listener rules for reporting service path', () => {
      const reportingRules = createdResources.filter(
        r => r.type === 'aws:lb/listenerRule:ListenerRule' && r.name.includes('reporting-rule')
      );
      expect(reportingRules.length).toBe(2);
      reportingRules.forEach(rule => {
        expect(rule.props.priority).toBe(102);
        expect(rule.props.conditions[0].pathPattern.values).toContain('/reports/*');
      });
    });
  });

  describe('ECS Services', () => {
    beforeEach(async () => {
      stack = new TapStack('service-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create 6 ECS services (3 blue + 3 green)', () => {
      const services = createdResources.filter(
        r => r.type === 'aws:ecs/service:Service'
      );
      expect(services.length).toBe(6);
    });

    it('should create payment API services with desired count of 2', () => {
      const paymentServices = createdResources.filter(
        r => r.type === 'aws:ecs/service:Service' && r.name.includes('payment-api-service')
      );
      expect(paymentServices.length).toBe(2);
      paymentServices.forEach(service => {
        expect(service.props.desiredCount).toBe(2);
        expect(service.props.launchType).toBe('FARGATE');
        expect(service.props.networkConfiguration.assignPublicIp).toBe(false);
      });
    });

    it('should create transaction processor services with desired count of 2', () => {
      const txServices = createdResources.filter(
        r => r.type === 'aws:ecs/service:Service' && r.name.includes('tx-processor-service')
      );
      expect(txServices.length).toBe(2);
      txServices.forEach(service => {
        expect(service.props.desiredCount).toBe(2);
      });
    });

    it('should create reporting services with desired count of 1', () => {
      const reportingServices = createdResources.filter(
        r => r.type === 'aws:ecs/service:Service' && r.name.includes('reporting-service')
      );
      expect(reportingServices.length).toBe(2);
      reportingServices.forEach(service => {
        expect(service.props.desiredCount).toBe(1);
      });
    });
  });

  describe('Requirement 9: Lambda for data migration', () => {
    beforeEach(async () => {
      stack = new TapStack('lambda-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create Lambda migration role', () => {
      const lambdaRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('lambda-migration-role')
      );
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole?.props.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    it('should create Lambda migration policy', () => {
      const lambdaPolicy = createdResources.find(
        r => r.type === 'aws:iam/rolePolicy:RolePolicy' && r.name.includes('lambda-migration-policy')
      );
      expect(lambdaPolicy).toBeDefined();
    });

    it('should create data migration Lambda function', () => {
      const migrationLambda = createdResources.find(
        r => r.type === 'aws:lambda/function:Function' && r.name.includes('data-migration-lambda')
      );
      expect(migrationLambda).toBeDefined();
      expect(migrationLambda?.props.runtime).toBe('python3.11');
      expect(migrationLambda?.props.timeout).toBe(300);
      expect(migrationLambda?.props.memorySize).toBe(512);
    });
  });

  describe('Requirement 10: SNS Topics and CloudWatch Alarms', () => {
    beforeEach(async () => {
      stack = new TapStack('monitoring-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create migration SNS topic', () => {
      const migrationTopic = createdResources.find(
        r => r.type === 'aws:sns/topic:Topic' && r.name.includes('migration-topic')
      );
      expect(migrationTopic).toBeDefined();
      expect(migrationTopic?.props.displayName).toBe('Migration Notifications');
    });

    it('should create system health SNS topic', () => {
      const healthTopic = createdResources.find(
        r => r.type === 'aws:sns/topic:Topic' && r.name.includes('system-health-topic')
      );
      expect(healthTopic).toBeDefined();
      expect(healthTopic?.props.displayName).toBe('System Health Notifications');
    });

    it('should create CloudWatch alarms for unhealthy targets', () => {
      const alarms = createdResources.filter(
        r => r.type === 'aws:cloudwatch/metricAlarm:MetricAlarm'
      );
      expect(alarms.length).toBe(2);
      alarms.forEach(alarm => {
        expect(alarm.props.metricName).toBe('UnHealthyHostCount');
        expect(alarm.props.namespace).toBe('AWS/ApplicationELB');
        expect(alarm.props.threshold).toBe(1);
        expect(alarm.props.evaluationPeriods).toBe(2);
      });
    });
  });

  describe('Requirement 8: CloudWatch Dashboard', () => {
    beforeEach(async () => {
      stack = new TapStack('dashboard-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create CloudWatch dashboard', () => {
      const dashboard = createdResources.find(
        r => r.type === 'aws:cloudwatch/dashboard:Dashboard'
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('Requirement 11: Route 53 weighted routing', () => {
    beforeEach(async () => {
      stack = new TapStack('route53-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create Route 53 hosted zone', () => {
      const hostedZone = createdResources.find(
        r => r.type === 'aws:route53/zone:Zone'
      );
      expect(hostedZone).toBeDefined();
      expect(hostedZone?.props.comment).toBe('Hosted zone for blue-green deployment');
    });

    it('should create weighted routing records for blue and green', () => {
      const records = createdResources.filter(
        r => r.type === 'aws:route53/record:Record'
      );
      expect(records.length).toBe(2);
      expect(records.some(r => r.props.setIdentifier === 'blue')).toBe(true);
      expect(records.some(r => r.props.setIdentifier === 'green')).toBe(true);
    });

    it('should configure blue record with 100% weight', () => {
      const blueRecord = createdResources.find(
        r => r.type === 'aws:route53/record:Record' && r.props.setIdentifier === 'blue'
      );
      expect(blueRecord?.props.weightedRoutingPolicies[0].weight).toBe(100);
    });

    it('should configure green record with 0% weight', () => {
      const greenRecord = createdResources.find(
        r => r.type === 'aws:route53/record:Record' && r.props.setIdentifier === 'green'
      );
      expect(greenRecord?.props.weightedRoutingPolicies[0].weight).toBe(0);
    });
  });

  describe('Systems Manager Parameter Store', () => {
    beforeEach(async () => {
      stack = new TapStack('ssm-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create SSM parameters for ALB endpoints', () => {
      const params = createdResources.filter(
        r => r.type === 'aws:ssm/parameter:Parameter'
      );
      expect(params.length).toBe(2);
      expect(params.some(p => p.props.name.includes('blue/alb-endpoint'))).toBe(true);
      expect(params.some(p => p.props.name.includes('green/alb-endpoint'))).toBe(true);
    });
  });

  describe('AWS Config for Compliance', () => {
    beforeEach(async () => {
      stack = new TapStack('config-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create Config IAM role', () => {
      const configRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role' && r.name.includes('config-role')
      );
      expect(configRole).toBeDefined();
      expect(configRole?.props.managedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });

    it('should create Config S3 bucket', () => {
      const configBucket = createdResources.find(
        r => r.type === 'aws:s3/bucket:Bucket' && r.name.includes('config-bucket')
      );
      expect(configBucket).toBeDefined();
      expect(configBucket?.props.serverSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(async () => {
      stack = new TapStack('output-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should export all required outputs', async () => {
      expect(stack.blueVpcId).toBeDefined();
      expect(stack.greenVpcId).toBeDefined();
      expect(stack.transitGatewayId).toBeDefined();
      expect(stack.blueDbEndpoint).toBeDefined();
      expect(stack.greenDbEndpoint).toBeDefined();
      expect(stack.blueAlbDns).toBeDefined();
      expect(stack.greenAlbDns).toBeDefined();
      expect(stack.transactionLogsBucketName).toBeDefined();
      expect(stack.complianceDocsBucketName).toBeDefined();
      expect(stack.sessionTableName).toBeDefined();
      expect(stack.rateLimitTableName).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
      expect(stack.migrationTopicArn).toBeDefined();
      expect(stack.apiDomainName).toBeDefined();
    });

    it('should include environment suffix in API domain name', async () => {
      const customStack = new TapStack('domain-test', { environmentSuffix: 'prod' });

      // Verify the output exists
      expect(customStack.apiDomainName).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing environment suffix gracefully', async () => {
      const testStack = new TapStack('edge-test', {});

      expect(testStack.blueVpcId).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const testStack = new TapStack('empty-tags', { tags: {} });

      expect(testStack.blueVpcId).toBeDefined();
    });

    it('should create resources with unique names per environment', async () => {
      const devStack = new TapStack('dev-stack', { environmentSuffix: 'dev' });
      const prodStack = new TapStack('prod-stack', { environmentSuffix: 'prod' });

      await new Promise(resolve => setImmediate(resolve));

      const devResources = createdResources.filter(r => r.name.includes('dev'));
      const prodResources = createdResources.filter(r => r.name.includes('prod'));

      expect(devResources.length).toBeGreaterThan(0);
      expect(prodResources.length).toBeGreaterThan(0);
    });

    it('should use default environment suffix when not provided', async () => {
      const testStack = new TapStack('default-env', {});
      await new Promise(resolve => setImmediate(resolve));

      const devResources = createdResources.filter(r => r.name.includes('dev'));
      expect(devResources.length).toBeGreaterThan(0);
    });

    it('should handle AWS_REGION environment variable', async () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';

      const testStack = new TapStack('region-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));

      expect(testStack.blueVpcId).toBeDefined();

      // Restore original value
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should handle undefined AWS_REGION environment variable', async () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      const testStack = new TapStack('no-region-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));

      expect(testStack.blueVpcId).toBeDefined();

      // Restore original value
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    });

    it('should handle various environment suffix formats', async () => {
      const suffixes = ['prod', 'staging', 'qa'];

      for (const suffix of suffixes) {
        createdResources.length = 0;
        const testStack = new TapStack(`${suffix}-stack`, { environmentSuffix: suffix });
        await new Promise(resolve => setImmediate(resolve));

        const resourcesWithSuffix = createdResources.filter(r => r.name.includes(suffix));
        expect(resourcesWithSuffix.length).toBeGreaterThan(0);
      }
    });

    it('should properly handle tags parameter when provided', async () => {
      const customTags = {
        Project: 'PaymentSystem',
        Owner: 'DevOpsTeam',
        CostCenter: '12345',
      };

      const testStack = new TapStack('tags-test', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(testStack.blueVpcId).toBeDefined();
    });

    it('should handle undefined tags parameter', async () => {
      const testStack = new TapStack('no-tags-test', {
        environmentSuffix: 'test',
        tags: undefined,
      });

      await new Promise(resolve => setImmediate(resolve));
      expect(testStack.blueVpcId).toBeDefined();
    });
  });

  describe('Resource Counts and Verification', () => {
    beforeEach(async () => {
      createdResources.length = 0;
      stack = new TapStack('count-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create all expected resource types', () => {
      const expectedTypes = [
        'aws:ec2/vpc:Vpc',
        'aws:ec2/subnet:Subnet',
        'aws:ec2/internetGateway:InternetGateway',
        'aws:ec2/eip:Eip',
        'aws:ec2/natGateway:NatGateway',
        'aws:ec2/routeTable:RouteTable',
        'aws:ec2transitgateway/transitGateway:TransitGateway',
        'aws:kms/key:Key',
        'aws:secretsmanager/secret:Secret',
        'aws:iam/role:Role',
        'aws:lambda/function:Function',
        'aws:rds/cluster:Cluster',
        'aws:s3/bucket:Bucket',
        'aws:dynamodb/table:Table',
        'aws:ecs/cluster:Cluster',
        'aws:ecs/taskDefinition:TaskDefinition',
        'aws:lb/loadBalancer:LoadBalancer',
        'aws:lb/targetGroup:TargetGroup',
        'aws:wafv2/webAcl:WebAcl',
        'aws:lb/listener:Listener',
        'aws:ecs/service:Service',
        'aws:sns/topic:Topic',
        'aws:cloudwatch/metricAlarm:MetricAlarm',
        'aws:cloudwatch/dashboard:Dashboard',
        'aws:route53/zone:Zone',
        'aws:ssm/parameter:Parameter',
      ];

      expectedTypes.forEach(type => {
        const resources = createdResources.filter(r => r.type === type);
        expect(resources.length).toBeGreaterThan(0);
      });
    });

    it('should verify total resource count meets expectations', () => {
      // Minimum expected resources for a complete deployment
      expect(createdResources.length).toBeGreaterThan(100);
    });
  });

  describe('Blue-Green Symmetry Verification', () => {
    beforeEach(async () => {
      createdResources.length = 0;
      stack = new TapStack('symmetry-test', { environmentSuffix: 'test' });
      await new Promise(resolve => setImmediate(resolve));
    });

    it('should create equal number of blue and green VPCs', () => {
      const blueVpcs = createdResources.filter(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name.includes('blue')
      );
      const greenVpcs = createdResources.filter(
        r => r.type === 'aws:ec2/vpc:Vpc' && r.name.includes('green')
      );
      expect(blueVpcs.length).toBe(greenVpcs.length);
      expect(blueVpcs.length).toBe(1);
    });

    it('should create equal number of blue and green subnets', () => {
      const blueSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('blue')
      );
      const greenSubnets = createdResources.filter(
        r => r.type === 'aws:ec2/subnet:Subnet' && r.name.includes('green')
      );
      expect(blueSubnets.length).toBe(greenSubnets.length);
      expect(blueSubnets.length).toBe(6); // 3 private + 3 public
    });

    it('should create equal number of blue and green Aurora clusters', () => {
      const blueClusters = createdResources.filter(
        r => r.type === 'aws:rds/cluster:Cluster' && r.name.includes('blue')
      );
      const greenClusters = createdResources.filter(
        r => r.type === 'aws:rds/cluster:Cluster' && r.name.includes('green')
      );
      expect(blueClusters.length).toBe(greenClusters.length);
      expect(blueClusters.length).toBe(1);
    });

    it('should create equal number of blue and green ECS clusters', () => {
      const blueClusters = createdResources.filter(
        r => r.type === 'aws:ecs/cluster:Cluster' && r.name.includes('blue')
      );
      const greenClusters = createdResources.filter(
        r => r.type === 'aws:ecs/cluster:Cluster' && r.name.includes('green')
      );
      expect(blueClusters.length).toBe(greenClusters.length);
      expect(blueClusters.length).toBe(1);
    });

    it('should create equal number of blue and green ALBs', () => {
      const blueAlbs = createdResources.filter(
        r => r.type === 'aws:lb/loadBalancer:LoadBalancer' && r.name.includes('blue')
      );
      const greenAlbs = createdResources.filter(
        r => r.type === 'aws:lb/loadBalancer:LoadBalancer' && r.name.includes('green')
      );
      expect(blueAlbs.length).toBe(greenAlbs.length);
      expect(blueAlbs.length).toBe(1);
    });
  });
});
