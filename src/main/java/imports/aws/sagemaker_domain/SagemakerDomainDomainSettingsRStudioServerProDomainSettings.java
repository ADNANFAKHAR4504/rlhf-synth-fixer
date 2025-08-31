package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDomainSettingsRStudioServerProDomainSettings.Jsii$Proxy.class)
public interface SagemakerDomainDomainSettingsRStudioServerProDomainSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_execution_role_arn SagemakerDomain#domain_execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainExecutionRoleArn();

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec getDefaultResourceSpec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_connect_url SagemakerDomain#r_studio_connect_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRStudioConnectUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_package_manager_url SagemakerDomain#r_studio_package_manager_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRStudioPackageManagerUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDomainSettingsRStudioServerProDomainSettings> {
        java.lang.String domainExecutionRoleArn;
        imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec defaultResourceSpec;
        java.lang.String rStudioConnectUrl;
        java.lang.String rStudioPackageManagerUrl;

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings#getDomainExecutionRoleArn}
         * @param domainExecutionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_execution_role_arn SagemakerDomain#domain_execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainExecutionRoleArn(java.lang.String domainExecutionRoleArn) {
            this.domainExecutionRoleArn = domainExecutionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings#getRStudioConnectUrl}
         * @param rStudioConnectUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_connect_url SagemakerDomain#r_studio_connect_url}.
         * @return {@code this}
         */
        public Builder rStudioConnectUrl(java.lang.String rStudioConnectUrl) {
            this.rStudioConnectUrl = rStudioConnectUrl;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings#getRStudioPackageManagerUrl}
         * @param rStudioPackageManagerUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#r_studio_package_manager_url SagemakerDomain#r_studio_package_manager_url}.
         * @return {@code this}
         */
        public Builder rStudioPackageManagerUrl(java.lang.String rStudioPackageManagerUrl) {
            this.rStudioPackageManagerUrl = rStudioPackageManagerUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDomainSettingsRStudioServerProDomainSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDomainSettingsRStudioServerProDomainSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDomainSettingsRStudioServerProDomainSettings {
        private final java.lang.String domainExecutionRoleArn;
        private final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec defaultResourceSpec;
        private final java.lang.String rStudioConnectUrl;
        private final java.lang.String rStudioPackageManagerUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainExecutionRoleArn = software.amazon.jsii.Kernel.get(this, "domainExecutionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec.class));
            this.rStudioConnectUrl = software.amazon.jsii.Kernel.get(this, "rStudioConnectUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rStudioPackageManagerUrl = software.amazon.jsii.Kernel.get(this, "rStudioPackageManagerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainExecutionRoleArn = java.util.Objects.requireNonNull(builder.domainExecutionRoleArn, "domainExecutionRoleArn is required");
            this.defaultResourceSpec = builder.defaultResourceSpec;
            this.rStudioConnectUrl = builder.rStudioConnectUrl;
            this.rStudioPackageManagerUrl = builder.rStudioPackageManagerUrl;
        }

        @Override
        public final java.lang.String getDomainExecutionRoleArn() {
            return this.domainExecutionRoleArn;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final java.lang.String getRStudioConnectUrl() {
            return this.rStudioConnectUrl;
        }

        @Override
        public final java.lang.String getRStudioPackageManagerUrl() {
            return this.rStudioPackageManagerUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainExecutionRoleArn", om.valueToTree(this.getDomainExecutionRoleArn()));
            if (this.getDefaultResourceSpec() != null) {
                data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            }
            if (this.getRStudioConnectUrl() != null) {
                data.set("rStudioConnectUrl", om.valueToTree(this.getRStudioConnectUrl()));
            }
            if (this.getRStudioPackageManagerUrl() != null) {
                data.set("rStudioPackageManagerUrl", om.valueToTree(this.getRStudioPackageManagerUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDomainSettingsRStudioServerProDomainSettings.Jsii$Proxy that = (SagemakerDomainDomainSettingsRStudioServerProDomainSettings.Jsii$Proxy) o;

            if (!domainExecutionRoleArn.equals(that.domainExecutionRoleArn)) return false;
            if (this.defaultResourceSpec != null ? !this.defaultResourceSpec.equals(that.defaultResourceSpec) : that.defaultResourceSpec != null) return false;
            if (this.rStudioConnectUrl != null ? !this.rStudioConnectUrl.equals(that.rStudioConnectUrl) : that.rStudioConnectUrl != null) return false;
            return this.rStudioPackageManagerUrl != null ? this.rStudioPackageManagerUrl.equals(that.rStudioPackageManagerUrl) : that.rStudioPackageManagerUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainExecutionRoleArn.hashCode();
            result = 31 * result + (this.defaultResourceSpec != null ? this.defaultResourceSpec.hashCode() : 0);
            result = 31 * result + (this.rStudioConnectUrl != null ? this.rStudioConnectUrl.hashCode() : 0);
            result = 31 * result + (this.rStudioPackageManagerUrl != null ? this.rStudioPackageManagerUrl.hashCode() : 0);
            return result;
        }
    }
}
