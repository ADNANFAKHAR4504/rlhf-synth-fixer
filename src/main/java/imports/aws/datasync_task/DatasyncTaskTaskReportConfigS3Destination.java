package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskTaskReportConfigS3Destination")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskTaskReportConfigS3Destination.Jsii$Proxy.class)
public interface DatasyncTaskTaskReportConfigS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bucket_access_role_arn DatasyncTask#bucket_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketAccessRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_bucket_arn DatasyncTask#s3_bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#subdirectory DatasyncTask#subdirectory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdirectory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskTaskReportConfigS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskTaskReportConfigS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskTaskReportConfigS3Destination> {
        java.lang.String bucketAccessRoleArn;
        java.lang.String s3BucketArn;
        java.lang.String subdirectory;

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigS3Destination#getBucketAccessRoleArn}
         * @param bucketAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#bucket_access_role_arn DatasyncTask#bucket_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketAccessRoleArn(java.lang.String bucketAccessRoleArn) {
            this.bucketAccessRoleArn = bucketAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigS3Destination#getS3BucketArn}
         * @param s3BucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_bucket_arn DatasyncTask#s3_bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketArn(java.lang.String s3BucketArn) {
            this.s3BucketArn = s3BucketArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfigS3Destination#getSubdirectory}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#subdirectory DatasyncTask#subdirectory}.
         * @return {@code this}
         */
        public Builder subdirectory(java.lang.String subdirectory) {
            this.subdirectory = subdirectory;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncTaskTaskReportConfigS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskTaskReportConfigS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskTaskReportConfigS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskTaskReportConfigS3Destination {
        private final java.lang.String bucketAccessRoleArn;
        private final java.lang.String s3BucketArn;
        private final java.lang.String subdirectory;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketAccessRoleArn = software.amazon.jsii.Kernel.get(this, "bucketAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketArn = software.amazon.jsii.Kernel.get(this, "s3BucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subdirectory = software.amazon.jsii.Kernel.get(this, "subdirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketAccessRoleArn = java.util.Objects.requireNonNull(builder.bucketAccessRoleArn, "bucketAccessRoleArn is required");
            this.s3BucketArn = java.util.Objects.requireNonNull(builder.s3BucketArn, "s3BucketArn is required");
            this.subdirectory = builder.subdirectory;
        }

        @Override
        public final java.lang.String getBucketAccessRoleArn() {
            return this.bucketAccessRoleArn;
        }

        @Override
        public final java.lang.String getS3BucketArn() {
            return this.s3BucketArn;
        }

        @Override
        public final java.lang.String getSubdirectory() {
            return this.subdirectory;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketAccessRoleArn", om.valueToTree(this.getBucketAccessRoleArn()));
            data.set("s3BucketArn", om.valueToTree(this.getS3BucketArn()));
            if (this.getSubdirectory() != null) {
                data.set("subdirectory", om.valueToTree(this.getSubdirectory()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskTaskReportConfigS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskTaskReportConfigS3Destination.Jsii$Proxy that = (DatasyncTaskTaskReportConfigS3Destination.Jsii$Proxy) o;

            if (!bucketAccessRoleArn.equals(that.bucketAccessRoleArn)) return false;
            if (!s3BucketArn.equals(that.s3BucketArn)) return false;
            return this.subdirectory != null ? this.subdirectory.equals(that.subdirectory) : that.subdirectory == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketAccessRoleArn.hashCode();
            result = 31 * result + (this.s3BucketArn.hashCode());
            result = 31 * result + (this.subdirectory != null ? this.subdirectory.hashCode() : 0);
            return result;
        }
    }
}
