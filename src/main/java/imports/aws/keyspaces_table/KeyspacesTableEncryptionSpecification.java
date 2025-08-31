package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableEncryptionSpecification")
@software.amazon.jsii.Jsii.Proxy(KeyspacesTableEncryptionSpecification.Jsii$Proxy.class)
public interface KeyspacesTableEncryptionSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#kms_key_identifier KeyspacesTable#kms_key_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#type KeyspacesTable#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KeyspacesTableEncryptionSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesTableEncryptionSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesTableEncryptionSpecification> {
        java.lang.String kmsKeyIdentifier;
        java.lang.String type;

        /**
         * Sets the value of {@link KeyspacesTableEncryptionSpecification#getKmsKeyIdentifier}
         * @param kmsKeyIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#kms_key_identifier KeyspacesTable#kms_key_identifier}.
         * @return {@code this}
         */
        public Builder kmsKeyIdentifier(java.lang.String kmsKeyIdentifier) {
            this.kmsKeyIdentifier = kmsKeyIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableEncryptionSpecification#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#type KeyspacesTable#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KeyspacesTableEncryptionSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesTableEncryptionSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesTableEncryptionSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesTableEncryptionSpecification {
        private final java.lang.String kmsKeyIdentifier;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyIdentifier = software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyIdentifier = builder.kmsKeyIdentifier;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getKmsKeyIdentifier() {
            return this.kmsKeyIdentifier;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsKeyIdentifier() != null) {
                data.set("kmsKeyIdentifier", om.valueToTree(this.getKmsKeyIdentifier()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.keyspacesTable.KeyspacesTableEncryptionSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesTableEncryptionSpecification.Jsii$Proxy that = (KeyspacesTableEncryptionSpecification.Jsii$Proxy) o;

            if (this.kmsKeyIdentifier != null ? !this.kmsKeyIdentifier.equals(that.kmsKeyIdentifier) : that.kmsKeyIdentifier != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyIdentifier != null ? this.kmsKeyIdentifier.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
