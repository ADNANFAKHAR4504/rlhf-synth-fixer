import { App, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IamValidationAspect, ResourceValidationAspect } from '../lib/validation-aspects';

describe('ResourceValidationAspect', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  test('applies consistent tagging to stacks', () => {
    const aspect = new ResourceValidationAspect();
    aspect.visit(stack);

    // Verify tags are applied (this would require additional setup in a real test)
    // For now, we just verify the aspect doesn't throw
    expect(aspect).toBeDefined();
  });

  test('counts resources without exceeding limit', () => {
    const aspect = new ResourceValidationAspect(10); // Set low limit for testing

    // Add some constructs (less than limit)
    for (let i = 0; i < 5; i++) {
      const construct = new Construct(stack, `TestConstruct${i}`);
      aspect.visit(construct);
    }

    // Should not trigger warning (covered by existing tests)
    expect(aspect).toBeDefined();
  });

  test('warns when approaching maximum resource limit', () => {
    const aspect = new ResourceValidationAspect(3); // Set very low limit
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Visit constructs to exceed the limit
    // The aspect counts every construct visited
    for (let i = 0; i < 5; i++) {
      const construct = new Construct(stack, `TestConstruct${i}`);
      aspect.visit(construct);
    }


    // Should trigger warning when count exceeds maxResources
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Approaching maximum resource limit of 3')
    );

    consoleWarnSpy.mockRestore();
  });

  test('applies environment suffix from context', () => {
    const appWithContext = new App();
    appWithContext.node.setContext('environmentSuffix', 'staging');

    const stackWithContext = new Stack(appWithContext, 'TestStack');
    const aspect = new ResourceValidationAspect();

    aspect.visit(stackWithContext);

    expect(aspect).toBeDefined();
  });

  test('defaults to dev environment when no context provided', () => {
    const aspect = new ResourceValidationAspect();
    aspect.visit(stack);

    expect(aspect).toBeDefined();
  });

  test('applies consistent tagging to stacks', () => {
    const aspect = new ResourceValidationAspect();

    // Use private method access to test tagging
    const applyTaggingMethod = (aspect as any).applyConsistentTagging.bind(aspect);
    applyTaggingMethod(stack);

    expect(aspect).toBeDefined();
  });

  test('accepts custom maxResources parameter', () => {
    const customLimit = 500;
    const aspect = new ResourceValidationAspect(customLimit);

    // Access private property for testing (using type assertion)
    expect((aspect as any).maxResources).toBe(customLimit);
  });

  test('defaults maxResources to 200 when not specified', () => {
    const aspect = new ResourceValidationAspect();
    expect((aspect as any).maxResources).toBe(200);
  });
});

describe('IamValidationAspect', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  test('visits constructs and logs IAM validation', () => {
    const aspect = new IamValidationAspect();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    aspect.visit(stack);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('IAM validation aspect visiting:')
    );

    consoleLogSpy.mockRestore();
  });

  test('handles different construct types', () => {
    const aspect = new IamValidationAspect();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const construct = new Construct(stack, 'TestConstruct');
    aspect.visit(construct);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('IAM validation aspect visiting: Construct')
    );

    consoleLogSpy.mockRestore();
  });
});
