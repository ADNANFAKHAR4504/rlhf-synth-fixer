package imports.aws.kms_grant;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsGrant.KmsGrantConstraints")
@software.amazon.jsii.Jsii.Proxy(KmsGrantConstraints.Jsii$Proxy.class)
public interface KmsGrantConstraints extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#encryption_context_equals KmsGrant#encryption_context_equals}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEncryptionContextEquals() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#encryption_context_subset KmsGrant#encryption_context_subset}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEncryptionContextSubset() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KmsGrantConstraints}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KmsGrantConstraints}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KmsGrantConstraints> {
        java.util.Map<java.lang.String, java.lang.String> encryptionContextEquals;
        java.util.Map<java.lang.String, java.lang.String> encryptionContextSubset;

        /**
         * Sets the value of {@link KmsGrantConstraints#getEncryptionContextEquals}
         * @param encryptionContextEquals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#encryption_context_equals KmsGrant#encryption_context_equals}.
         * @return {@code this}
         */
        public Builder encryptionContextEquals(java.util.Map<java.lang.String, java.lang.String> encryptionContextEquals) {
            this.encryptionContextEquals = encryptionContextEquals;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConstraints#getEncryptionContextSubset}
         * @param encryptionContextSubset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#encryption_context_subset KmsGrant#encryption_context_subset}.
         * @return {@code this}
         */
        public Builder encryptionContextSubset(java.util.Map<java.lang.String, java.lang.String> encryptionContextSubset) {
            this.encryptionContextSubset = encryptionContextSubset;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KmsGrantConstraints}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KmsGrantConstraints build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KmsGrantConstraints}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KmsGrantConstraints {
        private final java.util.Map<java.lang.String, java.lang.String> encryptionContextEquals;
        private final java.util.Map<java.lang.String, java.lang.String> encryptionContextSubset;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionContextEquals = software.amazon.jsii.Kernel.get(this, "encryptionContextEquals", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.encryptionContextSubset = software.amazon.jsii.Kernel.get(this, "encryptionContextSubset", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionContextEquals = builder.encryptionContextEquals;
            this.encryptionContextSubset = builder.encryptionContextSubset;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEncryptionContextEquals() {
            return this.encryptionContextEquals;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEncryptionContextSubset() {
            return this.encryptionContextSubset;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionContextEquals() != null) {
                data.set("encryptionContextEquals", om.valueToTree(this.getEncryptionContextEquals()));
            }
            if (this.getEncryptionContextSubset() != null) {
                data.set("encryptionContextSubset", om.valueToTree(this.getEncryptionContextSubset()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kmsGrant.KmsGrantConstraints"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KmsGrantConstraints.Jsii$Proxy that = (KmsGrantConstraints.Jsii$Proxy) o;

            if (this.encryptionContextEquals != null ? !this.encryptionContextEquals.equals(that.encryptionContextEquals) : that.encryptionContextEquals != null) return false;
            return this.encryptionContextSubset != null ? this.encryptionContextSubset.equals(that.encryptionContextSubset) : that.encryptionContextSubset == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionContextEquals != null ? this.encryptionContextEquals.hashCode() : 0;
            result = 31 * result + (this.encryptionContextSubset != null ? this.encryptionContextSubset.hashCode() : 0);
            return result;
        }
    }
}
