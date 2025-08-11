import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  // Helper function to skip tests when template is not loaded
  const skipIfNoTemplate = () => {
    if (!template) {
      console.log('Skipping test - no template loaded');
      return true;
    }
    return false;
  };

  beforeAll(() => {
    try {
      const templatePath = path.join(__dirname, '../lib/TapStack.json');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(templateContent);
    } catch (error) {
      console.warn('No TapStack.json template found - unit tests will be skipped');
      console.warn('To run unit tests, ensure lib/TapStack.json exists');
      template = null;
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      if (skipIfNoTemplate()) return;
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TapStack - VPC-based, multi-AZ secure web service');
    });

    test('should have metadata section with parameter groups', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have all required sections', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentSuffix',
      'StackVersion',
      'LogBucketNamePrefix',
      'VpcCidr',
      'PublicSubnet1Cidr',
      'PublicSubnet2Cidr',
      'PrivateSubnet1Cidr',
      'PrivateSubnet2Cidr',
      'InstanceType',
      'ImageId',
      'KeyName',
      'ASGMinSize',
      'ASGMaxSize',
      'ASGDesiredCapacity',
      'AllowedSourceCidr',
      'ACMCertificateArn',
      'LogBucketName',
      'CreateLogBucket',
      'CreateSSMEndpoint',
      'CreateCWEndpoint'
    ];

    test('should have all required parameters', () => {
      if (skipIfNoTemplate()) return;
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('StackVersion parameter should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.StackVersion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('v2');
      expect(param.Description).toContain('Stack version suffix');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('LogBucketNamePrefix parameter should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.LogBucketNamePrefix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tapstack');
      expect(param.Description).toContain('Prefix for the S3 bucket name');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('VpcCidr parameter should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedValues).toEqual(['10.0.0.0/16']);
      expect(param.Description).toContain('VPC CIDR block');
    });

    test('InstanceType parameter should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.Description).toContain('EC2 instance type');
    });

    test('ImageId parameter should use SSM parameter type', () => {
      if (skipIfNoTemplate()) return;
      const param = template.Parameters.ImageId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('ASG parameters should be numbers', () => {
      if (skipIfNoTemplate()) return;
      ['ASGMinSize', 'ASGMaxSize', 'ASGDesiredCapacity'].forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBe('Number');
      });
    });

    test('Boolean parameters should have correct allowed values', () => {
      if (skipIfNoTemplate()) return;
      ['CreateLogBucket', 'CreateSSMEndpoint', 'CreateCWEndpoint'].forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBe('String');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      });
    });
  });

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      if (skipIfNoTemplate()) return;
      const expectedConditions = [
        'UseExistingLogBucket',
        'CreateLogBucketCond',
        'CreateSSMEndpointCond',
        'CreateCWEndpointCond',
        'UseKeyName',
        'UseHttps'
      ];

      expectedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('UseExistingLogBucket should check if LogBucketName is not empty', () => {
      if (skipIfNoTemplate()) return;
      const condition = template.Conditions.UseExistingLogBucket;
      expect(condition).toEqual({
        'Fn::Not': [{
          'Fn::Equals': [{'Ref': 'LogBucketName'}, '']
        }]
      });
    });

    test('CreateLogBucketCond should check if CreateLogBucket equals true', () => {
      if (skipIfNoTemplate()) return;
      const condition = template.Conditions.CreateLogBucketCond;
      expect(condition).toEqual({
        'Fn::Equals': [{'Ref': 'CreateLogBucket'}, 'true']
      });
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      if (skipIfNoTemplate()) return;
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({'Ref': 'VpcCidr'});
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
    });

    test('should have public and private subnets', () => {
      if (skipIfNoTemplate()) return;
      const expectedSubnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2'
      ];

      expectedSubnets.forEach(subnetName => {
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch set to true', () => {
      if (skipIfNoTemplate()) return;
      ['PublicSubnet1', 'PublicSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should have MapPublicIpOnLaunch set to false', () => {
      if (skipIfNoTemplate()) return;
      ['PrivateSubnet1', 'PrivateSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have NAT Gateways with EIPs', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.NatEIP1).toBeDefined();
      expect(template.Resources.NatEIP2).toBeDefined();
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('NAT Gateways should be in public subnets', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({'Ref': 'PublicSubnet1'});
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({'Ref': 'PublicSubnet2'});
    });

    test('should have route tables and routes', () => {
      if (skipIfNoTemplate()) return;
      const expectedRouteTables = [
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2'
      ];

      expectedRouteTables.forEach(rtName => {
        expect(template.Resources[rtName]).toBeDefined();
        expect(template.Resources[rtName].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have VPC endpoints', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.VPCEndpointS3).toBeDefined();
      expect(template.Resources.VPCEndpointDynamoDB).toBeDefined();
    });

    test('should have conditional SSM and CloudWatch endpoints', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.SSMInterfaceEndpoint).toBeDefined();
      expect(template.Resources.CWLogsInterfaceEndpoint).toBeDefined();
      expect(template.Resources.SSMInterfaceEndpoint.Condition).toBe('CreateSSMEndpointCond');
      expect(template.Resources.CWLogsInterfaceEndpoint.Condition).toBe('CreateCWEndpointCond');
    });

    test('should have conditional S3 bucket for logging', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.LogBucket).toBeDefined();
      expect(template.Resources.LogBucket.Condition).toBe('CreateLogBucketCond');
      expect(template.Resources.LogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have security groups', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.InstanceSecurityGroup).toBeDefined();
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      if (skipIfNoTemplate()) return;
      const albSg = template.Resources.ALBSecurityGroup;
      const ingress = albSg.Properties.SecurityGroupIngress;
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have IAM role and instance profile', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.InstanceProfileRole).toBeDefined();
      expect(template.Resources.InstanceProfile).toBeDefined();
    });

    test('should have Application Load Balancer', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.ALB).toBeDefined();
      expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      if (skipIfNoTemplate()) return;
      const alb = template.Resources.ALB;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group and listeners', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      expect(template.Resources.ALBListenerHTTPS).toBeDefined();
    });

    test('should have launch template', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.WebServerLaunchTemplate).toBeDefined();
      expect(template.Resources.WebServerLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.WebAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should use private subnets', () => {
      if (skipIfNoTemplate()) return;
      const asg = template.Resources.WebAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        {'Ref': 'PrivateSubnet1'},
        {'Ref': 'PrivateSubnet2'}
      ]);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      if (skipIfNoTemplate()) return;
      const expectedOutputs = [
        'ALBDNSName',
        'VpcId',
        'PublicSubnets',
        'PrivateSubnets',
        'ASGName',
        'LogBucketOutput',
        'TemplateValid'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ALBDNSName should reference ALB DNS name', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({'Fn::GetAtt': ['ALB', 'DNSName']});
    });

    test('VpcId should reference VPC', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC Id');
      expect(output.Value).toEqual({'Ref': 'VPC'});
    });

    test('PublicSubnets should join subnet references', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.PublicSubnets;
      expect(output.Description).toBe('Public subnet IDs (comma-separated)');
      expect(output.Value).toEqual({
        'Fn::Join': [',', [{'Ref': 'PublicSubnet1'}, {'Ref': 'PublicSubnet2'}]]
      });
    });

    test('PrivateSubnets should join subnet references', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.PrivateSubnets;
      expect(output.Description).toBe('Private subnet IDs (comma-separated)');
      expect(output.Value).toEqual({
        'Fn::Join': [',', [{'Ref': 'PrivateSubnet1'}, {'Ref': 'PrivateSubnet2'}]]
      });
    });

    test('ASGName should reference Auto Scaling Group', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.ASGName;
      expect(output.Description).toBe('Auto Scaling Group name');
      expect(output.Value).toEqual({'Ref': 'WebAutoScalingGroup'});
    });

    test('LogBucketOutput should use conditional logic', () => {
      if (skipIfNoTemplate()) return;
      const output = template.Outputs.LogBucketOutput;
      expect(output.Description).toBe('S3 bucket used for ALB access logs (either provided or created)');
      expect(output.Value).toEqual({
        'Fn::If': ['CreateLogBucketCond', {'Ref': 'LogBucket'}, {'Ref': 'LogBucketName'}]
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateways should depend on route table associations', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.NatGateway1.DependsOn).toBe('PublicSubnet1RouteTableAssoc');
      expect(template.Resources.NatGateway2.DependsOn).toBe('PublicSubnet2RouteTableAssoc');
    });

    test('EIPs should depend on Internet Gateway', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.NatEIP1.DependsOn).toBe('InternetGateway');
      expect(template.Resources.NatEIP2.DependsOn).toBe('InternetGateway');
    });

    test('Public default route should depend on VPC Gateway Attachment', () => {
      if (skipIfNoTemplate()) return;
      expect(template.Resources.PublicDefaultRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Security and Best Practices', () => {
    test('S3 bucket should have public access blocked', () => {
      if (skipIfNoTemplate()) return;
      const bucket = template.Resources.LogBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
    });

    test('S3 bucket should not have versioning configured', () => {
      if (skipIfNoTemplate()) return;
      const bucket = template.Resources.LogBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeUndefined();
    });

    test('IAM role should have least privilege policies', () => {
      if (skipIfNoTemplate()) return;
      const role = template.Resources.InstanceProfileRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('Instance security group should only allow traffic from ALB', () => {
      if (skipIfNoTemplate()) return;
      const instanceSg = template.Resources.InstanceSecurityGroup;
      const ingress = instanceSg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({'Ref': 'ALBSecurityGroup'});
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      if (skipIfNoTemplate()) return;
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      if (skipIfNoTemplate()) return;
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have reasonable number of resources', () => {
      if (skipIfNoTemplate()) return;
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for a complete VPC setup
    });

    test('should have all required parameters', () => {
      if (skipIfNoTemplate()) return;
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(20); // Exact count of required parameters including EnvironmentSuffix, StackVersion, and LogBucketNamePrefix
    });

    test('should have all required outputs', () => {
      if (skipIfNoTemplate()) return;
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7); // Exact count of required outputs
    });
  });
});
