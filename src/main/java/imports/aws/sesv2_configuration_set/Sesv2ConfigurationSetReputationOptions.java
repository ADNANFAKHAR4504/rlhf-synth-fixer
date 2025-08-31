package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetReputationOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetReputationOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetReputationOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReputationMetricsEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetReputationOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetReputationOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetReputationOptions> {
        java.lang.Object reputationMetricsEnabled;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetReputationOptions#getReputationMetricsEnabled}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.
         * @return {@code this}
         */
        public Builder reputationMetricsEnabled(java.lang.Boolean reputationMetricsEnabled) {
            this.reputationMetricsEnabled = reputationMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetReputationOptions#getReputationMetricsEnabled}
         * @param reputationMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.
         * @return {@code this}
         */
        public Builder reputationMetricsEnabled(com.hashicorp.cdktf.IResolvable reputationMetricsEnabled) {
            this.reputationMetricsEnabled = reputationMetricsEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetReputationOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetReputationOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetReputationOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetReputationOptions {
        private final java.lang.Object reputationMetricsEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.reputationMetricsEnabled = software.amazon.jsii.Kernel.get(this, "reputationMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.reputationMetricsEnabled = builder.reputationMetricsEnabled;
        }

        @Override
        public final java.lang.Object getReputationMetricsEnabled() {
            return this.reputationMetricsEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReputationMetricsEnabled() != null) {
                data.set("reputationMetricsEnabled", om.valueToTree(this.getReputationMetricsEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetReputationOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetReputationOptions.Jsii$Proxy that = (Sesv2ConfigurationSetReputationOptions.Jsii$Proxy) o;

            return this.reputationMetricsEnabled != null ? this.reputationMetricsEnabled.equals(that.reputationMetricsEnabled) : that.reputationMetricsEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.reputationMetricsEnabled != null ? this.reputationMetricsEnabled.hashCode() : 0;
            return result;
        }
    }
}
