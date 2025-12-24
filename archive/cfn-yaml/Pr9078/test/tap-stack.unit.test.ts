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
      expect(template.Description).toBe('Simplified Secure Infrastructure for testing');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('staging');
      expect(template.Parameters.Environment.AllowedValues).toContain('prod');
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Type).toBe('String');
      expect(template.Parameters.Project.Default).toBe('secure-infra');
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Type).toBe('String');
      expect(template.Parameters.Owner.Default).toBe('security-team');
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
      
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr.Default).toBe('10.0.1.0/24');
      
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr.Default).toBe('10.0.2.0/24');
      
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr.Default).toBe('10.0.10.0/24');
      
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr.Default).toBe('10.0.11.0/24');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('VPC should reference CIDR parameter', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('subnets should reference VPC', () => {
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PublicSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    });

    test('public route should depend on IGW attachment', () => {
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  describe('Security Group Resources', () => {
    test('should have web server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web security group should have ingress rules', () => {
      const ingress = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);
      
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
    });

    test('security group should reference VPC', () => {
      expect(template.Resources.WebServerSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logging bucket should have encryption', () => {
      const encryption = template.Resources.LoggingBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('logging bucket should block public access', () => {
      const publicAccess = template.Resources.LoggingBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('bucket name should include environment suffix', () => {
      const bucketName = template.Resources.LoggingBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnetIds).toBeDefined();
      expect(template.Outputs.PrivateSubnetIds).toBeDefined();
    });

    test('should have security group output', () => {
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId.Value).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('should have logging bucket output', () => {
      expect(template.Outputs.LoggingBucketName).toBeDefined();
      expect(template.Outputs.LoggingBucketName.Value).toEqual({ Ref: 'LoggingBucket' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with Name tag should include environment suffix', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('all resources with explicit names should include environment suffix', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties) {
          // Check GroupName for security groups
          if (resource.Properties.GroupName && resource.Properties.GroupName['Fn::Sub']) {
            expect(resource.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
          // Check BucketName for S3 buckets
          if (resource.Properties.BucketName && resource.Properties.BucketName['Fn::Sub']) {
            expect(resource.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have retention policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBeUndefined();
        expect(resource.UpdateReplacePolicy).toBeUndefined();
      });
    });

    test('S3 buckets should have encryption enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.BucketEncryption).toBeDefined();
        }
      });
    });

    test('S3 buckets should block public access', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::S3::Bucket') {
          const publicAccess = resource.Properties.PublicAccessBlockConfiguration;
          expect(publicAccess).toBeDefined();
          expect(publicAccess.BlockPublicAcls).toBe(true);
          expect(publicAccess.BlockPublicPolicy).toBe(true);
        }
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('IGW attachment should reference both IGW and VPC', () => {
      expect(template.Resources.InternetGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('route table associations should reference correct resources', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Template Completeness', () => {
    test('should have at least minimum required resources', () => {
      const requiredResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::RouteTable',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket'
      ];

      requiredResourceTypes.forEach(resourceType => {
        const hasResource = Object.values(template.Resources).some(
          (resource: any) => resource.Type === resourceType
        );
        expect(hasResource).toBe(true);
      });
    });

    test('should have proper tagging strategy', () => {
      const requiredTags = ['Environment', 'Project', 'Owner'];
      
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          requiredTags.forEach(tagKey => {
            const hasTag = resource.Properties.Tags.some((tag: any) => tag.Key === tagKey);
            expect(hasTag).toBe(true);
          });
        }
      });
    });
  });
});