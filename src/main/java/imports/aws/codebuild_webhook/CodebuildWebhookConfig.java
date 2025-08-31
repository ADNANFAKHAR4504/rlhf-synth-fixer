package imports.aws.codebuild_webhook;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.307Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildWebhook.CodebuildWebhookConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildWebhookConfig.Jsii$Proxy.class)
public interface CodebuildWebhookConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#project_name CodebuildWebhook#project_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProjectName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#branch_filter CodebuildWebhook#branch_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBranchFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#build_type CodebuildWebhook#build_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBuildType() {
        return null;
    }

    /**
     * filter_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#filter_group CodebuildWebhook#filter_group}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilterGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#id CodebuildWebhook#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManualCreation() {
        return null;
    }

    /**
     * scope_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#scope_configuration CodebuildWebhook#scope_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration getScopeConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildWebhookConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildWebhookConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildWebhookConfig> {
        java.lang.String projectName;
        java.lang.String branchFilter;
        java.lang.String buildType;
        java.lang.Object filterGroup;
        java.lang.String id;
        java.lang.Object manualCreation;
        imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration scopeConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getProjectName}
         * @param projectName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#project_name CodebuildWebhook#project_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectName(java.lang.String projectName) {
            this.projectName = projectName;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getBranchFilter}
         * @param branchFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#branch_filter CodebuildWebhook#branch_filter}.
         * @return {@code this}
         */
        public Builder branchFilter(java.lang.String branchFilter) {
            this.branchFilter = branchFilter;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getBuildType}
         * @param buildType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#build_type CodebuildWebhook#build_type}.
         * @return {@code this}
         */
        public Builder buildType(java.lang.String buildType) {
            this.buildType = buildType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getFilterGroup}
         * @param filterGroup filter_group block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#filter_group CodebuildWebhook#filter_group}
         * @return {@code this}
         */
        public Builder filterGroup(com.hashicorp.cdktf.IResolvable filterGroup) {
            this.filterGroup = filterGroup;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getFilterGroup}
         * @param filterGroup filter_group block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#filter_group CodebuildWebhook#filter_group}
         * @return {@code this}
         */
        public Builder filterGroup(java.util.List<? extends imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup> filterGroup) {
            this.filterGroup = filterGroup;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#id CodebuildWebhook#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getManualCreation}
         * @param manualCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}.
         * @return {@code this}
         */
        public Builder manualCreation(java.lang.Boolean manualCreation) {
            this.manualCreation = manualCreation;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getManualCreation}
         * @param manualCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}.
         * @return {@code this}
         */
        public Builder manualCreation(com.hashicorp.cdktf.IResolvable manualCreation) {
            this.manualCreation = manualCreation;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getScopeConfiguration}
         * @param scopeConfiguration scope_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#scope_configuration CodebuildWebhook#scope_configuration}
         * @return {@code this}
         */
        public Builder scopeConfiguration(imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration scopeConfiguration) {
            this.scopeConfiguration = scopeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getDependsOn}
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
         * Sets the value of {@link CodebuildWebhookConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildWebhookConfig#getProvisioners}
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
         * @return a new instance of {@link CodebuildWebhookConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildWebhookConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildWebhookConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildWebhookConfig {
        private final java.lang.String projectName;
        private final java.lang.String branchFilter;
        private final java.lang.String buildType;
        private final java.lang.Object filterGroup;
        private final java.lang.String id;
        private final java.lang.Object manualCreation;
        private final imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration scopeConfiguration;
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
            this.projectName = software.amazon.jsii.Kernel.get(this, "projectName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.branchFilter = software.amazon.jsii.Kernel.get(this, "branchFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.buildType = software.amazon.jsii.Kernel.get(this, "buildType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filterGroup = software.amazon.jsii.Kernel.get(this, "filterGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manualCreation = software.amazon.jsii.Kernel.get(this, "manualCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scopeConfiguration = software.amazon.jsii.Kernel.get(this, "scopeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration.class));
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
            this.projectName = java.util.Objects.requireNonNull(builder.projectName, "projectName is required");
            this.branchFilter = builder.branchFilter;
            this.buildType = builder.buildType;
            this.filterGroup = builder.filterGroup;
            this.id = builder.id;
            this.manualCreation = builder.manualCreation;
            this.scopeConfiguration = builder.scopeConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getProjectName() {
            return this.projectName;
        }

        @Override
        public final java.lang.String getBranchFilter() {
            return this.branchFilter;
        }

        @Override
        public final java.lang.String getBuildType() {
            return this.buildType;
        }

        @Override
        public final java.lang.Object getFilterGroup() {
            return this.filterGroup;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getManualCreation() {
            return this.manualCreation;
        }

        @Override
        public final imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration getScopeConfiguration() {
            return this.scopeConfiguration;
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

            data.set("projectName", om.valueToTree(this.getProjectName()));
            if (this.getBranchFilter() != null) {
                data.set("branchFilter", om.valueToTree(this.getBranchFilter()));
            }
            if (this.getBuildType() != null) {
                data.set("buildType", om.valueToTree(this.getBuildType()));
            }
            if (this.getFilterGroup() != null) {
                data.set("filterGroup", om.valueToTree(this.getFilterGroup()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getManualCreation() != null) {
                data.set("manualCreation", om.valueToTree(this.getManualCreation()));
            }
            if (this.getScopeConfiguration() != null) {
                data.set("scopeConfiguration", om.valueToTree(this.getScopeConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.codebuildWebhook.CodebuildWebhookConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildWebhookConfig.Jsii$Proxy that = (CodebuildWebhookConfig.Jsii$Proxy) o;

            if (!projectName.equals(that.projectName)) return false;
            if (this.branchFilter != null ? !this.branchFilter.equals(that.branchFilter) : that.branchFilter != null) return false;
            if (this.buildType != null ? !this.buildType.equals(that.buildType) : that.buildType != null) return false;
            if (this.filterGroup != null ? !this.filterGroup.equals(that.filterGroup) : that.filterGroup != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.manualCreation != null ? !this.manualCreation.equals(that.manualCreation) : that.manualCreation != null) return false;
            if (this.scopeConfiguration != null ? !this.scopeConfiguration.equals(that.scopeConfiguration) : that.scopeConfiguration != null) return false;
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
            int result = this.projectName.hashCode();
            result = 31 * result + (this.branchFilter != null ? this.branchFilter.hashCode() : 0);
            result = 31 * result + (this.buildType != null ? this.buildType.hashCode() : 0);
            result = 31 * result + (this.filterGroup != null ? this.filterGroup.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.manualCreation != null ? this.manualCreation.hashCode() : 0);
            result = 31 * result + (this.scopeConfiguration != null ? this.scopeConfiguration.hashCode() : 0);
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
