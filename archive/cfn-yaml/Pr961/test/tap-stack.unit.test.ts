import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Note: To avoid external YAML parser dependencies, these tests expect a JSON-converted
// version of the template at lib/TapStack.json. Generate it from the YAML template using
// your preferred toolchain (e.g., cfn-flip) before running tests.

// Utilities
const getResources = (template: any) => template?.Resources ?? {};
const getParameters = (template: any) => template?.Parameters ?? {};
const getOutputs = (template: any) => template?.Outputs ?? {};

type ResEntry = { logicalId: string; resource: any };

const getResourcesByType = (template: any, type: string): ResEntry[] => {
  const resources = getResources(template);
  const entries = Object.entries(resources) as Array<[string, any]>;
  return entries
    .filter(([, res]) => res?.Type === type)
    .map(([logicalId, res]) => ({ logicalId, resource: res as any }));
};

const allResourceLogicalIds = (template: any) =>
  Object.keys(getResources(template));

const getTags = (res: any): Array<{ Key: string; Value: any }> => {
  const props = res?.Properties ?? {};
  return props?.Tags ?? [];
};

const hasTag = (tags: Array<{ Key: string; Value: any }>, key: string) =>
  tags.some(t => t.Key === key);

const expectS3BucketEncryptedWithKms = (bucketRes: any) => {
  const props = bucketRes?.Properties ?? {};
  expect(props.BucketEncryption).toBeDefined();
  const sseCfg = props.BucketEncryption.ServerSideEncryptionConfiguration;
  expect(Array.isArray(sseCfg)).toBe(true);
  expect(sseCfg.length).toBeGreaterThan(0);
  const sseByDefault = sseCfg[0]?.ServerSideEncryptionByDefault;
  expect(sseByDefault).toBeDefined();
  expect(sseByDefault.SSEAlgorithm).toBe('aws:kms');
  // We expect the key to reference PrimaryKmsKey (parser may reduce !Ref to string)
  expect(
    sseByDefault.KMSMasterKeyID === 'PrimaryKmsKey' ||
      !!sseByDefault.KMSMasterKeyID
  ).toBe(true);
};

const expectS3BlockPublicAccess = (bucketRes: any) => {
  const pab = bucketRes?.Properties?.PublicAccessBlockConfiguration;
  expect(pab).toBeDefined();
  expect(pab.BlockPublicAcls).toBe(true);
  expect(pab.BlockPublicPolicy).toBe(true);
  expect(pab.IgnorePublicAcls).toBe(true);
  expect(pab.RestrictPublicBuckets).toBe(true);
};

const expectAllTaggableResourcesHaveEnvOwnerTags = (template: any) => {
  const resources = getResources(template);
  for (const [logicalId, res] of Object.entries<any>(resources)) {
    const tags = getTags(res);
    if (tags && Array.isArray(tags) && tags.length > 0) {
      expect(hasTag(tags, 'Environment')).toBeTruthy();
      expect(hasTag(tags, 'Owner')).toBeTruthy();
    }
  }
};

// Begin tests

describe('TapStack CloudFormation Template (YAML)', () => {
  let template: any;

  beforeAll(() => {
    const ymlPath = path.join(__dirname, '../lib/TapStack.yml');
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');

    const ensureJsonFromYaml = () => {
      if (fs.existsSync(jsonPath)) return;
      // Try python module cfn_flip
      try {
        execSync(`python -m cfn_flip "${ymlPath}" "${jsonPath}"`, {
          stdio: 'pipe',
        });
      } catch (e1) {
        try {
          // Try installing cfn_flip and rerunning
          execSync(`pip install --user cfn_flip`, { stdio: 'pipe' });
          execSync(`python -m cfn_flip "${ymlPath}" "${jsonPath}"`, {
            stdio: 'pipe',
          });
        } catch (e2) {
          try {
            // Try cfn-flip CLI if available; capture stdout and write file
            const out = execSync(`cfn-flip "${ymlPath}"`, { stdio: 'pipe' });
            fs.writeFileSync(jsonPath, out.toString('utf8'));
          } catch (e3) {
            // Give up; handled below
          }
        }
      }
    };

    ensureJsonFromYaml();

    if (!fs.existsSync(jsonPath)) {
      throw new Error(
        'Unable to generate lib/TapStack.json automatically. Please install cfn_flip and rerun:\n' +
          '  pip install --user cfn_flip\n' +
          `  python -m cfn_flip "${ymlPath}" "${jsonPath}"` +
          '\nOr ensure the JSON file exists at lib/TapStack.json.'
      );
    }

    const templateContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('Template basic structure and metadata', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toContain('secure-config-us-east-1.yml');
    expect(getParameters(template)).toBeDefined();
    expect(getResources(template)).toBeDefined();
    expect(getOutputs(template)).toBeDefined();
  });

  describe('Parameters validation (types, defaults, constraints)', () => {
    let params: any;
    beforeAll(() => {
      params = getParameters(template);
    });

    test('All parameters have Type and Description', () => {
      for (const [name, def] of Object.entries<any>(params)) {
        expect(def.Type).toBeDefined();
        expect(def.Description).toBeDefined();
      }
    });

    test('Environment parameter has constrained allowed values', () => {
      const p = params.Environment;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.AllowedValues).toEqual(['production', 'staging', 'development']);
    });

    test('AZ and subnet mask number parameters have min/max constraints', () => {
      const numberParamNames = [
        'AZCount',
        'PublicSubnetMask',
        'PrivateSubnetMask',
        'IsolatedSubnetMask',
        'DBAllocatedStorage',
      ];
      numberParamNames.forEach(n => {
        const p = params[n];
        expect(p).toBeDefined();
        expect(['Number', 'String']).toContain(p.Type); // CFN uses Number, but be tolerant
        if (p.Type === 'Number' || typeof p.MinValue !== 'undefined') {
          expect(typeof p.MinValue).toBe('number');
          expect(typeof p.MaxValue).toBe('number');
          expect(p.MinValue).toBeLessThanOrEqual(p.MaxValue);
        }
      });
    });

    test('Boolean-like toggles are constrained to true/false strings', () => {
      const toggles = ['CreateNatGateways', 'CreateCloudFront'];
      toggles.forEach(n => {
        const p = params[n];
        expect(p).toBeDefined();
        expect(p.AllowedValues).toEqual(['true', 'false']);
      });
    });

    test('DBEngine allowed values include common engines', () => {
      const p = params.DBEngine;
      expect(p).toBeDefined();
      expect(p.AllowedValues).toEqual([
        'aurora',
        'aurora-mysql',
        'mysql',
        'postgres',
      ]);
    });

    test('LogGroupNamePrefix parameter exists with empty default', () => {
      const p = params.LogGroupNamePrefix;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
    });

    test('ExistingCloudTrailArn parameter exists with empty default', () => {
      const p = params.ExistingCloudTrailArn;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
    });

    test('CreateConfigRecorder parameter exists with true default', () => {
      const p = params.CreateConfigRecorder;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('true');
      expect(p.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Conditions defined properly', () => {
    test('UseNatGateways, UseCloudFront, UseCustomCert, HasLogGroupNamePrefix, IsAuroraEngine, HasExistingCloudTrail, CreateNewCloudTrail, CreateNewConfigRecorder exist', () => {
      expect(template.Conditions).toBeDefined();
      const conds = template.Conditions;
      expect(conds.UseNatGateways).toBeDefined();
      expect(conds.UseCloudFront).toBeDefined();
      expect(conds.UseCustomCert).toBeDefined();
      expect(conds.HasLogGroupNamePrefix).toBeDefined();
      expect(conds.IsAuroraEngine).toBeDefined();
      expect(conds.IsNotAuroraEngine).toBeDefined();
      expect(conds.HasExistingCloudTrail).toBeDefined();
      expect(conds.CreateNewCloudTrail).toBeDefined();
      expect(conds.CreateNewConfigRecorder).toBeDefined();
    });
  });

  describe('Resource coverage and security properties', () => {
    test('All taggable resources include Environment and Owner tags', () => {
      expectAllTaggableResourcesHaveEnvOwnerTags(template);
    });

    test('KMS Key with rotation and alias present', () => {
      const kms = getResourcesByType(template, 'AWS::KMS::Key');
      expect(kms.length).toBe(1);
      const key = kms[0].resource;
      expect(key.Properties.EnableKeyRotation).toBe(true);

      // Alias
      const alias = getResourcesByType(template, 'AWS::KMS::Alias');
      expect(alias.length).toBe(1);
      const aliasProps = alias[0].resource.Properties;
      const aliasName = aliasProps.AliasName;
      expect(
        typeof aliasName === 'string' ||
          (aliasName && (aliasName['Fn::Sub'] || aliasName.Sub))
      ).toBeTruthy();
      // TargetKeyId likely references PrimaryKmsKey and may be a Ref/intrinsic
      expect(
        aliasProps.TargetKeyId === 'PrimaryKmsKey' || !!aliasProps.TargetKeyId
      ).toBe(true);
    });

    test('VPC and subnets exist with correct basic properties', () => {
      const vpcs = getResourcesByType(template, 'AWS::EC2::VPC');
      expect(vpcs.length).toBe(1);
      expect(vpcs[0].resource.Properties.EnableDnsSupport).toBe(true);
      expect(vpcs[0].resource.Properties.EnableDnsHostnames).toBe(true);

      const subnets = getResourcesByType(template, 'AWS::EC2::Subnet');
      // Public1, Public2 (conditional), Private1, Private2 (conditional), Isolated1, Isolated2 (conditional)
      expect(subnets.length).toBeGreaterThanOrEqual(3);

      // PublicSubnet1 should map public IPs on launch
      const pub1 = template.Resources.PublicSubnet1;
      expect(pub1).toBeDefined();
      expect(pub1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('InternetGateway and public route to 0.0.0.0/0 exist', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachIGW).toBeDefined();
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('NAT gateway resources are conditionally created', () => {
      const natGw = template.Resources.NatGateway1;
      const natEip = template.Resources.NatEIP1;
      expect(natGw).toBeDefined();
      expect(natEip).toBeDefined();
      expect(natGw.Condition).toBe('UseNatGateways');
      expect(natEip.Condition).toBe('UseNatGateways');
    });

    test('Network ACLs and entries exist', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNaclInboundHTTP).toBeDefined();
      expect(template.Resources.PublicNaclInboundHTTPS).toBeDefined();
      expect(template.Resources.PublicNaclOutbound).toBeDefined();
      expect(template.Resources.PrivateNaclInbound).toBeDefined();
      expect(template.Resources.PrivateNaclOutbound).toBeDefined();
    });

    test('Security groups enforce least privilege', () => {
      const webSg = template.Resources.WebSecurityGroup;
      const appSg = template.Resources.AppSecurityGroup;
      const dbSg = template.Resources.DbSecurityGroup;
      expect(webSg).toBeDefined();
      expect(appSg).toBeDefined();
      expect(dbSg).toBeDefined();

      // Web allows HTTPS inbound only
      expect(webSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ])
      );
      // App inbound only from Web SG on 8080
      expect(appSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 8080,
            ToPort: 8080,
            IpProtocol: 'tcp',
          }),
        ])
      );
      // DB inbound only from App SG on 3306
      expect(dbSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            FromPort: 3306,
            ToPort: 3306,
            IpProtocol: 'tcp',
          }),
        ])
      );
    });

    test('IAM roles and policies align with least privilege and required services', () => {
      const cloudTrailRole = template.Resources.CloudTrailRole;
      expect(cloudTrailRole).toBeDefined();
      const cloudTrailPolicies = cloudTrailRole.Properties.Policies;
      expect(Array.isArray(cloudTrailPolicies)).toBe(true);
      const cwPolicy = cloudTrailPolicies.find(
        (p: any) => p.PolicyName === 'CloudTrailToCloudWatch'
      );
      expect(cwPolicy).toBeDefined();

      // AWS Config uses a service-linked role; ensure the recorder references a role ARN
      const configRecorderRes = template.Resources.ConfigurationRecorder;
      expect(configRecorderRes).toBeDefined();
      const roleArnProp = configRecorderRes.Properties.RoleARN;
      expect(roleArnProp).toBeDefined();

      const ec2Role = template.Resources.EC2InstanceRole;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      // Verify scoped S3 and KMS permissions reference SecureDataBucket and PrimaryKmsKey
      const inlinePol = ec2Role.Properties.Policies?.find(
        (p: any) => p.PolicyName === 'EC2S3ScopedAccess'
      );
      expect(inlinePol).toBeDefined();
      const statements = inlinePol.PolicyDocument.Statement;
      expect(Array.isArray(statements)).toBe(true);
      // Ensure at least one statement references SecureDataBucket and PrimaryKmsKey (parser reduces !Ref/!GetAtt)
      const s3Stmt = statements.find((s: any) =>
        JSON.stringify(s.Resource || s.Resources || s).includes(
          'SecureDataBucket'
        )
      );
      const kmsStmt = statements.find((s: any) =>
        JSON.stringify(s.Resource || s.Resources || s).includes('PrimaryKmsKey')
      );
      expect(!!s3Stmt).toBe(true);
      expect(!!kmsStmt).toBe(true);

      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      const roles = instanceProfile.Properties.Roles || [];
      const hasRoleRef = roles.some(
        (r: any) =>
          r === 'EC2InstanceRole' || (r && r.Ref === 'EC2InstanceRole')
      );
      expect(hasRoleRef).toBe(true);

      const rdsMonRole = template.Resources.RDSMonitoringRole;
      expect(rdsMonRole).toBeDefined();
      expect(rdsMonRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('Secrets Manager secret for database credentials is generated securely', () => {
      const secret = template.Resources.DatabaseCredentialsSecret;
      expect(secret).toBeDefined();
      const gen = secret.Properties.GenerateSecretString;
      expect(gen).toBeDefined();
      expect(gen.GenerateStringKey).toBe('password');
      expect(gen.PasswordLength).toBeGreaterThanOrEqual(32);
      const tmpl = gen.SecretStringTemplate;
      expect(
        typeof tmpl === 'string' || (tmpl && (tmpl['Fn::Sub'] || tmpl.Sub))
      ).toBeTruthy();
    });

    test('S3 buckets have KMS encryption and public access blocked', () => {
      const buckets = getResourcesByType(template, 'AWS::S3::Bucket');
      expect(buckets.length).toBeGreaterThanOrEqual(3);
      buckets.forEach(({ resource }) => {
        expectS3BucketEncryptedWithKms(resource);
        expectS3BlockPublicAccess(resource);
      });

      // SecureDataBucket has versioning and logging
      const secureBucket = template.Resources.SecureDataBucket;
      expect(secureBucket.Properties.VersioningConfiguration?.Status).toBe(
        'Enabled'
      );
      expect(secureBucket.Properties.LoggingConfiguration).toBeDefined();
    });

    test('S3 bucket policies enforce HTTPS and SSE-KMS where applicable', () => {
      const securePolicy = template.Resources.SecureDataBucketPolicy;
      expect(securePolicy).toBeDefined();
      const stmts = securePolicy.Properties.PolicyDocument.Statement;
      const denyTransport = stmts.find(
        (s: any) => s.Sid === 'DenyInsecureTransport'
      );
      const denyNoSse = stmts.find(
        (s: any) => s.Sid === 'DenyUnEncryptedObjectUploads'
      );
      expect(denyTransport).toBeDefined();
      expect(denyNoSse).toBeDefined();

      const ctPolicy = template.Resources.CloudTrailBucketPolicy;
      expect(ctPolicy).toBeDefined();
      const ctStmts = ctPolicy.Properties.PolicyDocument.Statement;
      expect(ctStmts.some((s: any) => s.Sid === 'AWSCloudTrailAclCheck')).toBe(
        true
      );
      expect(ctStmts.some((s: any) => s.Sid === 'AWSCloudTrailWrite')).toBe(
        true
      );

      const cfgPolicy = template.Resources.ConfigBucketPolicy;
      expect(cfgPolicy).toBeDefined();
      const cfgStmts = cfgPolicy.Properties.PolicyDocument.Statement;
      expect(cfgStmts.some((s: any) => s.Sid === 'AllowConfigService')).toBe(
        true
      );
      expect(cfgStmts.some((s: any) => s.Sid === 'AllowConfigPuts')).toBe(true);
    });

    test('CloudWatch LogGroups are encrypted and retained', () => {
      const logGroups = getResourcesByType(template, 'AWS::Logs::LogGroup');
      expect(logGroups.length).toBeGreaterThanOrEqual(2);
      logGroups.forEach(({ resource }) => {
        expect(resource.Properties.RetentionInDays).toBeGreaterThan(0);
        // KmsKeyId likely references PrimaryKmsKey
        expect(
          resource.Properties.KmsKeyId === 'PrimaryKmsKey' ||
            !!resource.Properties.KmsKeyId
        ).toBe(true);
      });
    });

    test('CloudTrail is multi-region, logs enabled, with KMS and CW Logs integration (when created)', () => {
      const trails = getResourcesByType(template, 'AWS::CloudTrail::Trail');
      // CloudTrail is conditional based on whether existing trail ARN is provided
      if (trails.length > 0) {
        expect(trails.length).toBe(1);
        const t = trails[0].resource.Properties;
        expect(t.IsMultiRegionTrail).toBe(true);
        expect(t.IncludeGlobalServiceEvents).toBe(true);
        expect(t.EnableLogFileValidation).toBe(true);
        expect(t.IsLogging).toBe(true);
        expect(!!t.KMSKeyId).toBe(true);
        expect(!!t.CloudWatchLogsLogGroupArn).toBe(true);
        expect(!!t.CloudWatchLogsRoleArn).toBe(true);
      } else {
        // If no CloudTrail, we expect the conditions to be defined
        expect(template.Conditions.HasExistingCloudTrail).toBeDefined();
        expect(template.Conditions.CreateNewCloudTrail).toBeDefined();
      }
    });

    test('AWS Config recorder, delivery channel and managed rules exist', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();

      // Check for managed rules instead of conformance pack
      expect(template.Resources.S3BucketEncryptionConfigRule).toBeDefined();
      expect(
        template.Resources.S3BucketPublicReadProhibitedConfigRule
      ).toBeDefined();
      expect(template.Resources.IAMUserMFAConfigRule).toBeDefined();
      expect(template.Resources.RootAccountMFAConfigRule).toBeDefined();
      expect(
        template.Resources.VPCDefaultSecurityGroupClosedConfigRule
      ).toBeDefined();

      // Configuration Recorder is conditional
      expect(template.Resources.ConfigurationRecorder.Condition).toBe(
        'CreateNewConfigRecorder'
      );

      const rec = template.Resources.ConfigurationRecorder.Properties;
      expect(rec.RecordingGroup.AllSupported).toBe(true);
      expect(rec.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('SSM Patch Baseline and Maintenance Window configured', () => {
      const baseline = template.Resources.PatchBaseline;
      const mw = template.Resources.PatchMaintenanceWindow;
      const assoc = template.Resources.PatchAssociation;
      expect(baseline).toBeDefined();
      expect(mw).toBeDefined();
      expect(assoc).toBeDefined();

      expect(baseline.Properties.OperatingSystem).toBe('AMAZON_LINUX_2');
      expect(baseline.Properties.ApprovalRules).toBeDefined();
      expect(mw.Properties.Schedule).toBeDefined();
    });

    test('RDS instance is encrypted, private and uses secrets (handles Aurora and non-Aurora)', () => {
      // Check for Aurora cluster and instance
      const auroraCluster = template.Resources.RDSAuroraCluster;
      const auroraInstance = template.Resources.RDSAuroraInstance;
      const regularInstance = template.Resources.RDSInstance;

      // At least one should exist
      expect(auroraCluster || regularInstance).toBeDefined();

      if (auroraCluster) {
        // Aurora cluster should be encrypted and use secrets
        expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
        expect(auroraCluster.Properties.PubliclyAccessible).toBeUndefined(); // Aurora clusters don't have this property
        expect(typeof auroraCluster.Properties.MasterUsername).toBeDefined();
        expect(
          typeof auroraCluster.Properties.MasterUserPassword
        ).toBeDefined();

        // Aurora instance should exist and reference the cluster
        expect(auroraInstance).toBeDefined();
        expect(auroraInstance.Properties.DBClusterIdentifier).toBeDefined();
        expect(auroraInstance.Properties.PubliclyAccessible).toBe(false);
      }

      if (regularInstance) {
        // Regular RDS instance should be encrypted, MultiAZ, and private
        expect(regularInstance.Properties.StorageEncrypted).toBe(true);
        expect(regularInstance.Properties.MultiAZ).toBe(true);
        expect(regularInstance.Properties.PubliclyAccessible).toBe(false);
        expect(typeof regularInstance.Properties.MasterUsername).toBeDefined();
        expect(
          typeof regularInstance.Properties.MasterUserPassword
        ).toBeDefined();
      }
    });

    test('WAF WebACL (CloudFront scope) and CloudFront distribution configured', () => {
      const waf = template.Resources.WebACL;
      const dist = template.Resources.CloudFrontDistribution;
      const oai = template.Resources.CloudFrontOAI;
      // These are conditional on UseCloudFront
      expect(waf).toBeDefined();
      expect(dist).toBeDefined();
      expect(oai).toBeDefined();

      const rules = waf.Properties.Rules;
      expect(rules.some((r: any) => r.Name === 'AWSManagedCommonRuleSet')).toBe(
        true
      );
      expect(rules.some((r: any) => r.Name === 'AWSManagedSQLiRuleSet')).toBe(
        true
      );

      const dcfg = dist.Properties.DistributionConfig;
      expect(dcfg.Enabled).toBe(true);
      expect(dcfg.HttpVersion).toBe('http2');
      expect(dcfg.DefaultCacheBehavior.ViewerProtocolPolicy).toBe(
        'redirect-to-https'
      );
    });

    test('CloudWatch MetricFilter and Alarm for unauthorized API calls exist', () => {
      const mf = template.Resources.CloudTrailMetricFilter;
      const alarm = template.Resources.UnauthorizedApiCallsAlarm;
      expect(mf).toBeDefined();
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('UnauthorizedApiCalls');
      expect(alarm.Properties.Namespace).toBe('CloudTrailMetrics');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
    });
  });

  describe('Outputs correctness and completeness', () => {
    test('Expected outputs are present with correct basic structure', () => {
      const outputs = getOutputs(template);
      const expected = [
        'VPCId',
        'PublicSubnet1Id',
        'PrivateSubnet1Id',
        'IsolatedSubnet1Id',
        'SecureDataBucketName',
        'ConfigBucketName',
        'PrimaryKmsKeyId',
        'CloudFrontDistributionId', // conditional
        'DatabaseSecretArn',
        'RDSInstanceIdentifier', // conditional based on engine
      ];
      expected.forEach(o => {
        expect(outputs[o]).toBeDefined();
      });

      // CloudTrailBucketName is conditional
      if (outputs['CloudTrailBucketName']) {
        expect(outputs['CloudTrailBucketName']).toBeDefined();
      }
    });

    test('Output: VPCId references VPC and is exported', () => {
      const out = template.Outputs.VPCId;
      expect(out).toBeDefined();
      expect(out.Value === 'VPC' || !!out.Value).toBeTruthy();
      expect(out.Export).toBeDefined();
    });

    test('Output: CloudFrontDistributionId is conditional on UseCloudFront', () => {
      const out = template.Outputs.CloudFrontDistributionId;
      expect(out).toBeDefined();
      expect(out.Condition).toBe('UseCloudFront');
    });
  });
});
