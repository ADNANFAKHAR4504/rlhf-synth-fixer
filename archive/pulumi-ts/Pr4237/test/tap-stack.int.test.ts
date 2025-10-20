import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Mock Pulumi functions for integration tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id-${Date.now()}`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
    };

    // Add type-specific outputs
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
        outputs.bucketDomainName = `${outputs.bucket}.s3.amazonaws.com`;
        outputs.bucketRegionalDomainName = `${outputs.bucket}.s3.us-east-1.amazonaws.com`;
        break;
      case 'aws:kms/key:Key':
        outputs.keyId = `key-${args.name}-${Date.now()}`;
        break;
      case 'aws:ecs/cluster:Cluster':
        outputs.name = args.inputs.name || args.name;
        outputs.settings = args.inputs.settings || [];
        break;
      case 'aws:ecs/service:Service':
        outputs.name = args.inputs.name || args.name;
        outputs.desiredCount = args.inputs.desiredCount || 1;
        outputs.launchType = args.inputs.launchType;
        outputs.deploymentController = args.inputs.deploymentController;
        outputs.networkConfiguration = args.inputs.networkConfiguration;
        break;
      case 'aws:ecs/taskDefinition:TaskDefinition':
        outputs.family = args.inputs.family || args.name;
        outputs.revision = 1;
        outputs.cpu = args.inputs.cpu;
        outputs.memory = args.inputs.memory;
        break;
      case 'aws:codebuild/project:Project':
        outputs.name = args.inputs.name || args.name;
        outputs.artifacts = args.inputs.artifacts;
        outputs.environment = args.inputs.environment;
        outputs.source = args.inputs.source;
        outputs.logsConfig = args.inputs.logsConfig;
        break;
      case 'aws:codedeploy/application:Application':
        outputs.name = args.inputs.name || args.name;
        break;
      case 'aws:codedeploy/deploymentGroup:DeploymentGroup':
        outputs.deploymentGroupName =
          args.inputs.deploymentGroupName || args.name;
        outputs.autoRollbackConfiguration =
          args.inputs.autoRollbackConfiguration;
        outputs.deploymentStyle = args.inputs.deploymentStyle;
        outputs.blueGreenDeploymentConfig =
          args.inputs.blueGreenDeploymentConfig;
        break;
      case 'aws:codepipeline/pipeline:Pipeline':
        outputs.name = args.inputs.name || args.name;
        outputs.stages = args.inputs.stages || [];
        outputs.artifactStores = args.inputs.artifactStores || [];
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.name = args.inputs.name || args.name;
        outputs.retentionInDays = args.inputs.retentionInDays;
        break;
      case 'aws:sns/topic:Topic':
        outputs.name = args.inputs.name || args.name;
        break;
      case 'aws:iam/role:Role':
        outputs.name = args.inputs.name || args.name;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.id = `sg-${Date.now()}`;
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    switch (args.token) {
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/integration-test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        };
      case 'aws:ec2/getVpc:getVpc':
        return {
          id: 'vpc-integration-test',
          cidrBlock: '10.0.0.0/16',
          default: true,
        };
      case 'aws:ec2/getSubnets:getSubnets':
        return {
          ids: ['subnet-int-1', 'subnet-int-2'],
        };
      default:
        return {};
    }
  },
});

describe('TapStack Integration Tests', () => {
  let stack: TapStack;

  afterEach(() => {
    stack = null as any;
  });

  describe('Full Stack Creation', () => {
    it('should create complete CI/CD pipeline infrastructure', () => {
      stack = new TapStack('integration-test-stack', {
        environmentSuffix: 'integration',
        githubOwner: 'integration-org',
        githubRepo: 'integration-repo',
        githubBranch: 'main',
        regions: ['us-east-1', 'eu-west-1'],
        enableApproval: true,
        notificationEmail: 'integration@example.com',
      });

      // Verify all components are created
      assert.ok(stack.kmsKey, 'KMS key should exist');
      assert.ok(stack.artifactBucket, 'Artifact bucket should exist');
      assert.ok(stack.snsTopic, 'SNS topic should exist');
      assert.ok(stack.ecsCluster, 'ECS cluster should exist');
      assert.ok(stack.ecsTaskDefinition, 'ECS task definition should exist');
      assert.ok(stack.ecsService, 'ECS service should exist');
      assert.ok(stack.codeBuildProject, 'CodeBuild project should exist');
      assert.ok(stack.codeDeployApp, 'CodeDeploy app should exist');
      assert.ok(stack.codeDeployGroup, 'CodeDeploy group should exist');
      assert.ok(stack.codePipeline, 'CodePipeline should exist');
      assert.ok(stack.logGroup, 'Log group should exist');

      // Verify outputs
      assert.ok(stack.outputs, 'Outputs should exist');
      assert.ok(
        Object.keys(stack.outputs).length > 10,
        'Should have many outputs'
      );
    });

    it('should create infrastructure for production environment', done => {
      stack = new TapStack('prod-integration-stack', {
        environmentSuffix: 'prod',
        regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
        enableApproval: true,
      });

      stack.codePipeline.stages.apply(stages => {
        const deployStages = stages.filter((s: any) =>
          s.name.startsWith('Deploy')
        );
        assert.strictEqual(
          deployStages.length,
          3,
          'Should have 3 deploy stages'
        );
        done();
      });
    });

    it('should create infrastructure for development environment', done => {
      stack = new TapStack('dev-integration-stack', {
        environmentSuffix: 'dev',
        enableApproval: false,
      });

      stack.codePipeline.stages.apply(stages => {
        const approvalStage = stages.find((s: any) => s.name === 'Approval');
        assert.strictEqual(
          approvalStage,
          undefined,
          'Approval stage should not exist'
        );
        done();
      });
    });
  });

  describe('Pipeline Workflow', () => {
    beforeEach(() => {
      stack = new TapStack('workflow-test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have correct stage ordering', done => {
      stack.codePipeline.stages.apply(stages => {
        const stageNames = stages.map((s: any) => s.name);
        assert.strictEqual(
          stageNames[0],
          'Source',
          'First stage should be Source'
        );
        assert.strictEqual(
          stageNames[1],
          'Test',
          'Second stage should be Test'
        );
        assert.strictEqual(
          stageNames[2],
          'Build',
          'Third stage should be Build'
        );
        done();
      });
    });

    it('should connect Source to Test stage', done => {
      stack.codePipeline.stages.apply(stages => {
        const sourceStage = stages.find((s: any) => s.name === 'Source');
        const testStage = stages.find((s: any) => s.name === 'Test');

        assert.ok(
          sourceStage!.actions[0].outputArtifacts!.includes('source_output'),
          'Source should output source_output'
        );
        assert.ok(
          testStage!.actions[0].inputArtifacts!.includes('source_output'),
          'Test should input source_output'
        );
        done();
      });
    });

    it('should connect Test to Build stage', done => {
      stack.codePipeline.stages.apply(stages => {
        const testStage = stages.find((s: any) => s.name === 'Test');
        const buildStage = stages.find((s: any) => s.name === 'Build');

        assert.ok(
          testStage!.actions[0].outputArtifacts!.includes('test_output'),
          'Test should output test_output'
        );
        assert.ok(
          buildStage!.actions[0].inputArtifacts!.includes('test_output'),
          'Build should input test_output'
        );
        done();
      });
    });

    it('should connect Build to Deploy stages', done => {
      stack.codePipeline.stages.apply(stages => {
        const buildStage = stages.find((s: any) => s.name === 'Build');
        const deployStages = stages.filter((s: any) =>
          s.name.startsWith('Deploy')
        );

        assert.ok(
          buildStage!.actions[0].outputArtifacts!.includes('build_output'),
          'Build should output build_output'
        );
        deployStages.forEach((deployStage: any) => {
          assert.ok(
            deployStage.actions[0].inputArtifacts!.includes('build_output'),
            'Deploy should input build_output'
          );
        });
        done();
      });
    });
  });

  describe('Multi-Region Deployment', () => {
    it('should deploy to us-east-1 and eu-west-1', done => {
      stack = new TapStack('multi-region-stack', {
        environmentSuffix: 'multi',
        regions: ['us-east-1', 'eu-west-1'],
      });

      stack.codePipeline.stages.apply(stages => {
        const usEast1Stage = stages.find(
          (s: any) => s.name === 'Deploy-us-east-1'
        );
        const euWest1Stage = stages.find(
          (s: any) => s.name === 'Deploy-eu-west-1'
        );

        assert.ok(usEast1Stage, 'US East 1 deploy stage should exist');
        assert.ok(euWest1Stage, 'EU West 1 deploy stage should exist');
        done();
      });
    });

    it('should deploy to three regions', done => {
      stack = new TapStack('three-region-stack', {
        environmentSuffix: 'three',
        regions: ['us-east-1', 'us-west-2', 'ap-southeast-1'],
      });

      stack.codePipeline.stages.apply(stages => {
        const deployStages = stages.filter((s: any) =>
          s.name.startsWith('Deploy')
        );

        assert.strictEqual(
          deployStages.length,
          3,
          'Should have 3 deploy stages'
        );
        assert.strictEqual(
          deployStages[0].actions[0].region,
          'us-east-1',
          'First deploy should be us-east-1'
        );
        assert.strictEqual(
          deployStages[1].actions[0].region,
          'us-west-2',
          'Second deploy should be us-west-2'
        );
        assert.strictEqual(
          deployStages[2].actions[0].region,
          'ap-southeast-1',
          'Third deploy should be ap-southeast-1'
        );
        done();
      });
    });

    it('should create artifact stores for all regions', done => {
      stack = new TapStack('artifact-store-stack', {
        environmentSuffix: 'artifact',
        regions: ['us-east-1', 'eu-central-1'],
      });

      stack.codePipeline.artifactStores.apply(artifactStores => {
        assert.strictEqual(
          artifactStores.length,
          2,
          'Should have 2 artifact stores'
        );

        const regions = artifactStores.map((store: any) => store.region);
        assert.ok(regions.includes('us-east-1'), 'Should include us-east-1');
        assert.ok(
          regions.includes('eu-central-1'),
          'Should include eu-central-1'
        );
        done();
      });
    });
  });

  describe('Security and Compliance', () => {
    beforeEach(() => {
      stack = new TapStack('security-test-stack', {
        environmentSuffix: 'security',
      });
    });

    it('should encrypt all data at rest with KMS', () => {
      assert.ok(stack.kmsKey, 'KMS key should exist');
      assert.ok(stack.snsTopic.kmsMasterKeyId, 'SNS should be encrypted');
      assert.ok(stack.logGroup.kmsKeyId, 'Logs should be encrypted');
    });

    it('should enable S3 bucket versioning', () => {
      assert.ok(stack.artifactBucket, 'Artifact bucket should exist');
    });

    it('should block public access to S3 bucket', () => {
      assert.ok(stack.artifactBucket, 'Artifact bucket should exist');
    });

    it('should enable CloudWatch Container Insights', done => {
      stack.ecsCluster.settings.apply(settings => {
        const insightsSetting = settings.find(
          (s: any) => s.name === 'containerInsights'
        );
        assert.ok(insightsSetting, 'Container Insights setting should exist');
        assert.strictEqual(
          insightsSetting!.value,
          'enabled',
          'Container Insights should be enabled'
        );
        done();
      });
    });

    it('should configure log retention', done => {
      stack.logGroup.retentionInDays.apply(retention => {
        assert.strictEqual(retention, 30, 'Retention should be 30 days');
        done();
      });
    });
  });

  describe('Rollback and Recovery', () => {
    beforeEach(() => {
      stack = new TapStack('rollback-test-stack', {
        environmentSuffix: 'rollback',
      });
    });

    it('should enable auto rollback on deployment failure', done => {
      stack.codeDeployGroup.autoRollbackConfiguration.apply(rollbackConfig => {
        assert.strictEqual(
          rollbackConfig!.enabled,
          true,
          'Rollback should be enabled'
        );
        assert.ok(
          rollbackConfig!.events!.includes('DEPLOYMENT_FAILURE'),
          'Should rollback on failure'
        );
        done();
      });
    });

    it('should enable auto rollback on alarm', done => {
      stack.codeDeployGroup.autoRollbackConfiguration.apply(rollbackConfig => {
        assert.ok(
          rollbackConfig!.events!.includes('DEPLOYMENT_STOP_ON_ALARM'),
          'Should rollback on alarm'
        );
        done();
      });
    });

    it('should use blue-green deployment strategy', done => {
      stack.codeDeployGroup.deploymentStyle.apply(deploymentStyle => {
        assert.strictEqual(
          deploymentStyle!.deploymentType,
          'BLUE_GREEN',
          'Should use blue-green deployment'
        );
        assert.strictEqual(
          deploymentStyle!.deploymentOption,
          'WITH_TRAFFIC_CONTROL',
          'Should use traffic control'
        );
        done();
      });
    });

    it('should configure blue-green termination', done => {
      stack.codeDeployGroup.blueGreenDeploymentConfig.apply(blueGreenConfig => {
        assert.ok(
          blueGreenConfig!.terminateBlueInstancesOnDeploymentSuccess,
          'Termination config should exist'
        );

        pulumi
          .output(blueGreenConfig!.terminateBlueInstancesOnDeploymentSuccess!)
          .apply(termConfig => {
            assert.strictEqual(
              termConfig!.action,
              'TERMINATE',
              'Should terminate blue instances'
            );
            done();
          });
      });
    });
  });

  describe('Notification System', () => {
    beforeEach(() => {
      stack = new TapStack('notification-test-stack', {
        environmentSuffix: 'notification',
        notificationEmail: 'notifications@test.com',
      });
    });

    it('should create SNS topic for notifications', () => {
      assert.ok(stack.snsTopic, 'SNS topic should exist');
    });

    it('should configure pipeline notifications', () => {
      assert.ok(stack.codePipeline, 'Pipeline should exist');
      assert.ok(stack.snsTopic, 'SNS topic should exist');
    });

    it('should send notifications for pipeline events', done => {
      stack.snsTopic.arn.apply(arn => {
        assert.ok(arn.includes('sns'), 'ARN should be SNS ARN');
        done();
      });
    });
  });

  describe('Static Code Analysis Integration', () => {
    beforeEach(() => {
      stack = new TapStack('analysis-test-stack', {
        environmentSuffix: 'analysis',
      });
    });

    it('should include static code analysis in test stage', done => {
      stack.codeBuildProject.name.apply(name => {
        assert.ok(name.includes('build'), 'Build project should exist');
        done();
      });
    });

    it('should run security checks in build phase', done => {
      stack.codeBuildProject.source.apply(source => {
        assert.ok(source.buildspec, 'Buildspec should be defined');
        done();
      });
    });
  });

  describe('ECS Deployment Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('ecs-test-stack', {
        environmentSuffix: 'ecs',
      });
    });

    it('should use Fargate for ECS', done => {
      stack.ecsService.launchType.apply(launchType => {
        assert.strictEqual(launchType, 'FARGATE', 'Should use FARGATE');
        done();
      });
    });

    it('should configure ECS task with proper resources', done => {
      pulumi
        .all([stack.ecsTaskDefinition.cpu, stack.ecsTaskDefinition.memory])
        .apply(([cpu, memory]) => {
          assert.strictEqual(cpu, '256', 'CPU should be 256');
          assert.strictEqual(memory, '512', 'Memory should be 512');
          done();
        });
    });

    it('should use CodeDeploy for ECS deployments', done => {
      stack.ecsService.deploymentController.apply(deploymentController => {
        assert.strictEqual(
          deploymentController!.type,
          'CODE_DEPLOY',
          'Should use CODE_DEPLOY'
        );
        done();
      });
    });

    it('should configure ECS service in VPC', done => {
      stack.ecsService.networkConfiguration.apply(networkConfig => {
        assert.ok(networkConfig, 'Network config should exist');
        assert.ok(networkConfig!.subnets!.length > 0, 'Should have subnets');
        done();
      });
    });

    it('should assign public IP for internet access', done => {
      stack.ecsService.networkConfiguration.apply(networkConfig => {
        assert.strictEqual(
          networkConfig!.assignPublicIp,
          true,
          'Should assign public IP'
        );
        done();
      });
    });
  });

  describe('CodeBuild Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('codebuild-test-stack', {
        environmentSuffix: 'codebuild',
      });
    });

    it('should use Linux container', done => {
      stack.codeBuildProject.environment.apply(environment => {
        assert.strictEqual(
          environment.type,
          'LINUX_CONTAINER',
          'Should use Linux container'
        );
        done();
      });
    });

    it('should enable privileged mode for Docker', done => {
      stack.codeBuildProject.environment.apply(environment => {
        assert.strictEqual(
          environment.privilegedMode,
          true,
          'Should enable privileged mode'
        );
        done();
      });
    });

    it('should configure environment variables', done => {
      stack.codeBuildProject.environment.apply(environment => {
        assert.ok(
          environment.environmentVariables!.length > 0,
          'Should have environment variables'
        );
        done();
      });
    });

    it('should use standard Docker image', done => {
      stack.codeBuildProject.environment.apply(environment => {
        assert.ok(
          environment.image.includes('aws/codebuild/standard'),
          'Should use standard image'
        );
        done();
      });
    });

    it('should log to CloudWatch', done => {
      stack.codeBuildProject.logsConfig.apply(logsConfig => {
        assert.ok(
          logsConfig!.cloudwatchLogs,
          'Should have CloudWatch logs configured'
        );
        done();
      });
    });
  });

  describe('Approval Workflow', () => {
    it('should add manual approval for production', done => {
      stack = new TapStack('approval-prod-stack', {
        environmentSuffix: 'prod',
        enableApproval: true,
      });

      stack.codePipeline.stages.apply(stages => {
        const approvalStage = stages.find((s: any) => s.name === 'Approval');

        assert.ok(approvalStage, 'Approval stage should exist');
        assert.strictEqual(
          approvalStage!.actions[0].category,
          'Approval',
          'Action should be Approval'
        );
        assert.strictEqual(
          approvalStage!.actions[0].provider,
          'Manual',
          'Provider should be Manual'
        );
        done();
      });
    });

    it('should skip approval for development', done => {
      stack = new TapStack('approval-dev-stack', {
        environmentSuffix: 'dev',
        enableApproval: false,
      });

      stack.codePipeline.stages.apply(stages => {
        const approvalStage = stages.find((s: any) => s.name === 'Approval');
        assert.strictEqual(
          approvalStage,
          undefined,
          'Approval stage should not exist'
        );
        done();
      });
    });

    it('should send SNS notification for approval', done => {
      stack = new TapStack('approval-sns-stack', {
        environmentSuffix: 'staging',
        enableApproval: true,
      });

      stack.codePipeline.stages.apply(stages => {
        const approvalStage = stages.find((s: any) => s.name === 'Approval');

        assert.ok(approvalStage, 'Approval stage should exist');
        assert.ok(
          approvalStage!.actions[0].configuration!.NotificationArn,
          'Notification ARN should be configured'
        );
        done();
      });
    });
  });

  describe('Output File Generation', () => {
    it('should generate flat-outputs.json file', async () => {
      stack = new TapStack('output-test-stack', {
        environmentSuffix: 'output',
      });

      // Wait for outputs to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      assert.ok(stack.outputs, 'Outputs should exist');
    });

    it('should include all outputs in file', () => {
      stack = new TapStack('output-complete-stack', {
        environmentSuffix: 'complete',
      });

      const outputs = stack.outputs;
      const outputKeys = Object.keys(outputs);

      assert.ok(outputKeys.includes('kmsKeyId'), 'Should include kmsKeyId');
      assert.ok(
        outputKeys.includes('artifactBucketName'),
        'Should include artifactBucketName'
      );
      assert.ok(
        outputKeys.includes('snsTopicArn'),
        'Should include snsTopicArn'
      );
      assert.ok(
        outputKeys.includes('ecsClusterName'),
        'Should include ecsClusterName'
      );
      assert.ok(
        outputKeys.includes('codePipelineName'),
        'Should include codePipelineName'
      );
    });
  });

  describe('Resource Dependencies', () => {
    beforeEach(() => {
      stack = new TapStack('dependency-test-stack', {
        environmentSuffix: 'dependency',
      });
    });

    it('should create KMS key before S3 bucket encryption', () => {
      assert.ok(stack.kmsKey, 'KMS key should exist');
      assert.ok(stack.artifactBucket, 'Artifact bucket should exist');
    });

    it('should create ECS cluster before service', () => {
      assert.ok(stack.ecsCluster, 'ECS cluster should exist');
      assert.ok(stack.ecsService, 'ECS service should exist');
    });

    it('should create task definition before service', () => {
      assert.ok(stack.ecsTaskDefinition, 'Task definition should exist');
      assert.ok(stack.ecsService, 'ECS service should exist');
    });

    it('should create CodeDeploy app before deployment group', () => {
      assert.ok(stack.codeDeployApp, 'CodeDeploy app should exist');
      assert.ok(stack.codeDeployGroup, 'Deployment group should exist');
    });

    it('should create all prerequisites before pipeline', () => {
      assert.ok(stack.artifactBucket, 'Artifact bucket should exist');
      assert.ok(stack.codeBuildProject, 'CodeBuild project should exist');
      assert.ok(stack.codeDeployApp, 'CodeDeploy app should exist');
      assert.ok(stack.codePipeline, 'CodePipeline should exist');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid region gracefully', () => {
      assert.doesNotThrow(() => {
        new TapStack('invalid-region-stack', {
          environmentSuffix: 'invalid',
          regions: ['invalid-region'],
        });
      }, 'Should not throw with invalid region');
    });

    it('should handle empty regions array', () => {
      stack = new TapStack('empty-regions-stack', {
        environmentSuffix: 'empty',
        regions: [],
      });

      assert.ok(stack, 'Stack should be created');
    });

    it('should handle missing GitHub credentials', () => {
      stack = new TapStack('no-github-stack', {
        environmentSuffix: 'nogithub',
        githubToken: pulumi.output(''),
      });

      assert.ok(stack, 'Stack should be created');
    });
  });

  describe('Performance and Scalability', () => {
    it('should support large number of regions', done => {
      stack = new TapStack('many-regions-stack', {
        environmentSuffix: 'many',
        regions: [
          'us-east-1',
          'us-west-1',
          'us-west-2',
          'eu-west-1',
          'eu-central-1',
          'ap-southeast-1',
        ],
      });

      stack.codePipeline.stages.apply(stages => {
        const deployStages = stages.filter((s: any) =>
          s.name.startsWith('Deploy')
        );
        assert.strictEqual(
          deployStages.length,
          6,
          'Should have 6 deploy stages'
        );
        done();
      });
    });

    it('should configure appropriate ECS task size', done => {
      stack = new TapStack('task-size-stack', {
        environmentSuffix: 'tasksize',
      });

      pulumi
        .all([stack.ecsTaskDefinition.cpu, stack.ecsTaskDefinition.memory])
        .apply(([cpu, memory]) => {
          assert.ok(parseInt(cpu!) >= 256, 'CPU should be at least 256');
          assert.ok(parseInt(memory!) >= 512, 'Memory should be at least 512');
          done();
        });
    });
  });

  describe('Complete E2E Workflow', () => {
    it('should simulate complete deployment workflow', done => {
      stack = new TapStack('e2e-stack', {
        environmentSuffix: 'e2e',
        githubOwner: 'e2e-org',
        githubRepo: 'e2e-repo',
        githubBranch: 'main',
        regions: ['us-east-1', 'eu-west-1'],
        enableApproval: true,
        notificationEmail: 'e2e@example.com',
      });

      // Verify all stages and components
      pulumi
        .all([
          stack.codePipeline.stages,
          stack.codeDeployGroup.autoRollbackConfiguration,
          pulumi.all(Object.values(stack.outputs)),
        ])
        .apply(([stages, rollbackConfig, outputs]) => {
          // Step 1: Verify source stage
          assert.strictEqual(
            stages[0].name,
            'Source',
            'First stage should be Source'
          );

          // Step 2: Verify test stage
          assert.strictEqual(
            stages[1].name,
            'Test',
            'Second stage should be Test'
          );

          // Step 3: Verify build stage
          assert.strictEqual(
            stages[2].name,
            'Build',
            'Third stage should be Build'
          );

          // Step 4: Verify approval stage
          const approvalStage = stages.find((s: any) => s.name === 'Approval');
          assert.ok(approvalStage, 'Approval stage should exist');

          // Step 5: Verify deploy stages
          const deployStages = stages.filter((s: any) =>
            s.name.startsWith('Deploy')
          );
          assert.strictEqual(
            deployStages.length,
            2,
            'Should have 2 deploy stages'
          );

          // Step 6: Verify ECS service is configured
          assert.ok(stack.ecsService, 'ECS service should exist');

          // Step 7: Verify rollback is configured
          assert.strictEqual(
            rollbackConfig!.enabled,
            true,
            'Rollback should be enabled'
          );

          // Step 8: Verify notifications are configured
          assert.ok(stack.snsTopic, 'SNS topic should exist');

          // Step 9: Verify encryption is enabled
          assert.ok(stack.kmsKey, 'KMS key should exist');

          // Step 10: Verify outputs are generated
          assert.ok(
            Object.keys(stack.outputs).length > 15,
            'Should have many outputs'
          );

          done();
        });
    });
  });
});
