package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorKafkaClusterEncryptionInTransit")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorKafkaClusterEncryptionInTransit.Jsii$Proxy.class)
public interface MskconnectConnectorKafkaClusterEncryptionInTransit extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#encryption_type MskconnectConnector#encryption_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorKafkaClusterEncryptionInTransit}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorKafkaClusterEncryptionInTransit}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorKafkaClusterEncryptionInTransit> {
        java.lang.String encryptionType;

        /**
         * Sets the value of {@link MskconnectConnectorKafkaClusterEncryptionInTransit#getEncryptionType}
         * @param encryptionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#encryption_type MskconnectConnector#encryption_type}.
         * @return {@code this}
         */
        public Builder encryptionType(java.lang.String encryptionType) {
            this.encryptionType = encryptionType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorKafkaClusterEncryptionInTransit}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorKafkaClusterEncryptionInTransit build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorKafkaClusterEncryptionInTransit}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorKafkaClusterEncryptionInTransit {
        private final java.lang.String encryptionType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionType = software.amazon.jsii.Kernel.get(this, "encryptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionType = builder.encryptionType;
        }

        @Override
        public final java.lang.String getEncryptionType() {
            return this.encryptionType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionType() != null) {
                data.set("encryptionType", om.valueToTree(this.getEncryptionType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorKafkaClusterEncryptionInTransit"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorKafkaClusterEncryptionInTransit.Jsii$Proxy that = (MskconnectConnectorKafkaClusterEncryptionInTransit.Jsii$Proxy) o;

            return this.encryptionType != null ? this.encryptionType.equals(that.encryptionType) : that.encryptionType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionType != null ? this.encryptionType.hashCode() : 0;
            return result;
        }
    }
}
