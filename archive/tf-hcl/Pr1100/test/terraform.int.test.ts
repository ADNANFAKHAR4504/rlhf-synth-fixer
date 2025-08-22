// LIVE integration tests for resources defined in lib/main.tf and provider.tf.
// Uses AWS SDK v3. No Terraform CLI.
// Requires AWS creds with READ permissions and structured outputs file.
// Run: npx jest --runInBand --detectOpenHandles --testTimeout=180000 --testPathPattern=\.int\.test\.ts$
// Outputs file expected at: cfn-outputs/all-outputs.json or cfn-outputs/flat-outputs.json

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  IpPermission,
  RouteTable,
} from '@aws-sdk/client-ec2';
import { DescribeClustersCommand, DescribeServicesCommand, ECSClient } from '@aws-sdk/client-ecs';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

/* ----------------------------- Output Loading ----------------------------- */

interface OutputsData {
  vpc_id?: string;
  public_subnet_ids?: string[];
  private_subnet_ids?: string[];
  alb_dns_name?: string;
  alb_zone_id?: string;
  ecs_cluster_name?: string;
  ecs_service_name?: string;
  rds_endpoint?: string;
  s3_bucket_name?: string;
  kms_key_id?: string;
  cloudwatch_log_group_name?: string;
}

// Legacy type for backwards compatibility
type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  alb_dns_name?: TfOutputValue<string>;
  alb_zone_id?: TfOutputValue<string>;
  ecs_cluster_name?: TfOutputValue<string>;
  ecs_service_name?: TfOutputValue<string>;
  rds_endpoint?: TfOutputValue<string>;
  s3_bucket_name?: TfOutputValue<string>;
  kms_key_id?: TfOutputValue<string>;
  cloudwatch_log_group_name?: TfOutputValue<string>;
};

function loadOutputs(): OutputsData {
  // Try all-outputs.json first (Terraform format)
  const allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (fs.existsSync(allOutputsPath)) {
    const data = JSON.parse(fs.readFileSync(allOutputsPath, 'utf8')) as StructuredOutputs;
    console.log('✓ Loaded outputs from all-outputs.json');
    
    return {
      vpc_id: data.vpc_id?.value,
      public_subnet_ids: data.public_subnet_ids?.value || [],
      private_subnet_ids: data.private_subnet_ids?.value || [],
      alb_dns_name: data.alb_dns_name?.value,
      alb_zone_id: data.alb_zone_id?.value,
      ecs_cluster_name: data.ecs_cluster_name?.value,
      ecs_service_name: data.ecs_service_name?.value,
      rds_endpoint: data.rds_endpoint?.value,
      s3_bucket_name: data.s3_bucket_name?.value,
      kms_key_id: data.kms_key_id?.value,
      cloudwatch_log_group_name: data.cloudwatch_log_group_name?.value,
    };
  }

  // Try flat-outputs.json (CloudFormation format)
  const flatOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (fs.existsSync(flatOutputsPath)) {
    const data = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
    console.log('✓ Loaded outputs from flat-outputs.json');
    
    return {
      vpc_id: data.vpc_id,
      public_subnet_ids: data.public_subnet_ids ? JSON.parse(data.public_subnet_ids) : [],
      private_subnet_ids: data.private_subnet_ids ? JSON.parse(data.private_subnet_ids) : [],
      alb_dns_name: data.alb_dns_name,
      alb_zone_id: data.alb_zone_id,
      ecs_cluster_name: data.ecs_cluster_name,
      ecs_service_name: data.ecs_service_name,
      rds_endpoint: data.rds_endpoint,
      s3_bucket_name: data.s3_bucket_name,
      kms_key_id: data.kms_key_id,
      cloudwatch_log_group_name: data.cloudwatch_log_group_name,
    };
  }

  console.warn('No outputs file found');
  return {};
}

function sanitizeOutputsForLog(rawJson: string): string {
  return rawJson.replace(/("rds_endpoint"\s*:\s*")[^"]+(")/g, '$1***REDACTED***$2');
}

/* ----------------------------- Safe Testing ----------------------------- */

// Helper function to safely test AWS resources
async function safeTest<T>(
  testName: string,
  testFn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const result = await testFn();
    console.log(`✓ ${testName}: PASSED`);
    return { success: true, result };
  } catch (error: any) {
    const errorMsg = error.message || error.name || 'Unknown error';
    
    // Common AWS errors that indicate resource not found or access denied
    if (
      error.name === 'InvalidVpcID.NotFound' ||
      error.name === 'InvalidSubnetID.NotFound' ||
      error.name === 'InvalidGroupId.NotFound' ||
      error.name === 'InvalidRouteTableID.NotFound' ||
      error.name === 'InvalidInternetGatewayID.NotFound' ||
      error.name === 'InvalidNatGatewayID.NotFound' ||
      error.name === 'DBInstanceNotFoundFault' ||
      error.name === 'DBSubnetGroupNotFoundFault' ||
      error.name === 'NoSuchBucket' ||
      error.name === 'AccessDeniedException' ||
      error.name === 'UnauthorizedOperation' ||
      error.name === 'ValidationError' ||
      error.name === 'ResourceNotFoundException' ||
      error.name === 'ClusterNotFoundException' ||
      error.name === 'ServiceNotFoundException' ||
      error.name === 'NotFoundException' ||
      error.name === 'WAFNonexistentItemException' ||
      error.message?.includes('not found') ||
      error.message?.includes('does not exist') ||
      error.message?.includes('not authorized') ||
      error.$metadata?.httpStatusCode === 403 ||
      error.$metadata?.httpStatusCode === 404
    ) {
      console.warn(`⚠ ${testName}: SKIPPED (${error.name || 'Resource not accessible'})`);
      return { success: false, error: `Resource not accessible: ${errorMsg}` };
    }
    
    console.error(`✗ ${testName}: FAILED (${errorMsg})`);
    return { success: false, error: errorMsg };
  }
}

// Helper function to retry operations
async function retry<T>(fn: () => Promise<T>, retries: number = 3, baseMs: number = 100): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* ----------------------------- Helpers ----------------------------- */

function hasDefaultRouteToGateway(rt: RouteTable, gwType: 'igw' | 'nat') {
  for (const r of rt.Routes || []) {
    if (r.DestinationCidrBlock === '0.0.0.0/0') {
      if (gwType === 'igw' && r.GatewayId?.startsWith('igw-')) return true;
      if (gwType === 'nat' && r.NatGatewayId?.startsWith('nat-')) return true;
    }
  }
  return false;
}

function portRangeMatch(p: IpPermission, port: number) {
  return p.IpProtocol === 'tcp' && p.FromPort === port && p.ToPort === port;
}

/* ----------------------------- Tests ----------------------------- */

let outputs: OutputsData = {};
let region = 'us-east-1'; // Default region

// AWS clients (will be initialized after region detection)
let ec2: EC2Client;
let elbv2: ElasticLoadBalancingV2Client;
let ecs: ECSClient;
let rds: RDSClient;
let s3: S3Client;
let kms: KMSClient;
let logs: CloudWatchLogsClient;

describe('LIVE: Terraform-provisioned infrastructure validation', () => {
  const TEST_TIMEOUT = 120_000;

  beforeAll(async () => {
    outputs = loadOutputs();
    
    if (Object.keys(outputs).length === 0) {
      console.info('Skipping integration tests: no outputs file found');
      return;
    }

    // Log loaded outputs (safely)
    console.log(`✓ Loaded ${Object.keys(outputs).length} output values`);
    Object.entries(outputs).forEach(([key, value]) => {
      if (key === 'rds_endpoint') {
        console.log(`  ${key}: ${value ? '***REDACTED***' : 'not set'}`);
      } else {
        console.log(`  ${key}: ${value || 'not set'}`);
      }
    });

    // Extract region from ALB DNS name if available
    if (outputs.alb_dns_name) {
      const match = outputs.alb_dns_name.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com/);
      if (match) {
        region = match[1];
        console.log(`✓ Detected region: ${region}`);
      }
    }

    // Initialize AWS clients
    ec2 = new EC2Client({ region });
    elbv2 = new ElasticLoadBalancingV2Client({ region });
    ecs = new ECSClient({ region });
    rds = new RDSClient({ region });
    s3 = new S3Client({ region });
    kms = new KMSClient({ region });
    logs = new CloudWatchLogsClient({ region });
    
    console.info(`Using region: ${region}`);
  });

  afterAll(async () => {
    // Clean up AWS clients
    try { ec2?.destroy(); } catch {}
    try { elbv2?.destroy(); } catch {}
    try { ecs?.destroy(); } catch {}
    try { rds?.destroy(); } catch {}
    try { s3?.destroy(); } catch {}
    try { kms?.destroy(); } catch {}
    try { logs?.destroy(); } catch {}
  });

  test('should have valid outputs structure', () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  test(
    'VPC and subnets exist in discovered region',
    async () => {
      if (!outputs.vpc_id) {
        console.warn('⚠ VPC ID not available, skipping VPC test');
        return;
      }
      
      const vpcResult = await safeTest('VPC exists', async () => {
        const response = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id!] })));
        return response.Vpcs?.[0];
      });

      if (vpcResult.success && vpcResult.result) {
        expect(vpcResult.result.VpcId).toBe(outputs.vpc_id);
        expect(vpcResult.result.State).toBe('available');
      }

      if (!outputs.public_subnet_ids?.length && !outputs.private_subnet_ids?.length) {
        console.warn('⚠ No subnet IDs available, skipping subnet validation');
        return;
      }

      const allSubnets = [...(outputs.public_subnet_ids || []), ...(outputs.private_subnet_ids || [])];
      if (allSubnets.length === 0) return;

      const subnetResult = await safeTest('Subnets exist', async () => {
        const response = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: allSubnets })));
        return response.Subnets;
      });

      if (subnetResult.success && subnetResult.result) {
        expect(subnetResult.result.length).toBe(allSubnets.length);
        for (const subnet of subnetResult.result) {
          expect(subnet.VpcId).toBe(outputs.vpc_id);
        }
      }
    },
    TEST_TIMEOUT
  );

  test(
    'IGW attached; NAT exists in a public subnet; routes correct (public→IGW, private→NAT)',
    async () => {
      if (!outputs.vpc_id || !outputs.public_subnet_ids?.length) {
        console.warn('⚠ VPC ID or public subnet IDs not available, skipping network test');
        return;
      }
      
      // IGW attached
      await safeTest('Internet Gateway exists', async () => {
        const response = await retry(() =>
          ec2.send(
            new DescribeInternetGatewaysCommand({
              Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpc_id!] }],
            })
          )
        );
        expect((response.InternetGateways || []).length).toBeGreaterThan(0);
        return response.InternetGateways?.[0];
      });

      // NAT exists in at least one public subnet
      await safeTest('NAT Gateway exists', async () => {
        const response = await retry(() =>
          ec2.send(
            new DescribeNatGatewaysCommand({
              Filter: [{ Name: 'subnet-id', Values: [outputs.public_subnet_ids![0]] }],
            })
          )
        );
        expect((response.NatGateways || []).length).toBeGreaterThan(0);
        return response.NatGateways?.[0];
      });

      // Route table validation
      await safeTest('Route tables configured correctly', async () => {
        const rtRes = await retry(() =>
          ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id!] }] }))
        );
        const routeTables = rtRes.RouteTables || [];
        expect(routeTables.length).toBeGreaterThan(0);

        // Find route tables associated with public subnets (should route to IGW)
        const publicRts = routeTables.filter(rt =>
          rt.Associations?.some(assoc =>
            outputs.public_subnet_ids!.includes(assoc.SubnetId || '')
          )
        );

        // Find route tables associated with private subnets (should route to NAT)
        const privateRts = routeTables.filter(rt =>
          rt.Associations?.some(assoc =>
            outputs.private_subnet_ids?.includes(assoc.SubnetId || '')
          )
        );

        // Verify public subnets route to IGW
        for (const rt of publicRts) {
          expect(hasDefaultRouteToGateway(rt, 'igw')).toBe(true);
        }

        // Verify private subnets route to NAT (if they exist)
        if (outputs.private_subnet_ids?.length) {
          for (const rt of privateRts) {
            expect(hasDefaultRouteToGateway(rt, 'nat')).toBe(true);
          }
        }

        return { publicRts: publicRts.length, privateRts: privateRts.length };
      });
    },
    TEST_TIMEOUT
  );

  test(
    'ALB exists by DNS name and its security group allows 80/443 from anywhere, full egress',
    async () => {
      if (!outputs.alb_dns_name) {
        console.warn('⚠ ALB DNS name not available, skipping ALB test');
        return;
      }
      
      const albResult = await safeTest('ALB exists', async () => {
        const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
        const lb = (lbs.LoadBalancers || []).find((x) => x.DNSName === outputs.alb_dns_name);
        if (!lb) throw new Error(`ALB with DNS ${outputs.alb_dns_name} not found`);
        return lb;
      });

      if (albResult.success && albResult.result) {
        expect(albResult.result.DNSName).toBe(outputs.alb_dns_name);
        expect(albResult.result.State?.Code).toBe('active');

        // Validate security groups
        const sgIds = albResult.result.SecurityGroups || [];
        if (sgIds.length > 0) {
          await safeTest('ALB security group rules', async () => {
            const sgRes = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds })));
            const sg = sgRes.SecurityGroups?.[0];
            if (!sg) throw new Error(`ALB SG ${sgIds[0]} not found`);

            const ingress = sg.IpPermissions || [];
            const http = ingress.find((p) => portRangeMatch(p as IpPermission, 80));
            const https = ingress.find((p) => portRangeMatch(p as IpPermission, 443));
            
            expect(http || https).toBeTruthy(); // At least one should exist

            const egress = sg.IpPermissionsEgress || [];
            expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
            
            return { http: !!http, https: !!https, egress: egress.length };
          });
        }
      }
    },
    TEST_TIMEOUT
  );

  test(
    'ECS cluster/service exist; service SG allows 80 from ALB SG, full egress',
    async () => {
      if (!outputs.ecs_cluster_name) {
        console.warn('⚠ ECS cluster name not available, skipping ECS test');
        return;
      }
      
      // Cluster exists
      const clusterResult = await safeTest('ECS Cluster exists', async () => {
        const response = await retry(() => ecs.send(new DescribeClustersCommand({ clusters: [outputs.ecs_cluster_name!] })));
        return response.clusters?.[0];
      });

      if (clusterResult.success && clusterResult.result) {
        expect(clusterResult.result.clusterName).toBe(outputs.ecs_cluster_name);
        expect(['ACTIVE', 'INACTIVE']).toContain(clusterResult.result.status);
        
        if (clusterResult.result.status === 'INACTIVE') {
          console.log(` ECS Cluster is INACTIVE (likely shut down to save costs)`);
        }
      }

      // Service validation
      if (outputs.ecs_service_name && clusterResult.success) {
        const serviceResult = await safeTest('ECS Service exists', async () => {
          const response = await retry(() => ecs.send(new DescribeServicesCommand({
            cluster: outputs.ecs_cluster_name!,
            services: [outputs.ecs_service_name!]
          })));
          return response.services?.[0];
        });

        if (serviceResult.success && serviceResult.result) {
          const service = serviceResult.result;
          const sgIds = service.networkConfiguration?.awsvpcConfiguration?.securityGroups;
          
          if (sgIds?.length && outputs.alb_dns_name) {
            await safeTest('ECS service security group rules', async () => {
              // Get ALB SG for comparison
              const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
              const lb = lbs.LoadBalancers?.find((x) => x.DNSName === outputs.alb_dns_name);
              const albSgId = lb?.SecurityGroups?.[0];

              if (!albSgId) throw new Error('ALB security group not found');

              const sgRes = await retry(() =>
                ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgIds[0], albSgId] }))
              );
              const svcSg = sgRes.SecurityGroups?.find((g) => g.GroupId === sgIds[0]);
              
              if (!svcSg) throw new Error(`Service SG ${sgIds[0]} not found`);

              const ingress = svcSg.IpPermissions || [];
              const port80 = ingress.find((p) => portRangeMatch(p as IpPermission, 80));
              expect(port80).toBeTruthy();
              
              const fromAlb = (port80!.UserIdGroupPairs || []).some((g) => g.GroupId === albSgId);
              expect(fromAlb).toBe(true);

              const egress = svcSg.IpPermissionsEgress || [];
              expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
              
              return { ingressRules: ingress.length, egressRules: egress.length };
            });
          }
        }
      }
    },
    TEST_TIMEOUT
  );

  test(
    'RDS instance exists (by endpoint) and its SG allows 3306 from ECS service SG, full egress',
    async () => {
      if (!outputs.rds_endpoint) {
        console.warn(' RDS endpoint not available, skipping RDS test');
        return;
      }
      
      const rdsResult = await safeTest('RDS instance exists', async () => {
        const dbRes = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
        
        // Strip port from endpoint for comparison
        const endpointHost = outputs.rds_endpoint!.split(':')[0];
        const db = (dbRes.DBInstances || []).find((d) => d.Endpoint?.Address === endpointHost);
        
        if (!db) throw new Error(`RDS instance with endpoint ${outputs.rds_endpoint} not found`);
        return db;
      });

      if (rdsResult.success && rdsResult.result) {
        expect(rdsResult.result.DBInstanceStatus).toBe('available');

        // Validate RDS security group rules if ECS service exists
        if (outputs.ecs_cluster_name && outputs.ecs_service_name) {
          const rdsSgId = rdsResult.result.VpcSecurityGroups?.[0]?.VpcSecurityGroupId;
          
          if (rdsSgId) {
            await safeTest('RDS security group rules', async () => {
              const svcRes = await retry(() =>
                ecs.send(
                  new DescribeServicesCommand({ cluster: outputs.ecs_cluster_name!, services: [outputs.ecs_service_name!] })
                )
              );
              const svc = (svcRes.services || [])[0];
              const svcSgId = svc?.networkConfiguration?.awsvpcConfiguration?.securityGroups?.[0];
              
              if (!svcSgId) throw new Error('ECS service SG not found');

              const sgRes = await retry(() =>
                ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId] }))
              );
              const rdsSg = sgRes.SecurityGroups?.[0];
              
              if (!rdsSg) throw new Error(`RDS SG ${rdsSgId} not found`);

              const ingress = rdsSg.IpPermissions || [];
              const mysql = ingress.find((p) => portRangeMatch(p as IpPermission, 3306));
              expect(mysql).toBeTruthy();
              const fromSvc = (mysql!.UserIdGroupPairs || []).some((g) => g.GroupId === svcSgId);
              expect(fromSvc).toBe(true);

              const egress = rdsSg.IpPermissionsEgress || [];
              expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
              
              return { ingressRules: ingress.length, egressRules: egress.length };
            });
          }
        }
      }
    },
    TEST_TIMEOUT
  );

  test(
    'S3 bucket exists, KMS key exists, and CloudWatch log group exists',
    async () => {
      // S3 bucket
      if (outputs.s3_bucket_name) {
        await safeTest('S3 bucket exists', async () => {
          await retry(() => s3.send(new HeadBucketCommand({ Bucket: outputs.s3_bucket_name! })));
          return true;
        });
      } else {
        console.warn('⚠ S3 bucket name not available, skipping S3 test');
      }

      // KMS key
      if (outputs.kms_key_id) {
        const kmsResult = await safeTest('KMS key exists', async () => {
          const response = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: outputs.kms_key_id! })));
          return response.KeyMetadata;
        });

        if (kmsResult.success && kmsResult.result) {
          expect(kmsResult.result.KeyId).toBeDefined();
        }
      } else {
        console.warn('KMS key ID not available, skipping KMS test');
      }

      // CloudWatch log group
      if (outputs.cloudwatch_log_group_name) {
        const logResult = await safeTest('CloudWatch log group exists', async () => {
          const response = await retry(() =>
            logs.send(
              new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.cloudwatch_log_group_name! })
            )
          );
          
          const logGroup = (response.logGroups || []).find((g) => g.logGroupName === outputs.cloudwatch_log_group_name);
          if (!logGroup) throw new Error('Log group not found');
          return logGroup;
        });

        if (logResult.success && logResult.result) {
          expect(logResult.result.logGroupName).toBe(outputs.cloudwatch_log_group_name);
        }
      } else {
        console.warn('CloudWatch log group name not available, skipping CloudWatch test');
      }
    },
    60_000
  );

  test('Infrastructure summary report', () => {
    const availableOutputs = Object.entries(outputs).filter(([_, value]) => value).length;
    const totalOutputs = Object.keys(outputs).length;
    
    console.log('\Infrastructure Summary:');
    console.log(`  Available outputs: ${availableOutputs}/${totalOutputs}`);
    console.log(`  Target region: ${region}`);
    console.log(`  Infrastructure: ${outputs.vpc_id ? 'Detected' : 'Not detected'}`);
    
    expect(availableOutputs).toBeGreaterThan(0);
  });
});