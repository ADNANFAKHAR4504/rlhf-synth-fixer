import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'template.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('VPC');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('synth101912761pr');
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have DeletionPolicy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('VPC should have required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
    });
  });

  describe('IPv6 CIDR Block', () => {
    test('should have IPv6 CIDR block resource', () => {
      expect(template.Resources.IPv6CidrBlock).toBeDefined();
      expect(template.Resources.IPv6CidrBlock.Type).toBe('AWS::EC2::VPCCidrBlock');
    });

    test('IPv6 CIDR block should be auto-assigned', () => {
      expect(template.Resources.IPv6CidrBlock.Properties.AmazonProvidedIpv6CidrBlock).toBe(true);
    });

    test('IPv6 CIDR block should reference VPC', () => {
      expect(template.Resources.IPv6CidrBlock.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('IPv6 CIDR block should have DeletionPolicy', () => {
      expect(template.Resources.IPv6CidrBlock.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('Internet Gateway should have required tags', () => {
      const tags = template.Resources.InternetGateway.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
    });

    test('Internet Gateway should have DeletionPolicy', () => {
      expect(template.Resources.InternetGateway.DeletionPolicy).toBe('Delete');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('Gateway Attachment should reference VPC and IGW', () => {
      expect(template.Resources.AttachGateway.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.AttachGateway.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnets', () => {
    const azs = ['AZ1', 'AZ2', 'AZ3'];
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    azs.forEach((az, index) => {
      describe(`Public Subnet ${az}`, () => {
        test(`should have PublicSubnet${az} resource`, () => {
          expect(template.Resources[`PublicSubnet${az}`]).toBeDefined();
          expect(template.Resources[`PublicSubnet${az}`].Type).toBe('AWS::EC2::Subnet');
        });

        test(`PublicSubnet${az} should have correct CIDR block`, () => {
          expect(template.Resources[`PublicSubnet${az}`].Properties.CidrBlock).toBe(expectedCidrs[index]);
        });

        test(`PublicSubnet${az} should reference VPC`, () => {
          expect(template.Resources[`PublicSubnet${az}`].Properties.VpcId).toEqual({ Ref: 'VPC' });
        });

        test(`PublicSubnet${az} should be in correct AZ`, () => {
          const azSelection = template.Resources[`PublicSubnet${az}`].Properties.AvailabilityZone;
          expect(azSelection['Fn::Select'][0]).toBe(index);
        });

        test(`PublicSubnet${az} should have MapPublicIpOnLaunch enabled`, () => {
          expect(template.Resources[`PublicSubnet${az}`].Properties.MapPublicIpOnLaunch).toBe(true);
        });

        test(`PublicSubnet${az} should have IPv6 CIDR block`, () => {
          expect(template.Resources[`PublicSubnet${az}`].Properties.Ipv6CidrBlock).toBeDefined();
        });

        test(`PublicSubnet${az} should have AssignIpv6AddressOnCreation enabled`, () => {
          expect(template.Resources[`PublicSubnet${az}`].Properties.AssignIpv6AddressOnCreation).toBe(true);
        });

        test(`PublicSubnet${az} should depend on IPv6CidrBlock`, () => {
          expect(template.Resources[`PublicSubnet${az}`].DependsOn).toBe('IPv6CidrBlock');
        });

        test(`PublicSubnet${az} should have DeletionPolicy`, () => {
          expect(template.Resources[`PublicSubnet${az}`].DeletionPolicy).toBe('Delete');
        });

        test(`PublicSubnet${az} should have required tags`, () => {
          const tags = template.Resources[`PublicSubnet${az}`].Properties.Tags;
          expect(tags).toBeDefined();
          expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
        });
      });
    });

    test('should have exactly 3 public subnets', () => {
      const publicSubnets = Object.keys(template.Resources).filter(k => k.match(/^PublicSubnetAZ\d$/));
      expect(publicSubnets.length).toBe(3);
    });
  });

  describe('Private Subnets', () => {
    const azs = ['AZ1', 'AZ2', 'AZ3'];
    const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    azs.forEach((az, index) => {
      describe(`Private Subnet ${az}`, () => {
        test(`should have PrivateSubnet${az} resource`, () => {
          expect(template.Resources[`PrivateSubnet${az}`]).toBeDefined();
          expect(template.Resources[`PrivateSubnet${az}`].Type).toBe('AWS::EC2::Subnet');
        });

        test(`PrivateSubnet${az} should have correct CIDR block`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].Properties.CidrBlock).toBe(expectedCidrs[index]);
        });

        test(`PrivateSubnet${az} should reference VPC`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].Properties.VpcId).toEqual({ Ref: 'VPC' });
        });

        test(`PrivateSubnet${az} should be in correct AZ`, () => {
          const azSelection = template.Resources[`PrivateSubnet${az}`].Properties.AvailabilityZone;
          expect(azSelection['Fn::Select'][0]).toBe(index);
        });

        test(`PrivateSubnet${az} should NOT have MapPublicIpOnLaunch`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].Properties.MapPublicIpOnLaunch).toBeUndefined();
        });

        test(`PrivateSubnet${az} should have IPv6 CIDR block`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].Properties.Ipv6CidrBlock).toBeDefined();
        });

        test(`PrivateSubnet${az} should have AssignIpv6AddressOnCreation enabled`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].Properties.AssignIpv6AddressOnCreation).toBe(true);
        });

        test(`PrivateSubnet${az} should depend on IPv6CidrBlock`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].DependsOn).toBe('IPv6CidrBlock');
        });

        test(`PrivateSubnet${az} should have DeletionPolicy`, () => {
          expect(template.Resources[`PrivateSubnet${az}`].DeletionPolicy).toBe('Delete');
        });

        test(`PrivateSubnet${az} should have required tags`, () => {
          const tags = template.Resources[`PrivateSubnet${az}`].Properties.Tags;
          expect(tags).toBeDefined();
          expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
        });
      });
    });

    test('should have exactly 3 private subnets', () => {
      const privateSubnets = Object.keys(template.Resources).filter(k => k.match(/^PrivateSubnetAZ\d$/));
      expect(privateSubnets.length).toBe(3);
    });
  });

  describe('NAT Gateways', () => {
    const azs = ['AZ1', 'AZ2', 'AZ3'];

    azs.forEach((az) => {
      describe(`NAT Gateway ${az}`, () => {
        test(`should have EIPForNATGateway${az} resource`, () => {
          expect(template.Resources[`EIPForNATGateway${az}`]).toBeDefined();
          expect(template.Resources[`EIPForNATGateway${az}`].Type).toBe('AWS::EC2::EIP');
        });

        test(`EIP for ${az} should have correct domain`, () => {
          expect(template.Resources[`EIPForNATGateway${az}`].Properties.Domain).toBe('vpc');
        });

        test(`EIP for ${az} should depend on AttachGateway`, () => {
          expect(template.Resources[`EIPForNATGateway${az}`].DependsOn).toBe('AttachGateway');
        });

        test(`EIP for ${az} should have DeletionPolicy`, () => {
          expect(template.Resources[`EIPForNATGateway${az}`].DeletionPolicy).toBe('Delete');
        });

        test(`should have NATGateway${az} resource`, () => {
          expect(template.Resources[`NATGateway${az}`]).toBeDefined();
          expect(template.Resources[`NATGateway${az}`].Type).toBe('AWS::EC2::NatGateway');
        });

        test(`NATGateway${az} should reference correct EIP`, () => {
          expect(template.Resources[`NATGateway${az}`].Properties.AllocationId).toEqual({
            'Fn::GetAtt': [`EIPForNATGateway${az}`, 'AllocationId']
          });
        });

        test(`NATGateway${az} should be in correct public subnet`, () => {
          expect(template.Resources[`NATGateway${az}`].Properties.SubnetId).toEqual({
            Ref: `PublicSubnet${az}`
          });
        });

        test(`NATGateway${az} should have DeletionPolicy`, () => {
          expect(template.Resources[`NATGateway${az}`].DeletionPolicy).toBe('Delete');
        });

        test(`NATGateway${az} should have required tags`, () => {
          const tags = template.Resources[`NATGateway${az}`].Properties.Tags;
          expect(tags).toBeDefined();
          expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
        });
      });
    });

    test('should have exactly 3 NAT Gateways', () => {
      const natGateways = Object.keys(template.Resources).filter(k => k.startsWith('NATGateway'));
      expect(natGateways.length).toBe(3);
    });

    test('should have exactly 3 EIPs', () => {
      const eips = Object.keys(template.Resources).filter(k => k.startsWith('EIPForNATGateway'));
      expect(eips.length).toBe(3);
    });
  });

  describe('Public Route Table', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PublicRouteTable should reference VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PublicRouteTable should have DeletionPolicy', () => {
      expect(template.Resources.PublicRouteTable.DeletionPolicy).toBe('Delete');
    });

    test('PublicRouteTable should have required tags', () => {
      const tags = template.Resources.PublicRouteTable.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
    });

    test('should have PublicRoute (IPv4) to Internet Gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('PublicRoute should depend on AttachGateway', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have PublicRouteIPv6 to Internet Gateway', () => {
      expect(template.Resources.PublicRouteIPv6).toBeDefined();
      expect(template.Resources.PublicRouteIPv6.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicRouteIPv6.Properties.DestinationIpv6CidrBlock).toBe('::/0');
      expect(template.Resources.PublicRouteIPv6.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('PublicRouteIPv6 should depend on AttachGateway', () => {
      expect(template.Resources.PublicRouteIPv6.DependsOn).toBe('AttachGateway');
    });

    test('should have route table associations for all public subnets', () => {
      ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
        const association = template.Resources[`PublicSubnetRouteTableAssociation${az}`];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Properties.SubnetId).toEqual({ Ref: `PublicSubnet${az}` });
        expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });
    });
  });

  describe('Private Route Tables', () => {
    const azs = ['AZ1', 'AZ2', 'AZ3'];

    azs.forEach((az) => {
      describe(`Private Route Table ${az}`, () => {
        test(`should have PrivateRouteTable${az} resource`, () => {
          expect(template.Resources[`PrivateRouteTable${az}`]).toBeDefined();
          expect(template.Resources[`PrivateRouteTable${az}`].Type).toBe('AWS::EC2::RouteTable');
        });

        test(`PrivateRouteTable${az} should reference VPC`, () => {
          expect(template.Resources[`PrivateRouteTable${az}`].Properties.VpcId).toEqual({ Ref: 'VPC' });
        });

        test(`PrivateRouteTable${az} should have DeletionPolicy`, () => {
          expect(template.Resources[`PrivateRouteTable${az}`].DeletionPolicy).toBe('Delete');
        });

        test(`PrivateRouteTable${az} should have required tags`, () => {
          const tags = template.Resources[`PrivateRouteTable${az}`].Properties.Tags;
          expect(tags).toBeDefined();
          expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
        });

        test(`should have PrivateRoute${az} to NAT Gateway`, () => {
          expect(template.Resources[`PrivateRoute${az}`]).toBeDefined();
          expect(template.Resources[`PrivateRoute${az}`].Type).toBe('AWS::EC2::Route');
          expect(template.Resources[`PrivateRoute${az}`].Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
          expect(template.Resources[`PrivateRoute${az}`].Properties.NatGatewayId).toEqual({ Ref: `NATGateway${az}` });
        });

        test(`should have route table association for PrivateSubnet${az}`, () => {
          const association = template.Resources[`PrivateSubnetRouteTableAssociation${az}`];
          expect(association).toBeDefined();
          expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
          expect(association.Properties.SubnetId).toEqual({ Ref: `PrivateSubnet${az}` });
          expect(association.Properties.RouteTableId).toEqual({ Ref: `PrivateRouteTable${az}` });
        });
      });
    });

    test('should have exactly 3 private route tables', () => {
      const privateRouteTables = Object.keys(template.Resources).filter(k => k.match(/^PrivateRouteTableAZ\d$/));
      expect(privateRouteTables.length).toBe(3);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have FlowLogsRole resource', () => {
      expect(template.Resources.FlowLogsRole).toBeDefined();
      expect(template.Resources.FlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('FlowLogsRole should have correct trust policy', () => {
      const trustPolicy = template.Resources.FlowLogsRole.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('FlowLogsRole should have CloudWatch Logs policy', () => {
      const policies = template.Resources.FlowLogsRole.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].PolicyName).toBe('CloudWatchLogPolicy');
    });

    test('FlowLogsRole policy should have required permissions', () => {
      const policy = template.Resources.FlowLogsRole.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });

    test('FlowLogsRole should have DeletionPolicy', () => {
      expect(template.Resources.FlowLogsRole.DeletionPolicy).toBe('Delete');
    });

    test('should have FlowLogsLogGroup resource', () => {
      expect(template.Resources.FlowLogsLogGroup).toBeDefined();
      expect(template.Resources.FlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('FlowLogsLogGroup should have 7-day retention', () => {
      expect(template.Resources.FlowLogsLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('FlowLogsLogGroup should have DeletionPolicy', () => {
      expect(template.Resources.FlowLogsLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('should have VPCFlowLog resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLog should capture all traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPCFlowLog should reference VPC', () => {
      expect(template.Resources.VPCFlowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.VPCFlowLog.Properties.ResourceType).toBe('VPC');
    });

    test('VPCFlowLog should use CloudWatch Logs destination', () => {
      expect(template.Resources.VPCFlowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPCFlowLog should reference FlowLogsLogGroup', () => {
      expect(template.Resources.VPCFlowLog.Properties.LogGroupName).toEqual({ Ref: 'FlowLogsLogGroup' });
    });

    test('VPCFlowLog should reference FlowLogsRole', () => {
      expect(template.Resources.VPCFlowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['FlowLogsRole', 'Arn']
      });
    });

    test('VPCFlowLog should have DeletionPolicy', () => {
      expect(template.Resources.VPCFlowLog.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Network ACLs', () => {
    describe('Public Network ACL', () => {
      test('should have PublicNetworkAcl resource', () => {
        expect(template.Resources.PublicNetworkAcl).toBeDefined();
        expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
      });

      test('PublicNetworkAcl should reference VPC', () => {
        expect(template.Resources.PublicNetworkAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('PublicNetworkAcl should have DeletionPolicy', () => {
        expect(template.Resources.PublicNetworkAcl.DeletionPolicy).toBe('Delete');
      });

      test('should have ingress rule for HTTP (port 80)', () => {
        expect(template.Resources.PublicNetworkAclIngressHTTP).toBeDefined();
        const rule = template.Resources.PublicNetworkAclIngressHTTP;
        expect(rule.Properties.RuleNumber).toBe(100);
        expect(rule.Properties.Protocol).toBe(6); // TCP
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.PortRange.From).toBe(80);
        expect(rule.Properties.PortRange.To).toBe(80);
      });

      test('should have ingress rule for HTTPS (port 443)', () => {
        expect(template.Resources.PublicNetworkAclIngressHTTPS).toBeDefined();
        const rule = template.Resources.PublicNetworkAclIngressHTTPS;
        expect(rule.Properties.RuleNumber).toBe(110);
        expect(rule.Properties.Protocol).toBe(6); // TCP
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.PortRange.From).toBe(443);
        expect(rule.Properties.PortRange.To).toBe(443);
      });

      test('should have ingress rule for SSH (port 22)', () => {
        expect(template.Resources.PublicNetworkAclIngressSSH).toBeDefined();
        const rule = template.Resources.PublicNetworkAclIngressSSH;
        expect(rule.Properties.RuleNumber).toBe(120);
        expect(rule.Properties.Protocol).toBe(6); // TCP
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.PortRange.From).toBe(22);
        expect(rule.Properties.PortRange.To).toBe(22);
      });

      test('should have ingress rule for ephemeral ports', () => {
        expect(template.Resources.PublicNetworkAclIngressEphemeral).toBeDefined();
        const rule = template.Resources.PublicNetworkAclIngressEphemeral;
        expect(rule.Properties.RuleNumber).toBe(130);
        expect(rule.Properties.Protocol).toBe(6); // TCP
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.PortRange.From).toBe(1024);
        expect(rule.Properties.PortRange.To).toBe(65535);
      });

      test('should have egress rule allowing all traffic', () => {
        expect(template.Resources.PublicNetworkAclEgressAll).toBeDefined();
        const rule = template.Resources.PublicNetworkAclEgressAll;
        expect(rule.Properties.Egress).toBe(true);
        expect(rule.Properties.Protocol).toBe(-1); // All protocols
        expect(rule.Properties.RuleAction).toBe('allow');
      });

      test('should have NACL associations for all public subnets', () => {
        ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
          const association = template.Resources[`PublicSubnetNetworkAclAssociation${az}`];
          expect(association).toBeDefined();
          expect(association.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
          expect(association.Properties.SubnetId).toEqual({ Ref: `PublicSubnet${az}` });
          expect(association.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
        });
      });
    });

    describe('Private Network ACL', () => {
      test('should have PrivateNetworkAcl resource', () => {
        expect(template.Resources.PrivateNetworkAcl).toBeDefined();
        expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
      });

      test('PrivateNetworkAcl should reference VPC', () => {
        expect(template.Resources.PrivateNetworkAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('PrivateNetworkAcl should have DeletionPolicy', () => {
        expect(template.Resources.PrivateNetworkAcl.DeletionPolicy).toBe('Delete');
      });

      test('should have ingress rule for VPC traffic', () => {
        expect(template.Resources.PrivateNetworkAclIngressVPC).toBeDefined();
        const rule = template.Resources.PrivateNetworkAclIngressVPC;
        expect(rule.Properties.RuleNumber).toBe(100);
        expect(rule.Properties.Protocol).toBe(-1); // All protocols
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.CidrBlock).toBe('10.0.0.0/16');
      });

      test('should have ingress rule for ephemeral ports', () => {
        expect(template.Resources.PrivateNetworkAclIngressEphemeral).toBeDefined();
        const rule = template.Resources.PrivateNetworkAclIngressEphemeral;
        expect(rule.Properties.RuleNumber).toBe(110);
        expect(rule.Properties.Protocol).toBe(6); // TCP
        expect(rule.Properties.RuleAction).toBe('allow');
        expect(rule.Properties.PortRange.From).toBe(1024);
        expect(rule.Properties.PortRange.To).toBe(65535);
      });

      test('should have egress rule allowing all traffic', () => {
        expect(template.Resources.PrivateNetworkAclEgressAll).toBeDefined();
        const rule = template.Resources.PrivateNetworkAclEgressAll;
        expect(rule.Properties.Egress).toBe(true);
        expect(rule.Properties.Protocol).toBe(-1); // All protocols
        expect(rule.Properties.RuleAction).toBe('allow');
      });

      test('should have NACL associations for all private subnets', () => {
        ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
          const association = template.Resources[`PrivateSubnetNetworkAclAssociation${az}`];
          expect(association).toBeDefined();
          expect(association.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
          expect(association.Properties.SubnetId).toEqual({ Ref: `PrivateSubnet${az}` });
          expect(association.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have VPCCidrBlock output', () => {
      expect(template.Outputs.VPCCidrBlock).toBeDefined();
      expect(template.Outputs.VPCCidrBlock.Value).toEqual({ 'Fn::GetAtt': ['VPC', 'CidrBlock'] });
    });

    test('should have VPCIpv6CidrBlock output', () => {
      expect(template.Outputs.VPCIpv6CidrBlock).toBeDefined();
    });

    test('should have outputs for all public subnets', () => {
      ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
        expect(template.Outputs[`PublicSubnet${az}Id`]).toBeDefined();
        expect(template.Outputs[`PublicSubnet${az}Id`].Value).toEqual({ Ref: `PublicSubnet${az}` });
      });
    });

    test('should have outputs for all private subnets', () => {
      ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
        expect(template.Outputs[`PrivateSubnet${az}Id`]).toBeDefined();
        expect(template.Outputs[`PrivateSubnet${az}Id`].Value).toEqual({ Ref: `PrivateSubnet${az}` });
      });
    });

    test('should have InternetGatewayId output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
      expect(template.Outputs.InternetGatewayId.Value).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have outputs for all NAT Gateways', () => {
      ['AZ1', 'AZ2', 'AZ3'].forEach(az => {
        expect(template.Outputs[`NATGateway${az}Id`]).toBeDefined();
        expect(template.Outputs[`NATGateway${az}Id`].Value).toEqual({ Ref: `NATGateway${az}` });
      });
    });

    test('should have FlowLogsLogGroupName output', () => {
      expect(template.Outputs.FlowLogsLogGroupName).toBeDefined();
      expect(template.Outputs.FlowLogsLogGroupName.Value).toEqual({ Ref: 'FlowLogsLogGroup' });
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('DeletionPolicy Validation', () => {
    test('all resources should have DeletionPolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Tagging Validation', () => {
    const taggableResourceTypes = [
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::InternetGateway',
      'AWS::EC2::NatGateway',
      'AWS::EC2::RouteTable',
      'AWS::EC2::NetworkAcl',
      'AWS::IAM::Role',
      'AWS::Logs::LogGroup',
      'AWS::EC2::FlowLog',
      'AWS::EC2::EIP'
    ];

    taggableResourceTypes.forEach(resourceType => {
      test(`all ${resourceType} resources should have required tags`, () => {
        const resources = Object.keys(template.Resources).filter(
          key => template.Resources[key].Type === resourceType
        );

        resources.forEach(resourceKey => {
          const resource = template.Resources[resourceKey];
          const tags = resource.Properties.Tags;

          expect(tags).toBeDefined();
          expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'Owner')).toBe(true);
          expect(tags.some((t: any) => t.Key === 'CostCenter')).toBe(true);
        });
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 1 VPC', () => {
      const vpcs = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::VPC');
      expect(vpcs.length).toBe(1);
    });

    test('should have exactly 6 subnets total', () => {
      const subnets = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::Subnet');
      expect(subnets.length).toBe(6);
    });

    test('should have exactly 1 Internet Gateway', () => {
      const igws = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::InternetGateway');
      expect(igws.length).toBe(1);
    });

    test('should have exactly 3 NAT Gateways', () => {
      const nats = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::NatGateway');
      expect(nats.length).toBe(3);
    });

    test('should have exactly 4 route tables (1 public, 3 private)', () => {
      const routeTables = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::RouteTable');
      expect(routeTables.length).toBe(4);
    });

    test('should have exactly 2 Network ACLs (1 public, 1 private)', () => {
      const nacls = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::NetworkAcl');
      expect(nacls.length).toBe(2);
    });

    test('should have exactly 1 VPC Flow Log', () => {
      const flowLogs = Object.keys(template.Resources).filter(k => template.Resources[k].Type === 'AWS::EC2::FlowLog');
      expect(flowLogs.length).toBe(1);
    });
  });
});
