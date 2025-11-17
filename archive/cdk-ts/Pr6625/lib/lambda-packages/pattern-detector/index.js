const { Logger } = require('@aws-lambda-powertools/logger');
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const { Tracer } = require('@aws-lambda-powertools/tracer');

const logger = new Logger({ serviceName: 'PatternDetector' });
const metrics = new Metrics({ namespace: 'StockPatternDetection', serviceName: 'PatternDetector' });
const tracer = new Tracer({ serviceName: 'PatternDetector' });

exports.handler = async (event) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('PatternDetection');

  try {
    logger.info('Processing pattern detection request', { event });

    const action = event.action || 'detect';
    const startTime = Date.now();

    // Custom metrics using EMF
    metrics.addDimension('PatternType', event.patternType || 'head-and-shoulders');
    metrics.addDimension('Confidence', 'high');

    // Simulate pattern detection logic
    const result = {
      patternId: `pattern-${Date.now()}`,
      patternType: event.patternType || 'head-and-shoulders',
      confidence: 0.85 + Math.random() * 0.15,
      timestamp: new Date().toISOString(),
      action,
      data: event.data || {},
    };

    const duration = Date.now() - startTime;

    // Publish custom metrics using EMF
    metrics.addMetric('PatternDetectionDuration', MetricUnits.Milliseconds, duration);
    metrics.addMetric('ConfidenceScore', MetricUnits.Percent, result.confidence * 100);

    // Add custom segment metadata
    subsegment.addMetadata('patternType', result.patternType);
    subsegment.addMetadata('confidence', result.confidence);
    subsegment.close();

    logger.info('Pattern detection completed', { result });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      validatedData: result,
      scoredPatterns: [result],
    };
  } catch (error) {
    logger.error('Error in pattern detection', { error });
    subsegment.addError(error);
    subsegment.close();

    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};
