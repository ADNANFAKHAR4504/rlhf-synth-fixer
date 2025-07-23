import fs from 'fs';
import path from 'path';

// This test suite validates the eb_deployment.yaml template.
// NOTE: Before running, the YAML template must be converted to JSON format.
// The test expects the converted file to be at `lib/Tapstack.json`.
// You can use a tool like `cfn-flip` for the conversion:
// `cfn-flip eb_deployment.yaml > lib/Tapstack.json`

describe('Elastic Beanstalk CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template.
    const templatePath = path.join(__dirname, '../lib/Tapstack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      const expectedDescription = 'Deploys a highly available and scalable Node.js web application using AWS Elastic Beanstalk. This template configures an Application Load Balancer, Auto Scaling, and HTTPS.';
      expect(template.Description).toBeDefined();
      // Use trim() to remove any trailing newlines (\n) for an exact match.
      expect(template.Description.trim()).toBe(expectedDescription);
    });
  });

  describe('Parameters', () => {
    test('should define all required parameters', () => {
      const expectedParams = ['ApplicationName', 'InstanceType', 'KeyPairName', 'SSLCertificateArn'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
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
      expect(param.Default).toBe('t3.micro');
      expect(param.Description).toBe('EC2 instance type for the web application servers.');
      expect(param.AllowedValues).toEqual(['t2.micro', 't3.micro', 't3.small', 'm5.large']);
    });

    test('KeyPairName parameter should have correct properties including the new default', () => {
        const param = template.Parameters.KeyPairName;
        expect(param.Type).toBe('AWS::EC2::KeyPair::KeyName');
        expect(param.Description).toBe('The name of an existing EC2 KeyPair to enable SSH access to the instances.');
        // Validates the new default value.
        expect(param.Default).toBe('your-dev-key');
    });

    test('SSLCertificateArn parameter should have correct properties including the new default', () => {
        const param = template.Parameters.SSLCertificateArn;
        expect(param.Type).toBe('String');
        expect(param.Description).toBe('The ARN of an existing ACM SSL certificate in us-east-1 for HTTPS.');
        // Validates the new default value.
        expect(param.Default).toBe('arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    });
  });

  describe('Resources', () => {
    test('should define WebAppApplication resource correctly', () => {
      const resource = template.Resources.WebAppApplication;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ElasticBeanstalk::Application');
      expect(resource.Properties.ApplicationName).toEqual({ Ref: 'ApplicationName' });
    });

    test('should define WebAppEnvironment resource correctly', () => {
      const resource = template.Resources.WebAppEnvironment;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ElasticBeanstalk::Environment');
    });

    test('WebAppEnvironment should reference the WebAppApplication', () => {
        const resource = template.Resources.WebAppEnvironment;
        expect(resource.Properties.ApplicationName).toEqual({ Ref: 'WebAppApplication' });
    });

    test('WebAppEnvironment should use the correct SolutionStackName', () => {
        const resource = template.Resources.WebAppEnvironment;
        expect(resource.Properties.SolutionStackName).toBe('64bit Amazon Linux 2 v5.8.0 running Node.js 18');
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

        test('should configure InstanceType and EC2KeyName from parameters', () => {
            const instanceTypeOption = findOption('aws:autoscaling:launchconfiguration', 'InstanceType');
            expect(instanceTypeOption.Value).toEqual({ Ref: 'InstanceType' });

            const keyNameOption = findOption('aws:autoscaling:launchconfiguration', 'EC2KeyName');
            expect(keyNameOption.Value).toEqual({ Ref: 'KeyPairName' });
        });

        test('should configure a load-balanced application environment', () => {
            const envTypeOption = findOption('aws:elasticbeanstalk:environment', 'EnvironmentType');
            expect(envTypeOption.Value).toBe('LoadBalanced');

            const lbTypeOption = findOption('aws:elasticbeanstalk:environment', 'LoadBalancerType');
            expect(lbTypeOption.Value).toBe('application');
        });

        test('should configure Auto Scaling group min/max sizes', () => {
            const minSizeOption = findOption('aws:autoscaling:asg', 'MinSize');
            expect(minSizeOption.Value).toBe('2');

            const maxSizeOption = findOption('aws:autoscaling:asg', 'MaxSize');
            expect(maxSizeOption.Value).toBe('10');
        });

        test('should configure HTTPS listener on port 443 with SSL certificate', () => {
            const protocolOption = findOption('aws:elbv2:listener:443', 'Protocol');
            expect(protocolOption.Value).toBe('HTTPS');

            const certOption = findOption('aws:elbv2:listener:443', 'SSLCertificateArns');
            expect(certOption.Value).toEqual({ Ref: 'SSLCertificateArn' });
        });
        
        test('should keep the default listener enabled for HTTP redirection', () => {
            const listenerEnabledOption = findOption('aws:elbv2:listener:default', 'ListenerEnabled');
            expect(listenerEnabledOption.Value).toBe('true');
        });

        test('should have a public-facing load balancer scheme', () => {
            const schemeOption = findOption('aws:elasticbeanstalk:application:environment', 'ELBScheme');
            expect(schemeOption.Value).toBe('public');
        });
    });
  });

  describe('Outputs', () => {
    test('should have a valid EnvironmentURL output', () => {
      const output = template.Outputs.EnvironmentURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The URL of the new Elastic Beanstalk environment.');
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://${WebAppEnvironment.EndpointURL}' });
    });
  });
});
