package imports.aws.connect_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.384Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstance.ConnectInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectInstanceConfig.Jsii$Proxy.class)
public interface ConnectInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#identity_management_type ConnectInstance#identity_management_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityManagementType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInboundCallsEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOutboundCallsEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoResolveBestVoicesEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContactFlowLogsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContactLensEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#directory_id ConnectInstance#directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEarlyMediaEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#id ConnectInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#instance_alias ConnectInstance#instance_alias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceAlias() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiPartyConferenceEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags ConnectInstance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags_all ConnectInstance#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#timeouts ConnectInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance.ConnectInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectInstanceConfig> {
        java.lang.String identityManagementType;
        java.lang.Object inboundCallsEnabled;
        java.lang.Object outboundCallsEnabled;
        java.lang.Object autoResolveBestVoicesEnabled;
        java.lang.Object contactFlowLogsEnabled;
        java.lang.Object contactLensEnabled;
        java.lang.String directoryId;
        java.lang.Object earlyMediaEnabled;
        java.lang.String id;
        java.lang.String instanceAlias;
        java.lang.Object multiPartyConferenceEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.connect_instance.ConnectInstanceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ConnectInstanceConfig#getIdentityManagementType}
         * @param identityManagementType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#identity_management_type ConnectInstance#identity_management_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityManagementType(java.lang.String identityManagementType) {
            this.identityManagementType = identityManagementType;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getInboundCallsEnabled}
         * @param inboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder inboundCallsEnabled(java.lang.Boolean inboundCallsEnabled) {
            this.inboundCallsEnabled = inboundCallsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getInboundCallsEnabled}
         * @param inboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#inbound_calls_enabled ConnectInstance#inbound_calls_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder inboundCallsEnabled(com.hashicorp.cdktf.IResolvable inboundCallsEnabled) {
            this.inboundCallsEnabled = inboundCallsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getOutboundCallsEnabled}
         * @param outboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder outboundCallsEnabled(java.lang.Boolean outboundCallsEnabled) {
            this.outboundCallsEnabled = outboundCallsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getOutboundCallsEnabled}
         * @param outboundCallsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#outbound_calls_enabled ConnectInstance#outbound_calls_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder outboundCallsEnabled(com.hashicorp.cdktf.IResolvable outboundCallsEnabled) {
            this.outboundCallsEnabled = outboundCallsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getAutoResolveBestVoicesEnabled}
         * @param autoResolveBestVoicesEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}.
         * @return {@code this}
         */
        public Builder autoResolveBestVoicesEnabled(java.lang.Boolean autoResolveBestVoicesEnabled) {
            this.autoResolveBestVoicesEnabled = autoResolveBestVoicesEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getAutoResolveBestVoicesEnabled}
         * @param autoResolveBestVoicesEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#auto_resolve_best_voices_enabled ConnectInstance#auto_resolve_best_voices_enabled}.
         * @return {@code this}
         */
        public Builder autoResolveBestVoicesEnabled(com.hashicorp.cdktf.IResolvable autoResolveBestVoicesEnabled) {
            this.autoResolveBestVoicesEnabled = autoResolveBestVoicesEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getContactFlowLogsEnabled}
         * @param contactFlowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}.
         * @return {@code this}
         */
        public Builder contactFlowLogsEnabled(java.lang.Boolean contactFlowLogsEnabled) {
            this.contactFlowLogsEnabled = contactFlowLogsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getContactFlowLogsEnabled}
         * @param contactFlowLogsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_flow_logs_enabled ConnectInstance#contact_flow_logs_enabled}.
         * @return {@code this}
         */
        public Builder contactFlowLogsEnabled(com.hashicorp.cdktf.IResolvable contactFlowLogsEnabled) {
            this.contactFlowLogsEnabled = contactFlowLogsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getContactLensEnabled}
         * @param contactLensEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}.
         * @return {@code this}
         */
        public Builder contactLensEnabled(java.lang.Boolean contactLensEnabled) {
            this.contactLensEnabled = contactLensEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getContactLensEnabled}
         * @param contactLensEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#contact_lens_enabled ConnectInstance#contact_lens_enabled}.
         * @return {@code this}
         */
        public Builder contactLensEnabled(com.hashicorp.cdktf.IResolvable contactLensEnabled) {
            this.contactLensEnabled = contactLensEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#directory_id ConnectInstance#directory_id}.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getEarlyMediaEnabled}
         * @param earlyMediaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}.
         * @return {@code this}
         */
        public Builder earlyMediaEnabled(java.lang.Boolean earlyMediaEnabled) {
            this.earlyMediaEnabled = earlyMediaEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getEarlyMediaEnabled}
         * @param earlyMediaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#early_media_enabled ConnectInstance#early_media_enabled}.
         * @return {@code this}
         */
        public Builder earlyMediaEnabled(com.hashicorp.cdktf.IResolvable earlyMediaEnabled) {
            this.earlyMediaEnabled = earlyMediaEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#id ConnectInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getInstanceAlias}
         * @param instanceAlias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#instance_alias ConnectInstance#instance_alias}.
         * @return {@code this}
         */
        public Builder instanceAlias(java.lang.String instanceAlias) {
            this.instanceAlias = instanceAlias;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getMultiPartyConferenceEnabled}
         * @param multiPartyConferenceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}.
         * @return {@code this}
         */
        public Builder multiPartyConferenceEnabled(java.lang.Boolean multiPartyConferenceEnabled) {
            this.multiPartyConferenceEnabled = multiPartyConferenceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getMultiPartyConferenceEnabled}
         * @param multiPartyConferenceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#multi_party_conference_enabled ConnectInstance#multi_party_conference_enabled}.
         * @return {@code this}
         */
        public Builder multiPartyConferenceEnabled(com.hashicorp.cdktf.IResolvable multiPartyConferenceEnabled) {
            this.multiPartyConferenceEnabled = multiPartyConferenceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags ConnectInstance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#tags_all ConnectInstance#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance#timeouts ConnectInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.connect_instance.ConnectInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getDependsOn}
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
         * Sets the value of {@link ConnectInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link ConnectInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectInstanceConfig {
        private final java.lang.String identityManagementType;
        private final java.lang.Object inboundCallsEnabled;
        private final java.lang.Object outboundCallsEnabled;
        private final java.lang.Object autoResolveBestVoicesEnabled;
        private final java.lang.Object contactFlowLogsEnabled;
        private final java.lang.Object contactLensEnabled;
        private final java.lang.String directoryId;
        private final java.lang.Object earlyMediaEnabled;
        private final java.lang.String id;
        private final java.lang.String instanceAlias;
        private final java.lang.Object multiPartyConferenceEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.connect_instance.ConnectInstanceTimeouts timeouts;
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
            this.identityManagementType = software.amazon.jsii.Kernel.get(this, "identityManagementType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inboundCallsEnabled = software.amazon.jsii.Kernel.get(this, "inboundCallsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.outboundCallsEnabled = software.amazon.jsii.Kernel.get(this, "outboundCallsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoResolveBestVoicesEnabled = software.amazon.jsii.Kernel.get(this, "autoResolveBestVoicesEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.contactFlowLogsEnabled = software.amazon.jsii.Kernel.get(this, "contactFlowLogsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.contactLensEnabled = software.amazon.jsii.Kernel.get(this, "contactLensEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.earlyMediaEnabled = software.amazon.jsii.Kernel.get(this, "earlyMediaEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceAlias = software.amazon.jsii.Kernel.get(this, "instanceAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiPartyConferenceEnabled = software.amazon.jsii.Kernel.get(this, "multiPartyConferenceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance.ConnectInstanceTimeouts.class));
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
            this.identityManagementType = java.util.Objects.requireNonNull(builder.identityManagementType, "identityManagementType is required");
            this.inboundCallsEnabled = java.util.Objects.requireNonNull(builder.inboundCallsEnabled, "inboundCallsEnabled is required");
            this.outboundCallsEnabled = java.util.Objects.requireNonNull(builder.outboundCallsEnabled, "outboundCallsEnabled is required");
            this.autoResolveBestVoicesEnabled = builder.autoResolveBestVoicesEnabled;
            this.contactFlowLogsEnabled = builder.contactFlowLogsEnabled;
            this.contactLensEnabled = builder.contactLensEnabled;
            this.directoryId = builder.directoryId;
            this.earlyMediaEnabled = builder.earlyMediaEnabled;
            this.id = builder.id;
            this.instanceAlias = builder.instanceAlias;
            this.multiPartyConferenceEnabled = builder.multiPartyConferenceEnabled;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIdentityManagementType() {
            return this.identityManagementType;
        }

        @Override
        public final java.lang.Object getInboundCallsEnabled() {
            return this.inboundCallsEnabled;
        }

        @Override
        public final java.lang.Object getOutboundCallsEnabled() {
            return this.outboundCallsEnabled;
        }

        @Override
        public final java.lang.Object getAutoResolveBestVoicesEnabled() {
            return this.autoResolveBestVoicesEnabled;
        }

        @Override
        public final java.lang.Object getContactFlowLogsEnabled() {
            return this.contactFlowLogsEnabled;
        }

        @Override
        public final java.lang.Object getContactLensEnabled() {
            return this.contactLensEnabled;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.Object getEarlyMediaEnabled() {
            return this.earlyMediaEnabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceAlias() {
            return this.instanceAlias;
        }

        @Override
        public final java.lang.Object getMultiPartyConferenceEnabled() {
            return this.multiPartyConferenceEnabled;
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
        public final imports.aws.connect_instance.ConnectInstanceTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("identityManagementType", om.valueToTree(this.getIdentityManagementType()));
            data.set("inboundCallsEnabled", om.valueToTree(this.getInboundCallsEnabled()));
            data.set("outboundCallsEnabled", om.valueToTree(this.getOutboundCallsEnabled()));
            if (this.getAutoResolveBestVoicesEnabled() != null) {
                data.set("autoResolveBestVoicesEnabled", om.valueToTree(this.getAutoResolveBestVoicesEnabled()));
            }
            if (this.getContactFlowLogsEnabled() != null) {
                data.set("contactFlowLogsEnabled", om.valueToTree(this.getContactFlowLogsEnabled()));
            }
            if (this.getContactLensEnabled() != null) {
                data.set("contactLensEnabled", om.valueToTree(this.getContactLensEnabled()));
            }
            if (this.getDirectoryId() != null) {
                data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            }
            if (this.getEarlyMediaEnabled() != null) {
                data.set("earlyMediaEnabled", om.valueToTree(this.getEarlyMediaEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceAlias() != null) {
                data.set("instanceAlias", om.valueToTree(this.getInstanceAlias()));
            }
            if (this.getMultiPartyConferenceEnabled() != null) {
                data.set("multiPartyConferenceEnabled", om.valueToTree(this.getMultiPartyConferenceEnabled()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.connectInstance.ConnectInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectInstanceConfig.Jsii$Proxy that = (ConnectInstanceConfig.Jsii$Proxy) o;

            if (!identityManagementType.equals(that.identityManagementType)) return false;
            if (!inboundCallsEnabled.equals(that.inboundCallsEnabled)) return false;
            if (!outboundCallsEnabled.equals(that.outboundCallsEnabled)) return false;
            if (this.autoResolveBestVoicesEnabled != null ? !this.autoResolveBestVoicesEnabled.equals(that.autoResolveBestVoicesEnabled) : that.autoResolveBestVoicesEnabled != null) return false;
            if (this.contactFlowLogsEnabled != null ? !this.contactFlowLogsEnabled.equals(that.contactFlowLogsEnabled) : that.contactFlowLogsEnabled != null) return false;
            if (this.contactLensEnabled != null ? !this.contactLensEnabled.equals(that.contactLensEnabled) : that.contactLensEnabled != null) return false;
            if (this.directoryId != null ? !this.directoryId.equals(that.directoryId) : that.directoryId != null) return false;
            if (this.earlyMediaEnabled != null ? !this.earlyMediaEnabled.equals(that.earlyMediaEnabled) : that.earlyMediaEnabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceAlias != null ? !this.instanceAlias.equals(that.instanceAlias) : that.instanceAlias != null) return false;
            if (this.multiPartyConferenceEnabled != null ? !this.multiPartyConferenceEnabled.equals(that.multiPartyConferenceEnabled) : that.multiPartyConferenceEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.identityManagementType.hashCode();
            result = 31 * result + (this.inboundCallsEnabled.hashCode());
            result = 31 * result + (this.outboundCallsEnabled.hashCode());
            result = 31 * result + (this.autoResolveBestVoicesEnabled != null ? this.autoResolveBestVoicesEnabled.hashCode() : 0);
            result = 31 * result + (this.contactFlowLogsEnabled != null ? this.contactFlowLogsEnabled.hashCode() : 0);
            result = 31 * result + (this.contactLensEnabled != null ? this.contactLensEnabled.hashCode() : 0);
            result = 31 * result + (this.directoryId != null ? this.directoryId.hashCode() : 0);
            result = 31 * result + (this.earlyMediaEnabled != null ? this.earlyMediaEnabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceAlias != null ? this.instanceAlias.hashCode() : 0);
            result = 31 * result + (this.multiPartyConferenceEnabled != null ? this.multiPartyConferenceEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
