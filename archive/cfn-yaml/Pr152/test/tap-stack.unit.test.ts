import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should load template successfully', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have correct description', () => {
    expect(template.Description).toBe(
      'Production-ready web application infrastructure with ALB, Auto Scaling, and comprehensive networking in us-east-1'
    );
  });

  test('should have VPC resource', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
  });

  test('should have Application Load Balancer', () => {
    expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
  });

  test('should have Auto Scaling Group', () => {
    expect(template.Resources.AutoScalingGroup).toBeDefined();
    expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
  });

  test('should have all required outputs', () => {
    expect(template.Outputs.LoadBalancerDNSName).toBeDefined();
    expect(template.Outputs.ApplicationHTTPURL).toBeDefined();
    expect(template.Outputs.VPCId).toBeDefined();
  });
});
