package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.311Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsCanvasAppSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsCanvasAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * direct_deploy_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#direct_deploy_settings SagemakerDomain#direct_deploy_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettings() {
        return null;
    }

    /**
     * emr_serverless_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#emr_serverless_settings SagemakerDomain#emr_serverless_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettings() {
        return null;
    }

    /**
     * generative_ai_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#generative_ai_settings SagemakerDomain#generative_ai_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettings() {
        return null;
    }

    /**
     * identity_provider_oauth_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#identity_provider_oauth_settings SagemakerDomain#identity_provider_oauth_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIdentityProviderOauthSettings() {
        return null;
    }

    /**
     * kendra_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kendra_settings SagemakerDomain#kendra_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings getKendraSettings() {
        return null;
    }

    /**
     * model_register_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#model_register_settings SagemakerDomain#model_register_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettings() {
        return null;
    }

    /**
     * time_series_forecasting_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#time_series_forecasting_settings SagemakerDomain#time_series_forecasting_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettings() {
        return null;
    }

    /**
     * workspace_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#workspace_settings SagemakerDomain#workspace_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsCanvasAppSettings> {
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings;
        java.lang.Object identityProviderOauthSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings kendraSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getDirectDeploySettings}
         * @param directDeploySettings direct_deploy_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#direct_deploy_settings SagemakerDomain#direct_deploy_settings}
         * @return {@code this}
         */
        public Builder directDeploySettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings) {
            this.directDeploySettings = directDeploySettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getEmrServerlessSettings}
         * @param emrServerlessSettings emr_serverless_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#emr_serverless_settings SagemakerDomain#emr_serverless_settings}
         * @return {@code this}
         */
        public Builder emrServerlessSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings) {
            this.emrServerlessSettings = emrServerlessSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getGenerativeAiSettings}
         * @param generativeAiSettings generative_ai_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#generative_ai_settings SagemakerDomain#generative_ai_settings}
         * @return {@code this}
         */
        public Builder generativeAiSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings) {
            this.generativeAiSettings = generativeAiSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getIdentityProviderOauthSettings}
         * @param identityProviderOauthSettings identity_provider_oauth_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#identity_provider_oauth_settings SagemakerDomain#identity_provider_oauth_settings}
         * @return {@code this}
         */
        public Builder identityProviderOauthSettings(com.hashicorp.cdktf.IResolvable identityProviderOauthSettings) {
            this.identityProviderOauthSettings = identityProviderOauthSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getIdentityProviderOauthSettings}
         * @param identityProviderOauthSettings identity_provider_oauth_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#identity_provider_oauth_settings SagemakerDomain#identity_provider_oauth_settings}
         * @return {@code this}
         */
        public Builder identityProviderOauthSettings(java.util.List<? extends imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsIdentityProviderOauthSettings> identityProviderOauthSettings) {
            this.identityProviderOauthSettings = identityProviderOauthSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getKendraSettings}
         * @param kendraSettings kendra_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kendra_settings SagemakerDomain#kendra_settings}
         * @return {@code this}
         */
        public Builder kendraSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings kendraSettings) {
            this.kendraSettings = kendraSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getModelRegisterSettings}
         * @param modelRegisterSettings model_register_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#model_register_settings SagemakerDomain#model_register_settings}
         * @return {@code this}
         */
        public Builder modelRegisterSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings) {
            this.modelRegisterSettings = modelRegisterSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getTimeSeriesForecastingSettings}
         * @param timeSeriesForecastingSettings time_series_forecasting_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#time_series_forecasting_settings SagemakerDomain#time_series_forecasting_settings}
         * @return {@code this}
         */
        public Builder timeSeriesForecastingSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings) {
            this.timeSeriesForecastingSettings = timeSeriesForecastingSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings#getWorkspaceSettings}
         * @param workspaceSettings workspace_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#workspace_settings SagemakerDomain#workspace_settings}
         * @return {@code this}
         */
        public Builder workspaceSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings) {
            this.workspaceSettings = workspaceSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsCanvasAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsCanvasAppSettings {
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings;
        private final java.lang.Object identityProviderOauthSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings kendraSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.directDeploySettings = software.amazon.jsii.Kernel.get(this, "directDeploySettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings.class));
            this.emrServerlessSettings = software.amazon.jsii.Kernel.get(this, "emrServerlessSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings.class));
            this.generativeAiSettings = software.amazon.jsii.Kernel.get(this, "generativeAiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings.class));
            this.identityProviderOauthSettings = software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kendraSettings = software.amazon.jsii.Kernel.get(this, "kendraSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings.class));
            this.modelRegisterSettings = software.amazon.jsii.Kernel.get(this, "modelRegisterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings.class));
            this.timeSeriesForecastingSettings = software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.class));
            this.workspaceSettings = software.amazon.jsii.Kernel.get(this, "workspaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.directDeploySettings = builder.directDeploySettings;
            this.emrServerlessSettings = builder.emrServerlessSettings;
            this.generativeAiSettings = builder.generativeAiSettings;
            this.identityProviderOauthSettings = builder.identityProviderOauthSettings;
            this.kendraSettings = builder.kendraSettings;
            this.modelRegisterSettings = builder.modelRegisterSettings;
            this.timeSeriesForecastingSettings = builder.timeSeriesForecastingSettings;
            this.workspaceSettings = builder.workspaceSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettings() {
            return this.directDeploySettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettings() {
            return this.emrServerlessSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettings() {
            return this.generativeAiSettings;
        }

        @Override
        public final java.lang.Object getIdentityProviderOauthSettings() {
            return this.identityProviderOauthSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsKendraSettings getKendraSettings() {
            return this.kendraSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettings() {
            return this.modelRegisterSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettings() {
            return this.timeSeriesForecastingSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettings() {
            return this.workspaceSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDirectDeploySettings() != null) {
                data.set("directDeploySettings", om.valueToTree(this.getDirectDeploySettings()));
            }
            if (this.getEmrServerlessSettings() != null) {
                data.set("emrServerlessSettings", om.valueToTree(this.getEmrServerlessSettings()));
            }
            if (this.getGenerativeAiSettings() != null) {
                data.set("generativeAiSettings", om.valueToTree(this.getGenerativeAiSettings()));
            }
            if (this.getIdentityProviderOauthSettings() != null) {
                data.set("identityProviderOauthSettings", om.valueToTree(this.getIdentityProviderOauthSettings()));
            }
            if (this.getKendraSettings() != null) {
                data.set("kendraSettings", om.valueToTree(this.getKendraSettings()));
            }
            if (this.getModelRegisterSettings() != null) {
                data.set("modelRegisterSettings", om.valueToTree(this.getModelRegisterSettings()));
            }
            if (this.getTimeSeriesForecastingSettings() != null) {
                data.set("timeSeriesForecastingSettings", om.valueToTree(this.getTimeSeriesForecastingSettings()));
            }
            if (this.getWorkspaceSettings() != null) {
                data.set("workspaceSettings", om.valueToTree(this.getWorkspaceSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsCanvasAppSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsCanvasAppSettings.Jsii$Proxy) o;

            if (this.directDeploySettings != null ? !this.directDeploySettings.equals(that.directDeploySettings) : that.directDeploySettings != null) return false;
            if (this.emrServerlessSettings != null ? !this.emrServerlessSettings.equals(that.emrServerlessSettings) : that.emrServerlessSettings != null) return false;
            if (this.generativeAiSettings != null ? !this.generativeAiSettings.equals(that.generativeAiSettings) : that.generativeAiSettings != null) return false;
            if (this.identityProviderOauthSettings != null ? !this.identityProviderOauthSettings.equals(that.identityProviderOauthSettings) : that.identityProviderOauthSettings != null) return false;
            if (this.kendraSettings != null ? !this.kendraSettings.equals(that.kendraSettings) : that.kendraSettings != null) return false;
            if (this.modelRegisterSettings != null ? !this.modelRegisterSettings.equals(that.modelRegisterSettings) : that.modelRegisterSettings != null) return false;
            if (this.timeSeriesForecastingSettings != null ? !this.timeSeriesForecastingSettings.equals(that.timeSeriesForecastingSettings) : that.timeSeriesForecastingSettings != null) return false;
            return this.workspaceSettings != null ? this.workspaceSettings.equals(that.workspaceSettings) : that.workspaceSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.directDeploySettings != null ? this.directDeploySettings.hashCode() : 0;
            result = 31 * result + (this.emrServerlessSettings != null ? this.emrServerlessSettings.hashCode() : 0);
            result = 31 * result + (this.generativeAiSettings != null ? this.generativeAiSettings.hashCode() : 0);
            result = 31 * result + (this.identityProviderOauthSettings != null ? this.identityProviderOauthSettings.hashCode() : 0);
            result = 31 * result + (this.kendraSettings != null ? this.kendraSettings.hashCode() : 0);
            result = 31 * result + (this.modelRegisterSettings != null ? this.modelRegisterSettings.hashCode() : 0);
            result = 31 * result + (this.timeSeriesForecastingSettings != null ? this.timeSeriesForecastingSettings.hashCode() : 0);
            result = 31 * result + (this.workspaceSettings != null ? this.workspaceSettings.hashCode() : 0);
            return result;
        }
    }
}
