package imports.aws.kms_custom_key_store;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.477Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsCustomKeyStore.KmsCustomKeyStoreXksProxyAuthenticationCredential")
@software.amazon.jsii.Jsii.Proxy(KmsCustomKeyStoreXksProxyAuthenticationCredential.Jsii$Proxy.class)
public interface KmsCustomKeyStoreXksProxyAuthenticationCredential extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#access_key_id KmsCustomKeyStore#access_key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessKeyId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#raw_secret_access_key KmsCustomKeyStore#raw_secret_access_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRawSecretAccessKey();

    /**
     * @return a {@link Builder} of {@link KmsCustomKeyStoreXksProxyAuthenticationCredential}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KmsCustomKeyStoreXksProxyAuthenticationCredential}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KmsCustomKeyStoreXksProxyAuthenticationCredential> {
        java.lang.String accessKeyId;
        java.lang.String rawSecretAccessKey;

        /**
         * Sets the value of {@link KmsCustomKeyStoreXksProxyAuthenticationCredential#getAccessKeyId}
         * @param accessKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#access_key_id KmsCustomKeyStore#access_key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessKeyId(java.lang.String accessKeyId) {
            this.accessKeyId = accessKeyId;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreXksProxyAuthenticationCredential#getRawSecretAccessKey}
         * @param rawSecretAccessKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#raw_secret_access_key KmsCustomKeyStore#raw_secret_access_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder rawSecretAccessKey(java.lang.String rawSecretAccessKey) {
            this.rawSecretAccessKey = rawSecretAccessKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KmsCustomKeyStoreXksProxyAuthenticationCredential}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KmsCustomKeyStoreXksProxyAuthenticationCredential build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KmsCustomKeyStoreXksProxyAuthenticationCredential}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KmsCustomKeyStoreXksProxyAuthenticationCredential {
        private final java.lang.String accessKeyId;
        private final java.lang.String rawSecretAccessKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessKeyId = software.amazon.jsii.Kernel.get(this, "accessKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rawSecretAccessKey = software.amazon.jsii.Kernel.get(this, "rawSecretAccessKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessKeyId = java.util.Objects.requireNonNull(builder.accessKeyId, "accessKeyId is required");
            this.rawSecretAccessKey = java.util.Objects.requireNonNull(builder.rawSecretAccessKey, "rawSecretAccessKey is required");
        }

        @Override
        public final java.lang.String getAccessKeyId() {
            return this.accessKeyId;
        }

        @Override
        public final java.lang.String getRawSecretAccessKey() {
            return this.rawSecretAccessKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accessKeyId", om.valueToTree(this.getAccessKeyId()));
            data.set("rawSecretAccessKey", om.valueToTree(this.getRawSecretAccessKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kmsCustomKeyStore.KmsCustomKeyStoreXksProxyAuthenticationCredential"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KmsCustomKeyStoreXksProxyAuthenticationCredential.Jsii$Proxy that = (KmsCustomKeyStoreXksProxyAuthenticationCredential.Jsii$Proxy) o;

            if (!accessKeyId.equals(that.accessKeyId)) return false;
            return this.rawSecretAccessKey.equals(that.rawSecretAccessKey);
        }

        @Override
        public final int hashCode() {
            int result = this.accessKeyId.hashCode();
            result = 31 * result + (this.rawSecretAccessKey.hashCode());
            return result;
        }
    }
}
