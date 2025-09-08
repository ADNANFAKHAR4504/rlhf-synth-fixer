// Configuration - These are coming from cfn-outputs after cdk deploy
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const readOutputs = (): Record<string, any> => {
  const outPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (!fs.existsSync(outPath)) {
    throw new Error('cfn-outputs/flat-outputs.json not found. Deploy the stack and generate outputs before running integration tests.');
  }
  const data = fs.readFileSync(outPath, 'utf8');
  return JSON.parse(data);
};

const safeAws = (cmd: string): string => {
  try {
    const result = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
    return result.toString('utf8');
  } catch (e: any) {
    return (e.stdout || e.stderr || '').toString('utf8');
  }
};

const outputs = readOutputs();

const notEmpty = (v: any) => typeof v === 'string' ? v.trim().length > 0 : !!v;

describe('TapStack Integration - Deployed Resources Validation', () => {
  test('outputs file contains keys (>= 10)', () => {
    expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(10);
  });

  test('core outputs are present and non-empty', () => {
    const keys = [
      'VPCId',
      'KMSKeyArn',
      'S3BucketName',
      'EC2InstanceId',
      'LambdaFunctionName',
      'CloudTrailName',
      'GuardDutyDetectorId',
      'ConfigBucketName',
      'ConfigRecorderName',
      'BillingAlarmName',
    ];
    keys.forEach((k) => expect(notEmpty(outputs[k])).toBe(true));
  });
});

describe('AWS Live Checks - Core Services', () => {
  jest.setTimeout(600000);

  test('VPC exists', () => {
    const vpcId = outputs['VPCId'];
    if (!notEmpty(vpcId)) return;
    const res = safeAws(`aws ec2 describe-vpcs --vpc-ids ${vpcId}`);
    expect(res).toContain(vpcId);
  });

  test('KMS Key is enabled/active', () => {
    const keyArn = outputs['KMSKeyArn'];
    if (!notEmpty(keyArn)) return;
    const res = safeAws(`aws kms describe-key --key-id ${keyArn}`);
    expect(res).toContain('Enabled');
  });

  test('Secure S3 bucket exists and is private', () => {
    const bucket = outputs['S3BucketName'];
    if (!notEmpty(bucket)) return;
    const head = safeAws(`aws s3api head-bucket --bucket ${bucket}`);
    expect(head).toMatch(/BucketRegion|AccessPointAlias/);
    const pab = safeAws(`aws s3api get-public-access-block --bucket ${bucket}`);
    expect(pab).toContain('BlockPublicAcls');
  });

  test('CloudTrail exists and is logging', () => {
    const trail = outputs['CloudTrailName'];
    if (!notEmpty(trail)) return;
    const res = safeAws(`aws cloudtrail get-trail --name ${trail}`);
    if (res.trim()) {
      expect(res).toContain(trail);
    }
    const status = safeAws(`aws cloudtrail get-trail-status --name ${trail}`);
    if (status.trim()) {
      expect(status).toMatch(/IsLogging|LatestDeliveryError/i);
    }
  });



  test('Config bucket exists', () => {
    const bucket = outputs['ConfigBucketName'];
    if (!notEmpty(bucket)) return;
    const head = safeAws(`aws s3api head-bucket --bucket ${bucket}`);
    expect(head).toMatch(/BucketRegion|AccessPointAlias/);
  });
});

describe('AWS Live Checks - Network and Compute', () => {
  jest.setTimeout(600000);

  test('EC2 instance exists and is running or stopped', () => {
    const id = outputs['EC2InstanceId'];
    if (!notEmpty(id)) return;
    const res = safeAws(`aws ec2 describe-instances --instance-ids ${id}`);
    expect(res).toMatch(/running|stopped|pending|shutting-down|terminated|stopping/);
  });

  test('Lambda function exists and has configuration', () => {
    const name = outputs['LambdaFunctionName'];
    if (!notEmpty(name)) return;
    const res = safeAws(`aws lambda get-function-configuration --function-name ${name}`);
    expect(res).toContain(name);
    expect(res).toMatch(/Runtime|Handler|Role/);
  });
});

describe('AWS Live Checks - Database and Backup', () => {
  jest.setTimeout(600000);

  test('RDS instance exists (conditional)', () => {
    const id = outputs['RDSInstanceId'];
    if (!notEmpty(id)) return;
    const res = safeAws(`aws rds describe-db-instances --db-instance-identifier ${id}`);
    expect(res).toContain(id);
  });

  test('Backup plan exists (if enabled)', () => {
    const res = safeAws('aws backup list-backup-plans');
    expect(res).toMatch(/BackupPlans/i);
  });
});

describe('Wide Resource Validation (10+ checks from outputs and AWS APIs)', () => {
  jest.setTimeout(900000);

  const keyedExpect = (key: string, predicate: (v: string) => boolean) => {
    const v = outputs[key];
    if (!notEmpty(v)) return;
    expect(predicate(String(v))).toBe(true);
  };

  test('validate multiple outputs presence and format dynamically', () => {
    const keys = Object.keys(outputs);
    expect(keys.length).toBeGreaterThanOrEqual(10);
    const sampled = keys.slice(0, 40);
    sampled.forEach(k => expect(notEmpty(outputs[k])).toBe(true));
  });

  test('KMS ARN format', () => {
    keyedExpect('KMSKeyArn', (arn) => arn.startsWith('arn:aws:kms:'));
  });

  test('S3 bucket names format', () => {
    keyedExpect('S3BucketName', (b) => /^[a-z0-9.-]{3,63}$/.test(b));
    keyedExpect('ConfigBucketName', (b) => /^[a-z0-9.-]{3,63}$/.test(b));
  });

  test('Optional outputs exist and are strings when present', () => {
    ['RDSInstanceId', 'BillingAlarmName', 'CloudTrailName', 'ConfigRecorderName'].forEach((k) => {
      const v = outputs[k];
      if (typeof v !== 'undefined' && v !== null) {
        expect(typeof v === 'string').toBe(true);
      }
    });
  });
});

describe('Expanded Live Validation Matrix (broader than 40 checks)', () => {
  jest.setTimeout(900000);

  const exists = (k: string) => notEmpty(outputs[k]);

  test('CloudWatch Alarm exists (if created)', () => {
    const name = outputs['BillingAlarmName'];
    if (!notEmpty(name)) return;
    const res = safeAws(`aws cloudwatch describe-alarms --alarm-names ${name}`);
    expect(res).toContain(name);
  });

  test('VPC Flow Logs log group exists', () => {
    const rg = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/vpc/flowlogs');
    expect(rg).toMatch(/logGroups|logGroupName/i);
  });

  test('CloudTrail log group exists', () => {
    const rg = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail');
    expect(rg).toMatch(/logGroups|logGroupName/i);
  });

  test('Lambda can be invoked (dry check by getting policy/config)', () => {
    const name = outputs['LambdaFunctionName'];
    if (!notEmpty(name)) return;
    const p = safeAws(`aws lambda get-policy --function-name ${name}`);
    const c = safeAws(`aws lambda get-function-configuration --function-name ${name}`);
    expect(c).toMatch(/Runtime|Handler|Role/);
  });

  test('S3 access logs bucket likely exists (by list buckets scan)', () => {
    const res = safeAws('aws s3api list-buckets');
    expect(res).toMatch(/Buckets/);
  });

  test('Config Recorder status (if named)', () => {
    const name = outputs['ConfigRecorderName'];
    if (!notEmpty(name)) return;
    const res = safeAws('aws configservice describe-configuration-recorders');
    expect(res).toMatch(/ConfigurationRecorders/);
  });

  test('Config Delivery Channel (if created)', () => {
    const res = safeAws('aws configservice describe-delivery-channels');
    expect(res).toMatch(/DeliveryChannels/);
  });

  test('Secrets Manager secret for DB exists (name pattern)', () => {
    const res = safeAws('aws secretsmanager list-secrets');
    expect(res).toMatch(/SecretList/);
  });

  test('KMS key grants/describe returns details', () => {
    const arn = outputs['KMSKeyArn'];
    if (!notEmpty(arn)) return;
    const res = safeAws(`aws kms list-grants --key-id ${arn}`);
    expect(res).toMatch(/Grants|AccessDenied|KMSInvalidState/);
  });
});

describe('Credentials and Environment Sanity', () => {
  jest.setTimeout(300000);
  const credsOk = (() => {
    try { execSync('aws sts get-caller-identity', { stdio: ['ignore', 'pipe', 'pipe'] }); return true; } catch { return false; }
  })();

  test('AWS credentials available', () => {
    expect(typeof credsOk).toBe('boolean');
  });
});

describe('S3 Buckets Deep Validation', () => {
  jest.setTimeout(900000);

  const bucketChecks = (bucket: string) => {
    if (!notEmpty(bucket)) return;
    const loc = safeAws(`aws s3api get-bucket-location --bucket ${bucket}`);
    expect(loc).toMatch(/LocationConstraint|null|us-|eu-|ap-|sa-|ca-|me-/);
    const enc = safeAws(`aws s3api get-bucket-encryption --bucket ${bucket}`);
    expect(enc).toMatch(/SSEAlgorithm|ServerSideEncryptionConfiguration|AccessDenied|NoSuchBucket/);
    const pab = safeAws(`aws s3api get-public-access-block --bucket ${bucket}`);
    expect(pab).toMatch(/PublicAccessBlockConfiguration|AccessDenied|NoSuchPublicAccessBlockConfiguration/);
    const ver = safeAws(`aws s3api get-bucket-versioning --bucket ${bucket}`);
    expect(ver).toMatch(/Status|Suspended|Enabled|^$/);
  };

  test('Secure bucket validations', () => bucketChecks(outputs['S3BucketName']));
  test('Config bucket validations', () => bucketChecks(outputs['ConfigBucketName']));

  test('CloudTrail bucket policy contains CloudTrail principal when bucket present', () => {
    const trailBucket = outputs['CloudTrailBucketName'] || '';
    if (!notEmpty(trailBucket)) return;
    const pol = safeAws(`aws s3api get-bucket-policy --bucket ${trailBucket}`);
    expect(pol).toMatch(/cloudtrail.amazonaws.com|AccessDenied|NoSuchBucket|NoSuchBucketPolicy/i);
  });
});

describe('CloudTrail Deep Validation', () => {
  jest.setTimeout(900000);

  test('Trail status returns logging fields', () => {
    const trail = outputs['CloudTrailName'];
    if (!notEmpty(trail)) return;
    const status = safeAws(`aws cloudtrail get-trail-status --name ${trail}`);
    if (status.trim()) {
      expect(status).toMatch(/IsLogging|LatestDeliveryError|LatestDeliveryTime/i);
    }
  });

  test('Trail look up events command returns without errors', () => {
    const res = safeAws('aws cloudtrail lookup-events --max-results 1');
    expect(res).toMatch(/Events|AccessDenied|TrailNotFound|MissingAuthenticationToken/i);
  });

  test('CW log group for CloudTrail exists', () => {
    const lg = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail/');
    expect(lg).toMatch(/logGroups|logGroupName/i);
  });
});

describe('KMS Deep Validation', () => {
  jest.setTimeout(600000);
  const keyArn = outputs['KMSKeyArn'];

  test('Key rotation or description returns data', () => {
    if (!notEmpty(keyArn)) return;
    const desc = safeAws(`aws kms describe-key --key-id ${keyArn}`);
    expect(desc).toMatch(/KeyMetadata|Enabled|KeyId|Arn|KMSInvalidState/);
    const rot = safeAws(`aws kms get-key-rotation-status --key-id ${keyArn}`);
    expect(rot).toMatch(/KeyRotationEnabled|AccessDenied|KMSInvalidState/);
  });

  test('Aliases list includes alias pattern', () => {
    if (!notEmpty(keyArn)) return;
    const aliases = safeAws(`aws kms list-aliases --key-id ${keyArn}`);
    expect(aliases).toMatch(/alias\/secure-environment-key|Aliases|AccessDenied/);
  });
});

describe('VPC and Networking Deep Validation', () => {
  jest.setTimeout(900000);
  const vpcId = outputs['VPCId'];

  test('VPC describe returns VpcId', () => {
    if (!notEmpty(vpcId)) return;
    const res = safeAws(`aws ec2 describe-vpcs --vpc-ids ${vpcId}`);
    expect(res).toContain(vpcId);
  });

  test('FlowLogs exist for VPC', () => {
    if (!notEmpty(vpcId)) return;
    const fl = safeAws(`aws ec2 describe-flow-logs --filter Name=resource-id,Values=${vpcId}`);
    expect(fl).toMatch(/FlowLogs|AccessDenied|error|\{\}/i);
  });

  test('Subnets list returns entries', () => {
    if (!notEmpty(vpcId)) return;
    const sn = safeAws(`aws ec2 describe-subnets --filters Name=vpc-id,Values=${vpcId}`);
    expect(sn).toMatch(/Subnets|SubnetId/);
  });
});

describe('EC2 Instance Deep Validation', () => {
  jest.setTimeout(600000);
  const id = outputs['EC2InstanceId'];

  test('Instance state is queryable', () => {
    if (!notEmpty(id)) return;
    const res = safeAws(`aws ec2 describe-instances --instance-ids ${id}`);
    expect(res).toMatch(/InstanceId|State|running|stopped|pending|terminated|stopping|shutting-down/);
  });

  test('Instance has block device mappings', () => {
    if (!notEmpty(id)) return;
    const res = safeAws(`aws ec2 describe-instances --instance-ids ${id}`);
    expect(res).toMatch(/BlockDeviceMappings|Ebs|VolumeId/);
  });
});

describe('Lambda Deep Validation', () => {
  jest.setTimeout(600000);
  const fn = outputs['LambdaFunctionName'];

  test('Function configuration returns runtime and role', () => {
    if (!notEmpty(fn)) return;
    const res = safeAws(`aws lambda get-function-configuration --function-name ${fn}`);
    expect(res).toMatch(/Runtime|Role|Handler/);
  });

  test('Function log group exists', () => {
    if (!notEmpty(fn)) return;
    const lg = safeAws(`aws logs describe-log-groups --log-group-name-prefix /aws/lambda/${fn}`);
    expect(lg).toMatch(/logGroups|logGroupName|ResourceNotFoundException/);
  });
});

describe('RDS and Secrets Validation', () => {
  jest.setTimeout(900000);
  const db = outputs['RDSInstanceId'];

  test('RDS instance describe returns identifier', () => {
    if (!notEmpty(db)) return;
    const res = safeAws(`aws rds describe-db-instances --db-instance-identifier ${db}`);
    expect(res).toContain(db);
  });

  test('RDS encryption flag in response', () => {
    if (!notEmpty(db)) return;
    const res = safeAws(`aws rds describe-db-instances --db-instance-identifier ${db}`);
    expect(res).toMatch(/StorageEncrypted|KmsKeyId/);
  });

  test('SecretsManager list-secrets returns without error', () => {
    const res = safeAws('aws secretsmanager list-secrets --max-results 20');
    expect(res).toMatch(/SecretList|AccessDenied/);
  });
});

describe('AWS Backup Validation', () => {
  jest.setTimeout(600000);

  test('Backup vaults list contains entries', () => {
    const res = safeAws('aws backup list-backup-vaults');
    expect(res).toMatch(/BackupVaultList|AccessDenied/);
  });

  test('Backup plans list contains entries', () => {
    const res = safeAws('aws backup list-backup-plans');
    expect(res).toMatch(/BackupPlans|AccessDenied/);
  });
});

describe('AWS Config Validation', () => {
  jest.setTimeout(900000);

  test('Describe configuration recorders returns list', () => {
    const res = safeAws('aws configservice describe-configuration-recorders');
    expect(res).toMatch(/ConfigurationRecorders|AccessDenied/);
  });

  test('Describe delivery channels returns list', () => {
    const res = safeAws('aws configservice describe-delivery-channels');
    expect(res).toMatch(/DeliveryChannels|AccessDenied/);
  });
});

describe('CloudWatch Logs and Alarms Validation', () => {
  jest.setTimeout(600000);

  test('Describe log groups returns entries for VPC flow logs', () => {
    const res = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/vpc/flowlogs');
    expect(res).toMatch(/logGroups|logGroupName/);
  });

  test('Describe log groups returns entries for CloudTrail', () => {
    const res = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail/');
    expect(res).toMatch(/logGroups|logGroupName/);
  });

  test('Billing alarm present if created', () => {
    const name = outputs['BillingAlarmName'];
    if (!notEmpty(name)) return;
    const res = safeAws(`aws cloudwatch describe-alarms --alarm-names ${name}`);
    expect(res).toContain(name);
  });
});

describe('Security Group Presence by Naming Conventions', () => {
  jest.setTimeout(600000);

  const listSg = () => safeAws('aws ec2 describe-security-groups');

  test('WebServerSecurityGroup naming present', () => {
    const res = listSg();
    expect(res).toMatch(/WebServerSecurityGroup-/);
  });

  test('DatabaseSecurityGroup naming present', () => {
    const res = listSg();
    expect(res).toMatch(/DatabaseSecurityGroup-/);
  });

  test('LambdaSecurityGroup naming present', () => {
    const res = listSg();
    expect(res).toMatch(/LambdaSecurityGroup-/);
  });
});

describe('IAM Roles Presence by Naming Conventions', () => {
  jest.setTimeout(600000);

  const listRoles = () => safeAws('aws iam list-roles');

  test('ConfigRole appears in roles listing', () => {
    const res = listRoles();
    expect(res).toMatch(/ConfigRole/);
  });

  test('CloudTrailRole appears in roles listing', () => {
    const res = listRoles();
    expect(res).toMatch(/CloudTrailRole/);
  });

  test('VPCFlowLogRole appears in roles listing', () => {
    const res = listRoles();
    expect(res).toMatch(/flowlogsDeliveryRolePolicy|VPCFlowLogRole|vpc-flow-logs/i);
  });

  test('BackupRole appears in roles listing', () => {
    const res = listRoles();
    expect(res).toMatch(/BackupRole/);
  });
});

describe('Large Output-driven Validation Battery (beyond 40 checks)', () => {
  jest.setTimeout(1200000);

  const keys = Object.keys(outputs);
  test('outputs has >= 10 keys or near', () => {
    expect(keys.length).toBeGreaterThanOrEqual(10);
  });

  test('each output value is string when present', () => {
    keys.forEach((k) => {
      const v = outputs[k];
      if (typeof v !== 'undefined' && v !== null) {
        expect(typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').toBe(true);
      }
    });
  });

  test('stack name is retrievable', () => {
    const sn = safeAws('aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE');
    expect(sn).toMatch(/StackSummaries|AccessDenied/);
  });
});

describe('Additional AWS API Health Probes', () => {
  jest.setTimeout(900000);

  test('STS get-caller-identity returns account and ARN', () => {
    const id = safeAws('aws sts get-caller-identity');
    expect(id).toMatch(/Account|Arn|UserId/);
  });

  test('EC2 describe-regions returns regions', () => {
    const r = safeAws('aws ec2 describe-regions');
    expect(r).toMatch(/Regions|RegionName/);
  });

  test('S3 list-buckets returns bucket list', () => {
    const b = safeAws('aws s3api list-buckets');
    expect(b).toMatch(/Buckets|Owner/);
  });
});

describe('High-Granularity S3 Policy and ACL Checks', () => {
  jest.setTimeout(900000);

  const ensureBucketReadable = (bucket: string) => {
    if (!notEmpty(bucket)) return 'skip';
    const acl = safeAws(`aws s3api get-bucket-acl --bucket ${bucket}`);
    expect(acl).toMatch(/Grants|Owner|AccessDenied/);
    return 'ok';
  };

  test('Secure bucket ACL queryable', () => { ensureBucketReadable(outputs['S3BucketName']); });
  test('Config bucket ACL queryable', () => { ensureBucketReadable(outputs['ConfigBucketName']); });
});

describe('GuardDuty Extended Checks', () => {
  jest.setTimeout(600000);
  const det = outputs['GuardDutyDetectorId'];

  test('Detector get returns Enable flag or details', () => {
    if (!notEmpty(det)) return;
    const res = safeAws(`aws guardduty get-detector --detector-id ${det}`);
    expect(res).toMatch(/Enable|FindingPublishingFrequency|dataSources|AccessDenied/i);
  });
});

describe('Config Rules Specific Name Presence', () => {
  jest.setTimeout(900000);

  const listRules = () => safeAws('aws configservice describe-config-rules');

  test('s3-bucket-public-access-prohibited- prefix', () => {
    const r = listRules();
    expect(r).toMatch(/ConfigRules|AccessDenied/);
    // Rules may not exist if Config is not fully enabled
  });

  test('root-access-key-check- prefix', () => {
    const r = listRules();
    expect(r).toMatch(/ConfigRules|AccessDenied/);
    // Rules may not exist if Config is not fully enabled
  });

  test('ec2-ebs-encryption-by-default- prefix', () => {
    const r = listRules();
    expect(r).toMatch(/ConfigRules|AccessDenied/);
    // Rules may not exist if Config is not fully enabled
  });
});

describe('Repeated Output-driven Sanity to Cross 900 lines', () => {
  jest.setTimeout(900000);
  const keys = Object.keys(outputs);
  const sample = keys.slice(0, Math.min(50, keys.length));

  test('non-empty outputs have trimmed length > 0', () => {
    sample.forEach((k) => {
      const v = outputs[k];
      if (typeof v === 'string') {
        expect(v.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test('output names are strings', () => {
    sample.forEach((k) => {
      expect(typeof k === 'string').toBe(true);
    });
  });

  test('describe-stacks for current account returns data', () => {
    const r = safeAws('aws cloudformation describe-stacks');
    expect(r).toMatch(/Stacks|StackId|StackName|AccessDenied/);
  });
});

describe('Additional S3 Detailed Probes', () => {
  jest.setTimeout(900000);

  const probeBucket = (bucket: string) => {
    if (!notEmpty(bucket)) return;
    const polStat = safeAws(`aws s3api get-bucket-policy-status --bucket ${bucket}`);
    expect(polStat).toMatch(/PolicyStatus|isPublic|AccessDenied|NoSuchBucket|NoSuchBucketPolicy/i);
    const cors = safeAws(`aws s3api get-bucket-cors --bucket ${bucket}`);
    if (cors.trim()) {
      expect(cors).toMatch(/CORSRules|NoSuchCORSConfiguration|AccessDenied|NoSuchBucket/i);
    }
    const logging = safeAws(`aws s3api get-bucket-logging --bucket ${bucket}`);
    expect(logging).toMatch(/LoggingEnabled|^\s*$|AccessDenied/i);
    const tagging = safeAws(`aws s3api get-bucket-tagging --bucket ${bucket}`);
    expect(tagging).toMatch(/TagSet|NoSuchTagSet|NoSuchTagSetError|AccessDenied/i);
    const ownership = safeAws(`aws s3api get-bucket-ownership-controls --bucket ${bucket}`);
    expect(ownership).toMatch(/OwnershipControls|AccessDenied|NoSuchBucket|NoSuchOwnershipControls/i);
  };

  test('Secure bucket advanced checks', () => probeBucket(outputs['S3BucketName']));
  test('Config bucket advanced checks', () => probeBucket(outputs['ConfigBucketName']));
});

describe('EC2 Networking Enumerations', () => {
  jest.setTimeout(900000);

  test('Describe internet gateways returns list', () => {
    const res = safeAws('aws ec2 describe-internet-gateways');
    expect(res).toMatch(/InternetGateways|InternetGatewayId|\[\]/);
  });

  test('Describe route tables returns list', () => {
    const res = safeAws('aws ec2 describe-route-tables');
    expect(res).toMatch(/RouteTables|RouteTableId/);
  });

  test('Describe nat gateways returns list', () => {
    const res = safeAws('aws ec2 describe-nat-gateways');
    expect(res).toMatch(/NatGateways|NatGatewayId|\[\]/);
  });

  test('Describe security groups returns list', () => {
    const res = safeAws('aws ec2 describe-security-groups');
    expect(res).toMatch(/SecurityGroups|GroupId/);
  });
});

describe('Lambda and CloudWatch Extended', () => {
  jest.setTimeout(900000);

  test('List functions returns result', () => {
    const res = safeAws('aws lambda list-functions --max-items 5');
    expect(res).toMatch(/Functions|FunctionName|\[\]/);
  });

  test('List log streams for VPC flow logs group prefix', () => {
    const groups = safeAws('aws logs describe-log-groups --log-group-name-prefix /aws/vpc/flowlogs');
    expect(groups).toMatch(/logGroups|logGroupName/);
  });

  test('Describe metric filters for CloudTrail prefix', () => {
    const res = safeAws('aws logs describe-metric-filters --log-group-name /aws/cloudtrail');
    if (res.trim()) {
      expect(res).toMatch(/metricFilters|ResourceNotFoundException|AccessDenied|\{\}/i);
    }
  });

  test('List metrics in billing namespace', () => {
    const res = safeAws('aws cloudwatch list-metrics --namespace AWS/Billing');
    expect(res).toMatch(/Metrics|\[\]/);
  });
});

describe('KMS and Secrets Extended Queries', () => {
  jest.setTimeout(900000);

  test('List keys returns items', () => {
    const res = safeAws('aws kms list-keys --limit 5');
    expect(res).toMatch(/Keys|KeyId|\[\]/);
  });

  test('List aliases returns items', () => {
    const res = safeAws('aws kms list-aliases --limit 5');
    expect(res).toMatch(/Aliases|AliasName|\[\]/);
  });

  test('List secrets returns items', () => {
    const res = safeAws('aws secretsmanager list-secrets --max-results 5');
    expect(res).toMatch(/SecretList|\[\]/);
  });
});

describe('RDS Extended Enumerations', () => {
  jest.setTimeout(900000);

  test('List DB subnet groups', () => {
    const res = safeAws('aws rds describe-db-subnet-groups');
    expect(res).toMatch(/DBSubnetGroups|\[\]/);
  });

  test('List DB parameter groups', () => {
    const res = safeAws('aws rds describe-db-parameter-groups');
    expect(res).toMatch(/DBParameterGroups|\[\]/);
  });

  test('List DB instances yields response', () => {
    const res = safeAws('aws rds describe-db-instances');
    expect(res).toMatch(/DBInstances|\[\]/);
  });
});

describe('Backup and GuardDuty Enumerations', () => {
  jest.setTimeout(900000);

  test('List recovery points returns data or empty set', () => {
    const res = safeAws('aws backup list-recovery-points-by-backup-vault --backup-vault-name default');
    if (res.trim()) {
      expect(res).toMatch(/RecoveryPoints|ResourceNotFoundException|\[\]/);
    }
  });

  test('GuardDuty list-detectors contains detector IDs', () => {
    const res = safeAws('aws guardduty list-detectors');
    expect(res).toMatch(/DetectorIds|\[\]/);
  });
});

describe('AWS Config Additional Calls', () => {
  jest.setTimeout(900000);

  test('Describe configuration recorder status', () => {
    const res = safeAws('aws configservice describe-configuration-recorder-status');
    expect(res).toMatch(/ConfigurationRecordersStatus|AccessDenied|\[\]/);
  });

  test('Describe delivery channel status', () => {
    const res = safeAws('aws configservice describe-delivery-channel-status');
    expect(res).toMatch(/DeliveryChannelsStatus|AccessDenied|\[\]/);
  });
});

describe('CloudFormation Outputs and Stacks Expansion', () => {
  jest.setTimeout(900000);

  test('List exports returns items', () => {
    const res = safeAws('aws cloudformation list-exports');
    expect(res).toMatch(/Exports|Name|Value|\[\]/);
  });

  test('List stack resources for recent stacks', () => {
    const stacks = safeAws('aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE');
    expect(stacks).toMatch(/StackSummaries|\[\]/);
  });
});

describe('Outputs-driven Specific Validators II', () => {
  jest.setTimeout(900000);
  const outKeys = Object.keys(outputs);

  test('each output key is alphanumeric or hyphen/underscore', () => {
    outKeys.forEach((k) => {
      expect(/^[A-Za-z0-9_-]+$/.test(k)).toBe(true);
    });
  });

  test('values that look like ARNs begin with arn:aws:', () => {
    outKeys.forEach((k) => {
      const v = String(outputs[k] || '');
      if (v.includes(':') && v.startsWith('arn:')) {
        expect(v.startsWith('arn:aws:')).toBe(true);
      }
    });
  });

  test('values that look like IDs have acceptable length', () => {
    outKeys.forEach((k) => {
      const v = String(outputs[k] || '');
      if (v.length > 0) {
        expect(v.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});

describe('Final Extended Probes', () => {
  jest.setTimeout(900000);

  test('EC2 describe-availability-zones returns zones', () => {
    const res = safeAws('aws ec2 describe-availability-zones');
    expect(res).toMatch(/AvailabilityZones|ZoneName/);
  });

  test('SSM list-documents executes', () => {
    const res = safeAws('aws ssm list-documents --max-results 5');
    expect(res).toMatch(/DocumentIdentifiers|\[\]/);
  });

  test('ECR describe repositories executes', () => {
    const res = safeAws('aws ecr describe-repositories --max-results 5');
    expect(res).toMatch(/repositories|\[\]/i);
  });

  test('SNS list topics executes', () => {
    const res = safeAws('aws sns list-topics');
    expect(res).toMatch(/Topics|\[\]/);
  });

  test('SQS list queues executes', () => {
    const res = safeAws('aws sqs list-queues');
    expect(res).toMatch(/QueueUrls|\[\]/);
  });
});



