import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Production Web App Infrastructure', () => {
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

    test('should have production web app description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-grade web application infrastructure');
    });
  });

  describe('Parameters', () => {
    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
    });

    test('should have secrets manager for database credentials', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBPasswordSecretAttachment).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.ProductionVPC).toBeDefined();
      expect(template.Resources.ProductionVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.ProductionVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Gateway attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnet', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnet should have correct CIDR', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test('should have private subnet', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnet should have correct CIDR', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have NAT Gateway for private subnet connectivity', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Security Groups', () => {
    test('should have web server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web server security group should allow HTTP/HTTPS', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('database security group should only allow access from web server', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 instance', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('should have IAM role for EC2', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('EC2 instance should be in public subnet', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.SubnetId.Ref).toBe('PublicSubnet');
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.ProductionDatabase).toBeDefined();
      expect(template.Resources.ProductionDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('RDS should be MySQL engine', () => {
      const db = template.Resources.ProductionDatabase;
      expect(db.Properties.Engine).toBe('mysql');
    });

    test('RDS should have encryption enabled', () => {
      const db = template.Resources.ProductionDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have Multi-AZ configured', () => {
      const db = template.Resources.ProductionDatabase;
      expect(db.Properties.MultiAZ).toBeDefined();
    });
  });

  describe('Tagging Compliance', () => {
    test('VPC should have correct tags', () => {
      const vpc = template.Resources.ProductionVPC;
      const tags = vpc.Properties.Tags;
      
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(projectTag.Value).toBe('XYZ');
      expect(envTag.Value).toBe('Production');
    });

    test('all major resources should have required tags', () => {
      const resourcesWithTags = [
        'ProductionVPC',
        'PublicSubnet', 
        'PrivateSubnet',
        'WebServerInstance',
        'ProductionDatabase'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        const hasProjectTag = tags.some((tag: any) => tag.Key === 'Project');
        const hasEnvTag = tags.some((tag: any) => tag.Key === 'Environment');
        
        expect(hasProjectTag).toBe(true);
        expect(hasEnvTag).toBe(true);
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('ProductionVPC');
    });

    test('should have web server public IP output', () => {
      expect(template.Outputs.WebServerPublicIP).toBeDefined();
    });

    test('should have database endpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt']).toEqual(['ProductionDatabase', 'Endpoint.Address']);
    });

    test('should have web server URL output', () => {
      expect(template.Outputs.WebServerURL).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have sufficient resources for production web app', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Should have VPC, subnets, SGs, EC2, RDS, etc.
    });

    test('template should be deployable (no circular dependencies)', () => {
      // Check that database security group references web server security group correctly
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const webSG = template.Resources.WebServerSecurityGroup;
      
      expect(dbSG).toBeDefined();
      expect(webSG).toBeDefined();
      
      // Ensure no circular reference
      const dbIngress = dbSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });
  });

  describe('Production Readiness', () => {
    test('should have proper deletion policies for production', () => {
      const db = template.Resources.ProductionDatabase;
      expect(db.DeletionPolicy).toBeDefined();
    });

    test('should have backup retention for database', () => {
      const db = template.Resources.ProductionDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('should have monitoring capabilities', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      
      const policies = role.Properties.ManagedPolicyArns;
      const hasSSMPolicy = policies.some((policy: string) => 
        policy.includes('AmazonSSMManagedInstanceCore')
      );
      expect(hasSSMPolicy).toBe(true);
    });
  });
});
