package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpointing_enabled Kinesisanalyticsv2Application#checkpointing_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCheckpointingEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpoint_interval Kinesisanalyticsv2Application#checkpoint_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCheckpointInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#min_pause_between_checkpoints Kinesisanalyticsv2Application#min_pause_between_checkpoints}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinPauseBetweenCheckpoints() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration> {
        java.lang.String configurationType;
        java.lang.Object checkpointingEnabled;
        java.lang.Number checkpointInterval;
        java.lang.Number minPauseBetweenCheckpoints;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration#getConfigurationType}
         * @param configurationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#configuration_type Kinesisanalyticsv2Application#configuration_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationType(java.lang.String configurationType) {
            this.configurationType = configurationType;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration#getCheckpointingEnabled}
         * @param checkpointingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpointing_enabled Kinesisanalyticsv2Application#checkpointing_enabled}.
         * @return {@code this}
         */
        public Builder checkpointingEnabled(java.lang.Boolean checkpointingEnabled) {
            this.checkpointingEnabled = checkpointingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration#getCheckpointingEnabled}
         * @param checkpointingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpointing_enabled Kinesisanalyticsv2Application#checkpointing_enabled}.
         * @return {@code this}
         */
        public Builder checkpointingEnabled(com.hashicorp.cdktf.IResolvable checkpointingEnabled) {
            this.checkpointingEnabled = checkpointingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration#getCheckpointInterval}
         * @param checkpointInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#checkpoint_interval Kinesisanalyticsv2Application#checkpoint_interval}.
         * @return {@code this}
         */
        public Builder checkpointInterval(java.lang.Number checkpointInterval) {
            this.checkpointInterval = checkpointInterval;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration#getMinPauseBetweenCheckpoints}
         * @param minPauseBetweenCheckpoints Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#min_pause_between_checkpoints Kinesisanalyticsv2Application#min_pause_between_checkpoints}.
         * @return {@code this}
         */
        public Builder minPauseBetweenCheckpoints(java.lang.Number minPauseBetweenCheckpoints) {
            this.minPauseBetweenCheckpoints = minPauseBetweenCheckpoints;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration {
        private final java.lang.String configurationType;
        private final java.lang.Object checkpointingEnabled;
        private final java.lang.Number checkpointInterval;
        private final java.lang.Number minPauseBetweenCheckpoints;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationType = software.amazon.jsii.Kernel.get(this, "configurationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.checkpointingEnabled = software.amazon.jsii.Kernel.get(this, "checkpointingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.checkpointInterval = software.amazon.jsii.Kernel.get(this, "checkpointInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minPauseBetweenCheckpoints = software.amazon.jsii.Kernel.get(this, "minPauseBetweenCheckpoints", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationType = java.util.Objects.requireNonNull(builder.configurationType, "configurationType is required");
            this.checkpointingEnabled = builder.checkpointingEnabled;
            this.checkpointInterval = builder.checkpointInterval;
            this.minPauseBetweenCheckpoints = builder.minPauseBetweenCheckpoints;
        }

        @Override
        public final java.lang.String getConfigurationType() {
            return this.configurationType;
        }

        @Override
        public final java.lang.Object getCheckpointingEnabled() {
            return this.checkpointingEnabled;
        }

        @Override
        public final java.lang.Number getCheckpointInterval() {
            return this.checkpointInterval;
        }

        @Override
        public final java.lang.Number getMinPauseBetweenCheckpoints() {
            return this.minPauseBetweenCheckpoints;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configurationType", om.valueToTree(this.getConfigurationType()));
            if (this.getCheckpointingEnabled() != null) {
                data.set("checkpointingEnabled", om.valueToTree(this.getCheckpointingEnabled()));
            }
            if (this.getCheckpointInterval() != null) {
                data.set("checkpointInterval", om.valueToTree(this.getCheckpointInterval()));
            }
            if (this.getMinPauseBetweenCheckpoints() != null) {
                data.set("minPauseBetweenCheckpoints", om.valueToTree(this.getMinPauseBetweenCheckpoints()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationFlinkApplicationConfigurationCheckpointConfiguration.Jsii$Proxy) o;

            if (!configurationType.equals(that.configurationType)) return false;
            if (this.checkpointingEnabled != null ? !this.checkpointingEnabled.equals(that.checkpointingEnabled) : that.checkpointingEnabled != null) return false;
            if (this.checkpointInterval != null ? !this.checkpointInterval.equals(that.checkpointInterval) : that.checkpointInterval != null) return false;
            return this.minPauseBetweenCheckpoints != null ? this.minPauseBetweenCheckpoints.equals(that.minPauseBetweenCheckpoints) : that.minPauseBetweenCheckpoints == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationType.hashCode();
            result = 31 * result + (this.checkpointingEnabled != null ? this.checkpointingEnabled.hashCode() : 0);
            result = 31 * result + (this.checkpointInterval != null ? this.checkpointInterval.hashCode() : 0);
            result = 31 * result + (this.minPauseBetweenCheckpoints != null ? this.minPauseBetweenCheckpoints.hashCode() : 0);
            return result;
        }
    }
}
