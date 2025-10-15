import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IaCNovaStack } from '../lib/iac-nova-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.STRING_SUFFIX;
    delete process.env.RDS_CREDENTIALS_SECRET_ARN;
    delete process.env.LAMBDA_RUNTIME;
    delete process.env.LAMBDA_CODE_PATH;
    app = new cdk.App();
  });

  test('propagates environment and suffix into nested stack naming', () => {
    const environmentSuffix = 'unit';
    const stack = new TapStack(app, 'NamingStack', {
      environmentSuffix,
      stringSuffix: 'suffix',
      stackDescription: 'Unit test stack',
    });

    expect(
      stack.emailInfrastructure.formatResourceName('lambda')
    ).toEqual('app-lambda-unit-suffix');

    const template = Template.fromStack(stack);
    expect(
      Object.keys(template.findResources('AWS::CloudFormation::Stack')).length
    ).toBeGreaterThanOrEqual(1);
  });

  test('creates managed database credentials secret when ARN not supplied', () => {
    const stack = new TapStack(app, 'ManagedSecretStack', {
      environmentSuffix: 'managed',
      stringSuffix: 'stack',
    });

    const nestedTemplate = Template.fromStack(stack.emailInfrastructure);

    nestedTemplate.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'app-db-credentials-managed-stack',
    });

    nestedTemplate.resourceCountIs('AWS::SecretsManager::Secret', 1);

    nestedTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          RDS_SECRET_ARN: Match.objectLike({
            Ref: Match.stringLikeRegexp('GeneratedRdsCredentialsSecret'),
          }),
        }),
      },
    });

    nestedTemplate.hasOutput('DatabaseCredentialsSecretArn', {
      Value: Match.objectLike({
        Ref: Match.stringLikeRegexp('GeneratedRdsCredentialsSecret'),
      }),
    });
  });

  test('imports existing credentials secret when ARN provided', () => {
    const providedArn =
      'arn:aws:secretsmanager:us-west-1:123456789012:secret:preexisting-abc123';
    process.env.RDS_CREDENTIALS_SECRET_ARN = providedArn;

    const stack = new TapStack(app, 'ImportedSecretStack', {
      environmentSuffix: 'imported',
      stringSuffix: 'live',
    });

    const nestedTemplate = Template.fromStack(stack.emailInfrastructure);

    nestedTemplate.resourceCountIs('AWS::SecretsManager::Secret', 0);

    nestedTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          RDS_SECRET_ARN: providedArn,
        }),
      },
    });
  });

  test('derives naming from context when props omitted', () => {
    app.node.setContext('environmentSuffix', 'ctxenv');
    app.node.setContext('stringSuffix', 'ctxsuffix');

    const stack = new TapStack(app, 'ContextNamingStack');

    expect(stack.emailInfrastructure.formatResourceName('lambda')).toEqual(
      'app-lambda-ctxenv-ctxsuffix'
    );
  });

  test('falls back to default suffix when nothing supplied', () => {
    const stack = new TapStack(app, 'DefaultNamingStack');

    expect(stack.emailInfrastructure.formatResourceName('lambda')).toEqual(
      'app-lambda-dev-dev'
    );
  });

  test('applies context overrides for lambda sizing and networking', () => {
    app.node.setContext('lambdaMemorySize', '1024');
    app.node.setContext('lambdaTimeoutSeconds', '180');
    app.node.setContext('natGatewayCount', '2');
    process.env.LAMBDA_RUNTIME = 'PYTHON_3_11';

    const stack = new TapStack(app, 'ConfigStack', {
      environmentSuffix: 'cfg',
      stringSuffix: 'size',
    });

    const nestedTemplate = Template.fromStack(stack.emailInfrastructure);

    nestedTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      MemorySize: 1024,
      Timeout: 180,
    });

    nestedTemplate.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('uses context-supplied credentials secret ARN when provided', () => {
    app.node.setContext(
      'rdsCredentialsSecretArn',
      'arn:aws:secretsmanager:us-west-1:123456789012:secret:ctxsecret-xyz789'
    );

    const stack = new TapStack(app, 'ContextSecretStack', {
      environmentSuffix: 'ctx',
      stringSuffix: 'context',
    });

    const nestedTemplate = Template.fromStack(stack.emailInfrastructure);

    nestedTemplate.resourceCountIs('AWS::SecretsManager::Secret', 0);
    nestedTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          RDS_SECRET_ARN:
            'arn:aws:secretsmanager:us-west-1:123456789012:secret:ctxsecret-xyz789',
        }),
      },
    });
  });
});

describe('iac-nova-app bootstrap', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('creates TapStack using environment overrides', () => {
    process.env.CDK_STAGE_ID = 'StageUnderTest';
    process.env.CDK_STACK_ID = 'StackUnderTest';
    process.env.CDK_STACK_DESCRIPTION = 'Unit description';
    process.env.ENVIRONMENT_SUFFIX = 'unitsuffix';
    process.env.STRING_SUFFIX = 'unitsuf';
    process.env.LAMBDA_RUNTIME = 'NODEJS_18_X';

    const synthSpy = jest
      .spyOn(cdk.App.prototype, 'synth')
      .mockImplementation(() => ({} as never));

    const tapModulePath = require.resolve('../lib/tap-stack');
    const appModulePath = require.resolve('../lib/iac-nova-app');
    delete require.cache[tapModulePath];
    delete require.cache[appModulePath];

    const tapModule = require('../lib/tap-stack');
    const OriginalTapStack = tapModule.TapStack;
    const ctorCalls: Array<ConstructorParameters<typeof OriginalTapStack>> = [];

    class RecordingTapStack extends OriginalTapStack {
      constructor(...args: ConstructorParameters<typeof OriginalTapStack>) {
        super(...args);
        ctorCalls.push(args);
      }
    }

    tapModule.TapStack = RecordingTapStack;

    require('../lib/iac-nova-app');

    expect(ctorCalls.length).toBe(1);
    const [scope, stackId, props] = ctorCalls[0];
    expect(scope).toBeInstanceOf(cdk.App);
    expect(stackId).toBe('StageUnderTest');
    expect(props).toEqual(
      expect.objectContaining({
        stackId: 'StackUnderTest',
        stackDescription: 'Unit description',
        environmentSuffix: 'unitsuffix',
        stringSuffix: 'unitsuf',
      })
    );

    synthSpy.mockRestore();
    tapModule.TapStack = OriginalTapStack;
    delete require.cache[tapModulePath];
    delete require.cache[appModulePath];
  });

  test('uses defaults when no overrides are present', () => {
    // Clear all environment variables that could affect the test
    delete process.env.CDK_STAGE_ID;
    delete process.env.CDK_STACK_ID;
    delete process.env.CDK_STACK_DESCRIPTION;
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.STRING_SUFFIX;
    delete process.env.CDK_DEFAULT_ACCOUNT;
    delete process.env.CDK_DEFAULT_REGION;

    const synthSpy = jest
      .spyOn(cdk.App.prototype, 'synth')
      .mockImplementation(() => ({} as never));

    const tapModulePath = require.resolve('../lib/tap-stack');
    const appModulePath = require.resolve('../lib/iac-nova-app');
    delete require.cache[tapModulePath];
    delete require.cache[appModulePath];

    const tapModule = require('../lib/tap-stack');
    const OriginalTapStack = tapModule.TapStack;
    const ctorCalls: Array<ConstructorParameters<typeof OriginalTapStack>> = [];

    class RecordingTapStack extends OriginalTapStack {
      constructor(...args: ConstructorParameters<typeof OriginalTapStack>) {
        super(...args);
        ctorCalls.push(args);
      }
    }

    tapModule.TapStack = RecordingTapStack;

    require('../lib/iac-nova-app');

    expect(ctorCalls.length).toBe(1);
    const [, stackId, props] = ctorCalls[0];
    expect(stackId).toBe('IaCNovaTapStack');
    expect(props).toEqual(
      expect.objectContaining({
        stackDescription:
          'Email notification infrastructure synthesized via TapStack.',
        environmentSuffix: undefined,
        stringSuffix: undefined,
      })
    );

    synthSpy.mockRestore();
    tapModule.TapStack = OriginalTapStack;
    delete require.cache[tapModulePath];
    delete require.cache[appModulePath];
  });
});

describe('IaCNovaStack helper behaviours', () => {
  type StackHelper = {
    resolveStringParameter: (
      parameter: { valueAsString: unknown; logicalId: string },
      options: {
        contextKey: string;
        envKey: string;
        defaultValue?: string;
        required?: boolean;
      }
    ) => string;
    resolveNumberParameter: (
      parameter: { valueAsNumber: unknown; logicalId?: string },
      options: { contextKey: string; envKey: string; defaultValue: number }
    ) => number;
  };

  const buildStack = (
    configure?: (app: cdk.App, parent: cdk.Stack) => void
  ): { stack: IaCNovaStack; helper: StackHelper } => {
    const app = new cdk.App();
    const parent = new cdk.Stack(app, 'HelperParent');
    if (configure) {
      configure(app, parent);
    }
    const stack = new IaCNovaStack(parent, 'HelperStack', {
      initialEnvironmentId: 'helper',
      initialStringSuffix: 'helpers',
    });
    return { stack, helper: stack as unknown as StackHelper };
  };

  test('resolveStringParameter returns concrete values immediately', () => {
    const { helper } = buildStack();
    const result = helper.resolveStringParameter(
      { valueAsString: 'explicit', logicalId: 'ImmediateParam' },
      { contextKey: 'unused', envKey: 'UNUSED', defaultValue: 'fallback' }
    );

    expect(result).toBe('explicit');
  });

  test('resolveStringParameter throws when required value missing', () => {
    const { helper } = buildStack();
    expect(() =>
      helper.resolveStringParameter(
        { valueAsString: '', logicalId: 'MustProvide' },
        { contextKey: 'missing', envKey: 'MISSING', required: true }
      )
    ).toThrow(/Unable to resolve string parameter/);
  });

  test('resolveNumberParameter honours concrete and context values', () => {
    const { stack, helper } = buildStack((app, parent) => {
      parent.node.setContext('maxAzs', 4);
    });
    const concrete = helper.resolveNumberParameter(
      { valueAsNumber: 7 },
      { contextKey: 'unused', envKey: 'UNUSED', defaultValue: 1 }
    );
    expect(concrete).toBe(7);

    const parameter = new cdk.CfnParameter(stack, 'CtxNumber', { type: 'Number' });
    const fromContext = helper.resolveNumberParameter(parameter, {
      contextKey: 'maxAzs',
      envKey: 'MAX_AZS',
      defaultValue: 2,
    });
    expect(fromContext).toBe(4);
  });

  test('resolveNumberParameter validates against non numeric overrides', () => {
    const { stack, helper } = buildStack();
    const parameter = new cdk.CfnParameter(stack, 'InvalidNumber', { type: 'Number' });
    process.env.LAMBDA_TIMEOUT_SECONDS = 'NaN';

    expect(() =>
      helper.resolveNumberParameter(parameter, {
        contextKey: 'lambdaTimeoutSeconds',
        envKey: 'LAMBDA_TIMEOUT_SECONDS',
        defaultValue: 60,
      })
    ).toThrow(/Unable to resolve numeric parameter/);

    delete process.env.LAMBDA_TIMEOUT_SECONDS;
  });
});
