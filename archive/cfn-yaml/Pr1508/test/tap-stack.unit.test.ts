import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

type CfnTemplate = Record<string, any>;

// Custom CloudFormation schema for js-yaml to support intrinsic functions
const RefType = new (yaml as any).Type('!Ref', {
  kind: 'scalar',
  construct: (v: string) => ({ Ref: v }),
});
const SubScalarType = new (yaml as any).Type('!Sub', {
  kind: 'scalar',
  construct: (v: string) => ({ 'Fn::Sub': v }),
});
const SubSeqType = new (yaml as any).Type('!Sub', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::Sub': v }),
});
const GetAttScalarType = new (yaml as any).Type('!GetAtt', {
  kind: 'scalar',
  construct: (v: string) => {
    const parts = v.split('.');
    const resource = parts.shift();
    return { 'Fn::GetAtt': [resource, parts.join('.')] };
  },
});
const GetAttSeqType = new (yaml as any).Type('!GetAtt', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::GetAtt': v }),
});
const IfType = new (yaml as any).Type('!If', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::If': v }),
});
const EqualsType = new (yaml as any).Type('!Equals', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::Equals': v }),
});
const NotType = new (yaml as any).Type('!Not', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::Not': v }),
});
const AndType = new (yaml as any).Type('!And', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::And': v }),
});
const JoinType = new (yaml as any).Type('!Join', {
  kind: 'sequence',
  construct: (v: any[]) => ({ 'Fn::Join': v }),
});
const CFN_SCHEMA = (yaml as any).DEFAULT_SCHEMA.extend([
  RefType,
  SubScalarType,
  SubSeqType,
  GetAttScalarType,
  GetAttSeqType,
  IfType,
  EqualsType,
  NotType,
  AndType,
  JoinType,
]);

const loadTemplate = (): CfnTemplate => {
  const templatePath = path.join(__dirname, '../lib/TapStack.yml');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const tpl = yaml.load(templateContent, { schema: CFN_SCHEMA }) as CfnTemplate;
  return tpl;
};

describe('TapStack.yml - CloudFormation Template Quality', () => {
  let template: CfnTemplate;
  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {
    test('has correct format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain(
        'Enterprise-Grade Secure AWS Infrastructure Template'
      );
    });

    test('has required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('includes required parameters with correct types/defaults', () => {
      const p = template.Parameters;
      const requiredParams = [
        'Environment',
        'VpcId',
        'PrivateSubnetIds',
        'PublicSubnetIds',
        'UseExistingCloudTrailBucket',
        'UseExistingConfigBucket',
        'UseExistingKMSCloudTrailKey',
        'UseExistingKMSRDSKey',
        'UseExistingLambdaRole',
        'UseExistingRDSSubnetGroup',
        'UseExistingRDS',
        'AcmCertificateArn',
        'CreateConfigDeliveryChannel',
        'CreateCloudTrailTrail',
      ];
      requiredParams.forEach(name => expect(p[name]).toBeDefined());

      expect(p.Environment.Type).toBe('String');
      expect(p.Environment.Default).toBe('prod');
      expect(Array.isArray(p.Environment.AllowedValues)).toBe(true);

      expect(p.VpcId.Type).toBe('String');
      expect(p.PrivateSubnetIds.Type).toBe('CommaDelimitedList');
      expect(p.PublicSubnetIds.Type).toBe('CommaDelimitedList');
      expect(p.CreateConfigDeliveryChannel.Type).toBe('String');
      expect(p.CreateConfigDeliveryChannel.Default).toBe('false');
      expect(p.CreateCloudTrailTrail.Type).toBe('String');
      expect(p.CreateCloudTrailTrail.Default).toBe('false');

      [
        'UseExistingCloudTrailBucket',
        'UseExistingConfigBucket',
        'UseExistingKMSCloudTrailKey',
        'UseExistingKMSRDSKey',
        'UseExistingLambdaRole',
        'UseExistingRDSSubnetGroup',
        'UseExistingRDS',
        'AcmCertificateArn',
      ].forEach(name => {
        expect(p[name].Type).toBe('String');
        expect(p[name].Default).toBe('');
      });
    });
  });

  describe('Conditions', () => {
    test('base create-if-empty conditions use Fn::Equals and composite conditions are Fn::And/Not', () => {
      const c = template.Conditions as Record<string, any>;
      // Base conditions
      const base = [
        'CreateCloudTrailBucket',
        'CreateConfigBucket',
        'CreateKMSCloudTrailKey',
        'CreateKMSRDSKey',
        'CreateLambdaRole',
        'CreateRDSSubnetGroup',
      ];
      base.forEach(key => {
        expect(c[key]).toBeDefined();
        expect((c[key] as any)['Fn::Equals']).toBeDefined();
      });
      // Composite conditions
      [
        'CreateLambdaInVpc',
        'CreateRDSSubnetGroupAll',
        'CreateRDSInstanceAll',
        'CreateALBAll',
      ].forEach(key => {
        expect(c[key]).toBeDefined();
        const cond = c[key];
        expect(
          (cond['Fn::And'] && Array.isArray(cond['Fn::And'])) ||
            (cond['Fn::Not'] && Array.isArray(cond['Fn::Not']))
        ).toBe(true);
      });
    });
  });

  describe('Resources - Security and Config', () => {
    test('KMS keys and aliases have expected properties', () => {
      const r = template.Resources;
      expect(r.CloudTrailKMSKey.Type).toBe('AWS::KMS::Key');
      expect(r.RDSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(r.CloudTrailKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(r.RDSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(r.CloudTrailKMSKeyAlias.Properties.AliasName['Fn::Sub']).toContain(
        'alias/cloudtrail-'
      );
      expect(r.RDSKMSKeyAlias.Properties.AliasName['Fn::Sub']).toContain(
        'alias/rds-'
      );
    });

    test('CloudTrail bucket is encrypted, versioned, and locked down with required CloudTrail statements', () => {
      const b = template.Resources.CloudTrailLogsBucket;
      expect(b.Type).toBe('AWS::S3::Bucket');
      const enc =
        b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('aws:kms');
      expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
      const pab = b.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const bp =
        template.Resources.CloudTrailLogsBucketPolicy.Properties.PolicyDocument;
      const statements = bp.Statement;
      const hasAclCheck = statements.some(
        (s: any) =>
          s.Sid === 'AWSCloudTrailAclCheck' &&
          s.Principal?.Service === 'cloudtrail.amazonaws.com'
      );
      const hasWrite = statements.some(
        (s: any) =>
          s.Sid === 'AWSCloudTrailWrite' &&
          s.Principal?.Service === 'cloudtrail.amazonaws.com' &&
          s.Condition?.StringEquals?.['s3:x-amz-acl'] ===
            'bucket-owner-full-control'
      );
      expect(hasAclCheck && hasWrite).toBe(true);
    });

    test('Config bucket is encrypted, versioned, and locked down with required AWS Config statements', () => {
      const b = template.Resources.ConfigBucket;
      expect(b.Type).toBe('AWS::S3::Bucket');
      const enc =
        b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('AES256');
      expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
      const pab = b.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const bp =
        template.Resources.ConfigBucketPolicy.Properties.PolicyDocument;
      const statements = bp.Statement;
      const hasPermCheck = statements.some(
        (s: any) =>
          s.Sid === 'AWSConfigBucketPermissionsCheck' &&
          s.Principal?.Service === 'config.amazonaws.com'
      );
      const hasDelivery = statements.some(
        (s: any) =>
          s.Sid === 'AWSConfigBucketDelivery' &&
          s.Principal?.Service === 'config.amazonaws.com' &&
          s.Condition?.StringEquals?.['s3:x-amz-acl'] ===
            'bucket-owner-full-control'
      );
      expect(hasPermCheck && hasDelivery).toBe(true);
    });

    test('AWS Config recorder uses correct role and is created only when delivery channel is created', () => {
      const rec = template.Resources.ConfigurationRecorder;
      expect(rec.Condition).toBe('CreateDeliveryChannel');
      expect(rec.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(rec.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(
        true
      );
      expect(rec.Properties.RoleARN['Fn::GetAtt']).toBeDefined();
      const delivery = template.Resources.DeliveryChannel;
      expect(delivery.Condition).toBe('CreateDeliveryChannel');
    });

    test('RequiredTags config rule uses key parameters as mapping', () => {
      const rule = template.Resources.RequiredTagsRule;
      expect(rule.Properties.Source.SourceIdentifier).toBe('REQUIRED_TAGS');
      expect(rule.Properties.InputParameters.tag1Key).toBe('Environment');
      expect(rule.Properties.InputParameters.tag2Key).toBe('Purpose');
    });
  });

  describe('Resources - Compute and Database', () => {
    test('Lambda execution role does not include Deny in trust policy and has basic/vpc policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const stmts = role.Properties.AssumeRolePolicyDocument.Statement;
      const hasDeny = stmts.some((s: any) => s.Effect === 'Deny');
      expect(hasDeny).toBe(false);
      const policies: string[] = role.Properties.ManagedPolicyArns;
      expect(policies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('AWSLambdaBasicExecutionRole'),
          expect.stringContaining('AWSLambdaVPCAccessExecutionRole'),
        ])
      );
    });

    test('Lambda runs in VPC private subnets with restricted egress security group', () => {
      const fn = template.Resources.SecureLambdaFunction;
      expect(fn.Properties.VpcConfig.SubnetIds.Ref).toBe('PrivateSubnetIds');
      const sg = template.Resources.LambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      const has80 = egress.some(
        (e: any) =>
          e.FromPort === 80 && e.ToPort === 80 && e.CidrIp === '0.0.0.0/0'
      );
      const has443 = egress.some(
        (e: any) =>
          e.FromPort === 443 && e.ToPort === 443 && e.CidrIp === '0.0.0.0/0'
      );
      expect(has80 && has443).toBe(true);
    });

    test('RDS subnet group and security group are correctly configured', () => {
      const subnetGroup = template.Resources.RDSSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds.Ref).toBe('PrivateSubnetIds');
      const rdsSg = template.Resources.RDSSecurityGroup;
      const ingress = rdsSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId.Ref).toBe('LambdaSecurityGroup');
    });

    test('RDS instance is encrypted, private, and uses subnet group and SG', () => {
      const db = template.Resources.SecureRDSInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.DBSubnetGroupName).toBeDefined();
      expect(db.Properties.VPCSecurityGroups[0].Ref).toBe('RDSSecurityGroup');
      expect(db.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('Resources - Networking and Load Balancing', () => {
    test('ALB uses public subnets and has SG with HTTP/HTTPS ingress', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.Ref).toBe('PublicSubnetIds');
      const albSg = template.Resources.ALBSecurityGroup;
      const ing = albSg.Properties.SecurityGroupIngress;
      const has80 = ing.some(
        (e: any) =>
          e.FromPort === 80 && e.ToPort === 80 && e.CidrIp === '0.0.0.0/0'
      );
      const has443 = ing.some(
        (e: any) =>
          e.FromPort === 443 && e.ToPort === 443 && e.CidrIp === '0.0.0.0/0'
      );
      expect(has80 && has443).toBe(true);
    });

    test('HTTP listener redirects to HTTPS and HTTPS uses strong TLS policy and ACM cert param', () => {
      const http = template.Resources.HTTPListener;
      const action = http.Properties.DefaultActions[0];
      expect(action.Type).toBe('redirect');
      expect(action.RedirectConfig.Protocol).toBe('HTTPS');
      expect(String(action.RedirectConfig.Port)).toBe('443');

      const https = template.Resources.HTTPSListener;
      expect(https.Properties.SslPolicy).toContain('TLS13');
      const cert = https.Properties.Certificates[0];
      expect(cert.CertificateArn.Ref).toBe('AcmCertificateArn');
    });
  });

  describe('CloudTrail and Outputs', () => {
    test('CloudTrail uses KMS and multi-region with validation', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Condition).toBe('CreateCloudTrail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toBeDefined();
    });

    test('Outputs are exported and reference correct values (considering conditions)', () => {
      const o = template.Outputs;
      const expectExport = (name: string) => {
        expect(o[name]).toBeDefined();
        expect(o[name].Export).toBeDefined();
        expect(o[name].Export.Name['Fn::Sub']).toContain('${AWS::StackName}-');
      };

      expectExport('CloudTrailArn');
      expect(o.CloudTrailArn.Condition).toBe('CreateCloudTrail');
      expect(o.CloudTrailArn.Value['Fn::GetAtt']).toEqual([
        'CloudTrail',
        'Arn',
      ]);

      expectExport('ConfigBucketName');
      expect(o.ConfigBucketName.Value).toBeDefined();

      expectExport('LambdaFunctionArn');
      expect(o.LambdaFunctionArn.Condition).toBe('CreateLambdaInVpc');
      expect(o.LambdaFunctionArn.Value['Fn::GetAtt']).toEqual([
        'SecureLambdaFunction',
        'Arn',
      ]);

      expectExport('RDSInstanceEndpoint');
      expect(o.RDSInstanceEndpoint.Condition).toBe('CreateRDSInstanceAll');
      expect(o.RDSInstanceEndpoint.Value['Fn::GetAtt']).toEqual([
        'SecureRDSInstance',
        'Endpoint.Address',
      ]);

      expectExport('LoadBalancerDNS');
      expect(o.LoadBalancerDNS.Condition).toBe('CreateALBAll');
      expect(o.LoadBalancerDNS.Value['Fn::GetAtt']).toEqual([
        'ApplicationLoadBalancer',
        'DNSName',
      ]);
    });
  });

  describe('Tagging - required tags present where supported', () => {
    test('resources with Tags include Environment and Purpose', () => {
      const resources = template.Resources as Record<string, any>;
      Object.values(resources).forEach((res: any) => {
        const tags = res?.Properties?.Tags;
        if (Array.isArray(tags)) {
          const tagKeys = new Set(tags.map((t: any) => t.Key));
          expect(tagKeys.has('Environment')).toBe(true);
          expect(tagKeys.has('Purpose')).toBe(true);
        }
      });
    });
  });
});
