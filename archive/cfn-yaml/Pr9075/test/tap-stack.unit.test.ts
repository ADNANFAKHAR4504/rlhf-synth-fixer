import fs from 'fs';
import path from 'path';

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
      expect(template.Description).toContain('Multi-Region Infrastructure');
    });

    test('should have all main sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('synthtrainr926.internal');
    });

    test('parameter count should be exactly 2', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS enabled', () => {
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
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('public subnets should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateway should use correct EIP and subnet', () => {
      expect(template.Resources.NatGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({
        'Ref': 'PublicSubnet1'
      });
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have default public route', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have default private route through NAT', () => {
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPrivateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPrivateRoute1.Properties.NatGatewayId).toEqual({
        'Ref': 'NatGateway1'
      });
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should have DynamoDB table resource', () => {
      expect(template.Resources.DynamoDBTable).toBeDefined();
      expect(template.Resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct properties', () => {
      const table = template.Resources.DynamoDBTable.Properties;
      expect(table.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.TableName).toEqual({
        'Fn::Sub': 'GlobalTable-${EnvironmentSuffix}'
      });
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.DynamoDBTable.Properties;
      expect(table.KeySchema).toHaveLength(2);
      expect(table.KeySchema[0].AttributeName).toBe('id');
      expect(table.KeySchema[0].KeyType).toBe('HASH');
      expect(table.KeySchema[1].AttributeName).toBe('timestamp');
      expect(table.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('DynamoDB table should have SSE enabled', () => {
      const table = template.Resources.DynamoDBTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
    });

    test('DynamoDB table should have Point-in-Time Recovery enabled', () => {
      const table = template.Resources.DynamoDBTable.Properties;
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have stream specification', () => {
      const table = template.Resources.DynamoDBTable.Properties;
      expect(table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
      expect(bucket.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(90);
    });
  });

  describe('Route 53 Resources', () => {
    test('should have Route 53 Hosted Zone', () => {
      expect(template.Resources.Route53HostedZone).toBeDefined();
      expect(template.Resources.Route53HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('should have Route 53 Health Check', () => {
      expect(template.Resources.Route53HealthCheck).toBeDefined();
      expect(template.Resources.Route53HealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('Route 53 Health Check should have correct configuration', () => {
      const healthCheck = template.Resources.Route53HealthCheck.Properties.HealthCheckConfig;
      expect(healthCheck.Type).toBe('HTTP');
      expect(healthCheck.Port).toBe(80);
      expect(healthCheck.RequestInterval).toBe(30);
      expect(healthCheck.FailureThreshold).toBe(3);
    });

    test('should have Route 53 Record', () => {
      expect(template.Resources.Route53Record).toBeDefined();
      expect(template.Resources.Route53Record.Type).toBe('AWS::Route53::RecordSet');
    });

    test('Route 53 Record should have correct properties', () => {
      const record = template.Resources.Route53Record.Properties;
      expect(record.Type).toBe('A');
      expect(record.SetIdentifier).toBe('Primary');
      expect(record.Weight).toBe(100);
      expect(record.AliasTarget.EvaluateTargetHealth).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB Security Group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(sg).toHaveLength(2);
      expect(sg[0].FromPort).toBe(80);
      expect(sg[0].ToPort).toBe(80);
      expect(sg[1].FromPort).toBe(443);
      expect(sg[1].ToPort).toBe(443);
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB Target Group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Instance Role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 Instance Role should have correct policies', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Policies).toHaveLength(2);
      expect(role.Policies[0].PolicyName).toBe('DynamoDBAccess');
      expect(role.Policies[1].PolicyName).toBe('S3Access');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have DynamoDB VPC Endpoint', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('DynamoDB VPC Endpoint should be Gateway type', () => {
      const endpoint = template.Resources.DynamoDBVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb'
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Application Log Group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Application Log Group should have retention', () => {
      const logGroup = template.Resources.ApplicationLogGroup.Properties;
      expect(logGroup.RetentionInDays).toBe(30);
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway1',
        'PublicRouteTable', 'PrivateRouteTable1', 'DynamoDBTable', 'S3Bucket',
        'ApplicationLoadBalancer', 'ALBSecurityGroup', 'ALBTargetGroup',
        'ApplicationLogGroup', 'EC2InstanceRole'
      ];

      taggableResources.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties.Tags) {
          const tags = template.Resources[resourceName].Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('all taggable resources should have Name tag', () => {
      const taggableResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway1',
        'PublicRouteTable', 'PrivateRouteTable1', 'DynamoDBTable', 'S3Bucket',
        'ApplicationLoadBalancer', 'ALBSecurityGroup'
      ];

      taggableResources.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties.Tags) {
          const tags = template.Resources[resourceName].Properties.Tags;
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'LoadBalancerDNS',
        'S3BucketName', 'DynamoDBTableName', 'DynamoDBTableArn',
        'HostedZoneId', 'EnvironmentSuffix', 'NATGatewayIP',
        'EC2InstanceProfileArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentSuffix in naming', () => {
      const namedResources = [
        { resource: 'DynamoDBTable', nameProperty: 'TableName', expectedPattern: 'GlobalTable-${EnvironmentSuffix}' },
        { resource: 'EC2InstanceRole', nameProperty: 'RoleName', expectedPattern: 'EC2InstanceRole-${EnvironmentSuffix}' },
        { resource: 'EC2InstanceProfile', nameProperty: 'InstanceProfileName', expectedPattern: 'EC2InstanceProfile-${EnvironmentSuffix}' }
      ];

      namedResources.forEach(({ resource, nameProperty, expectedPattern }) => {
        const actualName = template.Resources[resource].Properties[nameProperty];
        expect(actualName).toEqual({ 'Fn::Sub': expectedPattern });
      });
    });
  });

  describe('Cross-Resource References', () => {
    test('ALB should reference correct subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('ALB should reference security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.SecurityGroups).toContainEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('Route 53 Record should reference ALB', () => {
      const record = template.Resources.Route53Record.Properties;
      expect(record.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('EC2 Instance Profile should reference EC2 Role', () => {
      const profile = template.Resources.EC2InstanceProfile.Properties;
      expect(profile.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Template Completeness', () => {
    test('should have minimum required resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(25);
    });

    test('should have sufficient outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });

    test('all resources should have proper type definitions', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        expect(template.Resources[resourceKey].Type).toBeDefined();
        expect(template.Resources[resourceKey].Type).toMatch(/^AWS::/);
      });
    });
  });
});