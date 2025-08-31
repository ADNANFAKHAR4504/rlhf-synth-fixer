package imports.aws.pinpoint_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.058Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointApp.PinpointAppCampaignHook")
@software.amazon.jsii.Jsii.Proxy(PinpointAppCampaignHook.Jsii$Proxy.class)
public interface PinpointAppCampaignHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#lambda_function_name PinpointApp#lambda_function_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambdaFunctionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#mode PinpointApp#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#web_url PinpointApp#web_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PinpointAppCampaignHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PinpointAppCampaignHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PinpointAppCampaignHook> {
        java.lang.String lambdaFunctionName;
        java.lang.String mode;
        java.lang.String webUrl;

        /**
         * Sets the value of {@link PinpointAppCampaignHook#getLambdaFunctionName}
         * @param lambdaFunctionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#lambda_function_name PinpointApp#lambda_function_name}.
         * @return {@code this}
         */
        public Builder lambdaFunctionName(java.lang.String lambdaFunctionName) {
            this.lambdaFunctionName = lambdaFunctionName;
            return this;
        }

        /**
         * Sets the value of {@link PinpointAppCampaignHook#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#mode PinpointApp#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link PinpointAppCampaignHook#getWebUrl}
         * @param webUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_app#web_url PinpointApp#web_url}.
         * @return {@code this}
         */
        public Builder webUrl(java.lang.String webUrl) {
            this.webUrl = webUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PinpointAppCampaignHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PinpointAppCampaignHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PinpointAppCampaignHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PinpointAppCampaignHook {
        private final java.lang.String lambdaFunctionName;
        private final java.lang.String mode;
        private final java.lang.String webUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lambdaFunctionName = software.amazon.jsii.Kernel.get(this, "lambdaFunctionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.webUrl = software.amazon.jsii.Kernel.get(this, "webUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lambdaFunctionName = builder.lambdaFunctionName;
            this.mode = builder.mode;
            this.webUrl = builder.webUrl;
        }

        @Override
        public final java.lang.String getLambdaFunctionName() {
            return this.lambdaFunctionName;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.lang.String getWebUrl() {
            return this.webUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLambdaFunctionName() != null) {
                data.set("lambdaFunctionName", om.valueToTree(this.getLambdaFunctionName()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }
            if (this.getWebUrl() != null) {
                data.set("webUrl", om.valueToTree(this.getWebUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pinpointApp.PinpointAppCampaignHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PinpointAppCampaignHook.Jsii$Proxy that = (PinpointAppCampaignHook.Jsii$Proxy) o;

            if (this.lambdaFunctionName != null ? !this.lambdaFunctionName.equals(that.lambdaFunctionName) : that.lambdaFunctionName != null) return false;
            if (this.mode != null ? !this.mode.equals(that.mode) : that.mode != null) return false;
            return this.webUrl != null ? this.webUrl.equals(that.webUrl) : that.webUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.lambdaFunctionName != null ? this.lambdaFunctionName.hashCode() : 0;
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            result = 31 * result + (this.webUrl != null ? this.webUrl.hashCode() : 0);
            return result;
        }
    }
}
