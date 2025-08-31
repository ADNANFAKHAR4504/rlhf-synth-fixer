package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationImageRepository")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfigurationImageRepository.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfigurationImageRepository extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_identifier ApprunnerService#image_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_repository_type ApprunnerService#image_repository_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageRepositoryType();

    /**
     * image_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_configuration ApprunnerService#image_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration getImageConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfigurationImageRepository}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfigurationImageRepository}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfigurationImageRepository> {
        java.lang.String imageIdentifier;
        java.lang.String imageRepositoryType;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration imageConfiguration;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepository#getImageIdentifier}
         * @param imageIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_identifier ApprunnerService#image_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageIdentifier(java.lang.String imageIdentifier) {
            this.imageIdentifier = imageIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepository#getImageRepositoryType}
         * @param imageRepositoryType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_repository_type ApprunnerService#image_repository_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageRepositoryType(java.lang.String imageRepositoryType) {
            this.imageRepositoryType = imageRepositoryType;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepository#getImageConfiguration}
         * @param imageConfiguration image_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_configuration ApprunnerService#image_configuration}
         * @return {@code this}
         */
        public Builder imageConfiguration(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration imageConfiguration) {
            this.imageConfiguration = imageConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfigurationImageRepository}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfigurationImageRepository build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfigurationImageRepository}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfigurationImageRepository {
        private final java.lang.String imageIdentifier;
        private final java.lang.String imageRepositoryType;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration imageConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.imageIdentifier = software.amazon.jsii.Kernel.get(this, "imageIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageRepositoryType = software.amazon.jsii.Kernel.get(this, "imageRepositoryType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageConfiguration = software.amazon.jsii.Kernel.get(this, "imageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.imageIdentifier = java.util.Objects.requireNonNull(builder.imageIdentifier, "imageIdentifier is required");
            this.imageRepositoryType = java.util.Objects.requireNonNull(builder.imageRepositoryType, "imageRepositoryType is required");
            this.imageConfiguration = builder.imageConfiguration;
        }

        @Override
        public final java.lang.String getImageIdentifier() {
            return this.imageIdentifier;
        }

        @Override
        public final java.lang.String getImageRepositoryType() {
            return this.imageRepositoryType;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration getImageConfiguration() {
            return this.imageConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("imageIdentifier", om.valueToTree(this.getImageIdentifier()));
            data.set("imageRepositoryType", om.valueToTree(this.getImageRepositoryType()));
            if (this.getImageConfiguration() != null) {
                data.set("imageConfiguration", om.valueToTree(this.getImageConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfigurationImageRepository"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfigurationImageRepository.Jsii$Proxy that = (ApprunnerServiceSourceConfigurationImageRepository.Jsii$Proxy) o;

            if (!imageIdentifier.equals(that.imageIdentifier)) return false;
            if (!imageRepositoryType.equals(that.imageRepositoryType)) return false;
            return this.imageConfiguration != null ? this.imageConfiguration.equals(that.imageConfiguration) : that.imageConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.imageIdentifier.hashCode();
            result = 31 * result + (this.imageRepositoryType.hashCode());
            result = 31 * result + (this.imageConfiguration != null ? this.imageConfiguration.hashCode() : 0);
            return result;
        }
    }
}
