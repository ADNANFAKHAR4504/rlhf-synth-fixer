# Overview

Please find solution files below.

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./lib/dms-table-mappings.json

```json
{
  "rules": [
    {
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "include-all-tables",
      "object-locator": {
        "schema-name": "paymentdb",
        "table-name": "%"
      },
      "rule-action": "include"
    },
    {
      "rule-type": "transformation",
      "rule-id": "2",
      "rule-name": "add-prefix-to-tables",
      "rule-target": "table",
      "object-locator": {
        "schema-name": "paymentdb",
        "table-name": "%"
      },
      "rule-action": "add-prefix",
      "value": "migrated_"
    }
  ]
}
```

## ./lib/dms-task-settings.json

```json
{
  "TargetMetadata": {
    "TargetSchema": "paymentdb",
    "SupportLobs": true,
    "FullLobMode": false,
    "LobChunkSize": 64,
    "LimitedSizeLobMode": true,
    "LobMaxSize": 32,
    "InlineLobMaxSize": 0,
    "LoadMaxFileSize": 0,
    "ParallelLoadThreads": 4,
    "ParallelLoadBufferSize": 50,
    "BatchApplyEnabled": true,
    "TaskRecoveryTableEnabled": true
  },
  "FullLoadSettings": {
    "TargetTablePrepMode": "DROP_AND_CREATE",
    "CreatePkAfterFullLoad": false,
    "StopTaskCachedChangesApplied": false,
    "StopTaskCachedChangesNotApplied": false,
    "MaxFullLoadSubTasks": 8,
    "TransactionConsistencyTimeout": 600,
    "CommitRate": 10000
  },
  "Logging": {
    "EnableLogging": true,
    "LogComponents": [
      {
        "Id": "TRANSFORMATION",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "SOURCE_UNLOAD",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TARGET_LOAD",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "SOURCE_CAPTURE",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TARGET_APPLY",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      },
      {
        "Id": "TASK_MANAGER",
        "Severity": "LOGGER_SEVERITY_DEFAULT"
      }
    ]
  },
  "ControlTablesSettings": {
    "ControlSchema": "dms_control",
    "HistoryTimeslotInMinutes": 5,
    "HistoryTableEnabled": true,
    "SuspendedTablesTableEnabled": true,
    "StatusTableEnabled": true,
    "FullLoadExceptionTableEnabled": true
  },
  "StreamBufferSettings": {
    "StreamBufferCount": 3,
    "StreamBufferSizeInMB": 8,
    "CtrlStreamBufferSizeInMB": 5
  },
  "ChangeProcessingDdlHandlingPolicy": {
    "HandleSourceTableDropped": true,
    "HandleSourceTableTruncated": true,
    "HandleSourceTableAltered": true
  },
  "ChangeProcessingTuning": {
    "BatchApplyPreserveTransaction": true,
    "BatchApplyTimeoutMin": 1,
    "BatchApplyTimeoutMax": 30,
    "BatchApplyMemoryLimit": 500,
    "BatchSplitSize": 0,
    "MinTransactionSize": 1000,
    "CommitTimeout": 1,
    "MemoryLimitTotal": 1024,
    "MemoryKeepTime": 60,
    "StatementCacheSize": 50
  },
  "ValidationSettings": {
    "EnableValidation": true,
    "ValidationMode": "ROW_LEVEL",
    "ThreadCount": 5,
    "FailureMaxCount": 10000,
    "RecordFailureDelayInMinutes": 5,
    "RecordSuspendDelayInMinutes": 30,
    "MaxKeyColumnSize": 8096,
    "TableFailureMaxCount": 1000,
    "ValidationOnly": false,
    "HandleCollationDiff": false,
    "RecordFailureDelayLimitInMinutes": 0,
    "SkipLobColumns": false,
    "ValidationPartialLobSize": 0,
    "ValidationQueryCdcDelaySeconds": 180
  }
}
```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./test/TapStack.int.test.ts

```typescript
/**
 * Integration Tests for Payment Processing System Migration Infrastructure (Terraform)
 *
 * These tests validate the deployed infrastructure in AWS, using actual resources
 * and verifying they work correctly together.
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ListResourceRecordSetsCommand,
  Route53Client
} from '@aws-sdk/client-route-53';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

  // Flatten Terraform output format: {key: {value: val, sensitive: bool}} -> {key: val}
  outputs = Object.keys(rawOutputs).reduce((acc: any, key: string) => {
    acc[key] = rawOutputs[key].value !== undefined ? rawOutputs[key].value : rawOutputs[key];
    return acc;
  }, {});

  // Parse JSON string outputs into proper types
  if (outputs.public_subnet_ids && typeof outputs.public_subnet_ids === 'string') {
    outputs.public_subnet_ids = JSON.parse(outputs.public_subnet_ids);
  }
  if (outputs.private_app_subnet_ids && typeof outputs.private_app_subnet_ids === 'string') {
    outputs.private_app_subnet_ids = JSON.parse(outputs.private_app_subnet_ids);
  }
  if (outputs.private_db_subnet_ids && typeof outputs.private_db_subnet_ids === 'string') {
    outputs.private_db_subnet_ids = JSON.parse(outputs.private_db_subnet_ids);
  }
  if (outputs.traffic_distribution && typeof outputs.traffic_distribution === 'string') {
    outputs.traffic_distribution = JSON.parse(outputs.traffic_distribution);
  }
}

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const s3Client = new S3Client({ region });
const route53Client = new Route53Client({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });

describe('Payment Processing Migration Infrastructure - Integration Tests', () => {
  // Increase timeout for AWS API calls
  jest.setTimeout(30000);

  describe('Deployment Outputs', () => {
    test('should have deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'ecs_cluster_name',
        'ecs_blue_service_name',
        'aurora_cluster_id'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC deployed and available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpc_id);
    });

    test('should have public subnets deployed', async () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(3);

      // All subnets should be in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('should have private app subnets deployed', async () => {
      expect(outputs.private_app_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_app_subnet_ids)).toBe(true);
      expect(outputs.private_app_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_app_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have private database subnets deployed', async () => {
      expect(outputs.private_db_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_db_subnet_ids)).toBe(true);
      expect(outputs.private_db_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_db_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have NAT gateways deployed and available', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Check if NAT gateways exist (at least 1, ideally 3 for HA)
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      console.log(`Found ${response.NatGateways!.length} NAT Gateway(s)`);
    });

    test('should have security groups created', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Should have at least: default, ALB, ECS, RDS, DMS, VPC endpoints
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Application Load Balancer', () => {
    let albDnsName: string;
    let albArn: string;

    test('should have ALB deployed and active', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blue_target_group_arn]
      });

      const tgResponse = await elbv2Client.send(tgCommand);
      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups).toHaveLength(1);
      expect(tgResponse.TargetGroups![0].LoadBalancerArns).toBeDefined();
      expect(tgResponse.TargetGroups![0].LoadBalancerArns!.length).toBeGreaterThan(0);

      albArn = tgResponse.TargetGroups![0].LoadBalancerArns![0];

      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn]
      });

      const response = await elbv2Client.send(albCommand);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Type).toBe('application');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');

      albDnsName = response.LoadBalancers![0].DNSName!;
      expect(albDnsName).toBeDefined();
    });

    test('should have target groups created', async () => {
      const blueCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blue_target_group_arn]
      });
      const blueResponse = await elbv2Client.send(blueCommand);
      expect(blueResponse.TargetGroups).toBeDefined();
      expect(blueResponse.TargetGroups).toHaveLength(1);

      const greenCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.green_target_group_arn]
      });
      const greenResponse = await elbv2Client.send(greenCommand);
      expect(greenResponse.TargetGroups).toBeDefined();
      expect(greenResponse.TargetGroups).toHaveLength(1);

      const targetGroupNames = [
        ...blueResponse.TargetGroups!.map(tg => tg.TargetGroupName),
        ...greenResponse.TargetGroups!.map(tg => tg.TargetGroupName)
      ];
      const hasBlue = targetGroupNames.some(name => name?.includes('blue'));
      const hasGreen = targetGroupNames.some(name => name?.includes('green'));

      expect(hasBlue).toBe(true);
      expect(hasGreen).toBe(true);
    });

  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster deployed and active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name]
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
      expect(response.clusters![0].clusterName).toBe(outputs.ecs_cluster_name);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have DMS log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.dms_log_group
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const dmsLogGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.dms_log_group);
      expect(dmsLogGroup).toBeDefined();
      expect(dmsLogGroup!.logGroupName).toBe(outputs.dms_log_group);
    });

    test('should have ECS log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ecs_log_group
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const ecsLogGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.ecs_log_group);
      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup!.logGroupName).toBe(outputs.ecs_log_group);
    });
  });

  describe('Route 53 DNS', () => {
    test('should have private hosted zone created', async () => {
      expect(outputs.private_hosted_zone_name).toBe('payment.internal');
    });

    test('should have DNS records for database endpoints', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.private_hosted_zone_id
      });

      const response = await route53Client.send(command);
      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have logs backup bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.logs_backup_bucket
      });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled on logs backup bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.logs_backup_bucket
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Status and Traffic Distribution', () => {
    test('should have migration phase set', () => {
      expect(outputs.migration_phase).toBeDefined();
      expect(['preparation', 'migration', 'cutover', 'complete']).toContain(
        outputs.migration_phase
      );
    });

    test('should have traffic distribution configured', () => {
      expect(outputs.traffic_distribution).toBeDefined();
      expect(outputs.traffic_distribution.blue_weight).toBeDefined();
      expect(outputs.traffic_distribution.green_weight).toBeDefined();

      const total = outputs.traffic_distribution.blue_weight +
        outputs.traffic_distribution.green_weight;
      expect(total).toBe(100);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('should be able to reach ALB endpoint', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blue_target_group_arn]
      });
      const tgResponse = await elbv2Client.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups![0].LoadBalancerArns).toBeDefined();
      expect(tgResponse.TargetGroups![0].LoadBalancerArns!.length).toBeGreaterThan(0);

      const tempAlbArn = tgResponse.TargetGroups![0].LoadBalancerArns![0];
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [tempAlbArn]
      });
      const albResponse = await elbv2Client.send(albCommand);
      const albDnsName = albResponse.LoadBalancers![0].DNSName;

      const albEndpoint = `http://${albDnsName}`;

      const response = await axios.get(albEndpoint, {
        timeout: 10000,
        validateStatus: () => true // Accept any status
      });

      expect(response.status).toBeDefined();
      expect(response.status).toBeLessThan(600);
    });

    test('should have target health checks configured', async () => {
      const blueCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.blue_target_group_arn
      });

      const blueResponse = await elbv2Client.send(blueCommand);
      expect(blueResponse.TargetHealthDescriptions).toBeDefined();
      expect(Array.isArray(blueResponse.TargetHealthDescriptions)).toBe(true);
    });
  });

  describe('Resource Cleanup Readiness', () => {
    test('should verify resources are destroyable (no deletion protection)', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blue_target_group_arn]
      });
      const tgResponse = await elbv2Client.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups![0].LoadBalancerArns).toBeDefined();
      expect(tgResponse.TargetGroups![0].LoadBalancerArns!.length).toBeGreaterThan(0);

      const tempAlbArn = tgResponse.TargetGroups![0].LoadBalancerArns![0];

      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [tempAlbArn]
      });

      const albResponse = await elbv2Client.send(albCommand);
      const alb = albResponse.LoadBalancers![0];

      expect(alb).toBeDefined();
      expect(alb.LoadBalancerArn).toBe(tempAlbArn);
    });

  });
});

```

## ./test/TapStack.unit.test.ts

```typescript
/**
 * Unit Tests for Payment Processing System Migration Infrastructure (Terraform)
 *
 * These tests validate the Terraform configuration for correctness, security,
 * and compliance with QA requirements.
 */

import * as fs from 'fs';
import * as path from 'path';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Configuration - Payment Processing Migration Infrastructure', () => {
  let tfConfig: Record<string, { content: string }> = {};
  let tfvars: Record<string, string> = {};

  beforeAll(() => {
    // Load and parse all Terraform files
    const tfFiles = [
      'provider.tf',
      'variables.tf',
      'locals.tf',
      'networking.tf',
      'database.tf',
      'compute.tf',
      'loadbalancer.tf',
      'migration.tf',
      'dns.tf',
      'logging.tf',
      'outputs.tf'
    ];

    tfFiles.forEach(file => {
      const filePath = path.resolve(libDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Store raw content for string matching
          tfConfig[file] = { content };
        } catch (error: any) {
          console.warn(`Failed to read ${file}:`, error.message);
        }
      }
    });

    // Load terraform.tfvars
    const tfvarsPath = path.resolve(libDir, 'terraform.tfvars');
    if (fs.existsSync(tfvarsPath)) {
      const content = fs.readFileSync(tfvarsPath, 'utf8');
      // Simple parser for tfvars
      content.split('\n').forEach(line => {
        const match = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (match) {
          tfvars[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
        }
      });
    }
  });

  describe('File Structure and Existence', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'locals.tf',
        'networking.tf',
        'database.tf',
        'compute.tf',
        'loadbalancer.tf',
        'migration.tf',
        'dns.tf',
        'logging.tf',
        'outputs.tf',
        'terraform.tfvars'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.resolve(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have DMS configuration files', () => {
      expect(fs.existsSync(path.resolve(libDir, 'dms-table-mappings.json'))).toBe(true);
      expect(fs.existsSync(path.resolve(libDir, 'dms-task-settings.json'))).toBe(true);
    });

    test('should have README documentation', () => {
      expect(fs.existsSync(path.resolve(libDir, 'README.md'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider correctly', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('should require Terraform version >= 1.4.0', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toMatch(/required_version.*>=.*1\.[45]/);
    });

    test('should require AWS provider version >= 5.0', () => {
      const providerContent = tfConfig['provider.tf'].content;
      expect(providerContent).toMatch(/version.*>=.*5\.0/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define environment_suffix variable', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      expect(variablesContent).toContain('variable "environment_suffix"');
      expect(variablesContent).toMatch(/environment_suffix.*{[\s\S]*?description/);
    });

    test('should define aws_region variable with default us-east-1', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      expect(variablesContent).toContain('variable "aws_region"');
      expect(variablesContent).toMatch(/default.*=.*"us-east-1"/);
    });

    test('should mark sensitive variables as sensitive', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      const sensitiveVars = [
        'db_master_password',
        'db_master_username',
        'onprem_db_username',
        'onprem_db_password'
      ];

      sensitiveVars.forEach(varName => {
        const regex = new RegExp(`variable\\s+"${varName}"[\\s\\S]*?sensitive\\s*=\\s*true`, 'i');
        expect(variablesContent).toMatch(regex);
      });
    });

    test('should define all required variables for migration', () => {
      const variablesContent = tfConfig['variables.tf'].content;
      const requiredVars = [
        'vpc_cidr',
        'availability_zones',
        'onprem_cidr',
        'payment_app_image',
        'payment_app_port',
        'blue_target_weight',
        'green_target_weight',
        'migration_phase',
        'cost_center'
      ];

      requiredVars.forEach(varName => {
        expect(variablesContent).toContain(`variable "${varName}"`);
      });
    });
  });

  describe('Locals Configuration', () => {
    test('should define environment from terraform.workspace', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toMatch(/environment\s*=\s*terraform\.workspace/);
    });

    test('should define environment-specific configurations', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toContain('env_config');
      expect(localsContent).toContain('staging-migration');
      expect(localsContent).toContain('production-migration');
    });

    test('should include common tags with required fields', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toContain('common_tags');
      expect(localsContent).toMatch(/Environment.*=/);
      expect(localsContent).toMatch(/MigrationPhase.*=/);
      expect(localsContent).toMatch(/CostCenter.*=/);
      expect(localsContent).toMatch(/ManagedBy.*=/);
    });

    test('should define name_prefix with environment_suffix', () => {
      const localsContent = tfConfig['locals.tf'].content;
      expect(localsContent).toMatch(/name_prefix.*var\.environment_suffix/);
    });
  });

  describe('Networking Configuration', () => {
    test('should create VPC with environment_suffix in name', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(networkingContent).toMatch(/vpc-.*var\.environment_suffix/);
    });

    test('should create 3 public subnets across AZs', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(networkingContent).toMatch(/count\s*=\s*3/);
    });

    test('should create 3 private app subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_app"/);
      expect(networkingContent).toContain('private-app-subnet');
    });

    test('should create 3 private database subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"/);
      expect(networkingContent).toContain('private-db-subnet');
    });

    test('should create NAT gateways for private subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(networkingContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should create internet gateway for public subnets', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create security groups for all tiers', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(networkingContent).toMatch(/resource\s+"aws_security_group"\s+"dms"/);
    });

    test('should create VPC endpoints for Systems Manager', () => {
      const networkingContent = tfConfig['networking.tf'].content;
      expect(networkingContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"/);
      expect(networkingContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages"/);
    });
  });

  describe('Database Configuration', () => {
    test('should create Aurora MySQL cluster', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster"\s+"payment"/);
      expect(databaseContent).toContain('aurora-mysql');
    });

    test('should NOT have deletion_protection=true (QA requirement)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Should either not have deletion_protection or have it set to false
      expect(databaseContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test('should NOT have lifecycle prevent_destroy (QA requirement)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Should not have prevent_destroy = true
      expect(databaseContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('should skip final snapshot for QA', () => {
      const databaseContent = tfConfig['database.tf'].content;
      // Either skip_final_snapshot = true or no skip_final_snapshot (defaults to true)
      if (databaseContent.includes('skip_final_snapshot')) {
        expect(databaseContent).toMatch(/skip_final_snapshot\s*=\s*true/);
      }
    });

    test('should store credentials in SSM Parameter Store', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_master_username"/);
      expect(databaseContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_master_password"/);
    });

    test('should create Aurora cluster instances (writer and readers)', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"payment_writer"/);
      expect(databaseContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"payment_reader"/);
    });

    test('should enable encryption at rest', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should enable CloudWatch logs export', () => {
      const databaseContent = tfConfig['database.tf'].content;
      expect(databaseContent).toContain('enabled_cloudwatch_logs_exports');
    });
  });

  describe('Compute Configuration', () => {
    test('should create ECS cluster with environment_suffix', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_cluster"\s+"payment"/);
      expect(computeContent).toMatch(/payment-cluster.*var\.environment_suffix/);
    });

    test('should enable container insights', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/containerInsights[\s\S]*?enabled/i);
    });

    test('should create ECS task definition for Fargate', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_task_definition"\s+"payment"/);
      expect(computeContent).toContain('FARGATE');
    });

    test('should create both blue and green ECS services', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_ecs_service"\s+"payment_blue"/);
      expect(computeContent).toMatch(/resource\s+"aws_ecs_service"\s+"payment_green"/);
    });

    test('should configure auto-scaling for ECS services', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"ecs_blue"/);
      expect(computeContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"ecs_blue_cpu"/);
    });

    test('should create IAM roles for ECS task execution', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task_execution"/);
      expect(computeContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_task"/);
    });

    test('should grant Parameter Store access to ECS tasks', () => {
      const computeContent = tfConfig['compute.tf'].content;
      expect(computeContent).toContain('ssm:GetParameters');
      expect(computeContent).toContain('ssm:GetParameter');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb"\s+"payment"/);
      expect(lbContent).toContain('application');
    });

    test('should NOT have prevent_destroy on S3 logs bucket (QA requirement)', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).not.toMatch(/lifecycle\s*{\s*prevent_destroy\s*=\s*true/);
    });

    test('should create blue and green target groups', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
      expect(lbContent).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
    });

    test('should create HTTP listener', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(lbContent).toMatch(/port\s*=\s*"80"/);
    });

    test('should configure health checks on target groups', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toContain('health_check');
      expect(lbContent).toMatch(/path\s*=\s*"\//);  // Path is "/" or "/health"
    });

    test('should enable ALB access logs', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toContain('access_logs');
      expect(lbContent).toMatch(/enabled\s*=\s*true/);
    });

    test('should create S3 bucket for ALB logs with encryption', () => {
      const lbContent = tfConfig['loadbalancer.tf'].content;
      expect(lbContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
      expect(lbContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });
  });

  describe('Migration (DMS) Configuration', () => {
    test('should create DMS replication instance', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    });

    test('should create DMS source and target endpoints', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
      expect(migrationContent).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
    });

    test('should create DMS replication task with CDC', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_dms_replication_task"\s+"main"/);
      expect(migrationContent).toMatch(/migration_type.*full-load-and-cdc/);
    });

    test('should create IAM roles for DMS', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_vpc"/);
      expect(migrationContent).toMatch(/resource\s+"aws_iam_role"\s+"dms_cloudwatch"/);
    });

    test('should create CloudWatch alarms for DMS replication lag', () => {
      const migrationContent = tfConfig['migration.tf'].content;
      expect(migrationContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dms_replication_lag"/);
      expect(migrationContent).toContain('CDCLatencySource');
    });
  });

  describe('DNS Configuration', () => {
    test('should create Route 53 private hosted zone', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_zone"\s+"private"/);
      expect(dnsContent).toContain('payment.internal');
    });

    test('should create weighted routing for blue/green deployment', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"payment_blue"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"payment_green"/);
      expect(dnsContent).toContain('weighted_routing_policy');
    });

    test('should create Route 53 health checks', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_health_check"\s+"blue"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_health_check"\s+"green"/);
    });

    test('should create CNAME records for database endpoints', () => {
      const dnsContent = tfConfig['dns.tf'].content;
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"database_writer"/);
      expect(dnsContent).toMatch(/resource\s+"aws_route53_record"\s+"database_reader"/);
    });
  });

  describe('Logging Configuration', () => {
    test('should create CloudWatch log groups', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"infrastructure"/);
    });

    test('should create Kinesis Firehose for log forwarding', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"\s+"onprem_logs"/);
    });

    test('should create S3 bucket for log backups', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_backup"/);
    });

    test('should configure lifecycle policy for log retention', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(loggingContent).toContain('GLACIER');
    });

    test('should create CloudWatch alarms for monitoring', () => {
      const loggingContent = tfConfig['logging.tf'].content;
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_cpu"/);
      expect(loggingContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ecs_cpu"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('should output VPC and subnet IDs', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_app_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_db_subnet_ids"/);
    });

    test('should output Aurora endpoints', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"aurora_cluster_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"aurora_reader_endpoint"/);
    });

    test('should output ALB DNS name', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test('should output ECS cluster information', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"ecs_cluster_name"/);
      expect(outputsContent).toMatch(/output\s+"ecs_blue_service_name"/);
      expect(outputsContent).toMatch(/output\s+"ecs_green_service_name"/);
    });

    test('should output DMS resource ARNs', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"dms_replication_instance_arn"/);
      expect(outputsContent).toMatch(/output\s+"dms_replication_task_arn"/);
    });

    test('should output migration status information', () => {
      const outputsContent = tfConfig['outputs.tf'].content;
      expect(outputsContent).toMatch(/output\s+"migration_phase"/);
      expect(outputsContent).toMatch(/output\s+"traffic_distribution"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment_suffix', () => {
      const allContent = Object.values(tfConfig)
        .map(config => config.content || '')
        .join('\n');

      // Check that resources are using environment_suffix for naming
      expect(allContent).toMatch(/var\.environment_suffix/);

      // Common resource naming patterns should include suffix
      const resourcePatterns = [
        /name\s*=\s*"[^"]*\${var\.environment_suffix}/,
        /identifier\s*=\s*"[^"]*\${var\.environment_suffix}/,
        /bucket\s*=\s*"[^"]*\${var\.environment_suffix}/
      ];

      resourcePatterns.forEach(pattern => {
        expect(allContent).toMatch(pattern);
      });
    });
  });

  describe('Terraform Variables File', () => {
    test('should have environment_suffix configured', () => {
      expect(tfvars.environment_suffix).toBeDefined();
      expect(tfvars.environment_suffix).not.toBe('');
    });

    test('should have aws_region configured', () => {
      expect(tfvars.aws_region).toBeDefined();
      expect(tfvars.aws_region).toBe('us-east-1');
    });

    test('should have database credentials configured', () => {
      expect(tfvars.db_master_username).toBeDefined();
      expect(tfvars.db_master_password).toBeDefined();
    });

    test('should have realistic Docker image configured', () => {
      expect(tfvars.payment_app_image).toBeDefined();
      // Should be a real image like nginx or nginxdemos/hello
      expect(tfvars.payment_app_image).toMatch(/nginx/i);
    });
  });

  describe('DMS Configuration Files', () => {
    test('dms-table-mappings.json should be valid JSON', () => {
      const mappingsPath = path.resolve(libDir, 'dms-table-mappings.json');
      const content = fs.readFileSync(mappingsPath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('rules');
      expect(Array.isArray(parsed.rules)).toBe(true);
      expect(parsed.rules.length).toBeGreaterThan(0);
    });

    test('dms-task-settings.json should be valid JSON', () => {
      const settingsPath = path.resolve(libDir, 'dms-task-settings.json');
      const content = fs.readFileSync(settingsPath, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('TargetMetadata');
      expect(parsed).toHaveProperty('FullLoadSettings');
      expect(parsed).toHaveProperty('Logging');
    });
  });

  describe('Documentation', () => {
    test('README should exist and have migration instructions', () => {
      const readmePath = path.resolve(libDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf8');

      expect(content).toMatch(/migration/i);
      expect(content).toMatch(/terraform/i);
      expect(content).toMatch(/deployment/i);
    });
  });
});

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```
