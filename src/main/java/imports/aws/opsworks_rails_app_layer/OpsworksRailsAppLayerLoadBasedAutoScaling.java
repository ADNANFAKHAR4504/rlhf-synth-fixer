package imports.aws.opsworks_rails_app_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.038Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksRailsAppLayer.OpsworksRailsAppLayerLoadBasedAutoScaling")
@software.amazon.jsii.Jsii.Proxy(OpsworksRailsAppLayerLoadBasedAutoScaling.Jsii$Proxy.class)
public interface OpsworksRailsAppLayerLoadBasedAutoScaling extends software.amazon.jsii.JsiiSerializable {

    /**
     * downscaling block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#downscaling OpsworksRailsAppLayer#downscaling}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling getDownscaling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#enable OpsworksRailsAppLayer#enable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnable() {
        return null;
    }

    /**
     * upscaling block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#upscaling OpsworksRailsAppLayer#upscaling}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling getUpscaling() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksRailsAppLayerLoadBasedAutoScaling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksRailsAppLayerLoadBasedAutoScaling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksRailsAppLayerLoadBasedAutoScaling> {
        imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling downscaling;
        java.lang.Object enable;
        imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling upscaling;

        /**
         * Sets the value of {@link OpsworksRailsAppLayerLoadBasedAutoScaling#getDownscaling}
         * @param downscaling downscaling block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#downscaling OpsworksRailsAppLayer#downscaling}
         * @return {@code this}
         */
        public Builder downscaling(imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling downscaling) {
            this.downscaling = downscaling;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerLoadBasedAutoScaling#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#enable OpsworksRailsAppLayer#enable}.
         * @return {@code this}
         */
        public Builder enable(java.lang.Boolean enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerLoadBasedAutoScaling#getEnable}
         * @param enable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#enable OpsworksRailsAppLayer#enable}.
         * @return {@code this}
         */
        public Builder enable(com.hashicorp.cdktf.IResolvable enable) {
            this.enable = enable;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksRailsAppLayerLoadBasedAutoScaling#getUpscaling}
         * @param upscaling upscaling block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_rails_app_layer#upscaling OpsworksRailsAppLayer#upscaling}
         * @return {@code this}
         */
        public Builder upscaling(imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling upscaling) {
            this.upscaling = upscaling;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksRailsAppLayerLoadBasedAutoScaling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksRailsAppLayerLoadBasedAutoScaling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksRailsAppLayerLoadBasedAutoScaling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksRailsAppLayerLoadBasedAutoScaling {
        private final imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling downscaling;
        private final java.lang.Object enable;
        private final imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling upscaling;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.downscaling = software.amazon.jsii.Kernel.get(this, "downscaling", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling.class));
            this.enable = software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.upscaling = software.amazon.jsii.Kernel.get(this, "upscaling", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.downscaling = builder.downscaling;
            this.enable = builder.enable;
            this.upscaling = builder.upscaling;
        }

        @Override
        public final imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingDownscaling getDownscaling() {
            return this.downscaling;
        }

        @Override
        public final java.lang.Object getEnable() {
            return this.enable;
        }

        @Override
        public final imports.aws.opsworks_rails_app_layer.OpsworksRailsAppLayerLoadBasedAutoScalingUpscaling getUpscaling() {
            return this.upscaling;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDownscaling() != null) {
                data.set("downscaling", om.valueToTree(this.getDownscaling()));
            }
            if (this.getEnable() != null) {
                data.set("enable", om.valueToTree(this.getEnable()));
            }
            if (this.getUpscaling() != null) {
                data.set("upscaling", om.valueToTree(this.getUpscaling()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksRailsAppLayer.OpsworksRailsAppLayerLoadBasedAutoScaling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksRailsAppLayerLoadBasedAutoScaling.Jsii$Proxy that = (OpsworksRailsAppLayerLoadBasedAutoScaling.Jsii$Proxy) o;

            if (this.downscaling != null ? !this.downscaling.equals(that.downscaling) : that.downscaling != null) return false;
            if (this.enable != null ? !this.enable.equals(that.enable) : that.enable != null) return false;
            return this.upscaling != null ? this.upscaling.equals(that.upscaling) : that.upscaling == null;
        }

        @Override
        public final int hashCode() {
            int result = this.downscaling != null ? this.downscaling.hashCode() : 0;
            result = 31 * result + (this.enable != null ? this.enable.hashCode() : 0);
            result = 31 * result + (this.upscaling != null ? this.upscaling.hashCode() : 0);
            return result;
        }
    }
}
