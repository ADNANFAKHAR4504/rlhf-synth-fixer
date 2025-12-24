import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Route53 Failover CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Production-ready EC2 failover infrastructure with Route 53 health checks for automated traffic redirection'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('failover-demo-key');
      expect(param.Description).toBe('Name of an existing EC2 KeyPair to enable SSH access to the instances');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });

    test('should have HostedZoneId parameter', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      const param = template.Parameters.HostedZoneId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Z0909377OVFW706BZN9J');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('failoverdemo.com');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have AllowedSSHCIDR parameter', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
      const param = template.Parameters.AllowedSSHCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
    });
  });

  describe('AMI Configuration', () => {
    test('should have LatestAmiId parameter for SSM resolution', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should reference LatestAmiId in EC2 instances', () => {
      const primaryInstance = template.Resources.PrimaryEC2Instance;
      const standbyInstance = template.Resources.StandbyEC2Instance;
      expect(primaryInstance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(standbyInstance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });
  });

  describe('Resources - VPC Infrastructure', () => {
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
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();
      
      const subnet1 = template.Resources.PublicSubnetAZ1;
      const subnet2 = template.Resources.PublicSubnetAZ2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have security group for web servers', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3); // HTTP, HTTPS, SSH
      
      // Check for HTTP rule
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Resources - EC2 Instances', () => {
    test('should have Primary EC2 instance', () => {
      expect(template.Resources.PrimaryEC2Instance).toBeDefined();
      const instance = template.Resources.PrimaryEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should have Standby EC2 instance', () => {
      expect(template.Resources.StandbyEC2Instance).toBeDefined();
      const instance = template.Resources.StandbyEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('should have instances in different subnets', () => {
      const primary = template.Resources.PrimaryEC2Instance;
      const standby = template.Resources.StandbyEC2Instance;
      
      expect(primary.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
      expect(standby.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ2' });
    });

    test('should have UserData for web server setup', () => {
      const primary = template.Resources.PrimaryEC2Instance;
      const standby = template.Resources.StandbyEC2Instance;
      
      expect(primary.Properties.UserData).toBeDefined();
      expect(standby.Properties.UserData).toBeDefined();
      
      // Check that UserData contains web server setup
      const primaryUserData = primary.Properties.UserData['Fn::Base64'];
      expect(primaryUserData).toContain('yum install -y httpd');
      expect(primaryUserData).toContain('systemctl start httpd');
    });
  });

  describe('Resources - IAM', () => {
    test('should have EC2 IAM role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });
  });

  describe('Resources - Route 53', () => {
    test('should have primary health check', () => {
      expect(template.Resources.PrimaryHealthCheck).toBeDefined();
      const healthCheck = template.Resources.PrimaryHealthCheck;
      expect(healthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(healthCheck.Properties.HealthCheckConfig).toBeDefined();
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('HTTP');
      expect(healthCheck.Properties.HealthCheckConfig.ResourcePath).toBe('/health');
    });

    test('should have DNS records with failover routing', () => {
      expect(template.Resources.PrimaryDNSRecord).toBeDefined();
      expect(template.Resources.StandbyDNSRecord).toBeDefined();
      
      const primary = template.Resources.PrimaryDNSRecord;
      const standby = template.Resources.StandbyDNSRecord;
      
      expect(primary.Type).toBe('AWS::Route53::RecordSet');
      expect(standby.Type).toBe('AWS::Route53::RecordSet');
      
      expect(primary.Properties.Failover).toBe('PRIMARY');
      expect(standby.Properties.Failover).toBe('SECONDARY');
      
      expect(primary.Properties.SetIdentifier).toBe('Primary');
      expect(standby.Properties.SetIdentifier).toBe('Standby');
    });

    test('should have health check associated with primary DNS record', () => {
      const primary = template.Resources.PrimaryDNSRecord;
      expect(primary.Properties.HealthCheckId).toEqual({ Ref: 'PrimaryHealthCheck' });
      
      const standby = template.Resources.StandbyDNSRecord;
      expect(standby.Properties.HealthCheckId).toBeUndefined();
    });
  });

  describe('Resources - CloudWatch', () => {
    test('should have CloudWatch alarms for monitoring', () => {
      expect(template.Resources.PrimaryInstanceStatusAlarm).toBeDefined();
      expect(template.Resources.StandbyInstanceStatusAlarm).toBeDefined();
      
      const primaryAlarm = template.Resources.PrimaryInstanceStatusAlarm;
      const standbyAlarm = template.Resources.StandbyInstanceStatusAlarm;
      
      expect(primaryAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(standbyAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PrimaryInstanceId',
        'StandbyInstanceId',
        'PrimaryPublicIP',
        'StandbyPublicIP',
        'PrimaryPublicDNS',
        'StandbyPublicDNS',
        'PrimaryHealthCheckId',
        'DomainName',
        'VPCId',
        'WebServerSecurityGroupId',
        'PrimaryAvailabilityZone',
        'StandbyAvailabilityZone'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct instance outputs', () => {
      const primaryInstanceOutput = template.Outputs.PrimaryInstanceId;
      expect(primaryInstanceOutput.Description).toBe('Instance ID of the primary web server');
      expect(primaryInstanceOutput.Value).toEqual({ Ref: 'PrimaryEC2Instance' });
      
      const standbyInstanceOutput = template.Outputs.StandbyInstanceId;
      expect(standbyInstanceOutput.Description).toBe('Instance ID of the standby web server');
      expect(standbyInstanceOutput.Value).toEqual({ Ref: 'StandbyEC2Instance' });
    });

    test('should have correct IP outputs', () => {
      const primaryIPOutput = template.Outputs.PrimaryPublicIP;
      expect(primaryIPOutput.Description).toBe('Public IP address of the primary web server');
      expect(primaryIPOutput.Value).toEqual({ 'Fn::GetAtt': ['PrimaryEC2Instance', 'PublicIp'] });
      
      const standbyIPOutput = template.Outputs.StandbyPublicIP;
      expect(standbyIPOutput.Description).toBe('Public IP address of the standby web server');
      expect(standbyIPOutput.Value).toEqual({ 'Fn::GetAtt': ['StandbyEC2Instance', 'PublicIp'] });
    });

    test('should have health check output', () => {
      const healthCheckOutput = template.Outputs.PrimaryHealthCheckId;
      expect(healthCheckOutput.Description).toBe('Route53 Health Check ID for the primary instance (only available if Route53 is enabled)');
      expect(healthCheckOutput.Value).toEqual({ Ref: 'PrimaryHealthCheck' });
    });

    test('should have SecurityGroupId output', () => {
      const sgOutput = template.Outputs.SecurityGroupId;
      expect(sgOutput).toBeDefined();
      expect(sgOutput.Description).toBe('Web Server Security Group ID');
      expect(sgOutput.Value).toEqual({ Ref: 'WebServerSecurityGroup' });
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(19); // VPC components + EC2 instances + Route53 + IAM + CloudWatch
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // EnableRoute53, EnableCloudWatch, KeyPairName, InstanceType, LatestAmiId, HostedZoneId, DomainName, AllowedSSHCIDR
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent project tags', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'PublicSubnetAZ2',
        'PublicRouteTable',
        'WebServerSecurityGroup',
        'PrimaryEC2Instance',
        'StandbyEC2Instance'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('Route53FailoverDemo');
      });
    });
  });

  describe('Security Configuration', () => {
    test('should allow HTTP and HTTPS traffic', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have parameterized SSH access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });
  });
});