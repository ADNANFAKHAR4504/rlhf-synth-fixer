package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.352Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsStudioWebPortalSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsStudioWebPortalSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsStudioWebPortalSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_app_types SagemakerUserProfile#hidden_app_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenAppTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_instance_types SagemakerUserProfile#hidden_instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_ml_tools SagemakerUserProfile#hidden_ml_tools}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenMlTools() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsStudioWebPortalSettings> {
        java.util.List<java.lang.String> hiddenAppTypes;
        java.util.List<java.lang.String> hiddenInstanceTypes;
        java.util.List<java.lang.String> hiddenMlTools;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings#getHiddenAppTypes}
         * @param hiddenAppTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_app_types SagemakerUserProfile#hidden_app_types}.
         * @return {@code this}
         */
        public Builder hiddenAppTypes(java.util.List<java.lang.String> hiddenAppTypes) {
            this.hiddenAppTypes = hiddenAppTypes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings#getHiddenInstanceTypes}
         * @param hiddenInstanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_instance_types SagemakerUserProfile#hidden_instance_types}.
         * @return {@code this}
         */
        public Builder hiddenInstanceTypes(java.util.List<java.lang.String> hiddenInstanceTypes) {
            this.hiddenInstanceTypes = hiddenInstanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings#getHiddenMlTools}
         * @param hiddenMlTools Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_ml_tools SagemakerUserProfile#hidden_ml_tools}.
         * @return {@code this}
         */
        public Builder hiddenMlTools(java.util.List<java.lang.String> hiddenMlTools) {
            this.hiddenMlTools = hiddenMlTools;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsStudioWebPortalSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsStudioWebPortalSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsStudioWebPortalSettings {
        private final java.util.List<java.lang.String> hiddenAppTypes;
        private final java.util.List<java.lang.String> hiddenInstanceTypes;
        private final java.util.List<java.lang.String> hiddenMlTools;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hiddenAppTypes = software.amazon.jsii.Kernel.get(this, "hiddenAppTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.hiddenInstanceTypes = software.amazon.jsii.Kernel.get(this, "hiddenInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.hiddenMlTools = software.amazon.jsii.Kernel.get(this, "hiddenMlTools", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hiddenAppTypes = builder.hiddenAppTypes;
            this.hiddenInstanceTypes = builder.hiddenInstanceTypes;
            this.hiddenMlTools = builder.hiddenMlTools;
        }

        @Override
        public final java.util.List<java.lang.String> getHiddenAppTypes() {
            return this.hiddenAppTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getHiddenInstanceTypes() {
            return this.hiddenInstanceTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getHiddenMlTools() {
            return this.hiddenMlTools;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHiddenAppTypes() != null) {
                data.set("hiddenAppTypes", om.valueToTree(this.getHiddenAppTypes()));
            }
            if (this.getHiddenInstanceTypes() != null) {
                data.set("hiddenInstanceTypes", om.valueToTree(this.getHiddenInstanceTypes()));
            }
            if (this.getHiddenMlTools() != null) {
                data.set("hiddenMlTools", om.valueToTree(this.getHiddenMlTools()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsStudioWebPortalSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsStudioWebPortalSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsStudioWebPortalSettings.Jsii$Proxy) o;

            if (this.hiddenAppTypes != null ? !this.hiddenAppTypes.equals(that.hiddenAppTypes) : that.hiddenAppTypes != null) return false;
            if (this.hiddenInstanceTypes != null ? !this.hiddenInstanceTypes.equals(that.hiddenInstanceTypes) : that.hiddenInstanceTypes != null) return false;
            return this.hiddenMlTools != null ? this.hiddenMlTools.equals(that.hiddenMlTools) : that.hiddenMlTools == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hiddenAppTypes != null ? this.hiddenAppTypes.hashCode() : 0;
            result = 31 * result + (this.hiddenInstanceTypes != null ? this.hiddenInstanceTypes.hashCode() : 0);
            result = 31 * result + (this.hiddenMlTools != null ? this.hiddenMlTools.hashCode() : 0);
            return result;
        }
    }
}
