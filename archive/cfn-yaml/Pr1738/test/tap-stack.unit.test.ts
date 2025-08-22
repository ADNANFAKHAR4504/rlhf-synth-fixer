import fs from 'fs';
import path from 'path';

describe('IAM Roles CloudFormation Template', () => {
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
        'Secure IAM roles for web application, database access, and CI/CD pipeline with MFA enforcement'
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
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toBe('Environment name for resource tagging');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have MFAMaxSessionDuration parameter', () => {
      expect(template.Parameters.MFAMaxSessionDuration).toBeDefined();
    });

    test('MFAMaxSessionDuration parameter should have correct properties', () => {
      const mfaParam = template.Parameters.MFAMaxSessionDuration;
      expect(mfaParam.Type).toBe('Number');
      expect(mfaParam.Default).toBe(3600);
      expect(mfaParam.MinValue).toBe(900);
      expect(mfaParam.MaxValue).toBe(43200);
      expect(mfaParam.Description).toBe(
        'Maximum session duration in seconds when using MFA (15 minutes to 12 hours)'
      );
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('IsProduction condition should check if Environment equals prod', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'Environment' });
      expect(condition['Fn::Equals'][1]).toBe('prod');
    });
  });

  describe('Resources', () => {
    test('should have exactly 6 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    test('should have all required IAM roles', () => {
      const expectedRoles = [
        'WebApplicationRole',
        'DatabaseAccessRole',
        'CICDPipelineRole',
        'SecurityAuditRole',
        'EmergencyAccessRole',
        'WebApplicationInstanceProfile'
      ];

      expectedRoles.forEach(roleName => {
        expect(template.Resources[roleName]).toBeDefined();
      });
    });

    describe('WebApplicationRole', () => {
      let role: any;

      beforeAll(() => {
        role = template.Resources.WebApplicationRole;
      });

      test('should be an IAM Role', () => {
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct description', () => {
        expect(role.Properties.Description).toBe(
          'Role for web application with limited S3 and CloudWatch access'
        );
      });

      test('should have AssumeRolePolicyDocument with MFA requirement', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement).toHaveLength(2);
        
        // EC2 service assumption
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
        
        // User assumption with MFA
        expect(assumePolicy.Statement[1].Effect).toBe('Allow');
        expect(assumePolicy.Statement[1].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        expect(assumePolicy.Statement[1].Condition.NumericLessThan['aws:MultiFactorAuthAge']).toEqual(
          { Ref: 'MFAMaxSessionDuration' }
        );
      });

      test('should have CloudWatchAgentServerPolicy managed policy', () => {
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        );
      });

      test('should have WebApplicationPolicy with correct permissions', () => {
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyName).toBe('WebApplicationPolicy');
        
        const statements = policy.PolicyDocument.Statement;
        expect(statements).toHaveLength(5);
        
        // S3 read permissions
        expect(statements[0].Action).toContain('s3:GetObject');
        expect(statements[0].Action).toContain('s3:GetObjectVersion');
        
        // CloudWatch Logs permissions
        const logsStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('logs:CreateLogGroup')
        );
        expect(logsStatement).toBeDefined();
        expect(logsStatement.Action).toContain('logs:PutLogEvents');
        
        // SSM permissions
        const ssmStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('ssm:GetParameter')
        );
        expect(ssmStatement).toBeDefined();
        
        // KMS permissions with condition
        const kmsStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('kms:Decrypt')
        );
        expect(kmsStatement).toBeDefined();
        expect(kmsStatement.Condition.StringEquals['kms:ViaService']).toBeDefined();
      });

      test('should have required tags', () => {
        const tags = role.Properties.Tags;
        expect(tags).toBeDefined();
        
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
        
        const mfaTag = tags.find((t: any) => t.Key === 'MFARequired');
        expect(mfaTag.Value).toBe('true');
        
        const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
        expect(purposeTag.Value).toBe('Web Application Access');
      });
    });

    describe('DatabaseAccessRole', () => {
      let role: any;

      beforeAll(() => {
        role = template.Resources.DatabaseAccessRole;
      });

      test('should be an IAM Role', () => {
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have strict MFA enforcement with 30-minute session', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        expect(statement.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(1800);
      });

      test('should have IP address restrictions for internal networks', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.IpAddress['aws:SourceIp']).toContain('10.0.0.0/8');
        expect(statement.Condition.IpAddress['aws:SourceIp']).toContain('172.16.0.0/12');
        expect(statement.Condition.IpAddress['aws:SourceIp']).toContain('192.168.0.0/16');
      });

      test('should have DatabaseAccessPolicy with RDS permissions', () => {
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyName).toBe('DatabaseAccessPolicy');
        
        const statements = policy.PolicyDocument.Statement;
        
        // RDS describe permissions
        const rdsStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('rds:DescribeDBInstances')
        );
        expect(rdsStatement).toBeDefined();
        expect(rdsStatement.Action).toContain('rds:DescribeDBClusters');
        
        // RDS Connect for IAM authentication
        const connectStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('rds-db:connect')
        );
        expect(connectStatement).toBeDefined();
        
        // Secrets Manager permissions
        const secretsStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('secretsmanager:GetSecretValue')
        );
        expect(secretsStatement).toBeDefined();
      });
    });

    describe('CICDPipelineRole', () => {
      let role: any;

      beforeAll(() => {
        role = template.Resources.CICDPipelineRole;
      });

      test('should allow assumption by CI/CD services', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const serviceStatement = assumePolicy.Statement[0];
        
        expect(serviceStatement.Principal.Service).toContain('codebuild.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('codepipeline.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('codedeploy.amazonaws.com');
      });

      test('should require MFA for human access', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const humanStatement = assumePolicy.Statement[1];
        
        expect(humanStatement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        expect(humanStatement.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(3600);
      });

      test('should have comprehensive CI/CD permissions', () => {
        const policy = role.Properties.Policies[0];
        const statements = policy.PolicyDocument.Statement;
        
        // S3 permissions for artifacts
        const s3Statement = statements.find((s: any) => 
          s.Action && s.Action.includes('s3:PutObject')
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Action).toContain('s3:GetObject');
        expect(s3Statement.Action).toContain('s3:DeleteObject');
        
        // CodeBuild permissions
        const codeBuildStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('codebuild:StartBuild')
        );
        expect(codeBuildStatement).toBeDefined();
        
        // CloudFormation permissions
        const cfnStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('cloudformation:CreateStack')
        );
        expect(cfnStatement).toBeDefined();
        expect(cfnStatement.Action).toContain('cloudformation:UpdateStack');
        expect(cfnStatement.Action).toContain('cloudformation:DeleteStack');
        
        // ECR permissions
        const ecrStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('ecr:PutImage')
        );
        expect(ecrStatement).toBeDefined();
      });
    });

    describe('SecurityAuditRole', () => {
      let role: any;

      beforeAll(() => {
        role = template.Resources.SecurityAuditRole;
      });

      test('should have AWS managed security policies', () => {
        const managedPolicies = role.Properties.ManagedPolicyArns;
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/SecurityAudit');
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
      });

      test('should require MFA with regional restriction', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        expect(statement.Condition.StringEquals['aws:RequestedRegion']).toEqual(
          { Ref: 'AWS::Region' }
        );
      });

      test('should have enhanced security audit permissions', () => {
        const policy = role.Properties.Policies[0];
        expect(policy.PolicyName).toBe('EnhancedSecurityAuditPolicy');
        
        const statements = policy.PolicyDocument.Statement;
        
        // CloudTrail permissions
        const cloudTrailStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('cloudtrail:LookupEvents')
        );
        expect(cloudTrailStatement).toBeDefined();
        
        // GuardDuty permissions
        const guardDutyStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('guardduty:GetFindings')
        );
        expect(guardDutyStatement).toBeDefined();
        
        // Config permissions
        const configStatement = statements.find((s: any) => 
          s.Action && s.Action.includes('config:GetComplianceDetailsByConfigRule')
        );
        expect(configStatement).toBeDefined();
      });
    });

    describe('EmergencyAccessRole', () => {
      let role: any;

      beforeAll(() => {
        role = template.Resources.EmergencyAccessRole;
      });

      test('should have AdministratorAccess managed policy', () => {
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/AdministratorAccess'
        );
      });

      test('should have strictest MFA requirement with 15-minute session', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        expect(statement.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe(900);
      });

      test('should have IP address restrictions', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.IpAddress['aws:SourceIp']).toContain('203.0.113.0/24');
      });

      test('should have time-based access controls with production condition', () => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        const statement = assumePolicy.Statement[0];
        
        expect(statement.Condition.DateGreaterThan['aws:CurrentTime']).toBeDefined();
        expect(statement.Condition.DateLessThan['aws:CurrentTime']).toBeDefined();
        
        // Check production time restrictions
        const dateGreaterThan = statement.Condition.DateGreaterThan['aws:CurrentTime'];
        expect(dateGreaterThan['Fn::If']).toBeDefined();
        expect(dateGreaterThan['Fn::If'][0]).toBe('IsProduction');
        expect(dateGreaterThan['Fn::If'][1]).toBe('08:00Z');
        expect(dateGreaterThan['Fn::If'][2]).toBe('00:00Z');
      });

      test('should have HighPrivilege tag', () => {
        const tags = role.Properties.Tags;
        const highPrivTag = tags.find((t: any) => t.Key === 'HighPrivilege');
        expect(highPrivTag.Value).toBe('true');
      });
    });

    describe('WebApplicationInstanceProfile', () => {
      let profile: any;

      beforeAll(() => {
        profile = template.Resources.WebApplicationInstanceProfile;
      });

      test('should be an IAM Instance Profile', () => {
        expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      });

      test('should reference WebApplicationRole', () => {
        expect(profile.Properties.Roles).toContainEqual({ Ref: 'WebApplicationRole' });
      });

      test('should have correct naming convention', () => {
        expect(profile.Properties.InstanceProfileName).toEqual({
          'Fn::Sub': '${Environment}-web-application-instance-profile'
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required role ARN outputs', () => {
      const expectedOutputs = [
        'WebApplicationRoleArn',
        'DatabaseAccessRoleArn',
        'CICDPipelineRoleArn',
        'SecurityAuditRoleArn',
        'EmergencyAccessRoleArn',
        'WebApplicationInstanceProfileArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('WebApplicationRoleArn output should be correct', () => {
      const output = template.Outputs.WebApplicationRoleArn;
      expect(output.Description).toBe('ARN of the Web Application Role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebApplicationRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${Environment}-web-application-role-arn'
      });
    });

    test('DatabaseAccessRoleArn output should be correct', () => {
      const output = template.Outputs.DatabaseAccessRoleArn;
      expect(output.Description).toBe('ARN of the Database Access Role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DatabaseAccessRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${Environment}-database-access-role-arn'
      });
    });

    test('all role outputs should follow consistent export naming', () => {
      const expectedExportNames: { [key: string]: string } = {
        'WebApplicationRoleArn': '${Environment}-web-application-role-arn',
        'DatabaseAccessRoleArn': '${Environment}-database-access-role-arn',
        'CICDPipelineRoleArn': '${Environment}-cicd-pipeline-role-arn',
        'SecurityAuditRoleArn': '${Environment}-security-audit-role-arn',
        'EmergencyAccessRoleArn': '${Environment}-emergency-access-role-arn',
        'WebApplicationInstanceProfileArn': '${Environment}-web-application-instance-profile-arn'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedName = expectedExportNames[outputKey];
        if (expectedName) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': expectedName
          });
        }
      });
    });
  });

  describe('Security Compliance', () => {
    test('all roles should enforce MFA for human access', () => {
      const roles = [
        'WebApplicationRole',
        'DatabaseAccessRole',
        'CICDPipelineRole',
        'SecurityAuditRole',
        'EmergencyAccessRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const statements = role.Properties.AssumeRolePolicyDocument.Statement;
        
        // Find statements that allow AWS principal (human access)
        const humanStatements = statements.filter((s: any) => 
          s.Principal && s.Principal.AWS
        );
        
        humanStatements.forEach((statement: any) => {
          expect(statement.Condition).toBeDefined();
          expect(statement.Condition.Bool).toBeDefined();
          expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
        });
      });
    });

    test('all roles should have MFARequired tag', () => {
      const roles = [
        'WebApplicationRole',
        'DatabaseAccessRole',
        'CICDPipelineRole',
        'SecurityAuditRole',
        'EmergencyAccessRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const tags = role.Properties.Tags;
        const mfaTag = tags.find((t: any) => t.Key === 'MFARequired');
        expect(mfaTag).toBeDefined();
        expect(mfaTag.Value).toBe('true');
      });
    });

    test('sensitive roles should have additional access controls', () => {
      // Database role should have IP restrictions
      const dbRole = template.Resources.DatabaseAccessRole;
      const dbStatement = dbRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(dbStatement.Condition.IpAddress).toBeDefined();
      
      // Emergency role should have IP and time restrictions
      const emergencyRole = template.Resources.EmergencyAccessRole;
      const emergencyStatement = emergencyRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(emergencyStatement.Condition.IpAddress).toBeDefined();
      expect(emergencyStatement.Condition.DateGreaterThan).toBeDefined();
      expect(emergencyStatement.Condition.DateLessThan).toBeDefined();
    });

    test('roles should follow principle of least privilege', () => {
      // Web Application Role should not have admin access
      const webRole = template.Resources.WebApplicationRole;
      expect(webRole.Properties.ManagedPolicyArns).not.toContain(
        'arn:aws:iam::aws:policy/AdministratorAccess'
      );
      
      // Security Audit Role should only have read-only access
      const auditRole = template.Resources.SecurityAuditRole;
      expect(auditRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/ReadOnlyAccess'
      );
      expect(auditRole.Properties.ManagedPolicyArns).not.toContain(
        'arn:aws:iam::aws:policy/AdministratorAccess'
      );
      
      // Only Emergency Access Role should have admin access
      const emergencyRole = template.Resources.EmergencyAccessRole;
      expect(emergencyRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AdministratorAccess'
      );
    });
  });

  describe('Resource Tagging', () => {
    test('all roles should have Environment tag', () => {
      const roles = [
        'WebApplicationRole',
        'DatabaseAccessRole',
        'CICDPipelineRole',
        'SecurityAuditRole',
        'EmergencyAccessRole'
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const tags = role.Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('all roles should have Purpose tag', () => {
      const rolePurposes: { [key: string]: string } = {
        'WebApplicationRole': 'Web Application Access',
        'DatabaseAccessRole': 'Database Access',
        'CICDPipelineRole': 'CI/CD Pipeline',
        'SecurityAuditRole': 'Security Audit',
        'EmergencyAccessRole': 'Emergency Administrative Access'
      };

      Object.entries(rolePurposes).forEach(([roleName, expectedPurpose]) => {
        const role = template.Resources[roleName];
        const tags = role.Properties.Tags;
        const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
        expect(purposeTag).toBeDefined();
        expect(purposeTag.Value).toBe(expectedPurpose);
      });
    });
  });
});
