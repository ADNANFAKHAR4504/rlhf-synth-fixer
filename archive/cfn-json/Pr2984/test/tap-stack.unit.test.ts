import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'TAP Stack - VPC Infrastructure with Security, Monitoring, and Load Balancing'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Subnet Configuration', () => {
    test('should have three subnets with correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();

      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnetA.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnetB.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnet should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnetA = template.Resources.PrivateSubnetA;
      const privateSubnetB = template.Resources.PrivateSubnetB;

      expect(publicSubnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnetA.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnetB.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public and private route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have correct route configurations', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
      
      const publicRoute = template.Resources.PublicRoute;
      const privateRoute = template.Resources.PrivateRoute;
      
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetARouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetBRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have web security group with HTTP/HTTPS rules', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      const securityGroup = template.Resources.WebSecurityGroup;
      
      expect(securityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(securityGroup.Properties.SecurityGroupIngress).toHaveLength(2);
      
      const ingressRules = securityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].ToPort).toBe(80);
      expect(ingressRules[1].FromPort).toBe(443);
      expect(ingressRules[1].ToPort).toBe(443);
    });

    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const albSecurityGroup = template.Resources.ALBSecurityGroup;
      
      expect(albSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSecurityGroup.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB with target group and listener', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBListener).toBeDefined();
      
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internal');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('ALB target group should have health check configuration', () => {
      const targetGroup = template.Resources.ALBTargetGroup;
      expect(targetGroup.Properties.HealthCheckPath).toBe('/health');
      expect(targetGroup.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('VPC Flow Logs and Monitoring', () => {
    test('should have VPC Flow Logs configuration', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      
      const flowLogsRole = template.Resources.VPCFlowLogsRole;
      expect(flowLogsRole.Type).toBe('AWS::IAM::Role');
      
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('should have CloudWatch Logs encryption for production', () => {
      expect(template.Resources.CloudWatchLogsKMSKey).toBeDefined();
      expect(template.Resources.CloudWatchLogsKMSKeyAlias).toBeDefined();
      
      const kmsKey = template.Resources.CloudWatchLogsKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Condition).toBe('IsProduction');
    });
  });

  describe('Route 53 DNS', () => {
    test('should have hosted zone and DNS records', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.ALBDNSRecord).toBeDefined();
      
      const hostedZone = template.Resources.HostedZone;
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
      
      const dnsRecord = template.Resources.ALBDNSRecord;
      expect(dnsRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(dnsRecord.Properties.Type).toBe('A');
    });
  });

  describe('Outputs', () => {
    test('should have all required VPC infrastructure outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetAId',
        'PrivateSubnetBId',
        'WebSecurityGroupId',
        'ALBSecurityGroupId',
        'ApplicationLoadBalancerArn',
        'ApplicationLoadBalancerDNS',
        'HostedZoneId',
        'VPCFlowLogsGroupName',
        'EnvironmentSuffix',
        'StackName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('ALB DNS output should be correct', () => {
      const output = template.Outputs.ApplicationLoadBalancerDNS;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
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

    test('should have expected number of resources for VPC infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnetA',
        'PrivateSubnetB',
        'NATGateway',
        'WebSecurityGroup',
        'ALBSecurityGroup',
        'ApplicationLoadBalancer',
        'VPCFlowLogsRole'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });

    test('all resources should have Environment and Application tags', () => {
      const taggedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnetA',
        'PrivateSubnetB',
        'WebSecurityGroup',
        'ApplicationLoadBalancer'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          const applicationTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Application');
          
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          expect(applicationTag).toBeDefined();
          expect(applicationTag.Value).toBe('TapStack');
        }
      });
    });
  });
});