package imports.aws.ssmquicksetup_configuration_manager;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmquicksetupConfigurationManager.SsmquicksetupConfigurationManagerConfigurationDefinition")
@software.amazon.jsii.Jsii.Proxy(SsmquicksetupConfigurationManagerConfigurationDefinition.Jsii$Proxy.class)
public interface SsmquicksetupConfigurationManagerConfigurationDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#parameters SsmquicksetupConfigurationManager#parameters}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#type SsmquicksetupConfigurationManager#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#local_deployment_administration_role_arn SsmquicksetupConfigurationManager#local_deployment_administration_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalDeploymentAdministrationRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#local_deployment_execution_role_name SsmquicksetupConfigurationManager#local_deployment_execution_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalDeploymentExecutionRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#type_version SsmquicksetupConfigurationManager#type_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTypeVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmquicksetupConfigurationManagerConfigurationDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmquicksetupConfigurationManagerConfigurationDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmquicksetupConfigurationManagerConfigurationDefinition> {
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.lang.String type;
        java.lang.String localDeploymentAdministrationRoleArn;
        java.lang.String localDeploymentExecutionRoleName;
        java.lang.String typeVersion;

        /**
         * Sets the value of {@link SsmquicksetupConfigurationManagerConfigurationDefinition#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#parameters SsmquicksetupConfigurationManager#parameters}. This parameter is required.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmquicksetupConfigurationManagerConfigurationDefinition#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#type SsmquicksetupConfigurationManager#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link SsmquicksetupConfigurationManagerConfigurationDefinition#getLocalDeploymentAdministrationRoleArn}
         * @param localDeploymentAdministrationRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#local_deployment_administration_role_arn SsmquicksetupConfigurationManager#local_deployment_administration_role_arn}.
         * @return {@code this}
         */
        public Builder localDeploymentAdministrationRoleArn(java.lang.String localDeploymentAdministrationRoleArn) {
            this.localDeploymentAdministrationRoleArn = localDeploymentAdministrationRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmquicksetupConfigurationManagerConfigurationDefinition#getLocalDeploymentExecutionRoleName}
         * @param localDeploymentExecutionRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#local_deployment_execution_role_name SsmquicksetupConfigurationManager#local_deployment_execution_role_name}.
         * @return {@code this}
         */
        public Builder localDeploymentExecutionRoleName(java.lang.String localDeploymentExecutionRoleName) {
            this.localDeploymentExecutionRoleName = localDeploymentExecutionRoleName;
            return this;
        }

        /**
         * Sets the value of {@link SsmquicksetupConfigurationManagerConfigurationDefinition#getTypeVersion}
         * @param typeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmquicksetup_configuration_manager#type_version SsmquicksetupConfigurationManager#type_version}.
         * @return {@code this}
         */
        public Builder typeVersion(java.lang.String typeVersion) {
            this.typeVersion = typeVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmquicksetupConfigurationManagerConfigurationDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmquicksetupConfigurationManagerConfigurationDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmquicksetupConfigurationManagerConfigurationDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmquicksetupConfigurationManagerConfigurationDefinition {
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.lang.String type;
        private final java.lang.String localDeploymentAdministrationRoleArn;
        private final java.lang.String localDeploymentExecutionRoleName;
        private final java.lang.String typeVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localDeploymentAdministrationRoleArn = software.amazon.jsii.Kernel.get(this, "localDeploymentAdministrationRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localDeploymentExecutionRoleName = software.amazon.jsii.Kernel.get(this, "localDeploymentExecutionRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.typeVersion = software.amazon.jsii.Kernel.get(this, "typeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.parameters = java.util.Objects.requireNonNull(builder.parameters, "parameters is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.localDeploymentAdministrationRoleArn = builder.localDeploymentAdministrationRoleArn;
            this.localDeploymentExecutionRoleName = builder.localDeploymentExecutionRoleName;
            this.typeVersion = builder.typeVersion;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getLocalDeploymentAdministrationRoleArn() {
            return this.localDeploymentAdministrationRoleArn;
        }

        @Override
        public final java.lang.String getLocalDeploymentExecutionRoleName() {
            return this.localDeploymentExecutionRoleName;
        }

        @Override
        public final java.lang.String getTypeVersion() {
            return this.typeVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("parameters", om.valueToTree(this.getParameters()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getLocalDeploymentAdministrationRoleArn() != null) {
                data.set("localDeploymentAdministrationRoleArn", om.valueToTree(this.getLocalDeploymentAdministrationRoleArn()));
            }
            if (this.getLocalDeploymentExecutionRoleName() != null) {
                data.set("localDeploymentExecutionRoleName", om.valueToTree(this.getLocalDeploymentExecutionRoleName()));
            }
            if (this.getTypeVersion() != null) {
                data.set("typeVersion", om.valueToTree(this.getTypeVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmquicksetupConfigurationManager.SsmquicksetupConfigurationManagerConfigurationDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmquicksetupConfigurationManagerConfigurationDefinition.Jsii$Proxy that = (SsmquicksetupConfigurationManagerConfigurationDefinition.Jsii$Proxy) o;

            if (!parameters.equals(that.parameters)) return false;
            if (!type.equals(that.type)) return false;
            if (this.localDeploymentAdministrationRoleArn != null ? !this.localDeploymentAdministrationRoleArn.equals(that.localDeploymentAdministrationRoleArn) : that.localDeploymentAdministrationRoleArn != null) return false;
            if (this.localDeploymentExecutionRoleName != null ? !this.localDeploymentExecutionRoleName.equals(that.localDeploymentExecutionRoleName) : that.localDeploymentExecutionRoleName != null) return false;
            return this.typeVersion != null ? this.typeVersion.equals(that.typeVersion) : that.typeVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.parameters.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.localDeploymentAdministrationRoleArn != null ? this.localDeploymentAdministrationRoleArn.hashCode() : 0);
            result = 31 * result + (this.localDeploymentExecutionRoleName != null ? this.localDeploymentExecutionRoleName.hashCode() : 0);
            result = 31 * result + (this.typeVersion != null ? this.typeVersion.hashCode() : 0);
            return result;
        }
    }
}
