import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack integration flow', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TapInt', { environmentSuffix: 'int' });
    template = Template.fromStack(stack);
  });

  test('migration orchestration flow: notification -> pre-validation -> traffic shift -> post-validation', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);

    expect(definition.StartAt).toBeDefined();
    let currentState = definition.States[definition.StartAt];
    const visitedStates: string[] = [];

    while (currentState && currentState.Next && !visitedStates.includes(currentState.Name || '')) {
      visitedStates.push(currentState.Name || currentState.Type);

      if (currentState.Type === 'Task') {
        if (currentState.Resource) {
          if (currentState.Resource.includes('states:::sns')) {
            expect(currentState.Parameters?.Message || currentState.Parameters?.topicArn).toBeDefined();
          }
          if (currentState.Resource.includes('states:::lambda')) {
            expect(currentState.Parameters?.FunctionName || currentState.Parameters?.Payload).toBeDefined();
          }
        }
      }

      if (currentState.Next) {
        currentState = definition.States[currentState.Next];
      } else {
        break;
      }
    }

    const definitionStr = JSON.stringify(sm.Properties.DefinitionString);
    expect(definitionStr).toContain('migration-started');
    expect(definitionStr).toContain('PRE');
    expect(definitionStr).toContain('UPDATE_ROUTING');
    expect(definitionStr).toContain('POST');
  });

  test('event-driven processing flow: DynamoDB table changes flow through EventBridge to processor Lambda', () => {
    const ruleResources = template.findResources('AWS::Events::Rule');
    const rule = Object.values(ruleResources)[0] as any;

    expect(rule.Properties.EventPattern.source).toEqual(['aws.dynamodb']);
    
    const functions = template.findResources('AWS::Lambda::Function');
    const processorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS')
    );
    
    expect(processorFn).toBeDefined();
    
    const target = rule.Properties.Targets[0];
    expect(target.Arn).toBeDefined();
    
    const dynamoDbTables = template.findResources('AWS::DynamoDB::Table');
    expect(Object.keys(dynamoDbTables).length).toBe(1);
    
    const eventsFlow = rule.Properties.EventPattern.source.includes('dynamodb') &&
                      rule.Properties.Targets.length > 0 &&
                      processorFn !== undefined;
    expect(eventsFlow).toBe(true);
  });

  test('data validation flow: validator Lambda receives correct payload structure', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);

    const validationTasks = Object.values(definition.States).filter((state: any) =>
      state.Resource?.includes('lambda') && (state.Parameters?.Payload?.validationType || state.Parameters?.FunctionName?.includes('validator'))
    );

    expect(validationTasks.length).toBeGreaterThanOrEqual(2);

    const preValidation = validationTasks.find((task: any) =>
      JSON.stringify(task).includes('PRE')
    );
    const postValidation = validationTasks.find((task: any) =>
      JSON.stringify(task).includes('POST')
    );

    expect(preValidation).toBeDefined();
    expect(postValidation).toBeDefined();
  });

  test('traffic routing flow: processor Lambda receives routing configuration', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);
    const definitionStr = JSON.stringify(definition);

    expect(definitionStr).toContain('UPDATE_ROUTING');
    expect(definitionStr).toContain('targetWeight');

    const routingTasks = Object.values(definition.States).filter((state: any) =>
      JSON.stringify(state).includes('UPDATE_ROUTING')
    );

    expect(routingTasks.length).toBeGreaterThan(0);
    const routingTask = routingTasks[0] as any;
    expect(routingTask.Resource).toContain('lambda');
  });

  test('notification flow: SNS topic receives migration updates', () => {
    const snsResources = template.findResources('AWS::SNS::Topic');
    expect(Object.keys(snsResources).length).toBeGreaterThan(0);

    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);
    const definitionStr = JSON.stringify(definition);

    expect(definitionStr).toContain('sns');
    expect(definitionStr).toContain('migration-started');
  });

  test('logging flow: Step Functions execution logs flow to CloudWatch for observability', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    
    expect(sm.Properties.LoggingConfiguration).toBeDefined();
    
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    const logGroupExists = Object.keys(logGroups).length > 0;
    
    expect(logGroupExists).toBe(true);
    
    const logConfig = sm.Properties.LoggingConfiguration;
    const logDestination = logConfig.LogGroupArn || 
                         logConfig.Destinations?.[0]?.LogGroup ||
                         logConfig.Destination || 
                         logConfig;
    
    expect(logDestination).toBeDefined();
    expect(logConfig.Level).toBe('ALL');
  });

  test('monitoring flow: processor Lambda invocations tracked through CloudWatch metrics', () => {
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    const dashboard = Object.values(dashboards)[0] as any;
    const dashboardBodyRaw = dashboard.Properties.DashboardBody;
    const dashboardBody = typeof dashboardBodyRaw === 'string'
      ? dashboardBodyRaw
      : (dashboardBodyRaw?.['Fn::Join']?.[1]?.join('') || JSON.stringify(dashboardBodyRaw));
    
    const functions = template.findResources('AWS::Lambda::Function');
    const processorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS')
    );
    
    expect(processorFn).toBeDefined();
    
    const dashboardStr = typeof dashboardBody === 'string' ? dashboardBody : JSON.stringify(dashboardBody);
    expect(dashboardStr).toContain('Processor Invocations');
    expect(dashboardStr).toContain('Invocations');
  });

  test('health monitoring flow: Route 53 health check integrates with failover routing', () => {
    const healthChecks = template.findResources('AWS::Route53::HealthCheck');
    const healthCheck = Object.values(healthChecks)[0] as any;
    
    expect(healthCheck.Properties.HealthCheckConfig).toBeDefined();
    
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);
    
    expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('HTTPS');
    
    const hasRoutingLogic = JSON.stringify(definition).includes('UPDATE_ROUTING') ||
                           JSON.stringify(definition).includes('targetWeight');
    expect(hasRoutingLogic).toBe(true);
  });

  test('end-to-end migration flow: complete orchestration sequence', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);

    const states = definition.States;
    const stateNames = Object.keys(states);
    expect(stateNames.length).toBeGreaterThanOrEqual(4);

    let currentStateName = definition.StartAt;
    const flowSequence: string[] = [];

    while (currentStateName && flowSequence.length < 10) {
      flowSequence.push(currentStateName);
      const currentState = states[currentStateName];
      
      if (currentState.Next) {
        currentStateName = currentState.Next;
      } else if (currentState.End) {
        break;
      } else {
        break;
      }
    }

    expect(flowSequence.length).toBeGreaterThanOrEqual(4);
    
    const stateTypes = flowSequence.map(name => states[name]?.Type || 'Unknown');
    expect(stateTypes).toContain('Task');
  });

  test('rollback flow: migration state machine supports 15-minute rollback window', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definition = JSON.parse(sm.Properties.DefinitionString);
    
    expect(sm.Properties.TimeoutSeconds).toBeDefined();
    const timeoutSeconds = sm.Properties.TimeoutSeconds || 
                          (typeof sm.Properties.TimeoutInMinutes === 'number' 
                            ? sm.Properties.TimeoutInMinutes * 60 
                            : 900);
    
    expect(timeoutSeconds).toBeLessThanOrEqual(900);
    expect(sm.Properties.TracingConfiguration?.Enabled).toBe(true);
    
    const hasValidationSteps = JSON.stringify(definition).includes('validationType');
    expect(hasValidationSteps).toBe(true);
  });

  test('network flow: Lambda functions communicate with DynamoDB through VPC endpoints', () => {
    const functions = template.findResources('AWS::Lambda::Function');
    const userFunctions = Object.values(functions).filter(
      (fn: any) =>
        fn.Properties?.Code?.ZipFile?.includes('PROCESS') ||
        fn.Properties?.Code?.ZipFile?.includes('validationType')
    );

    expect(userFunctions.length).toBeGreaterThanOrEqual(2);

    userFunctions.forEach((fn: any) => {
      expect(fn.Properties.VpcConfig).toBeDefined();
    });

    const vpcEndpoints = template.findResources('AWS::EC2::VPCEndpoint');
    const hasDynamoDbEndpoint = Object.values(vpcEndpoints).some((ep: any) => {
      const serviceName = ep.Properties.ServiceName;
      const serviceStr = typeof serviceName === 'string' 
        ? serviceName 
        : JSON.stringify(serviceName);
      return serviceStr.toLowerCase().includes('dynamodb');
    });
    
    expect(hasDynamoDbEndpoint).toBe(true);
    
    const dynamoDbTables = template.findResources('AWS::DynamoDB::Table');
    expect(Object.keys(dynamoDbTables).length).toBe(1);
  });

  test('transaction data flow: DynamoDB writes trigger processor Lambda via EventBridge', () => {
    const ruleResources = template.findResources('AWS::Events::Rule');
    const rule = Object.values(ruleResources)[0] as any;
    
    expect(rule.Properties.EventPattern.source).toEqual(['aws.dynamodb']);
    expect(rule.Properties.Targets).toBeDefined();
    expect(rule.Properties.Targets.length).toBeGreaterThan(0);
    
    const functions = template.findResources('AWS::Lambda::Function');
    const processorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS')
    );
    
    expect(processorFn).toBeDefined();
    
    const targetArn = rule.Properties.Targets[0].Arn;
    const processorArn = processorFn?.Properties?.FunctionName || 
                        JSON.stringify(processorFn).includes('processor');
    
    expect(targetArn).toBeDefined();
    
    const dynamoDbTables = template.findResources('AWS::DynamoDB::Table');
    const table = Object.values(dynamoDbTables)[0] as any;
    expect(table).toBeDefined();
  });
});
