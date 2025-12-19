import fs from 'fs';
import path from 'path';

// Load region configuration from AWS_REGION file
const awsRegion = fs.readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8').trim();

describe('Secure VPC Foundation CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure VPC Foundation for Fintech Payment Processing Platform - PCI DSS Compliant - Deployed in Europe (Spain) region'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have region configuration in metadata', () => {
      expect(template.Metadata.Region).toBeDefined();
      expect(template.Metadata.Region.TargetRegion).toBe('eu-south-1');
      expect(template.Metadata.Region.RegionName).toBe('Europe (Milan)');
    });

    test('AWS_REGION file should contain eu-south-1', () => {
      expect(awsRegion).toBe('eu-south-1');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.EnvironmentName).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Unique suffix for resource naming to prevent conflicts');
      expect(param.AllowedPattern).toBe('[a-zA-Z0-9-]+');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^10\\.([0-9]|[1-9][0-9]|[1-2][0-5][0-5])\\.0\\.0/16$');
    });

    test('should have exactly four parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });
  });

  describe('Core Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnets', () => {
    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('public subnets should have correct type', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct type', () => {
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });
  });

  describe('NAT Gateways', () => {
    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have public route to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });
  });

  describe('Security Features', () => {
    test('should have VPC Flow Log', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Log should capture all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('should have S3 bucket for flow logs', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Network ACLs', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
    });
  });

  describe('VPC Endpoint', () => {
    test('should have S3 VPC Endpoint resource defined (conditionally created)', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Condition).toBe('ShouldCreateS3Endpoint');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toContain('VPC');
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have grouped subnet outputs', () => {
      expect(template.Outputs.PublicSubnets).toBeDefined();
      expect(template.Outputs.PrivateSubnets).toBeDefined();
    });

    test('should have exactly 16 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(16);
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(48);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const tags = vpc.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('Region');
      expect(tagKeys).toContain('TargetRegion');
    });

    test('VPC should have target region tag for Milan', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const targetRegionTag = tags.find((t: any) => t.Key === 'TargetRegion');
      expect(targetRegionTag).toBeDefined();
      expect(targetRegionTag.Value).toBe('eu-south-1');
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });
});
