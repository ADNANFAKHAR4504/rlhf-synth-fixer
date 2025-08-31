package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.351Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsKernelGatewayAppSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsKernelGatewayAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * custom_image block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomImage() {
        return null;
    }

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLifecycleConfigArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsKernelGatewayAppSettings> {
        java.lang.Object customImage;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec defaultResourceSpec;
        java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings#getCustomImage}
         * @param customImage custom_image block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
         * @return {@code this}
         */
        public Builder customImage(com.hashicorp.cdktf.IResolvable customImage) {
            this.customImage = customImage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings#getCustomImage}
         * @param customImage custom_image block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
         * @return {@code this}
         */
        public Builder customImage(java.util.List<? extends imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage> customImage) {
            this.customImage = customImage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings#getLifecycleConfigArns}
         * @param lifecycleConfigArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
         * @return {@code this}
         */
        public Builder lifecycleConfigArns(java.util.List<java.lang.String> lifecycleConfigArns) {
            this.lifecycleConfigArns = lifecycleConfigArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsKernelGatewayAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsKernelGatewayAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsKernelGatewayAppSettings {
        private final java.lang.Object customImage;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customImage = software.amazon.jsii.Kernel.get(this, "customImage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec.class));
            this.lifecycleConfigArns = software.amazon.jsii.Kernel.get(this, "lifecycleConfigArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customImage = builder.customImage;
            this.defaultResourceSpec = builder.defaultResourceSpec;
            this.lifecycleConfigArns = builder.lifecycleConfigArns;
        }

        @Override
        public final java.lang.Object getCustomImage() {
            return this.customImage;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final java.util.List<java.lang.String> getLifecycleConfigArns() {
            return this.lifecycleConfigArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomImage() != null) {
                data.set("customImage", om.valueToTree(this.getCustomImage()));
            }
            if (this.getDefaultResourceSpec() != null) {
                data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            }
            if (this.getLifecycleConfigArns() != null) {
                data.set("lifecycleConfigArns", om.valueToTree(this.getLifecycleConfigArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsKernelGatewayAppSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsKernelGatewayAppSettings.Jsii$Proxy) o;

            if (this.customImage != null ? !this.customImage.equals(that.customImage) : that.customImage != null) return false;
            if (this.defaultResourceSpec != null ? !this.defaultResourceSpec.equals(that.defaultResourceSpec) : that.defaultResourceSpec != null) return false;
            return this.lifecycleConfigArns != null ? this.lifecycleConfigArns.equals(that.lifecycleConfigArns) : that.lifecycleConfigArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customImage != null ? this.customImage.hashCode() : 0;
            result = 31 * result + (this.defaultResourceSpec != null ? this.defaultResourceSpec.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfigArns != null ? this.lifecycleConfigArns.hashCode() : 0);
            return result;
        }
    }
}
