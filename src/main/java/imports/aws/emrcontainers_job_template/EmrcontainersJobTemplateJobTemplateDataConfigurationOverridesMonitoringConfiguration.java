package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloud_watch_monitoring_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#cloud_watch_monitoring_configuration EmrcontainersJobTemplate#cloud_watch_monitoring_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration getCloudWatchMonitoringConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#persistent_app_ui EmrcontainersJobTemplate#persistent_app_ui}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPersistentAppUi() {
        return null;
    }

    /**
     * s3_monitoring_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#s3_monitoring_configuration EmrcontainersJobTemplate#s3_monitoring_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration getS3MonitoringConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration> {
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration cloudWatchMonitoringConfiguration;
        java.lang.String persistentAppUi;
        imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration s3MonitoringConfiguration;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration#getCloudWatchMonitoringConfiguration}
         * @param cloudWatchMonitoringConfiguration cloud_watch_monitoring_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#cloud_watch_monitoring_configuration EmrcontainersJobTemplate#cloud_watch_monitoring_configuration}
         * @return {@code this}
         */
        public Builder cloudWatchMonitoringConfiguration(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration cloudWatchMonitoringConfiguration) {
            this.cloudWatchMonitoringConfiguration = cloudWatchMonitoringConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration#getPersistentAppUi}
         * @param persistentAppUi Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#persistent_app_ui EmrcontainersJobTemplate#persistent_app_ui}.
         * @return {@code this}
         */
        public Builder persistentAppUi(java.lang.String persistentAppUi) {
            this.persistentAppUi = persistentAppUi;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration#getS3MonitoringConfiguration}
         * @param s3MonitoringConfiguration s3_monitoring_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#s3_monitoring_configuration EmrcontainersJobTemplate#s3_monitoring_configuration}
         * @return {@code this}
         */
        public Builder s3MonitoringConfiguration(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration s3MonitoringConfiguration) {
            this.s3MonitoringConfiguration = s3MonitoringConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration {
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration cloudWatchMonitoringConfiguration;
        private final java.lang.String persistentAppUi;
        private final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration s3MonitoringConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudWatchMonitoringConfiguration = software.amazon.jsii.Kernel.get(this, "cloudWatchMonitoringConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration.class));
            this.persistentAppUi = software.amazon.jsii.Kernel.get(this, "persistentAppUi", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3MonitoringConfiguration = software.amazon.jsii.Kernel.get(this, "s3MonitoringConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudWatchMonitoringConfiguration = builder.cloudWatchMonitoringConfiguration;
            this.persistentAppUi = builder.persistentAppUi;
            this.s3MonitoringConfiguration = builder.s3MonitoringConfiguration;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationCloudWatchMonitoringConfiguration getCloudWatchMonitoringConfiguration() {
            return this.cloudWatchMonitoringConfiguration;
        }

        @Override
        public final java.lang.String getPersistentAppUi() {
            return this.persistentAppUi;
        }

        @Override
        public final imports.aws.emrcontainers_job_template.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfigurationS3MonitoringConfiguration getS3MonitoringConfiguration() {
            return this.s3MonitoringConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudWatchMonitoringConfiguration() != null) {
                data.set("cloudWatchMonitoringConfiguration", om.valueToTree(this.getCloudWatchMonitoringConfiguration()));
            }
            if (this.getPersistentAppUi() != null) {
                data.set("persistentAppUi", om.valueToTree(this.getPersistentAppUi()));
            }
            if (this.getS3MonitoringConfiguration() != null) {
                data.set("s3MonitoringConfiguration", om.valueToTree(this.getS3MonitoringConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataConfigurationOverridesMonitoringConfiguration.Jsii$Proxy) o;

            if (this.cloudWatchMonitoringConfiguration != null ? !this.cloudWatchMonitoringConfiguration.equals(that.cloudWatchMonitoringConfiguration) : that.cloudWatchMonitoringConfiguration != null) return false;
            if (this.persistentAppUi != null ? !this.persistentAppUi.equals(that.persistentAppUi) : that.persistentAppUi != null) return false;
            return this.s3MonitoringConfiguration != null ? this.s3MonitoringConfiguration.equals(that.s3MonitoringConfiguration) : that.s3MonitoringConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudWatchMonitoringConfiguration != null ? this.cloudWatchMonitoringConfiguration.hashCode() : 0;
            result = 31 * result + (this.persistentAppUi != null ? this.persistentAppUi.hashCode() : 0);
            result = 31 * result + (this.s3MonitoringConfiguration != null ? this.s3MonitoringConfiguration.hashCode() : 0);
            return result;
        }
    }
}
