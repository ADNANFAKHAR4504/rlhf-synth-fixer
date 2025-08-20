import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Ensure the template is in JSON format (convert YAML to JSON before running tests)
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'Environment',
      'ApplicationName',
      'DBUsername',
      'InstanceType',
    ];
    test('should have all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values and types', () => {
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('prod');
      expect(template.Parameters.ApplicationName.Type).toBe('String');
      expect(template.Parameters.ApplicationName.Default).toBe('webapp');
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.Default).toBe('admin');
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.medium');
    });
  });

  describe('Resources', () => {
    test('should define a VPC', () => {
      expect(template.Resources.DefaultVPCInfo).toBeDefined();
      expect(template.Resources.DefaultVPCInfo.Type).toBe('AWS::EC2::VPC');
    });

    test('should define public and private subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should define an Internet Gateway and attach it', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should define NAT Gateway and EIP', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
    });

    test('should define security groups for ALB, app, db, and bastion', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
    });

    test('should define IAM roles for EC2, CodePipeline, CodeBuild, CodeDeploy', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CodeDeployServiceRole).toBeDefined();
    });

    test('should define a SecretsManager secret for DB', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
    });

    test('should define an RDS DBInstance', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should define an S3 bucket for CodeDeploy artifacts', () => {
      expect(template.Resources.CodeDeployS3Bucket).toBeDefined();
      expect(template.Resources.CodeDeployS3Bucket.Type).toBe(
        'AWS::S3::Bucket'
      );
    });

    test('should define an Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should define blue/green target groups and auto scaling groups', () => {
      expect(template.Resources.BlueTargetGroup).toBeDefined();
      expect(template.Resources.GreenTargetGroup).toBeDefined();
      expect(template.Resources.BlueAutoScalingGroup).toBeDefined();
      expect(template.Resources.GreenAutoScalingGroup).toBeDefined();
    });

    test('should define CodeBuild, CodeDeploy, and CodePipeline resources', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeDeployApplication).toBeDefined();
      expect(template.Resources.CodeDeployDeploymentGroup).toBeDefined();
      expect(template.Resources.CodePipeline).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'LoadBalancerDNS',
      'DatabaseEndpoint',
      'CodePipelineName',
      'BlueTargetGroupArn',
      'GreenTargetGroupArn',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have correct output descriptions and export names', () => {
      expect(template.Outputs.VPCId.Description).toMatch(/VPC ID/);
      const vpcExportName = template.Outputs.VPCId.Export.Name;
      if (typeof vpcExportName === 'object' && vpcExportName['Fn::Sub']) {
        expect(vpcExportName['Fn::Sub']).toMatch(/\${AWS::StackName}-VPC-ID/);
      } else {
        expect(vpcExportName).toMatch(/\${AWS::StackName}-VPC-ID/);
      }

      expect(template.Outputs.LoadBalancerDNS.Description).toMatch(
        /Load Balancer DNS/
      );
      const albExportName = template.Outputs.LoadBalancerDNS.Export.Name;
      if (typeof albExportName === 'object' && albExportName['Fn::Sub']) {
        expect(albExportName['Fn::Sub']).toMatch(/\${AWS::StackName}-ALB-DNS/);
      } else {
        expect(albExportName).toMatch(/\${AWS::StackName}-ALB-DNS/);
      }

      expect(template.Outputs.DatabaseEndpoint.Description).toMatch(
        /Database Endpoint/
      );
      const dbExportName = template.Outputs.DatabaseEndpoint.Export.Name;
      if (typeof dbExportName === 'object' && dbExportName['Fn::Sub']) {
        expect(dbExportName['Fn::Sub']).toMatch(
          /\${AWS::StackName}-DB-Endpoint/
        );
      } else {
        expect(dbExportName).toMatch(/\${AWS::StackName}-DB-Endpoint/);
      }

      expect(template.Outputs.CodePipelineName.Description).toMatch(
        /CodePipeline Name/
      );
      const pipelineExportName = template.Outputs.CodePipelineName.Export.Name;
      if (
        typeof pipelineExportName === 'object' &&
        pipelineExportName['Fn::Sub']
      ) {
        expect(pipelineExportName['Fn::Sub']).toMatch(
          /\${AWS::StackName}-Pipeline-Name/
        );
      } else {
        expect(pipelineExportName).toMatch(/\${AWS::StackName}-Pipeline-Name/);
      }

      expect(template.Outputs.BlueTargetGroupArn.Description).toMatch(
        /Blue Target Group ARN/
      );
      const blueTgExportName = template.Outputs.BlueTargetGroupArn.Export.Name;
      if (typeof blueTgExportName === 'object' && blueTgExportName['Fn::Sub']) {
        expect(blueTgExportName['Fn::Sub']).toMatch(
          /\${AWS::StackName}-Blue-TG-ARN/
        );
      } else {
        expect(blueTgExportName).toMatch(/\${AWS::StackName}-Blue-TG-ARN/);
      }

      expect(template.Outputs.GreenTargetGroupArn.Description).toMatch(
        /Green Target Group ARN/
      );
      const greenTgExportName =
        template.Outputs.GreenTargetGroupArn.Export.Name;
      if (
        typeof greenTgExportName === 'object' &&
        greenTgExportName['Fn::Sub']
      ) {
        expect(greenTgExportName['Fn::Sub']).toMatch(
          /\${AWS::StackName}-Green-TG-ARN/
        );
      } else {
        expect(greenTgExportName).toMatch(/\${AWS::StackName}-Green-TG-ARN/);
      }
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
  });

  describe('Resource Naming Convention', () => {
    test('resource names should use environment and application parameters', () => {
      const vpcTags = template.Resources.DefaultVPCInfo.Properties.Tags;
      expect(vpcTags.some((t: any) => t.Value && t.Value['Fn::Sub'])).toBe(
        true
      );
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toMatch(/\${AWS::StackName}-/);
        } else {
          expect(exportName).toMatch(/\${AWS::StackName}-/);
        }
      });
    });
  });
});
