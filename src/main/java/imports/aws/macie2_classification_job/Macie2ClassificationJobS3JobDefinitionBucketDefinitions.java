package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketDefinitions")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionBucketDefinitions.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionBucketDefinitions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#account_id Macie2ClassificationJob#account_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#buckets Macie2ClassificationJob#buckets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBuckets();

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionBucketDefinitions> {
        java.lang.String accountId;
        java.util.List<java.lang.String> buckets;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#account_id Macie2ClassificationJob#account_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions#getBuckets}
         * @param buckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#buckets Macie2ClassificationJob#buckets}. This parameter is required.
         * @return {@code this}
         */
        public Builder buckets(java.util.List<java.lang.String> buckets) {
            this.buckets = buckets;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionBucketDefinitions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionBucketDefinitions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionBucketDefinitions {
        private final java.lang.String accountId;
        private final java.util.List<java.lang.String> buckets;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.buckets = software.amazon.jsii.Kernel.get(this, "buckets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountId = java.util.Objects.requireNonNull(builder.accountId, "accountId is required");
            this.buckets = java.util.Objects.requireNonNull(builder.buckets, "buckets is required");
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.util.List<java.lang.String> getBuckets() {
            return this.buckets;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountId", om.valueToTree(this.getAccountId()));
            data.set("buckets", om.valueToTree(this.getBuckets()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketDefinitions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionBucketDefinitions.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionBucketDefinitions.Jsii$Proxy) o;

            if (!accountId.equals(that.accountId)) return false;
            return this.buckets.equals(that.buckets);
        }

        @Override
        public final int hashCode() {
            int result = this.accountId.hashCode();
            result = 31 * result + (this.buckets.hashCode());
            return result;
        }
    }
}
