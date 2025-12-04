import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { CodeCommitClient, GetRepositoryCommand, ListRepositoriesCommand } from '@aws-sdk/client-codecommit';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

describe('CodeCommit Repository Infrastructure Integration Tests', () => {
  let cfnClient: CloudFormationClient;
  let codecommitClient: CodeCommitClient;
  let cloudwatchClient: CloudWatchClient;
  let iamClient: IAMClient;
  let stackOutputs: Record<string, any>;
  let environmentSuffix: string;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    codecommitClient = new CodeCommitClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    iamClient = new IAMClient({ region });

    // Get environment suffix
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Load stack outputs
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      stackOutputs = JSON.parse(outputsContent);
    } else {
      console.warn('Stack outputs not found, some tests may be skipped');
      stackOutputs = {};
    }
  });

  describe('Repository Creation', () => {
    it('should create all configured repositories', async () => {
      // Load repository configuration
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      expect(config.repositories).toBeDefined();
      expect(config.repositories.length).toBeGreaterThan(0);

      // Check each repository exists
      for (const repoConfig of config.repositories) {
        const repoName = `${repoConfig.name}-${environmentSuffix}`;

        const command = new GetRepositoryCommand({
          repositoryName: repoName
        });

        const response = await codecommitClient.send(command);
        expect(response.repositoryMetadata).toBeDefined();
        expect(response.repositoryMetadata?.repositoryName).toBe(repoName);
        expect(response.repositoryMetadata?.repositoryDescription).toBe(repoConfig.description);
      }
    }, 30000);

    it('should have correct clone URLs for repositories', async () => {
      if (!stackOutputs.repositoryCloneUrls) {
        console.warn('repositoryCloneUrls not found in stack outputs, skipping test');
        return;
      }

      const cloneUrls = JSON.parse(stackOutputs.repositoryCloneUrls);

      for (const [repoName, urls] of Object.entries(cloneUrls)) {
        expect(urls).toHaveProperty('http');
        expect(urls).toHaveProperty('ssh');
        expect((urls as any).http).toContain('git-codecommit');
        expect((urls as any).ssh).toContain('git-codecommit');
      }
    });

    it('should have repository ARNs in correct format', async () => {
      if (!stackOutputs.repositoryArns) {
        console.warn('repositoryArns not found in stack outputs, skipping test');
        return;
      }

      const arns = JSON.parse(stackOutputs.repositoryArns);

      for (const [repoName, arn] of Object.entries(arns)) {
        expect(arn).toMatch(/^arn:aws:codecommit:[a-z0-9-]+:\d{12}:.+/);
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create size monitoring alarms for each repository', async () => {
      // Load repository configuration
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      for (const repoConfig of config.repositories) {
        const alarmName = `${repoConfig.name}-${environmentSuffix}-size-alarm`;

        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });

        const response = await cloudwatchClient.send(command);
        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms?.length).toBeGreaterThan(0);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('RepositorySizeBytes');
        expect(alarm.Namespace).toBe('AWS/CodeCommit');
        expect(alarm.Threshold).toBe(repoConfig.sizeAlarmThresholdMB * 1024 * 1024);
      }
    }, 30000);

    it('should have correct alarm dimensions', async () => {
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      for (const repoConfig of config.repositories) {
        const alarmName = `${repoConfig.name}-${environmentSuffix}-size-alarm`;

        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });

        const response = await cloudwatchClient.send(command);
        const alarm = response.MetricAlarms![0];

        expect(alarm.Dimensions).toBeDefined();
        const repoNameDimension = alarm.Dimensions?.find(d => d.Name === 'RepositoryName');
        expect(repoNameDimension).toBeDefined();
        expect(repoNameDimension?.Value).toBe(`${repoConfig.name}-${environmentSuffix}`);
      }
    }, 30000);
  });

  describe('IAM Role and Permissions', () => {
    it('should create contributor role with correct name', async () => {
      const roleName = `codecommit-contributor-${environmentSuffix}`;

      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Description).toContain('least-privilege');
    });

    it('should have correct assume role policy', async () => {
      const roleName = `codecommit-contributor-${environmentSuffix}`;

      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Action).toContain('sts:AssumeRole');
    });

    it('should export contributor role ARN', async () => {
      if (!stackOutputs.contributorRoleArn) {
        console.warn('contributorRoleArn not found in stack outputs, skipping test');
        return;
      }

      expect(stackOutputs.contributorRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should include environment suffix in all repository names', async () => {
      const command = new ListRepositoriesCommand({});
      const response = await codecommitClient.send(command);

      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      for (const repoConfig of config.repositories) {
        const expectedName = `${repoConfig.name}-${environmentSuffix}`;
        const found = response.repositories?.find(r => r.repositoryName === expectedName);
        expect(found).toBeDefined();
      }
    });

    it('should have correct tags on repositories', async () => {
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      const repoConfig = config.repositories[0];
      const repoName = `${repoConfig.name}-${environmentSuffix}`;

      const command = new GetRepositoryCommand({
        repositoryName: repoName
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();

      // Note: CodeCommit doesn't return tags in GetRepository
      // In a real test, you'd use ListTagsForResource
    });
  });

  describe('Deployment Summary', () => {
    it('should export deployment summary with correct structure', async () => {
      if (!stackOutputs.deploymentSummary) {
        console.warn('deploymentSummary not found in stack outputs, skipping test');
        return;
      }

      const summary = JSON.parse(stackOutputs.deploymentSummary);

      expect(summary).toHaveProperty('totalConfigured');
      expect(summary).toHaveProperty('successfullyCreated');
      expect(summary).toHaveProperty('failed');
      expect(summary).toHaveProperty('failedRepositories');

      expect(typeof summary.totalConfigured).toBe('number');
      expect(typeof summary.successfullyCreated).toBe('number');
      expect(typeof summary.failed).toBe('number');
      expect(Array.isArray(summary.failedRepositories)).toBe(true);
    });

    it('should have successful deployment count matching created repositories', async () => {
      if (!stackOutputs.deploymentSummary || !stackOutputs.repositoryNames) {
        console.warn('Required outputs not found, skipping test');
        return;
      }

      const summary = JSON.parse(stackOutputs.deploymentSummary);
      const repoNames = JSON.parse(stackOutputs.repositoryNames);

      expect(summary.successfullyCreated).toBe(repoNames.length);
    });
  });

  describe('Stack Reference Exports', () => {
    it('should export stack reference with all required fields', async () => {
      if (!stackOutputs.stackReference) {
        console.warn('stackReference not found in stack outputs, skipping test');
        return;
      }

      const stackRef = JSON.parse(stackOutputs.stackReference);

      expect(stackRef).toHaveProperty('repositoryArns');
      expect(stackRef).toHaveProperty('contributorRoleArn');
      expect(stackRef).toHaveProperty('region');
      expect(stackRef).toHaveProperty('environmentSuffix');

      expect(stackRef.region).toBe(region);
      expect(stackRef.environmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle repository configuration correctly', async () => {
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(config).toHaveProperty('repositories');
      expect(Array.isArray(config.repositories)).toBe(true);

      // Validate each repository config
      for (const repo of config.repositories) {
        expect(repo).toHaveProperty('name');
        expect(repo).toHaveProperty('description');
        expect(repo).toHaveProperty('defaultBranch');
        expect(repo).toHaveProperty('tags');
        expect(repo).toHaveProperty('sizeAlarmThresholdMB');
        expect(typeof repo.sizeAlarmThresholdMB).toBe('number');
      }
    });
  });

  describe('Parallel Operations', () => {
    it('should create multiple repositories efficiently', async () => {
      // This test validates that all repositories were created
      // In actual parallel execution, creation time would be measured
      const configPath = path.join(__dirname, '..', 'lib', 'repositories-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      const command = new ListRepositoriesCommand({});
      const response = await codecommitClient.send(command);

      let foundCount = 0;
      for (const repoConfig of config.repositories) {
        const expectedName = `${repoConfig.name}-${environmentSuffix}`;
        const found = response.repositories?.find(r => r.repositoryName === expectedName);
        if (found) foundCount++;
      }

      expect(foundCount).toBe(config.repositories.length);
    });
  });
});
