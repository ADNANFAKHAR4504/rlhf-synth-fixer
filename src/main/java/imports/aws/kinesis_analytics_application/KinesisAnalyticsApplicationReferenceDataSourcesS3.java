package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.447Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesS3")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationReferenceDataSourcesS3.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationReferenceDataSourcesS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#bucket_arn KinesisAnalyticsApplication#bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#file_key KinesisAnalyticsApplication#file_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#role_arn KinesisAnalyticsApplication#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationReferenceDataSourcesS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationReferenceDataSourcesS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationReferenceDataSourcesS3> {
        java.lang.String bucketArn;
        java.lang.String fileKey;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesS3#getBucketArn}
         * @param bucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#bucket_arn KinesisAnalyticsApplication#bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketArn(java.lang.String bucketArn) {
            this.bucketArn = bucketArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesS3#getFileKey}
         * @param fileKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#file_key KinesisAnalyticsApplication#file_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileKey(java.lang.String fileKey) {
            this.fileKey = fileKey;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesS3#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#role_arn KinesisAnalyticsApplication#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationReferenceDataSourcesS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationReferenceDataSourcesS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationReferenceDataSourcesS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationReferenceDataSourcesS3 {
        private final java.lang.String bucketArn;
        private final java.lang.String fileKey;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketArn = software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileKey = software.amazon.jsii.Kernel.get(this, "fileKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketArn = java.util.Objects.requireNonNull(builder.bucketArn, "bucketArn is required");
            this.fileKey = java.util.Objects.requireNonNull(builder.fileKey, "fileKey is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
        }

        @Override
        public final java.lang.String getBucketArn() {
            return this.bucketArn;
        }

        @Override
        public final java.lang.String getFileKey() {
            return this.fileKey;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketArn", om.valueToTree(this.getBucketArn()));
            data.set("fileKey", om.valueToTree(this.getFileKey()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationReferenceDataSourcesS3.Jsii$Proxy that = (KinesisAnalyticsApplicationReferenceDataSourcesS3.Jsii$Proxy) o;

            if (!bucketArn.equals(that.bucketArn)) return false;
            if (!fileKey.equals(that.fileKey)) return false;
            return this.roleArn.equals(that.roleArn);
        }

        @Override
        public final int hashCode() {
            int result = this.bucketArn.hashCode();
            result = 31 * result + (this.fileKey.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            return result;
        }
    }
}
