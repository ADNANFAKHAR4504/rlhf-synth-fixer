package imports.aws.backup_report_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupReportPlan.BackupReportPlanReportDeliveryChannel")
@software.amazon.jsii.Jsii.Proxy(BackupReportPlanReportDeliveryChannel.Jsii$Proxy.class)
public interface BackupReportPlanReportDeliveryChannel extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#s3_bucket_name BackupReportPlan#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#formats BackupReportPlan#formats}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFormats() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#s3_key_prefix BackupReportPlan#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupReportPlanReportDeliveryChannel}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupReportPlanReportDeliveryChannel}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupReportPlanReportDeliveryChannel> {
        java.lang.String s3BucketName;
        java.util.List<java.lang.String> formats;
        java.lang.String s3KeyPrefix;

        /**
         * Sets the value of {@link BackupReportPlanReportDeliveryChannel#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#s3_bucket_name BackupReportPlan#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link BackupReportPlanReportDeliveryChannel#getFormats}
         * @param formats Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#formats BackupReportPlan#formats}.
         * @return {@code this}
         */
        public Builder formats(java.util.List<java.lang.String> formats) {
            this.formats = formats;
            return this;
        }

        /**
         * Sets the value of {@link BackupReportPlanReportDeliveryChannel#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_report_plan#s3_key_prefix BackupReportPlan#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupReportPlanReportDeliveryChannel}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupReportPlanReportDeliveryChannel build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupReportPlanReportDeliveryChannel}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupReportPlanReportDeliveryChannel {
        private final java.lang.String s3BucketName;
        private final java.util.List<java.lang.String> formats;
        private final java.lang.String s3KeyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.formats = software.amazon.jsii.Kernel.get(this, "formats", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.formats = builder.formats;
            this.s3KeyPrefix = builder.s3KeyPrefix;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.util.List<java.lang.String> getFormats() {
            return this.formats;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getFormats() != null) {
                data.set("formats", om.valueToTree(this.getFormats()));
            }
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupReportPlan.BackupReportPlanReportDeliveryChannel"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupReportPlanReportDeliveryChannel.Jsii$Proxy that = (BackupReportPlanReportDeliveryChannel.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            if (this.formats != null ? !this.formats.equals(that.formats) : that.formats != null) return false;
            return this.s3KeyPrefix != null ? this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.formats != null ? this.formats.hashCode() : 0);
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            return result;
        }
    }
}
