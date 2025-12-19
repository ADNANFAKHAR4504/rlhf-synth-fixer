exports.handler = async (event) => {
  console.log('Chaos runner invoked:', JSON.stringify(event, null, 2));
  
  return {
    status: 'success',
    testScenario: event.testScenario || 'unknown',
    result: 'Chaos test completed',
    timestamp: new Date().toISOString()
  };
};
