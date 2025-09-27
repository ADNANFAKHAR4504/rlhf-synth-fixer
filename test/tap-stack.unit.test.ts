import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML using cfn-flip
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
        'Secure IAM Roles with Least Privilege and Permission Boundaries'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBe('Environment name for resource tagging');
      expect(envParam.AllowedValues).toEqual([
        'development',
        'staging', 
        'production'
      ]);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('Resources', () => {
    test('should have all required IAM resources', () => {
      const expectedResources = [
        'PermissionBoundaryPolicy',
        'EC2InstanceRole',
        'EC2InstancePolicy', 
        'EC2InstanceProfile',
        'LambdaFunctionRole',
        'LambdaFunctionPolicy'
      ];
      
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have exactly 6 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });
  });
  
  describe('PermissionBoundaryPolicy', () => {
    let boundaryPolicy: any;
    
    beforeEach(() => {
      boundaryPolicy = template.Resources.PermissionBoundaryPolicy;
    });
    
    test('should be a managed policy', () => {
      expect(boundaryPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });
    
    test('should have correct name and description', () => {
      expect(boundaryPolicy.Properties.ManagedPolicyName).toEqual({
        'Fn::Sub': 'SecurePermissionBoundary-${AWS::StackName}'
      });
      expect(boundaryPolicy.Properties.Description).toBe(
        'Permission boundary to prevent privilege escalation'
      );
    });
    
    test('should have policy document with correct version', () => {
      const policyDoc = boundaryPolicy.Properties.PolicyDocument;
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement).toBeDefined();
      expect(Array.isArray(policyDoc.Statement)).toBe(true);
    });
    
    test('should have explicit wildcard deny statement', () => {
      const policyDoc = boundaryPolicy.Properties.PolicyDocument;
      const wildcardDeny = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyWildcardActions' && stmt.Effect === 'Deny'
      );
      
      expect(wildcardDeny).toBeDefined();
      expect(wildcardDeny.Action).toBe('*');
      expect(wildcardDeny.Resource).toBe('*');
      expect(wildcardDeny.Condition).toBeDefined();
    });
    
    test('should have dangerous actions deny statement', () => {
      const policyDoc = boundaryPolicy.Properties.PolicyDocument;
      const dangerousDeny = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyDangerousActions'
      );
      
      expect(dangerousDeny).toBeDefined();
      expect(dangerousDeny.Effect).toBe('Deny');
      expect(dangerousDeny.Action).toContain('iam:CreateAccessKey');
      expect(dangerousDeny.Action).toContain('iam:DeleteRole');
      expect(dangerousDeny.Action).toContain('sts:AssumeRole');
    });
  });
  
  describe('EC2InstanceRole', () => {
    let ec2Role: any;
    
    beforeEach(() => {
      ec2Role = template.Resources.EC2InstanceRole;
    });
    
    test('should be an IAM role', () => {
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
    });
    
    test('should have correct role name', () => {
      expect(ec2Role.Properties.RoleName).toEqual({
        'Fn::Sub': 'SecureEC2Role-${AWS::StackName}'
      });
    });
    
    test('should have permission boundary attached', () => {
      expect(ec2Role.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });
    
    test('should have assume role policy for EC2 service', () => {
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });
    
    test('should have required tags', () => {
      const tags = ec2Role.Properties.Tags;
      expect(tags.find((tag: any) => tag.Key === 'Environment')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'ManagedBy')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Purpose')).toBeDefined();
    });
    
    test('should have security conditions in assume role policy', () => {
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      const condition = assumePolicy.Statement[0].Condition;
      expect(condition.StringEquals).toBeDefined();
      expect(condition.IpAddress).toBeDefined();
    });
  });
  
  describe('EC2InstancePolicy', () => {
    let ec2Policy: any;
    
    beforeEach(() => {
      ec2Policy = template.Resources.EC2InstancePolicy;
    });
    
    test('should be an IAM policy', () => {
      expect(ec2Policy.Type).toBe('AWS::IAM::Policy');
    });
    
    test('should be attached to EC2 role', () => {
      expect(ec2Policy.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
    
    test('should have policy document with specific permissions', () => {
      const policyDoc = ec2Policy.Properties.PolicyDocument;
      expect(policyDoc.Version).toBe('2012-10-17');
      
      const statements = policyDoc.Statement;
      const logStatement = statements.find((stmt: any) => 
        stmt.Sid === 'CloudWatchLogsAccess'
      );
      expect(logStatement).toBeDefined();
      expect(logStatement.Action).toContain('logs:CreateLogGroup');
    });
    
    test('should have explicit wildcard deny', () => {
      const policyDoc = ec2Policy.Properties.PolicyDocument;
      const denyStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyWildcardActions' && stmt.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toBe('*');
    });
    
    test('should have resource-specific permissions', () => {
      const policyDoc = ec2Policy.Properties.PolicyDocument;
      const s3Statement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'S3BucketAccess'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toEqual([
        { 'Fn::Sub': 'arn:aws:s3:::${AWS::AccountId}-${Environment}-data' },
        { 'Fn::Sub': 'arn:aws:s3:::${AWS::AccountId}-${Environment}-data/*' }
      ]);
    });
  });
  
  describe('EC2InstanceProfile', () => {
    let instanceProfile: any;
    
    beforeEach(() => {
      instanceProfile = template.Resources.EC2InstanceProfile;
    });
    
    test('should be an instance profile', () => {
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
    
    test('should have correct name', () => {
      expect(instanceProfile.Properties.InstanceProfileName).toEqual({
        'Fn::Sub': 'SecureEC2Profile-${AWS::StackName}'
      });
    });
    
    test('should be associated with EC2 role', () => {
      expect(instanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });
  
  describe('LambdaFunctionRole', () => {
    let lambdaRole: any;
    
    beforeEach(() => {
      lambdaRole = template.Resources.LambdaFunctionRole;
    });
    
    test('should be an IAM role', () => {
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
    });
    
    test('should have correct role name', () => {
      expect(lambdaRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'SecureLambdaRole-${AWS::StackName}'
      });
    });
    
    test('should have permission boundary attached', () => {
      expect(lambdaRole.Properties.PermissionsBoundary).toEqual({
        Ref: 'PermissionBoundaryPolicy'
      });
    });
    
    test('should have assume role policy for Lambda service', () => {
      const assumePolicy = lambdaRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });
    
    test('should have source account condition', () => {
      const assumePolicy = lambdaRole.Properties.AssumeRolePolicyDocument;
      const condition = assumePolicy.Statement[0].Condition;
      expect(condition.StringEquals['aws:SourceAccount']).toEqual({ Ref: 'AWS::AccountId' });
    });
    
    test('should have required tags', () => {
      const tags = lambdaRole.Properties.Tags;
      expect(tags.find((tag: any) => tag.Key === 'Purpose' && tag.Value === 'LambdaFunction')).toBeDefined();
    });
  });
  
  describe('LambdaFunctionPolicy', () => {
    let lambdaPolicy: any;
    
    beforeEach(() => {
      lambdaPolicy = template.Resources.LambdaFunctionPolicy;
    });
    
    test('should be an IAM policy', () => {
      expect(lambdaPolicy.Type).toBe('AWS::IAM::Policy');
    });
    
    test('should be attached to Lambda role', () => {
      expect(lambdaPolicy.Properties.Roles).toContainEqual({ Ref: 'LambdaFunctionRole' });
    });
    
    test('should have DynamoDB permissions with conditions', () => {
      const policyDoc = lambdaPolicy.Properties.PolicyDocument;
      const dynamoStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DynamoDBTableAccess'
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Condition).toBeDefined();
    });
    
    test('should have S3 permissions with encryption requirements', () => {
      const policyDoc = lambdaPolicy.Properties.PolicyDocument;
      const s3Statement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'S3ProcessingAccess'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Condition.StringLike['s3:x-amz-server-side-encryption']).toBe('AES256');
    });
    
    test('should have KMS permissions with service restrictions', () => {
      const policyDoc = lambdaPolicy.Properties.PolicyDocument;
      const kmsStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'KMSAccess'
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Condition.StringEquals['kms:ViaService']).toEqual({
        'Fn::Sub': 's3.${AWS::Region}.amazonaws.com'
      });
    });
    
    test('should have explicit wildcard deny', () => {
      const policyDoc = lambdaPolicy.Properties.PolicyDocument;
      const denyStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Sid === 'DenyWildcardActions' && stmt.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toBe('*');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'EC2RoleArn',
        'LambdaRoleArn',
        'EC2InstanceProfileName',
        'PermissionBoundaryArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('EC2RoleArn output should be correct', () => {
      const output = template.Outputs.EC2RoleArn;
      expect(output.Description).toBe('ARN of the EC2 Instance Role');
      expect(output.Value).toEqual({ 
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn'] 
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2RoleArn'
      });
    });

    test('LambdaRoleArn output should be correct', () => {
      const output = template.Outputs.LambdaRoleArn;
      expect(output.Description).toBe('ARN of the Lambda Function Role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunctionRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaRoleArn'
      });
    });

    test('EC2InstanceProfileName output should be correct', () => {
      const output = template.Outputs.EC2InstanceProfileName;
      expect(output.Description).toBe('Name of the EC2 Instance Profile');
      expect(output.Value).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2InstanceProfile'
      });
    });

    test('PermissionBoundaryArn output should be correct', () => {
      const output = template.Outputs.PermissionBoundaryArn;
      expect(output.Description).toBe('ARN of the Permission Boundary Policy');
      expect(output.Value).toEqual({ Ref: 'PermissionBoundaryPolicy' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PermissionBoundaryArn'
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

    test('should have exactly 6 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Security Validation', () => {
    test('should not contain any wildcard actions in Allow statements', () => {
      const checkPolicyForWildcards = (policyDoc: any) => {
        if (!policyDoc || !policyDoc.Statement) return;
        
        policyDoc.Statement.forEach((stmt: any) => {
          if (stmt.Effect === 'Allow' && stmt.Action) {
            if (Array.isArray(stmt.Action)) {
              stmt.Action.forEach((action: string) => {
                expect(action).not.toBe('*');
              });
            } else {
              expect(stmt.Action).not.toBe('*');
            }
          }
        });
      };
      
      // Check permission boundary policy
      const boundaryPolicy = template.Resources.PermissionBoundaryPolicy;
      checkPolicyForWildcards(boundaryPolicy.Properties.PolicyDocument);
      
      // Check EC2 policy
      const ec2Policy = template.Resources.EC2InstancePolicy;
      checkPolicyForWildcards(ec2Policy.Properties.PolicyDocument);
      
      // Check Lambda policy
      const lambdaPolicy = template.Resources.LambdaFunctionPolicy;
      checkPolicyForWildcards(lambdaPolicy.Properties.PolicyDocument);
    });
    
    test('should have explicit deny statements for wildcard actions', () => {
      const policies = [
        template.Resources.PermissionBoundaryPolicy.Properties.PolicyDocument,
        template.Resources.EC2InstancePolicy.Properties.PolicyDocument,
        template.Resources.LambdaFunctionPolicy.Properties.PolicyDocument
      ];
      
      policies.forEach(policyDoc => {
        const wildcardDeny = policyDoc.Statement.find((stmt: any) => 
          stmt.Effect === 'Deny' && stmt.Action === '*'
        );
        expect(wildcardDeny).toBeDefined();
      });
    });
    
    test('should have permission boundaries on all roles', () => {
      const roles = [
        template.Resources.EC2InstanceRole,
        template.Resources.LambdaFunctionRole
      ];
      
      roles.forEach(role => {
        expect(role.Properties.PermissionsBoundary).toBeDefined();
        expect(role.Properties.PermissionsBoundary.Ref).toBe('PermissionBoundaryPolicy');
      });
    });
    
    test('should have resource-specific ARNs where possible', () => {
      // Check EC2 policy for resource-specific permissions
      const ec2Policy = template.Resources.EC2InstancePolicy;
      const s3Statement = ec2Policy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'S3BucketAccess'
      );
      expect(s3Statement.Resource).toBeDefined();
      expect(Array.isArray(s3Statement.Resource)).toBe(true);
      
      // Check Lambda policy for resource-specific permissions
      const lambdaPolicy = template.Resources.LambdaFunctionPolicy;
      const dynamoStatement = lambdaPolicy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'DynamoDBTableAccess'
      );
      expect(dynamoStatement.Resource).toBeDefined();
      expect(Array.isArray(dynamoStatement.Resource)).toBe(true);
    });
    
    test('export names should follow naming convention', () => {
      // Check specific export names match expected pattern
      expect(template.Outputs.EC2RoleArn.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2RoleArn'
      });
      expect(template.Outputs.LambdaRoleArn.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaRoleArn'
      });
      expect(template.Outputs.EC2InstanceProfileName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2InstanceProfile'
      });
      expect(template.Outputs.PermissionBoundaryArn.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PermissionBoundaryArn'
      });
    });
  });
  
  describe('Policy Statement Analysis', () => {
    test('should have conditions on broad permissions', () => {
      const boundaryPolicy = template.Resources.PermissionBoundaryPolicy;
      const basicOpsStatement = boundaryPolicy.Properties.PolicyDocument.Statement.find(
        (stmt: any) => stmt.Sid === 'AllowBasicReadOperations'
      );
      
      expect(basicOpsStatement.Condition).toBeDefined();
      expect(basicOpsStatement.Condition.StringEquals['aws:RequestedRegion']).toBeDefined();
    });
    
    test('should have service-specific assume role policies', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const assumePolicy = ec2Role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toEqual(['ec2.amazonaws.com']);
      
      const lambdaRole = template.Resources.LambdaFunctionRole;
      const lambdaAssumePolicy = lambdaRole.Properties.AssumeRolePolicyDocument;
      expect(lambdaAssumePolicy.Statement[0].Principal.Service).toEqual(['lambda.amazonaws.com']);
    });
    
    test('should have all policies attached to correct roles', () => {
      const ec2Policy = template.Resources.EC2InstancePolicy;
      expect(ec2Policy.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
      
      const lambdaPolicy = template.Resources.LambdaFunctionPolicy;
      expect(lambdaPolicy.Properties.Roles).toContainEqual({ Ref: 'LambdaFunctionRole' });
    });
  });
});
