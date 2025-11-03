import fs from 'fs';
import path from 'path';
import { describe, expect, test } from '@jest/globals';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // Integration tests are in a separate file

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Carbon Credit Trading Platform - Serverless Architecture with QLDB'
      );
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe(
        'Environment type for conditional resource configuration'
      );
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('Resources', () => {
    describe('LedgerTable', () => {
      test('should have correct base configuration', () => {
        const table = template.Resources.LedgerTable;
        expect(table).toBeDefined();
        expect(table.Type).toBe('AWS::DynamoDB::Table');
        expect(table.Properties.TableName).toEqual({
          'Fn::Sub': 'CarbonCreditLedger-${Environment}'
        });
      });

      test('should have correct key schema and indexes', () => {
        const table = template.Resources.LedgerTable;
        const properties = table.Properties;

        expect(properties.KeySchema).toEqual([
          { AttributeName: 'RecordID', KeyType: 'HASH' },
          { AttributeName: 'Version', KeyType: 'RANGE' }
        ]);

        expect(properties.GlobalSecondaryIndexes).toHaveLength(1);
        expect(properties.GlobalSecondaryIndexes[0].IndexName).toBe('TransactionTimeIndex');
      });

      test('should have point-in-time recovery and streams enabled', () => {
        const table = template.Resources.LedgerTable;
        expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
        expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
      });
    });

    describe('DynamoDB Tables', () => {
      test('TradeTable should have correct configuration', () => {
        const table = template.Resources.TradeTable;
        expect(table).toBeDefined();
        expect(table.Properties.TableName).toEqual({
          'Fn::Sub': 'CarbonCreditTradeTable-${Environment}'
        });
        expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(2);
      });

      test('CertificateTable should have correct configuration', () => {
        const table = template.Resources.CertificateTable;
        expect(table).toBeDefined();
        expect(table.Properties.TableName).toEqual({
          'Fn::Sub': 'CarbonCreditCertificateTable-${Environment}'
        });
        expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(2);
      });
    });

    describe('State Machines', () => {
      test('should have initial and verification state machines', () => {
        expect(template.Resources.InitialStateMachine).toBeDefined();
        expect(template.Resources.VerificationStateMachine).toBeDefined();
      });

      test('should have correct IAM role', () => {
        const role = template.Resources.StateMachineRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
          .toBe('states.amazonaws.com');
      });
    });

    describe('Lambda Function', () => {
      test('should have API Gateway handler function', () => {
        const func = template.Resources.ApiGatewayHandlerFunction;
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.Runtime).toBe('nodejs20.x');
      });

      test('should have correct IAM role', () => {
        const role = template.Resources.ApiGatewayHandlerRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
          .toBe('lambda.amazonaws.com');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayHandlerArn',
        'VerificationStateMachineArn',
        'TradeTableName',
        'CertificateTableName',
        'LedgerTableName',
        'LedgerTableArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('Lambda outputs should be correct', () => {
      const output = template.Outputs.ApiGatewayHandlerArn;
      expect(output.Description).toBe('ARN of the API Gateway handler Lambda function');
      expect(output.Value).toEqual({ 
        'Fn::GetAtt': ['ApiGatewayHandlerFunction', 'Arn'] 
      });
    });

    test('State Machine output should be correct', () => {
      const output = template.Outputs.VerificationStateMachineArn;
      expect(output.Description).toBe('ARN of the verification state machine');
      expect(output.Value).toEqual({ 
        'Ref': 'VerificationStateMachine'
      });
    });

    test('DynamoDB table outputs should be correct', () => {
      const tradeOutput = template.Outputs.TradeTableName;
      expect(tradeOutput.Description).toBe('Name of the trade DynamoDB table');
      expect(tradeOutput.Value).toEqual({ Ref: 'TradeTable' });

      const certOutput = template.Outputs.CertificateTableName;
      expect(certOutput.Description).toBe('Name of the certificate DynamoDB table');
      expect(certOutput.Value).toEqual({ Ref: 'CertificateTable' });

      const ledgerTableName = template.Outputs.LedgerTableName;
      expect(ledgerTableName.Description).toBe('Name of the immutable ledger DynamoDB table');
      expect(ledgerTableName.Value).toEqual({ Ref: 'LedgerTable' });

      const ledgerTableArn = template.Outputs.LedgerTableArn;
      expect(ledgerTableArn.Description).toBe('ARN of the immutable ledger DynamoDB table');
      expect(ledgerTableArn.Value).toEqual({ 
        'Fn::GetAtt': ['LedgerTable', 'Arn'] 
      });
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

    test('should have correct resource count', () => {
      const expectedResources = [
        'LedgerTable',
        'TradeTable',
        'CertificateTable',
        'AdminCredentials',
        'StateMachineLogGroup',
        'StateMachineRole',
        'ApiGatewayHandlerRole',
        'ApiGatewayHandlerFunction',
        'InitialStateMachine',
        'VerificationStateMachine',
        'StateMachineArnParameter'
      ];
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResources.length);
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('should have correct outputs count', () => {
      const expectedOutputs = [
        'ApiGatewayHandlerArn',
        'VerificationStateMachineArn',
        'TradeTableName',
        'CertificateTableName',
        'LedgerTableName',
        'LedgerTableArn'
      ];
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(expectedOutputs.length);
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('table names should follow naming convention with environment parameter', () => {
      const tables = {
        LedgerTable: 'CarbonCreditLedger',
        TradeTable: 'CarbonCreditTradeTable',
        CertificateTable: 'CarbonCreditCertificateTable'
      };

      Object.entries(tables).forEach(([resourceName, tablePrefix]) => {
        const table = template.Resources[resourceName];
        expect(table.Properties.TableName).toEqual({
          'Fn::Sub': `${tablePrefix}-\${Environment}`
        });
      });
    });

    test('state machine names should follow naming convention', () => {
      const stateMachines = {
        InitialStateMachine: 'CarbonCreditVerification-Initial',
        VerificationStateMachine: 'CarbonCreditVerification'
      };

      Object.entries(stateMachines).forEach(([resourceName, namePrefix]) => {
        const machine = template.Resources[resourceName];
        expect(machine.Properties.StateMachineName).toEqual({
          'Fn::Sub': `${namePrefix}-\${Environment}`
        });
      });
    });

    test('Lambda function should follow naming convention', () => {
      const func = template.Resources.ApiGatewayHandlerFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'ApiGatewayHandler-${Environment}'
      });
    });
  });
});
