import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
      expect(template.Description).toContain('VPC with public and private subnets');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentName;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe('Environment name (e.g., dev, prod)');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toHaveLength(2);
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentName}-VPC' });
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentName' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet resource', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet should have correct configuration', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PrivateSubnet should have correct configuration', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('subnets should use dynamic AZ selection', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet = template.Resources.PrivateSubnet;
      
      expect(publicSubnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
      
      expect(privateSubnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });
  });

  describe('Internet Gateway and Routing', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have IGW attachment', () => {
      expect(template.Resources.IGWAttachment).toBeDefined();
      expect(template.Resources.IGWAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public route table and route', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('should have subnet route table association', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have private route table and route', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
      
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
    });

    test('NAT Gateway should reference correct resources', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGatewayEIP', 'AllocationId']
      });
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
    });
  });

  describe('IAM Resources', () => {
    test('should have S3ReadOnlyRole', () => {
      expect(template.Resources.S3ReadOnlyRole).toBeDefined();
      expect(template.Resources.S3ReadOnlyRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('S3ReadOnlyRole should have correct assume role policy', () => {
      const role = template.Resources.S3ReadOnlyRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('S3ReadOnlyRole should have S3 read-only policy', () => {
      const role = template.Resources.S3ReadOnlyRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3ReadOnlyAccess');
      expect(policies[0].PolicyDocument.Statement[0].Action).toEqual(['s3:Get*', 's3:List*']);
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2Instance resource', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      expect(template.Resources.EC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2Instance should have correct instance type', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.InstanceType).toBe('t3.micro');
    });

    test('EC2Instance should use dynamic AMI resolution', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });

    test('EC2Instance should be in public subnet with IAM profile', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });
  });

  describe('S3 Resources', () => {
    test('should have CloudWatchLogsBucket', () => {
      expect(template.Resources.CloudWatchLogsBucket).toBeDefined();
      expect(template.Resources.CloudWatchLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudWatchLogsBucketPolicy', () => {
      expect(template.Resources.CloudWatchLogsBucketPolicy).toBeDefined();
      expect(template.Resources.CloudWatchLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('S3 bucket should have modern ownership controls', () => {
      const bucket = template.Resources.CloudWatchLogsBucket;
      expect(bucket.Properties.OwnershipControls).toBeDefined();
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });

    test('bucket policy should allow CloudWatch Logs service', () => {
      const bucketPolicy = template.Resources.CloudWatchLogsBucketPolicy;
      const statement = bucketPolicy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:PutObject');
      expect(statement.Principal.Service).toEqual({ 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper tags', () => {
      const taggedResources = [
        'VPC', 'PublicSubnet', 'PrivateSubnet', 'InternetGateway',
        'PublicRouteTable', 'NatGatewayEIP', 'NatGateway', 'PrivateRouteTable',
        'S3ReadOnlyRole', 'EC2Instance', 'CloudWatchLogsBucket'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentName' });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
    });
  });

  describe('Dependencies and References', () => {
    test('resources should reference correct dependencies', () => {
      // Test VPC references
      expect(template.Resources.PublicSubnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      // Test route table references
      expect(template.Resources.PublicRoute.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(template.Resources.PrivateRoute.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      
      // Test instance profile reference
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toEqual([{ Ref: 'S3ReadOnlyRole' }]);
    });

    test('should have proper DependsOn relationships', () => {
      expect(template.Resources.NatGatewayEIP.DependsOn).toBe('IGWAttachment');
    });
  });
});
