import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Nova Web App CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions.
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Base64': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => {
          const parts = data.split('.');
          return { 'Fn::GetAtt': parts };
        },
      }),
      new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct: data => ({ 'Fn::GetAtt': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
    ]);

    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Parameters & Structure', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('Nova web application');
    });

    test('should define all required parameters with correct types and defaults', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(4);
      expect(params.InstanceType).toBeDefined();
      expect(params.InstanceType.Type).toBe('String');
      expect(params.HostedZoneId).toBeDefined();
    });
  });

  describe('Networking Resources', () => {
    test('should create a VPC with a /16 CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should create 3 public and 3 private subnets', () => {
      const resourceKeys = Object.keys(template.Resources);
      const publicSubnets = resourceKeys.filter(
        k =>
          k.startsWith('PublicSubnet') &&
          template.Resources[k].Type === 'AWS::EC2::Subnet'
      );
      const privateSubnets = resourceKeys.filter(
        k =>
          k.startsWith('PrivateSubnet') &&
          template.Resources[k].Type === 'AWS::EC2::Subnet'
      );
      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });

    test('should create an Internet Gateway and 3 NAT Gateways', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const natGateways = Object.keys(template.Resources).filter(
        k => template.Resources[k].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways.length).toBe(3);
    });

    test('Public Route Table should route to the Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Private Route Tables should route to their respective NAT Gateways', () => {
      const routeA = template.Resources.PrivateRouteA;
      expect(routeA.Properties.NatGatewayId).toEqual({ Ref: 'NatGatewayA' });
    });
  });

  describe('Security Configuration', () => {
    test('ALB Security Group should allow inbound HTTPS from the internet', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const httpsRule = albSg.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 443
      );
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(albSg.Properties.SecurityGroupIngress.length).toBe(1);
    });

    test('EC2 Security Group should only allow inbound traffic from the ALB Security Group', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      const ingressRule = ec2Sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
      expect(ec2Sg.Properties.SecurityGroupIngress.length).toBe(1);
    });

    test('EC2 IAM Role should use managed policies for least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.Policies).toBeUndefined();
    });
  });

  describe('Compute and Load Balancer Resources', () => {
    test('Application Load Balancer should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB Listener should handle HTTPS and forward traffic', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });

    test('Auto Scaling Group should be configured for high availability', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('6');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('Launch Template should use latest Amazon Linux 2 AMI and enable detailed monitoring', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      expect(data.Monitoring.Enabled).toBe(true);
      expect(data.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });
  });

  describe('Scaling, Storage, and DNS', () => {
    test('ASG should have a target tracking policy for CPU utilization', () => {
      const policy = template.Resources.ScaleUpPolicy;
      const config = policy.Properties.TargetTrackingConfiguration;
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe(
        'ASGAverageCPUUtilization'
      );
      expect(config.TargetValue).toBe(70.0);
    });

    test('S3 Bucket should block all public access and have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const accessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(accessBlock.BlockPublicAcls).toBe(true);
      expect(accessBlock.BlockPublicPolicy).toBe(true);

      const versioning = bucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');

      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Route53 DNS record should be an Alias pointing to the ALB', () => {
      const record = template.Resources.DNSRecord;
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs for testing and access', () => {
      const outputs = template.Outputs;
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBe(15);
      expect(outputs.WebAppURL).toBeDefined();
      expect(outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.PublicSubnetAId).toBeDefined();
    });

    test('WebAppURL output should be correctly formed', () => {
      const output = template.Outputs.WebAppURL;
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://${DnsName}' });
    });

    test('S3BucketName output should correctly reference the bucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
    });
  });
});
