import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML template to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for IAM template', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Least-Privilege IAM Design with Permission Boundaries'
      );
    });

    test('should have required resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('IAM Resources', () => {
    test('should have PermissionBoundaryPolicy resource', () => {
      expect(template.Resources.PermissionBoundaryPolicy).toBeDefined();
      expect(template.Resources.PermissionBoundaryPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });

    test('should have EC2ApplicationRole resource', () => {
      expect(template.Resources.EC2ApplicationRole).toBeDefined();
      expect(template.Resources.EC2ApplicationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have exactly 3 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(3);
    });
  });

  describe('Permission Boundary Policy', () => {
    let policy: any;

    beforeAll(() => {
      policy = template.Resources.PermissionBoundaryPolicy;
    });

    test('should have correct description', () => {
      expect(policy.Properties.Description).toBe(
        'Permission boundary that prevents privilege escalation'
      );
    });

    test('should have correct managed policy name with stack reference', () => {
      expect(policy.Properties.ManagedPolicyName).toEqual({
        'Fn::Sub': 'PermissionBoundary-${AWS::StackName}'
      });
    });

    test('should have policy document with correct version', () => {
      expect(policy.Properties.PolicyDocument.Version).toBe('2012-10-17');
    });

    test('should have deny privilege escalation statement', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyPrivilegeEscalation');
      
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('iam:*');
      expect(denyStatement.Action).toContain('sts:*');
      expect(denyStatement.Action).toContain('organizations:*');
      expect(denyStatement.Resource).toBe('*');
    });

    test('should allow CloudWatch Logs actions', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      const allowLogging = statements.find((s: any) => s.Sid === 'AllowLogging');
      
      expect(allowLogging).toBeDefined();
      expect(allowLogging.Effect).toBe('Allow');
      expect(allowLogging.Action).toContain('logs:CreateLogGroup');
      expect(allowLogging.Action).toContain('logs:CreateLogStream');
      expect(allowLogging.Action).toContain('logs:PutLogEvents');
    });

    test('should allow S3 operations on specific buckets', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) => s.Sid === 'AllowS3Access');
      
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
      expect(s3Statement.Action).toContain('s3:PutObject');
    });

    test('should allow DynamoDB operations on specific tables', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      const dynamoStatement = statements.find((s: any) => s.Sid === 'AllowDynamoDBAccess');
      
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Effect).toBe('Allow');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
      expect(dynamoStatement.Action).toContain('dynamodb:Scan');
    });

    test('should allow SSM Parameter Store access', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      const ssmStatement = statements.find((s: any) => s.Sid === 'AllowSSMAccess');
      
      expect(ssmStatement).toBeDefined();
      expect(ssmStatement.Effect).toBe('Allow');
      expect(ssmStatement.Action).toContain('ssm:GetParameter');
      expect(ssmStatement.Action).toContain('ssm:GetParameters');
    });

    test('should have no wildcard resources except in deny statements', () => {
      const statements = policy.Properties.PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        if (statement.Effect === 'Allow') {
          if (Array.isArray(statement.Resource)) {
            statement.Resource.forEach((resource: any) => {
              expect(resource).not.toBe('*');
            });
          } else if (statement.Resource) {
            expect(statement.Resource).not.toBe('*');
          }
        }
      });
    });
  });

  describe('EC2 Application Role', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.EC2ApplicationRole;
    });

    test('should have correct trust policy for EC2 service', () => {
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Version).toBe('2012-10-17');
      
      const statement = trustPolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have permission boundary attached', () => {
      expect(role.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });

    test('should have correct path', () => {
      expect(role.Properties.Path).toBe('/');
    });

    test('should have correct tags', () => {
      const tags = role.Properties.Tags;
      expect(tags).toHaveLength(4);
      
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2ApplicationRole'
      });
      
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'AWS::StackName' });
      
      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
      expect(purposeTag.Value).toBe('Application');
      
      const complianceTag = tags.find((t: any) => t.Key === 'SecurityCompliance');
      expect(complianceTag.Value).toBe('LeastPrivilege');
    });

    test('should have EC2ApplicationPolicy with read-only permissions', () => {
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const policy = policies[0];
      expect(policy.PolicyName).toBe('EC2ApplicationPolicy');
      
      const statements = policy.PolicyDocument.Statement;
      
      // Should have S3 read-only access
      const s3Statement = statements.find((s: any) => s.Sid === 'S3ReadOnlyAccess');
      expect(s3Statement.Action).not.toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
      
      // Should have DynamoDB read-only access
      const dynamoStatement = statements.find((s: any) => s.Sid === 'DynamoDBReadAccess');
      expect(dynamoStatement.Action).not.toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
    });
  });

  describe('Lambda Execution Role', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.LambdaExecutionRole;
    });

    test('should have correct trust policy for Lambda service', () => {
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Version).toBe('2012-10-17');
      
      const statement = trustPolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have permission boundary attached', () => {
      expect(role.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });

    test('should have correct tags', () => {
      const tags = role.Properties.Tags;
      expect(tags).toHaveLength(4);
      
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaExecutionRole'
      });
      
      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');
      expect(purposeTag.Value).toBe('Serverless');
    });

    test('should have LambdaExecutionPolicy with full CRUD permissions', () => {
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const policy = policies[0];
      expect(policy.PolicyName).toBe('LambdaExecutionPolicy');
      
      const statements = policy.PolicyDocument.Statement;
      
      // Should have DynamoDB full access
      const dynamoStatement = statements.find((s: any) => s.Sid === 'DynamoDBAccess');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoStatement.Action).toContain('dynamodb:DeleteItem');
      
      // Should have S3 read/write access
      const s3Statement = statements.find((s: any) => s.Sid === 'S3Access');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:GetObject');
    });
  });

  describe('Outputs', () => {
    test('should have all required IAM outputs', () => {
      const expectedOutputs = [
        'EC2ApplicationRoleARN',
        'LambdaExecutionRoleARN',
        'PermissionBoundaryPolicyARN'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('EC2ApplicationRoleARN output should be correct', () => {
      const output = template.Outputs.EC2ApplicationRoleARN;
      expect(output.Description).toBe('ARN of the EC2 Application Role with least privilege');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EC2ApplicationRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2ApplicationRoleARN'
      });
    });

    test('LambdaExecutionRoleARN output should be correct', () => {
      const output = template.Outputs.LambdaExecutionRoleARN;
      expect(output.Description).toBe('ARN of the Lambda Execution Role with least privilege');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('PermissionBoundaryPolicyARN output should be correct', () => {
      const output = template.Outputs.PermissionBoundaryPolicyARN;
      expect(output.Description).toBe('ARN of the Permission Boundary Policy');
      expect(output.Value).toEqual({ Ref: 'PermissionBoundaryPolicy' });
    });
  });

  describe('Security Compliance Validation', () => {
    test('should not use standalone wildcards in allow statements', () => {
      const allStatements: any[] = [];
      
      // Collect all policy statements
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::IAM::ManagedPolicy' || resource.Type === 'AWS::IAM::Role') {
          if (resource.Properties.PolicyDocument) {
            allStatements.push(...resource.Properties.PolicyDocument.Statement);
          }
          if (resource.Properties.Policies) {
            resource.Properties.Policies.forEach((policy: any) => {
              allStatements.push(...policy.PolicyDocument.Statement);
            });
          }
        }
      });
      
      // Check allow statements don't use wildcards inappropriately
      allStatements.forEach(statement => {
        if (statement.Effect === 'Allow') {
          if (Array.isArray(statement.Resource)) {
            statement.Resource.forEach((resource: any) => {
              if (typeof resource === 'string') {
                expect(resource).not.toBe('*');
              }
            });
          } else if (typeof statement.Resource === 'string') {
            expect(statement.Resource).not.toBe('*');
          }
        }
      });
    });

    test('should not use service-level action wildcards in allow statements', () => {
      const allStatements: any[] = [];
      
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::IAM::ManagedPolicy' || resource.Type === 'AWS::IAM::Role') {
          if (resource.Properties.PolicyDocument) {
            allStatements.push(...resource.Properties.PolicyDocument.Statement);
          }
          if (resource.Properties.Policies) {
            resource.Properties.Policies.forEach((policy: any) => {
              allStatements.push(...policy.PolicyDocument.Statement);
            });
          }
        }
      });
      
      // Check allow statements don't use service-level wildcards
      allStatements.forEach(statement => {
        if (statement.Effect === 'Allow' && statement.Action) {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          actions.forEach((action: string) => {
            if (typeof action === 'string') {
              // Allow specific actions but not service-level wildcards like 's3:*'
              const hasServiceWildcard = action.match(/^[a-zA-Z0-9-]+:\*$/);
              expect(hasServiceWildcard).toBeNull();
            }
          });
        }
      });
    });

    test('should have proper resource naming with stack references', () => {
      // Check S3 bucket ARNs use stack name
      const s3Resources = [];
      
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        JSON.stringify(resource).replace(/"arn:aws:s3:::([^"]+)"/g, (match, bucketName) => {
          s3Resources.push(bucketName);
          return match;
        });
      });
      
      s3Resources.forEach(resource => {
        expect(resource).toMatch(/\${AWS::StackName}/);
      });
    });

    test('should enforce least privilege principle', () => {
      const ec2Role = template.Resources.EC2ApplicationRole;
      const lambdaRole = template.Resources.LambdaExecutionRole;
      
      // EC2 role should have read-only DynamoDB access
      const ec2Policy = ec2Role.Properties.Policies[0].PolicyDocument.Statement;
      const ec2DynamoStatement = ec2Policy.find((s: any) => s.Sid === 'DynamoDBReadAccess');
      expect(ec2DynamoStatement.Action).not.toContain('dynamodb:PutItem');
      expect(ec2DynamoStatement.Action).not.toContain('dynamodb:DeleteItem');
      
      // EC2 role should have read-only S3 access
      const ec2S3Statement = ec2Policy.find((s: any) => s.Sid === 'S3ReadOnlyAccess');
      expect(ec2S3Statement.Action).not.toContain('s3:PutObject');
      expect(ec2S3Statement.Action).not.toContain('s3:DeleteObject');
      
      // Lambda role should have different permissions than EC2 role
      const lambdaPolicy = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;
      const lambdaDynamoStatement = lambdaPolicy.find((s: any) => s.Sid === 'DynamoDBAccess');
      expect(lambdaDynamoStatement.Action).toContain('dynamodb:PutItem');
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly three IAM resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(3);
    });

    test('should have exactly three outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(3);
    });

    test('should have no parameters section (statically configured)', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Resource Cross-References', () => {
    test('roles should reference permission boundary policy correctly', () => {
      const ec2Role = template.Resources.EC2ApplicationRole;
      const lambdaRole = template.Resources.LambdaExecutionRole;
      
      expect(ec2Role.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
      expect(lambdaRole.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });

    test('outputs should reference correct resources', () => {
      expect(template.Outputs.EC2ApplicationRoleARN.Value).toEqual({
        'Fn::GetAtt': ['EC2ApplicationRole', 'Arn']
      });
      expect(template.Outputs.LambdaExecutionRoleARN.Value).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
      expect(template.Outputs.PermissionBoundaryPolicyARN.Value).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Policy Flow and Logic Tests', () => {
    test('permission boundary should prevent privilege escalation effectively', () => {
      const policy = template.Resources.PermissionBoundaryPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyPrivilegeEscalation');
      
      // Ensure comprehensive IAM denial
      expect(denyStatement.Action).toEqual([
        'iam:*',
        'sts:*', 
        'organizations:*'
      ]);
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Resource).toBe('*');
    });

    test('role policies should work within permission boundary constraints', () => {
      const boundaryPolicy = template.Resources.PermissionBoundaryPolicy.Properties.PolicyDocument;
      const ec2RolePolicy = template.Resources.EC2ApplicationRole.Properties.Policies[0].PolicyDocument;
      const lambdaRolePolicy = template.Resources.LambdaExecutionRole.Properties.Policies[0].PolicyDocument;
      
      // All role policy actions should be allowed by boundary (intersection should exist)
      [ec2RolePolicy, lambdaRolePolicy].forEach(rolePolicy => {
        rolePolicy.Statement.forEach((roleStatement: any) => {
          if (roleStatement.Effect === 'Allow') {
            const roleActions = Array.isArray(roleStatement.Action) ? roleStatement.Action : [roleStatement.Action];
            
            roleActions.forEach((action: string) => {
              // Check if this action is allowed by boundary
              const isAllowedByBoundary = boundaryPolicy.Statement.some((boundaryStatement: any) => {
                if (boundaryStatement.Effect === 'Allow') {
                  const boundaryActions = Array.isArray(boundaryStatement.Action) ? boundaryStatement.Action : [boundaryStatement.Action];
                  return boundaryActions.some((boundaryAction: string) => {
                    return action === boundaryAction || (boundaryAction.endsWith('*') && action.startsWith(boundaryAction.slice(0, -1)));
                  });
                }
                return false;
              });
              
              expect(isAllowedByBoundary).toBe(true);
            });
          }
        });
      });
    });

    test('resource scoping should be consistent across policies', () => {
      const boundaryPolicy = template.Resources.PermissionBoundaryPolicy.Properties.PolicyDocument;
      const ec2Policy = template.Resources.EC2ApplicationRole.Properties.Policies[0].PolicyDocument;
      const lambdaPolicy = template.Resources.LambdaExecutionRole.Properties.Policies[0].PolicyDocument;
      
      // Check S3 resource consistency
      const boundaryS3Resources = [];
      const roleS3Resources = [];
      
      [boundaryPolicy, ec2Policy, lambdaPolicy].forEach(policy => {
        policy.Statement.forEach((statement: any) => {
          if (statement.Action && Array.isArray(statement.Action) && statement.Action.some((a: string) => a.startsWith('s3:'))) {
            if (Array.isArray(statement.Resource)) {
              statement.Resource.forEach((r: any) => {
                if (typeof r === 'object' && r['Fn::Sub']) {
                  if (policy === boundaryPolicy) {
                    boundaryS3Resources.push(r['Fn::Sub']);
                  } else {
                    roleS3Resources.push(r['Fn::Sub']);
                  }
                }
              });
            }
          }
        });
      });
      
      // Role resources should be subset of boundary resources
      roleS3Resources.forEach(roleResource => {
        const matchesBoundary = boundaryS3Resources.some(boundaryResource => {
          return roleResource === boundaryResource;
        });
        expect(matchesBoundary).toBe(true);
      });
    });
  });
});
