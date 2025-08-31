package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepository")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfigurationCodeRepository.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfigurationCodeRepository extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#repository_url ApprunnerService#repository_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryUrl();

    /**
     * source_code_version block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_code_version ApprunnerService#source_code_version}
     */
    @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion getSourceCodeVersion();

    /**
     * code_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_configuration ApprunnerService#code_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration getCodeConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_directory ApprunnerService#source_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDirectory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfigurationCodeRepository}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfigurationCodeRepository}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfigurationCodeRepository> {
        java.lang.String repositoryUrl;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion sourceCodeVersion;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration codeConfiguration;
        java.lang.String sourceDirectory;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepository#getRepositoryUrl}
         * @param repositoryUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#repository_url ApprunnerService#repository_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryUrl(java.lang.String repositoryUrl) {
            this.repositoryUrl = repositoryUrl;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepository#getSourceCodeVersion}
         * @param sourceCodeVersion source_code_version block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_code_version ApprunnerService#source_code_version}
         * @return {@code this}
         */
        public Builder sourceCodeVersion(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion sourceCodeVersion) {
            this.sourceCodeVersion = sourceCodeVersion;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepository#getCodeConfiguration}
         * @param codeConfiguration code_configuration block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_configuration ApprunnerService#code_configuration}
         * @return {@code this}
         */
        public Builder codeConfiguration(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration codeConfiguration) {
            this.codeConfiguration = codeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepository#getSourceDirectory}
         * @param sourceDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#source_directory ApprunnerService#source_directory}.
         * @return {@code this}
         */
        public Builder sourceDirectory(java.lang.String sourceDirectory) {
            this.sourceDirectory = sourceDirectory;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfigurationCodeRepository}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfigurationCodeRepository build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfigurationCodeRepository}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfigurationCodeRepository {
        private final java.lang.String repositoryUrl;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion sourceCodeVersion;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration codeConfiguration;
        private final java.lang.String sourceDirectory;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryUrl = software.amazon.jsii.Kernel.get(this, "repositoryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceCodeVersion = software.amazon.jsii.Kernel.get(this, "sourceCodeVersion", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion.class));
            this.codeConfiguration = software.amazon.jsii.Kernel.get(this, "codeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.class));
            this.sourceDirectory = software.amazon.jsii.Kernel.get(this, "sourceDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryUrl = java.util.Objects.requireNonNull(builder.repositoryUrl, "repositoryUrl is required");
            this.sourceCodeVersion = java.util.Objects.requireNonNull(builder.sourceCodeVersion, "sourceCodeVersion is required");
            this.codeConfiguration = builder.codeConfiguration;
            this.sourceDirectory = builder.sourceDirectory;
        }

        @Override
        public final java.lang.String getRepositoryUrl() {
            return this.repositoryUrl;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion getSourceCodeVersion() {
            return this.sourceCodeVersion;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration getCodeConfiguration() {
            return this.codeConfiguration;
        }

        @Override
        public final java.lang.String getSourceDirectory() {
            return this.sourceDirectory;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryUrl", om.valueToTree(this.getRepositoryUrl()));
            data.set("sourceCodeVersion", om.valueToTree(this.getSourceCodeVersion()));
            if (this.getCodeConfiguration() != null) {
                data.set("codeConfiguration", om.valueToTree(this.getCodeConfiguration()));
            }
            if (this.getSourceDirectory() != null) {
                data.set("sourceDirectory", om.valueToTree(this.getSourceDirectory()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepository"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfigurationCodeRepository.Jsii$Proxy that = (ApprunnerServiceSourceConfigurationCodeRepository.Jsii$Proxy) o;

            if (!repositoryUrl.equals(that.repositoryUrl)) return false;
            if (!sourceCodeVersion.equals(that.sourceCodeVersion)) return false;
            if (this.codeConfiguration != null ? !this.codeConfiguration.equals(that.codeConfiguration) : that.codeConfiguration != null) return false;
            return this.sourceDirectory != null ? this.sourceDirectory.equals(that.sourceDirectory) : that.sourceDirectory == null;
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryUrl.hashCode();
            result = 31 * result + (this.sourceCodeVersion.hashCode());
            result = 31 * result + (this.codeConfiguration != null ? this.codeConfiguration.hashCode() : 0);
            result = 31 * result + (this.sourceDirectory != null ? this.sourceDirectory.hashCode() : 0);
            return result;
        }
    }
}
