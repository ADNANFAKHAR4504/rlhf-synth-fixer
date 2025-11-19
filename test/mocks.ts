// Mock utilities for Pulumi testing
import * as pulumi from '@pulumi/pulumi';

// Enhanced mock for Pulumi resources with realistic AWS resource properties
export const setupPulumiMocks = () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      const { type, name, inputs } = args;

      // Generate realistic mock data based on resource type
      const mockState: any = {
        ...inputs,
        name: inputs.name || name,
        id: `${name}-mock-id`,
        arn: `arn:aws:${type.split(':')[1] || 'component'}:us-east-1:123456789012:${name}`,
      };

      // Add type-specific properties
      if (type.includes('Vpc')) {
        mockState.cidrBlock = inputs.cidrBlock || '10.0.0.0/16';
        mockState.enableDnsHostnames = inputs.enableDnsHostnames ?? true;
        mockState.enableDnsSupport = inputs.enableDnsSupport ?? true;
      }

      if (type.includes('Subnet')) {
        mockState.availabilityZone = 'us-east-1a';
        mockState.cidrBlock = inputs.cidrBlock || '10.0.1.0/24';
        mockState.mapPublicIpOnLaunch = inputs.mapPublicIpOnLaunch || false;
      }

      if (type.includes('InternetGateway')) {
        mockState.vpcId = inputs.vpcId;
      }

      if (type.includes('NatGateway')) {
        mockState.allocationId = inputs.allocationId || 'eipalloc-12345678';
        mockState.subnetId = inputs.subnetId;
      }

      if (type.includes('Eip')) {
        mockState.publicIp = '203.0.113.1';
        mockState.allocationId = 'eipalloc-12345678';
        mockState.domain = inputs.domain || 'vpc';
      }

      if (type.includes('RouteTable')) {
        mockState.vpcId = inputs.vpcId;
      }

      if (type.includes('Route')) {
        mockState.routeTableId = inputs.routeTableId;
        mockState.destinationCidrBlock = inputs.destinationCidrBlock;
      }

      if (type.includes('SecurityGroup')) {
        mockState.vpcId = inputs.vpcId;
        mockState.ingress = inputs.ingress || [];
        mockState.egress = inputs.egress || [];
      }

      if (type.includes('LoadBalancer')) {
        mockState.dnsName = `${name}.us-east-1.elb.amazonaws.com`;
        mockState.hostedZoneId = 'Z35SXDOTRQ7X7K';
        mockState.loadBalancerType = inputs.loadBalancerType || 'application';
      }

      if (type.includes('TargetGroup')) {
        mockState.port = inputs.port || 8080;
        mockState.protocol = inputs.protocol || 'HTTP';
        mockState.targetType = inputs.targetType || 'ip';
      }

      if (type.includes('Cluster')) {
        mockState.clusterName = inputs.name || name;
        mockState.status = 'ACTIVE';
      }

      if (type.includes('Service')) {
        mockState.serviceName = inputs.name || name;
        mockState.desiredCount = inputs.desiredCount || 2;
        mockState.launchType = inputs.launchType || 'FARGATE';
      }

      if (type.includes('TaskDefinition')) {
        mockState.family = inputs.family || name;
        mockState.cpu = inputs.cpu || '1024';
        mockState.memory = inputs.memory || '2048';
      }

      if (type.includes('Repository')) {
        mockState.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${name}`;
      }

      if (type.includes('LogGroup')) {
        mockState.logGroupName = inputs.name || name;
        mockState.retentionInDays = inputs.retentionInDays || 30;
      }

      if (type.includes('Secret')) {
        mockState.secretName = inputs.name || name;
      }

      if (type.includes('Key')) {
        mockState.keyId = `key-${name}`;
        mockState.enableKeyRotation = inputs.enableKeyRotation ?? true;
      }

      if (type.includes('Role')) {
        mockState.roleName = inputs.name || name;
      }

      if (type.includes('PrivateDnsNamespace')) {
        mockState.namespace = inputs.name || name;
        mockState.hostedZone = 'Z1234567890ABC';
      }

      if (type.includes('servicediscovery')) {
        mockState.serviceName = inputs.name || name;
      }

      return {
        id: mockState.id,
        state: mockState,
      };
    },

    call: (args: pulumi.runtime.MockCallArgs) => {
      // Mock AWS API calls
      if (
        args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones'
      ) {
        return Promise.resolve({
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
          state: 'available',
        });
      }

      if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
        return Promise.resolve({
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test-user',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        });
      }

      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return Promise.resolve({
          id: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20231101.0-x86_64-gp2',
          ownerId: '137112412989',
        });
      }

      if (args.token === 'aws:index/getRegion:getRegion') {
        return Promise.resolve({
          name: 'us-east-1',
          endpoint: 'ec2.us-east-1.amazonaws.com',
        });
      }

      return args;
    },
  });
};

// Setup mocks for testing
setupPulumiMocks();

export default setupPulumiMocks;
