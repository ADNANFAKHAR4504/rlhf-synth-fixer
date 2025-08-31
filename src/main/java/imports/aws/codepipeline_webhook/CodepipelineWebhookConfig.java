package imports.aws.codepipeline_webhook;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.337Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineWebhook.CodepipelineWebhookConfig")
@software.amazon.jsii.Jsii.Proxy(CodepipelineWebhookConfig.Jsii$Proxy.class)
public interface CodepipelineWebhookConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#authentication CodepipelineWebhook#authentication}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthentication();

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#filter CodepipelineWebhook#filter}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getFilter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#name CodepipelineWebhook#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#target_action CodepipelineWebhook#target_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#target_pipeline CodepipelineWebhook#target_pipeline}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetPipeline();

    /**
     * authentication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#authentication_configuration CodepipelineWebhook#authentication_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration getAuthenticationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#id CodepipelineWebhook#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#tags CodepipelineWebhook#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#tags_all CodepipelineWebhook#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineWebhookConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineWebhookConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineWebhookConfig> {
        java.lang.String authentication;
        java.lang.Object filter;
        java.lang.String name;
        java.lang.String targetAction;
        java.lang.String targetPipeline;
        imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration authenticationConfiguration;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getAuthentication}
         * @param authentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#authentication CodepipelineWebhook#authentication}. This parameter is required.
         * @return {@code this}
         */
        public Builder authentication(java.lang.String authentication) {
            this.authentication = authentication;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getFilter}
         * @param filter filter block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#filter CodepipelineWebhook#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getFilter}
         * @param filter filter block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#filter CodepipelineWebhook#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.codepipeline_webhook.CodepipelineWebhookFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#name CodepipelineWebhook#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getTargetAction}
         * @param targetAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#target_action CodepipelineWebhook#target_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetAction(java.lang.String targetAction) {
            this.targetAction = targetAction;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getTargetPipeline}
         * @param targetPipeline Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#target_pipeline CodepipelineWebhook#target_pipeline}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetPipeline(java.lang.String targetPipeline) {
            this.targetPipeline = targetPipeline;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getAuthenticationConfiguration}
         * @param authenticationConfiguration authentication_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#authentication_configuration CodepipelineWebhook#authentication_configuration}
         * @return {@code this}
         */
        public Builder authenticationConfiguration(imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration authenticationConfiguration) {
            this.authenticationConfiguration = authenticationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#id CodepipelineWebhook#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#tags CodepipelineWebhook#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#tags_all CodepipelineWebhook#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getDependsOn}
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
         * Sets the value of {@link CodepipelineWebhookConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookConfig#getProvisioners}
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
         * @return a new instance of {@link CodepipelineWebhookConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineWebhookConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineWebhookConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineWebhookConfig {
        private final java.lang.String authentication;
        private final java.lang.Object filter;
        private final java.lang.String name;
        private final java.lang.String targetAction;
        private final java.lang.String targetPipeline;
        private final imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration authenticationConfiguration;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.authentication = software.amazon.jsii.Kernel.get(this, "authentication", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetAction = software.amazon.jsii.Kernel.get(this, "targetAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetPipeline = software.amazon.jsii.Kernel.get(this, "targetPipeline", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationConfiguration = software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.authentication = java.util.Objects.requireNonNull(builder.authentication, "authentication is required");
            this.filter = java.util.Objects.requireNonNull(builder.filter, "filter is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.targetAction = java.util.Objects.requireNonNull(builder.targetAction, "targetAction is required");
            this.targetPipeline = java.util.Objects.requireNonNull(builder.targetPipeline, "targetPipeline is required");
            this.authenticationConfiguration = builder.authenticationConfiguration;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAuthentication() {
            return this.authentication;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTargetAction() {
            return this.targetAction;
        }

        @Override
        public final java.lang.String getTargetPipeline() {
            return this.targetPipeline;
        }

        @Override
        public final imports.aws.codepipeline_webhook.CodepipelineWebhookAuthenticationConfiguration getAuthenticationConfiguration() {
            return this.authenticationConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("authentication", om.valueToTree(this.getAuthentication()));
            data.set("filter", om.valueToTree(this.getFilter()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("targetAction", om.valueToTree(this.getTargetAction()));
            data.set("targetPipeline", om.valueToTree(this.getTargetPipeline()));
            if (this.getAuthenticationConfiguration() != null) {
                data.set("authenticationConfiguration", om.valueToTree(this.getAuthenticationConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.codepipelineWebhook.CodepipelineWebhookConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineWebhookConfig.Jsii$Proxy that = (CodepipelineWebhookConfig.Jsii$Proxy) o;

            if (!authentication.equals(that.authentication)) return false;
            if (!filter.equals(that.filter)) return false;
            if (!name.equals(that.name)) return false;
            if (!targetAction.equals(that.targetAction)) return false;
            if (!targetPipeline.equals(that.targetPipeline)) return false;
            if (this.authenticationConfiguration != null ? !this.authenticationConfiguration.equals(that.authenticationConfiguration) : that.authenticationConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.authentication.hashCode();
            result = 31 * result + (this.filter.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.targetAction.hashCode());
            result = 31 * result + (this.targetPipeline.hashCode());
            result = 31 * result + (this.authenticationConfiguration != null ? this.authenticationConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
