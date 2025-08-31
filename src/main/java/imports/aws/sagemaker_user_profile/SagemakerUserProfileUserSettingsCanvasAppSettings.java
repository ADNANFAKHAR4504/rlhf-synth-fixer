package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsCanvasAppSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsCanvasAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * direct_deploy_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#direct_deploy_settings SagemakerUserProfile#direct_deploy_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettings() {
        return null;
    }

    /**
     * emr_serverless_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_serverless_settings SagemakerUserProfile#emr_serverless_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettings() {
        return null;
    }

    /**
     * generative_ai_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#generative_ai_settings SagemakerUserProfile#generative_ai_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettings() {
        return null;
    }

    /**
     * identity_provider_oauth_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIdentityProviderOauthSettings() {
        return null;
    }

    /**
     * kendra_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kendra_settings SagemakerUserProfile#kendra_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings getKendraSettings() {
        return null;
    }

    /**
     * model_register_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#model_register_settings SagemakerUserProfile#model_register_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettings() {
        return null;
    }

    /**
     * time_series_forecasting_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#time_series_forecasting_settings SagemakerUserProfile#time_series_forecasting_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettings() {
        return null;
    }

    /**
     * workspace_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#workspace_settings SagemakerUserProfile#workspace_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsCanvasAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsCanvasAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsCanvasAppSettings> {
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings;
        java.lang.Object identityProviderOauthSettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings kendraSettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getDirectDeploySettings}
         * @param directDeploySettings direct_deploy_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#direct_deploy_settings SagemakerUserProfile#direct_deploy_settings}
         * @return {@code this}
         */
        public Builder directDeploySettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings) {
            this.directDeploySettings = directDeploySettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getEmrServerlessSettings}
         * @param emrServerlessSettings emr_serverless_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_serverless_settings SagemakerUserProfile#emr_serverless_settings}
         * @return {@code this}
         */
        public Builder emrServerlessSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings) {
            this.emrServerlessSettings = emrServerlessSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getGenerativeAiSettings}
         * @param generativeAiSettings generative_ai_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#generative_ai_settings SagemakerUserProfile#generative_ai_settings}
         * @return {@code this}
         */
        public Builder generativeAiSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings) {
            this.generativeAiSettings = generativeAiSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getIdentityProviderOauthSettings}
         * @param identityProviderOauthSettings identity_provider_oauth_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
         * @return {@code this}
         */
        public Builder identityProviderOauthSettings(com.hashicorp.cdktf.IResolvable identityProviderOauthSettings) {
            this.identityProviderOauthSettings = identityProviderOauthSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getIdentityProviderOauthSettings}
         * @param identityProviderOauthSettings identity_provider_oauth_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
         * @return {@code this}
         */
        public Builder identityProviderOauthSettings(java.util.List<? extends imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings> identityProviderOauthSettings) {
            this.identityProviderOauthSettings = identityProviderOauthSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getKendraSettings}
         * @param kendraSettings kendra_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kendra_settings SagemakerUserProfile#kendra_settings}
         * @return {@code this}
         */
        public Builder kendraSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings kendraSettings) {
            this.kendraSettings = kendraSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getModelRegisterSettings}
         * @param modelRegisterSettings model_register_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#model_register_settings SagemakerUserProfile#model_register_settings}
         * @return {@code this}
         */
        public Builder modelRegisterSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings) {
            this.modelRegisterSettings = modelRegisterSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getTimeSeriesForecastingSettings}
         * @param timeSeriesForecastingSettings time_series_forecasting_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#time_series_forecasting_settings SagemakerUserProfile#time_series_forecasting_settings}
         * @return {@code this}
         */
        public Builder timeSeriesForecastingSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings) {
            this.timeSeriesForecastingSettings = timeSeriesForecastingSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettings#getWorkspaceSettings}
         * @param workspaceSettings workspace_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#workspace_settings SagemakerUserProfile#workspace_settings}
         * @return {@code this}
         */
        public Builder workspaceSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings) {
            this.workspaceSettings = workspaceSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsCanvasAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsCanvasAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsCanvasAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsCanvasAppSettings {
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings directDeploySettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings emrServerlessSettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings generativeAiSettings;
        private final java.lang.Object identityProviderOauthSettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings kendraSettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings modelRegisterSettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings timeSeriesForecastingSettings;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings workspaceSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.directDeploySettings = software.amazon.jsii.Kernel.get(this, "directDeploySettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings.class));
            this.emrServerlessSettings = software.amazon.jsii.Kernel.get(this, "emrServerlessSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings.class));
            this.generativeAiSettings = software.amazon.jsii.Kernel.get(this, "generativeAiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings.class));
            this.identityProviderOauthSettings = software.amazon.jsii.Kernel.get(this, "identityProviderOauthSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kendraSettings = software.amazon.jsii.Kernel.get(this, "kendraSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings.class));
            this.modelRegisterSettings = software.amazon.jsii.Kernel.get(this, "modelRegisterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings.class));
            this.timeSeriesForecastingSettings = software.amazon.jsii.Kernel.get(this, "timeSeriesForecastingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.class));
            this.workspaceSettings = software.amazon.jsii.Kernel.get(this, "workspaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings.class));
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
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings getDirectDeploySettings() {
            return this.directDeploySettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings getEmrServerlessSettings() {
            return this.emrServerlessSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings getGenerativeAiSettings() {
            return this.generativeAiSettings;
        }

        @Override
        public final java.lang.Object getIdentityProviderOauthSettings() {
            return this.identityProviderOauthSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings getKendraSettings() {
            return this.kendraSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings getModelRegisterSettings() {
            return this.modelRegisterSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings getTimeSeriesForecastingSettings() {
            return this.timeSeriesForecastingSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings getWorkspaceSettings() {
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
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsCanvasAppSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsCanvasAppSettings.Jsii$Proxy) o;

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
