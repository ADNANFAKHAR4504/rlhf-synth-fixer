package imports.aws.redshift_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftCluster.RedshiftClusterLogging")
@software.amazon.jsii.Jsii.Proxy(RedshiftClusterLogging.Jsii$Proxy.class)
public interface RedshiftClusterLogging extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enable RedshiftCluster#enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnable();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#bucket_name RedshiftCluster#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#log_destination_type RedshiftCluster#log_destination_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#log_exports RedshiftCluster#log_exports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogExports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#s3_key_prefix RedshiftCluster#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftClusterLogging}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftClusterLogging}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftClusterLogging> {
        java.lang.Object enable;
        java.lang.String bucketName;
        java.lang.String logDestinationType;
        java.util.List<java.lang.String> logExports;
        java.lang.String s3KeyPrefix;

        /**
         * Sets the value of {@link RedshiftClusterLogging#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enable RedshiftCluster#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(java.lang.Boolean enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterLogging#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enable RedshiftCluster#enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder enable(com.hashicorp.cdktf.IResolvable enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterLogging#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#bucket_name RedshiftCluster#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterLogging#getLogDestinationType}
         * @param logDestinationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#log_destination_type RedshiftCluster#log_destination_type}.
         * @return {@code this}
         */
        public Builder logDestinationType(java.lang.String logDestinationType) {
            this.logDestinationType = logDestinationType;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterLogging#getLogExports}
         * @param logExports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#log_exports RedshiftCluster#log_exports}.
         * @return {@code this}
         */
        public Builder logExports(java.util.List<java.lang.String> logExports) {
            this.logExports = logExports;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftClusterLogging#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#s3_key_prefix RedshiftCluster#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RedshiftClusterLogging}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftClusterLogging build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftClusterLogging}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftClusterLogging {
        private final java.lang.Object enable;
        private final java.lang.String bucketName;
        private final java.lang.String logDestinationType;
        private final java.util.List<java.lang.String> logExports;
        private final java.lang.String s3KeyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enable = software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDestinationType = software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logExports = software.amazon.jsii.Kernel.get(this, "logExports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enable = java.util.Objects.requireNonNull(builder.enable, "enable is required");
            this.bucketName = builder.bucketName;
            this.logDestinationType = builder.logDestinationType;
            this.logExports = builder.logExports;
            this.s3KeyPrefix = builder.s3KeyPrefix;
        }

        @Override
        public final java.lang.Object getEnable() {
            return this.enable;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getLogDestinationType() {
            return this.logDestinationType;
        }

        @Override
        public final java.util.List<java.lang.String> getLogExports() {
            return this.logExports;
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

            data.set("enable", om.valueToTree(this.getEnable()));
            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getLogDestinationType() != null) {
                data.set("logDestinationType", om.valueToTree(this.getLogDestinationType()));
            }
            if (this.getLogExports() != null) {
                data.set("logExports", om.valueToTree(this.getLogExports()));
            }
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.redshiftCluster.RedshiftClusterLogging"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftClusterLogging.Jsii$Proxy that = (RedshiftClusterLogging.Jsii$Proxy) o;

            if (!enable.equals(that.enable)) return false;
            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            if (this.logDestinationType != null ? !this.logDestinationType.equals(that.logDestinationType) : that.logDestinationType != null) return false;
            if (this.logExports != null ? !this.logExports.equals(that.logExports) : that.logExports != null) return false;
            return this.s3KeyPrefix != null ? this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enable.hashCode();
            result = 31 * result + (this.bucketName != null ? this.bucketName.hashCode() : 0);
            result = 31 * result + (this.logDestinationType != null ? this.logDestinationType.hashCode() : 0);
            result = 31 * result + (this.logExports != null ? this.logExports.hashCode() : 0);
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            return result;
        }
    }
}
