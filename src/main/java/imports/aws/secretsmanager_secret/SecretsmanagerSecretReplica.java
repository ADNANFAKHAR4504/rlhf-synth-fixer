package imports.aws.secretsmanager_secret;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.362Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.secretsmanagerSecret.SecretsmanagerSecretReplica")
@software.amazon.jsii.Jsii.Proxy(SecretsmanagerSecretReplica.Jsii$Proxy.class)
public interface SecretsmanagerSecretReplica extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret#region SecretsmanagerSecret#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret#kms_key_id SecretsmanagerSecret#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecretsmanagerSecretReplica}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecretsmanagerSecretReplica}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecretsmanagerSecretReplica> {
        java.lang.String region;
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link SecretsmanagerSecretReplica#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret#region SecretsmanagerSecret#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretReplica#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret#kms_key_id SecretsmanagerSecret#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecretsmanagerSecretReplica}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecretsmanagerSecretReplica build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecretsmanagerSecretReplica}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecretsmanagerSecretReplica {
        private final java.lang.String region;
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.kmsKeyId = builder.kmsKeyId;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("region", om.valueToTree(this.getRegion()));
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.secretsmanagerSecret.SecretsmanagerSecretReplica"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecretsmanagerSecretReplica.Jsii$Proxy that = (SecretsmanagerSecretReplica.Jsii$Proxy) o;

            if (!region.equals(that.region)) return false;
            return this.kmsKeyId != null ? this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.region.hashCode();
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
