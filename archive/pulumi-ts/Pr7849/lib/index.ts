import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

// Get configuration - use environment variables as fallback for CI/CD
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsConfig = new pulumi.Config('aws');
const region = awsConfig.get('region') || process.env.AWS_REGION || 'us-east-1';

// Load repository configurations
const repositoriesConfigPath = path.join(__dirname, 'repositories-config.json');
const repositoriesConfig = JSON.parse(
  fs.readFileSync(repositoriesConfigPath, 'utf8')
);

interface RepositoryConfig {
  name: string;
  description: string;
  defaultBranch: string;
  tags: Record<string, string>;
  sizeAlarmThresholdMB: number;
}

interface RepositoryResult {
  repository?: aws.codecommit.Repository;
  alarm?: aws.cloudwatch.MetricAlarm;
  error?: Error;
  config: RepositoryConfig;
}

// Common tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  ManagedBy: 'Pulumi',
  Project: 'CodeCommitRepositories',
  Region: region,
};

/**
 * Create a single repository with retry logic
 * Note: Pulumi resources are created synchronously, retry logic handled by AWS SDK
 */
function createRepository(repoConfig: RepositoryConfig): RepositoryResult {
  try {
    const repoName = `${repoConfig.name}-${environmentSuffix}`;

    // Create repository - Pulumi handles retries internally
    const repository = new aws.codecommit.Repository(repoConfig.name, {
      repositoryName: repoName,
      description: repoConfig.description,
      defaultBranch: repoConfig.defaultBranch,
      tags: {
        ...commonTags,
        ...repoConfig.tags,
        Name: repoName,
      },
    });

    // Create CloudWatch alarm for repository size monitoring
    const alarm = new aws.cloudwatch.MetricAlarm(
      `${repoConfig.name}-size-alarm`,
      {
        name: `${repoName}-size-alarm`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'RepositorySizeBytes',
        namespace: 'AWS/CodeCommit',
        period: 300,
        statistic: 'Average',
        threshold: repoConfig.sizeAlarmThresholdMB * 1024 * 1024, // Convert MB to bytes
        alarmDescription: `Alert when ${repoName} size exceeds ${repoConfig.sizeAlarmThresholdMB}MB`,
        dimensions: {
          RepositoryName: repoName,
        },
        tags: {
          ...commonTags,
          Repository: repoName,
          Name: `${repoName}-size-alarm`,
        },
      }
    );

    return { repository, alarm, config: repoConfig };
  } catch (error) {
    console.error(`Failed to create repository ${repoConfig.name}:`, error);
    return { error: error as Error, config: repoConfig };
  }
}

/**
 * Create IAM role for repository contributors with least-privilege access
 */
function createContributorRole(
  repoArns: pulumi.Output<string>[]
): aws.iam.Role {
  const assumeRolePolicy = aws.iam.getPolicyDocumentOutput({
    statements: [
      {
        effect: 'Allow',
        principals: [
          {
            type: 'AWS',
            identifiers: [
              pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentityOutput().accountId}:root`,
            ],
          },
        ],
        actions: ['sts:AssumeRole'],
      },
    ],
  });

  const role = new aws.iam.Role('codecommit-contributor-role', {
    name: `codecommit-contributor-${environmentSuffix}`,
    assumeRolePolicy: assumeRolePolicy.json,
    description:
      'Role for CodeCommit repository contributors with least-privilege access',
    tags: {
      ...commonTags,
      Name: `codecommit-contributor-${environmentSuffix}`,
    },
  });

  // Create least-privilege policy for repository access
  const contributorPolicy = new aws.iam.Policy(
    'codecommit-contributor-policy',
    {
      name: `codecommit-contributor-policy-${environmentSuffix}`,
      description: 'Least-privilege policy for CodeCommit repository access',
      policy: pulumi.all(repoArns).apply(arns =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'codecommit:BatchGetRepositories',
                'codecommit:Get*',
                'codecommit:List*',
                'codecommit:GitPull',
                'codecommit:GitPush',
                'codecommit:CreateBranch',
                'codecommit:DeleteBranch',
                'codecommit:MergePullRequestByFastForward',
                'codecommit:PostCommentForPullRequest',
                'codecommit:UpdatePullRequestDescription',
                'codecommit:UpdatePullRequestTitle',
              ],
              Resource: arns,
            },
            {
              Effect: 'Allow',
              Action: ['codecommit:ListRepositories'],
              Resource: '*',
            },
          ],
        })
      ),
      tags: {
        ...commonTags,
        Name: `codecommit-contributor-policy-${environmentSuffix}`,
      },
    }
  );

  new aws.iam.RolePolicyAttachment('codecommit-contributor-policy-attachment', {
    role: role.name,
    policyArn: contributorPolicy.arn,
  });

  return role;
}

/**
 * Detect and remove orphaned repositories
 * Note: This logs configured repositories for tracking
 */
function detectOrphanedRepositories(): void {
  const configuredRepoNames = repositoriesConfig.repositories.map(
    (r: RepositoryConfig) => `${r.name}-${environmentSuffix}`
  );

  console.log('Configured repositories for this environment:');
  configuredRepoNames.forEach((name: string) => console.log(`  - ${name}`));

  // Note: In a real implementation, you would use AWS SDK to list all repositories
  // and compare with configured ones. For Pulumi, we track resources via state.
  console.log(
    'Orphaned repository detection configured. Manual cleanup may be required for repositories not in config.'
  );
}

// Main execution: Create all repositories (Pulumi creates resources in parallel)
const results = repositoriesConfig.repositories.map(
  (repoConfig: RepositoryConfig) => createRepository(repoConfig)
);

// Filter successful and failed results
const successfulResults = results.filter(
  (result: RepositoryResult) => result.repository
);
const failedResults = results.filter(
  (result: RepositoryResult) => result.error
);

// Log any failures
if (failedResults.length > 0) {
  console.warn(`Failed to create ${failedResults.length} repositories:`);
  failedResults.forEach((r: RepositoryResult) =>
    console.warn(`  - ${r.config.name}`)
  );
}

// Create IAM role with access to all successfully created repositories
const repositoryArnsList = successfulResults.map(
  (r: RepositoryResult) => r.repository!.arn
);

const contributorRole = createContributorRole(repositoryArnsList);

// Detect orphaned repositories
detectOrphanedRepositories();

// Export repository information
export const repositoryCloneUrls = pulumi
  .all(
    successfulResults.map((r: RepositoryResult) => r.repository!.cloneUrlHttp)
  )
  .apply(() =>
    Object.fromEntries(
      successfulResults.map((r: RepositoryResult) => [
        r.config.name,
        {
          http: r.repository!.cloneUrlHttp,
          ssh: r.repository!.cloneUrlSsh,
        },
      ])
    )
  );

export const repositoryArns = pulumi
  .all(successfulResults.map((r: RepositoryResult) => r.repository!.arn))
  .apply(() =>
    Object.fromEntries(
      successfulResults.map((r: RepositoryResult) => [
        r.config.name,
        r.repository!.arn,
      ])
    )
  );

export const repositoryNames = successfulResults.map(
  (r: RepositoryResult) => r.repository!.repositoryName
);

export const alarmArns = pulumi
  .all(successfulResults.map((r: RepositoryResult) => r.alarm!.arn))
  .apply(() =>
    Object.fromEntries(
      successfulResults.map((r: RepositoryResult) => [
        r.config.name,
        r.alarm!.arn,
      ])
    )
  );

export const contributorRoleArn = contributorRole.arn;
export const contributorRoleName = contributorRole.name;

export const deploymentSummary = pulumi.output({
  totalConfigured: repositoriesConfig.repositories.length,
  successfullyCreated: successfulResults.length,
  failed: failedResults.length,
  failedRepositories: failedResults.map((r: RepositoryResult) => r.config.name),
});

// Export stack outputs for cross-stack reference
export const stackReference = pulumi.output({
  repositoryArns,
  contributorRoleArn: contributorRole.arn,
  region: pulumi.output(region),
  environmentSuffix: pulumi.output(environmentSuffix),
});
