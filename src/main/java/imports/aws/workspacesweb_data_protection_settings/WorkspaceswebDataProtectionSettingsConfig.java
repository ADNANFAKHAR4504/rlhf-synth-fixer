package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.689Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsConfig")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebDataProtectionSettingsConfig.Jsii$Proxy.class)
public interface WorkspaceswebDataProtectionSettingsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#display_name WorkspaceswebDataProtectionSettings#display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#additional_encryption_context WorkspaceswebDataProtectionSettings#additional_encryption_context}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#customer_managed_key WorkspaceswebDataProtectionSettings#customer_managed_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerManagedKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#description WorkspaceswebDataProtectionSettings#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * inline_redaction_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_configuration WorkspaceswebDataProtectionSettings#inline_redaction_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInlineRedactionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#tags WorkspaceswebDataProtectionSettings#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebDataProtectionSettingsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebDataProtectionSettingsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebDataProtectionSettingsConfig> {
        java.lang.String displayName;
        java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext;
        java.lang.String customerManagedKey;
        java.lang.String description;
        java.lang.Object inlineRedactionConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#display_name WorkspaceswebDataProtectionSettings#display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getAdditionalEncryptionContext}
         * @param additionalEncryptionContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#additional_encryption_context WorkspaceswebDataProtectionSettings#additional_encryption_context}.
         * @return {@code this}
         */
        public Builder additionalEncryptionContext(java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext) {
            this.additionalEncryptionContext = additionalEncryptionContext;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getCustomerManagedKey}
         * @param customerManagedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#customer_managed_key WorkspaceswebDataProtectionSettings#customer_managed_key}.
         * @return {@code this}
         */
        public Builder customerManagedKey(java.lang.String customerManagedKey) {
            this.customerManagedKey = customerManagedKey;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#description WorkspaceswebDataProtectionSettings#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getInlineRedactionConfiguration}
         * @param inlineRedactionConfiguration inline_redaction_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_configuration WorkspaceswebDataProtectionSettings#inline_redaction_configuration}
         * @return {@code this}
         */
        public Builder inlineRedactionConfiguration(com.hashicorp.cdktf.IResolvable inlineRedactionConfiguration) {
            this.inlineRedactionConfiguration = inlineRedactionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getInlineRedactionConfiguration}
         * @param inlineRedactionConfiguration inline_redaction_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_configuration WorkspaceswebDataProtectionSettings#inline_redaction_configuration}
         * @return {@code this}
         */
        public Builder inlineRedactionConfiguration(java.util.List<? extends imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration> inlineRedactionConfiguration) {
            this.inlineRedactionConfiguration = inlineRedactionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#tags WorkspaceswebDataProtectionSettings#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getDependsOn}
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
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsConfig#getProvisioners}
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
         * @return a new instance of {@link WorkspaceswebDataProtectionSettingsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebDataProtectionSettingsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebDataProtectionSettingsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebDataProtectionSettingsConfig {
        private final java.lang.String displayName;
        private final java.util.Map<java.lang.String, java.lang.String> additionalEncryptionContext;
        private final java.lang.String customerManagedKey;
        private final java.lang.String description;
        private final java.lang.Object inlineRedactionConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalEncryptionContext = software.amazon.jsii.Kernel.get(this, "additionalEncryptionContext", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.customerManagedKey = software.amazon.jsii.Kernel.get(this, "customerManagedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inlineRedactionConfiguration = software.amazon.jsii.Kernel.get(this, "inlineRedactionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.displayName = java.util.Objects.requireNonNull(builder.displayName, "displayName is required");
            this.additionalEncryptionContext = builder.additionalEncryptionContext;
            this.customerManagedKey = builder.customerManagedKey;
            this.description = builder.description;
            this.inlineRedactionConfiguration = builder.inlineRedactionConfiguration;
            this.tags = builder.tags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAdditionalEncryptionContext() {
            return this.additionalEncryptionContext;
        }

        @Override
        public final java.lang.String getCustomerManagedKey() {
            return this.customerManagedKey;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getInlineRedactionConfiguration() {
            return this.inlineRedactionConfiguration;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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

            data.set("displayName", om.valueToTree(this.getDisplayName()));
            if (this.getAdditionalEncryptionContext() != null) {
                data.set("additionalEncryptionContext", om.valueToTree(this.getAdditionalEncryptionContext()));
            }
            if (this.getCustomerManagedKey() != null) {
                data.set("customerManagedKey", om.valueToTree(this.getCustomerManagedKey()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getInlineRedactionConfiguration() != null) {
                data.set("inlineRedactionConfiguration", om.valueToTree(this.getInlineRedactionConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebDataProtectionSettingsConfig.Jsii$Proxy that = (WorkspaceswebDataProtectionSettingsConfig.Jsii$Proxy) o;

            if (!displayName.equals(that.displayName)) return false;
            if (this.additionalEncryptionContext != null ? !this.additionalEncryptionContext.equals(that.additionalEncryptionContext) : that.additionalEncryptionContext != null) return false;
            if (this.customerManagedKey != null ? !this.customerManagedKey.equals(that.customerManagedKey) : that.customerManagedKey != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.inlineRedactionConfiguration != null ? !this.inlineRedactionConfiguration.equals(that.inlineRedactionConfiguration) : that.inlineRedactionConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.displayName.hashCode();
            result = 31 * result + (this.additionalEncryptionContext != null ? this.additionalEncryptionContext.hashCode() : 0);
            result = 31 * result + (this.customerManagedKey != null ? this.customerManagedKey.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.inlineRedactionConfiguration != null ? this.inlineRedactionConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
