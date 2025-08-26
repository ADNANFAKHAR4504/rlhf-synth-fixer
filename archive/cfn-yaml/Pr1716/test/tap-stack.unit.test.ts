import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('TapStack CloudFormation Template (YAML)', () => {
    let template: any;

    function matchesRef(val: any, refName: string): boolean {
        return (
            (typeof val === 'string' && val === refName) ||
            (val && typeof val === 'object' && 'Ref' in val && (val as any).Ref === refName)
        );
    }

    beforeAll(() => {
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
                'Web Application Environment with ALB, EC2 instances, and proper security configuration'
            );
        });
    });

    describe('Parameters', () => {
        test('should have expected parameters', () => {
            expect(template.Parameters).toBeDefined();
            const params = template.Parameters;
            expect(params.EnvironmentName).toBeDefined();
            expect(params.InstanceType).toBeDefined();
            expect(params.SSHLocation).toBeDefined();
        });

        test('EnvironmentName parameter should have correct defaults', () => {
            const p = template.Parameters.EnvironmentName;
            expect(p.Type).toBe('String');
            expect(p.Default).toBe('Dev');
        });

        test('InstanceType parameter should allow common sizes', () => {
            const p = template.Parameters.InstanceType;
            expect(p.Type).toBe('String');
            expect(p.Default).toBe('t3.micro');
            expect(p.AllowedValues).toEqual(expect.arrayContaining(['t3.micro', 't3.small', 't2.micro']));
        });

        test('SSHLocation parameter should enforce CIDR pattern presence', () => {
            const p = template.Parameters.SSHLocation;
            expect(p.Type).toBe('String');
            expect(p.Default).toBe('0.0.0.0/0');
            expect(p.AllowedPattern).toBeDefined();
        });
    });

    describe('Mappings', () => {
        test('should include AWSRegionAMI mapping with us-east-1 AMI', () => {
            expect(template.Mappings).toBeDefined();
            const map = template.Mappings.AWSRegionAMI;
            expect(map).toBeDefined();
            expect(map['us-east-1']).toBeDefined();
            expect(map['us-east-1'].AMI).toBeDefined();
        });
    });

    describe('Resources - Networking', () => {
        test('should define VPC and public subnets', () => {
            const r = template.Resources;
            expect(r.VPC.Type).toBe('AWS::EC2::VPC');
            expect(r.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
            expect(r.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
            expect(r.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
            expect(r.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
        });

        test('should define InternetGateway and routing for public subnets', () => {
            const r = template.Resources;
            expect(r.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
            expect(r.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
            expect(r.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
            expect(r.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
            expect(r.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        });
    });

    describe('Resources - Security Groups', () => {
        test('ALB security group should allow HTTP and HTTPS from internet', () => {
            const sg = template.Resources.ALBSecurityGroup;
            expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
            const ingress = sg.Properties.SecurityGroupIngress;
            const http = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
            const https = ingress.find((r: any) => r.FromPort === 443 && r.ToPort === 443);
            expect(http).toBeDefined();
            expect(https).toBeDefined();
            expect(http.CidrIp).toBe('0.0.0.0/0');
            expect(https.CidrIp).toBe('0.0.0.0/0');
        });

        test('Web server security group should allow HTTP from ALB and SSH from parameter', () => {
            const sg = template.Resources.WebServerSecurityGroup;
            expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
            const ingress = sg.Properties.SecurityGroupIngress;
            const httpFromAlb = ingress.find((r: any) => r.FromPort === 80 && r.SourceSecurityGroupId !== undefined);
            const ssh = ingress.find((r: any) => r.FromPort === 22);
            expect(httpFromAlb).toBeDefined();
            // Accept either a Ref object or a plain string depending on YAML parsing
            expect(matchesRef(httpFromAlb.SourceSecurityGroupId, 'ALBSecurityGroup')).toBe(true);
            expect(ssh).toBeDefined();
            expect(ssh.CidrIp).toBeDefined();
        });
    });

    describe('Resources - IAM and EC2', () => {
        test('should define EC2 role and instance profile', () => {
            const r = template.Resources;
            expect(r.EC2Role.Type).toBe('AWS::IAM::Role');
            expect(r.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
        });

        test('should define launch template with UserData that installs httpd', () => {
            const lt = template.Resources.WebServerLaunchTemplate;
            expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
            const userDataField = lt.Properties.LaunchTemplateData.UserData;
            let userData = '';
            if (typeof userDataField === 'string') {
                userData = userDataField;
            } else if (userDataField && typeof userDataField === 'object') {
                const base = (userDataField as any)['Fn::Base64'];
                if (typeof base === 'string') userData = base;
                else if (base && typeof base === 'object') userData = (base as any)['Fn::Sub'] || '';
            }

            expect(typeof userData).toBe('string');
            expect(userData).toContain('yum install -y httpd');
            expect(userData).toContain('systemctl start httpd');
        });

        test('should deploy two EC2 instances in different subnets', () => {
            const r = template.Resources;
            expect(r.WebServer1.Type).toBe('AWS::EC2::Instance');
            expect(r.WebServer2.Type).toBe('AWS::EC2::Instance');
            expect(matchesRef(r.WebServer1.Properties.SubnetId, 'PublicSubnet1')).toBe(true);
            expect(matchesRef(r.WebServer2.Properties.SubnetId, 'PublicSubnet2')).toBe(true);
        });
    });

    describe('Resources - ALB', () => {
        test('should create ALB, TargetGroup, and HTTP Listener', () => {
            const r = template.Resources;
            expect(r.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
            expect(r.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
            expect(r.ALBHTTPListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
            expect(r.ALBHTTPSListener).toBeUndefined();
        });
    });

    describe('Counts', () => {
        test('should have expected number of parameters, resources, and outputs', () => {
            expect(Object.keys(template.Parameters)).toHaveLength(3);
            expect(Object.keys(template.Resources)).toHaveLength(19);
            expect(Object.keys(template.Outputs)).toHaveLength(9);
        });
    });

    describe('Outputs', () => {
        test('should include ALB and instance related outputs', () => {
            const o = template.Outputs;
            const expected = [
                'VPC',
                'PublicSubnets',
                'WebServerSecurityGroup',
                'ALBSecurityGroup',
                'WebServer1PublicIP',
                'WebServer2PublicIP',
                'LoadBalancerDNS',
                'LoadBalancerURL',
                'LoadBalancerHostedZone',
            ];
            expected.forEach((k) => expect(o[k]).toBeDefined());
        });
    });
});

