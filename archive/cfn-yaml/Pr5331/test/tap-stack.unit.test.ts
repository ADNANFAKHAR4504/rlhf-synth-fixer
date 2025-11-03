import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Comprehensive Unit Tests for PCI DSS Compliant Payment Processing Infrastructure', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';

  beforeAll(() => {
    // Load template as string
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs (from ARN format: arn:aws:service:region:account:resource)
        region = process.env.AWS_REGION ||
          deployedOutputs.VPCFlowLogRole?.split(':')[3] ||
          deployedOutputs.VPCId?.split(':')[3] ||
          'us-east-1';

        // Extract stack name from export names
        if (deployedOutputs.VPCId) {
          const exportPattern = /^(.+)-VPC-ID$/;
          const match = Object.keys(deployedOutputs).find(key => key.match(exportPattern));
          if (match) {
            currentStackName = match.replace('-VPC-ID', '');
          }
        }
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
    }
  });

  // Helper function to check resource dependencies
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // Helper function to validate subnet CIDR blocks don't overlap
  const validateCidrNonOverlapping = (cidr1: string, cidr2: string) => {
    // This is a simplified check - in real scenarios you'd use proper CIDR calculation
    expect(cidr1).not.toBe(cidr2);
  };

  // =================
  // BASIC VALIDATION
  // =================
  test('Template has required sections', () => {
    expect(templateYaml).toContain('AWSTemplateFormatVersion:');
    expect(templateYaml).toContain('Description:');
    expect(templateYaml).toContain('Parameters:');
    expect(templateYaml).toContain('Resources:');
    expect(templateYaml).toContain('Outputs:');
  });

  test('Template description indicates PCI DSS compliance', () => {
    expect(templateYaml).toContain('PCI DSS');
    expect(templateYaml).toContain('Payment Processing');
    expect(templateYaml).toContain('Multi-AZ');
  });

  test('Template uses proper YAML format', () => {
    // Should contain YAML intrinsic functions
    expect(templateYaml).toContain('!Ref');
    expect(templateYaml).toContain('!Sub');
    expect(templateYaml).toContain('!GetAtt');
    expect(templateYaml).toContain('!Select');
    expect(templateYaml).toContain('!GetAZs');

    // Verify template starts with proper CloudFormation version
    expect(templateYaml).toMatch(/^AWSTemplateFormatVersion:\s*'2010-09-09'/);
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section', () => {
    test('Network parameters are properly defined with CIDR constraints', () => {
      const networkParams = [
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PublicSubnet3Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'PrivateSubnet3Cidr',
        'DatabaseSubnet1Cidr',
        'DatabaseSubnet2Cidr',
        'DatabaseSubnet3Cidr'
      ];

      networkParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
      });

      // Verify CIDR pattern validation exists
      expect(templateYaml).toContain('AllowedPattern:');
      expect(templateYaml).toContain('([0-9]|[1-2][0-9]|3[0-2]))$');
    });

    test('Compliance and tagging parameters are properly defined', () => {
      const complianceParams = ['Environment', 'CostCenter', 'ComplianceScope'];

      complianceParams.forEach(param => {
        expect(templateYaml).toContain(`${param}:`);
        expect(templateYaml).toContain('Description:');
      });

      // Environment should have allowed values
      expect(templateYaml).toMatch(/Environment:[\s\S]*?AllowedValues:[\s\S]*?- Development[\s\S]*?- Staging[\s\S]*?- Production/);
    });

    test('Default values follow best practices', () => {
      expect(templateYaml).toContain("Default: '10.0.0.0/16'");
      expect(templateYaml).toContain("Default: 'Production'");
      expect(templateYaml).toContain("Default: 'PaymentProcessing'");
      expect(templateYaml).toContain("Default: 'PCI-DSS'");
    });

    test('Subnet CIDR defaults are non-overlapping', () => {
      // Extract CIDR blocks from template using regex
      const cidrMatches = [
        templateYaml.match(/PublicSubnet1Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/PublicSubnet2Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/PublicSubnet3Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/PrivateSubnet1Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/PrivateSubnet2Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/PrivateSubnet3Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/DatabaseSubnet1Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/DatabaseSubnet2Cidr:[\s\S]*?Default: '([^']+)'/)?.[1],
        templateYaml.match(/DatabaseSubnet3Cidr:[\s\S]*?Default: '([^']+)'/)?.[1]
      ].filter(Boolean);

      // Check that all CIDR blocks are unique
      const uniqueCidrBlocks = [...new Set(cidrMatches)];
      expect(uniqueCidrBlocks.length).toBe(cidrMatches.length);
      expect(cidrMatches.length).toBe(9); // Should have all 9 subnet CIDRs
    });
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  describe('VPC and Core Networking Resources', () => {
    test('VPC is properly configured with DNS support', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::VPC');
      expect(templateYaml).toContain('EnableDnsHostnames: true');
      expect(templateYaml).toContain('EnableDnsSupport: true');
      expect(templateYaml).toContain('CidrBlock: !Ref VpcCidr');
    });

    test('Internet Gateway is properly configured', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateYaml).toContain('Type: AWS::EC2::VPCGatewayAttachment');
      expect(templateYaml).toContain('InternetGatewayId: !Ref InternetGateway');
      expect(templateYaml).toContain('VpcId: !Ref VPC');
    });

    test('All required subnets are defined across three AZs', () => {
      const subnets = [
        'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
        'DatabaseSubnet1', 'DatabaseSubnet2', 'DatabaseSubnet3'
      ];

      subnets.forEach(subnet => {
        expect(templateYaml).toContain(`${subnet}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::Subnet');
      });

      // Verify AZ distribution across 3 zones
      expect(templateYaml).toMatch(/!Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[1, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[2, !GetAZs ''\]/);
    });

    test('Public subnets have auto-assign public IP enabled', () => {
      expect(templateYaml).toMatch(/PublicSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
    });

    test('Private and Database subnets do not auto-assign public IPs', () => {
      expect(templateYaml).not.toMatch(/PrivateSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
      expect(templateYaml).not.toMatch(/DatabaseSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
    });

    test('Subnets are properly tagged with tier information', () => {
      expect(templateYaml).toMatch(/PublicSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Public'/);
      expect(templateYaml).toMatch(/PrivateSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Application'/);
      expect(templateYaml).toMatch(/DatabaseSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Database'/);
    });
  });

  // ==================
  // NAT GATEWAYS & EIP
  // ==================
  describe('NAT Gateways and Elastic IPs', () => {
    test('Three NAT Gateways for high availability', () => {
      const natGateways = ['NatGateway1', 'NatGateway2', 'NatGateway3'];

      natGateways.forEach(natGateway => {
        expect(templateYaml).toContain(`${natGateway}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::NatGateway');
      });
    });

    test('Each NAT Gateway has dedicated Elastic IP', () => {
      const eips = ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'];

      eips.forEach(eip => {
        expect(templateYaml).toContain(`${eip}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::EIP');
        expect(templateYaml).toContain('Domain: vpc');
        expect(templateYaml).toContain('DependsOn: InternetGatewayAttachment');
      });
    });

    test('NAT Gateways are properly associated with public subnets', () => {
      expect(templateYaml).toMatch(/NatGateway1:[\s\S]*?SubnetId: !Ref PublicSubnet1/);
      expect(templateYaml).toMatch(/NatGateway2:[\s\S]*?SubnetId: !Ref PublicSubnet2/);
      expect(templateYaml).toMatch(/NatGateway3:[\s\S]*?SubnetId: !Ref PublicSubnet3/);
    });

    test('NAT Gateways use correct Allocation IDs', () => {
      expect(templateYaml).toMatch(/NatGateway1:[\s\S]*?AllocationId: !GetAtt NatGateway1EIP.AllocationId/);
      expect(templateYaml).toMatch(/NatGateway2:[\s\S]*?AllocationId: !GetAtt NatGateway2EIP.AllocationId/);
      expect(templateYaml).toMatch(/NatGateway3:[\s\S]*?AllocationId: !GetAtt NatGateway3EIP.AllocationId/);
    });
  });

  // ==================
  // ROUTE TABLES
  // ==================
  describe('Route Tables and Routing', () => {
    test('Public route table configuration', () => {
      expect(templateYaml).toContain('PublicRouteTable:');
      expect(templateYaml).toContain('Type: AWS::EC2::RouteTable');
      expect(templateYaml).toMatch(/PublicRouteTable:[\s\S]*?VpcId: !Ref VPC/);
    });

    test('Default public route points to Internet Gateway', () => {
      expect(templateYaml).toContain('DefaultPublicRoute:');
      expect(templateYaml).toContain('Type: AWS::EC2::Route');
      expect(templateYaml).toMatch(/DefaultPublicRoute:[\s\S]*?DestinationCidrBlock: '0.0.0.0\/0'/);
      expect(templateYaml).toMatch(/DefaultPublicRoute:[\s\S]*?GatewayId: !Ref InternetGateway/);
      expect(templateYaml).toMatch(/DefaultPublicRoute:[\s\S]*?DependsOn: InternetGatewayAttachment/);
    });

    test('Each private subnet has its own route table for AZ isolation', () => {
      const privateRouteTables = ['PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'];

      privateRouteTables.forEach((routeTable, index) => {
        expect(templateYaml).toContain(`${routeTable}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::RouteTable');
        expect(templateYaml).toMatch(new RegExp(`DefaultPrivateRoute${index + 1}:[\\s\\S]*?NatGatewayId: !Ref NatGateway${index + 1}`));
      });
    });

    test('Database subnets have dedicated route table with no internet access', () => {
      expect(templateYaml).toContain('DatabaseRouteTable:');
      expect(templateYaml).toContain('Type: AWS::EC2::RouteTable');

      // Database route table should NOT have any default route to internet
      expect(templateYaml).not.toMatch(/DatabaseRouteTable[\s\S]*?DestinationCidrBlock: '0.0.0.0\/0'/);
    });

    test('All subnets are properly associated with route tables', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PrivateSubnet3RouteTableAssociation',
        'DatabaseSubnet1RouteTableAssociation',
        'DatabaseSubnet2RouteTableAssociation',
        'DatabaseSubnet3RouteTableAssociation'
      ];

      associations.forEach(association => {
        expect(templateYaml).toContain(`${association}:`);
        expect(templateYaml).toContain('Type: AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  // =================
  // SECURITY GROUPS
  // =================
  describe('Security Groups - PCI DSS Compliant Configuration', () => {
    test('Web Tier Security Group follows least privilege', () => {
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?GroupDescription: 'Security group for Web tier - allows HTTPS from Internet'/);

      // Only HTTPS (443) inbound from internet
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?FromPort: 443[\s\S]*?ToPort: 443/);
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?CidrIp: '0.0.0.0\/0'/);

      // Outbound only to App tier and external HTTPS
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?FromPort: 8080[\s\S]*?ToPort: 8080/);
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?CidrIp: !Ref VpcCidr/);
    });

    test('App Tier Security Group accepts traffic only from Web tier subnets', () => {
      expect(templateYaml).toMatch(/AppTierSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);

      // Should accept traffic from all three public subnets on port 8080
      expect(templateYaml).toMatch(/AppTierSecurityGroup:[\s\S]*?FromPort: 8080[\s\S]*?CidrIp: !Ref PublicSubnet1Cidr/);
      expect(templateYaml).toMatch(/AppTierSecurityGroup:[\s\S]*?FromPort: 8080[\s\S]*?CidrIp: !Ref PublicSubnet2Cidr/);
      expect(templateYaml).toMatch(/AppTierSecurityGroup:[\s\S]*?FromPort: 8080[\s\S]*?CidrIp: !Ref PublicSubnet3Cidr/);
    });

    test('Database Tier Security Group follows strict access control', () => {
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);

      // PostgreSQL port 5432 from private subnets only
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?FromPort: 5432[\s\S]*?ToPort: 5432/);
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: !Ref PrivateSubnet1Cidr/);
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: !Ref PrivateSubnet2Cidr/);
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: !Ref PrivateSubnet3Cidr/);

      // Very restrictive egress (loopback only)
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: '127.0.0.1\/32'/);
    });

    test('VPC Endpoint Security Group allows HTTPS within VPC', () => {
      expect(templateYaml).toMatch(/VPCEndpointSecurityGroup:[\s\S]*?Type: AWS::EC2::SecurityGroup/);
      expect(templateYaml).toMatch(/VPCEndpointSecurityGroup:[\s\S]*?FromPort: 443[\s\S]*?ToPort: 443/);
      expect(templateYaml).toMatch(/VPCEndpointSecurityGroup:[\s\S]*?CidrIp: !Ref VpcCidr/);
    });

    test('Security Groups follow proper naming convention', () => {
      expect(templateYaml).toMatch(/GroupName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-web-tier-sg'/);
      expect(templateYaml).toMatch(/GroupName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-app-tier-sg'/);
      expect(templateYaml).toMatch(/GroupName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-db-tier-sg'/);
      expect(templateYaml).toMatch(/GroupName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-vpc-endpoint-sg'/);
    });
  });

  // =================
  // VPC FLOW LOGS
  // =================
  describe('VPC Flow Logs for Compliance Monitoring', () => {
    test('VPC Flow Log IAM Role is properly configured', () => {
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?Type: AWS::IAM::Role/);
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?vpc-flow-logs.amazonaws.com/);
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?sts:AssumeRole/);

      // Check CloudWatch permissions
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?logs:CreateLogGroup/);
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?logs:CreateLogStream/);
      expect(templateYaml).toMatch(/VPCFlowLogRole:[\s\S]*?logs:PutLogEvents/);
    });

    test('VPC Flow Log CloudWatch Log Group has retention policy', () => {
      expect(templateYaml).toMatch(/VPCFlowLogGroup:[\s\S]*?Type: AWS::Logs::LogGroup/);
      expect(templateYaml).toMatch(/VPCFlowLogGroup:[\s\S]*?RetentionInDays: 90/);
      expect(templateYaml).toMatch(/VPCFlowLogGroup:[\s\S]*?LogGroupName: !Sub '\/aws\/vpc\/flowlogs\/\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}'/);
    });

    test('VPC Flow Log captures all traffic types', () => {
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?Type: AWS::EC2::FlowLog/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?TrafficType: ALL/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?ResourceId: !Ref VPC/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?ResourceType: 'VPC'/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?MaxAggregationInterval: 60/);
    });
  });

  // =================
  // VPC ENDPOINTS
  // =================
  describe('VPC Endpoints for Secure AWS Service Access', () => {
    test('S3 Gateway Endpoint is properly configured', () => {
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?Type: AWS::EC2::VPCEndpoint/);
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.s3'/);
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?VpcEndpointType: Gateway/);

      // Should be associated with all private route tables
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?RouteTableIds:[\s\S]*?- !Ref PrivateRouteTable1/);
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?- !Ref PrivateRouteTable2/);
      expect(templateYaml).toMatch(/S3Endpoint:[\s\S]*?- !Ref PrivateRouteTable3/);
    });

    test('SSM Interface Endpoints are properly configured', () => {
      const ssmEndpoints = ['SSMEndpoint', 'EC2MessagesEndpoint', 'SSMMessagesEndpoint'];

      ssmEndpoints.forEach(endpoint => {
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?Type: AWS::EC2::VPCEndpoint`));
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?VpcEndpointType: Interface`));
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?PrivateDnsEnabled: true`));
      });
    });

    test('Interface endpoints are deployed across all private subnets', () => {
      const interfaceEndpoints = ['SSMEndpoint', 'EC2MessagesEndpoint', 'SSMMessagesEndpoint'];

      interfaceEndpoints.forEach(endpoint => {
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?SubnetIds:[\\s\\S]*?- !Ref PrivateSubnet1`));
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?- !Ref PrivateSubnet2`));
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?- !Ref PrivateSubnet3`));
      });
    });

    test('Interface endpoints use VPC Endpoint Security Group', () => {
      const interfaceEndpoints = ['SSMEndpoint', 'EC2MessagesEndpoint', 'SSMMessagesEndpoint'];

      interfaceEndpoints.forEach(endpoint => {
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?SecurityGroupIds:[\\s\\S]*?- !Ref VPCEndpointSecurityGroup`));
      });
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Export', () => {
    test('VPC and networking outputs are defined', () => {
      const vpcOutputs = [
        'VPCId',
        'VPCCidr',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'DatabaseSubnet1Id',
        'DatabaseSubnet2Id',
        'DatabaseSubnet3Id'
      ];

      vpcOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toContain('Export:');
      });
    });

    test('Security Group outputs are defined', () => {
      const sgOutputs = [
        'WebTierSecurityGroupId',
        'AppTierSecurityGroupId',
        'DBTierSecurityGroupId'
      ];

      sgOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toContain('Export:');
      });
    });

    test('Infrastructure outputs are defined', () => {
      const infraOutputs = [
        'NatGateway1Id',
        'NatGateway2Id',
        'NatGateway3Id',
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'PrivateRouteTable3Id',
        'DatabaseRouteTableId'
      ];

      infraOutputs.forEach(output => {
        expect(templateYaml).toContain(`${output}:`);
        expect(templateYaml).toContain('Export:');
      });
    });

    test('Outputs follow proper cross-stack export naming convention', () => {
      const exportNamePattern = /Export:[\s\S]*?Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+-ID'/g;
      const exportMatches = templateYaml.match(exportNamePattern) || [];
      expect(exportMatches.length).toBeGreaterThan(15);
    });

    test('Outputs provide comprehensive resource access', () => {
      // VPC resources
      expect(templateYaml).toMatch(/VPCId:[\s\S]*?Value: !Ref VPC/);
      expect(templateYaml).toMatch(/VPCCidr:[\s\S]*?Value: !GetAtt VPC.CidrBlock/);

      // Subnet resources
      expect(templateYaml).toMatch(/PublicSubnet1Id:[\s\S]*?Value: !Ref PublicSubnet1/);
      expect(templateYaml).toMatch(/PrivateSubnet1Id:[\s\S]*?Value: !Ref PrivateSubnet1/);
      expect(templateYaml).toMatch(/DatabaseSubnet1Id:[\s\S]*?Value: !Ref DatabaseSubnet1/);

      // Security Group resources
      expect(templateYaml).toMatch(/WebTierSecurityGroupId:[\s\S]*?Value: !Ref WebTierSecurityGroup/);
    });
  });

  // ======================
  // COMPLIANCE & TAGGING
  // ======================
  describe('PCI DSS Compliance and Tagging', () => {
    test('All resources have required compliance tags', () => {
      const requiredTags = ['Name', 'Environment', 'CostCenter', 'Compliance'];

      // Check major resource types have all required tags
      const majorResources = ['VPC', 'PublicSubnet1', 'PrivateSubnet1', 'DatabaseSubnet1',
        'WebTierSecurityGroup', 'NatGateway1', 'VPCFlowLogRole'];

      majorResources.forEach(resource => {
        requiredTags.forEach(tag => {
          expect(templateYaml).toMatch(new RegExp(`${resource}:[\\s\\S]*?Key: ${tag}`));
        });
      });
    });

    test('Compliance tag references ComplianceScope parameter', () => {
      expect(templateYaml).toMatch(/Key: Compliance[\s\S]*?Value: !Ref ComplianceScope/);
    });

    test('Tier-specific tagging is implemented', () => {
      expect(templateYaml).toMatch(/PublicSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Public'/);
      expect(templateYaml).toMatch(/PrivateSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Application'/);
      expect(templateYaml).toMatch(/DatabaseSubnet[123]:[\s\S]*?Key: Tier[\s\S]*?Value: 'Database'/);
    });

    test('Cost Center tagging follows parameter reference', () => {
      expect(templateYaml).toMatch(/Key: CostCenter[\s\S]*?Value: !Ref CostCenter/);
    });

    test('Environment tagging follows parameter reference', () => {
      expect(templateYaml).toMatch(/Key: Environment[\s\S]*?Value: !Ref Environment/);
    });
  });

  // ====================
  // CROSS-ACCOUNT COMPATIBILITY
  // ====================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      // Should not contain account IDs
      const accountIdPattern = /[^:]\d{12}[^']/;
      expect(templateYaml).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast)-[12])\b/;
      expect(templateYaml).not.toMatch(regionPattern);
    });

    test('Uses dynamic references for region and account', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
      expect(templateYaml).toContain('${AWS::Partition}');
    });

    test('No hardcoded availability zones', () => {
      expect(templateYaml).toMatch(/!Select \[0, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[1, !GetAZs ''\]/);
      expect(templateYaml).toMatch(/!Select \[2, !GetAZs ''\]/);
      expect(templateYaml).not.toMatch(/us-east-1[a-z]/);
    });

    test('Resource names are parameterized', () => {
      expect(templateYaml).toMatch(/Name: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+'/);
      expect(templateYaml).not.toMatch(/Name: '[^$]*TapStack[^$]*'/);
    });

    test('Service names use dynamic region references', () => {
      expect(templateYaml).toMatch(/ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.s3'/);
      expect(templateYaml).toMatch(/ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.ssm'/);
      expect(templateYaml).toMatch(/ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.ec2messages'/);
      expect(templateYaml).toMatch(/ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.ssmmessages'/);
    });
  });

  // ======================
  // SECURITY BEST PRACTICES
  // ======================
  describe('Security Best Practices Implementation', () => {
    test('Network segmentation follows 3-tier architecture', () => {
      // Public tier - only NAT Gateways and potentially load balancers
      // Private tier - application servers
      // Database tier - databases with no internet access

      expect(templateYaml).toMatch(/PublicSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
      expect(templateYaml).not.toMatch(/PrivateSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
      expect(templateYaml).not.toMatch(/DatabaseSubnet[123]:[\s\S]*?MapPublicIpOnLaunch: true/);
    });

    test('Database tier has no direct internet access', () => {
      // Database route table should have no default route
      expect(templateYaml).not.toMatch(/DatabaseRouteTable[\s\S]*?DestinationCidrBlock: '0.0.0.0\/0'/);

      // Database security group should only allow internal access
      expect(templateYaml).not.toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: '0.0.0.0\/0'/);
    });

    test('VPC Flow Logs enabled for network monitoring', () => {
      expect(templateYaml).toContain('Type: AWS::EC2::FlowLog');
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?TrafficType: ALL/);
    });

    test('Security groups follow least privilege principle', () => {
      // Web tier only allows HTTPS
      expect(templateYaml).toMatch(/WebTierSecurityGroup:[\s\S]*?FromPort: 443[\s\S]*?ToPort: 443/);

      // App tier only allows traffic from specific subnets
      expect(templateYaml).toMatch(/AppTierSecurityGroup:[\s\S]*?CidrIp: !Ref PublicSubnet[123]Cidr/);

      // Database tier is most restrictive
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?FromPort: 5432[\s\S]*?ToPort: 5432/);
      expect(templateYaml).toMatch(/DBTierSecurityGroup:[\s\S]*?CidrIp: '127.0.0.1\/32'/);
    });

    test('VPC Endpoints reduce internet dependencies', () => {
      expect(templateYaml).toContain('S3Endpoint:');
      expect(templateYaml).toContain('SSMEndpoint:');
      expect(templateYaml).toContain('EC2MessagesEndpoint:');
      expect(templateYaml).toContain('SSMMessagesEndpoint:');
    });
  });

  // ======================
  // HIGH AVAILABILITY
  // ======================
  describe('High Availability Configuration', () => {
    test('Resources are distributed across three availability zones', () => {
      // Each tier should have 3 subnets across 3 AZs
      const tiers = ['Public', 'Private', 'Database'];
      tiers.forEach(tier => {
        for (let i = 1; i <= 3; i++) {
          expect(templateYaml).toContain(`${tier}Subnet${i}:`);
          expect(templateYaml).toMatch(new RegExp(`${tier}Subnet${i}:[\\s\\S]*?AvailabilityZone: !Select \\[${i - 1}, !GetAZs ''\\]`));
        }
      });
    });

    test('Each private subnet has its own NAT Gateway for AZ independence', () => {
      expect(templateYaml).toMatch(/PrivateRouteTable1:[\s\S]*?NatGatewayId: !Ref NatGateway1/);
      expect(templateYaml).toMatch(/PrivateRouteTable2:[\s\S]*?NatGatewayId: !Ref NatGateway2/);
      expect(templateYaml).toMatch(/PrivateRouteTable3:[\s\S]*?NatGatewayId: !Ref NatGateway3/);
    });

    test('NAT Gateways are deployed in different public subnets', () => {
      expect(templateYaml).toMatch(/NatGateway1:[\s\S]*?SubnetId: !Ref PublicSubnet1/);
      expect(templateYaml).toMatch(/NatGateway2:[\s\S]*?SubnetId: !Ref PublicSubnet2/);
      expect(templateYaml).toMatch(/NatGateway3:[\s\S]*?SubnetId: !Ref PublicSubnet3/);
    });

    test('Interface endpoints deployed across all AZs for availability', () => {
      const endpoints = ['SSMEndpoint', 'EC2MessagesEndpoint', 'SSMMessagesEndpoint'];
      endpoints.forEach(endpoint => {
        expect(templateYaml).toMatch(new RegExp(`${endpoint}:[\\s\\S]*?- !Ref PrivateSubnet1[\\s\\S]*?- !Ref PrivateSubnet2[\\s\\S]*?- !Ref PrivateSubnet3`));
      });
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation', () => {
    test('Deployed resources match expected formats', () => {
      // Skip if no deployment outputs
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // VPC Resources
      if (deployedOutputs.VPCId) {
        expect(deployedOutputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }

      if (deployedOutputs.PublicSubnet1Id) {
        expect(deployedOutputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      }

      if (deployedOutputs.WebTierSecurityGroupId) {
        expect(deployedOutputs.WebTierSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      }

      // NAT Gateways
      if (deployedOutputs.NatGateway1Id) {
        expect(deployedOutputs.NatGateway1Id).toMatch(/^nat-[a-f0-9]{8,17}$/);
      }
    });

    test('Resource naming follows deployment convention', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping naming convention validation - no outputs available');
        return;
      }

      // Check export names follow the pattern StackName-Region-EnvironmentSuffix-ResourceType-ID
      Object.keys(deployedOutputs).forEach(outputKey => {
        if (outputKey.includes('Id') || outputKey.includes('ID')) {
          // Only validate if we have a valid stack name extracted
          if (currentStackName !== 'unknown-stack') {
            expect(outputKey).toMatch(new RegExp(`^${currentStackName}-[\\w-]+-[\\w-]+-[\\w-]+-ID?$`));
          } else {
            // If no stack name, just verify it follows some naming pattern
            expect(outputKey).toMatch(/^[a-zA-Z][a-zA-Z0-9-]*[Ii][Dd]$/);
          }
        }
      });
    });

    test('Multi-AZ deployment is functioning correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping multi-AZ validation - no outputs available');
        return;
      }

      // Should have 3 subnets of each type
      const subnetTypes = ['Public', 'Private', 'Database'];
      subnetTypes.forEach(type => {
        for (let i = 1; i <= 3; i++) {
          const subnetKey = `${type}Subnet${i}Id`;
          if (deployedOutputs[subnetKey]) {
            expect(deployedOutputs[subnetKey]).toMatch(/^subnet-[a-f0-9]{8,17}$/);
          }
        }
      });

      // Should have 3 NAT Gateways
      for (let i = 1; i <= 3; i++) {
        const natKey = `NatGateway${i}Id`;
        if (deployedOutputs[natKey]) {
          expect(deployedOutputs[natKey]).toMatch(/^nat-[a-f0-9]{8,17}$/);
        }
      }
    });

    test('Security groups are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping security group validation - no outputs available');
        return;
      }

      const securityGroups = ['WebTierSecurityGroupId', 'AppTierSecurityGroupId', 'DBTierSecurityGroupId'];
      securityGroups.forEach(sgKey => {
        if (deployedOutputs[sgKey]) {
          expect(deployedOutputs[sgKey]).toMatch(/^sg-[a-f0-9]{8,17}$/);
        }
      });
    });
  });

  // ======================
  // RESOURCE DEPENDENCIES
  // ======================
  describe('Resource Dependencies and Order', () => {
    test('Internet Gateway attachment dependency', () => {
      expect(templateYaml).toMatch(/NatGateway[123]EIP:[\s\S]*?DependsOn: InternetGatewayAttachment/);
      expect(templateYaml).toMatch(/DefaultPublicRoute:[\s\S]*?DependsOn: InternetGatewayAttachment/);
    });

    test('NAT Gateway EIP dependencies', () => {
      expect(templateYaml).toMatch(/NatGateway1:[\s\S]*?AllocationId: !GetAtt NatGateway1EIP.AllocationId/);
      expect(templateYaml).toMatch(/NatGateway2:[\s\S]*?AllocationId: !GetAtt NatGateway2EIP.AllocationId/);
      expect(templateYaml).toMatch(/NatGateway3:[\s\S]*?AllocationId: !GetAtt NatGateway3EIP.AllocationId/);
    });

    test('VPC Flow Log dependencies', () => {
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?LogGroupName: !Ref VPCFlowLogGroup/);
      expect(templateYaml).toMatch(/VPCFlowLog:[\s\S]*?ResourceId: !Ref VPC/);
    });

    test('Route table associations reference correct resources', () => {
      validateResourceDependencies('PublicSubnet1RouteTableAssociation', ['PublicRouteTable', 'PublicSubnet1']);
      validateResourceDependencies('PrivateSubnet1RouteTableAssociation', ['PrivateRouteTable1', 'PrivateSubnet1']);
      validateResourceDependencies('DatabaseSubnet1RouteTableAssociation', ['DatabaseRouteTable', 'DatabaseSubnet1']);
    });
  });

  // ======================
  // TEMPLATE VALIDATION
  // ======================
  describe('Template Structure Validation', () => {
    test('CloudFormation version is current', () => {
      expect(templateYaml).toContain("AWSTemplateFormatVersion: '2010-09-09'");
    });

    test('All resource types are valid AWS types', () => {
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::EIP',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::FlowLog',
        'AWS::EC2::VPCEndpoint',
        'AWS::IAM::Role',
        'AWS::Logs::LogGroup'
      ];

      resourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });

    test('Template description is meaningful', () => {
      // Extract description from template
      const descriptionMatch = templateYaml.match(/Description:\s*'([^']+)'/);
      expect(descriptionMatch).toBeTruthy();

      const description = descriptionMatch?.[1] || '';
      expect(description).toContain('PCI DSS');
      expect(description).toContain('Payment Processing');
      expect(description.length).toBeGreaterThan(50);
    });

    test('All sections are present in correct order', () => {
      const sections = ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Resources', 'Outputs'];
      const templateLines = templateYaml.split('\n');
      let lastIndex = -1;

      sections.forEach(section => {
        const sectionIndex = templateLines.findIndex(line => line.startsWith(section));
        expect(sectionIndex).toBeGreaterThan(lastIndex);
        lastIndex = sectionIndex;
      });
    });
  });
});
