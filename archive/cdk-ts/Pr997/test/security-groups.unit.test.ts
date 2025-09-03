import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebSecurityGroups } from '../lib/constructs/security-groups';

describe('WebSecurityGroups', () => {
  it('creates ALB and App security groups with correct rules', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    new WebSecurityGroups(stack, 'SGs', { vpc, stage: 'bar' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    // Find the ALB SG by its description and check its ingress rules
    const resources = template.findResources('AWS::EC2::SecurityGroup');
    const albSg = Object.values(resources).find(
      (r: any) =>
        r.Properties.GroupDescription === 'ALB SG allowing inbound 80/443 only'
    );
    expect(albSg).toBeDefined();
    if (albSg) {
      expect(albSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 80 }),
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 443 }),
        ])
      );
    }
  });
});
