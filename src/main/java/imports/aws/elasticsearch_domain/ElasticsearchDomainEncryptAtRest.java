package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainEncryptAtRest")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainEncryptAtRest.Jsii$Proxy.class)
public interface ElasticsearchDomainEncryptAtRest extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#kms_key_id ElasticsearchDomain#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainEncryptAtRest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainEncryptAtRest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainEncryptAtRest> {
        java.lang.Object enabled;
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link ElasticsearchDomainEncryptAtRest#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainEncryptAtRest#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainEncryptAtRest#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#kms_key_id ElasticsearchDomain#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainEncryptAtRest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainEncryptAtRest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainEncryptAtRest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainEncryptAtRest {
        private final java.lang.Object enabled;
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.kmsKeyId = builder.kmsKeyId;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
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

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainEncryptAtRest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainEncryptAtRest.Jsii$Proxy that = (ElasticsearchDomainEncryptAtRest.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.kmsKeyId != null ? this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
