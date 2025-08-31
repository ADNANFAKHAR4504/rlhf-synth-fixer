package imports.aws.guardduty_organization_configuration_feature;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.326Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyOrganizationConfigurationFeature.GuarddutyOrganizationConfigurationFeatureConfig")
@software.amazon.jsii.Jsii.Proxy(GuarddutyOrganizationConfigurationFeatureConfig.Jsii$Proxy.class)
public interface GuarddutyOrganizationConfigurationFeatureConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#auto_enable GuarddutyOrganizationConfigurationFeature#auto_enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAutoEnable();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#detector_id GuarddutyOrganizationConfigurationFeature#detector_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDetectorId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#name GuarddutyOrganizationConfigurationFeature#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * additional_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#additional_configuration GuarddutyOrganizationConfigurationFeature#additional_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdditionalConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#id GuarddutyOrganizationConfigurationFeature#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GuarddutyOrganizationConfigurationFeatureConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyOrganizationConfigurationFeatureConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyOrganizationConfigurationFeatureConfig> {
        java.lang.String autoEnable;
        java.lang.String detectorId;
        java.lang.String name;
        java.lang.Object additionalConfiguration;
        java.lang.String id;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getAutoEnable}
         * @param autoEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#auto_enable GuarddutyOrganizationConfigurationFeature#auto_enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoEnable(java.lang.String autoEnable) {
            this.autoEnable = autoEnable;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getDetectorId}
         * @param detectorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#detector_id GuarddutyOrganizationConfigurationFeature#detector_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder detectorId(java.lang.String detectorId) {
            this.detectorId = detectorId;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#name GuarddutyOrganizationConfigurationFeature#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getAdditionalConfiguration}
         * @param additionalConfiguration additional_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#additional_configuration GuarddutyOrganizationConfigurationFeature#additional_configuration}
         * @return {@code this}
         */
        public Builder additionalConfiguration(com.hashicorp.cdktf.IResolvable additionalConfiguration) {
            this.additionalConfiguration = additionalConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getAdditionalConfiguration}
         * @param additionalConfiguration additional_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#additional_configuration GuarddutyOrganizationConfigurationFeature#additional_configuration}
         * @return {@code this}
         */
        public Builder additionalConfiguration(java.util.List<? extends imports.aws.guardduty_organization_configuration_feature.GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration> additionalConfiguration) {
            this.additionalConfiguration = additionalConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#id GuarddutyOrganizationConfigurationFeature#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getDependsOn}
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
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureConfig#getProvisioners}
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
         * @return a new instance of {@link GuarddutyOrganizationConfigurationFeatureConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyOrganizationConfigurationFeatureConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyOrganizationConfigurationFeatureConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyOrganizationConfigurationFeatureConfig {
        private final java.lang.String autoEnable;
        private final java.lang.String detectorId;
        private final java.lang.String name;
        private final java.lang.Object additionalConfiguration;
        private final java.lang.String id;
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
            this.autoEnable = software.amazon.jsii.Kernel.get(this, "autoEnable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.detectorId = software.amazon.jsii.Kernel.get(this, "detectorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalConfiguration = software.amazon.jsii.Kernel.get(this, "additionalConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.autoEnable = java.util.Objects.requireNonNull(builder.autoEnable, "autoEnable is required");
            this.detectorId = java.util.Objects.requireNonNull(builder.detectorId, "detectorId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.additionalConfiguration = builder.additionalConfiguration;
            this.id = builder.id;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAutoEnable() {
            return this.autoEnable;
        }

        @Override
        public final java.lang.String getDetectorId() {
            return this.detectorId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getAdditionalConfiguration() {
            return this.additionalConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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

            data.set("autoEnable", om.valueToTree(this.getAutoEnable()));
            data.set("detectorId", om.valueToTree(this.getDetectorId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAdditionalConfiguration() != null) {
                data.set("additionalConfiguration", om.valueToTree(this.getAdditionalConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.guarddutyOrganizationConfigurationFeature.GuarddutyOrganizationConfigurationFeatureConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyOrganizationConfigurationFeatureConfig.Jsii$Proxy that = (GuarddutyOrganizationConfigurationFeatureConfig.Jsii$Proxy) o;

            if (!autoEnable.equals(that.autoEnable)) return false;
            if (!detectorId.equals(that.detectorId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.additionalConfiguration != null ? !this.additionalConfiguration.equals(that.additionalConfiguration) : that.additionalConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.autoEnable.hashCode();
            result = 31 * result + (this.detectorId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.additionalConfiguration != null ? this.additionalConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
