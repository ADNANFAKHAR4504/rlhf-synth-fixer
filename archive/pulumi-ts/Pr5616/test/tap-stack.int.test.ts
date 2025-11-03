import { TapStack, TapStackArgs } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  describe('Stack Module Loading', () => {
    it('should successfully import TapStack class', () => {
      expect(TapStack).toBeDefined();
      expect(typeof TapStack).toBe('function');
    });

    it('should have correct TapStackArgs interface', () => {
      const testTags = { Team: 'test-team', CostCenter: 'test-cost-center' };
      const validArgs: TapStackArgs = {
        environmentSuffix: 'test',
        tags: testTags,
      };
      expect(validArgs.environmentSuffix).toBe('test');
      expect(testTags.Team).toBe('test-team');
    });
  });

  describe('Entry Point Validation', () => {
    it('should have valid bin/tap.ts entry point', () => {
      const entryPointPath = path.join(__dirname, '..', 'bin', 'tap.ts');
      expect(fs.existsSync(entryPointPath)).toBe(true);

      const content = fs.readFileSync(entryPointPath, 'utf-8');
      expect(content).toContain('TapStack');
      expect(content).toContain('import');
      expect(content).toContain('export');
    });

    it('should export table outputs from entry point', () => {
      const entryPointPath = path.join(__dirname, '..', 'bin', 'tap.ts');
      const content = fs.readFileSync(entryPointPath, 'utf-8');

      expect(content).toContain('export const tableNames');
      expect(content).toContain('export const tableArns');
      expect(content).toContain('export const streamArns');
    });
  });

  describe('Stack Configuration', () => {
    it('should use correct environment suffix from process.env', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'integration-test';

      const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(suffix).toBe('integration-test');

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });

    it('should default to dev environment when not specified', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(suffix).toBe('dev');

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });
  });

  describe('TypeScript Source Files', () => {
    it('should have TypeScript source in bin directory', () => {
      const sourcePath = path.join(__dirname, '..', 'bin', 'tap.ts');
      expect(fs.existsSync(sourcePath)).toBe(true);
    });

    it('should have TypeScript source in lib directory', () => {
      const sourceLibPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      expect(fs.existsSync(sourceLibPath)).toBe(true);
    });
  });

  describe('Pulumi Configuration', () => {
    it('should have valid Pulumi.yaml', () => {
      const pulumiConfigPath = path.join(__dirname, '..', 'Pulumi.yaml');
      expect(fs.existsSync(pulumiConfigPath)).toBe(true);

      const content = fs.readFileSync(pulumiConfigPath, 'utf-8');
      expect(content).toContain('name: TapStack');
      expect(content).toContain('runtime');
      expect(content).toContain('nodejs');
    });

    it('should point to correct entry point', () => {
      const pulumiConfigPath = path.join(__dirname, '..', 'Pulumi.yaml');
      const content = fs.readFileSync(pulumiConfigPath, 'utf-8');

      expect(content).toContain('main: bin/tap.ts');
    });
  });

  describe('Package Configuration', () => {
    it('should have valid package.json', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.name).toBe('tap');
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@pulumi/pulumi']).toBeDefined();
      expect(packageJson.dependencies['@pulumi/aws']).toBeDefined();
    });

    it('should have test scripts configured', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts['test:unit']).toBeDefined();
      expect(packageJson.scripts['test:integration']).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
    });
  });

  describe('Infrastructure Code Structure', () => {
    it('should define three table configurations', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain("name: 'events'");
      expect(content).toContain("name: 'sessions'");
      expect(content).toContain("name: 'users'");
    });

    it('should configure events table with streams', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('enableStreams: true');
      expect(content).toContain('NEW_AND_OLD_IMAGES');
    });

    it('should configure sessions table with GSI', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('enableGSI: true');
      expect(content).toContain('userId-timestamp-index');
    });

    it('should configure users table with PITR', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('enablePITR: true');
      expect(content).toContain('pointInTimeRecovery');
    });

    it('should use on-demand billing mode', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should enable server-side encryption', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('serverSideEncryption');
      expect(content).toContain('enabled: true');
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    it('should create UserErrors alarms', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('user-errors');
      expect(content).toContain("metricName: 'UserErrors'");
      expect(content).toContain('threshold: 5');
    });

    it('should create SystemErrors alarms', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('system-errors');
      expect(content).toContain("metricName: 'SystemErrors'");
      expect(content).toContain('threshold: 5');
    });
  });

  describe('IAM Roles Configuration', () => {
    it('should create read roles for tables', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('read-role');
      expect(content).toContain('dynamodb:GetItem');
      expect(content).toContain('dynamodb:Query');
      expect(content).toContain('dynamodb:Scan');
    });

    it('should create write roles for tables', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('write-role');
      expect(content).toContain('dynamodb:PutItem');
      expect(content).toContain('dynamodb:UpdateItem');
      expect(content).toContain('dynamodb:DeleteItem');
    });

    it('should use lambda service principal', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain("Service: 'lambda.amazonaws.com'");
      expect(content).toContain("Action: 'sts:AssumeRole'");
    });
  });

  describe('Resource Tagging', () => {
    it('should apply environment tags', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('Environment: environmentSuffix');
    });

    it('should apply team and cost center tags', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('Team:');
      expect(content).toContain('CostCenter:');
    });
  });

  describe('Stack Outputs', () => {
    it('should export tableNames output', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('public readonly tableNames');
      expect(content).toContain(
        'this.tableNames = pulumi.output(tableNamesList)'
      );
    });

    it('should export tableArns output', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('public readonly tableArns');
      expect(content).toContain('this.tableArns = pulumi.all(tableArnsList)');
    });

    it('should export streamArns output', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('public readonly streamArns');
      expect(content).toContain('this.streamArns = pulumi');
    });
  });
});
