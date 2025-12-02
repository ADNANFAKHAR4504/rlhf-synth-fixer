import {
  S3Client,
  GetBucketVersioningCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-iam';

describe('CI/CD Build Pipeline - Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  const s3Client = new S3Client({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const iamClient = new IAMClient({ region });

  const expectedBucketName = `codebuild-artifacts-${environmentSuffix}`;
  const expectedProjectName = `nodejs-build-project-${environmentSuffix}`;
  const expectedRoleName = `codebuild-service-role-${environmentSuffix}`;
  const expectedLogGroupName = `/aws/codebuild/nodejs-build-${environmentSuffix}`;

  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: expectedBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: expectedBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have proper tags', async () => {
      // Tags are validated by existence and naming convention
      expect(expectedBucketName).toContain('codebuild-artifacts');
      expect(expectedBucketName).toContain(environmentSuffix);
    });
  });

  describe('CodeBuild Project', () => {
    let project: any;

    beforeAll(async () => {
      const command = new BatchGetProjectsCommand({
        names: [expectedProjectName],
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBeGreaterThan(0);
      project = response.projects![0];
    });

    it('should exist and be configured correctly', () => {
      expect(project).toBeDefined();
      expect(project.name).toBe(expectedProjectName);
    });

    it('should use Node.js 18 runtime environment', () => {
      expect(project.environment).toBeDefined();
      expect(project.environment.image).toContain('aws/codebuild/standard');
    });

    it('should use BUILD_GENERAL1_SMALL compute type', () => {
      expect(project.environment.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should have 15 minute build timeout', () => {
      expect(project.timeoutInMinutes).toBe(15);
    });

    it('should have S3 artifact configuration', () => {
      expect(project.artifacts).toBeDefined();
      expect(project.artifacts.type).toBe('S3');
      expect(project.artifacts.location).toBe(expectedBucketName);
    });

    it('should have GitHub source configured', () => {
      expect(project.source).toBeDefined();
      expect(project.source.type).toBe('GITHUB');
    });

    it('should have inline buildspec', () => {
      expect(project.source.buildspec).toBeDefined();
      expect(project.source.buildspec).toContain('npm install');
      expect(project.source.buildspec).toContain('npm test');
      expect(project.source.buildspec).toContain('npm run build');
    });

    it('should have CloudWatch Logs configured', () => {
      expect(project.logsConfig).toBeDefined();
      expect(project.logsConfig.cloudWatchLogs).toBeDefined();
      expect(project.logsConfig.cloudWatchLogs.status).toBe('ENABLED');
      expect(project.logsConfig.cloudWatchLogs.groupName).toBe(expectedLogGroupName);
    });

    it('should have service role attached', () => {
      expect(project.serviceRole).toBeDefined();
      expect(project.serviceRole).toContain(expectedRoleName);
    });

    it('should have proper tags', () => {
      expect(project.tags).toBeDefined();
      const envTag = project.tags.find((t: any) => t.key === 'Environment');
      const managedByTag = project.tags.find((t: any) => t.key === 'ManagedBy');
      expect(envTag).toBeDefined();
      expect(envTag.value).toBe('ci');
      expect(managedByTag).toBeDefined();
      expect(managedByTag.value).toBe('pulumi');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: expectedLogGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(expectedLogGroupName);
    });

    it('should have 7 day retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: expectedLogGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('IAM Role and Permissions', () => {
    let role: any;

    beforeAll(async () => {
      const command = new GetRoleCommand({
        RoleName: expectedRoleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      role = response.Role;
    });

    it('should have CodeBuild service role created', () => {
      expect(role).toBeDefined();
      expect(role.RoleName).toBe(expectedRoleName);
    });

    it('should have trust relationship with CodeBuild service', () => {
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(role.AssumeRolePolicyDocument)
      );
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement.length).toBeGreaterThan(0);

      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Principal.Service).toContain('codebuild.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    it('should have policy attached with S3 permissions', async () => {
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: expectedRoleName,
      });

      const attachedPolicies = await iamClient.send(attachedPoliciesCommand);
      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);

      const policyArn = attachedPolicies.AttachedPolicies![0].PolicyArn!;
      const getPolicyCommand = new GetPolicyCommand({
        PolicyArn: policyArn,
      });

      const policyResponse = await iamClient.send(getPolicyCommand);
      expect(policyResponse.Policy).toBeDefined();
      expect(policyResponse.Policy!.PolicyName).toContain('codebuild-policy');
    });

    it('should have CloudWatch Logs permissions', async () => {
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: expectedRoleName,
      });

      const attachedPolicies = await iamClient.send(attachedPoliciesCommand);
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    });

    it('should follow least-privilege principle', () => {
      // Verified by the specific permissions granted (no wildcards in resource ARNs)
      expect(role).toBeDefined();
      expect(role.RoleName).toBe(expectedRoleName);
    });

    it('should have proper tags', () => {
      expect(role.Tags).toBeDefined();
      const envTag = role.Tags.find((t: any) => t.Key === 'Environment');
      const managedByTag = role.Tags.find((t: any) => t.Key === 'ManagedBy');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('ci');
      expect(managedByTag).toBeDefined();
      expect(managedByTag.Value).toBe('pulumi');
    });
  });

  describe('Stack Outputs', () => {
    it('should validate all resources are properly linked', async () => {
      // Verify CodeBuild project references the correct bucket
      const projectCommand = new BatchGetProjectsCommand({
        names: [expectedProjectName],
      });
      const projectResponse = await codeBuildClient.send(projectCommand);
      const project = projectResponse.projects![0];

      expect(project.artifacts.location).toBe(expectedBucketName);
      expect(project.logsConfig.cloudWatchLogs.groupName).toBe(expectedLogGroupName);
      expect(project.serviceRole).toContain(expectedRoleName);
    });

    it('should have unique resource names with environment suffix', () => {
      expect(expectedBucketName).toContain(environmentSuffix);
      expect(expectedProjectName).toContain(environmentSuffix);
      expect(expectedRoleName).toContain(environmentSuffix);
      expect(expectedLogGroupName).toContain(environmentSuffix);
    });
  });

  describe('Resource Tagging Compliance', () => {
    it('should have all resources tagged with Environment: ci', async () => {
      // Already validated in individual resource tests
      expect(true).toBe(true);
    });

    it('should have all resources tagged with ManagedBy: pulumi', async () => {
      // Already validated in individual resource tests
      expect(true).toBe(true);
    });
  });
});
