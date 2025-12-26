import fs from 'fs';
import path from 'path';

describe('High Availability Web App CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toMatch(/Highly Available Web Application Infrastructure/);
    });

    test('should define parameters', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should define resources', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should define outputs', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParams = ['VpcCIDR', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'InstanceType', 'Environment'];

    test.each(requiredParams)('should define %s parameter', param => {
      expect(template.Parameters[param]).toBeDefined();
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'VPC',
      'InternetGateway',
      'AttachGateway',
      'PublicSubnet1',
      'PublicSubnet2',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'AppLogBucket',
      'InstanceSecurityGroup',
      'LaunchTemplate',
      'ALBSecurityGroup',
      'LoadBalancer',
      'TargetGroup',
      'Listener',
      'AutoScalingGroup',
      'CPUScalingPolicy'
    ];

    test.each(expectedResources)('should include resource: %s', resourceName => {
      expect(template.Resources[resourceName]).toBeDefined();
    });

    test('AppLogBucket should have a valid lifecycle rule for Glacier transition', () => {
      const bucket = template.Resources.AppLogBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const rules = bucket.Properties.LifecycleConfiguration?.Rules;
      expect(Array.isArray(rules)).toBe(true);
      expect(rules[0].Transitions[0].StorageClass).toBe('GLACIER');
      expect(rules[0].Transitions[0].TransitionInDays).toBe(30);
    });

    test('AutoScalingGroup should be spread across multiple subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThan(1);
    });

    test('LaunchTemplate should install and start httpd server', () => {
      const userData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      expect(userData).toContain('yum install -y httpd');
      expect(userData).toContain('systemctl start httpd');
    });

    test('LoadBalancer should be of type Application', () => {
      const lb = template.Resources.LoadBalancer;
      expect(lb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(lb.Properties.Subnets.length).toBe(2);
    });

    test('TargetGroup should use HTTP and health check path "/"', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });
  });

  describe('Outputs', () => {
    test('should output LoadBalancerDNS', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DNS Name of the Load Balancer');
      expect(output.Value['Fn::GetAtt']).toEqual(['LoadBalancer', 'DNSName']);
    });

    test('should output LogBucketName', () => {
      const output = template.Outputs.LogBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'AppLogBucket' });
    });

    test('should output AutoScalingGroupName', () => {
      const output = template.Outputs.AutoScalingGroupName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'AutoScalingGroup' });
    });
  });

  describe('General Template Validation', () => {
    test('should not contain undefined resources', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should use allowed instance types', () => {
      const instanceParam = template.Parameters.InstanceType;
      expect(instanceParam.AllowedValues).toEqual(expect.arrayContaining(['t2.micro', 't3.micro', 't3.small', 't3.medium']));
    });
  });
});
