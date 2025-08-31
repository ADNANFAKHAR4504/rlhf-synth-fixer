package imports.aws.data_aws_kms_secrets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.717Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsKmsSecrets.DataAwsKmsSecretsSecret")
@software.amazon.jsii.Jsii.Proxy(DataAwsKmsSecretsSecret.Jsii$Proxy.class)
public interface DataAwsKmsSecretsSecret extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#name DataAwsKmsSecrets#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#payload DataAwsKmsSecrets#payload}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPayload();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#context DataAwsKmsSecrets#context}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#encryption_algorithm DataAwsKmsSecrets#encryption_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#grant_tokens DataAwsKmsSecrets#grant_tokens}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGrantTokens() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#key_id DataAwsKmsSecrets#key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsKmsSecretsSecret}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsKmsSecretsSecret}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsKmsSecretsSecret> {
        java.lang.String name;
        java.lang.String payload;
        java.util.Map<java.lang.String, java.lang.String> context;
        java.lang.String encryptionAlgorithm;
        java.util.List<java.lang.String> grantTokens;
        java.lang.String keyId;

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#name DataAwsKmsSecrets#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getPayload}
         * @param payload Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#payload DataAwsKmsSecrets#payload}. This parameter is required.
         * @return {@code this}
         */
        public Builder payload(java.lang.String payload) {
            this.payload = payload;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getContext}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#context DataAwsKmsSecrets#context}.
         * @return {@code this}
         */
        public Builder context(java.util.Map<java.lang.String, java.lang.String> context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getEncryptionAlgorithm}
         * @param encryptionAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#encryption_algorithm DataAwsKmsSecrets#encryption_algorithm}.
         * @return {@code this}
         */
        public Builder encryptionAlgorithm(java.lang.String encryptionAlgorithm) {
            this.encryptionAlgorithm = encryptionAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getGrantTokens}
         * @param grantTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#grant_tokens DataAwsKmsSecrets#grant_tokens}.
         * @return {@code this}
         */
        public Builder grantTokens(java.util.List<java.lang.String> grantTokens) {
            this.grantTokens = grantTokens;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsKmsSecretsSecret#getKeyId}
         * @param keyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/kms_secrets#key_id DataAwsKmsSecrets#key_id}.
         * @return {@code this}
         */
        public Builder keyId(java.lang.String keyId) {
            this.keyId = keyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsKmsSecretsSecret}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsKmsSecretsSecret build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsKmsSecretsSecret}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsKmsSecretsSecret {
        private final java.lang.String name;
        private final java.lang.String payload;
        private final java.util.Map<java.lang.String, java.lang.String> context;
        private final java.lang.String encryptionAlgorithm;
        private final java.util.List<java.lang.String> grantTokens;
        private final java.lang.String keyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.payload = software.amazon.jsii.Kernel.get(this, "payload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.encryptionAlgorithm = software.amazon.jsii.Kernel.get(this, "encryptionAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.grantTokens = software.amazon.jsii.Kernel.get(this, "grantTokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.keyId = software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.payload = java.util.Objects.requireNonNull(builder.payload, "payload is required");
            this.context = builder.context;
            this.encryptionAlgorithm = builder.encryptionAlgorithm;
            this.grantTokens = builder.grantTokens;
            this.keyId = builder.keyId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPayload() {
            return this.payload;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getContext() {
            return this.context;
        }

        @Override
        public final java.lang.String getEncryptionAlgorithm() {
            return this.encryptionAlgorithm;
        }

        @Override
        public final java.util.List<java.lang.String> getGrantTokens() {
            return this.grantTokens;
        }

        @Override
        public final java.lang.String getKeyId() {
            return this.keyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("payload", om.valueToTree(this.getPayload()));
            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getEncryptionAlgorithm() != null) {
                data.set("encryptionAlgorithm", om.valueToTree(this.getEncryptionAlgorithm()));
            }
            if (this.getGrantTokens() != null) {
                data.set("grantTokens", om.valueToTree(this.getGrantTokens()));
            }
            if (this.getKeyId() != null) {
                data.set("keyId", om.valueToTree(this.getKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsKmsSecrets.DataAwsKmsSecretsSecret"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsKmsSecretsSecret.Jsii$Proxy that = (DataAwsKmsSecretsSecret.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!payload.equals(that.payload)) return false;
            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            if (this.encryptionAlgorithm != null ? !this.encryptionAlgorithm.equals(that.encryptionAlgorithm) : that.encryptionAlgorithm != null) return false;
            if (this.grantTokens != null ? !this.grantTokens.equals(that.grantTokens) : that.grantTokens != null) return false;
            return this.keyId != null ? this.keyId.equals(that.keyId) : that.keyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.payload.hashCode());
            result = 31 * result + (this.context != null ? this.context.hashCode() : 0);
            result = 31 * result + (this.encryptionAlgorithm != null ? this.encryptionAlgorithm.hashCode() : 0);
            result = 31 * result + (this.grantTokens != null ? this.grantTokens.hashCode() : 0);
            result = 31 * result + (this.keyId != null ? this.keyId.hashCode() : 0);
            return result;
        }
    }
}
