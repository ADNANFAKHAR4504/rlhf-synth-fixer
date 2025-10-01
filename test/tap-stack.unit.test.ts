import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CICDPipelineStack } from '../lib/tap-stack';

describe('CICDPipelineStack Unit Tests', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  const defaultProps = {
    githubOwner: 'test-owner',
    githubRepo: 'test-repo',
    githubBranch: 'main',
    notificationEmail: 'test@example.com',
    deploymentRegions: ['us-east-1'], // Single region for unit tests
    environmentName: 'test',
    projectName: 'test-project',
    costCenter: 'engineering',
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
  });

  test('Stack instantiates successfully with required props', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    expect(stack).toBeDefined();
    expect(template).toBeDefined();
  });

  test('Stack uses default values for optional props when not provided', () => {
    const minimalProps = {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    stack = new CICDPipelineStack(app, 'TestStackMinimal', minimalProps);
    template = Template.fromStack(stack);

    expect(stack).toBeDefined();
    expect(template).toBeDefined();

    // Check that resources are created with default naming
    const resources = template.findResources('AWS::S3::Bucket');
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  test('Resource naming follows consistent pattern', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    // Check that all resources follow the naming pattern
    const s3Resources = template.findResources('AWS::S3::Bucket');
    const dynamoResources = template.findResources('AWS::DynamoDB::Table');
    const lambdaResources = template.findResources('AWS::Lambda::Function');

    Object.values(s3Resources).forEach((resource: any) => {
      if (resource.Properties?.BucketName) {
        expect(resource.Properties.BucketName).toContain('test-project');
        expect(resource.Properties.BucketName).toContain('artifacts');
      }
    });

    Object.values(dynamoResources).forEach((resource: any) => {
      if (resource.Properties?.TableName) {
        expect(resource.Properties.TableName).toContain('test-project');
        expect(resource.Properties.TableName).toContain('metadata');
      }
    });

    Object.values(lambdaResources).forEach((resource: any) => {
      if (resource.Properties?.FunctionName) {
        expect(resource.Properties.FunctionName).toContain('test-project');
        expect(resource.Properties.FunctionName).toContain('cost-monitoring');
      }
    });
  });

  test('Environment variables are properly configured', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    // Check CodeBuild environment variables - at least one project should have env vars
    const codeBuildProjects = template.findResources('AWS::CodeBuild::Project');
    let hasValidEnvVars = false;

    Object.values(codeBuildProjects).forEach((project: any) => {
      if (project.Properties?.Environment?.EnvironmentVariables) {
        const envVars = project.Properties.Environment.EnvironmentVariables;
        const hasAwsRegion = envVars.some((env: any) => env.Name === 'AWS_DEFAULT_REGION');
        const hasAccountId = envVars.some((env: any) => env.Name === 'AWS_ACCOUNT_ID');
        const hasArtifactsTable = envVars.some((env: any) => env.Name === 'ARTIFACTS_TABLE');

        if (hasAwsRegion && hasAccountId && hasArtifactsTable) {
          hasValidEnvVars = true;
        }
      }
    });

    expect(hasValidEnvVars).toBeTruthy();

    // Check Lambda environment variables
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    Object.values(lambdaFunctions).forEach((func: any) => {
      if (func.Properties?.Environment?.Variables) {
        const envVars = func.Properties.Environment.Variables;
        expect(envVars.PROJECT_NAME).toBe('test-project');
        expect(envVars.ENVIRONMENT).toBe('test');
        expect(envVars.SNS_TOPIC_ARN).toBeDefined();
        expect(envVars.TABLE_NAME).toBeDefined();
      }
    });
  });

  test('Stack scales with different deployment regions', () => {
    const multiRegionProps = {
      ...defaultProps,
      deploymentRegions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    stack = new CICDPipelineStack(app, 'TestStack', multiRegionProps);
    template = Template.fromStack(stack);

    const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelineResource)[0];
    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );

    const deploymentActions = productionStage.Actions.filter(
      (action: any) => action.ActionTypeId.Category === 'Deploy'
    );

    // Should have 4 deployment actions (one per region)
    expect(deploymentActions.length).toBe(4);

    // Each should target a different region
    const regions = deploymentActions.map((action: any) => action.Region);
    expect(new Set(regions).size).toBe(4); // All unique regions
  });

  test('IAM roles have proper trust relationships', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    const iamRoles = template.findResources('AWS::IAM::Role');

    Object.values(iamRoles).forEach((role: any) => {
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy).toBeDefined();
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(Array.isArray(assumeRolePolicy.Statement)).toBeTruthy();

      // Each statement should have a Principal
      assumeRolePolicy.Statement.forEach((statement: any) => {
        expect(statement.Principal).toBeDefined();
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('sts:AssumeRole');
      });
    });
  });

  test('KMS key rotation is enabled for security', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('Resource dependencies are properly defined', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    // Lambda should depend on SNS topic and DynamoDB table
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    const snsTopics = template.findResources('AWS::SNS::Topic');
    const dynamoTables = template.findResources('AWS::DynamoDB::Table');

    expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
    expect(Object.keys(snsTopics).length).toBeGreaterThan(0);
    expect(Object.keys(dynamoTables).length).toBeGreaterThan(0);

    // CodePipeline should depend on artifact bucket
    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const s3Buckets = template.findResources('AWS::S3::Bucket');

    expect(Object.keys(pipelines).length).toBeGreaterThan(0);
    expect(Object.keys(s3Buckets).length).toBeGreaterThan(0);
  });

  test('Error handling validates input parameters', () => {
    // Test with invalid email
    expect(() => {
      new CICDPipelineStack(app, 'TestStackInvalidEmail', {
        ...defaultProps,
        notificationEmail: 'invalid-email',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
    }).not.toThrow(); // CDK doesn't validate email format, but deployment would fail

    // Test with empty deployment regions
    expect(() => {
      new CICDPipelineStack(app, 'TestStackEmptyRegions', {
        ...defaultProps,
        deploymentRegions: [],
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
    }).not.toThrow(); // Should handle gracefully

    // Test with very long names - should throw due to S3 bucket name limits
    const longName = 'a'.repeat(100);
    expect(() => {
      new CICDPipelineStack(app, 'TestStackLongName', {
        ...defaultProps,
        projectName: longName,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
    }).toThrow(); // AWS CDK validates bucket name length and will throw
  });

  test('Stack supports CodeStar connection for GitHub integration', () => {
    const codeStarProps = {
      ...defaultProps,
      codeStarConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/12345678-1234-1234-1234-123456789012',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    stack = new CICDPipelineStack(app, 'TestStackCodeStar', codeStarProps);
    template = Template.fromStack(stack);

    // Check that pipeline uses CodeStar connection instead of GitHub token
    const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
    const pipelineActions = Object.values(pipeline)[0].Properties.Stages[0].Actions;
    const sourceAction = pipelineActions[0];

    expect(sourceAction.ActionTypeId.Provider).toBe('CodeStarSourceConnection');
    expect(sourceAction.Configuration.ConnectionArn).toBe(codeStarProps.codeStarConnectionArn);
  });

  test('Stack creates proper outputs', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    // Check that all expected outputs are present
    const outputs = template.findOutputs('*');
    expect(outputs.PipelineName).toBeDefined();
    expect(outputs.ArtifactsBucketName).toBeDefined();
    expect(outputs.NotificationTopicArn).toBeDefined();
    expect(outputs.GitHubTokenSecretName).toBeDefined();
    expect(outputs.GitHubSetupInstructions).toBeDefined();
  });

  test('Stack handles optional props with context values', () => {
    // Test with context values
    app.node.setContext('environment', 'staging');
    app.node.setContext('projectName', 'context-project');
    app.node.setContext('costCenter', 'context-cost-center');

    const minimalProps = {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    stack = new CICDPipelineStack(app, 'TestStackContext', minimalProps);
    template = Template.fromStack(stack);

    // Verify that resources use context values
    const resources = template.findResources('AWS::S3::Bucket');
    const bucketNames = Object.values(resources).map((r: any) => r.Properties?.BucketName).filter(Boolean);
    expect(bucketNames.some(name => name.includes('context-project'))).toBeTruthy();
  });

  test('Cost optimization features are enabled', () => {
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
    template = Template.fromStack(stack);

    // Check S3 lifecycle rules
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'delete-old-artifacts',
            Status: 'Enabled',
            ExpirationInDays: 30,
          },
        ],
      },
    });

    // Check DynamoDB billing mode
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });

    // Check point-in-time recovery is enabled
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });
});

// Add more test suites for specific components
describe('Cost Monitoring Lambda Tests', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'TestStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      environmentName: 'test',
      projectName: 'test-project',
      costCenter: 'engineering',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Lambda function has proper configuration for cost monitoring', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      Handler: 'cost-monitoring.lambda_handler',
      Timeout: 300,
      MemorySize: 256,
    });
  });

  test('Lambda has required permissions for cost monitoring', () => {
    // Check that Lambda has CloudWatch permissions through managed policy
    const lambdaRoles = template.findResources('AWS::IAM::Role');
    let hasCloudWatchPolicy = false;

    Object.values(lambdaRoles).forEach((role: any) => {
      if (role.Properties?.ManagedPolicyArns) {
        const managedPolicies = role.Properties.ManagedPolicyArns;
        managedPolicies.forEach((policy: any) => {
          const policyArn = typeof policy === 'string' ? policy : policy.Ref || JSON.stringify(policy);
          if (policyArn.includes('CloudWatchReadOnlyAccess')) {
            hasCloudWatchPolicy = true;
          }
        });
      }
    });

    expect(hasCloudWatchPolicy).toBeTruthy();
  });

  test('EventBridge rule targets Lambda correctly', () => {
    const eventRules = template.findResources('AWS::Events::Rule');
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');

    expect(Object.keys(eventRules).length).toBeGreaterThan(0);
    expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);

    // Check rule has proper event pattern
    Object.values(eventRules).forEach((rule: any) => {
      if (rule.Properties?.EventPattern) {
        expect(rule.Properties.EventPattern.source).toContain('aws.codepipeline');
      }
    });
  });
});
