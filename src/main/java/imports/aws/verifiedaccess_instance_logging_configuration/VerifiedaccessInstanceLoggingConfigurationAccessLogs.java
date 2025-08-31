package imports.aws.verifiedaccess_instance_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.574Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogs")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessInstanceLoggingConfigurationAccessLogs.Jsii$Proxy.class)
public interface VerifiedaccessInstanceLoggingConfigurationAccessLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#cloudwatch_logs VerifiedaccessInstanceLoggingConfiguration#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs getCloudwatchLogs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#include_trust_context VerifiedaccessInstanceLoggingConfiguration#include_trust_context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTrustContext() {
        return null;
    }

    /**
     * kinesis_data_firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#kinesis_data_firehose VerifiedaccessInstanceLoggingConfiguration#kinesis_data_firehose}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose getKinesisDataFirehose() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#log_version VerifiedaccessInstanceLoggingConfiguration#log_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogVersion() {
        return null;
    }

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#s3 VerifiedaccessInstanceLoggingConfiguration#s3}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 getS3() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessInstanceLoggingConfigurationAccessLogs> {
        imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs cloudwatchLogs;
        java.lang.Object includeTrustContext;
        imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose kinesisDataFirehose;
        java.lang.String logVersion;
        imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 s3;

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#cloudwatch_logs VerifiedaccessInstanceLoggingConfiguration#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getIncludeTrustContext}
         * @param includeTrustContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#include_trust_context VerifiedaccessInstanceLoggingConfiguration#include_trust_context}.
         * @return {@code this}
         */
        public Builder includeTrustContext(java.lang.Boolean includeTrustContext) {
            this.includeTrustContext = includeTrustContext;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getIncludeTrustContext}
         * @param includeTrustContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#include_trust_context VerifiedaccessInstanceLoggingConfiguration#include_trust_context}.
         * @return {@code this}
         */
        public Builder includeTrustContext(com.hashicorp.cdktf.IResolvable includeTrustContext) {
            this.includeTrustContext = includeTrustContext;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getKinesisDataFirehose}
         * @param kinesisDataFirehose kinesis_data_firehose block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#kinesis_data_firehose VerifiedaccessInstanceLoggingConfiguration#kinesis_data_firehose}
         * @return {@code this}
         */
        public Builder kinesisDataFirehose(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose kinesisDataFirehose) {
            this.kinesisDataFirehose = kinesisDataFirehose;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getLogVersion}
         * @param logVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#log_version VerifiedaccessInstanceLoggingConfiguration#log_version}.
         * @return {@code this}
         */
        public Builder logVersion(java.lang.String logVersion) {
            this.logVersion = logVersion;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#s3 VerifiedaccessInstanceLoggingConfiguration#s3}
         * @return {@code this}
         */
        public Builder s3(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessInstanceLoggingConfigurationAccessLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessInstanceLoggingConfigurationAccessLogs {
        private final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs cloudwatchLogs;
        private final java.lang.Object includeTrustContext;
        private final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose kinesisDataFirehose;
        private final java.lang.String logVersion;
        private final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 s3;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs.class));
            this.includeTrustContext = software.amazon.jsii.Kernel.get(this, "includeTrustContext", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kinesisDataFirehose = software.amazon.jsii.Kernel.get(this, "kinesisDataFirehose", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose.class));
            this.logVersion = software.amazon.jsii.Kernel.get(this, "logVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.includeTrustContext = builder.includeTrustContext;
            this.kinesisDataFirehose = builder.kinesisDataFirehose;
            this.logVersion = builder.logVersion;
            this.s3 = builder.s3;
        }

        @Override
        public final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final java.lang.Object getIncludeTrustContext() {
            return this.includeTrustContext;
        }

        @Override
        public final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsKinesisDataFirehose getKinesisDataFirehose() {
            return this.kinesisDataFirehose;
        }

        @Override
        public final java.lang.String getLogVersion() {
            return this.logVersion;
        }

        @Override
        public final imports.aws.verifiedaccess_instance_logging_configuration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 getS3() {
            return this.s3;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getIncludeTrustContext() != null) {
                data.set("includeTrustContext", om.valueToTree(this.getIncludeTrustContext()));
            }
            if (this.getKinesisDataFirehose() != null) {
                data.set("kinesisDataFirehose", om.valueToTree(this.getKinesisDataFirehose()));
            }
            if (this.getLogVersion() != null) {
                data.set("logVersion", om.valueToTree(this.getLogVersion()));
            }
            if (this.getS3() != null) {
                data.set("s3", om.valueToTree(this.getS3()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessInstanceLoggingConfigurationAccessLogs.Jsii$Proxy that = (VerifiedaccessInstanceLoggingConfigurationAccessLogs.Jsii$Proxy) o;

            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            if (this.includeTrustContext != null ? !this.includeTrustContext.equals(that.includeTrustContext) : that.includeTrustContext != null) return false;
            if (this.kinesisDataFirehose != null ? !this.kinesisDataFirehose.equals(that.kinesisDataFirehose) : that.kinesisDataFirehose != null) return false;
            if (this.logVersion != null ? !this.logVersion.equals(that.logVersion) : that.logVersion != null) return false;
            return this.s3 != null ? this.s3.equals(that.s3) : that.s3 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0;
            result = 31 * result + (this.includeTrustContext != null ? this.includeTrustContext.hashCode() : 0);
            result = 31 * result + (this.kinesisDataFirehose != null ? this.kinesisDataFirehose.hashCode() : 0);
            result = 31 * result + (this.logVersion != null ? this.logVersion.hashCode() : 0);
            result = 31 * result + (this.s3 != null ? this.s3.hashCode() : 0);
            return result;
        }
    }
}
