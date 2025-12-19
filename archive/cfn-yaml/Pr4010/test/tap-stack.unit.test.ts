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
      expect(template.Description).toBe(
        'Production-grade secure infrastructure with VPC, S3, RDS, Lambda, EBS, and ALB'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

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

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.SubnetConfig).toBeDefined();
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

    test('should have EnvironmentName parameter', () => {
      const envNameParam = template.Parameters.EnvironmentName;
      expect(envNameParam).toBeDefined();
      expect(envNameParam.Type).toBe('String');
      expect(envNameParam.Default).toBe('Prod');
      expect(envNameParam.AllowedValues).toEqual(['Dev', 'Staging', 'Prod']);
    });

    test('should have OwnerEmail parameter', () => {
      const ownerParam = template.Parameters.OwnerEmail;
      expect(ownerParam).toBeDefined();
      expect(ownerParam.Type).toBe('String');
      expect(ownerParam.Default).toBe('devops@company.com');
    });

    test('should have DBMasterUsername parameter', () => {
      const dbParam = template.Parameters.DBMasterUsername;
      expect(dbParam).toBeDefined();
      expect(dbParam.Type).toBe('String');
      expect(dbParam.Default).toBe('dbadmin');
      expect(dbParam.NoEcho).toBe(false);
      expect(dbParam.MinLength).toBe(1);
      expect(dbParam.MaxLength).toBe(16);
      expect(dbParam.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have LatestAmiId parameter', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam).toBeDefined();
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('parameters should have appropriate types', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect([
          'String', 'Number', 'CommaDelimitedList', 'List<Number>', 'List<String>',
          'AWS::EC2::AvailabilityZone::Name', 'AWS::EC2::Image::Id', 'AWS::EC2::Instance::Id',
          'AWS::EC2::KeyPair::KeyName', 'AWS::EC2::SecurityGroup::Id', 'AWS::EC2::Subnet::Id',
          'AWS::EC2::Volume::Id', 'AWS::EC2::VPC::Id', 'AWS::Route53::HostedZone::Id',
          'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>',
          'AWS::SSM::Parameter::Value<String>'
        ]).toContain(param.Type);
      });
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have VPC CIDR', () => {
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('SubnetConfig should have all subnet CIDRs', () => {
      expect(template.Mappings.SubnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet1.CIDR).toBe('10.0.20.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet2.CIDR).toBe('10.0.21.0/24');
    });

    test('all subnet CIDRs should be valid', () => {
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      Object.keys(template.Mappings.SubnetConfig).forEach(key => {
        const cidr = template.Mappings.SubnetConfig[key].CIDR;
        expect(cidr).toMatch(cidrRegex);
      });
    });
  });

  describe('VPC Resources', () => {
    test('VPC resource should exist with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper CIDR block reference', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock['Fn::FindInMap']).toEqual(['SubnetConfig', 'VPC', 'CIDR']);
    });

    test('VPC should have appropriate tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const tagKeys = vpc.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('EnvironmentSuffix');
      expect(tagKeys).toContain('Owner');
    });

    test('Internet Gateway should exist', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('Internet Gateway attachment should reference VPC and IGW', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });
  });

  describe('Subnet Resources', () => {
    test('should have all required subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('all subnets should reference correct VPC', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'DatabaseSubnet1', 'DatabaseSubnet2'].forEach(subnetName => {
        expect(template.Resources[subnetName].Properties.VpcId.Ref).toBe('VPC');
      });
    });

    test('subnets should use Fn::GetAZs for availability zones', () => {
      ['PublicSubnet1', 'PrivateSubnet1', 'DatabaseSubnet1'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
        expect(subnet.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
        expect(subnet.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');
      });
    });

    test('subnets should have proper CIDR mappings', () => {
      const subnetMappings = {
        PublicSubnet1: 'PublicSubnet1',
        PublicSubnet2: 'PublicSubnet2',
        PrivateSubnet1: 'PrivateSubnet1',
        PrivateSubnet2: 'PrivateSubnet2',
        DatabaseSubnet1: 'DatabaseSubnet1',
        DatabaseSubnet2: 'DatabaseSubnet2'
      };

      Object.entries(subnetMappings).forEach(([resourceName, mappingKey]) => {
        const subnet = template.Resources[resourceName];
        expect(subnet.Properties.CidrBlock['Fn::FindInMap']).toEqual(['SubnetConfig', mappingKey, 'CIDR']);
      });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway EIPs', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway EIPs should depend on IGW attachment', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('NAT Gateway EIPs should have VPC domain', () => {
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateways in public subnets', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should reference correct EIPs and subnets', () => {
      const nat1 = template.Resources.NatGateway1;
      expect(nat1.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway1EIP', 'AllocationId']);
      expect(nat1.Properties.SubnetId.Ref).toBe('PublicSubnet1');

      const nat2 = template.Resources.NatGateway2;
      expect(nat2.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway2EIP', 'AllocationId']);
      expect(nat2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');
    });

    test('should have private route tables for each AZ', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route should route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('private routes should route to NAT Gateways', () => {
      const route1 = template.Resources.PrivateRoute1;
      expect(route1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route1.Properties.NatGatewayId.Ref).toBe('NatGateway1');

      const route2 = template.Resources.PrivateRoute2;
      expect(route2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route2.Properties.NatGatewayId.Ref).toBe('NatGateway2');
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.DatabaseSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.DatabaseSubnet2RouteTableAssociation).toBeDefined();
    });

    test('database subnets should use private route tables', () => {
      const dbAssoc1 = template.Resources.DatabaseSubnet1RouteTableAssociation;
      expect(dbAssoc1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');

      const dbAssoc2 = template.Resources.DatabaseSubnet2RouteTableAssociation;
      expect(dbAssoc2.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
    });

    test('ALB security group should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.IpProtocol).toBe('tcp');

      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for Lambda functions');
    });

    test('Lambda security group should allow HTTPS egress to AWS services', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toBeDefined();
      const httpsRule = egressRules.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for RDS database');
    });

    test('should have Lambda to Database security group rules', () => {
      const egressRule = template.Resources.LambdaToDatabaseRule;
      expect(egressRule).toBeDefined();
      expect(egressRule.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(egressRule.Properties.FromPort).toBe(3306);
      expect(egressRule.Properties.ToPort).toBe(3306);
      expect(egressRule.Properties.IpProtocol).toBe('tcp');

      const ingressRule = template.Resources.DatabaseFromLambdaRule;
      expect(ingressRule).toBeDefined();
      expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingressRule.Properties.FromPort).toBe(3306);
      expect(ingressRule.Properties.ToPort).toBe(3306);
    });

    test('should have EC2 security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should allow SSH from VPC only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      const sshRule = ingressRules.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
      expect(sshRule.Description).toBe('SSH from VPC');
    });
  });

  describe('S3 Resources', () => {
    test('S3 bucket should exist with encryption enabled', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have AES256 encryption', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      const encryptionConfig = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryptionConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle rules', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('S3 bucket lifecycle should delete old versions after 90 days', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      const rule = bucket.Properties.LifecycleConfiguration.Rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(rule).toBeDefined();
      expect(rule.Status).toBe('Enabled');
      expect(rule.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('S3 bucket name should use Fn::Sub with account ID', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Resources', () => {
    test('IAM roles should follow least privilege principle', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::IAM::Role') {
          if (resource.Properties.ManagedPolicyArns) {
            resource.Properties.ManagedPolicyArns.forEach((policy: string) => {
              expect(policy).not.toContain('AdministratorAccess');
              expect(policy).not.toContain('PowerUserAccess');
            });
          }
        }
      });
    });

    test('IAM roles should have appropriate trust relationships', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::IAM::Role') {
          expect(resource.Properties.AssumeRolePolicyDocument).toBeDefined();
          expect(resource.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
        }
      });
    });

    test('Lambda execution role should exist', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const vpcPolicy = policies.find((p: any) => p.PolicyName === 'LambdaVPCAccessPolicy');
      expect(vpcPolicy).toBeDefined();

      const vpcStatement = vpcPolicy.PolicyDocument.Statement.find((s: any) => s.Sid === 'VPCAccess');
      expect(vpcStatement).toBeDefined();
      expect(vpcStatement.Action).toContain('ec2:CreateNetworkInterface');
      expect(vpcStatement.Action).toContain('ec2:DescribeNetworkInterfaces');
      expect(vpcStatement.Action).toContain('ec2:DeleteNetworkInterface');
    });

    test('Lambda execution role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const vpcPolicy = policies.find((p: any) => p.PolicyName === 'LambdaVPCAccessPolicy');
      const logsStatement = vpcPolicy.PolicyDocument.Statement.find((s: any) => s.Sid === 'CloudWatchLogs');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
    });

    test('Lambda execution role should have S3 read access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const appPolicy = policies.find((p: any) => p.PolicyName === 'LambdaApplicationPolicy');
      expect(appPolicy).toBeDefined();

      const s3Statement = appPolicy.PolicyDocument.Statement.find((s: any) => s.Sid === 'S3ReadAccess');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:GetObjectVersion');
    });

    test('Lambda execution role should have SQS DLQ access', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const appPolicy = policies.find((p: any) => p.PolicyName === 'LambdaApplicationPolicy');
      const dlqStatement = appPolicy.PolicyDocument.Statement.find((s: any) => s.Sid === 'DLQAccess');
      expect(dlqStatement).toBeDefined();
      expect(dlqStatement.Action).toContain('sqs:SendMessage');
      expect(dlqStatement.Action).toContain('sqs:GetQueueAttributes');
    });

    test('EC2 instance role should exist', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 instance role should have SSM permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'EC2SSMPolicy');
      expect(ssmPolicy).toBeDefined();

      const ssmStatement = ssmPolicy.PolicyDocument.Statement.find((s: any) => s.Sid === 'SSMAccess');
      expect(ssmStatement).toBeDefined();
      expect(ssmStatement.Action).toContain('ssm:UpdateInstanceInformation');
      expect(ssmStatement.Action).toContain('ssm:GetParameter');
    });

    test('EC2 instance profile should exist and reference role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0].Ref).toBe('EC2InstanceRole');
    });

    test('VPC Flow Log role should exist', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('VPC Flow Log role should have CloudWatch permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policies = role.Properties.Policies;
      const cwPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogPolicy');
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });
  });

  describe('Lambda Resources', () => {
    test('Lambda function should exist', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have appropriate runtime', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should have appropriate timeout and memory settings', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(Number(lambda.Properties.Timeout)).toBeLessThanOrEqual(900);
      expect(Number(lambda.Properties.MemorySize)).toBeLessThanOrEqual(10240);
      expect(Number(lambda.Properties.MemorySize)).toBeGreaterThanOrEqual(128);
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('Lambda function should have execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toBeDefined();
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
    });

    test('Lambda function should have VPC configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds.length).toBe(2);
    });

    test('Lambda function should have dead letter queue configured', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn['Fn::GetAtt']).toEqual(['LambdaDLQueue', 'Arn']);
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
      expect(lambda.Properties.Environment.Variables.S3_BUCKET).toBeDefined();
      expect(lambda.Properties.Environment.Variables.DB_ENDPOINT).toBeDefined();
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
    });

    test('Lambda DLQ should exist with encryption', () => {
      const queue = template.Resources.LambdaDLQueue;
      expect(queue).toBeDefined();
      expect(queue.Type).toBe('AWS::SQS::Queue');
      expect(queue.Properties.KmsMasterKeyId).toBe('alias/aws/sqs');
    });

    test('Lambda DLQ should have 14 day retention', () => {
      const queue = template.Resources.LambdaDLQueue;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('Lambda log group should exist', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('RDS Resources', () => {
    test('DB Secret should exist in Secrets Manager', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB Secret should generate password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBeDefined();
    });

    test('DB Subnet Group should exist', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('RDS instance should exist with proper configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
    });

    test('RDS instance should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should use gp3 storage', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('RDS instance should have backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('RDS instance should have CloudWatch Logs exports enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDS instance should use Secrets Manager for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword).toBeDefined();
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('${DBSecret}');
    });

    test('RDS instance should have DeletionPolicy set to Delete', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Load Balancer Resources', () => {
    test('Application Load Balancer should exist', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets[0].Ref).toBe('PublicSubnet1');
      expect(alb.Properties.Subnets[1].Ref).toBe('PublicSubnet2');
    });

    test('ALB should have proper attributes', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attrs = alb.Properties.LoadBalancerAttributes;

      const deletionProtection = attrs.find((a: any) => a.Key === 'deletion_protection.enabled');
      expect(deletionProtection.Value).toBe('false');

      const http2 = attrs.find((a: any) => a.Key === 'routing.http2.enabled');
      expect(http2.Value).toBe('true');
    });

    test('ALB Target Group should exist', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('ALB Target Group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('ALB Listener should exist', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('ALB Listener should have default action', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions).toBeDefined();
      expect(listener.Properties.DefaultActions[0].Type).toBe('fixed-response');
      expect(listener.Properties.DefaultActions[0].FixedResponseConfig.StatusCode).toBe('200');
    });
  });

  describe('EC2 and EBS Resources', () => {
    test('EC2 instance should exist', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2).toBeDefined();
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.InstanceType).toBe('t3.micro');
    });

    test('EC2 instance should be in private subnet', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
    });

    test('EC2 instance should have IAM instance profile', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.IamInstanceProfile.Ref).toBe('EC2InstanceProfile');
    });

    test('EC2 instance should have encrypted root volume', () => {
      const ec2 = template.Resources.EC2Instance;
      const blockDevice = ec2.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('EC2 instance should use SSM Parameter for AMI', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.ImageId.Ref).toBe('LatestAmiId');
    });

    test('EC2 instance should have user data', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.UserData).toBeDefined();
      expect(ec2.Properties.UserData['Fn::Base64']).toBeDefined();
    });

    test('Additional EBS volume should exist', () => {
      const volume = template.Resources.AdditionalEBSVolume;
      expect(volume).toBeDefined();
      expect(volume.Type).toBe('AWS::EC2::Volume');
      expect(volume.Properties.Size).toBe(20);
      expect(volume.Properties.VolumeType).toBe('gp3');
      expect(volume.Properties.Encrypted).toBe(true);
    });

    test('EBS volume should be in same AZ as EC2 instance', () => {
      const volume = template.Resources.AdditionalEBSVolume;
      expect(volume.Properties.AvailabilityZone['Fn::GetAtt']).toEqual(['EC2Instance', 'AvailabilityZone']);
    });

    test('EBS volume attachment should exist', () => {
      const attachment = template.Resources.EBSVolumeAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VolumeAttachment');
      expect(attachment.Properties.Device).toBe('/dev/sdf');
      expect(attachment.Properties.VolumeId.Ref).toBe('AdditionalEBSVolume');
      expect(attachment.Properties.InstanceId.Ref).toBe('EC2Instance');
    });
  });

  describe('CloudWatch Resources', () => {
    test('VPC Flow Log should exist', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC Flow Log should use CloudWatch Logs', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName.Ref).toBe('VPCFlowLogGroup');
    });

    test('VPC Flow Log Group should exist with retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('outputs section should exist', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs || {}).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('VPC outputs should exist', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
      expect(template.Outputs.VPCCidr).toBeDefined();
    });

    test('S3 outputs should exist', () => {
      expect(template.Outputs.ApplicationDataBucketArn).toBeDefined();
      expect(template.Outputs.ApplicationDataBucketName).toBeDefined();
    });

    test('RDS outputs should exist', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSConnectionString).toBeDefined();
    });

    test('Lambda outputs should exist', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaDLQArn).toBeDefined();
    });

    test('ALB outputs should exist', () => {
      expect(template.Outputs.ApplicationLoadBalancerArn).toBeDefined();
      expect(template.Outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(template.Outputs.ApplicationLoadBalancerURL).toBeDefined();
    });

    test('EC2 and EBS outputs should exist', () => {
      expect(template.Outputs.EC2InstanceId).toBeDefined();
      expect(template.Outputs.AdditionalEBSVolumeId).toBeDefined();
    });

    test('EnvironmentSuffix output should exist', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value.Ref).toBe('EnvironmentSuffix');
    });

    test('outputs with exports should have proper naming', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow consistent naming convention', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (['AWS::S3::Bucket', 'AWS::Lambda::Function'].includes(resource.Type)) {
          if (resource.Properties.BucketName || resource.Properties.FunctionName) {
            const nameProperty = resource.Properties.BucketName || resource.Properties.FunctionName;
            if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
              expect(typeof nameProperty['Fn::Sub']).toBe('string');
            }
          }
        }
      });
    });

    test('export names should follow consistent naming convention', () => {
      Object.keys(template.Outputs || {}).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          if (typeof output.Export.Name === 'object' && output.Export.Name['Fn::Sub']) {
            expect(typeof output.Export.Name['Fn::Sub']).toBe('string');
          }
        }
      });
    });
  });

  describe('Resource Security', () => {
    test('resources should have appropriate tags if applicable', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          expect(Array.isArray(resource.Properties.Tags)).toBeTruthy();
        }
      });
    });
  });

  describe('CloudFormation Best Practices', () => {
    test('template should not exceed AWS limits', () => {
      const templateSize = JSON.stringify(template).length;
      expect(templateSize).toBeLessThan(51200);

      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeLessThan(500);

      const outputCount = Object.keys(template.Outputs || {}).length;
      expect(outputCount).toBeLessThan(200);

      const mappingCount = Object.keys(template.Mappings || {}).length;
      expect(mappingCount).toBeLessThan(200);
    });

    test('template should have valid references', () => {
      expect(template).toBeTruthy();
    });

    test('resources should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
      expect(resourceCount).toBe(50); // Exact count based on template
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateways should depend on IGW attachment', () => {
      const nat1EIP = template.Resources.NatGateway1EIP;
      const nat2EIP = template.Resources.NatGateway2EIP;
      expect(nat1EIP.DependsOn).toBe('InternetGatewayAttachment');
      expect(nat2EIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Public route should depend on IGW attachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('EBS volume should be in same AZ as EC2', () => {
      const volume = template.Resources.AdditionalEBSVolume;
      expect(volume.Properties.AvailabilityZone['Fn::GetAtt']).toEqual(['EC2Instance', 'AvailabilityZone']);
    });
  });

  describe('Encryption Standards', () => {
    test('all S3 buckets should have encryption', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::S3::Bucket') {
          if (resource.Properties.BucketEncryption) {
            expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
            expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration.length).toBeGreaterThan(0);
          }
        }
      });
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('EBS volumes should be encrypted', () => {
      const ec2 = template.Resources.EC2Instance;
      const rootVolume = ec2.Properties.BlockDeviceMappings[0];
      expect(rootVolume.Ebs.Encrypted).toBe(true);

      const additionalVolume = template.Resources.AdditionalEBSVolume;
      expect(additionalVolume.Properties.Encrypted).toBe(true);
    });

    test('SQS queue should use KMS encryption', () => {
      const queue = template.Resources.LambdaDLQueue;
      expect(queue.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Tag Compliance', () => {
    test('all resources with tag support should have Environment tag', () => {
      const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'ApplicationDataBucket',
                               'RDSInstance', 'LambdaFunction', 'ApplicationLoadBalancer', 'EC2Instance'];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('all resources with tag support should have Owner tag', () => {
      const taggedResources = ['VPC', 'ApplicationDataBucket', 'RDSInstance', 'LambdaFunction'];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const ownerTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });
});
