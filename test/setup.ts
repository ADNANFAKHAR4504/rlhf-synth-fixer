import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi runtime mocks globally
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): pulumi.runtime.MockResourceResult => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
        invokeArn: type.includes('lambda')
          ? `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${name}/invocations`
          : undefined,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): pulumi.runtime.MockCallResult => {
    return args;
  },
});

// Mock interpolate function
interface PulumiWithExtensions {
  interpolate: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => pulumi.Output<string>;
  all: (values: unknown[]) => pulumi.Output<unknown[]>;
}

const pulumiMock = pulumi as unknown as typeof pulumi & PulumiWithExtensions;

pulumiMock.interpolate = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  const result = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');
  return pulumi.Output.create(result);
};

// Mock all function
pulumiMock.all = function (...args: any[]): any {
  // If called with a single object, treat as Record<string, Input<T>>
  if (
    args.length === 1 &&
    typeof args[0] === 'object' &&
    !Array.isArray(args[0])
  ) {
    return pulumi.Output.create(args[0]);
  }
  // If called with an array, treat as Input<T>[]
  if (args.length === 1 && Array.isArray(args[0])) {
    return pulumi.Output.create(args[0]);
  }
  // If called with multiple arguments, treat as Input<T1>, Input<T2>, ...
  return pulumi.Output.create(args);
};
