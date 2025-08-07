import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON for testing
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
        'Modular multi-environment infrastructure template with VPC, EC2, RDS, and ALB'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter with correct configuration', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'test', 'stage', 'prod']);
      expect(envParam.Description).toBe('Target deployment environment');
    });

    test('should have ProjectName parameter', () => {
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam).toBeDefined();
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('MyApp');
      expect(projectParam.Description).toBe('Project name for resource naming and tagging');
    });

    test('should have Owner parameter', () => {
      const ownerParam = template.Parameters.Owner;
      expect(ownerParam).toBeDefined();
      expect(ownerParam.Type).toBe('String');
      expect(ownerParam.Default).toBe('DevOps-Team');
    });

    test('should have CostCenter parameter', () => {
      const costParam = template.Parameters.CostCenter;
      expect(costParam).toBeDefined();
      expect(costParam.Type).toBe('String');
      expect(costParam.Default).toBe('Engineering');
    });

    test('should have LatestAmiId parameter for dynamic AMI lookup', () => {
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam).toBeDefined();
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should not have DBPassword parameter (replaced with Secrets Manager)', () => {
      const dbParam = template.Parameters.DBPassword;
      expect(dbParam).toBeUndefined();
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping with all environments', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig).toBeDefined();
      expect(envConfig.dev).toBeDefined();
      expect(envConfig.test).toBeDefined();
      expect(envConfig.stage).toBeDefined();
      expect(envConfig.prod).toBeDefined();
    });

    test('should have correct dev environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.VpcCidr).toBe('10.0.0.0/16');
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.MinSize).toBe(1);
      expect(devConfig.MaxSize).toBe(2);
      expect(devConfig.DesiredCapacity).toBe(1);
      expect(devConfig.DBInstanceClass).toBe('db.t3.micro');
      expect(devConfig.MultiAZ).toBe(false);
    });

    test('should have different configurations for production environments', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.VpcCidr).toBe('10.3.0.0/16');
      expect(prodConfig.InstanceType).toBe('t3.large');
      expect(prodConfig.MinSize).toBe(2);
      expect(prodConfig.MaxSize).toBe(6);
      expect(prodConfig.DesiredCapacity).toBe(3);
      expect(prodConfig.DBInstanceClass).toBe('db.t3.medium');
      expect(prodConfig.MultiAZ).toBe(true);
    });
  });

  describe('Conditions', () => {
    test('should have IsProductionLike condition', () => {
      const condition = template.Conditions.IsProductionLike;
      expect(condition).toBeDefined();
      expect(condition['Fn::Or']).toBeDefined();
      expect(condition['Fn::Or']).toHaveLength(2);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have NAT Gateway resources with conditions', () => {
      const natEIP = template.Resources.NatGateway1EIP;
      const natGW = template.Resources.NatGateway1;
      
      expect(natEIP).toBeDefined();
      expect(natEIP.Type).toBe('AWS::EC2::EIP');
      expect(natEIP.Condition).toBe('IsProductionLike');
      
      expect(natGW).toBeDefined();
      expect(natGW.Type).toBe('AWS::EC2::NatGateway');
      expect(natGW.Condition).toBe('IsProductionLike');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group with HTTP/HTTPS access', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = albSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      // Check for HTTP (80) and HTTPS (443) rules
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServer Security Group with restricted access', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG).toBeDefined();
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = webSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      // Check for HTTP from ALB and SSH from VPC
      const httpFromALB = ingress.find((rule: any) => rule.FromPort === 80);
      const sshFromVPC = ingress.find((rule: any) => rule.FromPort === 22);
      
      expect(httpFromALB).toBeDefined();
      expect(httpFromALB.SourceSecurityGroupId).toBeDefined();
      expect(sshFromVPC).toBeDefined();
    });

    test('should have Database Security Group with MySQL access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG).toBeDefined();
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = dbSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have ALB Target Group with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Compute Resources', () => {
    test('should have Launch Template with correct configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const ltData = lt.Properties.LaunchTemplateData;
      expect(ltData.ImageId).toEqual({ 'Ref': 'LatestAmiId' });
      expect(ltData.SecurityGroupIds).toHaveLength(1);
      expect(ltData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Database Resources', () => {
    test('should have DB Subnet Group', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbSubnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have RDS Database with correct configuration', () => {
      const db = template.Resources.Database;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.35');
      expect(db.Properties.MasterUsername).toBe('admin');
      expect(db.Properties.StorageType).toBe('gp2');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output with export', () => {
      const vpcOutput = template.Outputs.VPCId;
      expect(vpcOutput).toBeDefined();
      expect(vpcOutput.Description).toBe('VPC ID');
      expect(vpcOutput.Value).toEqual({ 'Ref': 'VPC' });
      expect(vpcOutput.Export).toBeDefined();
    });

    test('should have LoadBalancerURL output', () => {
      const albOutput = template.Outputs.LoadBalancerURL;
      expect(albOutput).toBeDefined();
      expect(albOutput.Description).toBe('Application Load Balancer URL');
      expect(albOutput.Value['Fn::Sub']).toBe('http://${ApplicationLoadBalancer.DNSName}');
    });

    test('should have DatabaseEndpoint output', () => {
      const dbOutput = template.Outputs.DatabaseEndpoint;
      expect(dbOutput).toBeDefined();
      expect(dbOutput.Description).toBe('RDS Database Endpoint');
      expect(dbOutput.Value['Fn::GetAtt']).toEqual(['Database', 'Endpoint.Address']);
    });

    test('should have Environment output', () => {
      const envOutput = template.Outputs.Environment;
      expect(envOutput).toBeDefined();
      expect(envOutput.Description).toBe('Deployed Environment');
      expect(envOutput.Value).toEqual({ 'Ref': 'Environment' });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      const costTag = tags.find((tag: any) => tag.Key === 'CostCenter');
      
      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(ownerTag).toBeDefined();
      expect(projectTag).toBeDefined();
      expect(costTag).toBeDefined();
    });

    test('ALB should have all required tags', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const tags = alb.Properties.Tags;
      
      expect(tags).toHaveLength(5);
      expect(tags.find((tag: any) => tag.Key === 'Name')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Environment')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Owner')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'Project')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'CostCenter')).toBeDefined();
    });

    test('Auto Scaling Group should propagate tags correctly', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;
      
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      
      expect(envTag.PropagateAtLaunch).toBe(true);
      expect(ownerTag.PropagateAtLaunch).toBe(true);
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

    test('should have reasonable number of resources for the infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have VPC, subnets, SGs, ALB, ASG, RDS, etc.
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // Environment, ProjectName, Owner, CostCenter, LatestAmiId (DBPassword removed)
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4); // VPCId, LoadBalancerURL, DatabaseEndpoint, Environment
    });
  });

  describe('Environment-Specific Scaling', () => {
    test('dev environment should have minimal resources', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.MinSize).toBe(1);
      expect(devConfig.MaxSize).toBe(2);
      expect(devConfig.DesiredCapacity).toBe(1);
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.DBInstanceClass).toBe('db.t3.micro');
      expect(devConfig.MultiAZ).toBe(false);
    });

    test('prod environment should have production-ready resources', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.MinSize).toBe(2);
      expect(prodConfig.MaxSize).toBe(6);
      expect(prodConfig.DesiredCapacity).toBe(3);
      expect(prodConfig.InstanceType).toBe('t3.large');
      expect(prodConfig.DBInstanceClass).toBe('db.t3.medium');
      expect(prodConfig.MultiAZ).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should use Secrets Manager for password', () => {
      const database = template.Resources.Database;
      const masterUserPassword = database.Properties.MasterUserPassword;
      expect(masterUserPassword['Fn::Sub']).toBeDefined();
      expect(masterUserPassword['Fn::Sub']).toContain('{{resolve:secretsmanager:');
    });

    test('Database should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      
      expect(subnetIds).toContainEqual({ 'Ref': 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ 'Ref': 'PrivateSubnet2' });
    });

    test('Web servers should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;
      
      expect(subnets).toContainEqual({ 'Ref': 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ 'Ref': 'PrivateSubnet2' });
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      
      expect(subnets).toContainEqual({ 'Ref': 'PublicSubnet1' });
      expect(subnets).toContainEqual({ 'Ref': 'PublicSubnet2' });
    });
  });
});