package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * authentication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#authentication_configuration ApprunnerService#authentication_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration getAuthenticationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#auto_deployments_enabled ApprunnerService#auto_deployments_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoDeploymentsEnabled() {
        return null;
    }

    /**
     * code_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_repository ApprunnerService#code_repository}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository getCodeRepository() {
        return null;
    }

    /**
     * image_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_repository ApprunnerService#image_repository}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository getImageRepository() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfiguration> {
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration authenticationConfiguration;
        java.lang.Object autoDeploymentsEnabled;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository codeRepository;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository imageRepository;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfiguration#getAuthenticationConfiguration}
         * @param authenticationConfiguration authentication_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#authentication_configuration ApprunnerService#authentication_configuration}
         * @return {@code this}
         */
        public Builder authenticationConfiguration(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration authenticationConfiguration) {
            this.authenticationConfiguration = authenticationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfiguration#getAutoDeploymentsEnabled}
         * @param autoDeploymentsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#auto_deployments_enabled ApprunnerService#auto_deployments_enabled}.
         * @return {@code this}
         */
        public Builder autoDeploymentsEnabled(java.lang.Boolean autoDeploymentsEnabled) {
            this.autoDeploymentsEnabled = autoDeploymentsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfiguration#getAutoDeploymentsEnabled}
         * @param autoDeploymentsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#auto_deployments_enabled ApprunnerService#auto_deployments_enabled}.
         * @return {@code this}
         */
        public Builder autoDeploymentsEnabled(com.hashicorp.cdktf.IResolvable autoDeploymentsEnabled) {
            this.autoDeploymentsEnabled = autoDeploymentsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfiguration#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_repository ApprunnerService#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfiguration#getImageRepository}
         * @param imageRepository image_repository block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#image_repository ApprunnerService#image_repository}
         * @return {@code this}
         */
        public Builder imageRepository(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository imageRepository) {
            this.imageRepository = imageRepository;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfiguration {
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration authenticationConfiguration;
        private final java.lang.Object autoDeploymentsEnabled;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository codeRepository;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository imageRepository;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationConfiguration = software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration.class));
            this.autoDeploymentsEnabled = software.amazon.jsii.Kernel.get(this, "autoDeploymentsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.codeRepository = software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository.class));
            this.imageRepository = software.amazon.jsii.Kernel.get(this, "imageRepository", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationConfiguration = builder.authenticationConfiguration;
            this.autoDeploymentsEnabled = builder.autoDeploymentsEnabled;
            this.codeRepository = builder.codeRepository;
            this.imageRepository = builder.imageRepository;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration getAuthenticationConfiguration() {
            return this.authenticationConfiguration;
        }

        @Override
        public final java.lang.Object getAutoDeploymentsEnabled() {
            return this.autoDeploymentsEnabled;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository getCodeRepository() {
            return this.codeRepository;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository getImageRepository() {
            return this.imageRepository;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuthenticationConfiguration() != null) {
                data.set("authenticationConfiguration", om.valueToTree(this.getAuthenticationConfiguration()));
            }
            if (this.getAutoDeploymentsEnabled() != null) {
                data.set("autoDeploymentsEnabled", om.valueToTree(this.getAutoDeploymentsEnabled()));
            }
            if (this.getCodeRepository() != null) {
                data.set("codeRepository", om.valueToTree(this.getCodeRepository()));
            }
            if (this.getImageRepository() != null) {
                data.set("imageRepository", om.valueToTree(this.getImageRepository()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfiguration.Jsii$Proxy that = (ApprunnerServiceSourceConfiguration.Jsii$Proxy) o;

            if (this.authenticationConfiguration != null ? !this.authenticationConfiguration.equals(that.authenticationConfiguration) : that.authenticationConfiguration != null) return false;
            if (this.autoDeploymentsEnabled != null ? !this.autoDeploymentsEnabled.equals(that.autoDeploymentsEnabled) : that.autoDeploymentsEnabled != null) return false;
            if (this.codeRepository != null ? !this.codeRepository.equals(that.codeRepository) : that.codeRepository != null) return false;
            return this.imageRepository != null ? this.imageRepository.equals(that.imageRepository) : that.imageRepository == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationConfiguration != null ? this.authenticationConfiguration.hashCode() : 0;
            result = 31 * result + (this.autoDeploymentsEnabled != null ? this.autoDeploymentsEnabled.hashCode() : 0);
            result = 31 * result + (this.codeRepository != null ? this.codeRepository.hashCode() : 0);
            result = 31 * result + (this.imageRepository != null ? this.imageRepository.hashCode() : 0);
            return result;
        }
    }
}
