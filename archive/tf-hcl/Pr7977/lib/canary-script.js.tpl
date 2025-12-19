const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const syntheticsConfiguration = synthetics.getConfiguration();
const syntheticsLogHelper = require('SyntheticsLogHelper');

const apiCanaryBlueprint = async function () {
    const postData = "";

    syntheticsConfiguration.setConfig({
        restrictedHeaders: [],
        restrictedHeaderValues: []
    });

    const headers = {
        'User-Agent': 'CloudWatch-Synthetics-Canary/${service_name}',
        'Accept': 'application/json'
    };

    const requestOptions = {
        hostname: new URL('${endpoint_url}').hostname,
        method: 'GET',
        path: new URL('${endpoint_url}').pathname,
        port: new URL('${endpoint_url}').port || (new URL('${endpoint_url}').protocol === 'https:' ? 443 : 80),
        protocol: new URL('${endpoint_url}').protocol,
        body: postData,
        headers: headers
    };

    const stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true,
        continueOnHttpStepFailure: false
    };

    await syntheticsLogHelper.executeHttpStep('Verify endpoint health', requestOptions, function(res) {
        return new Promise((resolve, reject) => {
            log.info(`Status Code: $${res.statusCode}`);
            log.info(`Response: $${res.body}`);

            if (res.statusCode < 200 || res.statusCode >= 300) {
                reject(`Failed with status code: $${res.statusCode}`);
            }

            // Custom validation for health endpoint
            try {
                if (res.body) {
                    const body = JSON.parse(res.body);
                    if (body.status && body.status === 'healthy') {
                        log.info('Health check passed - service is healthy');
                        resolve();
                    } else {
                        reject(`Service reported unhealthy status: $${body.status}`);
                    }
                } else {
                    // If no JSON response, just check status code
                    resolve();
                }
            } catch (e) {
                log.info('Response is not JSON, checking status code only');
                resolve();
            }
        });
    }, stepConfig);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
