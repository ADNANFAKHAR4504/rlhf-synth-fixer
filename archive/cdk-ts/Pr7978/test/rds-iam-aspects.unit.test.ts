import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { RDSConfigAspect } from '../lib/aspects/rds-config-aspect';
import { IAMPolicyAspect } from '../lib/aspects/iam-policy-aspect';
import { ValidationRegistry } from '../lib/core/validation-registry';

describe('RDS and IAM Aspects Unit Tests', () => {
  beforeEach(() => {
    ValidationRegistry.clear();
  });

  afterEach(() => {
    ValidationRegistry.clear();
  });

  describe('RDS Config Aspect', () => {
    test('detects RDS instance without encryption', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const vpc = new ec2.Vpc(stack, 'VPC', { maxAzs: 2 });

      const instance = new rds.CfnDBInstance(stack, 'DBInstance', {
        dbInstanceClass: 'db.t3.micro',
        engine: 'postgres',
        masterUsername: 'admin',
        masterUserPassword: 'password123',
        dbSubnetGroupName: 'test-subnet-group',
        storageEncrypted: false,
      });

      cdk.Aspects.of(stack).add(new RDSConfigAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const rdsFindings = findings.filter(f => f.category === 'RDS');
      const encryptionFindings = rdsFindings.filter(f => f.message.includes('encryption'));

      expect(encryptionFindings.length).toBeGreaterThan(0);
      expect(encryptionFindings[0].severity).toBe('critical');
    });

    test('detects RDS instance with low backup retention', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const instance = new rds.CfnDBInstance(stack, 'DBInstance', {
        dbInstanceClass: 'db.t3.micro',
        engine: 'postgres',
        masterUsername: 'admin',
        masterUserPassword: 'password123',
        dbSubnetGroupName: 'test-subnet-group',
        storageEncrypted: true,
        backupRetentionPeriod: 3, // Less than 7 days
      });

      cdk.Aspects.of(stack).add(new RDSConfigAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const rdsFindings = findings.filter(f => f.category === 'RDS');
      const backupFindings = rdsFindings.filter(f => f.message.includes('backup retention'));

      expect(backupFindings.length).toBeGreaterThan(0);
      expect(backupFindings[0].severity).toBe('warning');
    });

    test('detects RDS instance without Multi-AZ', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const instance = new rds.CfnDBInstance(stack, 'DBInstance', {
        dbInstanceClass: 'db.t3.micro',
        engine: 'postgres',
        masterUsername: 'admin',
        masterUserPassword: 'password123',
        dbSubnetGroupName: 'test-subnet-group',
        storageEncrypted: true,
        multiAz: false,
      });

      cdk.Aspects.of(stack).add(new RDSConfigAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const rdsFindings = findings.filter(f => f.category === 'RDS');
      const multiAzFindings = rdsFindings.filter(f => f.message.includes('Multi-AZ'));

      expect(multiAzFindings.length).toBeGreaterThan(0);
      expect(multiAzFindings[0].severity).toBe('info');
    });

    test('detects RDS cluster without encryption', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const cluster = new rds.CfnDBCluster(stack, 'DBCluster', {
        engine: 'aurora-postgresql',
        masterUsername: 'admin',
        masterUserPassword: 'password123',
        dbSubnetGroupName: 'test-subnet-group',
        storageEncrypted: false,
      });

      cdk.Aspects.of(stack).add(new RDSConfigAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const rdsFindings = findings.filter(f => f.category === 'RDS');
      const encryptionFindings = rdsFindings.filter(f => f.message.includes('encryption'));

      expect(encryptionFindings.length).toBeGreaterThan(0);
      expect(encryptionFindings[0].severity).toBe('critical');
    });

    test('detects RDS cluster with low backup retention', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const cluster = new rds.CfnDBCluster(stack, 'DBCluster', {
        engine: 'aurora-postgresql',
        masterUsername: 'admin',
        masterUserPassword: 'password123',
        dbSubnetGroupName: 'test-subnet-group',
        storageEncrypted: true,
        backupRetentionPeriod: 2,
      });

      cdk.Aspects.of(stack).add(new RDSConfigAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const rdsFindings = findings.filter(f => f.category === 'RDS');
      const backupFindings = rdsFindings.filter(f => f.message.includes('backup retention'));

      expect(backupFindings.length).toBeGreaterThan(0);
      expect(backupFindings[0].severity).toBe('warning');
    });
  });

  describe('IAM Policy Aspect', () => {
    test('detects role with wildcard actions only', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['*'],
        resources: ['arn:aws:s3:::my-bucket/*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');
      const wildcardActionFindings = iamFindings.filter(f =>
        f.message.includes('wildcard') && f.message.includes('actions')
      );

      expect(wildcardActionFindings.length).toBeGreaterThan(0);
      expect(wildcardActionFindings[0].severity).toBe('warning');
    });

    test('detects role with wildcard resources only', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: ['*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');
      const wildcardResourceFindings = iamFindings.filter(f =>
        f.message.includes('wildcard') && f.message.includes('resources')
      );

      expect(wildcardResourceFindings.length).toBeGreaterThan(0);
      expect(wildcardResourceFindings[0].severity).toBe('warning');
    });

    test('detects role with both wildcard actions and resources', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['*'],
        resources: ['*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');
      const criticalFindings = iamFindings.filter(f =>
        f.severity === 'critical' && f.message.includes('both actions and resources')
      );

      expect(criticalFindings.length).toBeGreaterThan(0);
    });

    test('detects policy with wildcard in array of actions', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', '*', 's3:PutObject'],
        resources: ['arn:aws:s3:::my-bucket/*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');
      const wildcardFindings = iamFindings.filter(f => f.message.includes('wildcard'));

      expect(wildcardFindings.length).toBeGreaterThan(0);
    });

    test('detects policy with wildcard in array of resources', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: ['arn:aws:s3:::bucket1/*', '*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');
      const wildcardFindings = iamFindings.filter(f => f.message.includes('wildcard'));

      expect(wildcardFindings.length).toBeGreaterThan(0);
    });

    test('does not flag Deny statements', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
      }));

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');

      // Deny statements with wildcards are OK (explicit deny)
      expect(iamFindings.length).toBe(0);
    });

    test('handles role without policies', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      // Should not throw errors, just no findings
      const findings = ValidationRegistry.getFindings();
      expect(findings).toBeDefined();
    });

    test('validates standalone Policy resource', () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');

      const role = new iam.Role(stack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });

      new iam.Policy(stack, 'TestPolicy', {
        roles: [role],
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['*'],
            resources: ['*'],
          }),
        ],
      });

      cdk.Aspects.of(stack).add(new IAMPolicyAspect());
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');

      expect(iamFindings.length).toBeGreaterThan(0);
    });
  });
});
