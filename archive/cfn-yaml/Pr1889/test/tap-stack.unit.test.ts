import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation JSON Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  it('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  it('should define Parameters and Resources sections', () => {
    expect(template.Parameters).toBeDefined();
    expect(typeof template.Parameters).toBe('object');
    expect(template.Resources).toBeDefined();
    expect(typeof template.Resources).toBe('object');
  });

  it('should define a VPC resource with correct CIDR block', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
  });

  it('should define two public and two private subnets', () => {
    ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(subnet => {
      expect(template.Resources[subnet]).toBeDefined();
      expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
    });
  });

  it('should define required security groups', () => {
    ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'].forEach(sg => {
      expect(template.Resources[sg]).toBeDefined();
      expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  it('should define ALB, Target Group, and Listener', () => {
    expect(template.Resources.ALB).toBeDefined();
    expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(template.Resources.TargetGroup).toBeDefined();
    expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    expect(template.Resources.Listener).toBeDefined();
    expect(template.Resources.Listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
  });

  it('should define LaunchTemplate and AutoScalingGroup', () => {
    expect(template.Resources.LaunchTemplate).toBeDefined();
    expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    expect(template.Resources.AutoScalingGroup).toBeDefined();
    expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
  });

  it('should define DBSubnetGroup and MyDB', () => {
    expect(template.Resources.DBSubnetGroup).toBeDefined();
    expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    expect(template.Resources.MyDB).toBeDefined();
    expect(template.Resources.MyDB.Type).toBe('AWS::RDS::DBInstance');
  });

  it('should define required Outputs', () => {
    [
      'ALBDNSName',
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'RDSEndpoint',
    ].forEach(output => {
      expect(template.Outputs[output]).toBeDefined();
      expect(template.Outputs[output].Value).toBeDefined();
    });
  });
});
