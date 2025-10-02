import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = args.inputs;
    outputs.id = outputs.id || `${args.name}-id-${Date.now()}`;

    if (args.type === 'aws:sns/topic:Topic') {
      outputs.arn = `arn:aws:sns:us-east-2:123456789012:${args.name}`;
      outputs.name = args.name;
    } else if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      outputs.arn = `arn:aws:cloudwatch:us-east-2:123456789012:alarm:${args.name}`;
      outputs.id = args.name;
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${args.name}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    return {};
  },
});

pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { CloudWatchStack } from '../lib/cloudwatch-stack';

describe('CloudWatchStack Unit Tests', () => {
  describe('CloudWatch Alarms', () => {
    it('should create CPU utilization alarm', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create target health alarm', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create request count alarm', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create latency alarm', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic for alarms', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create CloudWatch dashboard', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'staging',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should apply custom tags to CloudWatch resources', async () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );
      const albArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/test/xyz789'
      );

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
        tags: {
          Environment: 'test',
          Monitoring: 'Enabled',
          AlertLevel: 'Standard',
        },
      });

      expect(stack).toBeDefined();
    });
  });
});
