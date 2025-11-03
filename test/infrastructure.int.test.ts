import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Integration Tests', () => {
  describe('Project Configuration', () => {
    it('should have valid Pulumi.yaml configuration', () => {
      const pulumiConfigPath = path.join(__dirname, '..', 'Pulumi.yaml');
      expect(fs.existsSync(pulumiConfigPath)).toBe(true);

      const content = fs.readFileSync(pulumiConfigPath, 'utf-8');
      expect(content).toContain('name: TapStack');
      expect(content).toContain('runtime:');
      expect(content).toContain('nodejs');
      expect(content).toContain('main: bin/tap.ts');
    });

    it('should have valid package.json', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      expect(packageJson.name).toBe('tap');
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies['@pulumi/pulumi']).toBeDefined();
      expect(packageJson.dependencies['@pulumi/aws']).toBeDefined();
    });

    it('should have valid tsconfig.json', () => {
      const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBeDefined();
    });
  });

  describe('Source Code Structure', () => {
    it('should have bin/tap.ts entry point', () => {
      const entryPointPath = path.join(__dirname, '..', 'bin', 'tap.ts');
      expect(fs.existsSync(entryPointPath)).toBe(true);

      const content = fs.readFileSync(entryPointPath, 'utf-8');
      expect(content).toContain('import');
      expect(content).toContain('pulumi');
      expect(content).toContain('TapStack');
    });

    it('should have lib/tap-stack.ts', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      expect(fs.existsSync(stackPath)).toBe(true);

      const content = fs.readFileSync(stackPath, 'utf-8');
      expect(content).toContain('export class TapStack');
      expect(content).toContain('pulumi.ComponentResource');
    });

    it('should export TapStackArgs interface', () => {
      const stackPath = path.join(__dirname, '..', 'lib', 'tap-stack.ts');
      const content = fs.readFileSync(stackPath, 'utf-8');

      expect(content).toContain('export interface TapStackArgs');
    });
  });

  describe('Test Files', () => {
    it('should have unit test files', () => {
      const testDir = path.join(__dirname);
      const files = fs.readdirSync(testDir);
      const unitTests = files.filter((f) => f.endsWith('.unit.test.ts'));

      expect(unitTests.length).toBeGreaterThan(0);
    });

    it('should have integration test files', () => {
      const testDir = path.join(__dirname);
      const files = fs.readdirSync(testDir);
      const intTests = files.filter((f) => f.endsWith('.int.test.ts'));

      expect(intTests.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata', () => {
    it('should have valid metadata.json', () => {
      const metadataPath = path.join(__dirname, '..', 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      expect(metadata.platform).toBe('pulumi');
      expect(metadata.language).toBe('ts');
      expect(metadata.task_id).toBeDefined();
    });

    it('should have AWS services defined in metadata', () => {
      const metadataPath = path.join(__dirname, '..', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      expect(metadata.aws_services).toBeDefined();
      expect(Array.isArray(metadata.aws_services)).toBe(true);
      expect(metadata.aws_services.length).toBeGreaterThan(0);
    });

    it('should have training_quality score', () => {
      const metadataPath = path.join(__dirname, '..', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      expect(metadata.training_quality).toBeDefined();
      expect(typeof metadata.training_quality).toBe('number');
      expect(metadata.training_quality).toBeGreaterThanOrEqual(0);
      expect(metadata.training_quality).toBeLessThanOrEqual(10);
    });
  });

  describe('Documentation', () => {
    it('should have PROMPT.md', () => {
      const promptPath = path.join(__dirname, '..', 'lib', 'PROMPT.md');
      expect(fs.existsSync(promptPath)).toBe(true);

      const content = fs.readFileSync(promptPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should have MODEL_RESPONSE.md', () => {
      const modelResponsePath = path.join(
        __dirname,
        '..',
        'lib',
        'MODEL_RESPONSE.md'
      );
      expect(fs.existsSync(modelResponsePath)).toBe(true);

      const content = fs.readFileSync(modelResponsePath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should have IDEAL_RESPONSE.md', () => {
      const idealResponsePath = path.join(
        __dirname,
        '..',
        'lib',
        'IDEAL_RESPONSE.md'
      );
      expect(fs.existsSync(idealResponsePath)).toBe(true);

      const content = fs.readFileSync(idealResponsePath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should have MODEL_FAILURES.md', () => {
      const modelFailuresPath = path.join(
        __dirname,
        '..',
        'lib',
        'MODEL_FAILURES.md'
      );
      expect(fs.existsSync(modelFailuresPath)).toBe(true);

      const content = fs.readFileSync(modelFailuresPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe('TypeScript Compilation', () => {
    it('should have compiled JavaScript files in bin directory', () => {
      const binDir = path.join(__dirname, '..', 'bin');
      expect(fs.existsSync(binDir)).toBe(true);

      const files = fs.readdirSync(binDir);
      const tsFiles = files.filter((f) => f.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);
    });

    it('should have TypeScript source files in lib directory', () => {
      const libDir = path.join(__dirname, '..', 'lib');
      expect(fs.existsSync(libDir)).toBe(true);

      const files = fs.readdirSync(libDir);
      const tsFiles = files.filter((f) => f.endsWith('.ts'));
      expect(tsFiles.length).toBeGreaterThan(0);
    });
  });

  describe('NPM Scripts', () => {
    it('should have test scripts configured', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts['test:unit']).toBeDefined();
      expect(packageJson.scripts['test:integration']).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    });

    it('should have build scripts configured', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have lint script configured', () => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts.lint).toBeDefined();
    });
  });
});
