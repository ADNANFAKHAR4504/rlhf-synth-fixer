package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateLogConfiguration.Jsii$Proxy.class)
public interface FisExperimentTemplateLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_schema_version FisExperimentTemplate#log_schema_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getLogSchemaVersion();

    /**
     * cloudwatch_logs_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_logs_configuration FisExperimentTemplate#cloudwatch_logs_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration getCloudwatchLogsConfiguration() {
        return null;
    }

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration getS3Configuration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateLogConfiguration> {
        java.lang.Number logSchemaVersion;
        imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration cloudwatchLogsConfiguration;
        imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration s3Configuration;

        /**
         * Sets the value of {@link FisExperimentTemplateLogConfiguration#getLogSchemaVersion}
         * @param logSchemaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_schema_version FisExperimentTemplate#log_schema_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder logSchemaVersion(java.lang.Number logSchemaVersion) {
            this.logSchemaVersion = logSchemaVersion;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateLogConfiguration#getCloudwatchLogsConfiguration}
         * @param cloudwatchLogsConfiguration cloudwatch_logs_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_logs_configuration FisExperimentTemplate#cloudwatch_logs_configuration}
         * @return {@code this}
         */
        public Builder cloudwatchLogsConfiguration(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration cloudwatchLogsConfiguration) {
            this.cloudwatchLogsConfiguration = cloudwatchLogsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateLogConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#s3_configuration FisExperimentTemplate#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateLogConfiguration {
        private final java.lang.Number logSchemaVersion;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration cloudwatchLogsConfiguration;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration s3Configuration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logSchemaVersion = software.amazon.jsii.Kernel.get(this, "logSchemaVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLogsConfiguration = software.amazon.jsii.Kernel.get(this, "cloudwatchLogsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logSchemaVersion = java.util.Objects.requireNonNull(builder.logSchemaVersion, "logSchemaVersion is required");
            this.cloudwatchLogsConfiguration = builder.cloudwatchLogsConfiguration;
            this.s3Configuration = builder.s3Configuration;
        }

        @Override
        public final java.lang.Number getLogSchemaVersion() {
            return this.logSchemaVersion;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration getCloudwatchLogsConfiguration() {
            return this.cloudwatchLogsConfiguration;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfigurationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logSchemaVersion", om.valueToTree(this.getLogSchemaVersion()));
            if (this.getCloudwatchLogsConfiguration() != null) {
                data.set("cloudwatchLogsConfiguration", om.valueToTree(this.getCloudwatchLogsConfiguration()));
            }
            if (this.getS3Configuration() != null) {
                data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateLogConfiguration.Jsii$Proxy that = (FisExperimentTemplateLogConfiguration.Jsii$Proxy) o;

            if (!logSchemaVersion.equals(that.logSchemaVersion)) return false;
            if (this.cloudwatchLogsConfiguration != null ? !this.cloudwatchLogsConfiguration.equals(that.cloudwatchLogsConfiguration) : that.cloudwatchLogsConfiguration != null) return false;
            return this.s3Configuration != null ? this.s3Configuration.equals(that.s3Configuration) : that.s3Configuration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logSchemaVersion.hashCode();
            result = 31 * result + (this.cloudwatchLogsConfiguration != null ? this.cloudwatchLogsConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3Configuration != null ? this.s3Configuration.hashCode() : 0);
            return result;
        }
    }
}
