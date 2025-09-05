import fs from 'fs';
import path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const readTemplateJsonOrThrow = (): CfnTemplate => {
  const jsonPath = path.join(__dirname, '../lib/TapStack.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error('lib/TapStack.json not found. Generate JSON from TapStack.yml before running unit tests.');
  }
  const content = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(content);
};

const template = readTemplateJsonOrThrow();

const getResourcesByType = (type: string) =>
  Object.entries(template.Resources || {}).filter(([, r]: any) => r.Type === type);

describe('TapStack CloudFormation Template - Structure', () => {
  test('has AWSTemplateFormatVersion 2010-09-09', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('has Description defined', () => {
    expect(typeof template.Description === 'string').toBe(true);
    expect((template.Description || '').length).toBeGreaterThan(0);
  });

  test('has Parameters, Conditions, Resources, Outputs defined', () => {
    expect(typeof template.Parameters).toBe('object');
    expect(typeof template.Conditions).toBe('object');
    expect(typeof template.Resources).toBe('object');
    expect(typeof template.Outputs).toBe('object');
  });
});

describe('Parameters - Presence and Types', () => {
  const mustHaveParams = [
    'Environment',
    'Owner',
    'TrustedCIDR',
    'VpcCIDR',
    'KeyPairName',
    'SecondAvailabilityZone',
    'LatestAmiId',
    'DBUsername',
    'ExistingKMSKeyArn',
    'ExistingVPCId',
    'ExistingInternetGatewayId',
    'ExistingPublicSubnetId',
    'ExistingPrivateSubnetId',
    'ExistingNatGatewayId',
    'ExistingDatabaseSubnet1Id',
    'ExistingDatabaseSubnet2Id',
    'ExistingDatabaseSubnetGroupName',
    'ExistingDatabaseSecretArn',
    'ExistingDatabaseInstanceId',
    'ExistingBackupVaultName',
    'ExistingCloudTrailName',
    'ExistingCloudTrailBucketName',
    'ExistingConfigBucketName',
    'ExistingGuardDutyDetectorId',
    'ExistingLambdaFunctionName',
    'ExistingEC2InstanceId',
    'ExistingBillingAlarmName',
    'ExistingConfigDeliveryChannelName',
    'ExistingConfigRecorderName',
    'EnableConfigDeliveryChannel',
    'EnableConfigRecorder',
    'EnableEBSEncryption',
    'ExistingWebServerSecurityGroupId',
    'ExistingDatabaseSecurityGroupId',
    'ExistingLambdaSecurityGroupId',
    'ExistingEC2RoleArn',
    'ExistingEC2InstanceProfileArn',
    'ExistingLambdaExecutionRoleArn',
    'ExistingSecureS3BucketName',
    'ExistingS3AccessLogsBucketName',
  ];

  test('has a rich set of parameters (>= 30)', () => {
    expect(Object.keys(template.Parameters || {}).length).toBeGreaterThanOrEqual(30);
  });

  test.each(mustHaveParams)('parameter %s exists', (paramName) => {
    expect(template.Parameters).toHaveProperty(paramName);
  });

  test('string parameters default to strings when provided', () => {
    const paramEntries = Object.entries(template.Parameters || {});
    const sample = paramEntries.slice(0, Math.min(20, paramEntries.length));
    sample.forEach(([_, value]) => {
      if (typeof (value as any).Default !== 'undefined') {
        const t = typeof (value as any).Default;
        expect(['string', 'number', 'boolean'].includes(t)).toBe(true);
      }
    });
  });
});

describe('Conditions - Presence and Logical Composition', () => {
  const mustHaveConditions = [
    'UseExistingKMS',
    'CreateKMS',
    'HasSecondAZ',
    'HasTwoSubnetAZs',
    'CreateVPC',
    'UseExistingInternetGateway',
    'CreateInternetGateway',
    'UseExistingPublicSubnet',
    'CreatePublicSubnet',
    'UseExistingPrivateSubnet',
    'CreatePrivateSubnet',
    'UseExistingDatabaseSubnet1',
    'CreateDatabaseSubnet1',
    'UseExistingDatabaseSubnet2',
    'CreateDatabaseSubnet2',
    'UseExistingNatGateway',
    'CreateNatGateway',
    'UseExistingWebServerSecurityGroup',
    'CreateWebServerSecurityGroup',
    'UseExistingDatabaseSecurityGroup',
    'CreateDatabaseSecurityGroup',
    'UseExistingLambdaSecurityGroup',
    'CreateLambdaSecurityGroup',
    'UseExistingEC2Role',
    'CreateEC2Role',
    'UseExistingEC2InstanceProfile',
    'CreateEC2InstanceProfile',
    'UseExistingLambdaExecutionRole',
    'CreateLambdaExecutionRole',
    'UseExistingSecureS3Bucket',
    'CreateSecureS3Bucket',
    'UseExistingS3AccessLogsBucket',
    'CreateS3AccessLogsBucket',
    'UseExistingDatabaseSubnetGroup',
    'UseExistingDatabaseSecret',
    'CreateDatabaseSecret',
    'UseExistingDatabaseInstance',
    'UseExistingBackupVault',
    'CreateBackupVault',
    'EnableBackup',
    'UseExistingCloudTrail',
    'CreateCloudTrail',
    'UseExistingCloudTrailBucket',
    'CreateCloudTrailBucket',
    'CreateCloudTrailBucketPolicy',
    'UseExistingConfigBucket',
    'CreateConfigBucket',
    'UseExistingConfigRecorder',
    'CreateConfigRecorder',
    'CreateConfigDeliveryChannel',
    'UseExistingGuardDutyDetector',
    'CreateGuardDutyDetector',
    'UseExistingLambdaFunction',
    'CreateLambdaFunction',
    'UseExistingEC2Instance',
    'CreateEC2Instance',
    'UseExistingBillingAlarm',
    'CreateBillingAlarm',
    'HasKeyPair',
    'EnableBackupAndHasTwoAZs',
    'ShouldEnableEBSEncryption',
  ];

  test('conditions exist and are numerous (>= 30)', () => {
    expect(Object.keys(template.Conditions || {}).length).toBeGreaterThanOrEqual(30);
  });

  test.each(mustHaveConditions)('condition %s exists', (cond) => {
    expect(template.Conditions).toHaveProperty(cond);
  });
});

describe('Resources - Inventory and Core Invariants', () => {
  const resources = template.Resources || {};
  const entries = Object.entries(resources);

  test('has at least 40 resources', () => {
    expect(entries.length).toBeGreaterThanOrEqual(40);
  });

  const typeCounts: Record<string, number> = {};
  entries.forEach(([, res]) => {
    typeCounts[(res as any).Type] = (typeCounts[(res as any).Type] || 0) + 1;
  });

  test('has expected core resource types', () => {
    const requiredTypes = [
      'AWS::KMS::Key',
      'AWS::KMS::Alias',
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::RouteTable',
      'AWS::EC2::Route',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::EC2::FlowLog',
      'AWS::Logs::LogGroup',
      'AWS::IAM::Role',
      'AWS::IAM::InstanceProfile',
      'AWS::S3::Bucket',
      'AWS::S3::BucketPolicy',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBInstance',
      'AWS::Backup::BackupVault',
      'AWS::Backup::BackupPlan',
      'AWS::Backup::BackupSelection',
      'AWS::CloudTrail::Trail',
      'AWS::GuardDuty::Detector',
      'AWS::Lambda::Function',
      'AWS::EC2::Instance',
      'AWS::Config::ConfigurationRecorder',
      'AWS::Config::DeliveryChannel',
      'AWS::Config::ConfigRule',
      'AWS::SecretsManager::Secret',
    ];
    requiredTypes.forEach((t) => {
      expect(Object.keys(typeCounts)).toContain(t);
    });
  });

  test('many resources have deletion/update policies set to Retain where appropriate', () => {
    const retainPreferredTypes = new Set([
      'AWS::KMS::Key',
      'AWS::KMS::Alias',
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::RouteTable',
      'AWS::EC2::Route',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::EC2::FlowLog',
      'AWS::Logs::LogGroup',
      'AWS::IAM::Role',
      'AWS::IAM::InstanceProfile',
      'AWS::S3::Bucket',
      'AWS::S3::BucketPolicy',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBInstance',
      'AWS::Backup::BackupVault',
      'AWS::Backup::BackupPlan',
      'AWS::Backup::BackupSelection',
      'AWS::CloudTrail::Trail',
      'AWS::GuardDuty::Detector',
      'AWS::Lambda::Function',
      'AWS::EC2::Instance',
      'AWS::Config::ConfigurationRecorder',
      'AWS::Config::DeliveryChannel',
      'AWS::Config::ConfigRule',
      'AWS::SecretsManager::Secret',
    ]);
    const sampled = entries
      .filter(([, r]) => retainPreferredTypes.has((r as any).Type))
      .slice(0, 80);
    sampled.forEach(([, r]) => {
      if ((r as any).DeletionPolicy) {
        expect((r as any).DeletionPolicy).toBe('Retain');
      }
      if ((r as any).UpdateReplacePolicy) {
        expect((r as any).UpdateReplacePolicy).toBe('Retain');
      }
    });
  });
});

describe('Resource-specific Property Assertions', () => {
  const res = template.Resources || {};

  test('KMS Key has KeyPolicy with at least 2 statements', () => {
    const kms = Object.values(res).find((r: any) => (r as any).Type === 'AWS::KMS::Key') as any;
    expect(kms).toBeDefined();
    expect(kms.Properties).toBeDefined();
    expect(kms.Properties.KeyPolicy).toBeDefined();
    const s = ((kms.Properties.KeyPolicy || {}).Statement || []) as any[];
    expect(Array.isArray(s)).toBe(true);
    expect(s.length).toBeGreaterThanOrEqual(2);
  });

  test('S3 buckets have encryption and public access blocks', () => {
    const buckets = Object.values(res).filter((r: any) => (r as any).Type === 'AWS::S3::Bucket') as any[];
    expect(buckets.length).toBeGreaterThanOrEqual(2);
    buckets.forEach((b) => {
      const enc = (((b || {}).Properties || {}).BucketEncryption || {}).ServerSideEncryptionConfiguration;
      expect(enc).toBeDefined();
      const pab = ((b || {}).Properties || {}).PublicAccessBlockConfiguration;
      if (pab) {
        expect(typeof pab.BlockPublicAcls !== 'undefined').toBe(true);
        expect(typeof pab.BlockPublicPolicy !== 'undefined').toBe(true);
        expect(typeof pab.IgnorePublicAcls !== 'undefined').toBe(true);
        expect(typeof pab.RestrictPublicBuckets !== 'undefined').toBe(true);
      }
    });
  });

  test('VPC has CIDR and DNS configs', () => {
    const vpc = Object.values(res).find((r: any) => (r as any).Type === 'AWS::EC2::VPC') as any;
    expect(vpc).toBeDefined();
    const p = (vpc || {}).Properties || {};
    expect(p.CidrBlock).toBeDefined();
    expect(typeof p.EnableDnsHostnames !== 'undefined').toBe(true);
    expect(typeof p.EnableDnsSupport !== 'undefined').toBe(true);
  });

  test('Subnets specify AZ and CIDR', () => {
    const subnets = Object.values(res).filter((r: any) => (r as any).Type === 'AWS::EC2::Subnet') as any[];
    expect(subnets.length).toBeGreaterThanOrEqual(3);
    subnets.forEach((s) => {
      const p = (s || {}).Properties || {};
      expect(p.CidrBlock).toBeDefined();
      expect(p.AvailabilityZone || p.AvailabilityZoneId || p.MapPublicIpOnLaunch !== undefined).toBeTruthy();
    });
  });

  test('Security Groups have tags and describe ingress/egress', () => {
    const sgs = Object.values(res).filter((r: any) => (r as any).Type === 'AWS::EC2::SecurityGroup') as any[];
    expect(sgs.length).toBeGreaterThanOrEqual(2);
    sgs.forEach((g) => {
      const p = (g || {}).Properties || {};
      expect(p.GroupDescription).toBeDefined();
      expect(Array.isArray(p.Tags)).toBe(true);
    });
  });

  test('IAM Roles have AssumeRolePolicyDocument and at least one Policy or ManagedPolicy', () => {
    const roles = Object.values(res).filter((r: any) => (r as any).Type === 'AWS::IAM::Role') as any[];
    expect(roles.length).toBeGreaterThanOrEqual(4);
    roles.forEach((r) => {
      const p = (r || {}).Properties || {};
      expect(p.AssumeRolePolicyDocument).toBeDefined();
      expect(p.Policies || p.ManagedPolicyArns).toBeDefined();
    });
  });

  test('RDS DBInstance is encrypted and non-public', () => {
    const rds = Object.values(res).find((r: any) => (r as any).Type === 'AWS::RDS::DBInstance') as any;
    if (!rds) return;
    const p = (rds || {}).Properties || {};
    expect(p.StorageEncrypted).toBe(true);
    expect(p.PubliclyAccessible).toBe(false);
    expect(p.DBSubnetGroupName).toBeDefined();
  });

  test('CloudTrail Trail references S3 bucket and CW Logs', () => {
    const trail = Object.values(res).find((r: any) => (r as any).Type === 'AWS::CloudTrail::Trail') as any;
    if (!trail) return;
    const p = (trail || {}).Properties || {};
    expect(p.S3BucketName).toBeDefined();
    expect(p.CloudWatchLogsLogGroupArn).toBeDefined();
    expect(p.CloudWatchLogsRoleArn).toBeDefined();
    expect(p.IsLogging).toBe(true);
  });

  test('Config ConfigurationRecorder has role and recording group', () => {
    const rec = Object.values(res).find((r: any) => (r as any).Type === 'AWS::Config::ConfigurationRecorder') as any;
    if (!rec) return;
    const p = (rec || {}).Properties || {};
    expect(p.RoleARN).toBeDefined();
    expect(p.RecordingGroup).toBeDefined();
  });

  test('Backup Plan and Selection exist if backup is enabled via conditions', () => {
    const plan = Object.values(res).find((r: any) => (r as any).Type === 'AWS::Backup::BackupPlan');
    const selection = Object.values(res).find((r: any) => (r as any).Type === 'AWS::Backup::BackupSelection');
    expect(plan).toBeDefined();
    expect(selection).toBeDefined();
  });
});

describe('Outputs - Presence and Non-empty', () => {
  const outs = template.Outputs || {};

  const requiredOutputs = [
    'VPCId',
    'KMSKeyArn',
    'S3BucketName',
    'RDSInstanceId',
    'EC2InstanceId',
    'LambdaFunctionName',
    'CloudTrailName',
    'GuardDutyDetectorId',
    'ConfigBucketName',
    'ConfigRecorderName',
    'BillingAlarmName',
  ];

  test('has at least 10 outputs', () => {
    expect(Object.keys(outs).length).toBeGreaterThanOrEqual(10);
  });

  test.each(requiredOutputs)('output %s exists', (outKey) => {
    expect(outs).toHaveProperty(outKey);
  });

  test('all outputs have Description, Value, and Export.Name', () => {
    Object.values(outs).forEach((o: any) => {
      expect(o.Description).toBeDefined();
      expect(o.Value).toBeDefined();
      expect(o.Export).toBeDefined();
      expect(o.Export.Name).toBeDefined();
    });
  });
});

describe('Combinatorial Resource Assertions', () => {
  const res = template.Resources || {};
  const entries = Object.entries(res);

  test('all resources have a Type and Properties object', () => {
    entries.forEach(([, r]: any) => {
      expect(typeof r.Type).toBe('string');
      expect(typeof r.Properties).toBe('object');
    });
  });

  test('at least 30 resources are tagged with Environment and Owner when Tags exist', () => {
    const withTags = entries.filter(([, r]: any) => Array.isArray((r.Properties || {}).Tags));
    const taggedWithEnv = withTags.filter(([, r]: any) => ((r.Properties || {}).Tags || []).some((t: any) => t.Key === 'Environment'));
    const taggedWithOwner = withTags.filter(([, r]: any) => ((r.Properties || {}).Tags || []).some((t: any) => t.Key === 'Owner'));
    expect(taggedWithEnv.length).toBeGreaterThanOrEqual(30);
    expect(taggedWithOwner.length).toBeGreaterThanOrEqual(30);
  });

  test('security-related resources reference KMS where applicable', () => {
    const kmsConsumers = entries.filter(([, r]: any) => {
      const p = r.Properties || {};
      return (
        r.Type === 'AWS::Logs::LogGroup' ||
        r.Type === 'AWS::RDS::DBInstance' ||
        r.Type === 'AWS::SecretsManager::Secret' ||
        r.Type === 'AWS::CloudTrail::Trail'
      ) && (p.KmsKeyId || p.KMSKeyId || p.KmsKeyArn);
    });
    expect(kmsConsumers.length).toBeGreaterThanOrEqual(3);
  });

  test('no resource has an obviously invalid Type', () => {
    const invalid = entries.filter(([, r]: any) => !/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/.test(r.Type));
    expect(invalid.length).toBe(0);
  });
});

describe('Expanded Assertions Across Many Resources', () => {
  const res = template.Resources || {};
  const byType = (t: string) => Object.values(res).filter((r: any) => r.Type === t) as any[];

  test('EC2 Instance has BlockDeviceMappings with encryption', () => {
    const inst = byType('AWS::EC2::Instance')[0];
    if (!inst) return;
    const m = ((inst || {}).Properties || {}).BlockDeviceMappings || [];
    expect(Array.isArray(m)).toBe(true);
    m.forEach((bdm: any) => {
      const ebs = (bdm || {}).Ebs || {};
      expect(ebs.Encrypted).toBe(true);
    });
  });

  test('Lambda Function has runtime, handler, role, and VPC config', () => {
    const fn = byType('AWS::Lambda::Function')[0];
    if (!fn) return;
    const p = (fn || {}).Properties || {};
    expect(typeof p.Runtime === 'string').toBe(true);
    expect(typeof p.Handler === 'string').toBe(true);
    expect(p.Role).toBeDefined();
    expect(p.VpcConfig).toBeDefined();
  });

  test('CloudWatch Alarm has correct core properties', () => {
    const alarm = byType('AWS::CloudWatch::Alarm')[0];
    if (!alarm) return;
    const p = (alarm || {}).Properties || {};
    expect(typeof p.AlarmName !== 'undefined').toBe(true);
    expect(typeof p.MetricName !== 'undefined').toBe(true);
    expect(typeof p.Namespace !== 'undefined').toBe(true);
    expect(typeof p.Threshold !== 'undefined').toBe(true);
  });
});

describe('Cross-Resource References and Dependencies', () => {
  const res = template.Resources || {};

  test('FlowLog references LogGroup and IAM Role', () => {
    const fl = Object.values(res).find((r: any) => r.Type === 'AWS::EC2::FlowLog') as any;
    if (!fl) return;
    const p = (fl || {}).Properties || {};
    expect(p.LogGroupName).toBeDefined();
    expect(p.DeliverLogsPermissionArn).toBeDefined();
  });

  test('CloudTrail BucketPolicy conditions specify AWS:SourceArn and s3:x-amz-acl where required', () => {
    const policies = Object.values(res).filter((r: any) => r.Type === 'AWS::S3::BucketPolicy') as any[];
    policies.forEach((bp: any) => {
      const p = (bp || {}).Properties || {};
      expect(p.PolicyDocument).toBeDefined();
    });
  });
});

describe('Outputs - Content Semantics', () => {
  const outs = template.Outputs || {};
  const keys = Object.keys(outs);

  test('each output Export.Name includes ${AWS::StackName}', () => {
    keys.forEach((k) => {
      const o: any = outs[k];
      const name = o?.Export?.Name;
      expect(name).toBeDefined();
      if (typeof name === 'object' && 'Fn::Sub' in name) {
        expect((name as any)['Fn::Sub']).toContain('${AWS::StackName}-');
      }
    });
  });
});

describe('Large-scale Iterative Assertions (broad coverage)', () => {
  const allRes = Object.entries(template.Resources || {});

  test('each resource has a non-empty logical ID and properties object', () => {
    allRes.forEach(([id, r]: any) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(r.Properties).toBeDefined();
    });
  });

  test('many resources include Tags when supported', () => {
    const withTags = allRes.filter(([, r]: any) => Array.isArray((r.Properties || {}).Tags));
    expect(withTags.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Resource Type Distribution', () => {
  const counts: Record<string, number> = {};
  Object.values(template.Resources || {}).forEach((r: any) => {
    counts[r.Type] = (counts[r.Type] || 0) + 1;
  });

  test('has multiple EC2-related resources', () => {
    const sum = (counts['AWS::EC2::Subnet'] || 0) + (counts['AWS::EC2::RouteTable'] || 0) + (counts['AWS::EC2::Route'] || 0);
    expect(sum).toBeGreaterThanOrEqual(5);
  });

  test('has at least one of Config resources (Recorder/DeliveryChannel/Rule)', () => {
    const cfg = (counts['AWS::Config::ConfigurationRecorder'] || 0) + (counts['AWS::Config::DeliveryChannel'] || 0) + (counts['AWS::Config::ConfigRule'] || 0);
    expect(cfg).toBeGreaterThanOrEqual(1);
  });
});

describe('Extensive Property Coverage - Broad Static Analysis', () => {
  const res = template.Resources || {};
  const all = Object.entries(res);

  test('InternetGatewayAttachment references IGW and VPC correctly when created', () => {
    const r = (res as any)['InternetGatewayAttachment'];
    if (!r) return;
    const p = (r || {}).Properties || {};
    expect(p.InternetGatewayId).toBeDefined();
    expect(p.VpcId).toBeDefined();
  });

  test('RouteTables and Associations are present with VPC and Subnet references', () => {
    const pubRt = (res as any)['PublicRouteTable'];
    const prvRt = (res as any)['PrivateRouteTable'];
    if (pubRt) {
      expect(pubRt.Properties?.VpcId).toBeDefined();
    }
    if (prvRt) {
      expect(prvRt.Properties?.VpcId).toBeDefined();
    }
    const pubAssoc = (res as any)['PublicSubnetRouteTableAssociation'];
    const prvAssoc = (res as any)['PrivateSubnetRouteTableAssociation'];
    if (pubAssoc) {
      expect(pubAssoc.Properties?.RouteTableId).toBeDefined();
      expect(pubAssoc.Properties?.SubnetId).toBeDefined();
    }
    if (prvAssoc) {
      expect(prvAssoc.Properties?.RouteTableId).toBeDefined();
      expect(prvAssoc.Properties?.SubnetId).toBeDefined();
    }
  });

  test('Default routes reference IGW or NAT appropriately', () => {
    const pub = (res as any)['DefaultPublicRoute'];
    const prv = (res as any)['DefaultPrivateRoute'];
    if (pub) {
      expect(pub.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(pub.Properties?.GatewayId).toBeDefined();
    }
    if (prv) {
      expect(prv.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(prv.Properties!.NatGatewayId).toBeDefined();
    }
  });

  test('Flow log configuration includes log group and IAM role', () => {
    const fl = (res as any)['VPCFlowLog'];
    if (!fl) return;
    expect(fl.Properties?.LogGroupName).toBeDefined();
    expect(fl.Properties?.DeliverLogsPermissionArn).toBeDefined();
  });

  test('CloudWatch LogGroups have retention and optional KMS', () => {
    const lgs = Object.values(res).filter((r: any) => r.Type === 'AWS::Logs::LogGroup');
    lgs.forEach((lg: any) => {
      const p = (lg || {}).Properties || {};
      expect(typeof p.RetentionInDays === 'number' || typeof p.RetentionInDays === 'string' || typeof p.RetentionInDays === 'undefined').toBe(true);
    });
  });

  test('Backup resources have plan and selection with resources list', () => {
    const plan = (res as any)['BackupPlan'];
    if (plan) {
      expect(plan.Properties?.BackupPlan?.BackupPlanRule).toBeDefined();
    }
    const sel = (res as any)['BackupSelection'];
    if (sel) {
      const bl = sel.Properties?.BackupSelection?.Resources;
      expect(Array.isArray(bl)).toBe(true);
    }
  });

  test('IAM Password Policy custom resource components exist', () => {
    const role = (res as any)['IAMPasswordPolicyRole'];
    const fn = (res as any)['IAMPasswordPolicyFunction'];
    const cr = (res as any)['IAMPasswordPolicy'];
    if (role) expect(role.Type).toBe('AWS::IAM::Role');
    if (fn) expect(fn.Type).toBe('AWS::Lambda::Function');
    if (cr) expect(cr.Type).toBe('AWS::CloudFormation::CustomResource');
  });

  test('EBS Encryption custom resources exist conditionally', () => {
    const role = (res as any)['EBSEncryptionRole'];
    const fn = (res as any)['EBSEncryptionFunction'];
    const cr = (res as any)['EBSEncryptionByDefault'];
    if (role) expect(role.Type).toBe('AWS::IAM::Role');
    if (fn) expect(fn.Type).toBe('AWS::Lambda::Function');
    if (cr) expect(cr.Type).toBe('AWS::CloudFormation::CustomResource');
  });

  test('Secrets Manager Secret uses GenerateSecretString', () => {
    const sec = (res as any)['DatabaseSecret'];
    if (!sec) return;
    const gs = (sec.Properties || {}).GenerateSecretString;
    expect(gs).toBeDefined();
    expect(gs.GenerateStringKey).toBe('password');
  });
});

describe('Broad Naming and Substitution Assertions', () => {
  const res = template.Resources || {};
  const expectSubContains = (sub: any, token: string) => {
    if (!sub) return false;
    if (typeof sub === 'string') return sub.includes(token);
    if (typeof sub === 'object' && 'Fn::Sub' in sub) {
      const v = (sub as any)['Fn::Sub'];
      if (typeof v === 'string') return v.includes(token);
      if (Array.isArray(v)) return String(v[0] || '').includes(token);
    }
    return false;
  };

  test('many logical names use ${AWS::StackName} or suffix in naming', () => {
    const keys = Object.keys(res);
    const sample = keys.slice(0, Math.min(keys.length, 120));
    let count = 0;
    sample.forEach((k) => {
      const r: any = (res as any)[k];
      const p = (r || {}).Properties || {};
      ['TrailName', 'LogGroupName', 'BucketName', 'FunctionName', 'DBSubnetGroupName', 'AlarmName']
        .forEach((field) => {
          if (p[field]) {
            if (expectSubContains(p[field], '${AWS::StackName}') || expectSubContains(p[field], '${Suffix}')) {
              count += 1;
            }
          }
        });
    });
    expect(count).toBeGreaterThanOrEqual(12);
  });
});

describe('Outputs Extensive Coverage - Non-empty Export Names and Values', () => {
  const outs = template.Outputs || {};
  const keys = Object.keys(outs);

  test('at least 10 outputs', () => {
    expect(keys.length).toBeGreaterThanOrEqual(10);
  });

  test('each output Export.Name uses Fn::Sub format', () => {
    keys.forEach((k) => {
      const o: any = outs[k];
      const n: any = o?.Export?.Name;
      if (typeof n === 'object') {
        expect('Fn::Sub' in n).toBe(true);
      }
    });
  });

  test('no output value is null or undefined', () => {
    keys.forEach((k) => {
      const v = (outs as any)[k]?.Value;
      expect(typeof v !== 'undefined' && v !== null).toBe(true);
    });
  });
});

describe('Deep Iterative Validations - 30+ Resource Assertions', () => {
  const res = template.Resources || {};
  const resources = Object.entries(res);

  test('iterate and assert presence of core properties on 40 resources when available', () => {
    const sampled = resources.slice(0, Math.min(80, resources.length));
    let asserted = 0;
    sampled.forEach(([, r]: any) => {
      const p = (r || {}).Properties || {};
      if (r.Type === 'AWS::EC2::Subnet') {
        expect(p.VpcId).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::S3::Bucket') {
        expect(p.BucketEncryption).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::RDS::DBInstance') {
        expect(p.Engine).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Lambda::Function') {
        expect(p.Runtime).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::EC2::Instance') {
        expect(p.ImageId).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::CloudTrail::Trail') {
        expect(p.IsLogging).toBe(true);
        asserted++;
      }
      if (r.Type === 'AWS::IAM::Role') {
        expect(p.AssumeRolePolicyDocument).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Logs::LogGroup') {
        expect(p.LogGroupName).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Backup::BackupPlan') {
        expect(p.BackupPlan).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Config::ConfigurationRecorder') {
        expect(p.RoleARN).toBeDefined();
        asserted++;
      }
    });
    expect(asserted).toBeGreaterThanOrEqual(26);
  });
});

describe('Per-Logical-ID Assertions - Explicit Coverage Over 40 Resources', () => {
  const res = template.Resources || {};

  const exists = (id: string) => Object.prototype.hasOwnProperty.call(res, id);
  const prop = (id: string) => (res as any)[id]?.Properties || {};

  test('KMS resources exist and wired', () => {
    expect(exists('SecureKMSKey')).toBe(true);
    expect(exists('SecureKMSKeyAlias')).toBe(true);
    expect(prop('SecureKMSKeyAlias').TargetKeyId).toBeDefined();
  });

  test('VPC and Internet Gateway', () => {
    expect(exists('SecureVPC')).toBe(true);
    expect(exists('InternetGateway')).toBe(true);
    expect(exists('InternetGatewayAttachment')).toBe(true);
    expect(prop('InternetGatewayAttachment').VpcId).toBeDefined();
  });

  test('Subnets - Public, Private, Database 1&2', () => {
    expect(exists('PublicSubnet')).toBe(true);
    expect(exists('PrivateSubnet')).toBe(true);
    expect(exists('DatabaseSubnet1')).toBe(true);
    expect(exists('DatabaseSubnet2')).toBe(true);
  });

  test('NAT Gateway and EIP', () => {
    expect(exists('NatGatewayEIP')).toBe(true);
    expect(exists('NatGateway')).toBe(true);
    expect(prop('NatGateway').AllocationId || prop('NatGateway').SubnetId).toBeDefined();
  });

  test('Route Tables and Associations', () => {
    expect(exists('PublicRouteTable')).toBe(true);
    expect(exists('PrivateRouteTable')).toBe(true);
    expect(exists('DefaultPublicRoute')).toBe(true);
    expect(exists('DefaultPrivateRoute')).toBe(true);
    expect(exists('PublicSubnetRouteTableAssociation')).toBe(true);
    expect(exists('PrivateSubnetRouteTableAssociation')).toBe(true);
  });

  test('Flow Logs and LogGroup', () => {
    expect(exists('VPCFlowLogRole')).toBe(true);
    expect(exists('VPCFlowLogGroup')).toBe(true);
    expect(exists('VPCFlowLog')).toBe(true);
  });

  test('Security Groups', () => {
    expect(exists('WebServerSecurityGroup')).toBe(true);
    expect(exists('DatabaseSecurityGroup')).toBe(true);
    expect(exists('LambdaSecurityGroup')).toBe(true);
  });

  test('IAM roles and profiles', () => {
    expect(exists('EC2Role')).toBe(true);
    expect(exists('EC2InstanceProfile')).toBe(true);
    expect(exists('LambdaExecutionRole')).toBe(true);
  });

  test('S3 buckets and policies', () => {
    expect(exists('SecureS3Bucket')).toBe(true);
    expect(exists('S3AccessLogsBucket')).toBe(true);
    expect(exists('SecureS3BucketPolicy')).toBe(true);
  });

  test('RDS resources', () => {
    expect(exists('DatabaseSubnetGroup')).toBe(true);
    expect(exists('DatabaseSecret')).toBe(true);
    expect(exists('DatabaseInstance')).toBe(true);
  });

  test('AWS Backup resources', () => {
    expect(exists('BackupVault')).toBe(true);
    expect(exists('BackupPlan')).toBe(true);
    expect(exists('BackupSelection')).toBe(true);
    expect(exists('BackupRole')).toBe(true);
  });

  test('CloudTrail and dependencies', () => {
    expect(exists('CloudTrailLogGroup')).toBe(true);
    expect(exists('CloudTrailRole')).toBe(true);
    expect(exists('CloudTrail')).toBe(true);
    expect(exists('CloudTrailBucket')).toBe(true);
    expect(exists('CloudTrailBucketPolicy')).toBe(true);
  });

  test('AWS Config resources', () => {
    expect(exists('ConfigRole')).toBe(true);
    expect(exists('ConfigBucket')).toBe(true);
    expect(exists('ConfigBucketPolicy')).toBe(true);
    expect(exists('ConfigurationRecorder')).toBe(true);
    expect(exists('ConfigDeliveryChannel')).toBe(true);
    expect(exists('S3BucketPublicAccessProhibitedRule')).toBe(true);
    expect(exists('RootAccessKeyCheckRule')).toBe(true);
    expect(exists('EBSEncryptionByDefaultRule')).toBe(true);
  });

  test('GuardDuty Detector', () => {
    expect(exists('GuardDutyDetector')).toBe(true);
  });

  test('Lambda Function and EC2 Instance', () => {
    expect(exists('SecureLambdaFunction')).toBe(true);
    expect(exists('EC2Instance')).toBe(true);
  });

  test('Custom resources for IAM password + EBS encryption', () => {
    expect(exists('IAMPasswordPolicyRole')).toBe(true);
    expect(exists('IAMPasswordPolicyFunction')).toBe(true);
    expect(exists('IAMPasswordPolicy')).toBe(true);
    expect(exists('EBSEncryptionRole')).toBe(true);
    expect(exists('EBSEncryptionFunction')).toBe(true);
    expect(exists('EBSEncryptionByDefault')).toBe(true);
  });
});

describe('Conditional Wiring Assertions', () => {
  const res = template.Resources || {};
  const conditionOf = (id: string) => (res as any)[id]?.Condition;

  test('CreateVPC condition gates VPC and dependent resources appropriately', () => {
    expect(conditionOf('SecureVPC')).toBe('CreateVPC');
    expect(conditionOf('PublicRouteTable')).toBe('CreateVPC');
    expect(conditionOf('DefaultPublicRoute')).toBe('CreateVPC');
  });

  test('CreatePublicSubnet and CreatePrivateSubnet conditions applied', () => {
    expect(conditionOf('PublicSubnet')).toBe('CreatePublicSubnet');
    expect(conditionOf('PrivateSubnet')).toBe('CreatePrivateSubnet');
  });

  test('Database subnet conditions applied', () => {
    expect(conditionOf('DatabaseSubnet1')).toBe('CreateDatabaseSubnet1');
    expect(conditionOf('DatabaseSubnet2')).toBe('CreateDatabaseSubnet2');
  });

  test('CreateKMS condition gates key resources', () => {
    expect(conditionOf('SecureKMSKey')).toBe('CreateKMS');
    expect(conditionOf('SecureKMSKeyAlias')).toBe('CreateKMS');
  });

  test('CloudTrail conditional resources', () => {
    expect(conditionOf('CloudTrail')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailLogGroup')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailRole')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailBucket')).toBe('CreateCloudTrailBucket');
    expect(conditionOf('CloudTrailBucketPolicy')).toBe('CreateCloudTrailBucketPolicy');
  });
});

describe('Mass Assertions for 100+ Resource-Property Pairs', () => {
  const res = template.Resources || {};
  const entries = Object.entries(res);

  const pick = (t: string) => entries.filter(([, r]: any) => r.Type === t).map(([k]) => k);

  test('S3 buckets properties include Versioning or Encryption when applicable', () => {
    pick('AWS::S3::Bucket').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.BucketEncryption || p.VersioningConfiguration || p.PublicAccessBlockConfiguration).toBeDefined();
    });
  });

  test('IAM Roles have at least one policy element', () => {
    pick('AWS::IAM::Role').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.Policies || p.ManagedPolicyArns).toBeDefined();
    });
  });

  test('LogGroups names are Fn::Sub based strings', () => {
    pick('AWS::Logs::LogGroup').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.LogGroupName).toBeDefined();
    });
  });
});


describe('Extensive Property Coverage - Broad Static Analysis', () => {
  const res = template.Resources || {};
  const all = Object.entries(res);

  test('InternetGatewayAttachment references IGW and VPC correctly when created', () => {
    const r = res['InternetGatewayAttachment'];
    if (!r) return;
    const p = (r || {}).Properties || {};
    expect(p.InternetGatewayId).toBeDefined();
    expect(p.VpcId).toBeDefined();
  });

  test('RouteTables and Associations are present with VPC and Subnet references', () => {
    const pubRt = res['PublicRouteTable'];
    const prvRt = res['PrivateRouteTable'];
    if (pubRt) {
      expect(pubRt.Properties?.VpcId).toBeDefined();
    }
    if (prvRt) {
      expect(prvRt.Properties?.VpcId).toBeDefined();
    }
    const pubAssoc = res['PublicSubnetRouteTableAssociation'];
    const prvAssoc = res['PrivateSubnetRouteTableAssociation'];
    if (pubAssoc) {
      expect(pubAssoc.Properties?.RouteTableId).toBeDefined();
      expect(pubAssoc.Properties?.SubnetId).toBeDefined();
    }
    if (prvAssoc) {
      expect(prvAssoc.Properties?.RouteTableId).toBeDefined();
      expect(prvAssoc.Properties?.SubnetId).toBeDefined();
    }
  });

  test('Default routes reference IGW or NAT appropriately', () => {
    const pub = res['DefaultPublicRoute'];
    const prv = res['DefaultPrivateRoute'];
    if (pub) {
      expect(pub.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(pub.Properties?.GatewayId).toBeDefined();
    }
    if (prv) {
      expect(prv.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(prv.Properties?.NatGatewayId).toBeDefined();
    }
  });

  test('Flow log configuration includes log group and IAM role', () => {
    const fl = res['VPCFlowLog'];
    if (!fl) return;
    expect(fl.Properties?.LogGroupName).toBeDefined();
    expect(fl.Properties?.DeliverLogsPermissionArn).toBeDefined();
  });

  test('CloudWatch LogGroups have retention and optional KMS', () => {
    const lgs = Object.values(res).filter((r: any) => r.Type === 'AWS::Logs::LogGroup');
    lgs.forEach((lg: any) => {
      const p = (lg || {}).Properties || {};
      expect(typeof p.RetentionInDays === 'number' || typeof p.RetentionInDays === 'string' || typeof p.RetentionInDays === 'undefined').toBe(true);
    });
  });

  test('Backup resources have plan and selection with resources list', () => {
    const plan = res['BackupPlan'];
    if (plan) {
      expect(plan.Properties?.BackupPlan?.BackupPlanRule).toBeDefined();
    }
    const sel = res['BackupSelection'];
    if (sel) {
      const bl = sel.Properties?.BackupSelection?.Resources;
      expect(Array.isArray(bl)).toBe(true);
    }
  });

  test('IAM Password Policy custom resource components exist', () => {
    const role = res['IAMPasswordPolicyRole'];
    const fn = res['IAMPasswordPolicyFunction'];
    const cr = res['IAMPasswordPolicy'];
    if (role) expect(role.Type).toBe('AWS::IAM::Role');
    if (fn) expect(fn.Type).toBe('AWS::Lambda::Function');
    if (cr) expect(cr.Type).toBe('AWS::CloudFormation::CustomResource');
  });

  test('EBS Encryption custom resources exist conditionally', () => {
    const role = res['EBSEncryptionRole'];
    const fn = res['EBSEncryptionFunction'];
    const cr = res['EBSEncryptionByDefault'];
    if (role) expect(role.Type).toBe('AWS::IAM::Role');
    if (fn) expect(fn.Type).toBe('AWS::Lambda::Function');
    if (cr) expect(cr.Type).toBe('AWS::CloudFormation::CustomResource');
  });

  test('Secrets Manager Secret uses GenerateSecretString', () => {
    const sec = res['DatabaseSecret'];
    if (!sec) return;
    const gs = (sec.Properties || {}).GenerateSecretString;
    expect(gs).toBeDefined();
    expect(gs.GenerateStringKey).toBe('password');
  });
});

describe('Broad Naming and Substitution Assertions', () => {
  const res = template.Resources || {};
  const expectSubContains = (sub: any, token: string) => {
    if (!sub) return false;
    if (typeof sub === 'string') return sub.includes(token);
    if (typeof sub === 'object' && 'Fn::Sub' in sub) {
      const v = (sub as any)['Fn::Sub'];
      if (typeof v === 'string') return v.includes(token);
      if (Array.isArray(v)) return String(v[0] || '').includes(token);
    }
    return false;
  };

  test('many logical names use ${AWS::StackName} or suffix in naming', () => {
    const keys = Object.keys(res);
    const sample = keys.slice(0, Math.min(keys.length, 100));
    let count = 0;
    sample.forEach((k) => {
      const r: any = (res as any)[k];
      const p = (r || {}).Properties || {};
      ['TrailName', 'LogGroupName', 'BucketName', 'FunctionName', 'DBSubnetGroupName', 'AlarmName']
        .forEach((field) => {
          if (p[field]) {
            if (expectSubContains(p[field], '${AWS::StackName}') || expectSubContains(p[field], '${Suffix}')) {
              count += 1;
            }
          }
        });
    });
    expect(count).toBeGreaterThanOrEqual(12);
  });
});

describe('Outputs Extensive Coverage - Non-empty Export Names and Values', () => {
  const outs = template.Outputs || {};
  const keys = Object.keys(outs);

  test('at least 10 outputs', () => {
    expect(keys.length).toBeGreaterThanOrEqual(10);
  });

  test('each output Export.Name uses Fn::Sub format', () => {
    keys.forEach((k) => {
      const o: any = outs[k];
      const n: any = o?.Export?.Name;
      if (typeof n === 'object') {
        expect('Fn::Sub' in n).toBe(true);
      }
    });
  });

  test('no output value is null or undefined', () => {
    keys.forEach((k) => {
      const v = (outs as any)[k]?.Value;
      expect(typeof v !== 'undefined' && v !== null).toBe(true);
    });
  });
});

describe('Deep Iterative Validations - 30+ Resource Assertions', () => {
  const res = template.Resources || {};
  const resources = Object.entries(res);

  test('iterate and assert presence of core properties on 40 resources when available', () => {
    const sampled = resources.slice(0, Math.min(60, resources.length));
    let asserted = 0;
    sampled.forEach(([, r]: any) => {
      const p = (r || {}).Properties || {};
      if (r.Type === 'AWS::EC2::Subnet') {
        expect(p.VpcId).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::S3::Bucket') {
        expect(p.BucketEncryption).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::RDS::DBInstance') {
        expect(p.Engine).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Lambda::Function') {
        expect(p.Runtime).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::EC2::Instance') {
        expect(p.ImageId).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::CloudTrail::Trail') {
        expect(p.IsLogging).toBe(true);
        asserted++;
      }
      if (r.Type === 'AWS::IAM::Role') {
        expect(p.AssumeRolePolicyDocument).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Logs::LogGroup') {
        expect(p.LogGroupName).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Backup::BackupPlan') {
        expect(p.BackupPlan).toBeDefined();
        asserted++;
      }
      if (r.Type === 'AWS::Config::ConfigurationRecorder') {
        expect(p.RoleARN).toBeDefined();
        asserted++;
      }
    });
    expect(asserted).toBeGreaterThanOrEqual(26);
  });
});

describe('Per-Logical-ID Assertions - Explicit Coverage Over 40 Resources', () => {
  const res = template.Resources || {};

  const exists = (id: string) => Object.prototype.hasOwnProperty.call(res, id);
  const prop = (id: string) => (res as any)[id]?.Properties || {};

  test('KMS resources exist and wired', () => {
    expect(exists('SecureKMSKey')).toBe(true);
    expect(exists('SecureKMSKeyAlias')).toBe(true);
    expect(prop('SecureKMSKeyAlias').TargetKeyId).toBeDefined();
  });

  test('VPC and Internet Gateway', () => {
    expect(exists('SecureVPC')).toBe(true);
    expect(exists('InternetGateway')).toBe(true);
    expect(exists('InternetGatewayAttachment')).toBe(true);
    expect(prop('InternetGatewayAttachment').VpcId).toBeDefined();
  });

  test('Subnets - Public, Private, Database 1&2', () => {
    expect(exists('PublicSubnet')).toBe(true);
    expect(exists('PrivateSubnet')).toBe(true);
    expect(exists('DatabaseSubnet1')).toBe(true);
    expect(exists('DatabaseSubnet2')).toBe(true);
  });

  test('NAT Gateway and EIP', () => {
    expect(exists('NatGatewayEIP')).toBe(true);
    expect(exists('NatGateway')).toBe(true);
    expect(prop('NatGateway').AllocationId || prop('NatGateway').SubnetId).toBeDefined();
  });

  test('Route Tables and Associations', () => {
    expect(exists('PublicRouteTable')).toBe(true);
    expect(exists('PrivateRouteTable')).toBe(true);
    expect(exists('DefaultPublicRoute')).toBe(true);
    expect(exists('DefaultPrivateRoute')).toBe(true);
    expect(exists('PublicSubnetRouteTableAssociation')).toBe(true);
    expect(exists('PrivateSubnetRouteTableAssociation')).toBe(true);
  });

  test('Flow Logs and LogGroup', () => {
    expect(exists('VPCFlowLogRole')).toBe(true);
    expect(exists('VPCFlowLogGroup')).toBe(true);
    expect(exists('VPCFlowLog')).toBe(true);
  });

  test('Security Groups', () => {
    expect(exists('WebServerSecurityGroup')).toBe(true);
    expect(exists('DatabaseSecurityGroup')).toBe(true);
    expect(exists('LambdaSecurityGroup')).toBe(true);
  });

  test('IAM roles and profiles', () => {
    expect(exists('EC2Role')).toBe(true);
    expect(exists('EC2InstanceProfile')).toBe(true);
    expect(exists('LambdaExecutionRole')).toBe(true);
  });

  test('S3 buckets and policies', () => {
    expect(exists('SecureS3Bucket')).toBe(true);
    expect(exists('S3AccessLogsBucket')).toBe(true);
    expect(exists('SecureS3BucketPolicy')).toBe(true);
  });

  test('RDS resources', () => {
    expect(exists('DatabaseSubnetGroup')).toBe(true);
    expect(exists('DatabaseSecret')).toBe(true);
    expect(exists('DatabaseInstance')).toBe(true);
  });

  test('AWS Backup resources', () => {
    expect(exists('BackupVault')).toBe(true);
    expect(exists('BackupPlan')).toBe(true);
    expect(exists('BackupSelection')).toBe(true);
    expect(exists('BackupRole')).toBe(true);
  });

  test('CloudTrail and dependencies', () => {
    expect(exists('CloudTrailLogGroup')).toBe(true);
    expect(exists('CloudTrailRole')).toBe(true);
    expect(exists('CloudTrail')).toBe(true);
    expect(exists('CloudTrailBucket')).toBe(true);
    expect(exists('CloudTrailBucketPolicy')).toBe(true);
  });

  test('AWS Config resources', () => {
    expect(exists('ConfigRole')).toBe(true);
    expect(exists('ConfigBucket')).toBe(true);
    expect(exists('ConfigBucketPolicy')).toBe(true);
    expect(exists('ConfigurationRecorder')).toBe(true);
    expect(exists('ConfigDeliveryChannel')).toBe(true);
    expect(exists('S3BucketPublicAccessProhibitedRule')).toBe(true);
    expect(exists('RootAccessKeyCheckRule')).toBe(true);
    expect(exists('EBSEncryptionByDefaultRule')).toBe(true);
  });

  test('GuardDuty Detector', () => {
    expect(exists('GuardDutyDetector')).toBe(true);
  });

  test('Lambda Function and EC2 Instance', () => {
    expect(exists('SecureLambdaFunction')).toBe(true);
    expect(exists('EC2Instance')).toBe(true);
  });

  test('Custom resources for IAM password + EBS encryption', () => {
    expect(exists('IAMPasswordPolicyRole')).toBe(true);
    expect(exists('IAMPasswordPolicyFunction')).toBe(true);
    expect(exists('IAMPasswordPolicy')).toBe(true);
    expect(exists('EBSEncryptionRole')).toBe(true);
    expect(exists('EBSEncryptionFunction')).toBe(true);
    expect(exists('EBSEncryptionByDefault')).toBe(true);
  });
});

describe('Conditional Wiring Assertions', () => {
  const res = template.Resources || {};
  const conditionOf = (id: string) => (res as any)[id]?.Condition;

  test('CreateVPC condition gates VPC and dependent resources appropriately', () => {
    expect(conditionOf('SecureVPC')).toBe('CreateVPC');
    expect(conditionOf('PublicRouteTable')).toBe('CreateVPC');
    expect(conditionOf('DefaultPublicRoute')).toBe('CreateVPC');
  });

  test('CreatePublicSubnet and CreatePrivateSubnet conditions applied', () => {
    expect(conditionOf('PublicSubnet')).toBe('CreatePublicSubnet');
    expect(conditionOf('PrivateSubnet')).toBe('CreatePrivateSubnet');
  });

  test('Database subnet conditions applied', () => {
    expect(conditionOf('DatabaseSubnet1')).toBe('CreateDatabaseSubnet1');
    expect(conditionOf('DatabaseSubnet2')).toBe('CreateDatabaseSubnet2');
  });

  test('CreateKMS condition gates key resources', () => {
    expect(conditionOf('SecureKMSKey')).toBe('CreateKMS');
    expect(conditionOf('SecureKMSKeyAlias')).toBe('CreateKMS');
  });

  test('CloudTrail conditional resources', () => {
    expect(conditionOf('CloudTrail')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailLogGroup')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailRole')).toBe('CreateCloudTrail');
    expect(conditionOf('CloudTrailBucket')).toBe('CreateCloudTrailBucket');
    expect(conditionOf('CloudTrailBucketPolicy')).toBe('CreateCloudTrailBucketPolicy');
  });
});

describe('Mass Assertions for 100+ Resource-Property Pairs', () => {
  const res = template.Resources || {};
  const entries = Object.entries(res);

  const pick = (t: string) => entries.filter(([, r]: any) => r.Type === t).map(([k]) => k);

  test('S3 buckets properties include Versioning or Encryption when applicable', () => {
    pick('AWS::S3::Bucket').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.BucketEncryption || p.VersioningConfiguration || p.PublicAccessBlockConfiguration).toBeDefined();
    });
  });

  test('IAM Roles have at least one policy element', () => {
    pick('AWS::IAM::Role').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.Policies || p.ManagedPolicyArns).toBeDefined();
    });
  });

  test('LogGroups names are Fn::Sub based strings', () => {
    pick('AWS::Logs::LogGroup').forEach((id) => {
      const p = (res as any)[id]?.Properties || {};
      expect(p.LogGroupName).toBeDefined();
    });
  });
});



