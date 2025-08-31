package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config")
@software.amazon.jsii.Jsii.Proxy(InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config.Jsii$Proxy.class)
public interface InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_name InternetmonitorMonitor#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_prefix InternetmonitorMonitor#bucket_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#log_delivery_status InternetmonitorMonitor#log_delivery_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogDeliveryStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config> {
        java.lang.String bucketName;
        java.lang.String bucketPrefix;
        java.lang.String logDeliveryStatus;

        /**
         * Sets the value of {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_name InternetmonitorMonitor#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#bucket_prefix InternetmonitorMonitor#bucket_prefix}.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config#getLogDeliveryStatus}
         * @param logDeliveryStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#log_delivery_status InternetmonitorMonitor#log_delivery_status}.
         * @return {@code this}
         */
        public Builder logDeliveryStatus(java.lang.String logDeliveryStatus) {
            this.logDeliveryStatus = logDeliveryStatus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config {
        private final java.lang.String bucketName;
        private final java.lang.String bucketPrefix;
        private final java.lang.String logDeliveryStatus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDeliveryStatus = software.amazon.jsii.Kernel.get(this, "logDeliveryStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.bucketPrefix = builder.bucketPrefix;
            this.logDeliveryStatus = builder.logDeliveryStatus;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final java.lang.String getLogDeliveryStatus() {
            return this.logDeliveryStatus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            if (this.getBucketPrefix() != null) {
                data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            }
            if (this.getLogDeliveryStatus() != null) {
                data.set("logDeliveryStatus", om.valueToTree(this.getLogDeliveryStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.internetmonitorMonitor.InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config.Jsii$Proxy that = (InternetmonitorMonitorInternetMeasurementsLogDeliveryS3Config.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (this.bucketPrefix != null ? !this.bucketPrefix.equals(that.bucketPrefix) : that.bucketPrefix != null) return false;
            return this.logDeliveryStatus != null ? this.logDeliveryStatus.equals(that.logDeliveryStatus) : that.logDeliveryStatus == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.bucketPrefix != null ? this.bucketPrefix.hashCode() : 0);
            result = 31 * result + (this.logDeliveryStatus != null ? this.logDeliveryStatus.hashCode() : 0);
            return result;
        }
    }
}
