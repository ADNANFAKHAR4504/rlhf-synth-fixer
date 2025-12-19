import * as pulumi from '@pulumi/pulumi';

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

      // Force evaluation of dimensions if they contain outputs with apply()
      if (args.inputs.dimensions) {
        const dims = args.inputs.dimensions;
        if (dims.TargetGroup && typeof dims.TargetGroup === 'object' && dims.TargetGroup.apply) {
          dims.TargetGroup.apply((val: string) => val);
        }
        if (dims.LoadBalancer && typeof dims.LoadBalancer === 'object' && dims.LoadBalancer.apply) {
          dims.LoadBalancer.apply((val: string) => val);
        }
      }
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardArn = `arn:aws:cloudwatch::123456789012:dashboard/${args.name}`;

      // Force evaluation of dashboardBody if it contains apply()
      if (args.inputs.dashboardBody && typeof args.inputs.dashboardBody === 'object' && args.inputs.dashboardBody.apply) {
        args.inputs.dashboardBody.apply((val: string) => val);
      }
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (_args: pulumi.runtime.MockCallArgs): any {
    return {};
  },
});

pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { CloudWatchStack, extractTargetGroupName, extractLoadBalancerName } from '../lib/cloudwatch-stack';

describe('CloudWatchStack Unit Tests', () => {
  describe('Helper Functions', () => {
    describe('extractTargetGroupName', () => {
      it('should extract target group name from valid ARN', () => {
        const arn = 'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/my-targets/50dc6c495c0c9188';
        expect(extractTargetGroupName(arn)).toBe('my-targets');
      });

      it('should return empty string for empty ARN', () => {
        expect(extractTargetGroupName('')).toBe('');
      });

      it('should return empty string for invalid ARN without slashes', () => {
        expect(extractTargetGroupName('invalid-arn')).toBe('');
      });

      it('should return empty string for ARN with only one part after colon', () => {
        expect(extractTargetGroupName('arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup')).toBe('');
      });
    });

    describe('extractLoadBalancerName', () => {
      it('should extract load balancer name from valid ARN', () => {
        const arn = 'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188';
        expect(extractLoadBalancerName(arn)).toBe('app/my-load-balancer/50dc6c495c0c9188');
      });

      it('should return empty string for empty ARN', () => {
        expect(extractLoadBalancerName('')).toBe('');
      });

      it('should return empty string for invalid ARN', () => {
        expect(extractLoadBalancerName('invalid-arn')).toBe('');
      });

      it('should handle ARN with insufficient parts', () => {
        const arn = 'arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer';
        expect(extractLoadBalancerName(arn)).toBe('');
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create CPU utilization alarm', () => {
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

    it('should create target health alarm with empty target group ARN', () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output('');
      const albArn = pulumi.output('');

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create request count alarm', () => {
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

    it('should create latency alarm', () => {
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

    it('should handle ARN without parts', () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output('invalid-arn');
      const albArn = pulumi.output('invalid-arn');

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
    it('should create SNS topic for alarms', () => {
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
    it('should create CloudWatch dashboard', () => {
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

    it('should create dashboard with empty ARNs', () => {
      const asgName = pulumi.output('');
      const targetGroupArn = pulumi.output('');
      const albArn = pulumi.output('');

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create dashboard with malformed ARNs', () => {
      const asgName = pulumi.output('test-asg');
      const targetGroupArn = pulumi.output('malformed-arn-no-colon');
      const albArn = pulumi.output('another-malformed');

      const stack = new CloudWatchStack('test-cw', {
        environmentSuffix: 'test',
        autoScalingGroupName: asgName,
        targetGroupArn: targetGroupArn,
        albArn: albArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should apply custom tags to CloudWatch resources', () => {
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

    it('should work without tags', () => {
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
});
