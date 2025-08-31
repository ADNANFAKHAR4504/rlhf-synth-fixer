package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.470Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#allow_non_restored_state Kinesisanalyticsv2Application#allow_non_restored_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowNonRestoredState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration> {
        java.lang.Object allowNonRestoredState;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration#getAllowNonRestoredState}
         * @param allowNonRestoredState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#allow_non_restored_state Kinesisanalyticsv2Application#allow_non_restored_state}.
         * @return {@code this}
         */
        public Builder allowNonRestoredState(java.lang.Boolean allowNonRestoredState) {
            this.allowNonRestoredState = allowNonRestoredState;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration#getAllowNonRestoredState}
         * @param allowNonRestoredState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#allow_non_restored_state Kinesisanalyticsv2Application#allow_non_restored_state}.
         * @return {@code this}
         */
        public Builder allowNonRestoredState(com.hashicorp.cdktf.IResolvable allowNonRestoredState) {
            this.allowNonRestoredState = allowNonRestoredState;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration {
        private final java.lang.Object allowNonRestoredState;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowNonRestoredState = software.amazon.jsii.Kernel.get(this, "allowNonRestoredState", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowNonRestoredState = builder.allowNonRestoredState;
        }

        @Override
        public final java.lang.Object getAllowNonRestoredState() {
            return this.allowNonRestoredState;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowNonRestoredState() != null) {
                data.set("allowNonRestoredState", om.valueToTree(this.getAllowNonRestoredState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationFlinkRunConfiguration.Jsii$Proxy) o;

            return this.allowNonRestoredState != null ? this.allowNonRestoredState.equals(that.allowNonRestoredState) : that.allowNonRestoredState == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowNonRestoredState != null ? this.allowNonRestoredState.hashCode() : 0;
            return result;
        }
    }
}
