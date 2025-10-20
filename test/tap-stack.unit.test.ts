import * as fs from 'fs';
import * as path from 'path';

type CFAny = Record<string, any>;

type CFDoc = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const baseDir = __dirname; // this file is in ./test
const ymlPath = path.resolve(baseDir, '../lib/TapStack.yml');
const jsonPath = path.resolve(baseDir, '../lib/TapStack.json');

function loadJsonTemplate(): CFDoc {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Missing JSON template at ${jsonPath}. Ensure ../lib/TapStack.json exists.`);
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const doc = JSON.parse(raw) as CFDoc;
  if (!doc || typeof doc !== 'object') throw new Error('Invalid JSON template');
  if (!doc.Resources) throw new Error('Template missing Resources');
  return doc;
}

function mustGetResource(doc: CFDoc, logicalId: string) {
  const r = doc.Resources[logicalId];
  if (!r) throw new Error(`Missing resource ${logicalId}`);
  return r;
}

function resolveTagValue(doc: CFDoc, val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    // Handle simple Ref resolution using parameter defaults
    if (Object.prototype.hasOwnProperty.call(val, 'Ref')) {
      const refName = val.Ref;
      const p = doc.Parameters?.[refName];
      if (p && typeof p.Default !== 'undefined') return p.Default;
    }
    // Handle basic Fn::Sub of a single ${Param}
    if (Object.prototype.hasOwnProperty.call(val, 'Fn::Sub')) {
      const sub = val['Fn::Sub'];
      if (typeof sub === 'string') {
        const match = sub.match(/^\$\{([A-Za-z0-9]+)\}$/);
        if (match) {
          const p = doc.Parameters?.[match[1]];
          if (p && typeof p.Default !== 'undefined') return p.Default;
        }
        return sub;
      }
    }
  }
  return undefined;
}

function hasTag(tags: any[] | undefined, key: string, expect: string | undefined, doc: CFDoc): boolean {
  if (!Array.isArray(tags)) return false;
  const found = tags.find(t => t.Key === key);
  if (!found) return false;
  if (typeof expect === 'undefined') return true;
  const val = resolveTagValue(doc, found.Value);
  return val === expect;
}

function hasIntrinsic(obj: any, name: string): boolean {
  return obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, name);
}

describe('TapStack CloudFormation template', () => {
  let doc: CFDoc;

  beforeAll(() => {
    // YAML presence check (we validate JSON to avoid parsing custom YAML tags)
    expect(fs.existsSync(ymlPath)).toBe(true);
    doc = loadJsonTemplate();
  });

  test('01 - Template has required top-level sections', () => {
    expect(doc.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(typeof doc.Description).toBe('string');
    expect(doc.Parameters).toBeTruthy();
    expect(doc.Resources).toBeTruthy();
    expect(doc.Outputs).toBeTruthy();
  });

  test('02 - Parameters initialized with safe defaults (no interactive prompts)', () => {
    const p = doc.Parameters!;
    expect(p).toBeTruthy();
    expect(p.KeyName).toBeTruthy();
    expect(p.KeyName.Default).toBe(''); // avoids change-set prompt
    expect(p.ProjectName.Default).toBe('tapstack');
    expect(p.Environment.Default).toBe('Production');
    expect(p.VpcCidr.Default).toBe('10.0.0.0/16');
    expect(p.PublicSubnet1Cidr.Default).toBe('10.0.0.0/24');
    expect(p.PrivateSubnet1Cidr.Default).toBe('10.0.10.0/24');
  });

  test('03 - Conditions include CreateSNSSubscription, IsPostgres, HasKeyPair', () => {
    const c = doc.Conditions!;
    expect(c).toBeTruthy();
    expect(Object.keys(c)).toEqual(
      expect.arrayContaining(['CreateSNSSubscription', 'IsPostgres', 'HasKeyPair'])
    );
  });

  test('04 - VPC and subnets exist across two AZs', () => {
    mustGetResource(doc, 'TapStackVPC');
    const pub1 = mustGetResource(doc, 'TapStackPublicSubnet1');
    const pub2 = mustGetResource(doc, 'TapStackPublicSubnet2');
    const az1 = pub1.Properties?.AvailabilityZone;
    const az2 = pub2.Properties?.AvailabilityZone;
    expect(typeof az1 === 'string' || hasIntrinsic(az1, 'Fn::Select')).toBe(true);
    expect(typeof az2 === 'string' || hasIntrinsic(az2, 'Fn::Select')).toBe(true);
  });

  test('05 - Internet Gateway, EIPs and two NAT Gateways configured', () => {
    mustGetResource(doc, 'TapStackInternetGateway');
    mustGetResource(doc, 'TapStackInternetGatewayAttachment');
    mustGetResource(doc, 'TapStackEIP1');
    mustGetResource(doc, 'TapStackEIP2');
    mustGetResource(doc, 'TapStackNATGateway1');
    mustGetResource(doc, 'TapStackNATGateway2');
  });

  test('06 - Route tables and default routes via IGW/NAT', () => {
    mustGetResource(doc, 'TapStackPublicRouteTable');
    mustGetResource(doc, 'TapStackPrivateRouteTable1');
    mustGetResource(doc, 'TapStackPrivateRouteTable2');

    const rPublic = mustGetResource(doc, 'TapStackPublicRoute');
    expect(rPublic.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(rPublic.Properties.GatewayId).toBeDefined();

    const rPriv1 = mustGetResource(doc, 'TapStackPrivateRoute1');
    const rPriv2 = mustGetResource(doc, 'TapStackPrivateRoute2');
    expect(rPriv1.Properties.NatGatewayId).toBeDefined();
    expect(rPriv2.Properties.NatGatewayId).toBeDefined();
  });

  test('07 - S3 buckets exist (app and logs) with KMS encryption and public access blocked', () => {
    const app = mustGetResource(doc, 'TapStackAppBucket');
    const logs = mustGetResource(doc, 'TapStackLogsBucket');
    for (const b of [app, logs]) {
      const enc = b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('aws:kms');
      expect(enc.KMSMasterKeyID).toBeTruthy();
      const pab = b.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    }
  });

  test('08 - App bucket logging targets logs bucket with prefix', () => {
    const app = mustGetResource(doc, 'TapStackAppBucket');
    expect(app.Properties.LoggingConfiguration).toBeTruthy();
    expect(app.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
    expect(app.Properties.LoggingConfiguration.LogFilePrefix).toBe('app-bucket-logs/');
  });

  test('09 - Bucket policies enforce TLS and appropriate principals', () => {
    const appPol = mustGetResource(doc, 'TapStackAppBucketPolicy');
    const logsPol = mustGetResource(doc, 'TapStackLogsBucketPolicy');

    const statementsApp = appPol.Properties.PolicyDocument.Statement;
    const tlsDeny = statementsApp.find((s: CFAny) => s.Sid === 'DenyNonTLSAccess');
    expect(tlsDeny).toBeTruthy();
    const denyNonAws = statementsApp.find((s: CFAny) => s.Sid === 'DenyNonAWSPrincipals');
    expect(denyNonAws).toBeTruthy();

    const statementsLogs = logsPol.Properties.PolicyDocument.Statement;
    const ctWrite = statementsLogs.find((s: CFAny) => s.Sid === 'AWSCloudTrailWrite');
    expect(ctWrite).toBeTruthy();
    expect(ctWrite.Principal?.Service).toBe('cloudtrail.amazonaws.com');
  });

  test('10 - Dedicated KMS keys and aliases for S3, RDS, CloudTrail, CloudWatch', () => {
    mustGetResource(doc, 'TapStackS3KMSKey');
    mustGetResource(doc, 'TapStackRDSKMSKey');
    mustGetResource(doc, 'TapStackCloudTrailKMSKey');
    mustGetResource(doc, 'TapStackCloudWatchKMSKey');
    mustGetResource(doc, 'TapStackS3KMSKeyAlias');
    mustGetResource(doc, 'TapStackRDSKMSKeyAlias');
    mustGetResource(doc, 'TapStackCloudTrailKMSKeyAlias');
    mustGetResource(doc, 'TapStackCloudWatchKMSKeyAlias');
  });

  test('11 - IAM roles use AmazonSSMManagedInstanceCore', () => {
    const appRole = mustGetResource(doc, 'TapStackAppEC2Role');
    const bastionRole = mustGetResource(doc, 'TapStackBastionEC2Role');
    const check = (r: CFAny) => {
      expect(r.Properties.ManagedPolicyArns).toEqual(
        expect.arrayContaining(['arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'])
      );
    };
    check(appRole);
    check(bastionRole);
  });

  test('12 - App EC2 policy is least-privileged to the specific app bucket and S3 KMS key', () => {
    const policy = mustGetResource(doc, 'TapStackAppEC2Policy');
    const stmts = policy.Properties.PolicyDocument.Statement;
    const s3Stmt = stmts.find((s: CFAny) => s.Sid === 'S3ReadAppBucket');
    expect(Array.isArray(s3Stmt.Resource)).toBe(true);
    expect(s3Stmt.Resource.length).toBeGreaterThanOrEqual(2);
    const kmsStmt = stmts.find((s: CFAny) => s.Sid === 'UseS3KmsKey');
    expect(kmsStmt.Resource).toBeDefined();
  });

  test('13 - Security groups exist with correct ingress (SSH from allowed CIDR to bastion; SSH from bastion to app)', () => {
    const bastionSG = mustGetResource(doc, 'TapStackBastionSecurityGroup');
    const ingress = bastionSG.Properties.SecurityGroupIngress[0];
    expect(ingress.FromPort).toBe(22);
    expect(ingress.ToPort).toBe(22);
    expect(ingress.CidrIp).toBeDefined();

    mustGetResource(doc, 'TapStackAppSecurityGroup');
    const appIngress = mustGetResource(doc, 'TapStackAppSecurityGroupIngressSSH');
    expect(appIngress.Properties.SourceSecurityGroupId).toBeDefined();
  });

  test('14 - RDS security group allows DB port from app SG using engine-aware condition', () => {
    const r = mustGetResource(doc, 'TapStackRDSSecurityGroupIngressDB');
    expect(r.Properties.FromPort).toBeDefined();
    expect(r.Properties.ToPort).toBeDefined();
    expect(hasIntrinsic(r.Properties.FromPort, 'Fn::If')).toBe(true);
    expect(hasIntrinsic(r.Properties.ToPort, 'Fn::If')).toBe(true);
  });

  test('15 - Secrets Manager used for DB password (dynamic reference)', () => {
    mustGetResource(doc, 'TapStackDBSecret');
    const rds = mustGetResource(doc, 'TapStackRDSInstance');
    const pwd = rds.Properties.MasterUserPassword;
    const asString = typeof pwd === 'string' ? pwd : JSON.stringify(pwd);
    expect(asString).toContain('resolve:secretsmanager');
  });

  test('16 - RDS instance is Multi-AZ, encrypted, private, protected, with backups', () => {
    const rds = mustGetResource(doc, 'TapStackRDSInstance');
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.PubliclyAccessible).toBe(false);
    expect(rds.Properties.StorageEncrypted).toBe(true);
    expect(rds.Properties.KmsKeyId).toBeDefined();
    expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    expect(rds.Properties.DeletionProtection).toBe(true);
  });

  test('17 - EC2 instances use the latest Amazon Linux AMI via SSM parameter', () => {
    const bastion = mustGetResource(doc, 'TapStackBastionHost');
    const app = mustGetResource(doc, 'TapStackAppInstance');
    const ids = [bastion.Properties.ImageId, app.Properties.ImageId].map(v => String(v));
    ids.forEach(s => expect(s).toContain('resolve:ssm:/aws/service/ami-amazon-linux-latest'));
  });

  test('18 - App instance resides in a private subnet and bastion in a public subnet', () => {
    const app = mustGetResource(doc, 'TapStackAppInstance');
    const bastion = mustGetResource(doc, 'TapStackBastionHost');
    expect(app.Properties.SubnetId).toEqual({ Ref: 'TapStackPrivateSubnet1' });
    expect(bastion.Properties.SubnetId).toEqual({ Ref: 'TapStackPublicSubnet1' });
  });

  test('19 - Optional KeyPair condition used (HasKeyPair) for EC2 instances', () => {
    const app = mustGetResource(doc, 'TapStackAppInstance');
    const bastion = mustGetResource(doc, 'TapStackBastionHost');
    expect(hasIntrinsic(app.Properties.KeyName, 'Fn::If')).toBe(true);
    expect(hasIntrinsic(bastion.Properties.KeyName, 'Fn::If')).toBe(true);
  });

  test('20 - CloudTrail configured with KMS and writing to logs bucket', () => {
    const trail = mustGetResource(doc, 'TapStackCloudTrail');
    expect(trail.Properties.IsLogging).toBe(true);
    expect(trail.Properties.EnableLogFileValidation).toBe(true);
    expect(trail.Properties.KMSKeyId).toBeDefined();
    expect(trail.Properties.S3BucketName).toBeDefined();
    expect(trail.Properties.S3KeyPrefix).toBe('cloudtrail/');
  });

  test('21 - CloudWatch alarms exist and target SNS topic', () => {
    const ec2Cpu = mustGetResource(doc, 'TapStackAppCPUAlarm');
    const ec2Status = mustGetResource(doc, 'TapStackAppStatusCheckAlarm');
    const rdsCpu = mustGetResource(doc, 'TapStackRDSCPUAlarm');
    const targets = (a: CFAny) => a.Properties.AlarmActions;
    [ec2Cpu, ec2Status, rdsCpu].forEach(a => {
      expect(targets(a)).toBeTruthy();
      expect(JSON.stringify(targets(a))).toContain('TapStackSNSTopic');
    });
  });

  test('22 - SNS topic exists and email subscription is conditional', () => {
    mustGetResource(doc, 'TapStackSNSTopic');
    const sub = mustGetResource(doc, 'TapStackSNSSubscription');
    expect(sub.Condition).toBe('CreateSNSSubscription');
  });

  test('23 - Outputs cover essential IDs/ARNs/endpoints', () => {
    const o = doc.Outputs!;
    const expected = [
      'VpcId','PublicSubnet1','PublicSubnet2','PrivateSubnet1','PrivateSubnet2',
      'BastionSecurityGroupId','AppSecurityGroupId','RDSSecurityGroupId',
      'AppBucketName','LogsBucketName','S3KMSKeyArn','RDSKMSKeyArn','CloudTrailKMSKeyArn','CloudWatchKMSKeyArn',
      'RDSEndpoint','RDSArn','BastionEIP','AppInstanceId','CloudTrailArn','SNSTopicArn'
    ];
    expected.forEach(k => expect(o[k]).toBeTruthy());
  });

  test('24 - Representative resources include Production and Project tags', () => {
    const vpc = mustGetResource(doc, 'TapStackVPC');
    const appBucket = mustGetResource(doc, 'TapStackAppBucket');
    const rds = mustGetResource(doc, 'TapStackRDSInstance');
    for (const r of [vpc, appBucket, rds]) {
      const tags = r.Properties.Tags;
      expect(hasTag(tags, 'Environment', 'Production', doc)).toBe(true);
      expect(hasTag(tags, 'Project', undefined, doc)).toBe(true);
    }
  });
});
