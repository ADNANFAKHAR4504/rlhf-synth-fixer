// test/tap-stack.unit.test.mjs
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IAMRolesConstruct } from '../lib/constructs/iam-roles.mjs';
import { SecurityGroupConstruct } from '../lib/constructs/security-group.mjs';
import { TapStack } from '../lib/tap-stack';

// default environment suffix used by most tests
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  let stackName;
  let env;

  const baseConfig = {
    dev: {
      existingVpcId: 'vpc-03d43d0faacf0130c',
      existingS3Bucket: 'test-logs-bucket20250819215334277900000001',
      sshCidrBlock: '10.0.0.0/8',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      environment: 'Production'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    env = { account: '111111111111', region: 'us-east-1' };
    stackName = `TapStack${environmentSuffix}`;

    // keep a default "happy path" stack for tests that only read the synthesized template
    app = new cdk.App();
    stack = new TapStack(app, `${stackName}-Happy`, { env, environmentSuffix, config: baseConfig });
    template = Template.fromStack(stack);
  });

  //
  // -------------------------
  // EC2 tests
  // -------------------------
  //
  describe('EC2 tests', () => {
    test('Creates EC2 instances with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro'
      });
    });

    test('Creates exactly 2 EC2 instances', () => {
      const ec2Instances = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(ec2Instances)).toHaveLength(2);
      Object.values(ec2Instances).forEach((instance) => {
        expect(instance.Properties.InstanceType).toBe('t2.micro');
      });
    });
  }); // end EC2 tests

  //
  // -------------------------
  // Security Group tests
  // -------------------------
  //
  describe('Security Group tests', () => {
    test('Security group has correct ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      expect(sg.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '1.2.3.4/5',
            Description: 'from 1.2.3.4/5:443',
          }),
        ])
      );
    });

    test('Security group has correct egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      expect(sg.SecurityGroupEgress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          }),
        ])
      );
    });

    test('Exactly 4 security group are created', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(sgResources)).toHaveLength(4);
    });

    // NEW: test for unsupported region that triggers the error at line 84 in security-group.mjs
    test('Throws on unsupported region for S3 prefix list', () => {
      // use a fresh app/stack to avoid modifying the global app after synth
      const localApp = new cdk.App();
      const localStack = new cdk.Stack(localApp, `${stackName}-SGUnsupportedRegion`, {
        env: { account: '111111111111', region: 'moon-1' } // region not in s3PrefixListIds
      });

      // create a minimal VPC to pass into the construct (construct creates SecurityGroup before region check)
      const vpc = new ec2.Vpc(localStack, 'TestVpc', { maxAzs: 1 });

      expect(() => {
        new SecurityGroupConstruct(localStack, 'TestSecurityGroup', {
          vpc,
          sshCidrBlock: '10.0.0.0/8',
          trustedOutboundCidrs: ['10.0.0.0/8']
        });
      }).toThrow(/Unsupported region for S3 prefix list: moon-1/);
    });
  }); // end Security Group tests

  //
  // -------------------------
  // IAM tests
  // -------------------------
  //
  describe('IAM tests', () => {
    test('Creates IAM role with trust policy for EC2', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Roles = Object.values(roles).filter(r => {
        const statements = r.Properties.AssumeRolePolicyDocument.Statement;
        return statements.some(s => s.Principal?.Service === 'ec2.amazonaws.com');
      });

      expect(ec2Roles.length).toBeGreaterThan(0);
      ec2Roles.forEach(role => {
        const statements = role.Properties.AssumeRolePolicyDocument.Statement;
        expect(statements).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Principal: expect.objectContaining({ Service: 'ec2.amazonaws.com' })
            })
          ])
        );
      });
    });

    test('IAM role policy contains CloudWatch Logs ARN for imported log group (uses logGroup.logGroupName)', () => {
      // Use a fresh app/stack to avoid modifying the global app after synth
      const localApp = new cdk.App();
      const s = new cdk.Stack(localApp, `${stackName}-IAMTestStack`, { env });

      // Instantiate construct with a "fromLogGroupName"-style object (no logGroupArn property)
      new IAMRolesConstruct(s, 'TestIAMRoles', {
        s3BucketName: 'test-bucket',
        logGroup: { logGroupName: 'imported-log-group' }
      });

      const localTemplate = Template.fromStack(s);
      const roles = localTemplate.findResources('AWS::IAM::Role');
      const roleResource = Object.values(roles)[0];

      // roleResource.Properties.Policies may be undefined; default to empty array
      const policies = roleResource.Properties?.Policies || [];

      let found = false;
      for (const policy of policies) {
        const stmts = policy.PolicyDocument?.Statement || [];
        for (const stmt of stmts) {
          const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
          for (const r of resources) {
            const asString = JSON.stringify(r);
            if (asString.includes('log-group') && asString.includes('imported-log-group') && asString.includes(':*')) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      // If inline Policies were not used by CDK, also check separate AWS::IAM::Policy resources
      if (!found) {
        const iamPolicies = localTemplate.findResources('AWS::IAM::Policy') || {};
        for (const p of Object.values(iamPolicies)) {
          const stmts = p.Properties?.PolicyDocument?.Statement || [];
          for (const stmt of stmts) {
            const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
            for (const r of resources) {
              const asString = JSON.stringify(r);
              if (asString.includes('log-group') && asString.includes('imported-log-group') && asString.includes(':*')) {
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }

      expect(found).toBe(true);
    });
  }); // end IAM tests

  //
  // -------------------------
  // CloudWatch Logs tests
  // -------------------------
  //
  describe('CloudWatch Logs tests', () => {
    test('Creates CloudWatch Log Group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90
      });
    });
  }); // end CloudWatch Logs tests

  //
  // -------------------------
  // Tagging tests
  // -------------------------
  //
  describe('Tagging tests', () => {
    test('All resources have Environment tag', () => {
      const resources = template.findResources('*');
      Object.values(resources).forEach(r => {
        expect(r.Properties?.Tags).toEqual(expect.arrayContaining([{ Key: 'Environment', Value: 'Production' }]));
      });
    });
  }); // end Tagging tests

  //
  // -------------------------
  // Stack Outputs tests
  // -------------------------
  //
  describe('Stack Outputs tests', () => {
    test('Outputs include EC2, SecurityGroup and LogGroup', () => {
      const outputs = template.findOutputs('*');
      ['Instance1Id', 'Instance1PrivateIP', 'SecurityGroupId', 'LogGroupName'].forEach(name => {
        const outputKey = Object.keys(outputs).find(k => k.endsWith(name));
        expect(outputKey).toBeDefined();
      });
    });
  }); // end Stack Outputs tests

  //
  // -------------------------
  // S3 tests
  // -------------------------
  //
  describe('S3 tests', () => {
    test('Uses an S3 bucket if existingS3Bucket is defined', () => {
      // use a fresh App/Stack to avoid modifying the global app after synth
      const localApp = new cdk.App();
      const config = { dev: { ...baseConfig.dev } };
      const localStack = new TapStack(localApp, `${stackName}-ExistingBucket`, { env, environmentSuffix, config });
      const localTemplate = Template.fromStack(localStack);

      // Expect no new bucket resources
      localTemplate.resourceCountIs('AWS::S3::Bucket', 0);

      // Verify outputs or references use the expected bucket name
      expect(localStack.bucket.bucketName).toEqual(config.dev.existingS3Bucket);
    });

    test('Throws if existingS3Bucket missing', () => {
      const localApp = new cdk.App();
      const config = { dev: { ...baseConfig.dev, existingS3Bucket: undefined } };
      expect(() => new TapStack(localApp, `${stackName}-RequireBucket`, { env, environmentSuffix, config }))
        .toThrow(/S3 bucket must be provided/);
    });
  }); // end S3 tests

  //
  // -------------------------
  // VPC tests
  // -------------------------
  //
  describe('VPC tests', () => {
    test('Uses a VPC if existingVpcId is defined', () => {
      // fresh app/stack per test
      const localApp = new cdk.App();
      const config = { dev: { ...baseConfig.dev } };
      const localStack = new TapStack(localApp, `${stackName}-ExistingVpc`, { env, environmentSuffix, config });
      const localTemplate = Template.fromStack(localStack);

      // Expect no new vpc resources
      localTemplate.resourceCountIs('AWS::EC2::VPC', 0);

      // Verify outputs or references use the expected bucket name
      expect(localStack.vpc.vpcId).toBeDefined();
    });

    test('Throws if existingVpcId undefined', () => {
      const localApp = new cdk.App();
      const config = { dev: { ...baseConfig.dev, existingVpcId: undefined } };
      expect(() => new TapStack(localApp, `${stackName}-RequireVpc`, { env, environmentSuffix, config }))
        .toThrow(/VPC ID must be provided/);
    });
  }); // end VPC tests

  //
  // -------------------------
  // Configuration tests
  // -------------------------
  //
  describe('Configuration tests', () => {
    test('Uses provided environmentSuffix when truthy', () => {
      const localApp = new cdk.App();
      const s = new TapStack(localApp, `${stackName}-EnvProvided`, { env, environmentSuffix: 'qa', config: baseConfig });
      expect(s.environmentSuffix).toBe('qa');
    });

    test('Defaults to "dev" when environmentSuffix omitted or falsy', () => {
      const localApp = new cdk.App();
      const s = new TapStack(localApp, `${stackName}-EnvDefault`, { env, config: baseConfig });
      expect(s.environmentSuffix).toBe('dev');
    });

    test('Empty string environmentSuffix (falsy) also falls back to "dev"', () => {
      const localApp = new cdk.App();
      const s = new TapStack(localApp, `${stackName}-EnvEmpty`, { env, environmentSuffix: '', config: baseConfig });
      expect(s.environmentSuffix).toBe('dev');
    });

    test('Logs error instead of building resources when config.environment missing (fallback to dev present but dev missing environment)', () => {
      const badConfig = {
        dev: {
          // dev exists but intentionally missing "environment"
          existingVpcId: 'vpc-12345678',
          existingS3Bucket: 'test-logs-bucket',
          sshCidrBlock: '10.0.0.0/8',
          trustedOutboundCidrs: ['10.0.0.0/8']
        }
      };

      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => { });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      const localApp = new cdk.App();
      // This will cause loadConfig to fall back to dev then constructor to log error
      new TapStack(localApp, `${stackName}-NoEnvironment`, { env, environmentSuffix: 'qa', config: badConfig });

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to 'dev'"));
      expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("No configuration found for 'qa'"));

      infoSpy.mockRestore();
      errSpy.mockRestore();
    });

    test('Loads config from cdk.json context when environments are provided', () => {
      const localApp = new cdk.App({
        context: {
          environments: {
            qa: {
              existingVpcId: 'vpc-qa',
              existingS3Bucket: 'qa-logs',
              sshCidrBlock: '10.0.0.0/8',
              trustedOutboundCidrs: ['10.0.0.0/8'],
              environment: 'QA'
            }
          }
        }
      });

      const s = new TapStack(localApp, `${stackName}-FromContext`, { env, environmentSuffix: 'qa' });
      expect(s.config).toEqual(expect.objectContaining({
        existingVpcId: 'vpc-qa',
        existingS3Bucket: 'qa-logs',
        environment: 'QA'
      }));
    });

    test('Throws when environments context missing entirely', () => {
      const localApp = new cdk.App({ context: {} });
      expect(() => new TapStack(localApp, `${stackName}-NoContext`, { env, environmentSuffix: 'qa' }))
        .toThrow(/No configuration found in/);
    });

    test('Throws when environment not found in context and no fallback', () => {
      const localApp = new cdk.App({ context: { environments: { dev: undefined } } });
      expect(() => new TapStack(localApp, `${stackName}-MissingEnv`, { env: {}, environmentSuffix: 'qa', config: {} }))
        .toThrow(/No configuration found for environment: 'qa'/);
    });
  }); // end Configuration tests

  //
  // -------------------------
  // Additional configuration tests
  // -------------------------
  //
  describe('Additional configuration tests', () => {
    let localApp;
    beforeEach(() => {
      jest.clearAllMocks();
      localApp = new cdk.App();
    });

    test('loadConfig() fallbacks and prod-missing behavior (throws for prod)', () => {
      // fallback (qa missing -> dev used) still eventually fails when required resources missing (VPC)
      const cfg = { qa: undefined, dev: { environment: 'dev' } };
      expect(() => {
        new TapStack(localApp, `${stackName}-FallbackFlow`, {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'qa',
          config: cfg
        });
      }).toThrow(/VPC ID must be provided/);

      // prod config missing should throw early at loadConfig
      const cfgProd = { dev: { environment: 'dev' } };
      expect(() => {
        new TapStack(localApp, `${stackName}-ProdMissing`, {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'prod',
          config: cfgProd
        });
      }).toThrow(/No configuration found for 'prod'/);
    });
  }); // end Additional configuration tests

}); // end TapStack
