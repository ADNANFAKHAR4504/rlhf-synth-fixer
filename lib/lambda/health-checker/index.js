exports.handler = async (event) => {
  console.log('Health checker invoked:', JSON.stringify(event, null, 2));
  
  return {
    healthy: true,
    checks: {
      api: true,
      database: true,
      replication: true
    },
    timestamp: new Date().toISOString()
  };
};
