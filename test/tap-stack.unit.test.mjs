// test/tap-stack.unit.test.mjs
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { TapStack } from '../lib/tap-stack.mjs';

// default environment suffix used by most tests
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (unit)', () => {
  // shared test variables (recreated / overridden in inner suites as needed)
  let app;
  let stack;
  let template;
  let stackName;
  let env;

  // base config in env-keyed form (dev/prod shape)
  const baseConfig = {
    dev: {
      createIfNotExists: true,
      existingVpcId: 'vpc-12345678',
      existingS3Bucket: 'test-logs-bucket',
      sshCidrBlock: '10.0.0.0/8',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      environment: 'Production'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    env = { account: '111111111111', region: 'us-east-1' };
    // base stack name — tests append a suffix to keep names unique when necessary
    stackName = `TapStack${environmentSuffix}`;
  });

  //
  // -------------------------
  // Happy path: standard stack with provided dev config
  // -------------------------
  //
  describe('Happy path (dev config provided)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, `${stackName}-Happy`, { env, environmentSuffix, config: baseConfig });
      template = Template.fromStack(stack);
    });

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

    test('Security group has correct ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;
      expect(sg.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: '10.0.0.0/8' })
        ])
      );
    });

    test('Security group has correct egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;
      expect(sg.SecurityGroupEgress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: '-1', CidrIp: '10.0.0.0/8' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
        ])
      );
    });

    test('Only one security group is created', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(sgResources)).toHaveLength(1);
    });

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

    test('Creates CloudWatch Log Group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/secure-webapp',
        RetentionInDays: 90
      });
    });

    test('All resources have Environment tag', () => {
      const resources = template.findResources('*');
      Object.values(resources).forEach(r => {
        expect(r.Properties?.Tags).toEqual(expect.arrayContaining([{ Key: 'Environment', Value: 'Production' }]));
      });
    });

    test('Outputs include EC2, SecurityGroup and LogGroup', () => {
      const outputs = template.findOutputs('*');
      ['Instance1Id', 'Instance1PrivateIP', 'SecurityGroupId', 'LogGroupName'].forEach(name => {
        const outputKey = Object.keys(outputs).find(k => k.endsWith(name));
        expect(outputKey).toBeDefined();
      });
    });
  }); // end Happy path

  //
  // -------------------------
  // createIfNotExists = true: when resources are allowed to be created if missing
  // -------------------------
  //
  describe('createIfNotExists = true (fallback creation allowed)', () => {
    test('Creates a new VPC if existingVpcId missing', () => {
      app = new cdk.App();
      const config = {
        dev: {
          ...baseConfig.dev,
          existingVpcId: undefined,
          createIfNotExists: true,
          environment: 'dev'
        }
      };
      stack = new TapStack(app, `${stackName}-CreateVpc`, { env, environmentSuffix, config });
      template = Template.fromStack(stack);
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates a new S3 bucket if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = {
        dev: {
          ...baseConfig.dev,
          existingS3Bucket: undefined,
          createIfNotExists: true,
          environment: 'dev'
        }
      };
      stack = new TapStack(app, `${stackName}-CreateBucket`, { env, environmentSuffix, config });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::S3::Bucket', 1);

      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(bucketResources)[0];
      expect(bucket.Properties).toHaveProperty('BucketEncryption');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toEqual(
        expect.arrayContaining([expect.objectContaining({
          ServerSideEncryptionByDefault: expect.objectContaining({ SSEAlgorithm: 'AES256' })
        })])
      );
    });
  }); // end createIfNotExists=true

  //
  // -------------------------
  // createIfNotExists = false: error cases when existence required
  // -------------------------
  //
  describe('createIfNotExists = false (require existing resources)', () => {
    test('Throws if existingVpcId missing', () => {
      app = new cdk.App();
      const config = {
        dev: { ...baseConfig.dev, existingVpcId: undefined, createIfNotExists: false }
      };
      expect(() => new TapStack(app, `${stackName}-RequireVpc`, { env, environmentSuffix, config }))
        .toThrow(/VPC ID must be provided/);
    });

    test('Throws if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = {
        dev: { ...baseConfig.dev, existingS3Bucket: undefined, createIfNotExists: false }
      };
      expect(() => new TapStack(app, `${stackName}-RequireBucket`, { env, environmentSuffix, config }))
        .toThrow(/S3 bucket must be provided/);
    });
  }); // end createIfNotExists=false

  //
  // -------------------------
  // Lookup fallback behavior — controlled (conditional) mocks to simulate failed lookups
  // -------------------------
  //
  describe('Lookup fallback behavior (Vpc & S3)', () => {
    // Restore mocks after each test so they don't leak into other suites
    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('VPC lookup failure -> fallback / rethrow', () => {
      test('fromLookup throws & createIfNotExists=true -> warn and create fallback VPC', () => {
        // mock only the lookup to throw for our test case
        const originalVpcFromLookup = ec2.Vpc.fromLookup;
        jest.spyOn(ec2.Vpc, 'fromLookup').mockImplementation((scope, id, opts) => {
          if (opts && opts.vpcId === 'vpc-lookup-fail') {
            throw new Error('lookup failed');
          }
          return originalVpcFromLookup.call(ec2.Vpc, scope, id, opts);
        });

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        const config = {
          dev: { ...baseConfig.dev, existingVpcId: 'vpc-lookup-fail', createIfNotExists: true, environment: 'dev' }
        };

        app = new cdk.App();
        const thisStackName = `${stackName}-VpcFallback`;
        stack = new TapStack(app, thisStackName, { env, environmentSuffix, config });
        template = Template.fromStack(stack);

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Vpc.fromLookup failed for vpcId='${config.dev.existingVpcId}'.`)
        );

        template.resourceCountIs('AWS::EC2::VPC', 1);
      });

      test('fromLookup throws & createIfNotExists=false -> original error is rethrown', () => {
        jest.spyOn(ec2.Vpc, 'fromLookup').mockImplementation(() => { throw new Error('lookup failed'); });

        const config = {
          dev: { ...baseConfig.dev, existingVpcId: 'vpc-lookup-fail', createIfNotExists: false, environment: 'dev' }
        };

        app = new cdk.App();
        const thisStackName = `${stackName}-VpcNoFallback`;

        expect(() => new TapStack(app, thisStackName, { env, environmentSuffix, config }))
          .toThrow(/lookup failed/);
      });
    }); // end VPC fallback

    describe('S3 lookup failure -> fallback / rethrow', () => {
      test('fromBucketName throws & createIfNotExists=true -> warn and create fallback Bucket (reuses name)', () => {
        // capture original and mock conditionally so other components (CloudWatch logging) keep working
        const originalFromBucketName = s3.Bucket.fromBucketName;
        const targetBucket = 'my-test-bucket-fallback';
        jest.spyOn(s3.Bucket, 'fromBucketName').mockImplementation((scope, id, name) => {
          if (name === targetBucket) {
            throw new Error('bucket lookup failed');
          }
          return originalFromBucketName.call(s3.Bucket, scope, id, name);
        });

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        const config = {
          dev: { ...baseConfig.dev, existingS3Bucket: targetBucket, createIfNotExists: true, environment: 'dev' }
        };

        app = new cdk.App();
        const thisStackName = `${stackName}-BucketFallback`;
        stack = new TapStack(app, thisStackName, { env, environmentSuffix, config });
        template = Template.fromStack(stack);

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Bucket.fromBucketName failed for bucket='${targetBucket}'.`)
        );

        template.resourceCountIs('AWS::S3::Bucket', 1);
        template.hasResourceProperties('AWS::S3::Bucket', { BucketName: targetBucket });
      });

      test('fromBucketName throws & createIfNotExists=false -> original error is rethrown', () => {
        jest.spyOn(s3.Bucket, 'fromBucketName').mockImplementation(() => { throw new Error('bucket lookup failed'); });

        const cfg = {
          dev: { ...baseConfig.dev, existingS3Bucket: 'my-test-bucket-fallback', createIfNotExists: false, environment: 'dev' }
        };

        app = new cdk.App();
        const thisStackName = `${stackName}-BucketNoFallback`;
        expect(() => new TapStack(app, thisStackName, { env, environmentSuffix, config: cfg }))
          .toThrow(/bucket lookup failed/);
      });
    }); // end S3 fallback
  }); // end Lookup fallback behavior

  //
  // -------------------------
  // Invalid configuration: environmentSuffix behavior & context loading
  // -------------------------
  //
  describe('Invalid configuration and environment selection', () => {
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
          createIfNotExists: true,
          existingVpcId: 'vpc-12345678',
          existingS3Bucket: 'test-logs-bucket',
          sshCidrBlock: '10.0.0.0/8',
          trustedOutboundCidrs: ['10.0.0.0/8']
        }
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      // This will cause loadConfig to fall back to dev then constructor to log error
      new TapStack(app = new cdk.App(), `${stackName}-NoEnvironment`, { env, environmentSuffix: 'qa', config: badConfig });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to 'dev'"));
      expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("No configuration found for 'qa'"));

      warnSpy.mockRestore();
      errSpy.mockRestore();
    });

    test('Loads config from cdk.json context when environments are provided', () => {
      const localApp = new cdk.App({
        context: {
          environments: {
            qa: {
              createIfNotExists: true,
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
  }); // end Invalid configuration

  //
  // -------------------------
  // Additional tests for full coverage (misc small behaviors)
  // -------------------------
  //
  describe('Additional tests for full coverage', () => {
    let localApp;
    beforeEach(() => {
      jest.clearAllMocks();
      localApp = new cdk.App();
    });

    test('showInfo() printing does not crash constructor when invoked indirectly', () => {
      // constructing with minimal dev that lacks a VPC forces the constructor path that logs errors;
      // the original test expected a thrown VPC error here, so keep that behavior
      expect(() => {
        new TapStack(localApp, `${stackName}-Extra`, {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'dev',
          config: { dev: { environment: 'dev' } },
          createIfNotExists: true
        });
      }).toThrow(/VPC ID must be provided/);
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
  }); // end Additional tests

}); // end TapStack (unit)
