package imports.aws.timestreaminfluxdb_db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.545Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration")
@software.amazon.jsii.Jsii.Proxy(TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration.Jsii$Proxy.class)
public interface TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * The name of the S3 bucket to deliver logs to.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#bucket_name TimestreaminfluxdbDbInstance#bucket_name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Indicates whether log delivery to the S3 bucket is enabled.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#enabled TimestreaminfluxdbDbInstance#enabled}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * @return a {@link Builder} of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration> {
        java.lang.String bucketName;
        java.lang.Object enabled;

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration#getBucketName}
         * @param bucketName The name of the S3 bucket to deliver logs to. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#bucket_name TimestreaminfluxdbDbInstance#bucket_name}
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration#getEnabled}
         * @param enabled Indicates whether log delivery to the S3 bucket is enabled. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#enabled TimestreaminfluxdbDbInstance#enabled}
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration#getEnabled}
         * @param enabled Indicates whether log delivery to the S3 bucket is enabled. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#enabled TimestreaminfluxdbDbInstance#enabled}
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration {
        private final java.lang.String bucketName;
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("enabled", om.valueToTree(this.getEnabled()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration.Jsii$Proxy that = (TimestreaminfluxdbDbInstanceLogDeliveryConfigurationS3Configuration.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            return this.enabled.equals(that.enabled);
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.enabled.hashCode());
            return result;
        }
    }
}
