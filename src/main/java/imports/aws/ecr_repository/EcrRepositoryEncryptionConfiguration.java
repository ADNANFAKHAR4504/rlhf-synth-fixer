package imports.aws.ecr_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepository.EcrRepositoryEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcrRepositoryEncryptionConfiguration.Jsii$Proxy.class)
public interface EcrRepositoryEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#encryption_type EcrRepository#encryption_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#kms_key EcrRepository#kms_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrRepositoryEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrRepositoryEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrRepositoryEncryptionConfiguration> {
        java.lang.String encryptionType;
        java.lang.String kmsKey;

        /**
         * Sets the value of {@link EcrRepositoryEncryptionConfiguration#getEncryptionType}
         * @param encryptionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#encryption_type EcrRepository#encryption_type}.
         * @return {@code this}
         */
        public Builder encryptionType(java.lang.String encryptionType) {
            this.encryptionType = encryptionType;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryEncryptionConfiguration#getKmsKey}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository#kms_key EcrRepository#kms_key}.
         * @return {@code this}
         */
        public Builder kmsKey(java.lang.String kmsKey) {
            this.kmsKey = kmsKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrRepositoryEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrRepositoryEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrRepositoryEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrRepositoryEncryptionConfiguration {
        private final java.lang.String encryptionType;
        private final java.lang.String kmsKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionType = software.amazon.jsii.Kernel.get(this, "encryptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKey = software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionType = builder.encryptionType;
            this.kmsKey = builder.kmsKey;
        }

        @Override
        public final java.lang.String getEncryptionType() {
            return this.encryptionType;
        }

        @Override
        public final java.lang.String getKmsKey() {
            return this.kmsKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionType() != null) {
                data.set("encryptionType", om.valueToTree(this.getEncryptionType()));
            }
            if (this.getKmsKey() != null) {
                data.set("kmsKey", om.valueToTree(this.getKmsKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrRepository.EcrRepositoryEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrRepositoryEncryptionConfiguration.Jsii$Proxy that = (EcrRepositoryEncryptionConfiguration.Jsii$Proxy) o;

            if (this.encryptionType != null ? !this.encryptionType.equals(that.encryptionType) : that.encryptionType != null) return false;
            return this.kmsKey != null ? this.kmsKey.equals(that.kmsKey) : that.kmsKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionType != null ? this.encryptionType.hashCode() : 0;
            result = 31 * result + (this.kmsKey != null ? this.kmsKey.hashCode() : 0);
            return result;
        }
    }
}
