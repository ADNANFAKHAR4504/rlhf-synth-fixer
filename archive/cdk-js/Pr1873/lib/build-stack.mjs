import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as logs from 'aws-cdk-lib/aws-logs';

export class BuildStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix, artifactsBucket, buildRole } = props;

    // Build project for application compilation
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `cicd-build-${environmentSuffix}`,
      role: buildRole,
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
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'echo Pre-build completed on `date`',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the application...',
              'npm install',
              'npm run build',
              'echo Build completed on `date`',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Creating deployment package...',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: true,
      }),
      logging: {
        cloudWatch: {
          enabled: true,
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/cicd-build-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_MONTH,
          }),
        },
      },
    });

    // Test project for running unit and integration tests
    this.testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `cicd-test-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Test phase started on `date`',
              'npm install',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit',
              'echo Running integration tests...',
              'npm run test:integration',
              'echo Running security scans...',
              'npm audit --audit-level moderate',
            ],
          },
          post_build: {
            commands: [
              'echo Test phase completed on `date`',
            ],
          },
        },
        reports: {
          TestReports: {
            files: [
              'test-results.xml',
              'coverage-report.xml',
            ],
            'file-format': 'JUNITXML',
          },
        },
      }),
      logging: {
        cloudWatch: {
          enabled: true,
          logGroup: new logs.LogGroup(this, 'TestLogGroup', {
            logGroupName: `/aws/codebuild/cicd-test-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_MONTH,
          }),
        },
      },
    });

    // Tags
    cdk.Tags.of(this.buildProject).add('Purpose', 'Build');
    cdk.Tags.of(this.testProject).add('Purpose', 'Test');
  }
}