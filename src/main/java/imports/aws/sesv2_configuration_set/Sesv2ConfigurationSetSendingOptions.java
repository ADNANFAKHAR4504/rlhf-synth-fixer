package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSendingOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetSendingOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetSendingOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSendingEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetSendingOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetSendingOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetSendingOptions> {
        java.lang.Object sendingEnabled;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetSendingOptions#getSendingEnabled}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.
         * @return {@code this}
         */
        public Builder sendingEnabled(java.lang.Boolean sendingEnabled) {
            this.sendingEnabled = sendingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetSendingOptions#getSendingEnabled}
         * @param sendingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.
         * @return {@code this}
         */
        public Builder sendingEnabled(com.hashicorp.cdktf.IResolvable sendingEnabled) {
            this.sendingEnabled = sendingEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetSendingOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetSendingOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetSendingOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetSendingOptions {
        private final java.lang.Object sendingEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sendingEnabled = software.amazon.jsii.Kernel.get(this, "sendingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sendingEnabled = builder.sendingEnabled;
        }

        @Override
        public final java.lang.Object getSendingEnabled() {
            return this.sendingEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSendingEnabled() != null) {
                data.set("sendingEnabled", om.valueToTree(this.getSendingEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSendingOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetSendingOptions.Jsii$Proxy that = (Sesv2ConfigurationSetSendingOptions.Jsii$Proxy) o;

            return this.sendingEnabled != null ? this.sendingEnabled.equals(that.sendingEnabled) : that.sendingEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sendingEnabled != null ? this.sendingEnabled.hashCode() : 0;
            return result;
        }
    }
}
