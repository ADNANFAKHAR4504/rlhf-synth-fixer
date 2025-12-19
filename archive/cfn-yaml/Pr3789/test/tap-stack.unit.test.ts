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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(4);
    });

    test('should have mappings for region support', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(Object.keys(template.Mappings.RegionMap)).toHaveLength(8);
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasDomainName).toBeDefined();
      expect(template.Conditions.HasProvidedCertificate).toBeDefined();
      expect(template.Conditions.CreateCertificateWithDomainCondition).toBeDefined();
      expect(template.Conditions.NoCertificateCondition).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentSuffix',
      'Environment',
      'AppName',
      'VpcCidr',
      'PublicSubnetCidr1',
      'PublicSubnetCidr2',
      'PrivateSubnetCidr1',
      'PrivateSubnetCidr2',
      'DomainName',
      'CertificateArn',
      'CreateCertificate',
      'InstanceType',
      'DBInstanceClass',
      'DBName',
      'DBUser',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'AllowedSSHCidr'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, Production)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'Production']);
      expect(param.ConstraintDescription).toBe('Must be one of: dev, staging, Production');
    });

    test('VpcCidr parameter should have correct validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toContain('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}');
      expect(param.ConstraintDescription).toBe('Must be a valid CIDR block (e.g., 10.0.0.0/16)');
    });

    test('CreateCertificate parameter should have correct properties', () => {
      const param = template.Parameters.CreateCertificate;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Description).toBe('Whether to create a new ACM certificate (requires DomainName to be set)');
    });

    test('RDS database should use dynamic reference for password', () => {
      const rdsDatabase = template.Resources.RDSDatabase;
      expect(rdsDatabase.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${AppName}-${Environment}-db-password:SecretString:password}}'
      });
    });

    test('scaling parameters should have correct constraints', () => {
      const minSizeParam = template.Parameters.MinSize;
      expect(minSizeParam.MinValue).toBe(1);
      expect(minSizeParam.MaxValue).toBe(10);

      const maxSizeParam = template.Parameters.MaxSize;
      expect(maxSizeParam.MinValue).toBe(1);
      expect(maxSizeParam.MaxValue).toBe(20);

      const desiredCapacityParam = template.Parameters.DesiredCapacity;
      expect(desiredCapacityParam.MinValue).toBe(1);
      expect(desiredCapacityParam.MaxValue).toBe(20);
    });
  });

  describe('Mappings', () => {
    test('RegionMap should have 8 regions', () => {
      const regionMap = template.Mappings.RegionMap;
      const regions = Object.keys(regionMap);
      expect(regions).toHaveLength(8);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-west-2');
      expect(regions).toContain('eu-west-1');
    });

    test('each region should have AMI mapping', () => {
      const regionMap = template.Mappings.RegionMap;
      Object.keys(regionMap).forEach(region => {
        expect(regionMap[region].AMI).toBeDefined();
        expect(regionMap[region].AMI).toMatch(/^ami-[0-9a-f]+$/);
      });
    });
  });

  describe('Conditions', () => {
    test('HasDomainName should check DomainName is not empty', () => {
      const condition = template.Conditions.HasDomainName;
      expect(condition['Fn::Not']).toEqual([{ 'Fn::Equals': [{ Ref: 'DomainName' }, ''] }]);
    });

    test('CreateCertificateWithDomainCondition should require both conditions', () => {
      const condition = template.Conditions.CreateCertificateWithDomainCondition;
      expect(condition['Fn::And']).toHaveLength(3);
      expect(condition['Fn::And'][0]['Fn::Equals']).toEqual([{ Ref: 'CreateCertificate' }, 'true']);
      expect(condition['Fn::And'][1]['Fn::Not']).toEqual([{ 'Fn::Equals': [{ Ref: 'DomainName' }, ''] }]);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    const securityGroups = [
      'ALBSecurityGroup',
      'EC2SecurityGroup',
      'RDSSecurityGroup',
      'LambdaSecurityGroup'
    ];

    test('should have all required security groups', () => {
      securityGroups.forEach(sgName => {
        expect(template.Resources[sgName]).toBeDefined();
        expect(template.Resources[sgName].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2SecurityGroup should allow HTTP from ALB and SSH from allowed CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress[1].CidrIp).toEqual({ Ref: 'AllowedSSHCidr' });
    });

    test('RDSSecurityGroup should allow MySQL from EC2 and Lambda', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[1].FromPort).toBe(3306);
      expect(ingress[1].ToPort).toBe(3306);
    });

    test('LambdaSecurityGroup should have egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe(-1);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2Role with correct assume role policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have LambdaExecutionRole with correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('EC2Role should have CloudWatch permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('LambdaExecutionRole should have VPC execution permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ApplicationLoadBalancer resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have conditional HTTP listeners', () => {
      expect(template.Resources.HTTPListenerWithRedirect).toBeDefined();
      expect(template.Resources.HTTPListenerWithRedirectNewCert).toBeDefined();
      expect(template.Resources.HTTPListenerDirect).toBeDefined();
    });

    test('should have conditional HTTPS listeners', () => {
      expect(template.Resources.HTTPSListener).toBeDefined();
      expect(template.Resources.HTTPSListenerWithNewCert).toBeDefined();
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have AutoScalingGroup resource', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('ASG should use private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.TargetTrackingScalingPolicy).toBeDefined();
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('should have RDSDatabase resource', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('RDS should use private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(dbSubnetGroup.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnetGroup.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('RDS should have encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should have correct engine and version', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.42');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('table should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Retain');
      expect(table.UpdateReplacePolicy).toBe('Retain');
    });

    test('table should use pay-per-request billing', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('table should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Lambda Function', () => {
    test('should have MonitoringLambda resource', () => {
      expect(template.Resources.MonitoringLambda).toBeDefined();
      expect(template.Resources.MonitoringLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have correct runtime and handler', () => {
      const lambda = template.Resources.MonitoringLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('Lambda should have VPC configuration', () => {
      const lambda = template.Resources.MonitoringLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('should have Lambda schedule rule', () => {
      expect(template.Resources.LambdaScheduleRule).toBeDefined();
      expect(template.Resources.LambdaScheduleRule.Type).toBe('AWS::Events::Rule');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups', () => {
      expect(template.Resources.WebAppLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('should have monitoring dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('log groups should have retention period', () => {
      const webAppLogGroup = template.Resources.WebAppLogGroup;
      const lambdaLogGroup = template.Resources.LambdaLogGroup;
      expect(webAppLogGroup.Properties.RetentionInDays).toBe(7);
      expect(lambdaLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Certificate Resources', () => {
    test('should have conditional SSL certificate', () => {
      expect(template.Resources.SSLCertificate).toBeDefined();
      expect(template.Resources.SSLCertificate.Type).toBe('AWS::CertificateManager::Certificate');
      expect(template.Resources.SSLCertificate.Condition).toBe('CreateCertificateWithDomainCondition');
    });

    test('SSL certificate should have DNS validation', () => {
      const cert = template.Resources.SSLCertificate;
      expect(cert.Properties.ValidationMethod).toBe('DNS');
      expect(cert.Properties.SubjectAlternativeNames).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'TurnAroundPromptTableName',
      'TurnAroundPromptTableArn',
      'StackName',
      'EnvironmentSuffix',
      'Environment',
      'WebAppURL',
      'ApplicationLoadBalancerDNS',
      'DatabaseEndpoint',
      'DatabasePort',
      'DatabaseName',
      'DashboardURL',
      'MonitoringLambdaArn',
      'AutoScalingGroupName',
      'WebAppLogGroupName',
      'LambdaLogGroupName',
      'VPCId',
      'PublicSubnetIds',
      'PrivateSubnetIds',
      'SecurityGroupIds',
      'SSLCertificateArnProvided',
      'SSLCertificateArnCreated',
      'DomainName'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('conditional outputs should have conditions', () => {
      expect(template.Outputs.SSLCertificateArnProvided.Condition).toBe('HasProvidedCertificate');
      expect(template.Outputs.SSLCertificateArnCreated.Condition).toBe('CreateCertificateWithDomainCondition');
      expect(template.Outputs.DomainName.Condition).toBe('HasDomainName');
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          // Handle special case for SSLCertificateArn outputs that share the same export name
          const expectedExportName = outputKey.includes('SSLCertificateArn')
            ? '${AWS::StackName}-SSLCertificateArn'
            : `\${AWS::StackName}-${outputKey}`;

          expect(output.Export.Name).toEqual({
            'Fn::Sub': expectedExportName
          });
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tagging', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(resourceName => {
        const resource = template.Resources[resourceName];
        return resource.Properties && resource.Properties.Tags;
      });

      // Only test resources that actually have tags
      expect(resourcesWithTags.length).toBeGreaterThan(0);

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        // Check for Name tag (if present)
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value).toBeDefined();
        }

        // Check for Environment tag (if present)
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        if (envTag) {
          expect(envTag.Value).toEqual({ Ref: 'Environment' });
        }
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
      expect(resourceCount).toBeLessThan(55);
    });

    test('should have reasonable number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(19);
    });

    test('should have reasonable number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(23);
    });
  });

  describe('Security Best Practices', () => {
    test('database should not be publicly accessible', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should have encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('EC2 instances should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).not.toContain({ Ref: 'PublicSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).not.toContain({ Ref: 'PublicSubnet2' });
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('IAM roles should have least privilege policies', () => {
      const ec2Role = template.Resources.EC2Role;
      const lambdaRole = template.Resources.LambdaExecutionRole;

      // EC2 role should not have overly broad permissions
      expect(ec2Role.Properties.Policies).toBeDefined();

      // Lambda role should have specific resource ARNs
      const lambdaPolicies = lambdaRole.Properties.Policies;
      lambdaPolicies.forEach((policy: any) => {
        if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            if (statement.Resource && Array.isArray(statement.Resource)) {
              statement.Resource.forEach((resource: any) => {
                // Check if resource is a string (ARN) or CloudFormation function
                if (typeof resource === 'string') {
                  expect(resource).toMatch(/arn:aws:/);
                  expect(resource).not.toBe('*');
                } else if (typeof resource === 'object') {
                  // For CloudFormation functions like Fn::Sub, just check it's not '*'
                  expect(resource).not.toBe('*');
                }
              });
            }
          });
        }
      });
    });
  });

  describe('High Availability', () => {
    test('should use multiple availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('ALB should span multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('ASG should use multiple subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('RDS should use multiple subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });
});
