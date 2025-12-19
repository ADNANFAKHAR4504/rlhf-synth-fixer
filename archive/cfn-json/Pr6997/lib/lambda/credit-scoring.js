```javascript
/**
 * Credit Scoring Lambda Function
 *
 * This function handles credit scoring requests from the ALB.
 * It extracts customer data from the request, performs credit scoring logic,
 * and returns a credit score and approval status.
 */

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Extract request data
        const body = event.body ? JSON.parse(event.body) : {};
        const customerId = body.customerId || 'unknown';
        const income = body.income || 0;
        const creditHistory = body.creditHistory || 0;

        // Simple credit scoring logic (placeholder)
        let score = 600; // Base score

        // Adjust score based on income
        if (income > 100000) {
            score += 100;
        } else if (income > 50000) {
            score += 50;
        }

        // Adjust score based on credit history (years)
        score += Math.min(creditHistory * 10, 100);

        // Cap score at 850
        score = Math.min(score, 850);

        // Determine approval status
        const status = score >= 700 ? 'approved' : 'declined';

        // Log the scoring decision
        console.log(`Credit scoring for customer ${customerId}: score=${score}, status=${status}`);

        // Return response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                customerId: customerId,
                score: score,
                status: status,
                timestamp: new Date().toISOString()
            })
        };

        return response;

    } catch (error) {
        console.error('Error processing credit scoring request:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
