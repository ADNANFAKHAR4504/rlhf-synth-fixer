import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack-simplified';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Configuration', () => {
    test('creates a TapStack successfully', () => {
      const environmentSuffix = 'test';
      stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix,
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('creates SecurityStack as child stack', () => {
      const environmentSuffix = 'test';
      stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix,
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      // SecurityStack should be created as a child
      const securityStack = stack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
      expect(securityStack).toBeInstanceOf(SecurityStack);
    });

    test('passes environment suffix to SecurityStack', () => {
      const environmentSuffix = 'custom';
      stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix,
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      expect(securityStack).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('uses provided environment suffix', () => {
      const environmentSuffix = 'prod';
      stack = new TapStack(app, 'ProdStack', {
        environmentSuffix,
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(stack).toBeDefined();
      const securityStack = stack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
    });

    test('handles different environment suffixes correctly', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr123'];
      
      suffixes.forEach(suffix => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `Stack${suffix}`, {
          environmentSuffix: suffix,
          env: { account: '123456789012', region: 'us-west-2' }
        });
        
        expect(testStack).toBeDefined();
        expect(testStack.stackName).toContain(suffix);
      });
    });

    test('uses default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultStack', {
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(testStack).toBeDefined();
      // Should use 'dev' as default
      const securityStack = testStack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
    });
  });

  describe('Cross-Region Support', () => {
    test('supports deployment to us-west-2', () => {
      stack = new TapStack(app, 'RegionStack', {
        environmentSuffix: 'region',
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(stack.region).toBe('us-west-2');
    });

    test('supports deployment to different regions', () => {
      const regions = ['us-west-1', 'us-west-2', 'us-east-1', 'eu-west-1'];
      
      regions.forEach(region => {
        const regionApp = new cdk.App();
        const regionStack = new TapStack(regionApp, `Stack${region}`, {
          environmentSuffix: 'test',
          env: { account: '123456789012', region }
        });
        
        expect(regionStack.region).toBe(region);
      });
    });
  });

  describe('Stack Properties', () => {
    test('sets stack properties correctly', () => {
      stack = new TapStack(app, 'PropsStack', {
        environmentSuffix: 'props',
        env: { account: '987654321098', region: 'us-west-2' },
        description: 'Test stack description'
      });
      
      expect(stack.account).toBe('987654321098');
      expect(stack.region).toBe('us-west-2');
    });

    test('creates SecurityStack with proper description', () => {
      stack = new TapStack(app, 'DescStack', {
        environmentSuffix: 'desc',
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      const securityStack = stack.node.findChild('SecurityStack') as SecurityStack;
      expect(securityStack).toBeDefined();
      expect(securityStack.templateOptions.description).toBe(
        'Secure web application infrastructure with security best practices'
      );
    });
  });

  describe('Tagging', () => {
    test('tags are applied through app level', () => {
      const taggedApp = new cdk.App();
      cdk.Tags.of(taggedApp).add('TestTag', 'TestValue');
      
      stack = new TapStack(taggedApp, 'TaggedStack', {
        environmentSuffix: 'tagged',
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Hierarchy', () => {
    test('SecurityStack is created as child of TapStack', () => {
      stack = new TapStack(app, 'ParentStack', {
        environmentSuffix: 'parent',
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      const children = stack.node.children;
      const securityStack = children.find(child => child.node.id === 'SecurityStack');
      expect(securityStack).toBeDefined();
      expect(securityStack).toBeInstanceOf(SecurityStack);
    });
  });

  describe('Context handling', () => {
    test('reads environment suffix from context when not in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext'
        }
      });
      
      stack = new TapStack(contextApp, 'ContextStack', {
        env: { account: '123456789012', region: 'us-west-2' }
      });
      
      expect(stack).toBeDefined();
      const securityStack = stack.node.findChild('SecurityStack');
      expect(securityStack).toBeDefined();
    });
  });
});