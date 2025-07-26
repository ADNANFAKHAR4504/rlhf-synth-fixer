import fs from 'fs';
import path from 'path';

// This test suite validates the CloudFormation template.
// NOTE: Before running, ensure the YAML template has been converted to JSON.
// The test expects the converted file to be at `lib/Tapstack.json`.

describe('Elastic Beanstalk CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      // UPDATED: Description now reflects HTTPS and least-privilege roles.
      const expectedDescription = 'Deploys a highly available and scalable Node.js web application using AWS Elastic Beanstalk with a secure HTTPS endpoint. This template includes least-privilege IAM roles.';
      expect(template.Description).toBeDefined();
      expect(template.Description.trim()).toBe(expectedDescription);
    });
  });

  describe('Parameters', () => {
    test('should define the correct parameters', () => {
      // UPDATED: Added SSLCertificateArn to the expected parameters.
      const expectedParams = ['ApplicationName', 'InstanceType', 'SSLCertificateArn'];
      expect(Object.keys(template.Parameters)).toEqual(expectedParams);
    });

    test('ApplicationName parameter should have correct properties', () => {
      const param = template.Parameters.ApplicationName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('MyNodeJsApp');
      expect(param.Description).toBe('The name of the Elastic Beanstalk application.');
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t2.micro');
      expect(param.Description).toBe('EC2 instance type for the web application servers.');
      expect(param.AllowedValues).toEqual(['t2.micro', 't3.micro', 't3.small', 'm5.large']);
    });

    // ADDED: New test for the SSLCertificateArn parameter.
    test('SSLCertificateArn parameter should have correct properties', () => {
      const param = template.Parameters.SSLCertificateArn;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('The ARN of the ACM SSL certificate for the Application Load Balancer.');
      expect(param.Default).toBe('arn:aws:acm:us-east-1:718240086340:certificate/a77b0884-1bfb-4b61-b907-6d019495d01b');
    });
  });

  describe('Resources', () => {
    test('should define all required IAM resources', () => {
        expect(template.Resources.AWSElasticBeanstalkServiceRole).toBeDefined();
        expect(template.Resources.AWSElasticBeanstalkEC2Role).toBeDefined();
        expect(template.Resources.AWSElasticBeanstalkEC2InstanceProfile).toBeDefined();
    });

    // UPDATED: This test now checks for the correct least-privilege policies.
    test('IAM roles should use least-privilege managed policies', () => {
        const serviceRole = template.Resources.AWSElasticBeanstalkServiceRole;
        const ec2Role = template.Resources.AWSElasticBeanstalkEC2Role;
        // Check for the more restrictive service role policy.
        expect(serviceRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService');
        // Check for the standard web tier policy.
        expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier');
    });

    test('should define WebAppApplication and WebAppEnvironment resources correctly', () => {
      expect(template.Resources.WebAppApplication).toBeDefined();
      expect(template.Resources.WebAppEnvironment).toBeDefined();
    });

    test('WebAppEnvironment should use the correct SolutionStackName', () => {
        const resource = template.Resources.WebAppEnvironment;
        expect(resource.Properties.SolutionStackName).toBe('64bit Amazon Linux 2 v5.11.1 running Node.js 18');
    });

    describe('WebAppEnvironment OptionSettings', () => {
        let optionSettings: any[];

        beforeAll(() => {
            optionSettings = template.Resources.WebAppEnvironment.Properties.OptionSettings;
        });

        const findOption = (namespace: string, optionName: string) => {
            return optionSettings.find(
                (opt: any) => opt.Namespace === namespace && opt.OptionName === optionName
            );
        };

        test('should configure IAM roles correctly', () => {
            const instanceProfileOption = findOption('aws:autoscaling:launchconfiguration', 'IamInstanceProfile');
            expect(instanceProfileOption.Value).toEqual({ Ref: 'AWSElasticBeanstalkEC2InstanceProfile' });

            const serviceRoleOption = findOption('aws:elasticbeanstalk:environment', 'ServiceRole');
            expect(serviceRoleOption.Value).toEqual({ Ref: 'AWSElasticBeanstalkServiceRole' });
        });

        test('should configure a load-balanced application environment', () => {
            const envTypeOption = findOption('aws:elasticbeanstalk:environment', 'EnvironmentType');
            expect(envTypeOption.Value).toBe('LoadBalanced');

            const lbTypeOption = findOption('aws:elasticbeanstalk:environment', 'LoadBalancerType');
            expect(lbTypeOption.Value).toBe('application');
        });

        // ADDED: New test for auto scaling settings.
        test('should configure auto scaling group properties', () => {
            const minSizeOption = findOption('aws:autoscaling:asg', 'MinSize');
            expect(minSizeOption.Value).toBe('2');

            const maxSizeOption = findOption('aws:autoscaling:asg', 'MaxSize');
            expect(maxSizeOption.Value).toBe('10');
        });

        // ADDED: New test for the HTTPS listener configuration.
        test('should configure a secure HTTPS listener on port 443', () => {
            const protocolOption = findOption('aws:elbv2:listener:443', 'Protocol');
            expect(protocolOption.Value).toBe('HTTPS');

            const certOption = findOption('aws:elbv2:listener:443', 'SSLCertificateArns');
            expect(certOption.Value).toEqual({ Ref: 'SSLCertificateArn' });
        });

        // ADDED: New test for disabling the default HTTP listener.
        test('should disable the default insecure HTTP listener', () => {
            const listenerEnabledOption = findOption('aws:elbv2:listener:default', 'ListenerEnabled');
            expect(listenerEnabledOption.Value).toBe('false');
        });
    });
  });

  describe('Outputs', () => {
    // UPDATED: This test now validates the HTTPS URL and description.
    test('should have a valid HTTPS EnvironmentURL output', () => {
      const output = template.Outputs.EnvironmentURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The HTTPS URL of the new Elastic Beanstalk environment.');
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://${WebAppEnvironment.EndpointURL}' });
    });
  });
});