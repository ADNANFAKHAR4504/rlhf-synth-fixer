package app.constructs;

import app.config.DatabaseConfig;
import com.hashicorp.cdktf.providers.aws.db_instance.DbInstance;
import com.hashicorp.cdktf.providers.aws.db_subnet_group.DbSubnetGroup;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.secretsmanager_secret.SecretsmanagerSecret;
import com.hashicorp.cdktf.providers.aws.secretsmanager_secret_version.SecretsmanagerSecretVersion;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import com.hashicorp.cdktf.providers.random_provider.password.Password;
import com.hashicorp.cdktf.providers.random_provider.password.PasswordConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class DatabaseConstruct extends Construct {

    private final DbInstance database;

    private final SecretsmanagerSecret dbSecret;

    private final KmsKey kmsKey;

    private final SecurityGroup dbSecurityGroup;

    public DatabaseConstruct(final Construct scope, final String id, final DatabaseConfig config, final String vpcId,
                             final List<String> subnetIds, final String appSecurityGroupId) {
        super(scope, id);

        // Create KMS key for encryption
        this.kmsKey = KmsKey.Builder.create(this, "db-kms-key")
                .description("KMS key for RDS encryption")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "RDS Encryption Key"))
                .build();

        KmsAlias.Builder.create(this, "db-kms-alias")
                .name("alias/rds-encryption")
                .targetKeyId(kmsKey.getId())
                .build();

        // Create DB subnet group
        DbSubnetGroup dbSubnetGroup = DbSubnetGroup.Builder.create(this, "db-subnet-group")
                .name("web-app-db-subnet-group")
                .subnetIds(subnetIds)
                .tags(Map.of("Name", "Database Subnet Group"))
                .build();

        // Create security group for RDS
        this.dbSecurityGroup = createDbSecurityGroup(vpcId, appSecurityGroupId);

        Password dbPassword = new Password(this, "db-password",
                PasswordConfig.builder()
                        .length(32)
                        .special(true)
                        .overrideSpecial("!#$%&*()-_=+[]{}:?")
                        .build());

        this.dbSecret = SecretsmanagerSecret.Builder.create(this, "db-secret")
                .name("rds-credentials")
                .description("RDS database credentials")
                .kmsKeyId(kmsKey.getId())
                .build();

        SecretsmanagerSecretVersion.Builder.create(this, "db-secret-version")
                .secretId(dbSecret.getId())
                .secretString(dbPassword.getResult())
                .build();

        // Create RDS instance
        this.database = DbInstance.Builder.create(this, "database")
                .identifier("web-app-db")
                .engine(config.engine())
                .engineVersion(config.engineVersion())
                .instanceClass(config.instanceClass())
                .allocatedStorage(config.allocatedStorage())
                .storageType("gp3")
                .storageEncrypted(true)
                .kmsKeyId(kmsKey.getArn())
                .dbName(config.databaseName())
                .username(config.masterUsername())
                .password(dbPassword.getResult())
                .dbSubnetGroupName(dbSubnetGroup.getName())
                .vpcSecurityGroupIds(List.of(dbSecurityGroup.getId()))
                .multiAz(config.multiAz())
                .backupRetentionPeriod(config.backupRetentionPeriod())
                .backupWindow(config.backupWindow())
                .maintenanceWindow(config.maintenanceWindow())
                .autoMinorVersionUpgrade(true)
                .deletionProtection(true)
                .enabledCloudwatchLogsExports(List.of("error", "general", "slowquery"))
                .performanceInsightsEnabled(true)
                .performanceInsightsRetentionPeriod(7)
                .tags(Map.of(
                        "Name", "Web App Database",
                        "Environment", "Production"
                ))
                .build();
    }

    private SecurityGroup createDbSecurityGroup(final String vpcId, final String appSecurityGroupId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "db-sg")
                .name("rds-security-group")
                .description("Security group for RDS database")
                .vpcId(vpcId)
                .tags(Map.of("Name", "RDS Security Group"))
                .build();

        // Allow traffic from app security group
        SecurityGroupRule.Builder.create(this, "db-app-rule")
                .type("ingress")
                .fromPort(3306)
                .toPort(3306)
                .protocol("tcp")
                .sourceSecurityGroupId(appSecurityGroupId)
                .securityGroupId(securityGroup.getId())
                .build();

        return securityGroup;
    }

    // Getters
    public DbInstance getDatabase() {
        return database;
    }

    public SecretsmanagerSecret getDbSecret() {
        return dbSecret;
    }

    public KmsKey getKmsKey() {
        return kmsKey;
    }

    public SecurityGroup getDbSecurityGroup() {
        return dbSecurityGroup;
    }
}
