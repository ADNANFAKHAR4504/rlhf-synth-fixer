package imports.aws.s3_bucket_intelligent_tiering_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.254Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketIntelligentTieringConfiguration.S3BucketIntelligentTieringConfigurationTiering")
@software.amazon.jsii.Jsii.Proxy(S3BucketIntelligentTieringConfigurationTiering.Jsii$Proxy.class)
public interface S3BucketIntelligentTieringConfigurationTiering extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_intelligent_tiering_configuration#access_tier S3BucketIntelligentTieringConfiguration#access_tier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessTier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_intelligent_tiering_configuration#days S3BucketIntelligentTieringConfiguration#days}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDays();

    /**
     * @return a {@link Builder} of {@link S3BucketIntelligentTieringConfigurationTiering}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketIntelligentTieringConfigurationTiering}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketIntelligentTieringConfigurationTiering> {
        java.lang.String accessTier;
        java.lang.Number days;

        /**
         * Sets the value of {@link S3BucketIntelligentTieringConfigurationTiering#getAccessTier}
         * @param accessTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_intelligent_tiering_configuration#access_tier S3BucketIntelligentTieringConfiguration#access_tier}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessTier(java.lang.String accessTier) {
            this.accessTier = accessTier;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketIntelligentTieringConfigurationTiering#getDays}
         * @param days Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_intelligent_tiering_configuration#days S3BucketIntelligentTieringConfiguration#days}. This parameter is required.
         * @return {@code this}
         */
        public Builder days(java.lang.Number days) {
            this.days = days;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketIntelligentTieringConfigurationTiering}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketIntelligentTieringConfigurationTiering build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketIntelligentTieringConfigurationTiering}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketIntelligentTieringConfigurationTiering {
        private final java.lang.String accessTier;
        private final java.lang.Number days;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessTier = software.amazon.jsii.Kernel.get(this, "accessTier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.days = software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessTier = java.util.Objects.requireNonNull(builder.accessTier, "accessTier is required");
            this.days = java.util.Objects.requireNonNull(builder.days, "days is required");
        }

        @Override
        public final java.lang.String getAccessTier() {
            return this.accessTier;
        }

        @Override
        public final java.lang.Number getDays() {
            return this.days;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accessTier", om.valueToTree(this.getAccessTier()));
            data.set("days", om.valueToTree(this.getDays()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketIntelligentTieringConfiguration.S3BucketIntelligentTieringConfigurationTiering"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketIntelligentTieringConfigurationTiering.Jsii$Proxy that = (S3BucketIntelligentTieringConfigurationTiering.Jsii$Proxy) o;

            if (!accessTier.equals(that.accessTier)) return false;
            return this.days.equals(that.days);
        }

        @Override
        public final int hashCode() {
            int result = this.accessTier.hashCode();
            result = 31 * result + (this.days.hashCode());
            return result;
        }
    }
}
