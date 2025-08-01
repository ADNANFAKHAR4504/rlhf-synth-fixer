Insert here the model's failures

listener.addRedirectResponse('HttpsRedirect', {
  statusCode: 'HTTP_301',
  protocol: 'HTTPS',
  port: '443',
});

Property 'metricCpuUtilization' does not exist on type 'AutoScalingGroup'

new cloudwatch.Alarm(this, 'HighCPUAlarm', {
  metric: asg.metricCpuUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
});