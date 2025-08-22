import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Environment CloudFormation Template', () => {
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
        'Multi-Environment Infrastructure - Development and Production environments with VPCs, EC2, S3, IAM, and VPC Endpoints'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Suffix for all resource names to ensure uniqueness');
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envNameParam = template.Parameters.EnvironmentName;
      expect(envNameParam.Type).toBe('String');
      expect(envNameParam.Default).toBe('MultiEnv');
      expect(envNameParam.Description).toBe('Base name for the environment resources');
    });

    test('InstanceType parameter should have correct properties', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.Default).toBe('t2.micro');
      expect(instanceTypeParam.AllowedValues).toContain('t2.micro');
      expect(instanceTypeParam.AllowedValues).toContain('t2.small');
    });
  });

  describe('VPC Resources', () => {
    test('should have both Dev and Prod VPCs', () => {
      expect(template.Resources.DevVPC).toBeDefined();
      expect(template.Resources.ProdVPC).toBeDefined();
    });

    test('both VPCs should have identical CIDR blocks (10.0.0.0/16)', () => {
      expect(template.Resources.DevVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.ProdVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPCs should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevVPC.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdVPC.DeletionPolicy).toBe('Delete');
    });

    test('VPCs should have DNS enabled', () => {
      expect(template.Resources.DevVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.DevVPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.ProdVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.ProdVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPCs should have environment-specific tags with ENVIRONMENT_SUFFIX', () => {
      const devTags = template.Resources.DevVPC.Properties.Tags;
      const prodTags = template.Resources.ProdVPC.Properties.Tags;
      
      expect(devTags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${EnvironmentName}-${EnvironmentSuffix}-Dev-VPC' }
      });
      
      expect(prodTags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${EnvironmentName}-${EnvironmentSuffix}-Prod-VPC' }
      });
    });
  });

  describe('Network Resources', () => {
    test('should have Internet Gateways for both environments', () => {
      expect(template.Resources.DevInternetGateway).toBeDefined();
      expect(template.Resources.ProdInternetGateway).toBeDefined();
      expect(template.Resources.DevVPCGatewayAttachment).toBeDefined();
      expect(template.Resources.ProdVPCGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateways for both environments', () => {
      expect(template.Resources.DevNATGateway).toBeDefined();
      expect(template.Resources.ProdNATGateway).toBeDefined();
      expect(template.Resources.DevNATGatewayEIP).toBeDefined();
      expect(template.Resources.ProdNATGatewayEIP).toBeDefined();
    });

    test('should have public and private subnets for both environments', () => {
      expect(template.Resources.DevPublicSubnet).toBeDefined();
      expect(template.Resources.DevPrivateSubnet).toBeDefined();
      expect(template.Resources.ProdPublicSubnet).toBeDefined();
      expect(template.Resources.ProdPrivateSubnet).toBeDefined();
    });

    test('subnets should have correct CIDR blocks', () => {
      expect(template.Resources.DevPublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.DevPrivateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.ProdPublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.ProdPrivateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have route tables and routes configured', () => {
      expect(template.Resources.DevPublicRouteTable).toBeDefined();
      expect(template.Resources.DevPrivateRouteTable).toBeDefined();
      expect(template.Resources.ProdPublicRouteTable).toBeDefined();
      expect(template.Resources.ProdPrivateRouteTable).toBeDefined();
      expect(template.Resources.DevPublicRoute).toBeDefined();
      expect(template.Resources.DevPrivateRoute).toBeDefined();
      expect(template.Resources.ProdPublicRoute).toBeDefined();
      expect(template.Resources.ProdPrivateRoute).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have S3 buckets for both environments', () => {
      expect(template.Resources.DevS3Bucket).toBeDefined();
      expect(template.Resources.ProdS3Bucket).toBeDefined();
    });

    test('S3 buckets should have versioning enabled', () => {
      expect(template.Resources.DevS3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.ProdS3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 buckets should have public access blocked', () => {
      const devBlock = template.Resources.DevS3Bucket.Properties.PublicAccessBlockConfiguration;
      const prodBlock = template.Resources.ProdS3Bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(devBlock.BlockPublicAcls).toBe(true);
      expect(devBlock.BlockPublicPolicy).toBe(true);
      expect(devBlock.IgnorePublicAcls).toBe(true);
      expect(devBlock.RestrictPublicBuckets).toBe(true);
      
      expect(prodBlock.BlockPublicAcls).toBe(true);
      expect(prodBlock.BlockPublicPolicy).toBe(true);
      expect(prodBlock.IgnorePublicAcls).toBe(true);
      expect(prodBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket names should include environment suffix', () => {
      const devBucketName = template.Resources.DevS3Bucket.Properties.BucketName;
      const prodBucketName = template.Resources.ProdS3Bucket.Properties.BucketName;
      
      expect(devBucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(prodBucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 buckets should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevS3Bucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdS3Bucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM roles for both environments', () => {
      expect(template.Resources.DevEC2Role).toBeDefined();
      expect(template.Resources.ProdEC2Role).toBeDefined();
    });

    test('IAM roles should have least privilege S3 access', () => {
      const devPolicy = template.Resources.DevEC2Role.Properties.Policies[0];
      const prodPolicy = template.Resources.ProdEC2Role.Properties.Policies[0];
      
      const expectedActions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'];
      
      expect(devPolicy.PolicyDocument.Statement[0].Action).toEqual(expectedActions);
      expect(prodPolicy.PolicyDocument.Statement[0].Action).toEqual(expectedActions);
    });

    test('IAM roles should be scoped to their respective S3 buckets', () => {
      const devPolicy = template.Resources.DevEC2Role.Properties.Policies[0];
      const prodPolicy = template.Resources.ProdEC2Role.Properties.Policies[0];
      
      expect(devPolicy.PolicyDocument.Statement[0].Resource).toContainEqual({
        'Fn::GetAtt': ['DevS3Bucket', 'Arn']
      });
      
      expect(prodPolicy.PolicyDocument.Statement[0].Resource).toContainEqual({
        'Fn::GetAtt': ['ProdS3Bucket', 'Arn']
      });
    });

    test('should have instance profiles for both environments', () => {
      expect(template.Resources.DevInstanceProfile).toBeDefined();
      expect(template.Resources.ProdInstanceProfile).toBeDefined();
    });

    test('IAM resources should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevEC2Role.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdEC2Role.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DevInstanceProfile.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdInstanceProfile.DeletionPolicy).toBe('Delete');
    });
  });

  describe('EC2 Instances', () => {
    test('should have EC2 instances for both environments', () => {
      expect(template.Resources.DevEC2Instance).toBeDefined();
      expect(template.Resources.ProdEC2Instance).toBeDefined();
    });

    test('EC2 instances should use t2.micro instance type by default', () => {
      expect(template.Resources.DevEC2Instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(template.Resources.ProdEC2Instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('EC2 instances should be deployed in private subnets', () => {
      expect(template.Resources.DevEC2Instance.Properties.SubnetId).toEqual({ Ref: 'DevPrivateSubnet' });
      expect(template.Resources.ProdEC2Instance.Properties.SubnetId).toEqual({ Ref: 'ProdPrivateSubnet' });
    });

    test('EC2 instances should have IAM instance profiles attached', () => {
      expect(template.Resources.DevEC2Instance.Properties.IamInstanceProfile).toEqual({ Ref: 'DevInstanceProfile' });
      expect(template.Resources.ProdEC2Instance.Properties.IamInstanceProfile).toEqual({ Ref: 'ProdInstanceProfile' });
    });

    test('EC2 instances should have security groups attached', () => {
      expect(template.Resources.DevEC2Instance.Properties.SecurityGroupIds).toContainEqual({ Ref: 'DevEC2SecurityGroup' });
      expect(template.Resources.ProdEC2Instance.Properties.SecurityGroupIds).toContainEqual({ Ref: 'ProdEC2SecurityGroup' });
    });

    test('EC2 instances should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevEC2Instance.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdEC2Instance.DeletionPolicy).toBe('Delete');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC endpoints for both environments', () => {
      expect(template.Resources.DevS3VPCEndpoint).toBeDefined();
      expect(template.Resources.ProdS3VPCEndpoint).toBeDefined();
    });

    test('VPC endpoints should be Gateway type', () => {
      expect(template.Resources.DevS3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
      expect(template.Resources.ProdS3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('VPC endpoints should be associated with route tables', () => {
      const devEndpoint = template.Resources.DevS3VPCEndpoint.Properties;
      const prodEndpoint = template.Resources.ProdS3VPCEndpoint.Properties;
      
      expect(devEndpoint.RouteTableIds).toContainEqual({ Ref: 'DevPrivateRouteTable' });
      expect(devEndpoint.RouteTableIds).toContainEqual({ Ref: 'DevPublicRouteTable' });
      
      expect(prodEndpoint.RouteTableIds).toContainEqual({ Ref: 'ProdPrivateRouteTable' });
      expect(prodEndpoint.RouteTableIds).toContainEqual({ Ref: 'ProdPublicRouteTable' });
    });

    test('VPC endpoints should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevS3VPCEndpoint.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdS3VPCEndpoint.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Security Groups', () => {
    test('should have security groups for both environments', () => {
      expect(template.Resources.DevEC2SecurityGroup).toBeDefined();
      expect(template.Resources.ProdEC2SecurityGroup).toBeDefined();
    });

    test('security groups should allow all outbound traffic', () => {
      const devSG = template.Resources.DevEC2SecurityGroup.Properties;
      const prodSG = template.Resources.ProdEC2SecurityGroup.Properties;
      
      expect(devSG.SecurityGroupEgress[0].IpProtocol).toBe('-1');
      expect(devSG.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
      
      expect(prodSG.SecurityGroupEgress[0].IpProtocol).toBe('-1');
      expect(prodSG.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('security groups should have DeletionPolicy: Delete', () => {
      expect(template.Resources.DevEC2SecurityGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ProdEC2SecurityGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have all required VPC outputs', () => {
      expect(template.Outputs.DevVPCId).toBeDefined();
      expect(template.Outputs.ProdVPCId).toBeDefined();
    });

    test('should have all required subnet outputs', () => {
      expect(template.Outputs.DevPrivateSubnetId).toBeDefined();
      expect(template.Outputs.ProdPrivateSubnetId).toBeDefined();
    });

    test('should have all required S3 bucket outputs', () => {
      expect(template.Outputs.DevS3BucketName).toBeDefined();
      expect(template.Outputs.ProdS3BucketName).toBeDefined();
    });

    test('should have all required EC2 instance outputs', () => {
      expect(template.Outputs.DevEC2InstanceId).toBeDefined();
      expect(template.Outputs.ProdEC2InstanceId).toBeDefined();
    });

    test('should have all required VPC endpoint outputs', () => {
      expect(template.Outputs.DevS3VPCEndpointId).toBeDefined();
      expect(template.Outputs.ProdS3VPCEndpointId).toBeDefined();
    });

    test('outputs should have export names with environment suffix', () => {
      const outputKeys = Object.keys(template.Outputs);
      
      outputKeys.forEach(key => {
        const output = template.Outputs[key];
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all resources should have DeletionPolicy: Delete', () => {
      const resources = Object.keys(template.Resources);
      
      resources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
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

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should have many resources for both environments
    });

    test('should have exactly 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environment suffix', () => {
      const namedResources = [
        'DevEC2Role', 'ProdEC2Role',
        'DevInstanceProfile', 'ProdInstanceProfile',
        'DevEC2SecurityGroup', 'ProdEC2SecurityGroup'
      ];
      
      namedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.RoleName) {
          expect(resource.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.InstanceProfileName) {
          expect(resource.Properties.InstanceProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.GroupName) {
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});