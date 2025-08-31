package imports.aws.datazone_environment_blueprint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.957Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneEnvironmentBlueprintConfiguration.DatazoneEnvironmentBlueprintConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(DatazoneEnvironmentBlueprintConfigurationConfig.Jsii$Proxy.class)
public interface DatazoneEnvironmentBlueprintConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#domain_id DatazoneEnvironmentBlueprintConfiguration#domain_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#enabled_regions DatazoneEnvironmentBlueprintConfiguration#enabled_regions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEnabledRegions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#environment_blueprint_id DatazoneEnvironmentBlueprintConfiguration#environment_blueprint_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentBlueprintId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#manage_access_role_arn DatazoneEnvironmentBlueprintConfiguration#manage_access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getManageAccessRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#provisioning_role_arn DatazoneEnvironmentBlueprintConfiguration#provisioning_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvisioningRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegionalParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneEnvironmentBlueprintConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneEnvironmentBlueprintConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneEnvironmentBlueprintConfigurationConfig> {
        java.lang.String domainId;
        java.util.List<java.lang.String> enabledRegions;
        java.lang.String environmentBlueprintId;
        java.lang.String manageAccessRoleArn;
        java.lang.String provisioningRoleArn;
        java.lang.Object regionalParameters;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getDomainId}
         * @param domainId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#domain_id DatazoneEnvironmentBlueprintConfiguration#domain_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainId(java.lang.String domainId) {
            this.domainId = domainId;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getEnabledRegions}
         * @param enabledRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#enabled_regions DatazoneEnvironmentBlueprintConfiguration#enabled_regions}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabledRegions(java.util.List<java.lang.String> enabledRegions) {
            this.enabledRegions = enabledRegions;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getEnvironmentBlueprintId}
         * @param environmentBlueprintId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#environment_blueprint_id DatazoneEnvironmentBlueprintConfiguration#environment_blueprint_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder environmentBlueprintId(java.lang.String environmentBlueprintId) {
            this.environmentBlueprintId = environmentBlueprintId;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getManageAccessRoleArn}
         * @param manageAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#manage_access_role_arn DatazoneEnvironmentBlueprintConfiguration#manage_access_role_arn}.
         * @return {@code this}
         */
        public Builder manageAccessRoleArn(java.lang.String manageAccessRoleArn) {
            this.manageAccessRoleArn = manageAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getProvisioningRoleArn}
         * @param provisioningRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#provisioning_role_arn DatazoneEnvironmentBlueprintConfiguration#provisioning_role_arn}.
         * @return {@code this}
         */
        public Builder provisioningRoleArn(java.lang.String provisioningRoleArn) {
            this.provisioningRoleArn = provisioningRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getRegionalParameters}
         * @param regionalParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}.
         * @return {@code this}
         */
        public Builder regionalParameters(com.hashicorp.cdktf.IResolvable regionalParameters) {
            this.regionalParameters = regionalParameters;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getRegionalParameters}
         * @param regionalParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_environment_blueprint_configuration#regional_parameters DatazoneEnvironmentBlueprintConfiguration#regional_parameters}.
         * @return {@code this}
         */
        public Builder regionalParameters(java.util.Map<java.lang.String, ? extends java.util.Map<java.lang.String, java.lang.String>> regionalParameters) {
            this.regionalParameters = regionalParameters;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneEnvironmentBlueprintConfigurationConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneEnvironmentBlueprintConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneEnvironmentBlueprintConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneEnvironmentBlueprintConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneEnvironmentBlueprintConfigurationConfig {
        private final java.lang.String domainId;
        private final java.util.List<java.lang.String> enabledRegions;
        private final java.lang.String environmentBlueprintId;
        private final java.lang.String manageAccessRoleArn;
        private final java.lang.String provisioningRoleArn;
        private final java.lang.Object regionalParameters;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainId = software.amazon.jsii.Kernel.get(this, "domainId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabledRegions = software.amazon.jsii.Kernel.get(this, "enabledRegions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.environmentBlueprintId = software.amazon.jsii.Kernel.get(this, "environmentBlueprintId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manageAccessRoleArn = software.amazon.jsii.Kernel.get(this, "manageAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningRoleArn = software.amazon.jsii.Kernel.get(this, "provisioningRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regionalParameters = software.amazon.jsii.Kernel.get(this, "regionalParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainId = java.util.Objects.requireNonNull(builder.domainId, "domainId is required");
            this.enabledRegions = java.util.Objects.requireNonNull(builder.enabledRegions, "enabledRegions is required");
            this.environmentBlueprintId = java.util.Objects.requireNonNull(builder.environmentBlueprintId, "environmentBlueprintId is required");
            this.manageAccessRoleArn = builder.manageAccessRoleArn;
            this.provisioningRoleArn = builder.provisioningRoleArn;
            this.regionalParameters = builder.regionalParameters;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainId() {
            return this.domainId;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledRegions() {
            return this.enabledRegions;
        }

        @Override
        public final java.lang.String getEnvironmentBlueprintId() {
            return this.environmentBlueprintId;
        }

        @Override
        public final java.lang.String getManageAccessRoleArn() {
            return this.manageAccessRoleArn;
        }

        @Override
        public final java.lang.String getProvisioningRoleArn() {
            return this.provisioningRoleArn;
        }

        @Override
        public final java.lang.Object getRegionalParameters() {
            return this.regionalParameters;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainId", om.valueToTree(this.getDomainId()));
            data.set("enabledRegions", om.valueToTree(this.getEnabledRegions()));
            data.set("environmentBlueprintId", om.valueToTree(this.getEnvironmentBlueprintId()));
            if (this.getManageAccessRoleArn() != null) {
                data.set("manageAccessRoleArn", om.valueToTree(this.getManageAccessRoleArn()));
            }
            if (this.getProvisioningRoleArn() != null) {
                data.set("provisioningRoleArn", om.valueToTree(this.getProvisioningRoleArn()));
            }
            if (this.getRegionalParameters() != null) {
                data.set("regionalParameters", om.valueToTree(this.getRegionalParameters()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneEnvironmentBlueprintConfiguration.DatazoneEnvironmentBlueprintConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneEnvironmentBlueprintConfigurationConfig.Jsii$Proxy that = (DatazoneEnvironmentBlueprintConfigurationConfig.Jsii$Proxy) o;

            if (!domainId.equals(that.domainId)) return false;
            if (!enabledRegions.equals(that.enabledRegions)) return false;
            if (!environmentBlueprintId.equals(that.environmentBlueprintId)) return false;
            if (this.manageAccessRoleArn != null ? !this.manageAccessRoleArn.equals(that.manageAccessRoleArn) : that.manageAccessRoleArn != null) return false;
            if (this.provisioningRoleArn != null ? !this.provisioningRoleArn.equals(that.provisioningRoleArn) : that.provisioningRoleArn != null) return false;
            if (this.regionalParameters != null ? !this.regionalParameters.equals(that.regionalParameters) : that.regionalParameters != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainId.hashCode();
            result = 31 * result + (this.enabledRegions.hashCode());
            result = 31 * result + (this.environmentBlueprintId.hashCode());
            result = 31 * result + (this.manageAccessRoleArn != null ? this.manageAccessRoleArn.hashCode() : 0);
            result = 31 * result + (this.provisioningRoleArn != null ? this.provisioningRoleArn.hashCode() : 0);
            result = 31 * result + (this.regionalParameters != null ? this.regionalParameters.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
