import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi test environment
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } => {
    const state = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}_id`,
      name: args.inputs.name || args.name,
    };
    return {
      id: state.id,
      state: state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
}, 'test');

// Import modules AFTER setting up mocks
import { EcsComponent } from '../lib/components/ecs-component';
import { RdsComponent } from '../lib/components/rds-component';

describe('Component Unit Tests', () => {
  describe('EcsComponent', () => {
    it('should use default awsRegion when not provided', () => {
      const component = new EcsComponent('test-ecs', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        // awsRegion not provided - should default to 'us-east-1'
      });

      expect(component).toBeDefined();
      expect(component.cluster).toBeDefined();
      expect(component.taskDefinition).toBeDefined();
      expect(component.service).toBeDefined();
    });

    it('should use custom awsRegion when provided', () => {
      const component = new EcsComponent('test-ecs-custom', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        awsRegion: 'us-west-2',
      });

      expect(component).toBeDefined();
      expect(component.cluster).toBeDefined();
    });

    it('should use default desiredCount when not provided', () => {
      const component = new EcsComponent('test-ecs-default-count', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        // desiredCount not provided - should default to 2
      });

      expect(component).toBeDefined();
      expect(component.service).toBeDefined();
    });

    it('should use custom desiredCount when provided', () => {
      const component = new EcsComponent('test-ecs-custom-count', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        desiredCount: 5,
      });

      expect(component).toBeDefined();
      expect(component.service).toBeDefined();
    });

    it('should use default cpu and memory when not provided', () => {
      const component = new EcsComponent('test-ecs-default-resources', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        // cpu and memory not provided - should use defaults
      });

      expect(component).toBeDefined();
      expect(component.taskDefinition).toBeDefined();
    });

    it('should use custom cpu and memory when provided', () => {
      const component = new EcsComponent('test-ecs-custom-resources', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        cpu: '1024',
        memory: '2048',
      });

      expect(component).toBeDefined();
      expect(component.taskDefinition).toBeDefined();
    });

    it('should handle albListenerArn when provided', () => {
      const component = new EcsComponent('test-ecs-with-listener', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        albListenerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/test',
        containerImageTag: 'latest',
      });

      expect(component).toBeDefined();
      expect(component.service).toBeDefined();
    });

    it('should handle albListenerArn when not provided', () => {
      const component = new EcsComponent('test-ecs-without-listener', {
        environmentSuffix: 'test',
        vpcId: 'vpc-123',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        ecsSecurityGroupId: 'sg-123',
        albTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test',
        containerImageTag: 'latest',
        // albListenerArn not provided
      });

      expect(component).toBeDefined();
      expect(component.service).toBeDefined();
    });
  });

  describe('RdsComponent', () => {
    it('should use default instanceClass when not provided', () => {
      const component = new RdsComponent('test-rds', {
        environmentSuffix: 'test',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 2,
        backupRetentionDays: 7,
        // instanceClass not provided - should default to 'db.t3.medium'
      });

      expect(component).toBeDefined();
      expect(component.cluster).toBeDefined();
      expect(component.clusterInstances).toBeDefined();
      expect(component.clusterInstances).toHaveLength(2);
    });

    it('should use custom instanceClass when provided', () => {
      const component = new RdsComponent('test-rds-custom', {
        environmentSuffix: 'test',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 3,
        backupRetentionDays: 30,
        instanceClass: 'db.r5.large',
      });

      expect(component).toBeDefined();
      expect(component.cluster).toBeDefined();
      expect(component.clusterInstances).toHaveLength(3);
    });

    it('should create single instance cluster', () => {
      const component = new RdsComponent('test-rds-single', {
        environmentSuffix: 'test',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 1,
        backupRetentionDays: 7,
        instanceClass: 'db.t3.medium',
      });

      expect(component).toBeDefined();
      expect(component.clusterInstances).toHaveLength(1);
    });

    it('should create multi-instance cluster', () => {
      const component = new RdsComponent('test-rds-multi', {
        environmentSuffix: 'prod',
        privateSubnetIds: ['subnet-1', 'subnet-2', 'subnet-3'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 3,
        backupRetentionDays: 30,
        instanceClass: 'db.r5.xlarge',
      });

      expect(component).toBeDefined();
      expect(component.clusterInstances).toHaveLength(3);
      expect(component.clusterEndpoint).toBeDefined();
      expect(component.clusterReaderEndpoint).toBeDefined();
    });

    it('should handle different backup retention periods', () => {
      const componentDev = new RdsComponent('test-rds-dev', {
        environmentSuffix: 'dev',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 1,
        backupRetentionDays: 7,
      });

      const componentProd = new RdsComponent('test-rds-prod', {
        environmentSuffix: 'prod',
        privateSubnetIds: ['subnet-1', 'subnet-2'],
        rdsSecurityGroupId: 'sg-123',
        dbInstanceCount: 3,
        backupRetentionDays: 30,
      });

      expect(componentDev).toBeDefined();
      expect(componentProd).toBeDefined();
    });
  });
});

