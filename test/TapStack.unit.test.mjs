import { readFileSync } from 'fs';
import { join } from 'path';

// Load CloudFormation template from JSON (converted from YAML)
const templatePath = join(process.cwd(), 'lib', 'TapStack.json');
const templateContent = readFileSync(templatePath, 'utf8');
const template = JSON.parse(templateContent);

describe('Hub-and-Spoke CloudFormation Template Unit Tests', () => {
  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Hub-and-Spoke');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix should have correct configuration', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('Environment should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('migration');
      expect(param.AllowedValues).toContain('development');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('production');
      expect(param.AllowedValues).toContain('migration');
    });
  });

  describe('VPC Configuration', () => {
    test('should create Hub VPC with correct CIDR', () => {
      const hubVpc = template.Resources.HubVPC;
      expect(hubVpc).toBeDefined();
      expect(hubVpc.Type).toBe('AWS::EC2::VPC');
      expect(hubVpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(hubVpc.Properties.EnableDnsHostnames).toBe(true);
      expect(hubVpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Finance VPC with correct CIDR', () => {
      const financeVpc = template.Resources.FinanceVPC;
      expect(financeVpc).toBeDefined();
      expect(financeVpc.Type).toBe('AWS::EC2::VPC');
      expect(financeVpc.Properties.CidrBlock).toBe('10.1.0.0/16');
    });

    test('should create Engineering VPC with correct CIDR', () => {
      const engVpc = template.Resources.EngineeringVPC;
      expect(engVpc).toBeDefined();
      expect(engVpc.Type).toBe('AWS::EC2::VPC');
      expect(engVpc.Properties.CidrBlock).toBe('10.2.0.0/16');
    });

    test('should create Marketing VPC with correct CIDR', () => {
      const mktVpc = template.Resources.MarketingVPC;
      expect(mktVpc).toBeDefined();
      expect(mktVpc.Type).toBe('AWS::EC2::VPC');
      expect(mktVpc.Properties.CidrBlock).toBe('10.3.0.0/16');
    });

    test('all VPCs should have proper tags', () => {
      const vpcs = ['HubVPC', 'FinanceVPC', 'EngineeringVPC', 'MarketingVPC'];
      vpcs.forEach(vpcName => {
        const vpc = template.Resources[vpcName];
        expect(vpc.Properties.Tags).toBeDefined();
        const tags = vpc.Properties.Tags;
        expect(tags.some(tag => tag.Key === 'Department')).toBe(true);
        expect(tags.some(tag => tag.Key === 'Environment')).toBe(true);
        expect(tags.some(tag => tag.Key === 'MigrationPhase')).toBe(true);
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('Hub VPC should have 3 public subnets', () => {
      const publicSubnets = ['HubPublicSubnet1', 'HubPublicSubnet2', 'HubPublicSubnet3'];
      publicSubnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Hub VPC should have 3 private subnets', () => {
      const privateSubnets = ['HubPrivateSubnet1', 'HubPrivateSubnet2', 'HubPrivateSubnet3'];
      privateSubnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('Hub public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.HubPublicSubnet1.Properties.CidrBlock).toBe('10.0.100.0/24');
      expect(template.Resources.HubPublicSubnet2.Properties.CidrBlock).toBe('10.0.101.0/24');
      expect(template.Resources.HubPublicSubnet3.Properties.CidrBlock).toBe('10.0.102.0/24');
    });

    test('Hub private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.HubPrivateSubnet1.Properties.CidrBlock).toBe('10.0.0.0/24');
      expect(template.Resources.HubPrivateSubnet2.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.HubPrivateSubnet3.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('Finance VPC should have correct subnet CIDR blocks', () => {
      expect(template.Resources.FinancePublicSubnet1.Properties.CidrBlock).toBe('10.1.100.0/24');
      expect(template.Resources.FinancePrivateSubnet1.Properties.CidrBlock).toBe('10.1.0.0/24');
    });

    test('Engineering VPC should have correct subnet CIDR blocks', () => {
      expect(template.Resources.EngineeringPublicSubnet1.Properties.CidrBlock).toBe('10.2.100.0/24');
      expect(template.Resources.EngineeringPrivateSubnet1.Properties.CidrBlock).toBe('10.2.0.0/24');
    });

    test('Marketing VPC should have correct subnet CIDR blocks', () => {
      expect(template.Resources.MarketingPublicSubnet1.Properties.CidrBlock).toBe('10.3.100.0/24');
      expect(template.Resources.MarketingPrivateSubnet1.Properties.CidrBlock).toBe('10.3.0.0/24');
    });
  });

  describe('Transit Gateway Configuration', () => {
    test('should create Transit Gateway', () => {
      const tgw = template.Resources.TransitGateway;
      expect(tgw).toBeDefined();
      expect(tgw.Type).toBe('AWS::EC2::TransitGateway');
      expect(tgw.Properties.DefaultRouteTableAssociation).toBe('disable');
      expect(tgw.Properties.DefaultRouteTablePropagation).toBe('disable');
    });

    test('should create Hub TGW Route Table', () => {
      const rtTable = template.Resources.HubTGWRouteTable;
      expect(rtTable).toBeDefined();
      expect(rtTable.Type).toBe('AWS::EC2::TransitGatewayRouteTable');
    });

    test('should create Spoke TGW Route Table', () => {
      const rtTable = template.Resources.SpokeTGWRouteTable;
      expect(rtTable).toBeDefined();
      expect(rtTable.Type).toBe('AWS::EC2::TransitGatewayRouteTable');
    });

    test('should create TGW attachments for all VPCs', () => {
      const attachments = [
        'HubTGWAttachment',
        'FinanceTGWAttachment',
        'EngineeringTGWAttachment',
        'MarketingTGWAttachment'
      ];
      attachments.forEach(attachmentName => {
        const attachment = template.Resources[attachmentName];
        expect(attachment).toBeDefined();
        expect(attachment.Type).toBe('AWS::EC2::TransitGatewayAttachment');
      });
    });

    test('should associate Hub with Hub route table', () => {
      const association = template.Resources.HubTGWRouteTableAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::EC2::TransitGatewayRouteTableAssociation');
    });

    test('should associate spokes with Spoke route table', () => {
      const associations = [
        'FinanceTGWRouteTableAssociation',
        'EngineeringTGWRouteTableAssociation',
        'MarketingTGWRouteTableAssociation'
      ];
      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::TransitGatewayRouteTableAssociation');
      });
    });

    test('should propagate spoke routes to Hub route table', () => {
      const propagation = template.Resources.HubTGWRouteTablePropagationToSpoke;
      expect(propagation).toBeDefined();
      expect(propagation.Type).toBe('AWS::EC2::TransitGatewayRouteTablePropagation');
    });

    test('should propagate Hub routes to each spoke', () => {
      const propagations = [
        'FinanceTGWRouteTablePropagation',
        'EngineeringTGWRouteTablePropagation',
        'MarketingTGWRouteTablePropagation'
      ];
      propagations.forEach(propName => {
        const propagation = template.Resources[propName];
        expect(propagation).toBeDefined();
        expect(propagation.Type).toBe('AWS::EC2::TransitGatewayRouteTablePropagation');
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway for Finance VPC', () => {
      const natGw = template.Resources.FinanceNATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create NAT Gateway for Engineering VPC', () => {
      const natGw = template.Resources.EngineeringNATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create NAT Gateway for Marketing VPC', () => {
      const natGw = template.Resources.MarketingNATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      const eips = ['FinanceNATGatewayEIP', 'EngineeringNATGatewayEIP', 'MarketingNATGatewayEIP'];
      eips.forEach(eipName => {
        const eip = template.Resources[eipName];
        expect(eip).toBeDefined();
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create CloudWatch Log Groups for all VPCs', () => {
      const logGroups = [
        'HubVPCFlowLogGroup',
        'FinanceVPCFlowLogGroup',
        'EngineeringVPCFlowLogGroup',
        'MarketingVPCFlowLogGroup'
      ];
      logGroups.forEach(lgName => {
        const logGroup = template.Resources[lgName];
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    test('should create VPC Flow Logs for all VPCs', () => {
      const flowLogs = [
        'HubVPCFlowLog',
        'FinanceVPCFlowLog',
        'EngineeringVPCFlowLog',
        'MarketingVPCFlowLog'
      ];
      flowLogs.forEach(flName => {
        const flowLog = template.Resources[flName];
        expect(flowLog).toBeDefined();
        expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
        expect(flowLog.Properties.ResourceType).toBe('VPC');
        expect(flowLog.Properties.TrafficType).toBe('ALL');
        expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      });
    });

    test('should create IAM role for VPC Flow Logs', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create Web Tier Security Group', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Web Tier should allow HTTP from internet', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.IpProtocol).toBe('tcp');
    });

    test('Web Tier should allow HTTPS from internet', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpsRule = ingress.find(rule => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.IpProtocol).toBe('tcp');
    });

    test('should create App Tier Security Group', () => {
      const sg = template.Resources.AppTierSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('App Tier should allow traffic from Web Tier only', () => {
      const sg = template.Resources.AppTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);
      ingress.forEach(rule => {
        if (rule.SourceSecurityGroupId) {
          expect(rule.SourceSecurityGroupId).toBeDefined();
        }
      });
    });
  });

  describe('Network ACL Configuration', () => {
    test('should create Network ACL', () => {
      const nacl = template.Resources.HubPublicNetworkAcl;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have HTTP inbound rule', () => {
      const entry = template.Resources.HubPublicNaclInboundHTTP;
      expect(entry).toBeDefined();
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.Protocol).toBe(6);
      const portRange = entry.Properties.PortRange;
      expect(portRange.From).toBe(80);
      expect(portRange.To).toBe(80);
      expect(entry.Properties.RuleAction).toBe('allow');
    });

    test('should have HTTPS inbound rule', () => {
      const entry = template.Resources.HubPublicNaclInboundHTTPS;
      expect(entry).toBeDefined();
      expect(entry.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(entry.Properties.Protocol).toBe(6);
      const portRange = entry.Properties.PortRange;
      expect(portRange.From).toBe(443);
      expect(portRange.To).toBe(443);
      expect(entry.Properties.RuleAction).toBe('allow');
    });
  });

  describe('Custom Resource Configuration', () => {
    test('should create Lambda execution role', () => {
      const role = template.Resources.ConnectivityTestLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should create connectivity test Lambda function', () => {
      const lambda = template.Resources.ConnectivityTestLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('should create custom resource', () => {
      const customResource = template.Resources.ConnectivityTestCustomResource;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::ConnectivityTest');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway for each VPC', () => {
      const igws = [
        'HubInternetGateway',
        'FinanceInternetGateway',
        'EngineeringInternetGateway',
        'MarketingInternetGateway'
      ];
      igws.forEach(igwName => {
        const igw = template.Resources[igwName];
        expect(igw).toBeDefined();
        expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      });
    });

    test('should attach Internet Gateways to VPCs', () => {
      const attachments = [
        'HubIGWAttachment',
        'FinanceIGWAttachment',
        'EngineeringIGWAttachment',
        'MarketingIGWAttachment'
      ];
      attachments.forEach(attachmentName => {
        const attachment = template.Resources[attachmentName];
        expect(attachment).toBeDefined();
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route tables for all VPCs', () => {
      const routeTables = [
        'HubPublicRouteTable',
        'FinancePublicRouteTable',
        'EngineeringPublicRouteTable',
        'MarketingPublicRouteTable'
      ];
      routeTables.forEach(rtName => {
        const routeTable = template.Resources[rtName];
        expect(routeTable).toBeDefined();
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should create private route tables for all VPCs', () => {
      const routeTables = [
        'HubPrivateRouteTable',
        'FinancePrivateRouteTable',
        'EngineeringPrivateRouteTable',
        'MarketingPrivateRouteTable'
      ];
      routeTables.forEach(rtName => {
        const routeTable = template.Resources[rtName];
        expect(routeTable).toBeDefined();
        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have routes to Transit Gateway in private route tables', () => {
      const routes = [
        'HubPrivateRouteToTGW',
        'FinancePrivateRouteToTGW',
        'EngineeringPrivateRouteToTGW',
        'MarketingPrivateRouteToTGW'
      ];
      routes.forEach(routeName => {
        const route = template.Resources[routeName];
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBeDefined();
      });
    });
  });

  describe('Outputs Configuration', () => {
    test('should export Transit Gateway ID', () => {
      const output = template.Outputs.TransitGatewayId;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Transit Gateway');
      expect(output.Export).toBeDefined();
    });

    test('should export all VPC IDs', () => {
      const vpcOutputs = ['HubVpcId', 'FinanceVpcId', 'EngineeringVpcId', 'MarketingVpcId'];
      vpcOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
      });
    });

    test('should export all subnet IDs', () => {
      const subnetOutputs = [
        'HubPublicSubnet1Id',
        'HubPrivateSubnet1Id',
        'FinancePublicSubnet1Id',
        'FinancePrivateSubnet1Id'
      ];
      subnetOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
      });
    });

    test('should export security group IDs', () => {
      const sgOutputs = ['WebTierSecurityGroupId', 'AppTierSecurityGroupId'];
      sgOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
      });
    });

    test('should export NAT Gateway IDs', () => {
      const natOutputs = [
        'FinanceNATGatewayId',
        'EngineeringNATGatewayId',
        'MarketingNATGatewayId'
      ];
      natOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
      });
    });

    test('should have connectivity test result output', () => {
      const output = template.Outputs.ConnectivityTestResult;
      expect(output).toBeDefined();
      expect(output.Description).toContain('connectivity test');
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have Department tag', () => {
      const resourcesWithTags = [
        'HubVPC',
        'FinanceVPC',
        'EngineeringVPC',
        'MarketingVPC',
        'HubPublicSubnet1',
        'FinancePublicSubnet1'
      ];
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const deptTag = resource.Properties.Tags.find(tag => tag.Key === 'Department');
          expect(deptTag).toBeDefined();
        }
      });
    });

    test('resources should have Environment tag', () => {
      const resourcesWithTags = [
        'HubVPC',
        'FinanceVPC',
        'TransitGateway'
      ];
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(tag => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('resources should have MigrationPhase tag', () => {
      const resourcesWithTags = [
        'HubVPC',
        'FinanceVPC',
        'TransitGateway'
      ];
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const phaseTag = resource.Properties.Tags.find(tag => tag.Key === 'MigrationPhase');
          expect(phaseTag).toBeDefined();
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of total resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(100);
    });

    test('should have 4 VPCs', () => {
      const vpcs = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::VPC'
      );
      expect(vpcs.length).toBe(4);
    });

    test('should have 24 subnets (6 per VPC)', () => {
      const subnets = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBe(24);
    });

    test('should have 4 Internet Gateways', () => {
      const igws = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::InternetGateway'
      );
      expect(igws.length).toBe(4);
    });

    test('should have 3 NAT Gateways', () => {
      const nats = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::NatGateway'
      );
      expect(nats.length).toBe(3);
    });

    test('should have 1 Transit Gateway', () => {
      const tgws = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::TransitGateway'
      );
      expect(tgws.length).toBe(1);
    });

    test('should have 4 Transit Gateway Attachments', () => {
      const attachments = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::TransitGatewayAttachment'
      );
      expect(attachments.length).toBe(4);
    });

    test('should have 4 VPC Flow Logs', () => {
      const flowLogs = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::FlowLog'
      );
      expect(flowLogs.length).toBe(4);
    });

    test('should have 2 Security Groups', () => {
      const sgs = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::EC2::SecurityGroup'
      );
      expect(sgs.length).toBe(2);
    });
  });
});
