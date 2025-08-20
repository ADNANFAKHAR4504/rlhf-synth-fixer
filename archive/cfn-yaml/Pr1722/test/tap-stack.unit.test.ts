import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const required = ['EnvironmentName', 'VpcCidr', 'InstanceType'];
      required.forEach(param =>
        expect(template.Parameters[param]).toBeDefined()
      );
    });
    test('should have correct EnvironmentName parameter', () => {
      const p = template.Parameters.EnvironmentName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('production');
      expect(p.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
      expect(p.ConstraintDescription).toMatch(/lowercase/);
    });
    test('should have correct VpcCidr parameter', () => {
      const p = template.Parameters.VpcCidr;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('10.0.0.0/16');
      expect(p.AllowedPattern).toMatch(/\d{1,3}/);
      expect(p.ConstraintDescription).toMatch(/CIDR/);
    });
    test('should have correct InstanceType parameter', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.medium');
      expect(p.AllowedValues).toContain('t3.micro');
      expect(p.AllowedValues).toContain('m5.xlarge');
      expect(p.ConstraintDescription).toMatch(/EC2 instance type/);
    });
  });

  describe('Resources', () => {
    test('should create a VPC with correct CIDR', () => {
      const vpc = template.Resources.ApplicationVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBeDefined();
    });
    test('should create two public and two private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });
    test('should create an Internet Gateway and attach it', () => {
      expect(template.Resources.ApplicationInternetGateway).toBeDefined();
      expect(
        template.Resources.ApplicationInternetGatewayAttachment
      ).toBeDefined();
    });
    test('should create NAT Gateways and EIPs', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });
    test('should create route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });
    test('should create security groups for ALB, instances, and bastion', () => {
      expect(
        template.Resources.ApplicationLoadBalancerSecurityGroup
      ).toBeDefined();
      expect(template.Resources.ApplicationInstanceSecurityGroup).toBeDefined();
      expect(template.Resources.BastionHostSecurityGroup).toBeDefined();
    });
    test('should create IAM roles and instance profile', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.CloudTrailRole).toBeDefined();
    });
    test('should create S3 buckets with encryption and no public access', () => {
      const buckets = [
        template.Resources.ApplicationArtifactsBucket,
        template.Resources.ApplicationLogsBucket,
      ];
      for (const bucket of buckets) {
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ).toBe(true);
      }
    });
    test('should create a KMS key for encryption', () => {
      const kms = template.Resources.ApplicationKMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
    });
    test('should create CloudTrail with log group and S3', () => {
      expect(template.Resources.ApplicationCloudTrail).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogsBucket).toBeDefined();
    });
    test('should create a bastion host with encrypted EBS', () => {
      const bastion = template.Resources.BastionHostInstance;
      expect(bastion).toBeDefined();
      expect(bastion.Type).toBe('AWS::EC2::Instance');
      expect(bastion.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
    });
    test('should enforce HTTPS on ALB security group', () => {
      const sg = template.Resources.ApplicationLoadBalancerSecurityGroup;
      expect(
        sg.Properties.SecurityGroupIngress.some(
          (r: any) => r.FromPort === 443 && r.ToPort === 443
        )
      ).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'ApplicationSecurityGroup',
        'ArtifactsBucket',
        'KMSKeyId',
        'BastionHostPublicIP',
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
    test('should have correct output descriptions and export names', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId.Description).toMatch(/VPC/i);
      expect(outputs.PublicSubnets.Description).toMatch(/public subnet/i);
      expect(outputs.PrivateSubnets.Description).toMatch(/private subnet/i);
      expect(outputs.ApplicationSecurityGroup.Description).toMatch(
        /Security group/i
      );
      expect(outputs.ArtifactsBucket.Description).toMatch(/artifacts bucket/i);
      expect(outputs.KMSKeyId.Description).toMatch(/KMS key/i);
      expect(outputs.BastionHostPublicIP.Description).toMatch(/bastion host/i);
      Object.values(outputs).forEach((output: any) => {
        expect(output.Export.Name['Fn::Sub']).toMatch(/\${EnvironmentName}-/);
      });
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(typeof template).toBe('object');
      expect(template).toBeDefined();
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 7 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use Fn::Sub for output export names with environment name', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export.Name['Fn::Sub']).toMatch(/\${EnvironmentName}-/);
      });
    });
    test('should apply tags to resources where required', () => {
      // All taggable resources should have Tags property
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::EC2::Instance',
      ];
      Object.values(template.Resources).forEach((res: any) => {
        if (taggableTypes.includes(res.Type)) {
          expect(res.Properties.Tags).toBeDefined();
        }
      });
    });
  });
});
