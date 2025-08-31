package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorKafkaClusterClientAuthentication")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorKafkaClusterClientAuthentication.Jsii$Proxy.class)
public interface MskconnectConnectorKafkaClusterClientAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#authentication_type MskconnectConnector#authentication_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorKafkaClusterClientAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorKafkaClusterClientAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorKafkaClusterClientAuthentication> {
        java.lang.String authenticationType;

        /**
         * Sets the value of {@link MskconnectConnectorKafkaClusterClientAuthentication#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#authentication_type MskconnectConnector#authentication_type}.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorKafkaClusterClientAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorKafkaClusterClientAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorKafkaClusterClientAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorKafkaClusterClientAuthentication {
        private final java.lang.String authenticationType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationType = builder.authenticationType;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthenticationType() != null) {
                data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorKafkaClusterClientAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorKafkaClusterClientAuthentication.Jsii$Proxy that = (MskconnectConnectorKafkaClusterClientAuthentication.Jsii$Proxy) o;

            return this.authenticationType != null ? this.authenticationType.equals(that.authenticationType) : that.authenticationType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationType != null ? this.authenticationType.hashCode() : 0;
            return result;
        }
    }
}
