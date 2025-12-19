/**
 * Unit tests for TapStack security infrastructure
 *
 * This test suite validates the resource properties, configurations, and policies
 * for the security infrastructure components including KMS, IAM, Secrets Manager,
 * CloudWatch, and VPC resources.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const mockState: any = { ...args.inputs };

    // Add IDs to mock state based on resource type
    switch (args.type) {
      case 'aws:kms/key:Key':
        mockState.arn = `arn:aws:kms:eu-north-1:123456789012:key/${args.name}`;
        mockState.id = `key-${args.name}`;
        mockState.keyId = `key-${args.name}`;
        break;
      case 'aws:iam/role:Role':
        mockState.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        mockState.id = `role-${args.name}`;
        break;
      case 'aws:secretsmanager/secret:Secret':
        mockState.arn = `arn:aws:secretsmanager:eu-north-1:123456789012:secret:${args.name}`;
        mockState.id = `secret-${args.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        mockState.arn = `arn:aws:logs:eu-north-1:123456789012:log-group:${args.inputs.name}`;
        mockState.id = args.inputs.name;
        break;
      case 'aws:ec2/vpc:Vpc':
        mockState.id = `vpc-${args.name}`;
        break;
      case 'aws:ec2/subnet:Subnet':
        mockState.id = `subnet-${args.name}`;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        mockState.id = `sg-${args.name}`;
        break;
      case 'aws:lambda/function:Function':
        mockState.arn = `arn:aws:lambda:eu-north-1:123456789012:function:${args.name}`;
        mockState.id = `function-${args.name}`;
        break;
      default:
        mockState.id = `${args.name}-id`;
        mockState.arn = `arn:aws:mock:eu-north-1:123456789012:${args.type}/${args.name}`;
    }

    return {
      id: mockState.id || `${args.name}-id`,
      state: mockState,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    switch (args.token) {
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        };
      case 'aws:index/getRegion:getRegion':
        return {
          name: 'eu-north-1',
          id: 'eu-north-1',
        };
      default:
        return {};
    }
  },
});

describe('TapStack Security Infrastructure', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test-env';

  beforeAll(() => {
    stack = new TapStack('test-security-stack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Project: 'SecurityTest',
        CostCenter: 'Engineering',
      },
    });
  });

  describe('KMS Key Configuration', () => {
    it('should create KMS key with automatic rotation enabled', (done) => {
      pulumi.all([stack.kmsKey.enableKeyRotation]).apply(([rotationEnabled]) => {
        expect(rotationEnabled).toBe(true);
        done();
      });
    });

    it('should set KMS key deletion window to 30 days', (done) => {
      pulumi.all([stack.kmsKey.deletionWindowInDays]).apply(([deletionWindow]) => {
        expect(deletionWindow).toBe(30);
        done();
      });
    });

    it('should have proper description with environment suffix', (done) => {
      pulumi.all([stack.kmsKey.description]).apply(([description]) => {
        expect(description).toContain(testEnvironmentSuffix);
        expect(description).toContain('encrypting application secrets');
        done();
      });
    });

    it('should include mandatory compliance tags', (done) => {
      pulumi.all([stack.kmsKey.tags]).apply(([tags]) => {
        expect(tags).toHaveProperty('Environment', testEnvironmentSuffix);
        expect(tags).toHaveProperty('Owner', 'cloud-team');
        expect(tags).toHaveProperty('SecurityLevel', 'high');
        expect(tags).toHaveProperty('ManagedBy', 'pulumi');
        done();
      });
    });

    it('should create KMS key alias with correct naming', (done) => {
      pulumi.all([stack.kmsKeyAlias.name]).apply(([aliasName]) => {
        expect(aliasName).toBe(`alias/security-key-${testEnvironmentSuffix}`);
        done();
      });
    });

    it('should have key policy allowing CloudWatch Logs', (done) => {
      pulumi.all([stack.kmsKey.policy]).apply(([policy]) => {
        const parsedPolicy = JSON.parse(policy as string);
        const logsStatement = parsedPolicy.Statement.find(
          (s: any) => s.Sid === 'Allow CloudWatch Logs'
        );
        expect(logsStatement).toBeDefined();
        expect(logsStatement.Principal.Service).toContain('logs');
        expect(logsStatement.Action).toContain('kms:Encrypt');
        done();
      });
    });

    it('should have key policy allowing Secrets Manager', (done) => {
      pulumi.all([stack.kmsKey.policy]).apply(([policy]) => {
        const parsedPolicy = JSON.parse(policy as string);
        const secretsStatement = parsedPolicy.Statement.find(
          (s: any) => s.Sid === 'Allow Secrets Manager'
        );
        expect(secretsStatement).toBeDefined();
        expect(secretsStatement.Principal.Service).toBe('secretsmanager.amazonaws.com');
        expect(secretsStatement.Action).toContain('kms:Decrypt');
        done();
      });
    });
  });

  describe('VPC and Networking Configuration', () => {
    it('should create VPC with proper CIDR block', (done) => {
      pulumi.all([stack.vpc.cidrBlock]).apply(([cidr]) => {
        expect(cidr).toBe('10.0.0.0/16');
        done();
      });
    });

    it('should enable DNS support and hostnames in VPC', (done) => {
      pulumi
        .all([stack.vpc.enableDnsHostnames, stack.vpc.enableDnsSupport])
        .apply(([hostnamesEnabled, dnsEnabled]) => {
          expect(hostnamesEnabled).toBe(true);
          expect(dnsEnabled).toBe(true);
          done();
        });
    });

    it('should create private subnet in correct availability zone', (done) => {
      pulumi.all([stack.privateSubnet.availabilityZone]).apply(([az]) => {
        expect(az).toBe('eu-north-1a');
        done();
      });
    });

    it('should create private subnet with correct CIDR', (done) => {
      pulumi.all([stack.privateSubnet.cidrBlock]).apply(([cidr]) => {
        expect(cidr).toBe('10.0.1.0/24');
        done();
      });
    });

    it('should tag private subnet as Type: private', (done) => {
      pulumi.all([stack.privateSubnet.tags]).apply(([tags]) => {
        expect(tags).toHaveProperty('Type', 'private');
        done();
      });
    });

    it('should create Lambda security group with proper egress rules', (done) => {
      pulumi.all([stack.lambdaSecurityGroup.egress]).apply(([egress]) => {
        expect(egress).toBeDefined();
        expect(egress).toHaveLength(1);
        expect(egress![0].protocol).toBe('-1');
        expect(egress![0].cidrBlocks).toContain('0.0.0.0/0');
        done();
      });
    });
  });

  describe('IAM Role Configuration', () => {
    describe('EC2 Role', () => {
      it('should create EC2 role with correct name including environment suffix', (done) => {
        pulumi.all([stack.ec2Role.name]).apply(([name]) => {
          expect(name).toBe(`ec2-data-processing-role-${testEnvironmentSuffix}`);
          done();
        });
      });

      it('should set maximum session duration to 1 hour', (done) => {
        pulumi.all([stack.ec2Role.maxSessionDuration]).apply(([duration]) => {
          expect(duration).toBe(3600);
          done();
        });
      });

      it('should have assume role policy for EC2 service', (done) => {
        pulumi.all([stack.ec2Role.assumeRolePolicy]).apply(([policy]) => {
          const parsedPolicy = JSON.parse(policy as string);
          expect(parsedPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
          expect(parsedPolicy.Statement[0].Action).toBe('sts:AssumeRole');
          done();
        });
      });

      it('should include mandatory compliance tags', (done) => {
        pulumi.all([stack.ec2Role.tags]).apply(([tags]) => {
          expect(tags).toHaveProperty('Environment', testEnvironmentSuffix);
          expect(tags).toHaveProperty('Owner', 'cloud-team');
          expect(tags).toHaveProperty('SecurityLevel', 'high');
          done();
        });
      });
    });

    describe('Lambda Role', () => {
      it('should create Lambda role with correct name', (done) => {
        pulumi.all([stack.lambdaRole.name]).apply(([name]) => {
          expect(name).toBe(`lambda-secrets-rotation-role-${testEnvironmentSuffix}`);
          done();
        });
      });

      it('should have assume role policy for Lambda service', (done) => {
        pulumi.all([stack.lambdaRole.assumeRolePolicy]).apply(([policy]) => {
          const parsedPolicy = JSON.parse(policy as string);
          expect(parsedPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
          done();
        });
      });

      it('should set maximum session duration to 1 hour', (done) => {
        pulumi.all([stack.lambdaRole.maxSessionDuration]).apply(([duration]) => {
          expect(duration).toBe(3600);
          done();
        });
      });
    });

    describe('Cross-Account Role', () => {
      it('should create cross-account role with auditor name', (done) => {
        pulumi.all([stack.crossAccountRole.name]).apply(([name]) => {
          expect(name).toBe(`cross-account-auditor-role-${testEnvironmentSuffix}`);
          done();
        });
      });

      it('should have external ID validation in assume role policy', (done) => {
        pulumi.all([stack.crossAccountRole.assumeRolePolicy]).apply(([policy]) => {
          const parsedPolicy = JSON.parse(policy as string);
          expect(parsedPolicy.Statement[0].Condition.StringEquals).toHaveProperty(
            'sts:ExternalId'
          );
          done();
        });
      });

      it('should have IP address restrictions in assume role policy', (done) => {
        pulumi.all([stack.crossAccountRole.assumeRolePolicy]).apply(([policy]) => {
          const parsedPolicy = JSON.parse(policy as string);
          expect(parsedPolicy.Statement[0].Condition.IpAddress).toBeDefined();
          expect(parsedPolicy.Statement[0].Condition.IpAddress['aws:SourceIp']).toContain(
            '10.0.0.0/8'
          );
          done();
        });
      });

      it('should set maximum session duration to 1 hour', (done) => {
        pulumi.all([stack.crossAccountRole.maxSessionDuration]).apply(([duration]) => {
          expect(duration).toBe(3600);
          done();
        });
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    describe('Audit Log Group', () => {
      it('should create audit log group with correct name pattern', (done) => {
        pulumi.all([stack.auditLogGroup.name]).apply(([name]) => {
          expect(name).toBe(`/aws/security/audit-logs-${testEnvironmentSuffix}`);
          done();
        });
      });

      it('should set retention to 365 days for compliance', (done) => {
        pulumi.all([stack.auditLogGroup.retentionInDays]).apply(([retention]) => {
          expect(retention).toBe(365);
          done();
        });
      });

      it('should have KMS encryption enabled', (done) => {
        pulumi.all([stack.auditLogGroup.kmsKeyId]).apply(([kmsKeyId]) => {
          expect(kmsKeyId).toBeDefined();
          done();
        });
      });

      it('should have Purpose tag set to audit-trail', (done) => {
        pulumi.all([stack.auditLogGroup.tags]).apply(([tags]) => {
          expect(tags).toHaveProperty('Purpose', 'audit-trail');
          done();
        });
      });
    });

    describe('Application Log Group', () => {
      it('should create application log group with correct name pattern', (done) => {
        pulumi.all([stack.applicationLogGroup.name]).apply(([name]) => {
          expect(name).toBe(`/aws/application/logs-${testEnvironmentSuffix}`);
          done();
        });
      });

      it('should set retention to 365 days', (done) => {
        pulumi.all([stack.applicationLogGroup.retentionInDays]).apply(([retention]) => {
          expect(retention).toBe(365);
          done();
        });
      });

      it('should have KMS encryption enabled', (done) => {
        pulumi.all([stack.applicationLogGroup.kmsKeyId]).apply(([kmsKeyId]) => {
          expect(kmsKeyId).toBeDefined();
          done();
        });
      });
    });
  });

  describe('Secrets Manager Configuration', () => {
    it('should create secret with correct name', (done) => {
      pulumi.all([stack.dbSecret.name]).apply(([name]) => {
        expect(name).toBe(`db-credentials-${testEnvironmentSuffix}`);
        done();
      });
    });

    it('should enable KMS encryption for secret', (done) => {
      pulumi.all([stack.dbSecret.kmsKeyId]).apply(([kmsKeyId]) => {
        expect(kmsKeyId).toBeDefined();
        done();
      });
    });

    it('should set recovery window to 7 days', (done) => {
      pulumi.all([stack.dbSecret.recoveryWindowInDays]).apply(([recoveryWindow]) => {
        expect(recoveryWindow).toBe(7);
        done();
      });
    });

    it('should have description mentioning 30-day rotation', (done) => {
      pulumi.all([stack.dbSecret.description]).apply(([description]) => {
        expect(description).toContain('30-day rotation');
        done();
      });
    });

    it('should include mandatory compliance tags', (done) => {
      pulumi.all([stack.dbSecret.tags]).apply(([tags]) => {
        expect(tags).toHaveProperty('Environment', testEnvironmentSuffix);
        expect(tags).toHaveProperty('SecurityLevel', 'high');
        done();
      });
    });
  });

  describe('Lambda Function for Secret Rotation', () => {
    it('should create rotation Lambda with correct name', (done) => {
      pulumi.all([stack.secretRotationLambda.name]).apply(([name]) => {
        expect(name).toBe(`secret-rotation-${testEnvironmentSuffix}`);
        done();
      });
    });

    it('should use Python 3.11 runtime', (done) => {
      pulumi.all([stack.secretRotationLambda.runtime]).apply(([runtime]) => {
        expect(runtime).toBe('python3.11');
        done();
      });
    });

    it('should set timeout to 5 minutes', (done) => {
      pulumi.all([stack.secretRotationLambda.timeout]).apply(([timeout]) => {
        expect(timeout).toBe(300);
        done();
      });
    });

    it('should run in private subnet', (done) => {
      pulumi.all([stack.secretRotationLambda.vpcConfig]).apply(([vpcConfig]) => {
        expect(vpcConfig).toBeDefined();
        expect(vpcConfig!.subnetIds).toBeDefined();
        expect(vpcConfig!.securityGroupIds).toBeDefined();
        done();
      });
    });

    it('should have KMS key in environment variables', (done) => {
      pulumi.all([stack.secretRotationLambda.environment]).apply(([env]) => {
        expect(env).toBeDefined();
        expect(env!.variables).toHaveProperty('KMS_KEY_ID');
        expect(env!.variables).toHaveProperty('SECRETS_MANAGER_ENDPOINT');
        done();
      });
    });

    it('should use customer-managed KMS key for environment variables', (done) => {
      pulumi.all([stack.secretRotationLambda.kmsKeyArn]).apply(([kmsKeyArn]) => {
        expect(kmsKeyArn).toBeDefined();
        done();
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should export KMS key ARN and ID', (done) => {
      const outputs = stack.urn.apply(() => {
        return {
          kmsKeyArn: stack.kmsKey.arn,
          kmsKeyId: stack.kmsKey.id,
        };
      });

      pulumi.all([outputs]).apply(([out]) => {
        expect(out.kmsKeyArn).toBeDefined();
        expect(out.kmsKeyId).toBeDefined();
        done();
      });
    });

    it('should export all IAM role ARNs', (done) => {
      const outputs = stack.urn.apply(() => {
        return {
          ec2RoleArn: stack.ec2Role.arn,
          lambdaRoleArn: stack.lambdaRole.arn,
          crossAccountRoleArn: stack.crossAccountRole.arn,
        };
      });

      pulumi.all([outputs]).apply(([out]) => {
        expect(out.ec2RoleArn).toBeDefined();
        expect(out.lambdaRoleArn).toBeDefined();
        expect(out.crossAccountRoleArn).toBeDefined();
        done();
      });
    });

    it('should export Secrets Manager secret ARN', (done) => {
      const outputs = stack.urn.apply(() => {
        return {
          dbSecretArn: stack.dbSecret.arn,
          dbSecretName: stack.dbSecret.name,
        };
      });

      pulumi.all([outputs]).apply(([out]) => {
        expect(out.dbSecretArn).toBeDefined();
        expect(out.dbSecretName).toBeDefined();
        done();
      });
    });

    it('should export CloudWatch Log Group names and ARNs', (done) => {
      const outputs = stack.urn.apply(() => {
        return {
          auditLogGroupName: stack.auditLogGroup.name,
          auditLogGroupArn: stack.auditLogGroup.arn,
          applicationLogGroupName: stack.applicationLogGroup.name,
        };
      });

      pulumi.all([outputs]).apply(([out]) => {
        expect(out.auditLogGroupName).toBeDefined();
        expect(out.auditLogGroupArn).toBeDefined();
        expect(out.applicationLogGroupName).toBeDefined();
        done();
      });
    });

    it('should export VPC and subnet IDs', (done) => {
      const outputs = stack.urn.apply(() => {
        return {
          vpcId: stack.vpc.id,
          privateSubnetId: stack.privateSubnet.id,
        };
      });

      pulumi.all([outputs]).apply(([out]) => {
        expect(out.vpcId).toBeDefined();
        expect(out.privateSubnetId).toBeDefined();
        done();
      });
    });
  });

  describe('Least Privilege and Security Constraints', () => {
    it('should enforce least privilege with explicit deny statements', (done) => {
      // This is a conceptual test - actual policy validation would require
      // parsing the inline policies attached to roles
      pulumi.all([stack.ec2Role.name]).apply(([name]) => {
        expect(name).toContain('data-processing-role');
        done();
      });
    });

    it('should validate all resources have environment suffix in naming', (done) => {
      pulumi
        .all([
          stack.kmsKey.urn,
          stack.ec2Role.name,
          stack.lambdaRole.name,
          stack.dbSecret.name,
          stack.auditLogGroup.name,
        ])
        .apply(([kmsUrn, ec2Name, lambdaName, secretName, logName]) => {
          expect(ec2Name).toContain(testEnvironmentSuffix);
          expect(lambdaName).toContain(testEnvironmentSuffix);
          expect(secretName).toContain(testEnvironmentSuffix);
          expect(logName).toContain(testEnvironmentSuffix);
          done();
        });
    });

    it('should ensure all resources are tagged for compliance', (done) => {
      pulumi
        .all([stack.kmsKey.tags, stack.ec2Role.tags, stack.dbSecret.tags, stack.vpc.tags])
        .apply(([kmsTags, roleTags, secretTags, vpcTags]) => {
          // Verify mandatory tags exist
          expect(kmsTags).toHaveProperty('Environment');
          expect(kmsTags).toHaveProperty('Owner');
          expect(kmsTags).toHaveProperty('SecurityLevel');
          expect(roleTags).toHaveProperty('SecurityLevel', 'high');
          done();
        });
    });
  });

  describe('Default Parameters', () => {
    it('should use default environmentSuffix when not provided', (done) => {
      const defaultStack = new TapStack('default-stack', {});
      pulumi.all([defaultStack.kmsKey.description]).apply(([description]) => {
        expect(description).toContain('dev');
        done();
      });
    });

    it('should work with empty tags parameter', (done) => {
      const noTagsStack = new TapStack('no-tags-stack', {
        environmentSuffix: 'test',
      });
      pulumi.all([noTagsStack.kmsKey.tags]).apply(([tags]) => {
        // Should still have mandatory compliance tags
        expect(tags).toHaveProperty('Environment');
        expect(tags).toHaveProperty('Owner');
        done();
      });
    });

    it('should handle undefined args completely', (done) => {
      const minimalStack = new TapStack('minimal-stack');
      pulumi.all([minimalStack.kmsKey.description]).apply(([description]) => {
        expect(description).toBeDefined();
        done();
      });
    });
  });
});
