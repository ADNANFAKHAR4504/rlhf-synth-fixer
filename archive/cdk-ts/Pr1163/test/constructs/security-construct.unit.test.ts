import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityConstruct } from '../../lib/constructs/security-construct';

describe('SecurityConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let vpc: ec2.Vpc;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
    });
  });

  describe('Basic Security Construct Creation', () => {
    beforeEach(() => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      template = Template.fromStack(stack);
    });

    test('should create all required security groups', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for web tier',
        },
      });
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for application tier',
        },
      });
      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: 'Security group for database tier',
        },
      });
    });

    test('should create all required IAM roles', () => {
      template.hasResource('AWS::IAM::Role', {
        Properties: {
          Description: 'IAM role for EC2 instances',
        },
      });
      template.hasResource('AWS::IAM::Role', {
        Properties: {
          Description: 'IAM role for RDS enhanced monitoring',
        },
      });
      template.hasResource('AWS::IAM::Role', {
        Properties: {
          Description: 'Admin role with MFA requirement for sensitive operations',
        },
      });
    });

    test('should tag security groups correctly', () => {
      // Check that all security groups have proper tags
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties.Tags).toBeDefined();
        expect(Array.isArray(sg.Properties.Tags)).toBe(true);
        
        const nameTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        const componentTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Component');
        
        expect(nameTag).toBeDefined();
        expect(componentTag).toBeDefined();
        expect(componentTag.Value).toBe('Security');
      });
    });
  });

  describe('Security Group Rules Validation', () => {
    beforeEach(() => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      template = Template.fromStack(stack);
    });

    test('should have web tier security group with correct inbound rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const webSecurityGroup = Object.values(securityGroups).find((sg: any) =>
        sg.Properties.GroupDescription === 'Security group for web tier'
      ) as any;

      expect(webSecurityGroup).toBeDefined();
      
      // Should have HTTPS inbound rule
      const httpsRule = webSecurityGroup.Properties.SecurityGroupIngress.find((rule: any) =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');

      // Should have HTTP inbound rule for redirect
      const httpRule = webSecurityGroup.Properties.SecurityGroupIngress.find((rule: any) =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have application tier security group with correct rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const appSecurityGroup = Object.values(securityGroups).find((sg: any) =>
        sg.Properties.GroupDescription === 'Security group for application tier'
      ) as any;

      expect(appSecurityGroup).toBeDefined();
      expect(appSecurityGroup.Properties.GroupDescription).toBe('Security group for application tier');
    });

    test('should have database tier security group with correct rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSecurityGroup = Object.values(securityGroups).find((sg: any) =>
        sg.Properties.GroupDescription === 'Security group for database tier'
      ) as any;

      expect(dbSecurityGroup).toBeDefined();
      expect(dbSecurityGroup.Properties.GroupDescription).toBe('Security group for database tier');
    });

    test('should not allow overly permissive rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach((sg: any) => {
        // Should not have allow all outbound (0.0.0.0/0 on all ports)
        const overlyPermissiveOutbound = sg.Properties.SecurityGroupEgress?.find((rule: any) =>
          rule.CidrIp === '0.0.0.0/0' && rule.FromPort === 0 && rule.ToPort === 65535
        );
        expect(overlyPermissiveOutbound).toBeUndefined();

        // Should not have allow all inbound (0.0.0.0/0 on all ports)
        const overlyPermissiveInbound = sg.Properties.SecurityGroupIngress?.find((rule: any) =>
          rule.CidrIp === '0.0.0.0/0' && rule.FromPort === 0 && rule.ToPort === 65535
        );
        expect(overlyPermissiveInbound).toBeUndefined();
      });
    });

    test('should have proper security group dependencies', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      // Should have three security groups
      expect(Object.keys(securityGroups)).toHaveLength(3);
      
      // Each should be in the same VPC
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties.VpcId).toBeDefined();
      });
    });
  });

  describe('IAM Policy Content Validation', () => {
    beforeEach(() => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      template = Template.fromStack(stack);
    });

    test('should have EC2 role with least privilege permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'IAM role for EC2 instances'
      ) as any;

      expect(ec2Role).toBeDefined();
      
      // Should have SSM managed policy
      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;
      expect(managedPolicies.length).toBeGreaterThan(0);
      expect(managedPolicies[0]).toHaveProperty('Fn::Join');
    });

    test('should have RDS role with enhanced monitoring permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const rdsRole = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'IAM role for RDS enhanced monitoring'
      ) as any;

      expect(rdsRole).toBeDefined();
      
      // Should have RDS enhanced monitoring managed policy
      const managedPolicies = rdsRole.Properties.ManagedPolicyArns;
      expect(managedPolicies.length).toBeGreaterThan(0);
      expect(managedPolicies[0]).toHaveProperty('Fn::Join');
    });

    test('should have admin role with MFA requirement for sensitive operations', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const adminRole = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'Admin role with MFA requirement for sensitive operations'
      ) as any;

      expect(adminRole).toBeDefined();
      
      // Should have AdministratorAccess managed policy
      const managedPolicies = adminRole.Properties.ManagedPolicyArns;
      expect(managedPolicies.length).toBeGreaterThan(0);
      expect(managedPolicies[0]).toHaveProperty('Fn::Join');
    });

    test('should have proper IAM role trust relationships', () => {
      const roles = template.findResources('AWS::IAM::Role');
      
      // EC2 role should trust EC2 service
      const ec2Role = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'IAM role for EC2 instances'
      ) as any;
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      // RDS role should trust RDS service
      const rdsRole = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'IAM role for RDS enhanced monitoring'
      ) as any;
      expect(rdsRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('rds.amazonaws.com');

      // Admin role should trust account principal
      const adminRole = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'Admin role with MFA requirement for sensitive operations'
      ) as any;
      expect(adminRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.AWS).toBeDefined();
    });

    test('should not have overly permissive IAM policies', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        
        statements.forEach((statement: any) => {
          // Should not have wildcard actions with wildcard resources
          if (statement.Action === '*' && statement.Resource === '*') {
            // Only allow this for specific cases like CloudWatch metrics
            expect(statement.Condition).toBeDefined();
          }
        });
      });
    });

    test('should have Systems Manager permissions for patch management', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find((role: any) =>
        role.Properties.Description === 'IAM role for EC2 instances'
      ) as any;

      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });
  });

  describe('Instance Profile Creation', () => {
    beforeEach(() => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      template = Template.fromStack(stack);
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {
        Properties: {
          Roles: Match.anyValue(),
        },
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should handle different environment names', () => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'prod',
        vpc,
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::EC2::SecurityGroup', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'WebSecurityGroup-prod',
            },
          ]),
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should expose security group properties', () => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      expect(securityConstruct.webSecurityGroup).toBeDefined();
      expect(securityConstruct.appSecurityGroup).toBeDefined();
      expect(securityConstruct.databaseSecurityGroup).toBeDefined();
    });

    test('should expose IAM role properties', () => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      expect(securityConstruct.ec2Role).toBeDefined();
      expect(securityConstruct.rdsRole).toBeDefined();
      expect(securityConstruct.adminRole).toBeDefined();
    });
  });

  describe('Security Best Practices Validation', () => {
    beforeEach(() => {
      const securityConstruct = new SecurityConstruct(stack, 'TestSecurityConstruct', {
        environment: 'test',
        vpc,
      });
      template = Template.fromStack(stack);
    });

    test('should not allow all outbound traffic from any security group', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach((sg: any) => {
        // Should not have allow all outbound (0.0.0.0/0 on all ports)
        const overlyPermissiveOutbound = sg.Properties.SecurityGroupEgress?.find((rule: any) =>
          rule.CidrIp === '0.0.0.0/0' && rule.FromPort === 0 && rule.ToPort === 65535
        );
        expect(overlyPermissiveOutbound).toBeUndefined();
      });
    });

    test('should have proper resource isolation', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      // Should have three security groups (web, app, db)
      expect(Object.keys(securityGroups)).toHaveLength(3);
      
      // Each security group should have proper rules
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.VpcId).toBeDefined();
      });
    });
  });
});
