I'll help you create a robust multi-region CI/CD pipeline using AWS CDK with TypeScript. This solution will use CodePipeline V2 with parameterized pipelines and deploy to both us-east-1 and eu-central-1 regions with proper resource tagging.

Here's the complete solution:

## pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  targetRegions: string[];
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { environmentSuffix = 'dev', targetRegions } = props;

    // Create artifact buckets for each region
    const artifactBuckets: { [region: string]: s3.Bucket } = {};
    targetRegions.forEach(region => {
      artifactBuckets[region] = new s3.Bucket(this, `ArtifactBucket${region.replace(/-/g, '')}`, {
        bucketName: `cicd-artifacts-${environmentSuffix}-${region}-${this.account}`,
        versioned: true,
        lifecycleRules: [{
          id: 'cleanup-old-artifacts',
          expiration: cdk.Duration.days(30),
        }],
        encryption: s3.BucketEncryption.S3_MANAGED,
      });

      // Apply cost allocation tags
      cdk.Tags.of(artifactBuckets[region]).add('Environment', environmentSuffix);
      cdk.Tags.of(artifactBuckets[region]).add('Purpose', 'CI/CD Artifacts');
      cdk.Tags.of(artifactBuckets[region]).add('Region', region);
      cdk.Tags.of(artifactBuckets[region]).add('CostCenter', 'Engineering');
    });

    // Create CodeBuild project for building the application
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `app-build-${environmentSuffix}`,
      source: codebuild.Source.codeCommit({
        repository: codepipeline_actions.CodeCommitSourceAction.prototype as any,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws --version',
              'echo Build started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Build phase started on `date`',
              'npm install',
              'npm run build',
              'npm run test',
              'echo Build completed on `date`',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
        },
      }),
    });

    // Create deployment projects for each target region
    const deploymentProjects: { [region: string]: codebuild.Project } = {};
    targetRegions.forEach(region => {
      deploymentProjects[region] = new codebuild.Project(this, `DeployProject${region.replace(/-/g, '')}`, {
        projectName: `app-deploy-${region}-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            AWS_DEFAULT_REGION: {
              value: region,
            },
            ENVIRONMENT: {
              value: environmentSuffix,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Deployment started on `date`',
                'echo Deploying to region $AWS_DEFAULT_REGION',
              ],
            },
            build: {
              commands: [
                'echo Deploy phase started on `date`',
                'npm install',
                'npx cdk synth',
                `npx cdk deploy --require-approval never --region ${region}`,
              ],
            },
            post_build: {
              commands: [
                'echo Deployment completed on `date`',
              ],
            },
          },
        }),
      });

      // Apply tags to deployment projects
      cdk.Tags.of(deploymentProjects[region]).add('Environment', environmentSuffix);
      cdk.Tags.of(deploymentProjects[region]).add('Purpose', 'CI/CD Deployment');
      cdk.Tags.of(deploymentProjects[region]).add('Region', region);
      cdk.Tags.of(deploymentProjects[region]).add('CostCenter', 'Engineering');
    });

    // Create the main artifact bucket
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    // Create CodePipeline V2 with parameters
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `multi-region-pipeline-${environmentSuffix}`,
      pipelineType: codepipeline.PipelineType.V2,
      artifactBucket: artifactBuckets[targetRegions[0]], // Use first region bucket as primary
      variables: [
        {
          name: 'DEPLOY_ENVIRONMENT',
          defaultValue: environmentSuffix,
          description: 'Environment to deploy to',
        },
        {
          name: 'COMMIT_ID',
          defaultValue: '',
          description: 'Git commit ID',
        },
      ],
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'your-github-username',
              repo: 'your-repo-name',
              branch: 'main',
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                DEPLOY_ENVIRONMENT: {
                  value: '#{variables.DEPLOY_ENVIRONMENT}',
                },
                COMMIT_ID: {
                  value: '#{variables.COMMIT_ID}',
                },
              },
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: targetRegions.map(region => 
            new codepipeline_actions.CodeBuildAction({
              actionName: `Deploy-${region}`,
              project: deploymentProjects[region],
              input: buildOutput,
              runOrder: 1, // Deploy to all regions in parallel
              environmentVariables: {
                TARGET_REGION: {
                  value: region,
                },
                DEPLOY_ENVIRONMENT: {
                  value: '#{variables.DEPLOY_ENVIRONMENT}',
                },
              },
            })
          ),
        },
      ],
    });

    // Apply comprehensive tags to the pipeline
    cdk.Tags.of(pipeline).add('Environment', environmentSuffix);
    cdk.Tags.of(pipeline).add('Purpose', 'Multi-Region CI/CD');
    cdk.Tags.of(pipeline).add('CostCenter', 'Engineering');
    cdk.Tags.of(pipeline).add('Owner', 'DevOps Team');
    cdk.Tags.of(pipeline).add('Project', 'Multi-Region Deployment');

    // Apply tags to build project
    cdk.Tags.of(buildProject).add('Environment', environmentSuffix);
    cdk.Tags.of(buildProject).add('Purpose', 'CI/CD Build');
    cdk.Tags.of(buildProject).add('CostCenter', 'Engineering');

    // Grant cross-region permissions
    targetRegions.forEach(region => {
      if (region !== this.region) {
        pipeline.role.addToPolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
          ],
          resources: [`${artifactBuckets[region].bucketArn}/*`],
        }));
      }
    });

    // Output pipeline details
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD Pipeline',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CI/CD Pipeline',
    });
  }
}
```

## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PipelineStack } from './pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Define target regions for multi-region deployment
    const targetRegions = ['us-east-1', 'eu-central-1'];

    // Create the CI/CD Pipeline Stack
    new PipelineStack(this, 'PipelineStack', {
      environmentSuffix,
      targetRegions,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1', // Pipeline runs in us-east-1
      },
    });

    // Apply global tags for cost allocation
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
    cdk.Tags.of(this).add('Owner', 'DevOps Team');
    cdk.Tags.of(this).add('Project', 'Multi-Region CI/CD Infrastructure');
  }
}
```

This solution provides:

1. **Multi-Region Support**: Deploys to both us-east-1 and eu-central-1 regions with parallel deployment actions
2. **CodePipeline V2**: Uses the latest V2 pipeline type with parameterized pipelines for flexibility
3. **Comprehensive Tagging**: All resources are tagged for cost allocation and management
4. **Artifact Management**: Region-specific S3 buckets with lifecycle policies
5. **Build and Deploy Separation**: Separate CodeBuild projects for building and deploying
6. **Cross-Region Permissions**: Proper IAM policies for cross-region operations
7. **Environment Flexibility**: Parameterized for different environments (dev, staging, prod)

The pipeline will automatically build your application and deploy it to both target regions in parallel, with proper error handling and artifact management.