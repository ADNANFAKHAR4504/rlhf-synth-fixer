package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDomainSettings.Jsii$Proxy.class)
public interface SagemakerDomainDomainSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * docker_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#docker_settings SagemakerDomain#docker_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings getDockerSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_identity_config SagemakerDomain#execution_role_identity_config}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleIdentityConfig() {
        return null;
    }

    /**
     * r_studio_server_pro_domain_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_server_pro_domain_settings SagemakerDomain#r_studio_server_pro_domain_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings getRStudioServerProDomainSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_group_ids SagemakerDomain#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDomainSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDomainSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDomainSettings> {
        imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings dockerSettings;
        java.lang.String executionRoleIdentityConfig;
        imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings rStudioServerProDomainSettings;
        java.util.List<java.lang.String> securityGroupIds;

        /**
         * Sets the value of {@link SagemakerDomainDomainSettings#getDockerSettings}
         * @param dockerSettings docker_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#docker_settings SagemakerDomain#docker_settings}
         * @return {@code this}
         */
        public Builder dockerSettings(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings dockerSettings) {
            this.dockerSettings = dockerSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettings#getExecutionRoleIdentityConfig}
         * @param executionRoleIdentityConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_identity_config SagemakerDomain#execution_role_identity_config}.
         * @return {@code this}
         */
        public Builder executionRoleIdentityConfig(java.lang.String executionRoleIdentityConfig) {
            this.executionRoleIdentityConfig = executionRoleIdentityConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettings#getRStudioServerProDomainSettings}
         * @param rStudioServerProDomainSettings r_studio_server_pro_domain_settings block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_server_pro_domain_settings SagemakerDomain#r_studio_server_pro_domain_settings}
         * @return {@code this}
         */
        public Builder rStudioServerProDomainSettings(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings rStudioServerProDomainSettings) {
            this.rStudioServerProDomainSettings = rStudioServerProDomainSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettings#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#security_group_ids SagemakerDomain#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDomainSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDomainSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDomainSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDomainSettings {
        private final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings dockerSettings;
        private final java.lang.String executionRoleIdentityConfig;
        private final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings rStudioServerProDomainSettings;
        private final java.util.List<java.lang.String> securityGroupIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dockerSettings = software.amazon.jsii.Kernel.get(this, "dockerSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings.class));
            this.executionRoleIdentityConfig = software.amazon.jsii.Kernel.get(this, "executionRoleIdentityConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rStudioServerProDomainSettings = software.amazon.jsii.Kernel.get(this, "rStudioServerProDomainSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dockerSettings = builder.dockerSettings;
            this.executionRoleIdentityConfig = builder.executionRoleIdentityConfig;
            this.rStudioServerProDomainSettings = builder.rStudioServerProDomainSettings;
            this.securityGroupIds = builder.securityGroupIds;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings getDockerSettings() {
            return this.dockerSettings;
        }

        @Override
        public final java.lang.String getExecutionRoleIdentityConfig() {
            return this.executionRoleIdentityConfig;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings getRStudioServerProDomainSettings() {
            return this.rStudioServerProDomainSettings;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDockerSettings() != null) {
                data.set("dockerSettings", om.valueToTree(this.getDockerSettings()));
            }
            if (this.getExecutionRoleIdentityConfig() != null) {
                data.set("executionRoleIdentityConfig", om.valueToTree(this.getExecutionRoleIdentityConfig()));
            }
            if (this.getRStudioServerProDomainSettings() != null) {
                data.set("rStudioServerProDomainSettings", om.valueToTree(this.getRStudioServerProDomainSettings()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDomainSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDomainSettings.Jsii$Proxy that = (SagemakerDomainDomainSettings.Jsii$Proxy) o;

            if (this.dockerSettings != null ? !this.dockerSettings.equals(that.dockerSettings) : that.dockerSettings != null) return false;
            if (this.executionRoleIdentityConfig != null ? !this.executionRoleIdentityConfig.equals(that.executionRoleIdentityConfig) : that.executionRoleIdentityConfig != null) return false;
            if (this.rStudioServerProDomainSettings != null ? !this.rStudioServerProDomainSettings.equals(that.rStudioServerProDomainSettings) : that.rStudioServerProDomainSettings != null) return false;
            return this.securityGroupIds != null ? this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dockerSettings != null ? this.dockerSettings.hashCode() : 0;
            result = 31 * result + (this.executionRoleIdentityConfig != null ? this.executionRoleIdentityConfig.hashCode() : 0);
            result = 31 * result + (this.rStudioServerProDomainSettings != null ? this.rStudioServerProDomainSettings.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            return result;
        }
    }
}
