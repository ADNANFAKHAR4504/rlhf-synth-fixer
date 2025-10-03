// // integration.tapstack.test.ts

// import fs from 'fs';
// import {
//   EC2Client,
//   DescribeInstancesCommand,
//   DescribeSecurityGroupsCommand,
// } from '@aws-sdk/client-ec2';
// import {
//   ELBv2Client,
//   DescribeLoadBalancersCommand,
//   DescribeTargetGroupsCommand,
// } from '@aws-sdk/client-elastic-load-balancing-v2';
// import {
//   RDSClient,
//   DescribeDBInstancesCommand,
// } from '@aws-sdk/client-rds';
// import {
//   S3Client,
//   HeadBucketCommand,
// } from '@aws-sdk/client-s3';
// import {
//   SecretsManagerClient,
//   DescribeSecretCommand,
// } from '@aws-sdk/client-secrets-manager';
// import {
//   CloudWatchClient,
//   ListDashboardsCommand,
// } from '@aws-sdk/client-cloudwatch';

// const outputs = JSON.parse(
//   fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
// );

// // Get environment suffix from environment variable (set by CI/CD pipeline)
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// // Shared AWS clients
// const ec2 = new EC2Client({});
// const alb = new ELBv2Client({});
// const rds = new RDSClient({});
// const s3 = new S3Client({});
// const secrets = new SecretsManagerClient({});
// const cloudwatch = new CloudWatchClient({});

// describe('TapStack Infrastructure Integration Tests', () => {
//   // EC2 Instance
//   test('EC2 instance should exist and be running', async () => {
//     const instanceId = outputs.MyEC2InstanceId; // ensure your flat-outputs.json has this
//     const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
//     const instance = result.Reservations?.[0].Instances?.[0];
//     expect(instance).toBeDefined();
//     expect(instance?.State?.Name).toBe('running');
//     expect(instance?.InstanceType).toBe('t2.micro');
//   });

//   // ALB
//   test('Application Load Balancer should exist and be active', async () => {
//     const albDns = outputs.LoadBalancerDNS;
//     const result = await alb.send(new DescribeLoadBalancersCommand({}));
//     const found = result.LoadBalancers?.find(lb => lb.DNSName === albDns);
//     expect(found).toBeDefined();
//     expect(found?.State?.Code).toBe('active');
//     expect(found?.Type).toBe('application');
//   });

//   test('ALB Target Group should exist and be HTTP', async () => {
//     const result = await alb.send(new DescribeTargetGroupsCommand({}));
//     const tg = result.TargetGroups?.find(t => t.Port === 80);
//     expect(tg).toBeDefined();
//     expect(tg?.Protocol).toBe('HTTP');
//   });

//   // RDS
//   test('RDS Instance should exist and be available', async () => {
//     const endpoint = outputs.RDSInstanceEndpoint;
//     const result = await rds.send(new DescribeDBInstancesCommand({}));
//     const db = result.DBInstances?.find(d => d.Endpoint?.Address === endpoint);
//     expect(db).toBeDefined();
//     expect(db?.DBInstanceStatus).toBe('available');
//     expect(db?.Engine).toContain('mysql');
//   });

//   // S3 Logs Bucket
//   test('Logs S3 bucket should exist', async () => {
//     const bucketName = outputs.LogsBucketName;
//     const result = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
//     expect(result.$metadata.httpStatusCode).toBe(200);
//   });

//   // Secrets Manager
//   test('DB Secret should exist in Secrets Manager', async () => {
//     const secretName = `${environmentSuffix}-db-secretscredential`;
//     const result = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
//     expect(result).toBeDefined();
//     expect(result.Name).toBe(secretName);
//   });

//   // CloudWatch Dashboard
//   test('CloudWatch Dashboard should exist', async () => {
//     const dashboardName = `${environmentSuffix}-dashboard`;
//     const result = await cloudwatch.send(new ListDashboardsCommand({}));
//     const found = result.DashboardEntries?.find(d => d.DashboardName === dashboardName);
//     expect(found).toBeDefined();
//   });
// });
// test/tap-stack.int.test.ts

import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  LoadBalancer,
  TargetGroup,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Shared AWS clients
const ec2 = new EC2Client({});
const alb = new ElasticLoadBalancingV2Client({});
const rds = new RDSClient({});
const s3 = new S3Client({});
const secrets = new SecretsManagerClient({});
const cloudwatch = new CloudWatchClient({});

describe('TapStack Infrastructure Integration Tests', () => {
  // EC2 Instance
  test('EC2 instance should exist and be running', async () => {
    const instanceId = outputs.MyEC2InstanceId; // ensure your flat-outputs.json has this
    const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = result.Reservations?.[0].Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe('running');
    expect(instance?.InstanceType).toBe('t2.micro');
  });

  // ALB
  test('Application Load Balancer should exist and be active', async () => {
    const albDns = outputs.LoadBalancerDNS;
    const result = await alb.send(new DescribeLoadBalancersCommand({}));
    const found: LoadBalancer | undefined = result.LoadBalancers?.find(
      (lb: LoadBalancer) => lb.DNSName === albDns
    );
    expect(found).toBeDefined();
    expect(found?.State?.Code).toBe('active');
    expect(found?.Type).toBe('application');
  });

  test('ALB Target Group should exist and be HTTP', async () => {
    const result = await alb.send(new DescribeTargetGroupsCommand({}));
    const tg: TargetGroup | undefined = result.TargetGroups?.find(
      (t: TargetGroup) => t.Port === 80
    );
    expect(tg).toBeDefined();
    expect(tg?.Protocol).toBe('HTTP');
  });

  // RDS
  test('RDS Instance should exist and be available', async () => {
    const endpoint = outputs.RDSInstanceEndpoint;
    const result = await rds.send(new DescribeDBInstancesCommand({}));
    const db = result.DBInstances?.find(
      (d) => d.Endpoint?.Address === endpoint
    );
    expect(db).toBeDefined();
    expect(db?.DBInstanceStatus).toBe('available');
    expect(db?.Engine).toContain('mysql');
  });

  // S3 Logs Bucket
  test('Logs S3 bucket should exist', async () => {
    const bucketName = outputs.LogsBucketName;
    const result = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    expect(result.$metadata.httpStatusCode).toBe(200);
  });

  // Secrets Manager
  test('DB Secret should exist in Secrets Manager', async () => {
    const secretName = `${environmentSuffix}-db-secretscredential`;
    const result = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
    expect(result).toBeDefined();
    expect(result.Name).toBe(secretName);
  });

  // CloudWatch Dashboard
  test('CloudWatch Dashboard should exist', async () => {
    const dashboardName = `${environmentSuffix}-dashboard`;
    const result = await cloudwatch.send(new ListDashboardsCommand({}));
    const found = result.DashboardEntries?.find(
      (d) => d.DashboardName === dashboardName
    );
    expect(found).toBeDefined();
  });
});
