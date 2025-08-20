import * as pulumi from '@pulumi/pulumi';

// Simple mock setup that handles all the required methods
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {id: string; state: any} => {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.inputs.name || 'mock'}`,
        id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:getCallerIdentity/getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    if (args.token === 'aws:getRegion/getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
        architecture: 'x86_64',
      };
    }
    return {};
  },
} as any, 'project', 'stack', true); // Set preview mode to true

export const resetPulumiMocks = () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): {id: string; state: any} => {
      return {
        id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.inputs.name || 'mock'}`,
          id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
        },
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      if (args.token === 'aws:getCallerIdentity/getCallerIdentity') {
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        };
      }
      if (args.token === 'aws:getRegion/getRegion') {
        return { name: 'us-east-1' };
      }
      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return {
          id: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
          architecture: 'x86_64',
        };
      }
      return {};
    },
  } as any, 'project', 'stack', true); // Set preview mode to true
};