package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.516Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanConfig")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanConfig.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * incident_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_template SsmincidentsResponsePlan#incident_template}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate getIncidentTemplate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#action SsmincidentsResponsePlan#action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction getAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#chat_channel SsmincidentsResponsePlan#chat_channel}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getChatChannel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#display_name SsmincidentsResponsePlan#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#engagements SsmincidentsResponsePlan#engagements}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEngagements() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#id SsmincidentsResponsePlan#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * integration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#integration SsmincidentsResponsePlan#integration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration getIntegration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags SsmincidentsResponsePlan#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags_all SsmincidentsResponsePlan#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanConfig> {
        imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate incidentTemplate;
        java.lang.String name;
        imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction action;
        java.util.List<java.lang.String> chatChannel;
        java.lang.String displayName;
        java.util.List<java.lang.String> engagements;
        java.lang.String id;
        imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration integration;
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
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getIncidentTemplate}
         * @param incidentTemplate incident_template block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_template SsmincidentsResponsePlan#incident_template}
         * @return {@code this}
         */
        public Builder incidentTemplate(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate incidentTemplate) {
            this.incidentTemplate = incidentTemplate;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#action SsmincidentsResponsePlan#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getChatChannel}
         * @param chatChannel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#chat_channel SsmincidentsResponsePlan#chat_channel}.
         * @return {@code this}
         */
        public Builder chatChannel(java.util.List<java.lang.String> chatChannel) {
            this.chatChannel = chatChannel;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#display_name SsmincidentsResponsePlan#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getEngagements}
         * @param engagements Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#engagements SsmincidentsResponsePlan#engagements}.
         * @return {@code this}
         */
        public Builder engagements(java.util.List<java.lang.String> engagements) {
            this.engagements = engagements;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#id SsmincidentsResponsePlan#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getIntegration}
         * @param integration integration block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#integration SsmincidentsResponsePlan#integration}
         * @return {@code this}
         */
        public Builder integration(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration integration) {
            this.integration = integration;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags SsmincidentsResponsePlan#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags_all SsmincidentsResponsePlan#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getDependsOn}
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
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanConfig#getProvisioners}
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
         * @return a new instance of {@link SsmincidentsResponsePlanConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanConfig {
        private final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate incidentTemplate;
        private final java.lang.String name;
        private final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction action;
        private final java.util.List<java.lang.String> chatChannel;
        private final java.lang.String displayName;
        private final java.util.List<java.lang.String> engagements;
        private final java.lang.String id;
        private final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration integration;
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
            this.incidentTemplate = software.amazon.jsii.Kernel.get(this, "incidentTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction.class));
            this.chatChannel = software.amazon.jsii.Kernel.get(this, "chatChannel", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engagements = software.amazon.jsii.Kernel.get(this, "engagements", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integration = software.amazon.jsii.Kernel.get(this, "integration", software.amazon.jsii.NativeType.forClass(imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration.class));
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
            this.incidentTemplate = java.util.Objects.requireNonNull(builder.incidentTemplate, "incidentTemplate is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.action = builder.action;
            this.chatChannel = builder.chatChannel;
            this.displayName = builder.displayName;
            this.engagements = builder.engagements;
            this.id = builder.id;
            this.integration = builder.integration;
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
        public final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplate getIncidentTemplate() {
            return this.incidentTemplate;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanAction getAction() {
            return this.action;
        }

        @Override
        public final java.util.List<java.lang.String> getChatChannel() {
            return this.chatChannel;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.util.List<java.lang.String> getEngagements() {
            return this.engagements;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegration getIntegration() {
            return this.integration;
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

            data.set("incidentTemplate", om.valueToTree(this.getIncidentTemplate()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getChatChannel() != null) {
                data.set("chatChannel", om.valueToTree(this.getChatChannel()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getEngagements() != null) {
                data.set("engagements", om.valueToTree(this.getEngagements()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIntegration() != null) {
                data.set("integration", om.valueToTree(this.getIntegration()));
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
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanConfig.Jsii$Proxy that = (SsmincidentsResponsePlanConfig.Jsii$Proxy) o;

            if (!incidentTemplate.equals(that.incidentTemplate)) return false;
            if (!name.equals(that.name)) return false;
            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.chatChannel != null ? !this.chatChannel.equals(that.chatChannel) : that.chatChannel != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.engagements != null ? !this.engagements.equals(that.engagements) : that.engagements != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.integration != null ? !this.integration.equals(that.integration) : that.integration != null) return false;
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
            int result = this.incidentTemplate.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.action != null ? this.action.hashCode() : 0);
            result = 31 * result + (this.chatChannel != null ? this.chatChannel.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.engagements != null ? this.engagements.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.integration != null ? this.integration.hashCode() : 0);
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
