import * as fs from 'fs';
import * as path from 'path';

describe('Compliance Analysis System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Compliance Analysis System');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('suffix');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('admin');
    });

    test('should have DBMasterPassword parameter', () => {
      expect(template.Parameters.DBMasterPassword).toBeDefined();
      const param = template.Parameters.DBMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.Default).toBeDefined();
    });

    test('should have exactly 4 parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(4);
    });
  });

  describe('VPC Resources', () => {
    test('should have ComplianceVPC resource', () => {
      expect(template.Resources.ComplianceVPC).toBeDefined();
      const vpc = template.Resources.ComplianceVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('ComplianceVPC should have proper tags with environmentSuffix', () => {
      const vpc = template.Resources.ComplianceVPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const costCenterTag = tags.find((t: any) => t.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const complianceTag = tags.find((t: any) => t.Key === 'ComplianceLevel');
      expect(complianceTag).toBeDefined();
    });

    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'ComplianceVPC' });
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'ComplianceVPC' });
    });

    test('subnets should have proper tags', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const tags = subnet1.Properties.Tags;
      expect(tags).toBeDefined();

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Group Resources', () => {
    test('should have LambdaSecurityGroup resource', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'ComplianceVPC' });
      expect(sg.Properties.GroupDescription).toContain('Lambda');
    });

    test('should have RDSSecurityGroup resource', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'ComplianceVPC' });
      expect(sg.Properties.GroupDescription).toContain('RDS');
    });

    test('RDSSecurityGroup should allow ingress from LambdaSecurityGroup', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      expect(ingress.length).toBeGreaterThan(0);

      const lambdaIngress = ingress[0];
      expect(lambdaIngress.IpProtocol).toBe('tcp');
      expect(lambdaIngress.FromPort).toBe(3306);
      expect(lambdaIngress.ToPort).toBe(3306);
      expect(lambdaIngress.SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });
  });

  describe('RDS Database', () => {
    test('should have DBSubnetGroup resource', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have ComplianceDatabase resource', () => {
      expect(template.Resources.ComplianceDatabase).toBeDefined();
      const db = template.Resources.ComplianceDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(db.Properties.AllocatedStorage).toBe('100');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MasterUsername).toEqual({ Ref: 'DBMasterUsername' });
      expect(db.Properties.MasterUserPassword).toEqual({ Ref: 'DBMasterPassword' });
    });

    test('ComplianceDatabase should reference security groups and subnet group', () => {
      const db = template.Resources.ComplianceDatabase;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('ComplianceDatabase should have no deletion protection or retain policy', () => {
      const db = template.Resources.ComplianceDatabase;
      expect(db.Properties.DeletionProtection).toBeFalsy();
      expect(db.DeletionPolicy).toBeUndefined();
    });

    test('ComplianceDatabase should have proper tags', () => {
      const db = template.Resources.ComplianceDatabase;
      const tags = db.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'ComplianceLevel')).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have EBSScannerFunction resource', () => {
      expect(template.Resources.EBSScannerFunction).toBeDefined();
      const fn = template.Resources.EBSScannerFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.11');
      expect(fn.Properties.MemorySize).toBeGreaterThanOrEqual(3000);
      expect(fn.Properties.Timeout).toBe(900);
    });

    test('EBSScannerFunction should have inline code', () => {
      const fn = template.Resources.EBSScannerFunction;
      expect(fn.Properties.Code).toBeDefined();
      expect(fn.Properties.Code.ZipFile).toBeDefined();
      const codeStr = JSON.stringify(fn.Properties.Code.ZipFile);
      expect(codeStr).toContain('import boto3');
    });

    test('EBSScannerFunction should have environment variables', () => {
      const fn = template.Resources.EBSScannerFunction;
      expect(fn.Properties.Environment).toBeDefined();
      expect(fn.Properties.Environment.Variables).toBeDefined();
      expect(fn.Properties.Environment.Variables.DB_HOST).toBeDefined();
      expect(fn.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'ComplianceSNSTopic'
      });
      expect(fn.Properties.Environment.Variables.ENVIRONMENT_SUFFIX).toEqual({
        Ref: 'EnvironmentSuffix'
      });
    });

    test('should have SGScannerFunction resource', () => {
      expect(template.Resources.SGScannerFunction).toBeDefined();
      const fn = template.Resources.SGScannerFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.11');
      expect(fn.Properties.MemorySize).toBeGreaterThanOrEqual(3000);
      expect(fn.Properties.Timeout).toBe(900);
    });

    test('Lambda functions should have VPC configuration', () => {
      const fn = template.Resources.EBSScannerFunction;
      expect(fn.Properties.VpcConfig).toBeDefined();
      expect(fn.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(fn.Properties.VpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('Lambda functions should have proper tags', () => {
      const fn = template.Resources.EBSScannerFunction;
      const tags = fn.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
    });

    test('should have ValidationFunction resource', () => {
      expect(template.Resources.ValidationFunction).toBeDefined();
      const fn = template.Resources.ValidationFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.11');
    });

    test('ValidationFunction should have inline code with compliance rules', () => {
      const fn = template.Resources.ValidationFunction;
      const codeStr = JSON.stringify(fn.Properties.Code.ZipFile);
      expect(codeStr).toContain('COMPLIANCE_RULES');
      expect(codeStr).toContain('rules');
    });
  });

  describe('IAM Roles', () => {
    test('should have EBSScannerRole resource', () => {
      expect(template.Resources.EBSScannerRole).toBeDefined();
      const role = template.Resources.EBSScannerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('EBSScannerRole should allow Lambda service to assume role', () => {
      const role = template.Resources.EBSScannerRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement).toBeDefined();
      const statement = assumePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('EBSScannerRole should have proper managed policies', () => {
      const role = template.Resources.EBSScannerRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContainEqual(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('EBSScannerRole should have inline policies for EC2 and SNS', () => {
      const role = template.Resources.EBSScannerRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toContain('EBS');
      expect(policy.PolicyDocument.Statement).toBeDefined();

      const hasEC2Action = policy.PolicyDocument.Statement.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('ec2:'))
      );
      expect(hasEC2Action).toBe(true);
    });

    test('should have SGScannerRole resource', () => {
      expect(template.Resources.SGScannerRole).toBeDefined();
      const role = template.Resources.SGScannerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ValidationLambdaRole resource', () => {
      expect(template.Resources.ValidationLambdaRole).toBeDefined();
      const role = template.Resources.ValidationLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have EBSScannerLogGroup resource', () => {
      expect(template.Resources.EBSScannerLogGroup).toBeDefined();
      const logGroup = template.Resources.EBSScannerLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/compliance-ebs-scanner-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have SGScannerLogGroup resource', () => {
      expect(template.Resources.SGScannerLogGroup).toBeDefined();
      const logGroup = template.Resources.SGScannerLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/compliance-sg-scanner-${EnvironmentSuffix}'
      });
    });

    test('log groups should have no retention policy', () => {
      const logGroup = template.Resources.EBSScannerLogGroup;
      expect(logGroup.DeletionPolicy).toBeUndefined();
      expect(logGroup.UpdateReplacePolicy).toBeUndefined();
    });
  });

  describe('CloudWatch Events', () => {
    test('should have EBSScanScheduleRule resource', () => {
      expect(template.Resources.EBSScanScheduleRule).toBeDefined();
      const rule = template.Resources.EBSScanScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(6 hours)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EBSScanScheduleRule should target EBSScannerFunction', () => {
      const rule = template.Resources.EBSScanScheduleRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['EBSScannerFunction', 'Arn']
      });
    });

    test('should have SGScanScheduleRule resource', () => {
      expect(template.Resources.SGScanScheduleRule).toBeDefined();
      const rule = template.Resources.SGScanScheduleRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(6 hours)');
    });

    test('should have invoke permissions for scheduled rules', () => {
      expect(template.Resources.EBSScannerInvokePermission).toBeDefined();
      const permission = template.Resources.EBSScannerInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should have SGScannerInvokePermission resource', () => {
      expect(template.Resources.SGScannerInvokePermission).toBeDefined();
      const permission = template.Resources.SGScannerInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('SNS Topic', () => {
    test('should have ComplianceSNSTopic resource', () => {
      expect(template.Resources.ComplianceSNSTopic).toBeDefined();
      const topic = template.Resources.ComplianceSNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toContain('Compliance');
    });

    test('ComplianceSNSTopic should have subscription', () => {
      const topic = template.Resources.ComplianceSNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(Array.isArray(topic.Properties.Subscription)).toBe(true);
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);

      const subscription = topic.Properties.Subscription[0];
      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('ComplianceSNSTopic should have proper tags', () => {
      const topic = template.Resources.ComplianceSNSTopic;
      const tags = topic.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
    });
  });

  describe('Custom Resources', () => {
    test('should have ComplianceRulesValidation resource', () => {
      expect(template.Resources.ComplianceRulesValidation).toBeDefined();
      const customResource = template.Resources.ComplianceRulesValidation;
      expect(customResource.Type).toBe('Custom::ComplianceValidation');
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['ValidationFunction', 'Arn']
      });
    });

    test('ComplianceRulesValidation should have EnvironmentSuffix property', () => {
      const customResource = template.Resources.ComplianceRulesValidation;
      expect(customResource.Properties.EnvironmentSuffix).toEqual({
        Ref: 'EnvironmentSuffix'
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should have ComplianceDashboard resource', () => {
      expect(template.Resources.ComplianceDashboard).toBeDefined();
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'ComplianceDashboard-${EnvironmentSuffix}'
      });
    });

    test('ComplianceDashboard should have body with metrics', () => {
      const dashboard = template.Resources.ComplianceDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      const bodyStr = JSON.stringify(dashboard.Properties.DashboardBody);
      expect(bodyStr).toContain('widgets');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'ComplianceVPC' });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'ComplianceVPCId-${EnvironmentSuffix}'
      });
    });

    test('should have DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ComplianceDatabase', 'Endpoint.Address']
      });
    });

    test('should have EBSScannerFunctionArn output', () => {
      expect(template.Outputs.EBSScannerFunctionArn).toBeDefined();
      const output = template.Outputs.EBSScannerFunctionArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EBSScannerFunction', 'Arn']
      });
    });

    test('should have SGScannerFunctionArn output', () => {
      expect(template.Outputs.SGScannerFunctionArn).toBeDefined();
      const output = template.Outputs.SGScannerFunctionArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SGScannerFunction', 'Arn']
      });
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      const output = template.Outputs.SNSTopicArn;
      expect(output.Value).toEqual({ Ref: 'ComplianceSNSTopic' });
    });

    test('should have DashboardURL output', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      const output = template.Outputs.DashboardURL;
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
    });

    test('should have ComplianceRulesCount output', () => {
      expect(template.Outputs.ComplianceRulesCount).toBeDefined();
      const output = template.Outputs.ComplianceRulesCount;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ComplianceRulesValidation', 'RulesCount']
      });
    });

    test('should have exactly 7 outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(7);
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 22 resources', () => {
      expect(Object.keys(template.Resources)).toHaveLength(22);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all resource types should be valid AWS CloudFormation types', () => {
      const validTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::IAM::Role',
        'AWS::Logs::LogGroup',
        'AWS::Events::Rule',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Dashboard',
        'Custom::ComplianceValidation'
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(validTypes).toContain(resource.Type);
      });
    });

    test('all resources should use EnvironmentSuffix in naming', () => {
      const resourcesWithNames = [
        'ComplianceVPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'LambdaSecurityGroup',
        'RDSSecurityGroup',
        'ComplianceDatabase',
        'EBSScannerLogGroup',
        'SGScannerLogGroup',
        'ComplianceDashboard'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toContain('EnvironmentSuffix');
      });
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.DeletionProtection !== undefined) {
          expect(resource.Properties.DeletionProtection).toBeFalsy();
        }
      });
    });
  });
});
