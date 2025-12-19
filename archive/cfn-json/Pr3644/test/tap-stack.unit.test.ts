import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Parking Management System', () => {
  let template: any;

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
      expect(template.Description).toContain('Parking Management System');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('parking-admin@example.com');
    });

    test('should have MaxParkingDuration parameter', () => {
      expect(template.Parameters.MaxParkingDuration).toBeDefined();
      const durationParam = template.Parameters.MaxParkingDuration;
      expect(durationParam.Type).toBe('Number');
      expect(durationParam.Default).toBe(24);
      expect(durationParam.MinValue).toBe(1);
      expect(durationParam.MaxValue).toBe(168);
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TurnAroundPromptTable resource', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.DeletionPolicy).toBe('Delete');
    });

    test('should have ParkingBookingsTable resource', () => {
      const table = template.Resources.ParkingBookingsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ParkingBookingsTable should have correct attributes', () => {
      const table = template.Resources.ParkingBookingsTable;
      const attributes = table.Properties.AttributeDefinitions;

      const attributeNames = attributes.map((attr: any) => attr.AttributeName);
      expect(attributeNames).toContain('bookingId');
      expect(attributeNames).toContain('facilityId');
      expect(attributeNames).toContain('spotId');
      expect(attributeNames).toContain('startTime');
      expect(attributeNames).toContain('userId');
    });

    test('ParkingBookingsTable should have Global Secondary Indexes', () => {
      const table = template.Resources.ParkingBookingsTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toBeDefined();
      expect(gsis.length).toBeGreaterThanOrEqual(3);

      const indexNames = gsis.map((gsi: any) => gsi.IndexName);
      expect(indexNames).toContain('FacilityTimeIndex');
      expect(indexNames).toContain('SpotTimeIndex');
      expect(indexNames).toContain('UserBookingsIndex');
    });

    test('ParkingBookingsTable should have streams enabled', () => {
      const table = template.Resources.ParkingBookingsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });
  });

  describe('Lambda Function', () => {
    test('should have ParkingReservationLambda resource', () => {
      const lambda = template.Resources.ParkingReservationLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have correct runtime and handler', () => {
      const lambda = template.Resources.ParkingReservationLambda;
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('Lambda should have environment variables', () => {
      const lambda = template.Resources.ParkingReservationLambda;
      const env = lambda.Properties.Environment.Variables;

      expect(env.BOOKINGS_TABLE).toBeDefined();
      expect(env.SNS_TOPIC_ARN).toBeDefined();
      expect(env.REGION).toBeDefined();
      expect(env.MAX_DURATION_HOURS).toBeDefined();
      expect(env.IOT_ENDPOINT).toBeDefined();
    });

    test('Lambda should have inline code', () => {
      const lambda = template.Resources.ParkingReservationLambda;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('exports.handler');
    });

    test('Lambda should have correct timeout', () => {
      const lambda = template.Resources.ParkingReservationLambda;
      expect(lambda.Properties.Timeout).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    test('should have ParkingReservationLambdaRole', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have correct trust policy', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Lambda role should have DynamoDB permissions', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const dynamoStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('dynamodb:GetItem')
      );

      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Effect).toBe('Allow');
      expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
      expect(dynamoStatement.Action).toContain('dynamodb:Query');
    });

    test('Lambda role should have SNS publish permissions', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const snsStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('sns:Publish')
      );

      expect(snsStatement).toBeDefined();
      expect(snsStatement.Effect).toBe('Allow');
    });

    test('Lambda role should have SES permissions', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const sesStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('ses:SendEmail')
      );

      expect(sesStatement).toBeDefined();
      expect(sesStatement.Effect).toBe('Allow');
    });

    test('Lambda role should have IoT permissions', () => {
      const role = template.Resources.ParkingReservationLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const iotStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('iot:Publish')
      );

      expect(iotStatement).toBeDefined();
      expect(iotStatement.Effect).toBe('Allow');
    });
  });

  describe('API Gateway', () => {
    test('should have ParkingAPI REST API', () => {
      const api = template.Resources.ParkingAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API Gateway resources', () => {
      expect(template.Resources.ParkingAPIResource).toBeDefined();
      expect(template.Resources.BookResource).toBeDefined();
      expect(template.Resources.AvailabilityResource).toBeDefined();
      expect(template.Resources.CheckInResource).toBeDefined();
    });

    test('should have API Gateway methods', () => {
      expect(template.Resources.BookMethod).toBeDefined();
      expect(template.Resources.AvailabilityMethod).toBeDefined();
      expect(template.Resources.CheckInMethod).toBeDefined();
    });

    test('BookMethod should be POST with AWS_PROXY integration', () => {
      const method = template.Resources.BookMethod;
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('AvailabilityMethod should be GET', () => {
      const method = template.Resources.AvailabilityMethod;
      expect(method.Properties.HttpMethod).toBe('GET');
    });

    test('CheckInMethod should be PUT', () => {
      const method = template.Resources.CheckInMethod;
      expect(method.Properties.HttpMethod).toBe('PUT');
    });

    test('should have API deployment', () => {
      const deployment = template.Resources.APIDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toContain('BookMethod');
      expect(deployment.DependsOn).toContain('AvailabilityMethod');
    });

    test('should have Lambda API Gateway permission', () => {
      const permission = template.Resources.LambdaAPIPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('SNS Topic', () => {
    test('should have BookingConfirmationTopic', () => {
      const topic = template.Resources.BookingConfirmationTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have email subscription', () => {
      const subscription = template.Resources.EmailSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('EventBridge', () => {
    test('should have BookingReminderEventBus', () => {
      const eventBus = template.Resources.BookingReminderEventBus;
      expect(eventBus).toBeDefined();
      expect(eventBus.Type).toBe('AWS::Events::EventBus');
    });

    test('should have BookingReminderRule', () => {
      const rule = template.Resources.BookingReminderRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(15 minutes)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('BookingReminderRule should target Lambda', () => {
      const rule = template.Resources.BookingReminderRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      expect(rule.Properties.Targets[0].Id).toBe('1');
    });

    test('should have Lambda EventBridge permission', () => {
      const permission = template.Resources.LambdaEventBridgePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('IoT Core', () => {
    test('should have ParkingIoTPolicy', () => {
      const policy = template.Resources.ParkingIoTPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IoT::Policy');
    });

    test('should have ParkingGateThing', () => {
      const thing = template.Resources.ParkingGateThing;
      expect(thing).toBeDefined();
      expect(thing.Type).toBe('AWS::IoT::Thing');
    });

    test('should have ParkingIoTTopicRule', () => {
      const rule = template.Resources.ParkingIoTTopicRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::IoT::TopicRule');
      expect(rule.Properties.TopicRulePayload.Sql).toContain('parking/gate');
    });

    test('should have IoTDynamoDBRole', () => {
      const role = template.Resources.IoTDynamoDBRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('iot.amazonaws.com');
    });
  });

  describe('CloudWatch', () => {
    test('should have ParkingOccupancyDashboard', () => {
      const dashboard = template.Resources.ParkingOccupancyDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('Dashboard should have valid body', () => {
      const dashboard = template.Resources.ParkingOccupancyDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('should have ParkingOccupancyAlarm', () => {
      const alarm = template.Resources.ParkingOccupancyAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BookingCreated');
      expect(alarm.Properties.Namespace).toBe('ParkingSystem');
      expect(alarm.Properties.Threshold).toBe(80);
    });
  });

  describe('SES', () => {
    test('should have SESConfigurationSet', () => {
      const configSet = template.Resources.SESConfigurationSet;
      expect(configSet).toBeDefined();
      expect(configSet.Type).toBe('AWS::SES::ConfigurationSet');
    });

    test('should have SESEmailIdentity', () => {
      const identity = template.Resources.SESEmailIdentity;
      expect(identity).toBeDefined();
      expect(identity.Type).toBe('AWS::SES::EmailIdentity');
    });
  });

  describe('S3 Bucket', () => {
    test('should have ParkingFacilityImagesBucket', () => {
      const bucket = template.Resources.ParkingFacilityImagesBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ParkingFacilityImagesBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ParkingFacilityImagesBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ParkingFacilityImagesBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Tagging', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      const resourcesWithTags = [
        'TurnAroundPromptTable',
        'ParkingBookingsTable',
        'ParkingFacilityImagesBucket',
        'ParkingReservationLambdaRole',
        'ParkingReservationLambda',
        'ParkingAPI',
        'BookingConfirmationTopic',
        'BookingReminderEventBus',
        'ParkingIoTPolicy',
        'ParkingIoTTopicRule',
        'IoTDynamoDBRole',
        'ParkingOccupancyAlarm',
        'SESConfigurationSet',
        'SESEmailIdentity',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
          const tag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'iac-rlhf-amazon'
          );
          expect(tag).toBeDefined();
          expect(tag.Value).toBe('true');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ParkingAPIEndpoint',
        'ParkingBookingsTableName',
        'ParkingLambdaFunctionArn',
        'BookingConfirmationTopicArn',
        'ParkingFacilityImagesBucketName',
        'ParkingDashboardURL',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Cross-account Compatibility', () => {
    test('should not have hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      // Check for common patterns of hardcoded account IDs
      expect(templateStr).not.toMatch(/\d{12}(?!.*\$\{AWS::AccountId\})/);
    });

    test('should use CloudFormation pseudo parameters', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::Region}');
      expect(templateStr).toContain('${AWS::AccountId}');
    });

    test('resource names should use EnvironmentSuffix parameter', () => {
      const resources = [
        template.Resources.TurnAroundPromptTable,
        template.Resources.ParkingBookingsTable,
        template.Resources.ParkingReservationLambda,
      ];

      resources.forEach(resource => {
        if (resource && resource.Properties) {
          const propsStr = JSON.stringify(resource.Properties);
          if (propsStr.includes('Name')) {
            expect(propsStr).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });
});
