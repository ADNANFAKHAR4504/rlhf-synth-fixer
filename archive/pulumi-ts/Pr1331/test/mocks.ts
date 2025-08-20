import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Generate deterministic IDs for resources
    const id = `${args.name}-${args.type.replace(/:/g, '-')}-id`;

    // Mock state based on resource type
    const state: any = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type.split(':')[0]}:us-east-1:123456789012:${args.name}`,
    };

    // Special handling for specific resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        state.enableDnsHostnames = true;
        state.enableDnsSupport = true;
        break;

      case 'aws:ec2/subnet:Subnet':
        state.availabilityZone = args.inputs.availabilityZone || 'us-east-1a';
        state.cidrBlock = args.inputs.cidrBlock || '10.0.1.0/24';
        break;

      case 'aws:s3/bucket:Bucket':
        state.bucketName = args.inputs.bucket || args.name;
        state.region = 'us-east-1';
        state.forceDestroy = args.inputs.forceDestroy || false;
        break;

      case 'aws:rds/cluster:Cluster':
        state.endpoint = `${args.name}.cluster-mockendpoint.us-east-1.rds.amazonaws.com`;
        state.port = 5432;
        state.engine = args.inputs.engine || 'aurora-postgresql';
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${args.name}-123456789.us-east-1.elb.amazonaws.com`;
        state.zoneId = 'Z35SXDOTRQ7X7K';
        break;

      case 'aws:autoscaling/group:Group':
        state.minSize = args.inputs.minSize || 1;
        state.maxSize = args.inputs.maxSize || 3;
        state.desiredCapacity = args.inputs.desiredCapacity || 2;
        break;

      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        state.assumeRolePolicy = args.inputs.assumeRolePolicy;
        break;

      case 'aws:ec2/securityGroup:SecurityGroup':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        state.ingress = args.inputs.ingress || [];
        state.egress = args.inputs.egress || [];
        break;

      case 'aws:ec2/launchTemplate:LaunchTemplate':
        state.latestVersion = 1;
        state.imageId = args.inputs.imageId || 'ami-12345678';
        state.instanceType = args.inputs.instanceType || 't3.micro';
        break;

      case 'aws:ec2/eip:Eip':
        state.publicIp = `54.${Math.floor(Math.random() * 256)}.${Math.floor(
          Math.random() * 256
        )}.${Math.floor(Math.random() * 256)}`;
        state.allocationId = `eipalloc-${args.name}`;
        break;

      case 'aws:ec2/natGateway:NatGateway':
        state.allocationId =
          args.inputs.allocationId || `eipalloc-${args.name}`;
        state.subnetId = args.inputs.subnetId || `subnet-${args.name}`;
        break;

      case 'aws:ec2/internetGateway:InternetGateway':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:ec2/routeTable:RouteTable':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:providers:aws':
        state.region = args.inputs.region || 'us-east-1';
        break;
    }

    return {
      id: state.id,
      state: state,
    };
  },

  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock function calls (e.g., aws.getAvailabilityZones)
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az4'],
        };

      case 'aws:ec2/getAmi:getAmi':
        return {
          id: 'ami-0c55b159cbfafe1f0',
          architecture: 'x86_64',
          name: 'amzn2-ami-hvm-2.0.20210813.1-x86_64-gp2',
        };

      default:
        return args.inputs;
    }
  },
});

// Helper to run tests in a Pulumi stack context
pulumi.runtime.runInPulumiStack = async (
  fn: () => Promise<any>
): Promise<any> => {
  const result = await fn();
  return result;
};

// Export mock implementations for direct use in tests
export const mockOutput = <T>(value: T): pulumi.Output<T> => {
  return {
    apply: <U>(func: (t: T) => pulumi.Input<U>) => mockOutput(func(value)),
    get: () => Promise.resolve(value),
  } as any;
};

export const mockAll = <T extends readonly unknown[]>(
  values: T
): pulumi.Output<any> => {
  return mockOutput(values as any);
};
