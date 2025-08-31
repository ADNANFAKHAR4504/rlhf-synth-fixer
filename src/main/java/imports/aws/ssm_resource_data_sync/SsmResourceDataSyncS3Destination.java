package imports.aws.ssm_resource_data_sync;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.506Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmResourceDataSync.SsmResourceDataSyncS3Destination")
@software.amazon.jsii.Jsii.Proxy(SsmResourceDataSyncS3Destination.Jsii$Proxy.class)
public interface SsmResourceDataSyncS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#bucket_name SsmResourceDataSync#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#region SsmResourceDataSync#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#kms_key_arn SsmResourceDataSync#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#prefix SsmResourceDataSync#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#sync_format SsmResourceDataSync#sync_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSyncFormat() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmResourceDataSyncS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmResourceDataSyncS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmResourceDataSyncS3Destination> {
        java.lang.String bucketName;
        java.lang.String region;
        java.lang.String kmsKeyArn;
        java.lang.String prefix;
        java.lang.String syncFormat;

        /**
         * Sets the value of {@link SsmResourceDataSyncS3Destination#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#bucket_name SsmResourceDataSync#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link SsmResourceDataSyncS3Destination#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#region SsmResourceDataSync#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link SsmResourceDataSyncS3Destination#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#kms_key_arn SsmResourceDataSync#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmResourceDataSyncS3Destination#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#prefix SsmResourceDataSync#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link SsmResourceDataSyncS3Destination#getSyncFormat}
         * @param syncFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_resource_data_sync#sync_format SsmResourceDataSync#sync_format}.
         * @return {@code this}
         */
        public Builder syncFormat(java.lang.String syncFormat) {
            this.syncFormat = syncFormat;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmResourceDataSyncS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmResourceDataSyncS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmResourceDataSyncS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmResourceDataSyncS3Destination {
        private final java.lang.String bucketName;
        private final java.lang.String region;
        private final java.lang.String kmsKeyArn;
        private final java.lang.String prefix;
        private final java.lang.String syncFormat;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.syncFormat = software.amazon.jsii.Kernel.get(this, "syncFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.kmsKeyArn = builder.kmsKeyArn;
            this.prefix = builder.prefix;
            this.syncFormat = builder.syncFormat;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.String getSyncFormat() {
            return this.syncFormat;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("region", om.valueToTree(this.getRegion()));
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getSyncFormat() != null) {
                data.set("syncFormat", om.valueToTree(this.getSyncFormat()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmResourceDataSync.SsmResourceDataSyncS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmResourceDataSyncS3Destination.Jsii$Proxy that = (SsmResourceDataSyncS3Destination.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!region.equals(that.region)) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            return this.syncFormat != null ? this.syncFormat.equals(that.syncFormat) : that.syncFormat == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.region.hashCode());
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            result = 31 * result + (this.syncFormat != null ? this.syncFormat.hashCode() : 0);
            return result;
        }
    }
}
