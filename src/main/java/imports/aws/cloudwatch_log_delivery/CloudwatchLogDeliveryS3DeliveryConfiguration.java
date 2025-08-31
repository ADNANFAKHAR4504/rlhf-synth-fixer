package imports.aws.cloudwatch_log_delivery;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.282Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogDelivery.CloudwatchLogDeliveryS3DeliveryConfiguration")
@software.amazon.jsii.Jsii.Proxy(CloudwatchLogDeliveryS3DeliveryConfiguration.Jsii$Proxy.class)
public interface CloudwatchLogDeliveryS3DeliveryConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#enable_hive_compatible_path CloudwatchLogDelivery#enable_hive_compatible_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableHiveCompatiblePath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#suffix_path CloudwatchLogDelivery#suffix_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuffixPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchLogDeliveryS3DeliveryConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchLogDeliveryS3DeliveryConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchLogDeliveryS3DeliveryConfiguration> {
        java.lang.Object enableHiveCompatiblePath;
        java.lang.String suffixPath;

        /**
         * Sets the value of {@link CloudwatchLogDeliveryS3DeliveryConfiguration#getEnableHiveCompatiblePath}
         * @param enableHiveCompatiblePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#enable_hive_compatible_path CloudwatchLogDelivery#enable_hive_compatible_path}.
         * @return {@code this}
         */
        public Builder enableHiveCompatiblePath(java.lang.Boolean enableHiveCompatiblePath) {
            this.enableHiveCompatiblePath = enableHiveCompatiblePath;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryS3DeliveryConfiguration#getEnableHiveCompatiblePath}
         * @param enableHiveCompatiblePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#enable_hive_compatible_path CloudwatchLogDelivery#enable_hive_compatible_path}.
         * @return {@code this}
         */
        public Builder enableHiveCompatiblePath(com.hashicorp.cdktf.IResolvable enableHiveCompatiblePath) {
            this.enableHiveCompatiblePath = enableHiveCompatiblePath;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogDeliveryS3DeliveryConfiguration#getSuffixPath}
         * @param suffixPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery#suffix_path CloudwatchLogDelivery#suffix_path}.
         * @return {@code this}
         */
        public Builder suffixPath(java.lang.String suffixPath) {
            this.suffixPath = suffixPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchLogDeliveryS3DeliveryConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchLogDeliveryS3DeliveryConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchLogDeliveryS3DeliveryConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchLogDeliveryS3DeliveryConfiguration {
        private final java.lang.Object enableHiveCompatiblePath;
        private final java.lang.String suffixPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableHiveCompatiblePath = software.amazon.jsii.Kernel.get(this, "enableHiveCompatiblePath", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.suffixPath = software.amazon.jsii.Kernel.get(this, "suffixPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableHiveCompatiblePath = builder.enableHiveCompatiblePath;
            this.suffixPath = builder.suffixPath;
        }

        @Override
        public final java.lang.Object getEnableHiveCompatiblePath() {
            return this.enableHiveCompatiblePath;
        }

        @Override
        public final java.lang.String getSuffixPath() {
            return this.suffixPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableHiveCompatiblePath() != null) {
                data.set("enableHiveCompatiblePath", om.valueToTree(this.getEnableHiveCompatiblePath()));
            }
            if (this.getSuffixPath() != null) {
                data.set("suffixPath", om.valueToTree(this.getSuffixPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchLogDelivery.CloudwatchLogDeliveryS3DeliveryConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchLogDeliveryS3DeliveryConfiguration.Jsii$Proxy that = (CloudwatchLogDeliveryS3DeliveryConfiguration.Jsii$Proxy) o;

            if (this.enableHiveCompatiblePath != null ? !this.enableHiveCompatiblePath.equals(that.enableHiveCompatiblePath) : that.enableHiveCompatiblePath != null) return false;
            return this.suffixPath != null ? this.suffixPath.equals(that.suffixPath) : that.suffixPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableHiveCompatiblePath != null ? this.enableHiveCompatiblePath.hashCode() : 0;
            result = 31 * result + (this.suffixPath != null ? this.suffixPath.hashCode() : 0);
            return result;
        }
    }
}
