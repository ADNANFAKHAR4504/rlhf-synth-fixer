package com.banking;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
import com.banking.models.Transaction;
import com.banking.models.TransactionRequest;
import com.banking.models.TransactionResponse;
import com.banking.models.FraudCheckResult;
import com.banking.services.FraudCheckService;
import com.banking.services.TransactionService;
import com.banking.services.IdempotencyService;
import com.banking.services.NotificationService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AWS Lambda handler for processing banking transactions.
 * 
 * This handler orchestrates the transaction processing flow:
 * 1. Validates incoming transaction request
 * 2. Checks for duplicate transactions (idempotency)
 * 3. Calls fraud detection service
 * 4. Processes approved transactions
 * 5. Stores transaction in DynamoDB
 * 6. Publishes events to Kinesis and SQS
 * 7. Returns response to client
 * 
 * Supports: Payments, Transfers, Withdrawals, Deposits
 * 
 * @author Turing Banking Platform Team
 * @version 1.0.0
 */
public class TransactionHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static final String ENVIRONMENT = System.getenv("ENVIRONMENT");
    
    // Transaction limits
    private static final double MAX_TRANSACTION_AMOUNT = 50000.00;
    private static final double MIN_TRANSACTION_AMOUNT = 0.01;
    
    private final TransactionService transactionService;
    private final FraudCheckService fraudCheckService;
    private final IdempotencyService idempotencyService;
    private final NotificationService notificationService;
    
    /**
     * Default constructor - initializes services
     */
    public TransactionHandler() {
        this.transactionService = new TransactionService();
        this.fraudCheckService = new FraudCheckService();
        this.idempotencyService = new IdempotencyService();
        this.notificationService = new NotificationService();
    }
    
    /**
     * Constructor for dependency injection (testing)
     */
    public TransactionHandler(TransactionService transactionService,
                             FraudCheckService fraudCheckService,
                             IdempotencyService idempotencyService,
                             NotificationService notificationService) {
        this.transactionService = transactionService;
        this.fraudCheckService = fraudCheckService;
        this.idempotencyService = idempotencyService;
        this.notificationService = notificationService;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        LambdaLogger logger = context.getLogger();
        String requestId = context.getRequestId();
        
        logger.log("Processing transaction request - RequestId: " + requestId);
        
        Subsegment subsegment = AWSXRay.beginSubsegment("TransactionProcessing");
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. Parse and validate request
            TransactionRequest request = parseRequest(input, logger);
            if (request == null) {
                return createErrorResponse(400, "Invalid request format");
            }
            
            subsegment.putMetadata("request", request);
            logger.log("Transaction request parsed - Type: " + request.getType() + 
                      " | Amount: " + request.getAmount() + " " + request.getCurrency());
            
            // 2. Validate transaction
            String validationError = validateTransaction(request);
            if (validationError != null) {
                logger.log("Validation failed: " + validationError);
                return createErrorResponse(400, validationError);
            }
            
            // 3. Check for idempotency (duplicate detection)
            String idempotencyKey = request.getIdempotencyKey();
            if (idempotencyKey != null) {
                TransactionResponse cachedResponse = idempotencyService.checkIdempotency(idempotencyKey);
                if (cachedResponse != null) {
                    logger.log("Duplicate request detected - returning cached response");
                    return createSuccessResponse(cachedResponse);
                }
            }
            
            // 4. Generate transaction ID
            String transactionId = generateTransactionId();
            logger.log("Generated transaction ID: " + transactionId);
            
            // 5. Perform fraud check
            logger.log("Calling fraud detection service...");
            FraudCheckResult fraudResult = fraudCheckService.checkFraud(request, transactionId);
            subsegment.putMetadata("fraudResult", fraudResult);
            
            logger.log("Fraud check completed - Score: " + fraudResult.getFraudScore() + 
                      " | Approved: " + fraudResult.isApproved());
            
            // 6. Process based on fraud result
            TransactionResponse response;
            
            if (!fraudResult.isApproved()) {
                // Transaction rejected due to fraud
                response = handleRejectedTransaction(request, transactionId, fraudResult, logger);
            } else if (fraudResult.isRequiresManualReview()) {
                // Transaction pending manual review
                response = handlePendingTransaction(request, transactionId, fraudResult, logger);
            } else {
                // Transaction approved - process it
                response = processApprovedTransaction(request, transactionId, fraudResult, logger);
            }
            
            // 7. Cache response for idempotency
            if (idempotencyKey != null) {
                idempotencyService.cacheResponse(idempotencyKey, response);
            }
            
            // 8. Calculate processing time
            long processingTime = System.currentTimeMillis() - startTime;
            response.setProcessingTimeMs(processingTime);
            
            logger.log("Transaction processing completed - ID: " + transactionId + 
                      " | Status: " + response.getStatus() + 
                      " | Time: " + processingTime + "ms");
            
            subsegment.putMetadata("response", response);
            
            return createSuccessResponse(response);
            
        } catch (Exception e) {
            logger.log("ERROR processing transaction: " + e.getMessage());
            e.printStackTrace();
            subsegment.addException(e);
            
            return createErrorResponse(500, "Transaction processing failed: " + e.getMessage());
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Parse API Gateway request into TransactionRequest
     */
    private TransactionRequest parseRequest(APIGatewayProxyRequestEvent input, LambdaLogger logger) {
        try {
            String body = input.getBody();
            if (body == null || body.isEmpty()) {
                return null;
            }
            
            TransactionRequest request = gson.fromJson(body, TransactionRequest.class);
            
            // Extract headers for additional context
            Map<String, String> headers = input.getHeaders();
            if (headers != null) {
                request.setIpAddress(headers.get("X-Forwarded-For"));
                request.setUserAgent(headers.get("User-Agent"));
                
                // Idempotency key from header
                if (headers.containsKey("Idempotency-Key")) {
                    request.setIdempotencyKey(headers.get("Idempotency-Key"));
                }
            }
            
            // Extract authenticated user from context
            if (input.getRequestContext() != null && 
                input.getRequestContext().getAuthorizer() != null) {
                Map<String, Object> authorizer = input.getRequestContext().getAuthorizer();
                if (authorizer.containsKey("claims")) {
                    @SuppressWarnings("unchecked")
                    Map<String, String> claims = (Map<String, String>) authorizer.get("claims");
                    request.setCustomerId(claims.get("sub"));
                    request.setCustomerEmail(claims.get("email"));
                }
            }
            
            return request;
            
        } catch (Exception e) {
            logger.log("Error parsing request: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Validate transaction request
     */
    private String validateTransaction(TransactionRequest request) {
        // Required fields
        if (request.getAmount() <= 0) {
            return "Amount must be greater than 0";
        }
        
        if (request.getCurrency() == null || request.getCurrency().isEmpty()) {
            return "Currency is required";
        }
        
        if (request.getType() == null || request.getType().isEmpty()) {
            return "Transaction type is required";
        }
        
        // Amount limits
        if (request.getAmount() < MIN_TRANSACTION_AMOUNT) {
            return "Amount below minimum: " + MIN_TRANSACTION_AMOUNT;
        }
        
        if (request.getAmount() > MAX_TRANSACTION_AMOUNT) {
            return "Amount exceeds maximum: " + MAX_TRANSACTION_AMOUNT;
        }
        
        // Validate currency code
        if (!isValidCurrency(request.getCurrency())) {
            return "Invalid currency code: " + request.getCurrency();
        }
        
        // Validate transaction type
        if (!isValidTransactionType(request.getType())) {
            return "Invalid transaction type: " + request.getType();
        }
        
        // Type-specific validation
        switch (request.getType().toUpperCase()) {
            case "TRANSFER":
                if (request.getToAccountId() == null || request.getToAccountId().isEmpty()) {
                    return "Destination account required for transfers";
                }
                break;
            case "PAYMENT":
                if (request.getMerchantId() == null || request.getMerchantId().isEmpty()) {
                    return "Merchant ID required for payments";
                }
                break;
        }
        
        return null; // Valid
    }
    
    /**
     * Process approved transaction
     */
    private TransactionResponse processApprovedTransaction(TransactionRequest request, 
                                                          String transactionId,
                                                          FraudCheckResult fraudResult,
                                                          LambdaLogger logger) {
        logger.log("Processing approved transaction: " + transactionId);
        
        Subsegment subsegment = AWSXRay.beginSubsegment("ProcessApprovedTransaction");
        
        try {
            // Create transaction record
            Transaction transaction = createTransaction(request, transactionId, "APPROVED", fraudResult);
            
            // Save to DynamoDB
            transactionService.saveTransaction(transaction);
            logger.log("Transaction saved to DynamoDB");
            
            // Publish to Kinesis stream for real-time processing
            transactionService.publishToKinesis(transaction);
            logger.log("Transaction published to Kinesis");
            
            // Send to SQS for async processing (notifications, accounting, etc.)
            transactionService.sendToQueue(transaction);
            logger.log("Transaction sent to SQS queue");
            
            // Send customer notification
            notificationService.sendTransactionNotification(transaction, "APPROVED");
            
            // Build response
            TransactionResponse response = new TransactionResponse();
            response.setTransactionId(transactionId);
            response.setStatus("APPROVED");
            response.setMessage("Transaction processed successfully");
            response.setAmount(request.getAmount());
            response.setCurrency(request.getCurrency());
            response.setFraudScore(fraudResult.getFraudScore());
            response.setTimestamp(Instant.now().toString());
            
            subsegment.putMetadata("transaction", transaction);
            return response;
            
        } catch (Exception e) {
            logger.log("Error processing approved transaction: " + e.getMessage());
            subsegment.addException(e);
            throw new RuntimeException("Failed to process transaction", e);
            
        } finally {
            AWSXRay.endSubsegment();
        }
    }
    
    /**
     * Handle rejected transaction (fraud detected)
     */
    private TransactionResponse handleRejectedTransaction(TransactionRequest request,
                                                          String transactionId,
                                                          FraudCheckResult fraudResult,
                                                          LambdaLogger logger) {
        logger.log("Transaction rejected - fraud detected: " + transactionId);
        
        // Create transaction record with REJECTED status
        Transaction transaction = createTransaction(request, transactionId, "REJECTED", fraudResult);
        
        try {
            // Save rejected transaction for audit trail
            transactionService.saveTransaction(transaction);
            
            // Publish fraud alert
            transactionService.publishFraudAlert(transaction, fraudResult);
            
            // Send customer notification
            notificationService.sendTransactionNotification(transaction, "REJECTED");
            
        } catch (Exception e) {
            logger.log("Error saving rejected transaction: " + e.getMessage());
            // Continue - rejection is still valid even if logging fails
        }
        
        // Build response
        TransactionResponse response = new TransactionResponse();
        response.setTransactionId(transactionId);
        response.setStatus("REJECTED");
        response.setMessage("Transaction rejected due to security concerns");
        response.setAmount(request.getAmount());
        response.setCurrency(request.getCurrency());
        response.setFraudScore(fraudResult.getFraudScore());
        response.setReasons(fraudResult.getReasons());
        response.setTimestamp(Instant.now().toString());
        
        return response;
    }
    
    /**
     * Handle transaction pending manual review
     */
    private TransactionResponse handlePendingTransaction(TransactionRequest request,
                                                        String transactionId,
                                                        FraudCheckResult fraudResult,
                                                        LambdaLogger logger) {
        logger.log("Transaction pending manual review: " + transactionId);
        
        // Create transaction record with PENDING status
        Transaction transaction = createTransaction(request, transactionId, "PENDING_REVIEW", fraudResult);
        
        try {
            // Save pending transaction
            transactionService.saveTransaction(transaction);
            
            // Send to manual review queue
            transactionService.sendToReviewQueue(transaction, fraudResult);
            
            // Send customer notification
            notificationService.sendTransactionNotification(transaction, "PENDING_REVIEW");
            
        } catch (Exception e) {
            logger.log("Error saving pending transaction: " + e.getMessage());
            throw new RuntimeException("Failed to queue transaction for review", e);
        }
        
        // Build response
        TransactionResponse response = new TransactionResponse();
        response.setTransactionId(transactionId);
        response.setStatus("PENDING_REVIEW");
        response.setMessage("Transaction is under review. You will be notified once reviewed.");
        response.setAmount(request.getAmount());
        response.setCurrency(request.getCurrency());
        response.setFraudScore(fraudResult.getFraudScore());
        response.setReasons(fraudResult.getReasons());
        response.setTimestamp(Instant.now().toString());
        response.setEstimatedReviewTime("24 hours");
        
        return response;
    }
    
    /**
     * Create Transaction object from request
     */
    private Transaction createTransaction(TransactionRequest request, 
                                         String transactionId,
                                         String status,
                                         FraudCheckResult fraudResult) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(transactionId);
        transaction.setCustomerId(request.getCustomerId());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setType(request.getType());
        transaction.setStatus(status);
        transaction.setDescription(request.getDescription());
        transaction.setMerchantId(request.getMerchantId());
        transaction.setMerchantName(request.getMerchantName());
        transaction.setFromAccountId(request.getFromAccountId());
        transaction.setToAccountId(request.getToAccountId());
        transaction.setSourceCountry(request.getSourceCountry());
        transaction.setIpAddress(request.getIpAddress());
        transaction.setDeviceId(request.getDeviceId());
        transaction.setFraudScore(fraudResult.getFraudScore());
        transaction.setFraudRiskLevel(fraudResult.getRiskLevel());
        transaction.setTimestamp(System.currentTimeMillis());
        transaction.setCreatedAt(Instant.now().toString());
        
        return transaction;
    }
    
    /**
     * Generate unique transaction ID
     */
    private String generateTransactionId() {
        return "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    /**
     * Validate currency code
     */
    private boolean isValidCurrency(String currency) {
        String[] validCurrencies = {"USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NGN", "INR"};
        for (String valid : validCurrencies) {
            if (valid.equalsIgnoreCase(currency)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Validate transaction type
     */
    private boolean isValidTransactionType(String type) {
        String[] validTypes = {"PAYMENT", "TRANSFER", "WITHDRAWAL", "DEPOSIT", "REFUND"};
        for (String valid : validTypes) {
            if (valid.equalsIgnoreCase(type)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Create success response
     */
    private APIGatewayProxyResponseEvent createSuccessResponse(TransactionResponse response) {
        APIGatewayProxyResponseEvent apiResponse = new APIGatewayProxyResponseEvent();
        apiResponse.setStatusCode(200);
        apiResponse.setBody(gson.toJson(response));
        
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("X-Transaction-Id", response.getTransactionId());
        apiResponse.setHeaders(headers);
        
        return apiResponse;
    }
    
    /**
     * Create error response
     */
    private APIGatewayProxyResponseEvent createErrorResponse(int statusCode, String message) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        body.put("timestamp", Instant.now().toString());
        response.setBody(gson.toJson(body));
        
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        response.setHeaders(headers);
        
        return response;
    }
}
