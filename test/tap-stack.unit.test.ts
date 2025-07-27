import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for secure web application infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'secure, public-facing web application infrastructure'
      );
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
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'VpcCidrBlock',
        'PublicSubnet1CidrBlock',
        'PublicSubnet2CidrBlock',
        'PrivateSubnet1CidrBlock',
        'PrivateSubnet2CidrBlock',
        'AppSubnet1CidrBlock',
        'AppSubnet2CidrBlock',
        'AMIID',
        'InstanceType',
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'DatabaseAllocatedStorage',
        'DatabaseInstanceType',
        'DatabaseUsername',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('WebApp');
      expect(param.Description).toContain('project');
    });

    test('VPC CIDR should have correct default', () => {
      const param = template.Parameters.VpcCidrBlock;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
    });

    test('Subnet CIDR blocks should be valid', () => {
      const subnets = [
        { name: 'PublicSubnet1CidrBlock', expected: '10.0.1.0/24' },
        { name: 'PublicSubnet2CidrBlock', expected: '10.0.2.0/24' },
        { name: 'PrivateSubnet1CidrBlock', expected: '10.0.10.0/24' },
        { name: 'PrivateSubnet2CidrBlock', expected: '10.0.11.0/24' },
        { name: 'AppSubnet1CidrBlock', expected: '10.0.20.0/24' },
        { name: 'AppSubnet2CidrBlock', expected: '10.0.21.0/24' },
      ];

      subnets.forEach(subnet => {
        expect(template.Parameters[subnet.name].Default).toBe(subnet.expected);
      });
    });

    test('AMI ID parameter should be correct type', () => {
      const param = template.Parameters.AMIID;
      expect(param.Type).toBe('AWS::EC2::Image::Id');
    });

    test('Numeric parameters should have correct types', () => {
      const numericParams = [
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'DatabaseAllocatedStorage',
      ];
      numericParams.forEach(paramName => {
        expect(template.Parameters[paramName].Type).toBe('Number');
      });
    });
  });

  describe('Network Infrastructure', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway in public subnet', () => {
      const nat = template.Resources.NATGateway;
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have all required subnets', () => {
      const expectedSubnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'AppSubnet1',
        'AppSubnet2',
      ];

      expectedSubnets.forEach(subnetName => {
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      ['PublicSubnet1', 'PublicSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have route tables for each subnet tier', () => {
      const routeTables = [
        'PublicRouteTable',
        'PrivateRouteTable',
        'AppRouteTable',
      ];
      routeTables.forEach(tableName => {
        expect(template.Resources[tableName]).toBeDefined();
        expect(template.Resources[tableName].Type).toBe('AWS::EC2::RouteTable');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      const securityGroups = [
        'ELBSecurityGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'LambdaSecurityGroup',
      ];
      securityGroups.forEach(sgName => {
        expect(template.Resources[sgName]).toBeDefined();
        expect(template.Resources[sgName].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ELB security group should allow HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.ELBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(
        ingress.some(
          (rule: any) => rule.FromPort === 80 && rule.CidrIp === '0.0.0.0/0'
        )
      ).toBe(true);
      expect(
        ingress.some(
          (rule: any) => rule.FromPort === 443 && rule.CidrIp === '0.0.0.0/0'
        )
      ).toBe(true);
    });

    test('EC2 security group should allow HTTP from ALB and SSH', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(
        ingress.some(
          (rule: any) => rule.FromPort === 80 && rule.SourceSecurityGroupId
        )
      ).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 22)).toBe(true);
    });

    test('RDS security group should allow MySQL from EC2 and Lambda', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      
      // Check first rule (EC2)
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
      
      // Check second rule (Lambda)
      expect(ingress[1].FromPort).toBe(3306);
      expect(ingress[1].ToPort).toBe(3306);
      expect(ingress[1].SourceSecurityGroupId).toBeDefined();
    });

    test('Lambda security group should have outbound access', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
    });

    test('all security groups should have descriptive tags', () => {
      const securityGroups = [
        'ELBSecurityGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'LambdaSecurityGroup',
      ];
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.Tags).toBeDefined();
        const purposeTag = sg.Properties.Tags.find(
          (tag: any) => tag.Key === 'Purpose'
        );
        expect(purposeTag).toBeDefined();
        expect(purposeTag.Value).toBeDefined();
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 IAM role and instance profile', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('EC2 role should have correct trust policy', () => {
      const role = template.Resources.EC2Role;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'ec2.amazonaws.com'
      );
    });

    test('Lambda role should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    });

    test('IAM policies should follow least privilege principle (no wildcard actions)', () => {
      const roles = [
        template.Resources.EC2Role,
        template.Resources.LambdaExecutionRole,
      ];
      roles.forEach(role => {
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              if (Array.isArray(statement.Action)) {
                statement.Action.forEach((action: string) => {
                  expect(action).not.toBe('*');
                });
              } else {
                expect(statement.Action).not.toBe('*');
              }
            });
          });
        }
      });
    });

    test('EC2 role should have SSM managed policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  describe('Auto Scaling and Load Balancer', () => {
    test('should have launch template', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.EC2AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('auto scaling group should be in app subnets', () => {
      const asg = template.Resources.EC2AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets).toContainEqual({ Ref: 'AppSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'AppSubnet2' });
    });

    test('should have application load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('load balancer should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have target group with correct health check settings', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Database Configuration', () => {
    test('should have RDS instance with Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should be encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have RDS subnet group', () => {
      const subnetGroup = template.Resources.RDSDBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('RDS subnet group should use private subnets', () => {
      const subnetGroup = template.Resources.RDSDBSubnetGroup;
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have backup configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
      expect(rds.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should use secrets manager for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword).toContain(
        'resolve:secretsmanager'
      );
    });
  });

  describe('Storage Configuration', () => {
    test('should have S3 buckets with KMS encryption', () => {
      const buckets = ['WebAppS3Bucket', 'LogsS3Bucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
            .SSEAlgorithm
        ).toBe('aws:kms');
      });
    });

    test('S3 buckets should have public access blocked', () => {
      const buckets = ['WebAppS3Bucket', 'LogsS3Bucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock =
          bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have ownership controls', () => {
      const buckets = ['WebAppS3Bucket', 'LogsS3Bucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.OwnershipControls).toBeDefined();
        expect(
          bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership
        ).toBe('BucketOwnerEnforced');
      });
    });

    test('should have KMS keys for S3 and RDS', () => {
      const keys = ['S3KMSKey', 'RDSKMSKey'];
      keys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key).toBeDefined();
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Properties.Enabled).toBe(true);
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should have Lambda functions', () => {
      const functions = ['LambdaFunction1', 'LambdaFunction2'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Lambda::Function');
      });
    });

    test('Lambda functions should have VPC configuration', () => {
      const functions = ['LambdaFunction1', 'LambdaFunction2'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.VpcConfig).toBeDefined();
        expect(func.Properties.VpcConfig.SubnetIds).toContainEqual({
          Ref: 'PrivateSubnet1',
        });
        expect(func.Properties.VpcConfig.SubnetIds).toContainEqual({
          Ref: 'PrivateSubnet2',
        });
      });
    });

    test('Lambda functions should have log groups', () => {
      const logGroups = ['LambdaFunction1LogGroup', 'LambdaFunction2LogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      const functions = ['LambdaFunction1', 'LambdaFunction2'];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.TracingConfig.Mode).toBe('Active');
      });
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
        'AppSubnet1Id',
        'AppSubnet2Id',
        'ALBDnsName',
        'RDSJdbcConnection',
        'WebAppS3BucketName',
        'LogsS3BucketName',
        'RDSSecretArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ALB DNS name output should reference load balancer', () => {
      const output = template.Outputs.ALBDnsName;
      expect(output.Value['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
      expect(output.Value['Fn::GetAtt'][1]).toBe('DNSName');
    });

    test('RDS JDBC connection should be properly formatted', () => {
      const output = template.Outputs.RDSJdbcConnection;
      expect(output.Value['Fn::Sub']).toContain('jdbc:mysql://');
      expect(output.Value['Fn::Sub']).toContain(
        '${RDSInstance.Endpoint.Address}'
      );
    });

    test('S3 bucket outputs should reference correct buckets', () => {
      expect(template.Outputs.WebAppS3BucketName.Value.Ref).toBe(
        'WebAppS3Bucket'
      );
      expect(template.Outputs.LogsS3BucketName.Value.Ref).toBe('LogsS3Bucket');
    });

    test('RDS secret output should reference correct secret', () => {
      expect(template.Outputs.RDSSecretArn.Value.Ref).toBe('RDSSecret');
      expect(template.Outputs.RDSSecretArn.Description).toContain('RDS credentials secret');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Expecting significant infrastructure
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(16);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12); // Updated to include RDSSecretArn output
    });
  });
});
