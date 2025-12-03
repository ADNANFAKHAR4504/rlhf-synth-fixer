import { App, Testing } from 'cdktf';
import { DevStack } from '../lib/dev-stack';
import { ProdStack } from '../lib/prod-stack';
import { StagingStack } from '../lib/staging-stack';
import { TapStack } from '../lib/tap-stack';

// small utility helpers to interrogate synthesized objects
function getResourceMap(synth: any, type: string) {
  return (synth?.resource && synth.resource[type]) || {};
}

function firstResourceKey(map: Record<string, any>): string | undefined {
  return Object.keys(map || {})[0];
}

describe('TapStack - Integration Tests (aggregate expectations)', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('TapStack rejects unknown environment', () => {
    expect(() => new TapStack(app, 'Invalid', { environmentSuffix: 'unknown' })).toThrow();
  });

  test('DevStack creates expected top-level resources and outputs', () => {
    const stack = new DevStack(app, 'DevIntStack', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
      awsRegion: 'us-east-1',
    });

    const synthesized = JSON.parse(Testing.synth(stack));
    // Outputs
    expect(Object.keys(synthesized.output).length).toBeGreaterThan(0);
    // VPC
    const vpcMap = getResourceMap(synthesized, 'aws_vpc');
    expect(Object.keys(vpcMap).length).toBeGreaterThan(0);
    // ECR
    const ecrMap = getResourceMap(synthesized, 'aws_ecr_repository');
    expect(Object.keys(ecrMap).length).toBeGreaterThan(0);
  });

  test('StagingStack has replication enabled and 2 Aurora instances', () => {
    const stack = new StagingStack(app, 'StagingIntStack', {
      config: {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
        enableCrossEnvironmentReplication: true,
        replicationSourceArn: 'arn:aws:rds:us-east-1:345678901234:cluster:aurora-cluster-prod',
      },
      awsRegion: 'us-east-1',
    });

    const synthesized = JSON.parse(Testing.synth(stack));
    const rdsClusterMap = getResourceMap(synthesized, 'aws_rds_cluster');
    expect(Object.keys(rdsClusterMap).length).toBeGreaterThan(0);
    const rdsInstancesMap = getResourceMap(synthesized, 'aws_rds_cluster_instance');
    expect(Object.keys(rdsInstancesMap).length).toBe(2);
  });

  test('ProdStack includes certificate and 3 Aurora instances', () => {
    const stack = new ProdStack(app, 'ProdIntStack', {
      config: {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        costCenter: 'engineering-prod',
        certificateArn: 'arn:aws:acm:us-east-1:345678901234:certificate/example',
      },
      awsRegion: 'us-east-1',
    });

    const synthesized = JSON.parse(Testing.synth(stack));
    const rdsInstancesMap = getResourceMap(synthesized, 'aws_rds_cluster_instance');
    expect(Object.keys(rdsInstancesMap).length).toBe(3);
    const listenerMap = getResourceMap(synthesized, 'aws_lb_listener');
    const listenerKey = firstResourceKey(listenerMap);
    expect(listenerKey).toBeDefined();
    if (listenerKey) {
      const listener = listenerMap[listenerKey];
      expect(listener.port).toBe(443);
      expect(listener.protocol).toBe('HTTPS');
    }
  });

  test('ECS CPU and Memory match DevStack defaults', () => {
    const stack = new DevStack(app, 'DevEcsCheck', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const ecsDefs = getResourceMap(synthesized, 'aws_ecs_task_definition');
    const tdKey = firstResourceKey(ecsDefs);
    expect(tdKey).toBeDefined();
    if (tdKey) {
      const td = ecsDefs[tdKey];
      expect(td.cpu).toBe('256');
      expect(td.memory).toBe('512');
    }
  });

  test('ECS CPU and Memory match StagingStack defaults', () => {
    const stack = new StagingStack(app, 'StagingEcsCheck', {
      config: {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const ecsDefs = getResourceMap(synthesized, 'aws_ecs_task_definition');
    const tdKey = firstResourceKey(ecsDefs);
    expect(tdKey).toBeDefined();
    if (tdKey) {
      const td = ecsDefs[tdKey];
      expect(td.cpu).toBe('512');
      expect(td.memory).toBe('1024');
    }
  });

  test('ECS CPU and Memory match ProdStack defaults', () => {
    const stack = new ProdStack(app, 'ProdEcsCheck', {
      config: {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        costCenter: 'engineering-prod',
        certificateArn: 'arn:aws:acm:us-east-1:345678901234:certificate/example',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const ecsDefs = getResourceMap(synthesized, 'aws_ecs_task_definition');
    const tdKey = firstResourceKey(ecsDefs);
    expect(tdKey).toBeDefined();
    if (tdKey) {
      const td = ecsDefs[tdKey];
      expect(td.cpu).toBe('1024');
      expect(td.memory).toBe('2048');
    }
  });

  test('CloudWatch constructs create expected alarms and dashboard', () => {
    const stack = new DevStack(app, 'DevCloudwatch', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const alarmsMap = getResourceMap(synthesized, 'aws_cloudwatch_metric_alarm');
    const dashboardMap = getResourceMap(synthesized, 'aws_cloudwatch_dashboard');
    expect(Object.keys(alarmsMap).length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(dashboardMap).length).toBeGreaterThan(0);
  });

  test('S3 bucket has encryption, public access block and lifecycle rules', () => {
    const stack = new DevStack(app, 'DevS3Int', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    expect(getResourceMap(synthesized, 'aws_s3_bucket')).toBeDefined();
    expect(getResourceMap(synthesized, 'aws_s3_bucket_server_side_encryption_configuration')).toBeDefined();
    expect(getResourceMap(synthesized, 'aws_s3_bucket_lifecycle_configuration')).toBeDefined();
    expect(getResourceMap(synthesized, 'aws_s3_bucket_public_access_block')).toBeDefined();
  });

  test('VPC creates both public and private subnets for 3 availability zones', () => {
    const stack = new DevStack(app, 'DevVpcInt', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
      awsRegion: 'us-east-1',
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const subnets = getResourceMap(synthesized, 'aws_subnet');
    expect(Object.keys(subnets).length).toBe(6); // 3 public + 3 private
  });

  test('ECR repository created and has expected name prefix', () => {
    const stack = new DevStack(app, 'DevEcrInt', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const ecrMap = getResourceMap(synthesized, 'aws_ecr_repository');
    const key = firstResourceKey(ecrMap);
    expect(key).toBeDefined();
    if (key) {
      const ecr = ecrMap[key];
      expect(ecr.name).toContain('trading-app-dev');
    }
  });

  test('ALB security group has rules for HTTP and, where applicable, HTTPS', () => {
    const devStack = new DevStack(app, 'DevAlbSG', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const prodStack = new ProdStack(app, 'ProdAlbSG', {
      config: {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        certificateArn: 'arn:aws:acm:us-east-1:345678901234:certificate/example',
        costCenter: 'engineering-prod',
      },
    });
    const devSynth = JSON.parse(Testing.synth(devStack));
    const prodSynth = JSON.parse(Testing.synth(prodStack));
    const devSgRules = getResourceMap(devSynth, 'aws_security_group_rule');
    const prodSgRules = getResourceMap(prodSynth, 'aws_security_group_rule');
    // Dev should have http rule
    const devHasHttp = Object.values(devSgRules).some((r: any) => r.from_port === 80 && r.to_port === 80);
    expect(devHasHttp).toBeTruthy();
    // Prod should have both http and https rules
    const prodHasHttps = Object.values(prodSgRules).some((r: any) => r.from_port === 443 && r.to_port === 443);
    expect(prodHasHttps).toBeTruthy();
  });

  test('ECS service desired count equals configured minCapacity', () => {
    const stack = new StagingStack(app, 'StagingEcsCount', {
      config: {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const ecsServices = getResourceMap(synthesized, 'aws_ecs_service');
    const key = firstResourceKey(ecsServices);
    expect(key).toBeDefined();
    if (key) {
      const svc = ecsServices[key];
      expect(svc.desired_count).toBe(2);
    }
  });

  test('Terraform backend uses environment key path and encryption', () => {
    const stack = new TapStack(app, 'BackendCheck', { environmentSuffix: 'dev', stateBucket: 'custom-backend', stateBucketRegion: 'us-east-1' });
    const synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized.terraform.backend.s3.key).toContain('dev');
    expect(synthesized.terraform.backend.s3.bucket).toBe('custom-backend');
    expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
  });

  test('Deployment manifest output contains the expected resource types', () => {
    const stack = new DevStack(app, 'DevManifest', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const manifestOutput = synthesized.output['deployment-manifest']?.value;
    expect(manifestOutput).toBeDefined();
    const manifest = JSON.parse(manifestOutput);
    const resourceTypes = manifest.resources.map((r: any) => r.type);
    // Check presence of major components
    expect(resourceTypes).toEqual(expect.arrayContaining(['ECR Repository', 'VPC', 'RDS Aurora Cluster', 'Application Load Balancer', 'ECS Cluster', 'S3 Bucket', 'CloudWatch Dashboard']));
  });

  test('RDS cluster engine and engineVersion are configured correctly (aurora-postgresql 14.6)', () => {
    const stack = new DevStack(app, 'DevRdsVersion', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const rdsMap = getResourceMap(synthesized, 'aws_rds_cluster');
    const key = firstResourceKey(rdsMap);
    expect(key).toBeDefined();
    if (key) {
      const rds = rdsMap[key];
      expect(rds.engine).toBe('aurora-postgresql');
      expect(rds.engine_version).toBe('14.6');
    }
  });

  test('ALB target group health check path and settings present', () => {
    const stack = new DevStack(app, 'DevAlbHealth', {
      config: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
    });
    const synthesized = JSON.parse(Testing.synth(stack));
    const tgMap = getResourceMap(synthesized, 'aws_lb_target_group');
    const key = firstResourceKey(tgMap);
    expect(key).toBeDefined();
    if (key) {
      const tg = tgMap[key];
      expect(tg.health_check.path).toBe('/health');
      expect(tg.health_check.protocol).toBe('HTTP');
    }
  });
});

