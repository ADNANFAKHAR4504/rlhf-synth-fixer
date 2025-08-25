import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  let stackName;
  let env;

  beforeEach(() => {
    jest.clearAllMocks();
    env = { account: '111111111111', region: 'us-east-1' };
    stackName = `TapStack${environmentSuffix}`;
  });

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

  // ------------------ Happy path ------------------
  describe('Happy path', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, stackName, { env, environmentSuffix, config: baseConfig });
      template = Template.fromStack(stack);
    });

    test('Creates EC2 instances with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro'
      });
    });

    test('Creates exactly 2 EC2 instances', () => {
      // Find all resources of type AWS::EC2::Instance
      const ec2Instances = template.findResources('AWS::EC2::Instance');

      // Assert that there are exactly 2 instances
      expect(Object.keys(ec2Instances)).toHaveLength(2);

      // Optional: check that both are t2.micro
      Object.values(ec2Instances).forEach((instance) => {
        expect(instance.Properties.InstanceType).toBe('t2.micro');
      });
    });

    test('Security group has correct ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      // Ingress rules
      const ingressRules = sg.SecurityGroupIngress;
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          }),
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '10.0.0.0/8'
          })
        ])
      );
    });

    test('Security group has correct egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const sg = Object.values(securityGroups)[0].Properties;

      const egressRules = sg.SecurityGroupEgress;

      // Check trusted outbound CIDR
      expect(egressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: '-1',
            CidrIp: '10.0.0.0/8'
          }),
          // HTTPS to AWS services (SSM/CloudWatch)
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
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
        expect(r.Properties?.Tags).toEqual(
          expect.arrayContaining([{ Key: 'Environment', Value: 'Production' }])
        );
      });
    });

    test('Outputs include EC2, SecurityGroup and LogGroup', () => {
      const outputs = template.findOutputs('*');
      const expectedOutputs = [
        'Instance1Id',
        'Instance1PrivateIP',
        'SecurityGroupId',
        'LogGroupName'
      ];
      expectedOutputs.forEach(name => {
        const outputKey = Object.keys(outputs).find(k => k.endsWith(name));
        expect(outputKey).toBeDefined();
      });
    });
  });

  //------------------createIfNotExists = true ------------------
  describe('createIfNotExists = true', () => {
    test('Creates a new VPC if existingVpcId missing', () => {
      app = new cdk.App();
      const config = {
        ...baseConfig,
        dev: {
          ...baseConfig.dev,
          existingVpcId: undefined,
          createIfNotExists: true
        }
      };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates a new S3 bucket if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = {
        ...baseConfig,
        dev: {
          ...baseConfig.dev,
          existingS3Bucket: undefined,
          createIfNotExists: true
        }
      };
      stack = new TapStack(app, stackName, { env, environmentSuffix, config });
      template = Template.fromStack(stack);

      // Exactly 1 bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);

      // Encryption check
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(bucketResources)[0];

      expect(bucket.Properties).toHaveProperty('BucketEncryption');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ServerSideEncryptionByDefault: expect.objectContaining({
              SSEAlgorithm: 'AES256'
            })
          })
        ])
      );
    });
  });

  //------------------createIfNotExists = false ------------------
  describe('createIfNotExists = false', () => {
    test('Throws if existingVpcId missing', () => {
      app = new cdk.App();
      const config = {
        ...baseConfig,
        dev: {
          ...baseConfig.dev,
          existingVpcId: undefined,
          createIfNotExists: false
        }
      };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config });
      }).toThrow(/VPC ID must be provided/);
    });

    test('Throws if existingS3Bucket missing', () => {
      app = new cdk.App();
      const config = {
        ...baseConfig,
        dev: {
          ...baseConfig.dev,
          existingS3Bucket: undefined,
          createIfNotExists: false
        }
      };
      expect(() => {
        new TapStack(app, stackName, { env, environmentSuffix, config });
      }).toThrow(/S3 bucket must be provided/);
    });
  });

  // ------------------ Invalid configuration ------------------
  describe('Invalid configuration', () => {
    // A) Provided (truthy) environmentSuffix is used
    test('uses provided environmentSuffix when truthy', () => {
      const app = new cdk.App();

      const stack = new TapStack(app, 'TapStackEnvQa', {
        env,
        environmentSuffix: 'qa',
        config: baseConfig
      });

      expect(stack.environmentSuffix).toBe('qa');
    });

    // B) Missing / falsy environmentSuffix defaults to "dev"
    test('defaults to "dev" when environmentSuffix is omitted or falsy', () => {
      const app = new cdk.App();

      // omit environmentSuffix to test defaulting
      const stack = new TapStack(app, 'TapStackEnvDefault', {
        env,
        config: baseConfig
      });

      expect(stack.environmentSuffix).toBe('dev');
    });

    // Extra: test behavior for empty string (shows || treats '' as falsy)
    test('empty string environmentSuffix falls back to "dev" (|| behavior)', () => {
      const app = new cdk.App();

      const stack = new TapStack(app, 'TapStackEnvEmpty', {
        env,
        environmentSuffix: '', // empty string is falsy -> 'dev'
        config: baseConfig
      });

      expect(stack.environmentSuffix).toBe('dev');
    });

    test('Logs error instead of building resources when config.environment missing (fallback to dev present)', () => {
      // Arrange: config has a dev key (so loadConfig can fallback), but dev has no "environment"
      const badConfig = {
        dev: {
          createIfNotExists: true,
          existingVpcId: 'vpc-12345678',
          existingS3Bucket: 'test-logs-bucket',
          sshCidrBlock: '10.0.0.0/8',
          trustedOutboundCidrs: ['10.0.0.0/8'],
          // NOTE: intentionally missing "environment"
        }
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      // Act: use an environmentSuffix that is missing (so fallback occurs)
      new TapStack(app, 'TapStackNoEnv', { env, environmentSuffix: 'qa', config: badConfig });

      // Assert: loadConfig should have warned about falling back, then constructor should log error
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to 'dev'"));
      expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("No configuration found for 'qa'"));

      warnSpy.mockRestore();
      errSpy.mockRestore();
    });

    test('Loads config from cdk.json context when environments are provided', () => {
      app = new cdk.App({
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

      const stack = new TapStack(app, 'TapStackQA', { env, environmentSuffix: 'qa' });

      expect(stack.config).toEqual(
        expect.objectContaining({
          existingVpcId: 'vpc-qa',
          existingS3Bucket: 'qa-logs',
          environment: 'QA'
        })
      );
    });

    test('Throws if environments context missing entirely', () => {
      app = new cdk.App({ context: {} });

      expect(() => {
        new TapStack(app, 'TapStackQA', { env, environmentSuffix: 'qa' });
      }).toThrow(/No configuration found in/);
    });

    test('Logs error if environment not found in cdk.json context', () => {
      const app = new cdk.App({
        context: { environments: { dev: undefined } }
      });

      expect(() => {
        new TapStack(app, 'TestStack', { env: {}, environmentSuffix: 'qa', config: {} });
      }).toThrow(/No configuration found for environment: 'qa'/);

    });
  });

  describe('Additional tests for full coverage', () => {

    let app;

    beforeEach(() => {
      jest.clearAllMocks();
      app = new cdk.App();
    }); //end-test

    test('showInfo() logs correctly', () => {

      expect(() => {
        new TapStack(app, 'TapStack-Extra', {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'dev',
          config: { dev: { environment: 'dev' } },
          createIfNotExists: true
        });
      }).toThrow(/VPC ID must be provided/);

    }); //end-test

    test('loadConfig() falls back to dev if env missing', () => {
      const cfg = { qa: undefined, dev: { environment: 'dev' } };

      expect(() => {
        new TapStack(app, 'TapStackFallback', {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'qa',
          config: cfg
        });
      }).toThrow(/VPC ID must be provided/);

    }); //end-test

    test('loadConfig() logs error if prod config missing', () => {
      const cfg = { dev: { environment: 'dev' } };

      expect(() => {
        new TapStack(app, 'TapStackProdMissing', {
          env: { account: '111111111111', region: 'us-east-1' },
          environmentSuffix: 'prod',
          config: cfg
        });
      }).toThrow(/No configuration found for 'prod'/);

    }); //end-test

  }); // end-describe

}); // end-suite
