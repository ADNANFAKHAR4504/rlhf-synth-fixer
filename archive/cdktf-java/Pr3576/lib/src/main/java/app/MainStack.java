package app;

import app.config.ComputeConfig;
import app.config.DatabaseConfig;
import app.config.NetworkConfig;
import app.config.SecurityConfig;
import app.constructs.MonitoringConstruct;
import app.constructs.StorageConstruct;
import app.constructs.ComputeConstruct;
import app.constructs.DatabaseConstruct;
import app.constructs.NetworkConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificate;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificateConfig;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.random_provider.provider.RandomProvider;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKey;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKeyConfig;
import com.hashicorp.cdktf.providers.tls.provider.TlsProvider;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCert;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertSubject;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.List;
import java.util.Map;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * <p>
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {
    /**
     * Creates a new MainStack with basic AWS resources.
     *
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws")
                .region("us-east-1")
                .build();

        new TlsProvider(this, "tls");

        new RandomProvider(this, "random");

        AcmCertificate certificate = createSslCertificate();

        // Load configurations
        NetworkConfig networkConfig = NetworkConfig.defaultConfig();
        ComputeConfig computeConfig = ComputeConfig.defaultConfig();
        DatabaseConfig databaseConfig = DatabaseConfig.defaultConfig();

        SecurityConfig securityConfig = new SecurityConfig(List.of("0.0.0.0/32"), List.of("80", "443"), true, 70, 1,
                certificate.getArn());

        // Create Network Infrastructure
        NetworkConstruct network = new NetworkConstruct(this, "network", networkConfig, securityConfig);

        // Create Compute Infrastructure
        ComputeConstruct compute = new ComputeConstruct(this, "compute", computeConfig, securityConfig,
                network.getVpc().getId(), network.getPublicSubnets().stream().map(Subnet::getId).toList(),
                network.getPrivateSubnets().stream().map(Subnet::getId).toList());

        // Create Database Infrastructure
        DatabaseConstruct database = new DatabaseConstruct(this, "database", databaseConfig,
                network.getVpc().getId(), network.getPrivateSubnets().stream().map(Subnet::getId).toList(),
                compute.getEc2SecurityGroup().getId());

        // Create Storage Infrastructure
        StorageConstruct storage = new StorageConstruct(this, "storage", database.getKmsKey().getArn());

        // Create Monitoring Infrastructure
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", securityConfig,
                compute.getAsg().getName(), compute.getAsg().getId());

        // Add database alarms
        monitoring.addDatabaseAlarms(database.getDatabase().getId());

        // Outputs
        TerraformOutput.Builder.create(this, "alb-dns")
                .value(compute.getAlb().getDnsName())
                .description("ALB DNS name")
                .build();

        TerraformOutput.Builder.create(this, "alb-arn")
                .value(compute.getAlb().getArn())
                .description("ALB ARN")
                .build();

        TerraformOutput.Builder.create(this, "asg-name")
                .value(compute.getAsg().getName())
                .description("Auto Scaling Group name")
                .build();

        TerraformOutput.Builder.create(this, "vpc-id")
                .value(network.getVpc().getId())
                .description("VPC ID")
                .build();

        TerraformOutput.Builder.create(this, "public-subnet-id")
                .value(network.getPublicSubnet().getId())
                .description("Public subnet ID")
                .build();

        TerraformOutput.Builder.create(this, "private-subnet-id")
                .value(network.getPrivateSubnet().getId())
                .description("Private subnet ID")
                .build();

        TerraformOutput.Builder.create(this, "db-endpoint")
                .value(database.getDatabase().getEndpoint())
                .description("RDS endpoint")
                .sensitive(true)
                .build();

        TerraformOutput.Builder.create(this, "db-name")
                .value(database.getDatabase().getDbName())
                .description("RDS database name")
                .build();

        TerraformOutput.Builder.create(this, "db-id")
                .value(database.getDatabase().getId())
                .description("RDS instance ID")
                .build();

        TerraformOutput.Builder.create(this, "assets-bucket")
                .value(storage.getAssetsBucket().getBucket())
                .description("Assets S3 bucket name")
                .build();

        TerraformOutput.Builder.create(this, "kms-key-id")
                .value(database.getKmsKey().getKeyId())
                .description("KMS key ID")
                .build();

        TerraformOutput.Builder.create(this, "kms-key-arn")
                .value(database.getKmsKey().getArn())
                .description("KMS key ARN")
                .build();

        TerraformOutput.Builder.create(this, "sns-topic-arn")
                .value(monitoring.getAlertTopic().getArn())
                .description("SNS topic ARN for alarms")
                .build();
    }

    private AcmCertificate createSslCertificate() {

        // Generate private key
        PrivateKey privateKey = new PrivateKey(this, "ssl-cert-key",
                PrivateKeyConfig.builder()
                        .algorithm("RSA")
                        .rsaBits(2048)
                        .build());

        // Create self-signed certificate
        SelfSignedCert selfSignedCert = new SelfSignedCert(this, "ssl-self-signed",
                SelfSignedCertConfig.builder()
                        .privateKeyPem(privateKey.getPrivateKeyPem())
                        .validityPeriodHours(365 * 24)
                        .subject(List.of(
                                SelfSignedCertSubject.builder()
                                        .commonName("turing.com")
                                        .organization("My Organization")
                                        .country("US")
                                        .province("CA")
                                        .locality("San Francisco")
                                        .build()
                        ))
                        .dnsNames(List.of("turing.com", "*." + "turing.com"))
                        .allowedUses(List.of("key_encipherment", "data_encipherment", "server_auth"))
                        .build());

        // Import to ACM
        return new AcmCertificate(this, "acm-cert", AcmCertificateConfig.builder()
                .privateKey(privateKey.getPrivateKeyPem())
                .certificateBody(selfSignedCert.getCertPem())
                .tags(Map.of(
                        "Name", String.format("%s-%s-cert", "Web App Certificate", "Production"),
                        "Environment", "Production"
                ))
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}