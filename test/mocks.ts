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

      case 'aws:ecs/cluster:Cluster':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.name}`;
        break;

      case 'aws:ecs/taskDefinition:TaskDefinition':
        state.family = args.inputs.family || args.name;
        state.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.name}:1`;
        break;

      case 'aws:ecs/service:Service':
        state.name = args.inputs.name || args.name;
        break;

      case 'aws:ecr/repository:Repository':
        state.name = args.inputs.name || args.name;
        state.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`;
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${args.name}-123456789.us-east-1.elb.amazonaws.com`;
        state.zoneId = 'Z35SXDOTRQ7X7K';
        break;

      case 'aws:lb/targetGroup:TargetGroup':
        state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}`;
        break;

      case 'aws:lb/listener:Listener':
        state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/${args.name}`;
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

      case 'aws:ec2/route:Route':
        state.routeTableId = args.inputs.routeTableId || 'rtb-123456';
        break;

      case 'aws:ec2/routeTableAssociation:RouteTableAssociation':
        state.routeTableId = args.inputs.routeTableId || 'rtb-123456';
        state.subnetId = args.inputs.subnetId || 'subnet-123456';
        break;

      case 'aws:servicediscovery/privateDnsNamespace:PrivateDnsNamespace':
        state.name = args.inputs.name || args.name;
        state.hostedZone = 'Z1234567890ABC';
        break;

      case 'aws:servicediscovery/service:Service':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:servicediscovery:us-east-1:123456789012:service/${args.name}`;
        break;

      case 'aws:secretsmanager/secret:Secret':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.name}`;
        break;

      case 'aws:secretsmanager/secretVersion:SecretVersion':
        state.secretId = args.inputs.secretId;
        state.versionId = 'mock-version-id';
        break;

      case 'aws:cloudwatch/logGroup:LogGroup':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`;
        break;

      case 'aws:kms/key:Key':
        state.arn = `arn:aws:kms:us-east-1:123456789012:key/${args.name}`;
        state.keyId = `key-${args.name}`;
        break;

      case 'aws:kms/alias:Alias':
        state.name = args.inputs.name || `alias/${args.name}`;
        state.targetKeyId = args.inputs.targetKeyId || 'mock-key-id';
        break;

      case 'aws:appautoscaling/target:Target':
        state.resourceId = args.inputs.resourceId;
        state.scalableDimension = args.inputs.scalableDimension;
        break;

      case 'aws:appautoscaling/policy:Policy':
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy/${args.name}`;
        break;

      case 'aws:ecr/lifecyclePolicy:LifecyclePolicy':
        state.repository = args.inputs.repository;
        state.policy = args.inputs.policy;
        break;

      case 'aws:iam/rolePolicy:RolePolicy':
        state.role = args.inputs.role;
        state.policy = args.inputs.policy;
        break;

      case 'aws:iam/rolePolicyAttachment:RolePolicyAttachment':
        state.role = args.inputs.role;
        state.policyArn = args.inputs.policyArn;
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
