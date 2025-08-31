package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.312Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_image_config_name SagemakerDomain#app_image_config_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAppImageConfigName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#image_name SagemakerDomain#image_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#image_version_number SagemakerDomain#image_version_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getImageVersionNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage> {
        java.lang.String appImageConfigName;
        java.lang.String imageName;
        java.lang.Number imageVersionNumber;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage#getAppImageConfigName}
         * @param appImageConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_image_config_name SagemakerDomain#app_image_config_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder appImageConfigName(java.lang.String appImageConfigName) {
            this.appImageConfigName = appImageConfigName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage#getImageName}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#image_name SagemakerDomain#image_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageName(java.lang.String imageName) {
            this.imageName = imageName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage#getImageVersionNumber}
         * @param imageVersionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#image_version_number SagemakerDomain#image_version_number}.
         * @return {@code this}
         */
        public Builder imageVersionNumber(java.lang.Number imageVersionNumber) {
            this.imageVersionNumber = imageVersionNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage {
        private final java.lang.String appImageConfigName;
        private final java.lang.String imageName;
        private final java.lang.Number imageVersionNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.appImageConfigName = software.amazon.jsii.Kernel.get(this, "appImageConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageName = software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageVersionNumber = software.amazon.jsii.Kernel.get(this, "imageVersionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.appImageConfigName = java.util.Objects.requireNonNull(builder.appImageConfigName, "appImageConfigName is required");
            this.imageName = java.util.Objects.requireNonNull(builder.imageName, "imageName is required");
            this.imageVersionNumber = builder.imageVersionNumber;
        }

        @Override
        public final java.lang.String getAppImageConfigName() {
            return this.appImageConfigName;
        }

        @Override
        public final java.lang.String getImageName() {
            return this.imageName;
        }

        @Override
        public final java.lang.Number getImageVersionNumber() {
            return this.imageVersionNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("appImageConfigName", om.valueToTree(this.getAppImageConfigName()));
            data.set("imageName", om.valueToTree(this.getImageName()));
            if (this.getImageVersionNumber() != null) {
                data.set("imageVersionNumber", om.valueToTree(this.getImageVersionNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsCodeEditorAppSettingsCustomImage.Jsii$Proxy) o;

            if (!appImageConfigName.equals(that.appImageConfigName)) return false;
            if (!imageName.equals(that.imageName)) return false;
            return this.imageVersionNumber != null ? this.imageVersionNumber.equals(that.imageVersionNumber) : that.imageVersionNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.appImageConfigName.hashCode();
            result = 31 * result + (this.imageName.hashCode());
            result = 31 * result + (this.imageVersionNumber != null ? this.imageVersionNumber.hashCode() : 0);
            return result;
        }
    }
}
