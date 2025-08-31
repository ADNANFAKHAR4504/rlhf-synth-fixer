package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#auto_scaling_enabled Kinesisanalyticsv2Application#auto_scaling_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoScalingEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism Kinesisanalyticsv2Application#parallelism}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getParallelism() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism_per_kpu Kinesisanalyticsv2Application#parallelism_per_kpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getParallelismPerKpu() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration> {
        java.lang.String configurationType;
        java.lang.Object autoScalingEnabled;
        java.lang.Number parallelism;
        java.lang.Number parallelismPerKpu;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration#getConfigurationType}
         * @param configurationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationType(java.lang.String configurationType) {
            this.configurationType = configurationType;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration#getAutoScalingEnabled}
         * @param autoScalingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#auto_scaling_enabled Kinesisanalyticsv2Application#auto_scaling_enabled}.
         * @return {@code this}
         */
        public Builder autoScalingEnabled(java.lang.Boolean autoScalingEnabled) {
            this.autoScalingEnabled = autoScalingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration#getAutoScalingEnabled}
         * @param autoScalingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#auto_scaling_enabled Kinesisanalyticsv2Application#auto_scaling_enabled}.
         * @return {@code this}
         */
        public Builder autoScalingEnabled(com.hashicorp.cdktf.IResolvable autoScalingEnabled) {
            this.autoScalingEnabled = autoScalingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration#getParallelism}
         * @param parallelism Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism Kinesisanalyticsv2Application#parallelism}.
         * @return {@code this}
         */
        public Builder parallelism(java.lang.Number parallelism) {
            this.parallelism = parallelism;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration#getParallelismPerKpu}
         * @param parallelismPerKpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#parallelism_per_kpu Kinesisanalyticsv2Application#parallelism_per_kpu}.
         * @return {@code this}
         */
        public Builder parallelismPerKpu(java.lang.Number parallelismPerKpu) {
            this.parallelismPerKpu = parallelismPerKpu;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration {
        private final java.lang.String configurationType;
        private final java.lang.Object autoScalingEnabled;
        private final java.lang.Number parallelism;
        private final java.lang.Number parallelismPerKpu;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationType = software.amazon.jsii.Kernel.get(this, "configurationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoScalingEnabled = software.amazon.jsii.Kernel.get(this, "autoScalingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parallelism = software.amazon.jsii.Kernel.get(this, "parallelism", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parallelismPerKpu = software.amazon.jsii.Kernel.get(this, "parallelismPerKpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationType = java.util.Objects.requireNonNull(builder.configurationType, "configurationType is required");
            this.autoScalingEnabled = builder.autoScalingEnabled;
            this.parallelism = builder.parallelism;
            this.parallelismPerKpu = builder.parallelismPerKpu;
        }

        @Override
        public final java.lang.String getConfigurationType() {
            return this.configurationType;
        }

        @Override
        public final java.lang.Object getAutoScalingEnabled() {
            return this.autoScalingEnabled;
        }

        @Override
        public final java.lang.Number getParallelism() {
            return this.parallelism;
        }

        @Override
        public final java.lang.Number getParallelismPerKpu() {
            return this.parallelismPerKpu;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configurationType", om.valueToTree(this.getConfigurationType()));
            if (this.getAutoScalingEnabled() != null) {
                data.set("autoScalingEnabled", om.valueToTree(this.getAutoScalingEnabled()));
            }
            if (this.getParallelism() != null) {
                data.set("parallelism", om.valueToTree(this.getParallelism()));
            }
            if (this.getParallelismPerKpu() != null) {
                data.set("parallelismPerKpu", om.valueToTree(this.getParallelismPerKpu()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationParallelismConfiguration.Jsii$Proxy) o;

            if (!configurationType.equals(that.configurationType)) return false;
            if (this.autoScalingEnabled != null ? !this.autoScalingEnabled.equals(that.autoScalingEnabled) : that.autoScalingEnabled != null) return false;
            if (this.parallelism != null ? !this.parallelism.equals(that.parallelism) : that.parallelism != null) return false;
            return this.parallelismPerKpu != null ? this.parallelismPerKpu.equals(that.parallelismPerKpu) : that.parallelismPerKpu == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationType.hashCode();
            result = 31 * result + (this.autoScalingEnabled != null ? this.autoScalingEnabled.hashCode() : 0);
            result = 31 * result + (this.parallelism != null ? this.parallelism.hashCode() : 0);
            result = 31 * result + (this.parallelismPerKpu != null ? this.parallelismPerKpu.hashCode() : 0);
            return result;
        }
    }
}
