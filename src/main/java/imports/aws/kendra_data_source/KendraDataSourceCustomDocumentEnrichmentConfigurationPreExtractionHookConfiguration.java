package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.432Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#lambda_arn KendraDataSource#lambda_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLambdaArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_bucket KendraDataSource#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * invocation_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#invocation_condition KendraDataSource#invocation_condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition getInvocationCondition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration> {
        java.lang.String lambdaArn;
        java.lang.String s3Bucket;
        imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition invocationCondition;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration#getLambdaArn}
         * @param lambdaArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#lambda_arn KendraDataSource#lambda_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder lambdaArn(java.lang.String lambdaArn) {
            this.lambdaArn = lambdaArn;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_bucket KendraDataSource#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration#getInvocationCondition}
         * @param invocationCondition invocation_condition block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#invocation_condition KendraDataSource#invocation_condition}
         * @return {@code this}
         */
        public Builder invocationCondition(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition invocationCondition) {
            this.invocationCondition = invocationCondition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration {
        private final java.lang.String lambdaArn;
        private final java.lang.String s3Bucket;
        private final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition invocationCondition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lambdaArn = software.amazon.jsii.Kernel.get(this, "lambdaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.invocationCondition = software.amazon.jsii.Kernel.get(this, "invocationCondition", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lambdaArn = java.util.Objects.requireNonNull(builder.lambdaArn, "lambdaArn is required");
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.invocationCondition = builder.invocationCondition;
        }

        @Override
        public final java.lang.String getLambdaArn() {
            return this.lambdaArn;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfigurationInvocationCondition getInvocationCondition() {
            return this.invocationCondition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("lambdaArn", om.valueToTree(this.getLambdaArn()));
            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            if (this.getInvocationCondition() != null) {
                data.set("invocationCondition", om.valueToTree(this.getInvocationCondition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfigurationPreExtractionHookConfiguration.Jsii$Proxy) o;

            if (!lambdaArn.equals(that.lambdaArn)) return false;
            if (!s3Bucket.equals(that.s3Bucket)) return false;
            return this.invocationCondition != null ? this.invocationCondition.equals(that.invocationCondition) : that.invocationCondition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.lambdaArn.hashCode();
            result = 31 * result + (this.s3Bucket.hashCode());
            result = 31 * result + (this.invocationCondition != null ? this.invocationCondition.hashCode() : 0);
            return result;
        }
    }
}
