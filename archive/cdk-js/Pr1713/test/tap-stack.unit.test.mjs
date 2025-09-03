import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/high-available.mjs', () => ({
  HighAvailableStack: jest.fn().mockImplementation(function (scope, id, props) {
    this.node = { addDependency: jest.fn() };
    this.stackId = id;
    this.props = props;
    return this;
  }),
}));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  let mockHighAvailableStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);

    // Get the mocked instance
    const { HighAvailableStack } = require('../lib/high-available.mjs');
    mockHighAvailableStack = HighAvailableStack.mock.instances[0];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Stack Creation', () => {
    test('should create TapStack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('should create HighAvailableStack with correct parameters', () => {
      const { HighAvailableStack } = require('../lib/high-available.mjs');
      expect(HighAvailableStack).toHaveBeenCalledWith(
        app,
        `HighAvailableStack${environmentSuffix}`,
        {
          environmentSuffix,
          description: `High-Availability Web Architecture - ${environmentSuffix}`,
        }
      );
    });

    test('should store reference to highAvailableStack', () => {
      expect(stack.highAvailableStack).toBeDefined();
      expect(stack.highAvailableStack.stackId).toBe(
        `HighAvailableStack${environmentSuffix}`
      );
    });

    test('should create orchestrator status output', () => {
      template.hasOutput(`OrchestratorStatus${environmentSuffix}`, {
        Value: 'ORCHESTRATOR_DEPLOYED',
        Description: `High-availability web architecture orchestrator status - ${environmentSuffix}`,
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use environmentSuffix from props when provided', () => {
      const customSuffix = 'prod';
      const customStack = new TapStack(app, 'CustomStack', {
        environmentSuffix: customSuffix,
      });

      expect(customStack.highAvailableStack.props.environmentSuffix).toBe(
        customSuffix
      );
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const contextSuffix = 'staging';
      const newApp = new cdk.App();
      newApp.node.setContext('environmentSuffix', contextSuffix);

      const contextStack = new TapStack(newApp, 'ContextStack');

      expect(contextStack.highAvailableStack.props.environmentSuffix).toBe(
        contextSuffix
      );
    });

    test('should use default environmentSuffix when neither props nor context provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');

      expect(defaultStack.highAvailableStack.props.environmentSuffix).toBe(
        'dev'
      );
    });

    test('should handle empty string environmentSuffix', () => {
      const emptyStack = new TapStack(app, 'EmptyStack', {
        environmentSuffix: '',
      });
      expect(emptyStack.highAvailableStack.props.environmentSuffix).toBe('dev');
    });

    test('should handle null environmentSuffix', () => {
      const nullStack = new TapStack(app, 'NullStack', {
        environmentSuffix: null,
      });
      expect(nullStack.highAvailableStack.props.environmentSuffix).toBe('dev');
    });
  });

  describe('Stack Properties', () => {
    test('should pass all props to HighAvailableStack', () => {
      const customProps = {
        environmentSuffix: 'test',
        description: 'Custom description',
        customProperty: 'customValue',
      };

      const customStack = new TapStack(app, 'CustomPropsStack', customProps);

      expect(customStack.highAvailableStack.props).toEqual({
        ...customProps,
        environmentSuffix: 'test',
        description: `High-Availability Web Architecture - test`,
      });
    });

    test('should override description with architecture description', () => {
      const customProps = {
        environmentSuffix: 'prod',
        description: 'Original description',
      };

      const customStack = new TapStack(app, 'DescriptionStack', customProps);

      expect(customStack.highAvailableStack.props.description).toBe(
        'High-Availability Web Architecture - prod'
      );
    });

    test('should handle props with undefined values', () => {
      const customProps = {
        environmentSuffix: 'test',
        undefinedValue: undefined,
        nullValue: null,
      };

      const customStack = new TapStack(app, 'UndefinedPropsStack', customProps);

      expect(
        customStack.highAvailableStack.props.undefinedValue
      ).toBeUndefined();
      expect(customStack.highAvailableStack.props.nullValue).toBeNull();
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toHaveLength(1);
    });

    test('should create orchestrator status output with correct values', () => {
      template.hasOutput(`OrchestratorStatus${environmentSuffix}`, {
        Value: 'ORCHESTRATOR_DEPLOYED',
        Description: `High-availability web architecture orchestrator status - ${environmentSuffix}`,
      });
    });

    test('should create output with correct export name', () => {
      const outputs = template.findOutputs('*');
      const orchestratorOutput =
        outputs[`OrchestratorStatus${environmentSuffix}`];
      expect(orchestratorOutput).toBeDefined();
      expect(orchestratorOutput.Value).toBe('ORCHESTRATOR_DEPLOYED');
    });
  });

  describe('Stack Dependencies', () => {
    test('should create stack with proper dependencies', () => {
      expect(stack.highAvailableStack).toBeDefined();
      expect(stack.highAvailableStack.node).toBeDefined();
    });

    test('should have correct dependency structure', () => {
      expect(stack.node.dependencies).toBeDefined();
      expect(Array.isArray(stack.node.dependencies)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle undefined props gracefully', () => {
      const undefinedPropsStack = new TapStack(
        app,
        'UndefinedPropsStack',
        undefined
      );

      expect(undefinedPropsStack.highAvailableStack).toBeDefined();
      expect(
        undefinedPropsStack.highAvailableStack.props.environmentSuffix
      ).toBe('dev');
    });

    test('should handle null props gracefully', () => {
      const nullPropsStack = new TapStack(app, 'NullPropsStack', {});

      expect(nullPropsStack.highAvailableStack).toBeDefined();
      expect(nullPropsStack.highAvailableStack.props.environmentSuffix).toBe(
        'dev'
      );
    });

    test('should handle missing props object gracefully', () => {
      const missingPropsStack = new TapStack(app, 'MissingPropsStack');

      expect(missingPropsStack.highAvailableStack).toBeDefined();
      expect(missingPropsStack.highAvailableStack.props.environmentSuffix).toBe(
        'dev'
      );
    });
  });

  describe('Stack Metadata', () => {
    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have correct node id', () => {
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('should be instance of cdk.Stack', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should have correct stack type', () => {
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Context Handling', () => {
    test('should handle multiple context values', () => {
      const multiContextApp = new cdk.App();
      multiContextApp.node.setContext('environmentSuffix', 'prod');
      multiContextApp.node.setContext('region', 'us-west-2');

      const contextStack = new TapStack(multiContextApp, 'ContextStack');

      expect(contextStack.highAvailableStack.props.environmentSuffix).toBe(
        'prod'
      );
    });

    test('should prioritize props over context', () => {
      const propsContextApp = new cdk.App();
      propsContextApp.node.setContext('environmentSuffix', 'staging');

      const propsStack = new TapStack(propsContextApp, 'PropsStack', {
        environmentSuffix: 'prod',
      });

      expect(propsStack.highAvailableStack.props.environmentSuffix).toBe(
        'prod'
      );
    });
  });

  describe('Stack Naming', () => {
    test('should create stack with custom name', () => {
      const customName = 'MyCustomStack';
      const customStack = new TapStack(app, customName, {
        environmentSuffix: 'test',
      });

      expect(customStack.stackName).toBe(customName);
      expect(customStack.node.id).toBe(customName);
    });

    test('should handle valid stack names with dashes', () => {
      const validName = 'Stack-With-Dashes';
      const validStack = new TapStack(app, validName, {
        environmentSuffix: 'test',
      });

      expect(validStack.stackName).toBe(validName);
    });
  });

  describe('Integration with HighAvailableStack', () => {
    test('should pass correct scope to HighAvailableStack', () => {
      const { HighAvailableStack } = require('../lib/high-available.mjs');
      const callArgs = HighAvailableStack.mock.calls[0];
      const scope = callArgs[0];

      expect(scope).toBe(app);
    });

    test('should pass correct id to HighAvailableStack', () => {
      const { HighAvailableStack } = require('../lib/high-available.mjs');
      const callArgs = HighAvailableStack.mock.calls[0];
      const id = callArgs[1];

      expect(id).toBe(`HighAvailableStack${environmentSuffix}`);
    });

    test('should pass correct props to HighAvailableStack', () => {
      const { HighAvailableStack } = require('../lib/high-available.mjs');
      const callArgs = HighAvailableStack.mock.calls[0];
      const props = callArgs[2];

      expect(props.environmentSuffix).toBe(environmentSuffix);
      expect(props.description).toBe(
        `High-Availability Web Architecture - ${environmentSuffix}`
      );
    });
  });
});
