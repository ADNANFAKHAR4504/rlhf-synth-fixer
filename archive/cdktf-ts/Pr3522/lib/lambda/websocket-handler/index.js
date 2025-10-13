exports.handler = async (event) => {
    const { requestContext: { eventType, connectionId } } = event;
    console.log('WebSocket event:', eventType, 'Connection:', connectionId);

    if (eventType === 'CONNECT') {
        return { statusCode: 200, body: 'Connected' };
    } else if (eventType === 'DISCONNECT') {
        return { statusCode: 200, body: 'Disconnected' };
    } else {
        return { statusCode: 200, body: 'Message received' };
    }
};
