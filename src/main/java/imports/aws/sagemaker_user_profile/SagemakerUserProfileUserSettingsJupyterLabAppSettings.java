package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsJupyterLabAppSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsJupyterLabAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * app_lifecycle_management block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBuiltInLifecycleConfigArn() {
        return null;
    }

    /**
     * code_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeRepository() {
        return null;
    }

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
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
        return null;
    }

    /**
     * emr_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_settings SagemakerUserProfile#emr_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings getEmrSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLifecycleConfigArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsJupyterLabAppSettings> {
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement;
        java.lang.String builtInLifecycleConfigArn;
        java.lang.Object codeRepository;
        java.lang.Object customImage;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec;
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings emrSettings;
        java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getAppLifecycleManagement}
         * @param appLifecycleManagement app_lifecycle_management block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
         * @return {@code this}
         */
        public Builder appLifecycleManagement(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement) {
            this.appLifecycleManagement = appLifecycleManagement;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getBuiltInLifecycleConfigArn}
         * @param builtInLifecycleConfigArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
         * @return {@code this}
         */
        public Builder builtInLifecycleConfigArn(java.lang.String builtInLifecycleConfigArn) {
            this.builtInLifecycleConfigArn = builtInLifecycleConfigArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(com.hashicorp.cdktf.IResolvable codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getCodeRepository}
         * @param codeRepository code_repository block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
         * @return {@code this}
         */
        public Builder codeRepository(java.util.List<? extends imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository> codeRepository) {
            this.codeRepository = codeRepository;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getCustomImage}
         * @param customImage custom_image block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
         * @return {@code this}
         */
        public Builder customImage(com.hashicorp.cdktf.IResolvable customImage) {
            this.customImage = customImage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getCustomImage}
         * @param customImage custom_image block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
         * @return {@code this}
         */
        public Builder customImage(java.util.List<? extends imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage> customImage) {
            this.customImage = customImage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getEmrSettings}
         * @param emrSettings emr_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_settings SagemakerUserProfile#emr_settings}
         * @return {@code this}
         */
        public Builder emrSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings emrSettings) {
            this.emrSettings = emrSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings#getLifecycleConfigArns}
         * @param lifecycleConfigArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
         * @return {@code this}
         */
        public Builder lifecycleConfigArns(java.util.List<java.lang.String> lifecycleConfigArns) {
            this.lifecycleConfigArns = lifecycleConfigArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsJupyterLabAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsJupyterLabAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsJupyterLabAppSettings {
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement appLifecycleManagement;
        private final java.lang.String builtInLifecycleConfigArn;
        private final java.lang.Object codeRepository;
        private final java.lang.Object customImage;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings emrSettings;
        private final java.util.List<java.lang.String> lifecycleConfigArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.appLifecycleManagement = software.amazon.jsii.Kernel.get(this, "appLifecycleManagement", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement.class));
            this.builtInLifecycleConfigArn = software.amazon.jsii.Kernel.get(this, "builtInLifecycleConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codeRepository = software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customImage = software.amazon.jsii.Kernel.get(this, "customImage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec.class));
            this.emrSettings = software.amazon.jsii.Kernel.get(this, "emrSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings.class));
            this.lifecycleConfigArns = software.amazon.jsii.Kernel.get(this, "lifecycleConfigArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.appLifecycleManagement = builder.appLifecycleManagement;
            this.builtInLifecycleConfigArn = builder.builtInLifecycleConfigArn;
            this.codeRepository = builder.codeRepository;
            this.customImage = builder.customImage;
            this.defaultResourceSpec = builder.defaultResourceSpec;
            this.emrSettings = builder.emrSettings;
            this.lifecycleConfigArns = builder.lifecycleConfigArns;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
            return this.appLifecycleManagement;
        }

        @Override
        public final java.lang.String getBuiltInLifecycleConfigArn() {
            return this.builtInLifecycleConfigArn;
        }

        @Override
        public final java.lang.Object getCodeRepository() {
            return this.codeRepository;
        }

        @Override
        public final java.lang.Object getCustomImage() {
            return this.customImage;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings getEmrSettings() {
            return this.emrSettings;
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

            if (this.getAppLifecycleManagement() != null) {
                data.set("appLifecycleManagement", om.valueToTree(this.getAppLifecycleManagement()));
            }
            if (this.getBuiltInLifecycleConfigArn() != null) {
                data.set("builtInLifecycleConfigArn", om.valueToTree(this.getBuiltInLifecycleConfigArn()));
            }
            if (this.getCodeRepository() != null) {
                data.set("codeRepository", om.valueToTree(this.getCodeRepository()));
            }
            if (this.getCustomImage() != null) {
                data.set("customImage", om.valueToTree(this.getCustomImage()));
            }
            if (this.getDefaultResourceSpec() != null) {
                data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            }
            if (this.getEmrSettings() != null) {
                data.set("emrSettings", om.valueToTree(this.getEmrSettings()));
            }
            if (this.getLifecycleConfigArns() != null) {
                data.set("lifecycleConfigArns", om.valueToTree(this.getLifecycleConfigArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsJupyterLabAppSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsJupyterLabAppSettings.Jsii$Proxy) o;

            if (this.appLifecycleManagement != null ? !this.appLifecycleManagement.equals(that.appLifecycleManagement) : that.appLifecycleManagement != null) return false;
            if (this.builtInLifecycleConfigArn != null ? !this.builtInLifecycleConfigArn.equals(that.builtInLifecycleConfigArn) : that.builtInLifecycleConfigArn != null) return false;
            if (this.codeRepository != null ? !this.codeRepository.equals(that.codeRepository) : that.codeRepository != null) return false;
            if (this.customImage != null ? !this.customImage.equals(that.customImage) : that.customImage != null) return false;
            if (this.defaultResourceSpec != null ? !this.defaultResourceSpec.equals(that.defaultResourceSpec) : that.defaultResourceSpec != null) return false;
            if (this.emrSettings != null ? !this.emrSettings.equals(that.emrSettings) : that.emrSettings != null) return false;
            return this.lifecycleConfigArns != null ? this.lifecycleConfigArns.equals(that.lifecycleConfigArns) : that.lifecycleConfigArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.appLifecycleManagement != null ? this.appLifecycleManagement.hashCode() : 0;
            result = 31 * result + (this.builtInLifecycleConfigArn != null ? this.builtInLifecycleConfigArn.hashCode() : 0);
            result = 31 * result + (this.codeRepository != null ? this.codeRepository.hashCode() : 0);
            result = 31 * result + (this.customImage != null ? this.customImage.hashCode() : 0);
            result = 31 * result + (this.defaultResourceSpec != null ? this.defaultResourceSpec.hashCode() : 0);
            result = 31 * result + (this.emrSettings != null ? this.emrSettings.hashCode() : 0);
            result = 31 * result + (this.lifecycleConfigArns != null ? this.lifecycleConfigArns.hashCode() : 0);
            return result;
        }
    }
}
