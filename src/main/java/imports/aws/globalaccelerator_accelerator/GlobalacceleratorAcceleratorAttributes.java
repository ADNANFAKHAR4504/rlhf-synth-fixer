package imports.aws.globalaccelerator_accelerator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.268Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorAccelerator.GlobalacceleratorAcceleratorAttributes")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorAcceleratorAttributes.Jsii$Proxy.class)
public interface GlobalacceleratorAcceleratorAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_enabled GlobalacceleratorAccelerator#flow_logs_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFlowLogsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_s3_bucket GlobalacceleratorAccelerator#flow_logs_s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFlowLogsS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_s3_prefix GlobalacceleratorAccelerator#flow_logs_s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFlowLogsS3Prefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorAcceleratorAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorAcceleratorAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorAcceleratorAttributes> {
        java.lang.Object flowLogsEnabled;
        java.lang.String flowLogsS3Bucket;
        java.lang.String flowLogsS3Prefix;

        /**
         * Sets the value of {@link GlobalacceleratorAcceleratorAttributes#getFlowLogsEnabled}
         * @param flowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_enabled GlobalacceleratorAccelerator#flow_logs_enabled}.
         * @return {@code this}
         */
        public Builder flowLogsEnabled(java.lang.Boolean flowLogsEnabled) {
            this.flowLogsEnabled = flowLogsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorAcceleratorAttributes#getFlowLogsEnabled}
         * @param flowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_enabled GlobalacceleratorAccelerator#flow_logs_enabled}.
         * @return {@code this}
         */
        public Builder flowLogsEnabled(com.hashicorp.cdktf.IResolvable flowLogsEnabled) {
            this.flowLogsEnabled = flowLogsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorAcceleratorAttributes#getFlowLogsS3Bucket}
         * @param flowLogsS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_s3_bucket GlobalacceleratorAccelerator#flow_logs_s3_bucket}.
         * @return {@code this}
         */
        public Builder flowLogsS3Bucket(java.lang.String flowLogsS3Bucket) {
            this.flowLogsS3Bucket = flowLogsS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorAcceleratorAttributes#getFlowLogsS3Prefix}
         * @param flowLogsS3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_accelerator#flow_logs_s3_prefix GlobalacceleratorAccelerator#flow_logs_s3_prefix}.
         * @return {@code this}
         */
        public Builder flowLogsS3Prefix(java.lang.String flowLogsS3Prefix) {
            this.flowLogsS3Prefix = flowLogsS3Prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlobalacceleratorAcceleratorAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorAcceleratorAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorAcceleratorAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorAcceleratorAttributes {
        private final java.lang.Object flowLogsEnabled;
        private final java.lang.String flowLogsS3Bucket;
        private final java.lang.String flowLogsS3Prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.flowLogsEnabled = software.amazon.jsii.Kernel.get(this, "flowLogsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.flowLogsS3Bucket = software.amazon.jsii.Kernel.get(this, "flowLogsS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.flowLogsS3Prefix = software.amazon.jsii.Kernel.get(this, "flowLogsS3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.flowLogsEnabled = builder.flowLogsEnabled;
            this.flowLogsS3Bucket = builder.flowLogsS3Bucket;
            this.flowLogsS3Prefix = builder.flowLogsS3Prefix;
        }

        @Override
        public final java.lang.Object getFlowLogsEnabled() {
            return this.flowLogsEnabled;
        }

        @Override
        public final java.lang.String getFlowLogsS3Bucket() {
            return this.flowLogsS3Bucket;
        }

        @Override
        public final java.lang.String getFlowLogsS3Prefix() {
            return this.flowLogsS3Prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFlowLogsEnabled() != null) {
                data.set("flowLogsEnabled", om.valueToTree(this.getFlowLogsEnabled()));
            }
            if (this.getFlowLogsS3Bucket() != null) {
                data.set("flowLogsS3Bucket", om.valueToTree(this.getFlowLogsS3Bucket()));
            }
            if (this.getFlowLogsS3Prefix() != null) {
                data.set("flowLogsS3Prefix", om.valueToTree(this.getFlowLogsS3Prefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.globalacceleratorAccelerator.GlobalacceleratorAcceleratorAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorAcceleratorAttributes.Jsii$Proxy that = (GlobalacceleratorAcceleratorAttributes.Jsii$Proxy) o;

            if (this.flowLogsEnabled != null ? !this.flowLogsEnabled.equals(that.flowLogsEnabled) : that.flowLogsEnabled != null) return false;
            if (this.flowLogsS3Bucket != null ? !this.flowLogsS3Bucket.equals(that.flowLogsS3Bucket) : that.flowLogsS3Bucket != null) return false;
            return this.flowLogsS3Prefix != null ? this.flowLogsS3Prefix.equals(that.flowLogsS3Prefix) : that.flowLogsS3Prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.flowLogsEnabled != null ? this.flowLogsEnabled.hashCode() : 0;
            result = 31 * result + (this.flowLogsS3Bucket != null ? this.flowLogsS3Bucket.hashCode() : 0);
            result = 31 * result + (this.flowLogsS3Prefix != null ? this.flowLogsS3Prefix.hashCode() : 0);
            return result;
        }
    }
}
