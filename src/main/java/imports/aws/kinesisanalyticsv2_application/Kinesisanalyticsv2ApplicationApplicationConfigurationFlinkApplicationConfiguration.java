package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * checkpoint_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpoint_configuration Kinesisanalyticsv2Application#checkpoint_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration getCheckpointConfiguration() {
        return null;
    }

    /**
     * monitoring_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#monitoring_configuration Kinesisanalyticsv2Application#monitoring_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration getMonitoringConfiguration() {
        return null;
    }

    /**
     * parallelism_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism_configuration Kinesisanalyticsv2Application#parallelism_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration getParallelismConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration> {
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration checkpointConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration monitoringConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration parallelismConfiguration;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration#getCheckpointConfiguration}
         * @param checkpointConfiguration checkpoint_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpoint_configuration Kinesisanalyticsv2Application#checkpoint_configuration}
         * @return {@code this}
         */
        public Builder checkpointConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration checkpointConfiguration) {
            this.checkpointConfiguration = checkpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration#getMonitoringConfiguration}
         * @param monitoringConfiguration monitoring_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#monitoring_configuration Kinesisanalyticsv2Application#monitoring_configuration}
         * @return {@code this}
         */
        public Builder monitoringConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration monitoringConfiguration) {
            this.monitoringConfiguration = monitoringConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration#getParallelismConfiguration}
         * @param parallelismConfiguration parallelism_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism_configuration Kinesisanalyticsv2Application#parallelism_configuration}
         * @return {@code this}
         */
        public Builder parallelismConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration parallelismConfiguration) {
            this.parallelismConfiguration = parallelismConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration {
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration checkpointConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration monitoringConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration parallelismConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.checkpointConfiguration = software.amazon.jsii.Kernel.get(this, "checkpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration.class));
            this.monitoringConfiguration = software.amazon.jsii.Kernel.get(this, "monitoringConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration.class));
            this.parallelismConfiguration = software.amazon.jsii.Kernel.get(this, "parallelismConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.checkpointConfiguration = builder.checkpointConfiguration;
            this.monitoringConfiguration = builder.monitoringConfiguration;
            this.parallelismConfiguration = builder.parallelismConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration getCheckpointConfiguration() {
            return this.checkpointConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationMonitoringConfiguration getMonitoringConfiguration() {
            return this.monitoringConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration getParallelismConfiguration() {
            return this.parallelismConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCheckpointConfiguration() != null) {
                data.set("checkpointConfiguration", om.valueToTree(this.getCheckpointConfiguration()));
            }
            if (this.getMonitoringConfiguration() != null) {
                data.set("monitoringConfiguration", om.valueToTree(this.getMonitoringConfiguration()));
            }
            if (this.getParallelismConfiguration() != null) {
                data.set("parallelismConfiguration", om.valueToTree(this.getParallelismConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfiguration.Jsii$Proxy) o;

            if (this.checkpointConfiguration != null ? !this.checkpointConfiguration.equals(that.checkpointConfiguration) : that.checkpointConfiguration != null) return false;
            if (this.monitoringConfiguration != null ? !this.monitoringConfiguration.equals(that.monitoringConfiguration) : that.monitoringConfiguration != null) return false;
            return this.parallelismConfiguration != null ? this.parallelismConfiguration.equals(that.parallelismConfiguration) : that.parallelismConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.checkpointConfiguration != null ? this.checkpointConfiguration.hashCode() : 0;
            result = 31 * result + (this.monitoringConfiguration != null ? this.monitoringConfiguration.hashCode() : 0);
            result = 31 * result + (this.parallelismConfiguration != null ? this.parallelismConfiguration.hashCode() : 0);
            return result;
        }
    }
}
