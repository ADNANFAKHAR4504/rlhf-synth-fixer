package imports.aws.verifiedaccess_instance_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.575Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessInstanceLoggingConfigurationAccessLogsS3.Jsii$Proxy.class)
public interface VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#bucket_name VerifiedaccessInstanceLoggingConfiguration#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#bucket_owner VerifiedaccessInstanceLoggingConfiguration#bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#prefix VerifiedaccessInstanceLoggingConfiguration#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessInstanceLoggingConfigurationAccessLogsS3> {
        java.lang.Object enabled;
        java.lang.String bucketName;
        java.lang.String bucketOwner;
        java.lang.String prefix;

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#bucket_name VerifiedaccessInstanceLoggingConfiguration#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3#getBucketOwner}
         * @param bucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#bucket_owner VerifiedaccessInstanceLoggingConfiguration#bucket_owner}.
         * @return {@code this}
         */
        public Builder bucketOwner(java.lang.String bucketOwner) {
            this.bucketOwner = bucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#prefix VerifiedaccessInstanceLoggingConfiguration#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessInstanceLoggingConfigurationAccessLogsS3 {
        private final java.lang.Object enabled;
        private final java.lang.String bucketName;
        private final java.lang.String bucketOwner;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketOwner = software.amazon.jsii.Kernel.get(this, "bucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.bucketName = builder.bucketName;
            this.bucketOwner = builder.bucketOwner;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getBucketOwner() {
            return this.bucketOwner;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getBucketOwner() != null) {
                data.set("bucketOwner", om.valueToTree(this.getBucketOwner()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessInstanceLoggingConfigurationAccessLogsS3.Jsii$Proxy that = (VerifiedaccessInstanceLoggingConfigurationAccessLogsS3.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            if (this.bucketOwner != null ? !this.bucketOwner.equals(that.bucketOwner) : that.bucketOwner != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.bucketName != null ? this.bucketName.hashCode() : 0);
            result = 31 * result + (this.bucketOwner != null ? this.bucketOwner.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
