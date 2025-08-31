package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetDeliveryOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetDeliveryOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetDeliveryOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#max_delivery_seconds Sesv2ConfigurationSet#max_delivery_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxDeliverySeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_pool_name Sesv2ConfigurationSet#sending_pool_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSendingPoolName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tls_policy Sesv2ConfigurationSet#tls_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetDeliveryOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetDeliveryOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetDeliveryOptions> {
        java.lang.Number maxDeliverySeconds;
        java.lang.String sendingPoolName;
        java.lang.String tlsPolicy;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetDeliveryOptions#getMaxDeliverySeconds}
         * @param maxDeliverySeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#max_delivery_seconds Sesv2ConfigurationSet#max_delivery_seconds}.
         * @return {@code this}
         */
        public Builder maxDeliverySeconds(java.lang.Number maxDeliverySeconds) {
            this.maxDeliverySeconds = maxDeliverySeconds;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetDeliveryOptions#getSendingPoolName}
         * @param sendingPoolName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_pool_name Sesv2ConfigurationSet#sending_pool_name}.
         * @return {@code this}
         */
        public Builder sendingPoolName(java.lang.String sendingPoolName) {
            this.sendingPoolName = sendingPoolName;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetDeliveryOptions#getTlsPolicy}
         * @param tlsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tls_policy Sesv2ConfigurationSet#tls_policy}.
         * @return {@code this}
         */
        public Builder tlsPolicy(java.lang.String tlsPolicy) {
            this.tlsPolicy = tlsPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetDeliveryOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetDeliveryOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetDeliveryOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetDeliveryOptions {
        private final java.lang.Number maxDeliverySeconds;
        private final java.lang.String sendingPoolName;
        private final java.lang.String tlsPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxDeliverySeconds = software.amazon.jsii.Kernel.get(this, "maxDeliverySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sendingPoolName = software.amazon.jsii.Kernel.get(this, "sendingPoolName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tlsPolicy = software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxDeliverySeconds = builder.maxDeliverySeconds;
            this.sendingPoolName = builder.sendingPoolName;
            this.tlsPolicy = builder.tlsPolicy;
        }

        @Override
        public final java.lang.Number getMaxDeliverySeconds() {
            return this.maxDeliverySeconds;
        }

        @Override
        public final java.lang.String getSendingPoolName() {
            return this.sendingPoolName;
        }

        @Override
        public final java.lang.String getTlsPolicy() {
            return this.tlsPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxDeliverySeconds() != null) {
                data.set("maxDeliverySeconds", om.valueToTree(this.getMaxDeliverySeconds()));
            }
            if (this.getSendingPoolName() != null) {
                data.set("sendingPoolName", om.valueToTree(this.getSendingPoolName()));
            }
            if (this.getTlsPolicy() != null) {
                data.set("tlsPolicy", om.valueToTree(this.getTlsPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetDeliveryOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetDeliveryOptions.Jsii$Proxy that = (Sesv2ConfigurationSetDeliveryOptions.Jsii$Proxy) o;

            if (this.maxDeliverySeconds != null ? !this.maxDeliverySeconds.equals(that.maxDeliverySeconds) : that.maxDeliverySeconds != null) return false;
            if (this.sendingPoolName != null ? !this.sendingPoolName.equals(that.sendingPoolName) : that.sendingPoolName != null) return false;
            return this.tlsPolicy != null ? this.tlsPolicy.equals(that.tlsPolicy) : that.tlsPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxDeliverySeconds != null ? this.maxDeliverySeconds.hashCode() : 0;
            result = 31 * result + (this.sendingPoolName != null ? this.sendingPoolName.hashCode() : 0);
            result = 31 * result + (this.tlsPolicy != null ? this.tlsPolicy.hashCode() : 0);
            return result;
        }
    }
}
