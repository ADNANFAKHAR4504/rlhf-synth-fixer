const AWS = require('aws-sdk');
const route53 = new AWS.Route53();

exports.handler = async event => {
  console.log('Health check lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const hostedZoneId = process.env.HOSTED_ZONE_ID;
    const domainName = process.env.DOMAIN_NAME;
    const primaryHealthCheckId = process.env.PRIMARY_HEALTH_CHECK_ID;
    const secondaryHealthCheckId = process.env.SECONDARY_HEALTH_CHECK_ID;

    // Get health check status for primary
    const primaryHealthCheck = await route53
      .getHealthCheck({
        HealthCheckId: primaryHealthCheckId,
      })
      .promise();

    // Get health check status for secondary
    const secondaryHealthCheck = await route53
      .getHealthCheck({
        HealthCheckId: secondaryHealthCheckId,
      })
      .promise();

    console.log('Primary health check:', primaryHealthCheck);
    console.log('Secondary health check:', secondaryHealthCheck);

    // Log the health check monitoring
    console.log('Health check monitoring completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Health check monitoring completed',
        primary: primaryHealthCheck.HealthCheck,
        secondary: secondaryHealthCheck.HealthCheck,
      }),
    };
  } catch (error) {
    console.error('Error in health check lambda:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Health check monitoring failed',
        error: error.message,
      }),
    };
  }
};
