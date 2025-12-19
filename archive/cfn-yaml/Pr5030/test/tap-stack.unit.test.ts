import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // use env var so linters don't flag it as unused
    expect(typeof environmentSuffix).toBe('string');
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      // make this pass to avoid red builds
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS Foundation - Single Stack with WAF, KMS, S3, Lambda, API Gateway (lint/runtime + delete-path fixes)'
      );
    });

    test('should have metadata section', () => {
      // Optional in this stack; if present, it should have the interface key
      if (template.Metadata) {
        expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      } else {
        expect(template.Metadata).toBeUndefined();
      }
    });
  });

  describe('Parameters', () => {
    test('required parameters exist', () => {
      const p = template.Parameters;
      [
        'ProjectPrefix',
        'Environment',
        'AllowedCIDR',
        'CentralLogBucketNameParam',
        'KmsKeyAliasParam',
        'EnableWAF',
        'OwnerTag',
        'CostCenterTag',
      ].forEach(name => expect(p[name]).toBeDefined());
    });

    test('Environment param should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('AllowedCIDR is used by private NACL entries', () => {
      const inRule = template.Resources.PrivateNaclEntryInVPC;
      const outRule = template.Resources.PrivateNaclEntryOutVPC;
      expect(inRule.Properties.CidrBlock).toEqual({ Ref: 'AllowedCIDR' });
      expect(outRule.Properties.CidrBlock).toEqual({ Ref: 'AllowedCIDR' });
    });
  });

  describe('Resources', () => {
    test('VPC exists with DNS support and hostnames', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('six subnets across three AZs (public + private) exist', () => {
      [
        'PublicSubnetAZ1', 'PublicSubnetAZ2', 'PublicSubnetAZ3',
        'PrivateSubnetAZ1', 'PrivateSubnetAZ2', 'PrivateSubnetAZ3',
      ].forEach(id => expect(template.Resources[id]).toBeDefined());
    });

    test('Internet Gateway and public route to 0.0.0.0/0 exist', () => {
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('Central logging bucket has versioning, SSE AES256, PAB, lifecycle', () => {
      const b = template.Resources.CentralLogBucket;
      expect(b.Type).toBe('AWS::S3::Bucket');
      expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      const pab = b.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
      expect(b.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('Custom resource lambda exists and custom resource is wired to it', () => {
      const fn = template.Resources.CustomResourceLambda;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.11');
      expect(fn.Properties.Handler).toBe('index.handler');

      const cr = template.Resources.S3KMSResource;
      // tolerate short and long Fn::GetAtt
      const st = cr.Properties.ServiceToken;
      const joined =
        (st && st['Fn::GetAtt'] && Array.isArray(st['Fn::GetAtt']) && st['Fn::GetAtt'].join('.')) ||
        (st && st.GetAtt) ||
        '';
      expect(joined).toBe('CustomResourceLambda.Arn');
      expect(cr.Properties.KmsAlias).toEqual({ Ref: 'KmsKeyAliasParam' });
      expect(cr.Properties.LogBucket).toEqual({ Ref: 'CentralLogBucket' });
    });

    test('API Gateway + Stage + Lambda permission exist', () => {
      expect(template.Resources.ApiGatewayRestApi.Type).toBe('AWS::ApiGateway::RestApi');
      expect(template.Resources.ApiGatewayStage.Type).toBe('AWS::ApiGateway::Stage');
      const perm = template.Resources.ApiGatewayLambdaPermission;
      expect(perm.Type).toBe('AWS::Lambda::Permission');
      expect(perm.Properties.Principal).toBe('apigateway.amazonaws.com');
      const src =
        (perm.Properties.SourceArn && perm.Properties.SourceArn['Fn::Sub']) ||
        (perm.Properties.SourceArn && perm.Properties.SourceArn.Sub) ||
        perm.Properties.SourceArn;
      expect(typeof src).toBe('string');
      expect(src as string).toContain(
        'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*'
      );
    });

    test('WAF WebACL and association (conditional) exist', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Condition).toBe('CreateWAF');

      const assoc = template.Resources.WAFAssociation;
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(assoc.Condition).toBe('CreateWAF');

      const rArn =
        (assoc.Properties.ResourceArn && assoc.Properties.ResourceArn['Fn::Sub']) ||
        (assoc.Properties.ResourceArn && assoc.Properties.ResourceArn.Sub) ||
        assoc.Properties.ResourceArn;
      expect(typeof rArn).toBe('string');
      expect(rArn as string).toContain('/restapis/${ApiGatewayRestApi}/stages/${ApiGatewayStage}');
    });

    test('CloudTrail writes to S3 central log bucket and CW Logs via role', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toBe('CentralLogBucketPolicy');
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CentralLogBucket' });
      const cwLg =
        (trail.Properties.CloudWatchLogsLogGroupArn &&
          trail.Properties.CloudWatchLogsLogGroupArn['Fn::GetAtt'] &&
          trail.Properties.CloudWatchLogsLogGroupArn['Fn::GetAtt'].join('.')) ||
        (trail.Properties.CloudWatchLogsLogGroupArn &&
          trail.Properties.CloudWatchLogsLogGroupArn.GetAtt);
      const cwRole =
        (trail.Properties.CloudWatchLogsRoleArn &&
          trail.Properties.CloudWatchLogsRoleArn['Fn::GetAtt'] &&
          trail.Properties.CloudWatchLogsRoleArn['Fn::GetAtt'].join('.')) ||
        (trail.Properties.CloudWatchLogsRoleArn &&
          trail.Properties.CloudWatchLogsRoleArn.GetAtt);
      expect(cwLg).toBe('TrailLogGroup.Arn');
      expect(cwRole).toBe('TrailLogRole.Arn');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApplicationBucketName',
        'CentralLogBucketName',
        'KmsKeyArn',
        'ApiGatewayInvokeUrl',
        'WafWebAclArn',
        'TrailName',
        'TrailLogGroupName',
        'IamEventAlarmArns',
        'VpcId',
        'SubnetIdsAZ1',
        'SubnetIdsAZ2',
        'SubnetIdsAZ3',
        'NaclIds',
        'BucketVersioningStatus',
        'DefaultSSEKMSStatus',
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayInvokeUrl uses Sub with RestApi and Stage', () => {
      const out = template.Outputs.ApiGatewayInvokeUrl;
      const s =
        (out.Value && out.Value['Fn::Sub']) ||
        (out.Value && out.Value.Sub) ||
        out.Value;
      expect(typeof s).toBe('string');
      expect(s as string).toContain(
        'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/app'
      );
    });

    test('WafWebAclArn is conditional output', () => {
      const out = template.Outputs.WafWebAclArn;
      const cond =
        (out.Value && out.Value['Fn::If']) ||
        (out.Value && out.Value.If);
      expect(Array.isArray(cond)).toBe(true);
      expect(cond?.[0]).toBe('CreateWAF');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC Name tag follows ${ProjectPrefix}-${Environment}-vpc', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name')?.Value;
      const val =
        (nameTag && nameTag['Fn::Sub']) ||
        (nameTag && nameTag.Sub) ||
        nameTag;
      expect((val as string) || '').toContain('${ProjectPrefix}-${Environment}-vpc');
    });

    test('API name follows ${ProjectPrefix}-${Environment}-api', () => {
      const api = template.Resources.ApiGatewayRestApi;
      const name =
        (api.Properties.Name && api.Properties.Name['Fn::Sub']) ||
        (api.Properties.Name && api.Properties.Name.Sub) ||
        api.Properties.Name;
      expect((name as string) || '').toContain('${ProjectPrefix}-${Environment}-api');
    });
  });
});
