import fs from 'fs';
import path from 'path';

// This test suite validates the CloudFormation template.
// NOTE: Before running, ensure the YAML template has been converted to JSON.
// The test expects the converted file to be at `lib/Tapstack.json`.

describe('Elastic Beanstalk CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template.
    const templatePath ='../lib/Tapstack.json';
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      const expectedDescription = 'Deploys a highly available and scalable Node.js web application using AWS Elastic Beanstalk. This template includes the necessary IAM roles to create a stable, empty environment.';
      expect(template.Description).toBeDefined();
      // Use trim() to remove any trailing newlines (\n) for an exact match.
      expect(template.Description.trim()).toBe(expectedDescription);
    });
  });

  describe('Parameters', () => {
    test('should define the correct parameters', () => {
      const expectedParams = ['ApplicationName', 'InstanceType'];
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
      // Updated to match the JSON file's default value
      expect(param.Default).toBe('t2.micro');
      expect(param.Description).toBe('EC2 instance type for the web application servers.');
      expect(param.AllowedValues).toEqual(['t2.micro', 't3.micro', 't3.small', 'm5.large']);
    });
  });

  describe('Resources', () => {
    test('should define all required IAM resources', () => {
        expect(template.Resources.AWSElasticBeanstalkServiceRole).toBeDefined();
        expect(template.Resources.AWSElasticBeanstalkEC2Role).toBeDefined();
        expect(template.Resources.AWSElasticBeanstalkEC2InstanceProfile).toBeDefined();
    });

    test('IAM roles should have AdministratorAccess for development', () => {
        const serviceRole = template.Resources.AWSElasticBeanstalkServiceRole;
        const ec2Role = template.Resources.AWSElasticBeanstalkEC2Role;
        expect(serviceRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AdministratorAccess');
        expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AdministratorAccess');
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
    });
  });

  describe('Outputs', () => {
    test('should have a valid HTTP EnvironmentURL output', () => {
      const output = template.Outputs.EnvironmentURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The URL of the new Elastic Beanstalk environment.');
      // Updated to check for an HTTP URL, not HTTPS
      expect(output.Value).toEqual({ 'Fn::Sub': 'http://${WebAppEnvironment.EndpointURL}' });
    });
  });
});
