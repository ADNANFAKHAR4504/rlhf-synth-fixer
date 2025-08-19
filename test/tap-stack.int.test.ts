import { Testing } from 'cdktf';
import { MultiEnvironmentStack } from '../lib/tap-stack';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Multi-Environment Single Stack - Integration Tests', () => {
  let parsed: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new MultiEnvironmentStack(app, 'multi-env-outputs-test');
    const synthesized = Testing.synth(stack);
    parsed = JSON.parse(synthesized);
    resources = parsed.resource || {};
  });

  it('should define all required outputs for each environment', () => {
    const outputs = parsed.output || {};
    expect(outputs['VpcId-dev']).toBeDefined();
    expect(outputs['RdsEndpoint-dev']).toBeDefined();
    expect(outputs['S3BucketName-dev']).toBeDefined();
    expect(outputs['AlbDnsName-dev']).toBeDefined();
    expect(outputs['HighCpuAlarmName-dev']).toBeDefined();
  });

  it('should have an ALB DNS Name output', () => {
    const outputs = parsed.output || {};
    const devAlbDns = outputs['AlbDnsName-dev']?.value || '';
    expect(devAlbDns).toMatch(/\${aws_lb\.dev-environment_ALB_.+\.dns_name}/);
  });

  it('should associate the ASG with the correct subnets and target group', () => {
    const asgs = Object.values(resources.aws_autoscaling_group || {}) as any[];
    const devAsg = asgs.find(asg => asg.name.startsWith('asg-dev'));
    expect(devAsg).toBeDefined();
    // Check for two private subnets
    expect(devAsg.vpc_zone_identifier).toHaveLength(2);
    expect(devAsg.vpc_zone_identifier[0]).toMatch(
      /\${aws_subnet\.dev-environment_PrivateSubnetA_.+\.id}/
    );
    expect(devAsg.vpc_zone_identifier[1]).toMatch(
      /\${aws_subnet\.dev-environment_PrivateSubnetB_.+\.id}/
    );
    // Check for the target group association
    expect(devAsg.target_group_arns[0]).toMatch(
      /\${aws_lb_target_group\.dev-environment_TargetGroup_.+\.arn}/
    );
  });

  it('should associate the Launch Template with the correct security group', () => {
    const launchTemplates = Object.values(
      resources.aws_launch_template || {}
    ) as any[];
    // Corrected the find condition to match the actual resource name
    const devLt = launchTemplates.find(lt => lt.name.startsWith('lt-dev'));
    expect(devLt).toBeDefined();
    expect(devLt.vpc_security_group_ids[0]).toMatch(
      /\${aws_security_group\.dev-environment_WebSg_.+\.id}/
    );
  });
});
