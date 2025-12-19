package app.constructs;

import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.InstanceProps;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.kms.IKey;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * Minimal RDS Postgres construct creating an encrypted DB in private subnets.
 * Uses generated credentials (for demo) and KMS key for storage encryption.
 */
public class RdsConstruct extends Construct {
    private final DatabaseInstance instance;

    public RdsConstruct(final Construct scope, final String id, final Vpc vpc, final SecurityGroup dbSecurityGroup, final IKey kmsKey) {
        super(scope, id);

    this.instance = DatabaseInstance.Builder.create(this, EnvironmentConfig.getResourceName("rds", "postgres"))
        .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder().version(PostgresEngineVersion.VER_13).build()))
                .vpc(vpc)
                .securityGroups(java.util.List.of(dbSecurityGroup))
                .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE_WITH_EGRESS).build())
                .credentials(Credentials.fromGeneratedSecret("postgres"))
        .storageEncrypted(true)
        .storageEncryptionKey(kmsKey)
                        .multiAz(true)
                .allocatedStorage(20)
                .build();
    }

    public DatabaseInstance getInstance() { return instance; }
}
