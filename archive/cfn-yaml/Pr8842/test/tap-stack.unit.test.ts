import fs from 'fs';
import path from 'path';

describe('WebAppStack CloudFormation Template', () => {
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
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Highly Available Web Application');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'InstanceType',
      'KeyName',
      'VpcCIDR',
      'PublicSubnet1CIDR',
      'PublicSubnet2CIDR',
      'PrivateSubnet1CIDR',
      'PrivateSubnet2CIDR',
    ];

    expectedParams.forEach(param => {
      test(`should have ${param} parameter`, () => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    test('should have a VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should define two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should define two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have an Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should define a Network Load Balancer (NLB)', () => {
      expect(template.Resources.NLB).toBeDefined();
      expect(template.Resources.NLB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should define a Target Group and Listener', () => {
      expect(template.Resources.NLBTargetGroup).toBeDefined();
      expect(template.Resources.NLBListener).toBeDefined();
    });

    test('should define Auto Scaling Group and Launch Template', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.LaunchTemplate).toBeDefined();
    });

    test('Auto Scaling Group should have min size >= 2', () => {
      const asgProps = template.Resources.AutoScalingGroup.Properties;
      expect(parseInt(asgProps.MinSize)).toBeGreaterThanOrEqual(2);
    });

    test('should define RDS instance with Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should define security groups for EC2 and RDS', () => {
      expect(template.Resources.InstanceSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('should define IAM Role and Instance Profile', () => {
      expect(template.Resources.WebAppRole).toBeDefined();
      expect(template.Resources.WebAppInstanceProfile).toBeDefined();
    });

    test('IAM Role should only allow EC2 to assume it', () => {
      const assumeRolePolicy = template.Resources.WebAppRole.Properties.AssumeRolePolicyDocument;
      const principal = assumeRolePolicy.Statement[0].Principal.Service;
      expect(principal).toBe('ec2.amazonaws.com');
    });

    test('should define a CloudWatch Alarm and SNS Topic', () => {
      expect(template.Resources.CloudWatchAlarm).toBeDefined();
      expect(template.Resources.AlarmTopic).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'LoadBalancerDNS',
      'LoadBalancerArn',
      'TargetGroupArn',
      'AutoScalingGroupName',
      'LaunchTemplateId',
      'LaunchTemplateLatestVersion',
      'IAMRoleName',
      'InstanceProfileArn',
      'RDSEndpoint',
      'RDSInstanceIdentifier',
      'RDSSubnetGroupName',
      'RDSSecurityGroupId',
      'InstanceSecurityGroupId',
      'CloudWatchAlarmName',
      'AlarmSNSTopicArn',
    ];

    expectedOutputs.forEach(outputName => {
      test(`should define output: ${outputName}`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should provide LoadBalancer DNS output with correct structure', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toContain('DNS');
      expect(output.Value).toMatchObject({
        'Fn::GetAtt': ['NLB', 'DNSName'],
      });
    });

    test('should output the RDS endpoint', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toContain('RDS');
      expect(output.Value).toMatchObject({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });
  });

  describe('Security & Least Privilege', () => {
    test('IAM policy should only allow logs actions', () => {
      const statements = template.Resources.WebAppRole.Properties.Policies[0].PolicyDocument.Statement;
      const actions = statements.flatMap((s: { Action: string[] | string }) =>
        Array.isArray(s.Action) ? s.Action : [s.Action]
      );
      expect(actions).toEqual(
        expect.arrayContaining([
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ])
      );
      expect(actions).not.toEqual(expect.arrayContaining(['s3:*', 'ec2:*']));
    });
  });

  describe('Scaling & High Availability Checks', () => {
    test('should have resources in at least two AZs', () => {
      const subnets = [
        template.Resources.PublicSubnet1,
        template.Resources.PublicSubnet2,
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2,
      ];
      const azs = subnets.map(s => s.Properties.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
    });

    test('Auto Scaling group should span two subnets', () => {
      const asgSubnets = template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(asgSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Monitoring & Recovery', () => {
    test('CloudWatch alarm should monitor CPU utilization', () => {
      const alarm = template.Resources.CloudWatchAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.AlarmActions).toBeDefined();
    });

    test('SNS topic should have email subscription defined', () => {
      const topic = template.Resources.AlarmTopic.Properties;
      const subscriptions = topic.Subscription || [];
      expect(subscriptions[0].Protocol).toBe('email');
      expect(subscriptions[0].Endpoint).toContain('@');
    });
  });
});
