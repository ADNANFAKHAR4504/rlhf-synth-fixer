import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Startup Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Run `pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json` to convert YAML to JSON
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
      expect(template.Description).toBe(
        'Secure AWS environment with VPC, ALB, ASG, and EC2 instances running Nginx'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
    });

    test('InstanceType parameter should have correct properties', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.Default).toBe('t3.micro');
      expect(instanceTypeParam.Description).toBe('EC2 instance type for the Auto Scaling Group');
      expect(instanceTypeParam.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('KeyPairName parameter should have correct properties', () => {
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('String');
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Description).toBe('Name of an existing EC2 KeyPair to enable SSH access (leave empty to skip)');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ 'Ref': 'KeyPairName' }, ''] }]
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Subnet Resources', () => {
    test('should have exactly 2 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have exactly 2 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const publicSubnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(publicSubnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('Route Tables', () => {
    test('should have public and private route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('public route table should route to Internet Gateway', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ 'Ref': 'InternetGateway' });
    });

    test('private route table should route to NAT Gateway', () => {
      const privateRoute = template.Resources.DefaultPrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ 'Ref': 'NatGateway' });
    });

    test('should have correct route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = albSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[1].FromPort).toBe(443);
    });

    test('should have Web Server security group', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG).toBeDefined();
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = webSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ 'Ref': 'ALBSecurityGroup' });
      expect(ingressRules[1].FromPort).toBe(22);
      expect(ingressRules[1].CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group with health checks', () => {
      const targetGroup = template.Resources.ALBTargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have launch template', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');

      const data = launchTemplate.Properties.LaunchTemplateData;
      expect(data.InstanceType).toEqual({ 'Ref': 'InstanceType' });
      expect(data.UserData).toBeDefined();
    });

    test('launch template should conditionally set KeyName', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const keyName = launchTemplate.Properties.LaunchTemplateData.KeyName;
      expect(keyName).toEqual({
        'Fn::If': ['HasKeyPair', { 'Ref': 'KeyPairName' }, { 'Ref': 'AWS::NoValue' }]
      });
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets).toEqual([
        { 'Ref': 'PrivateSubnet1' },
        { 'Ref': 'PrivateSubnet2' }
      ]);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBSecurityGroupId',
        'WebServerSecurityGroupId',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct ALB DNS output', () => {
      const albDnsOutput = template.Outputs.ApplicationLoadBalancerDNS;
      expect(albDnsOutput.Description).toBe('Application Load Balancer DNS Name');
      expect(albDnsOutput.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('should have correct ALB URL output', () => {
      const albUrlOutput = template.Outputs.ApplicationLoadBalancerURL;
      expect(albUrlOutput.Description).toBe('Application Load Balancer URL');
      expect(albUrlOutput.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway',
        'NatGatewayEIP',
        'PublicRouteTable',
        'PrivateRouteTable',
        'ALBSecurityGroup',
        'WebServerSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Development');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const expectedResourceCount = 24; // Count all resources in template
      const actualResourceCount = Object.keys(template.Resources).length;
      expect(actualResourceCount).toBe(expectedResourceCount);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });
});