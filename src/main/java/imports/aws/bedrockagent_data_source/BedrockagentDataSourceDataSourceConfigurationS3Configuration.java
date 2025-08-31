package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.161Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationS3Configuration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationS3Configuration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationS3Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bucket_arn BedrockagentDataSource#bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bucket_owner_account_id BedrockagentDataSource#bucket_owner_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_prefixes BedrockagentDataSource#inclusion_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionPrefixes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationS3Configuration> {
        java.lang.String bucketArn;
        java.lang.String bucketOwnerAccountId;
        java.util.List<java.lang.String> inclusionPrefixes;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration#getBucketArn}
         * @param bucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bucket_arn BedrockagentDataSource#bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketArn(java.lang.String bucketArn) {
            this.bucketArn = bucketArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration#getBucketOwnerAccountId}
         * @param bucketOwnerAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bucket_owner_account_id BedrockagentDataSource#bucket_owner_account_id}.
         * @return {@code this}
         */
        public Builder bucketOwnerAccountId(java.lang.String bucketOwnerAccountId) {
            this.bucketOwnerAccountId = bucketOwnerAccountId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration#getInclusionPrefixes}
         * @param inclusionPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_prefixes BedrockagentDataSource#inclusion_prefixes}.
         * @return {@code this}
         */
        public Builder inclusionPrefixes(java.util.List<java.lang.String> inclusionPrefixes) {
            this.inclusionPrefixes = inclusionPrefixes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationS3Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationS3Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationS3Configuration {
        private final java.lang.String bucketArn;
        private final java.lang.String bucketOwnerAccountId;
        private final java.util.List<java.lang.String> inclusionPrefixes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketArn = software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketOwnerAccountId = software.amazon.jsii.Kernel.get(this, "bucketOwnerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inclusionPrefixes = software.amazon.jsii.Kernel.get(this, "inclusionPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketArn = java.util.Objects.requireNonNull(builder.bucketArn, "bucketArn is required");
            this.bucketOwnerAccountId = builder.bucketOwnerAccountId;
            this.inclusionPrefixes = builder.inclusionPrefixes;
        }

        @Override
        public final java.lang.String getBucketArn() {
            return this.bucketArn;
        }

        @Override
        public final java.lang.String getBucketOwnerAccountId() {
            return this.bucketOwnerAccountId;
        }

        @Override
        public final java.util.List<java.lang.String> getInclusionPrefixes() {
            return this.inclusionPrefixes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketArn", om.valueToTree(this.getBucketArn()));
            if (this.getBucketOwnerAccountId() != null) {
                data.set("bucketOwnerAccountId", om.valueToTree(this.getBucketOwnerAccountId()));
            }
            if (this.getInclusionPrefixes() != null) {
                data.set("inclusionPrefixes", om.valueToTree(this.getInclusionPrefixes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationS3Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationS3Configuration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationS3Configuration.Jsii$Proxy) o;

            if (!bucketArn.equals(that.bucketArn)) return false;
            if (this.bucketOwnerAccountId != null ? !this.bucketOwnerAccountId.equals(that.bucketOwnerAccountId) : that.bucketOwnerAccountId != null) return false;
            return this.inclusionPrefixes != null ? this.inclusionPrefixes.equals(that.inclusionPrefixes) : that.inclusionPrefixes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketArn.hashCode();
            result = 31 * result + (this.bucketOwnerAccountId != null ? this.bucketOwnerAccountId.hashCode() : 0);
            result = 31 * result + (this.inclusionPrefixes != null ? this.inclusionPrefixes.hashCode() : 0);
            return result;
        }
    }
}
