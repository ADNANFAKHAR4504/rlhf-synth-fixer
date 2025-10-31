import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    // Generate deterministic IDs for resources
    const id = `${args.name}-${args.type.replace(/:/g, '-')}-id`;

    // Mock state based on resource type
    const state: Record<string, unknown> = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type.split(':')[0]}:eu-west-2:123456789012:${args.name}`,
    };

    // Special handling for specific resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        state.enableDnsHostnames = true;
        state.enableDnsSupport = true;
        break;

      case 'aws:ec2/subnet:Subnet':
        state.availabilityZone = args.inputs.availabilityZone || 'eu-west-2a';
        state.cidrBlock = args.inputs.cidrBlock || '10.0.1.0/24';
        break;

      case 'aws:ec2/securityGroup:SecurityGroup':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        state.ingress = args.inputs.ingress || [];
        state.egress = args.inputs.egress || [];
        break;

      case 'aws:ec2/internetGateway:InternetGateway':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:ec2/routeTable:RouteTable':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:ecs/cluster:Cluster':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:ecs:eu-west-2:123456789012:cluster/${args.name}`;
        break;

      case 'aws:ecs/taskDefinition:TaskDefinition':
        state.family = args.inputs.family || args.name;
        state.arn = `arn:aws:ecs:eu-west-2:123456789012:task-definition/${args.name}:1`;
        state.revision = 1;
        state.cpu = args.inputs.cpu || '512';
        state.memory = args.inputs.memory || '1024';
        break;

      case 'aws:ecs/service:Service':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:ecs:eu-west-2:123456789012:service/${args.name}`;
        state.desiredCount = args.inputs.desiredCount || 2;
        state.launchType = args.inputs.launchType || 'FARGATE';
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${args.name}-123456789.eu-west-2.elb.amazonaws.com`;
        state.zoneId = 'Z35SXDOTRQ7X7K';
        state.loadBalancerType = args.inputs.loadBalancerType || 'application';
        break;

      case 'aws:lb/targetGroup:TargetGroup':
        state.arn = `arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/${args.name}/1234567890123456`;
        state.port = args.inputs.port || 80;
        state.protocol = args.inputs.protocol || 'HTTP';
        break;

      case 'aws:lb/listener:Listener':
        state.arn = `arn:aws:elasticloadbalancing:eu-west-2:123456789012:listener/${args.name}/1234567890123456`;
        state.port = args.inputs.port || 443;
        state.protocol = args.inputs.protocol || 'HTTPS';
        break;

      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        state.name = args.inputs.name || args.name;
        state.assumeRolePolicy = args.inputs.assumeRolePolicy;
        break;

      case 'aws:ecr/repository:Repository':
        state.repositoryUrl = `123456789012.dkr.ecr.eu-west-2.amazonaws.com/${args.name}`;
        state.arn = `arn:aws:ecr:eu-west-2:123456789012:repository/${args.name}`;
        break;

      case 'aws:cloudwatch/logGroup:LogGroup':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:logs:eu-west-2:123456789012:log-group:${args.name}`;
        state.retentionInDays = args.inputs.retentionInDays || 7;
        break;

      case 'aws:route53/zone:Zone':
        state.zoneId = `Z${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
        state.nameServers = ['ns-1.awsdns.com', 'ns-2.awsdns.org'];
        break;

      case 'aws:route53/record:Record':
        state.name = args.inputs.name || args.name;
        state.type = args.inputs.type || 'A';
        break;

      case 'aws:appautoscaling/target:Target':
        state.serviceNamespace = args.inputs.serviceNamespace || 'ecs';
        state.scalableDimension =
          args.inputs.scalableDimension || 'ecs:service:DesiredCount';
        state.minCapacity = args.inputs.minCapacity || 1;
        state.maxCapacity = args.inputs.maxCapacity || 10;
        break;

      case 'aws:providers:aws':
        state.region = args.inputs.region || 'eu-west-2';
        break;
    }

    return {
      id: state.id as string,
      state: state,
    };
  },

  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock function calls (e.g., aws.getAvailabilityZones)
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['eu-west-2a', 'eu-west-2b', 'eu-west-2c'],
          zoneIds: ['euw2-az1', 'euw2-az2', 'euw2-az3'],
        };

      default:
        return args.inputs;
    }
  },
});

// Helper to run tests in a Pulumi stack context
pulumi.runtime.runInPulumiStack = async <T>(
  fn: () => Promise<T>
): Promise<T> => {
  const result = await fn();
  return result;
};

// Export mock implementations for direct use in tests
export const mockOutput = <T>(value: T): pulumi.Output<T> => {
  return {
    apply: <U>(func: (t: T) => pulumi.Input<U>) => mockOutput(func(value)),
    get: () => Promise.resolve(value),
  } as pulumi.Output<T>;
};

export const mockAll = <T extends readonly unknown[]>(
  values: T
): pulumi.Output<T> => {
  return mockOutput(values);
};
