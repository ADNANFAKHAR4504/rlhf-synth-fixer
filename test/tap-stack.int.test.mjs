import fs from 'fs';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeDeployClient,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  LambdaClient,
  InvokeCommand,
} from '@aws-sdk/client-lambda';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const codepipelineClient = new CodePipelineClient({ region });
const codedeployClient = new CodeDeployClient({ region });
const lambdaClient = new LambdaClient({ region });

let outputs = {};

try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Could not load outputs file, tests will use default values');
}

const getOutputValue = (key, defaultValue) => {
  return outputs[`TapStack${environmentSuffix}.${key}`] || defaultValue;
};

const pipelineName = `healthcare-pipeline-${environmentSuffix}`;
const applicationName = `healthcare-app-${environmentSuffix}`;
const deploymentGroupName = `healthcare-deployment-${environmentSuffix}`;

describe('Healthcare CI/CD Pipeline Integration Tests', () => {
  beforeAll(() => {
    console.log(`Testing Healthcare CI/CD Pipeline: ${pipelineName}`);
  });

  test('complete CI/CD pipeline configuration and workflow flow', async () => {
    console.log('=== Starting Complete CI/CD Pipeline Configuration Flow ===');

    console.log('Step 1: Verifying pipeline structure and stages');
    const pipelineCommand = new GetPipelineCommand({
      name: pipelineName,
    });

    const pipelineResponse = await codepipelineClient.send(pipelineCommand);
    expect(pipelineResponse.pipeline).toBeDefined();
    expect(pipelineResponse.pipeline.name).toBe(pipelineName);
    expect(pipelineResponse.pipeline.stages).toHaveLength(6);
    console.log(`✓ Pipeline ${pipelineName} has 6 stages configured`);

    console.log('Step 2: Validating Source → Build → Security → Compliance → Approval → Deploy flow');
    const stages = pipelineResponse.pipeline.stages;
    const stageNames = stages.map(s => s.name);
    
    expect(stageNames[0]).toBe('Source');
    expect(stageNames[1]).toBe('BuildAndTest');
    expect(stageNames[2]).toBe('SecurityScan');
    expect(stageNames[3]).toBe('ComplianceCheck');
    expect(stageNames[4]).toBe('Approval');
    expect(stageNames[5]).toBe('Deploy');
    console.log('✓ All 6 pipeline stages are correctly ordered');

    console.log('Step 3: Verifying S3 source stage configuration');
    const sourceStage = stages[0];
    expect(sourceStage.actions[0].actionTypeId.provider).toBe('S3');
    expect(sourceStage.actions[0].configuration.S3ObjectKey).toBe('source.zip');
    console.log('✓ Source stage configured to read from S3 (source.zip)');

    console.log('Step 4: Verifying artifact storage configuration');
    expect(pipelineResponse.pipeline.artifactStore).toBeDefined();
    expect(pipelineResponse.pipeline.artifactStore.type).toBe('S3');
    const artifactBucket = pipelineResponse.pipeline.artifactStore.location;
    console.log(`✓ Artifacts stored in S3 bucket: ${artifactBucket}`);

    console.log('=== Flow Complete ===\n');
  }, 120000);

  test('build and test stage with automated testing flow', async () => {
    console.log('=== Starting Build and Test Flow ===');

    console.log('Step 1: Retrieving pipeline configuration');
    const pipelineCommand = new GetPipelineCommand({
      name: pipelineName,
    });

    const pipelineResponse = await codepipelineClient.send(pipelineCommand);
    const buildStage = pipelineResponse.pipeline.stages.find(s => s.name === 'BuildAndTest');
    
    expect(buildStage).toBeDefined();
    console.log('✓ BuildAndTest stage found');

    console.log('Step 2: Validating CodeBuild integration');
    expect(buildStage.actions[0].actionTypeId.provider).toBe('CodeBuild');
    expect(buildStage.actions[0].actionTypeId.category).toBe('Build');
    console.log('✓ BuildAndTest stage uses CodeBuild for compilation and testing');

    console.log('Step 3: Verifying artifact handling');
    expect(buildStage.actions[0].inputArtifacts).toBeDefined();
    expect(buildStage.actions[0].outputArtifacts).toBeDefined();
    expect(buildStage.actions[0].outputArtifacts[0].name).toBe('BuildOutput');
    console.log('✓ Build artifacts configured for downstream stages');

    console.log('=== Flow Complete ===\n');
  }, 90000);

  test('security scanning and compliance validation flow', async () => {
    console.log('=== Starting Security and Compliance Flow ===');

    console.log('Step 1: Retrieving pipeline security configuration');
    const pipelineCommand = new GetPipelineCommand({
      name: pipelineName,
    });

    const pipelineResponse = await codepipelineClient.send(pipelineCommand);
    const securityStage = pipelineResponse.pipeline.stages.find(s => s.name === 'SecurityScan');
    
    expect(securityStage).toBeDefined();
    expect(securityStage.actions).toHaveLength(2);
    console.log('✓ SecurityScan stage has 2 actions (CodeBuild + Lambda)');

    console.log('Step 2: Validating CodeBuild security scan');
    const codeBuildAction = securityStage.actions.find(a => a.actionTypeId.provider === 'CodeBuild');
    expect(codeBuildAction).toBeDefined();
    expect(codeBuildAction.name).toBe('SecurityScan');
    console.log('✓ CodeBuild security scan configured (npm audit)');

    console.log('Step 3: Validating Lambda security scanner');
    const lambdaAction = securityStage.actions.find(a => a.actionTypeId.provider === 'Lambda');
    expect(lambdaAction).toBeDefined();
    expect(lambdaAction.name).toBe('CustomSecurityScan');
    console.log('✓ Lambda custom security scanner integrated');

    console.log('Step 4: Testing Lambda security scanner invocation');
    const lambdaArn = getOutputValue('SecurityScanLambdaArn', null);
    if (lambdaArn) {
      const testEvent = {
        test: true,
        artifactBucket: pipelineResponse.pipeline.artifactStore.location,
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaArn,
        Payload: JSON.stringify(testEvent),
      });
      
      const lambdaResponse = await lambdaClient.send(invokeCommand);
      expect(lambdaResponse.StatusCode).toBe(200);
      console.log('✓ Lambda security scanner invoked successfully');
    }

    console.log('Step 5: Validating compliance check stage');
    const complianceStage = pipelineResponse.pipeline.stages.find(s => s.name === 'ComplianceCheck');
    expect(complianceStage).toBeDefined();
    expect(complianceStage.actions[0].actionTypeId.provider).toBe('CodeBuild');
    console.log('✓ ComplianceCheck stage configured with CodeBuild');

    console.log('=== Flow Complete ===\n');
  }, 150000);

  test('manual approval and deployment workflow flow', async () => {
    console.log('=== Starting Approval and Deployment Flow ===');

    console.log('Step 1: Verifying manual approval gate');
    const pipelineCommand = new GetPipelineCommand({
      name: pipelineName,
    });

    const pipelineResponse = await codepipelineClient.send(pipelineCommand);
    const approvalStage = pipelineResponse.pipeline.stages.find(s => s.name === 'Approval');
    
    expect(approvalStage).toBeDefined();
    expect(approvalStage.actions[0].actionTypeId.provider).toBe('Manual');
    expect(approvalStage.actions[0].actionTypeId.category).toBe('Approval');
    console.log('✓ Manual approval gate configured before deployment');

    console.log('Step 2: Validating CodeDeploy deployment configuration');
    const deployStage = pipelineResponse.pipeline.stages.find(s => s.name === 'Deploy');
    expect(deployStage).toBeDefined();
    expect(deployStage.actions[0].actionTypeId.provider).toBe('CodeDeploy');
    console.log('✓ Deploy stage uses CodeDeploy');

    console.log('Step 3: Verifying deployment group rollback configuration');
    const deploymentGroupCommand = new GetDeploymentGroupCommand({
      applicationName,
      deploymentGroupName,
    });

    const deploymentResponse = await codedeployClient.send(deploymentGroupCommand);
    expect(deploymentResponse.deploymentGroupInfo).toBeDefined();
    expect(deploymentResponse.deploymentGroupInfo.autoRollbackConfiguration).toBeDefined();
    expect(deploymentResponse.deploymentGroupInfo.autoRollbackConfiguration.enabled).toBe(true);
    expect(deploymentResponse.deploymentGroupInfo.autoRollbackConfiguration.events).toContain('DEPLOYMENT_FAILURE');
    console.log('✓ Automatic rollback enabled on deployment failures');

    console.log('Step 4: Validating deployment input artifacts');
    expect(deployStage.actions[0].inputArtifacts).toBeDefined();
    expect(deployStage.actions[0].inputArtifacts[0].name).toBe('BuildOutput');
    console.log('✓ Deployment consumes build artifacts from BuildAndTest stage');

    console.log('=== Flow Complete ===\n');
  }, 120000);

  test('pipeline monitoring and observability flow', async () => {
    console.log('=== Starting Monitoring and Observability Flow ===');

    console.log('Step 1: Checking pipeline state and execution status');
    const stateCommand = new GetPipelineStateCommand({
      name: pipelineName,
    });

    const stateResponse = await codepipelineClient.send(stateCommand);
    expect(stateResponse.pipelineName).toBe(pipelineName);
    expect(stateResponse.stageStates).toBeDefined();
    expect(stateResponse.stageStates).toHaveLength(6);
    console.log(`✓ Pipeline state accessible: ${stateResponse.stageStates.length} stages monitored`);

    console.log('Step 2: Validating stage state tracking');
    stateResponse.stageStates.forEach((stage, idx) => {
      expect(stage.stageName).toBeDefined();
      // latestExecution is only present if pipeline has been executed
      if (stage.latestExecution) {
        expect(stage.latestExecution.status).toBeDefined();
      }
    });
    const stagesWithExecutionHistory = stateResponse.stageStates.filter(s => s.latestExecution);
    console.log(`✓ All stages configured for state tracking (${stagesWithExecutionHistory.length} stages with execution history)`);

    console.log('Step 3: Verifying end-to-end pipeline readiness');
    const pipelineCommand = new GetPipelineCommand({
      name: pipelineName,
    });
    const pipelineResponse = await codepipelineClient.send(pipelineCommand);
    
    const hasAllStages = pipelineResponse.pipeline.stages.length === 6;
    const hasArtifactStore = pipelineResponse.pipeline.artifactStore !== undefined;
    const hasRoleArn = pipelineResponse.pipeline.roleArn !== undefined;
    
    expect(hasAllStages).toBe(true);
    expect(hasArtifactStore).toBe(true);
    expect(hasRoleArn).toBe(true);
    console.log('✓ Pipeline fully configured and ready for execution');

    console.log('=== Flow Complete ===\n');
  }, 90000);
});
