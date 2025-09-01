package app.constructs;

import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.AccountPrincipal;
import software.constructs.Construct;
import app.config.EnvironmentConfig;
import java.util.List;
import java.util.Map;

/**
 * Security construct that manages encryption keys and security policies.
 * This construct creates AWS KMS keys for encryption at rest and defines
 * security policies that enforce least privilege access.
 */
public class SecurityConstruct extends Construct {
    
    private final Key kmsKey;
    
    public SecurityConstruct(final Construct scope, final String id) {
        super(scope, id);
        
        // Create KMS key for encryption at rest
        this.kmsKey = createKmsKey();
    }
    
    /**
     * Creates a KMS key for encrypting data at rest.
     * The key is configured with appropriate policies for financial services compliance.
     */
    private Key createKmsKey() {
        Key key = Key.Builder.create(this, EnvironmentConfig.getResourceName("security", "kms-key"))
                .description("KMS key for financial services data encryption")
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true) // Enable automatic key rotation for enhanced security
                .policy(software.amazon.awscdk.services.iam.PolicyDocument.Builder.create()
                    .statements(List.of(
                        // Allow root account full access to the key
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(List.of(new AccountPrincipal(software.amazon.awscdk.Stack.of(this).getAccount())))
                            .actions(List.of("kms:*"))
                            .resources(List.of("*"))
                            .build(),
                        // Allow CloudTrail to use the key for log encryption
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(List.of(software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("cloudtrail.amazonaws.com").build()))
                            .actions(List.of(
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ))
                            .resources(List.of("*"))
                            .build()
                    ))
                    .build())
                .build();

        // Additionally allow CloudWatch Logs service to use this key, but scope it to
        // log groups that are related to CloudTrail in this account. We use a
        // StringLike condition with a wildcard to accommodate variations (for
        // example randomized physical names or different naming prefixes).
        String account = software.amazon.awscdk.Stack.of(this).getAccount();
        String sourceArnPattern = "arn:aws:logs:*:" + account + ":log-group:*cloudtrail*";
        key.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(List.of(software.amazon.awscdk.services.iam.ServicePrincipal.Builder.create("logs.amazonaws.com").build()))
                .actions(List.of(
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ))
                .resources(List.of("*"))
                .conditions(Map.of("StringLike", Map.of("aws:SourceArn", java.util.List.of(sourceArnPattern))))
                .build()
        );

        return key;
    }
    
    public Key getKmsKey() {
        return kmsKey;
    }
}