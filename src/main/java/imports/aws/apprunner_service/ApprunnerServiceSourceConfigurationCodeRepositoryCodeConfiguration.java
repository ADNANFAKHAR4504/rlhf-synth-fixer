package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#configuration_source ApprunnerService#configuration_source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSource();

    /**
     * code_configuration_values block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_configuration_values ApprunnerService#code_configuration_values}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues getCodeConfigurationValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration> {
        java.lang.String configurationSource;
        imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues codeConfigurationValues;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration#getConfigurationSource}
         * @param configurationSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#configuration_source ApprunnerService#configuration_source}. This parameter is required.
         * @return {@code this}
         */
        public Builder configurationSource(java.lang.String configurationSource) {
            this.configurationSource = configurationSource;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration#getCodeConfigurationValues}
         * @param codeConfigurationValues code_configuration_values block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#code_configuration_values ApprunnerService#code_configuration_values}
         * @return {@code this}
         */
        public Builder codeConfigurationValues(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues codeConfigurationValues) {
            this.codeConfigurationValues = codeConfigurationValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration {
        private final java.lang.String configurationSource;
        private final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues codeConfigurationValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationSource = software.amazon.jsii.Kernel.get(this, "configurationSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codeConfigurationValues = software.amazon.jsii.Kernel.get(this, "codeConfigurationValues", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationSource = java.util.Objects.requireNonNull(builder.configurationSource, "configurationSource is required");
            this.codeConfigurationValues = builder.codeConfigurationValues;
        }

        @Override
        public final java.lang.String getConfigurationSource() {
            return this.configurationSource;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues getCodeConfigurationValues() {
            return this.codeConfigurationValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configurationSource", om.valueToTree(this.getConfigurationSource()));
            if (this.getCodeConfigurationValues() != null) {
                data.set("codeConfigurationValues", om.valueToTree(this.getCodeConfigurationValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.Jsii$Proxy that = (ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.Jsii$Proxy) o;

            if (!configurationSource.equals(that.configurationSource)) return false;
            return this.codeConfigurationValues != null ? this.codeConfigurationValues.equals(that.codeConfigurationValues) : that.codeConfigurationValues == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationSource.hashCode();
            result = 31 * result + (this.codeConfigurationValues != null ? this.codeConfigurationValues.hashCode() : 0);
            return result;
        }
    }
}
