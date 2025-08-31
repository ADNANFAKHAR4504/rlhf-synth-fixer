package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#log_level Kinesisanalyticsv2Application#log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#metrics_level Kinesisanalyticsv2Application#metrics_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricsLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration> {
        java.lang.String configurationType;
        java.lang.String logLevel;
        java.lang.String metricsLevel;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration#getConfigurationType}
         * @param configurationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationType(java.lang.String configurationType) {
            this.configurationType = configurationType;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration#getLogLevel}
         * @param logLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#log_level Kinesisanalyticsv2Application#log_level}.
         * @return {@code this}
         */
        public Builder logLevel(java.lang.String logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration#getMetricsLevel}
         * @param metricsLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#metrics_level Kinesisanalyticsv2Application#metrics_level}.
         * @return {@code this}
         */
        public Builder metricsLevel(java.lang.String metricsLevel) {
            this.metricsLevel = metricsLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration {
        private final java.lang.String configurationType;
        private final java.lang.String logLevel;
        private final java.lang.String metricsLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationType = software.amazon.jsii.Kernel.get(this, "configurationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logLevel = software.amazon.jsii.Kernel.get(this, "logLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricsLevel = software.amazon.jsii.Kernel.get(this, "metricsLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationType = java.util.Objects.requireNonNull(builder.configurationType, "configurationType is required");
            this.logLevel = builder.logLevel;
            this.metricsLevel = builder.metricsLevel;
        }

        @Override
        public final java.lang.String getConfigurationType() {
            return this.configurationType;
        }

        @Override
        public final java.lang.String getLogLevel() {
            return this.logLevel;
        }

        @Override
        public final java.lang.String getMetricsLevel() {
            return this.metricsLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configurationType", om.valueToTree(this.getConfigurationType()));
            if (this.getLogLevel() != null) {
                data.set("logLevel", om.valueToTree(this.getLogLevel()));
            }
            if (this.getMetricsLevel() != null) {
                data.set("metricsLevel", om.valueToTree(this.getMetricsLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration.Jsii$Proxy) o;

            if (!configurationType.equals(that.configurationType)) return false;
            if (this.logLevel != null ? !this.logLevel.equals(that.logLevel) : that.logLevel != null) return false;
            return this.metricsLevel != null ? this.metricsLevel.equals(that.metricsLevel) : that.metricsLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationType.hashCode();
            result = 31 * result + (this.logLevel != null ? this.logLevel.hashCode() : 0);
            result = 31 * result + (this.metricsLevel != null ? this.metricsLevel.hashCode() : 0);
            return result;
        }
    }
}
