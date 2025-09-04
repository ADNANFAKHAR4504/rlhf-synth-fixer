import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { CodeDeployClient, GetDeploymentCommand } from '@aws-sdk/client-codedeploy';
import { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } from '@aws-sdk/client-codepipeline';

// Initialize Powertools
const logger = new Logger({ serviceName: 'deployment-validator' });
const tracer = new Tracer({ serviceName: 'deployment-validator' });
const metrics = new Metrics({ namespace: 'CICDPipeline', serviceName: 'deployment-validator' });

// Initialize AWS clients
const codedeploy = tracer.captureAWSv3Client(new CodeDeployClient({}));
const codepipeline = tracer.captureAWSv3Client(new CodePipelineClient({}));

export const handler = async (event, context) => {
  // Add correlation ID for tracing
  logger.addContext(context);
  
  // Start custom segment
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('deployment-validation');
  tracer.setSegment(subsegment);

  try {
    logger.info('Starting deployment validation', { event });

    // Extract parameters from CodePipeline
    const userParameters = JSON.parse(event['CodePipeline.job'].data.actionConfiguration.configuration.UserParameters);
    const { environmentSuffix, deploymentId } = userParameters;

    // Add custom metrics
    metrics.addMetric('DeploymentValidationStarted', MetricUnits.Count, 1);

    // Validate deployment if deploymentId is provided
    if (deploymentId) {
      const deploymentResult = await validateDeployment(deploymentId);
      
      if (deploymentResult.status === 'Succeeded') {
        logger.info('Deployment validation successful', { deploymentId, status: deploymentResult.status });
        metrics.addMetric('DeploymentValidationSuccess', MetricUnits.Count, 1);
        
        // Put custom success job result
        await putJobSuccess(event['CodePipeline.job'].id, 'Deployment validation completed successfully');
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Deployment validation successful',
            deploymentId: deploymentId,
            status: deploymentResult.status
          })
        };
      } else {
        logger.error('Deployment validation failed', { deploymentId, status: deploymentResult.status });
        metrics.addMetric('DeploymentValidationFailure', MetricUnits.Count, 1);
        
        await putJobFailure(event['CodePipeline.job'].id, 'Deployment validation failed');
        
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: 'Deployment validation failed',
            deploymentId: deploymentId,
            status: deploymentResult.status
          })
        };
      }
    }

    // Perform basic health checks
    const healthCheckResult = await performHealthChecks(environmentSuffix);
    
    if (healthCheckResult.success) {
      logger.info('Health checks passed', { environmentSuffix });
      metrics.addMetric('HealthCheckSuccess', MetricUnits.Count, 1);
      
      await putJobSuccess(event['CodePipeline.job'].id, 'Health checks completed successfully');
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Health checks successful',
          environment: environmentSuffix,
          checks: healthCheckResult.checks
        })
      };
    } else {
      logger.error('Health checks failed', { environmentSuffix, failures: healthCheckResult.failures });
      metrics.addMetric('HealthCheckFailure', MetricUnits.Count, 1);
      
      await putJobFailure(event['CodePipeline.job'].id, 'Health checks failed');
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Health checks failed',
          environment: environmentSuffix,
          failures: healthCheckResult.failures
        })
      };
    }

  } catch (error) {
    logger.error('Error during deployment validation', { error: error.message, stack: error.stack });
    metrics.addMetric('DeploymentValidationError', MetricUnits.Count, 1);
    
    await putJobFailure(event['CodePipeline.job'].id, `Validation error: ${error.message}`);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Validation error',
        error: error.message
      })
    };
  } finally {
    // Publish metrics and close segment
    metrics.publishStoredMetrics();
    subsegment.close();
    tracer.setSegment(segment);
  }
};

async function validateDeployment(deploymentId) {
  try {
    const command = new GetDeploymentCommand({ deploymentId });
    const response = await codedeploy.send(command);
    
    return {
      status: response.deploymentInfo.status,
      description: response.deploymentInfo.description || 'No description available'
    };
  } catch (error) {
    logger.error('Failed to get deployment status', { deploymentId, error: error.message });
    throw error;
  }
}

async function performHealthChecks(environmentSuffix) {
  const checks = [];
  const failures = [];
  
  try {
    // Simulate application health check
    const appHealthy = await checkApplicationHealth();
    checks.push({ name: 'ApplicationHealth', status: appHealthy ? 'PASS' : 'FAIL' });
    if (!appHealthy) failures.push('Application health check failed');
    
    // Simulate database connectivity check
    const dbHealthy = await checkDatabaseConnectivity();
    checks.push({ name: 'DatabaseConnectivity', status: dbHealthy ? 'PASS' : 'FAIL' });
    if (!dbHealthy) failures.push('Database connectivity check failed');
    
    // Simulate external service check
    const externalHealthy = await checkExternalServices();
    checks.push({ name: 'ExternalServices', status: externalHealthy ? 'PASS' : 'FAIL' });
    if (!externalHealthy) failures.push('External services check failed');
    
    return {
      success: failures.length === 0,
      checks,
      failures
    };
  } catch (error) {
    logger.error('Error performing health checks', { error: error.message });
    return {
      success: false,
      checks,
      failures: [...failures, `Health check error: ${error.message}`]
    };
  }
}

async function checkApplicationHealth() {
  // Simulate application health check
  // In real implementation, this would check application endpoints
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.random() > 0.1; // 90% success rate
}

async function checkDatabaseConnectivity() {
  // Simulate database connectivity check
  // In real implementation, this would test database connections
  await new Promise(resolve => setTimeout(resolve, 50));
  return Math.random() > 0.05; // 95% success rate
}

async function checkExternalServices() {
  // Simulate external service check
  // In real implementation, this would test external API endpoints
  await new Promise(resolve => setTimeout(resolve, 200));
  return Math.random() > 0.15; // 85% success rate
}

async function putJobSuccess(jobId, message) {
  try {
    const command = new PutJobSuccessResultCommand({ jobId });
    await codepipeline.send(command);
    logger.info('Job succeeded', { jobId, message });
  } catch (error) {
    logger.error('Failed to mark job as success', { jobId, error: error.message });
    throw error;
  }
}

async function putJobFailure(jobId, message) {
  try {
    const command = new PutJobFailureResultCommand({
      jobId,
      failureDetails: {
        message: message,
        type: 'JobFailed'
      }
    });
    await codepipeline.send(command);
    logger.error('Job failed', { jobId, message });
  } catch (error) {
    logger.error('Failed to mark job as failure', { jobId, error: error.message });
    throw error;
  }
}