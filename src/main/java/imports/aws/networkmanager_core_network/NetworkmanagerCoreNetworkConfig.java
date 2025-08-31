package imports.aws.networkmanager_core_network;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.968Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerCoreNetwork.NetworkmanagerCoreNetworkConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerCoreNetworkConfig.Jsii$Proxy.class)
public interface NetworkmanagerCoreNetworkConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#global_network_id NetworkmanagerCoreNetwork#global_network_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGlobalNetworkId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_document NetworkmanagerCoreNetwork#base_policy_document}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasePolicyDocument() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_region NetworkmanagerCoreNetwork#base_policy_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasePolicyRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_regions NetworkmanagerCoreNetwork#base_policy_regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBasePolicyRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#create_base_policy NetworkmanagerCoreNetwork#create_base_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateBasePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#description NetworkmanagerCoreNetwork#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#id NetworkmanagerCoreNetwork#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#tags NetworkmanagerCoreNetwork#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#tags_all NetworkmanagerCoreNetwork#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#timeouts NetworkmanagerCoreNetwork#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerCoreNetworkConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerCoreNetworkConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerCoreNetworkConfig> {
        java.lang.String globalNetworkId;
        java.lang.String basePolicyDocument;
        java.lang.String basePolicyRegion;
        java.util.List<java.lang.String> basePolicyRegions;
        java.lang.Object createBasePolicy;
        java.lang.String description;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getGlobalNetworkId}
         * @param globalNetworkId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#global_network_id NetworkmanagerCoreNetwork#global_network_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder globalNetworkId(java.lang.String globalNetworkId) {
            this.globalNetworkId = globalNetworkId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getBasePolicyDocument}
         * @param basePolicyDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_document NetworkmanagerCoreNetwork#base_policy_document}.
         * @return {@code this}
         */
        public Builder basePolicyDocument(java.lang.String basePolicyDocument) {
            this.basePolicyDocument = basePolicyDocument;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getBasePolicyRegion}
         * @param basePolicyRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_region NetworkmanagerCoreNetwork#base_policy_region}.
         * @return {@code this}
         */
        public Builder basePolicyRegion(java.lang.String basePolicyRegion) {
            this.basePolicyRegion = basePolicyRegion;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getBasePolicyRegions}
         * @param basePolicyRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#base_policy_regions NetworkmanagerCoreNetwork#base_policy_regions}.
         * @return {@code this}
         */
        public Builder basePolicyRegions(java.util.List<java.lang.String> basePolicyRegions) {
            this.basePolicyRegions = basePolicyRegions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getCreateBasePolicy}
         * @param createBasePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#create_base_policy NetworkmanagerCoreNetwork#create_base_policy}.
         * @return {@code this}
         */
        public Builder createBasePolicy(java.lang.Boolean createBasePolicy) {
            this.createBasePolicy = createBasePolicy;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getCreateBasePolicy}
         * @param createBasePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#create_base_policy NetworkmanagerCoreNetwork#create_base_policy}.
         * @return {@code this}
         */
        public Builder createBasePolicy(com.hashicorp.cdktf.IResolvable createBasePolicy) {
            this.createBasePolicy = createBasePolicy;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#description NetworkmanagerCoreNetwork#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#id NetworkmanagerCoreNetwork#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#tags NetworkmanagerCoreNetwork#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#tags_all NetworkmanagerCoreNetwork#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_core_network#timeouts NetworkmanagerCoreNetwork#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getDependsOn}
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
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerCoreNetworkConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkmanagerCoreNetworkConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerCoreNetworkConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerCoreNetworkConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerCoreNetworkConfig {
        private final java.lang.String globalNetworkId;
        private final java.lang.String basePolicyDocument;
        private final java.lang.String basePolicyRegion;
        private final java.util.List<java.lang.String> basePolicyRegions;
        private final java.lang.Object createBasePolicy;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts timeouts;
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
            this.globalNetworkId = software.amazon.jsii.Kernel.get(this, "globalNetworkId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.basePolicyDocument = software.amazon.jsii.Kernel.get(this, "basePolicyDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.basePolicyRegion = software.amazon.jsii.Kernel.get(this, "basePolicyRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.basePolicyRegions = software.amazon.jsii.Kernel.get(this, "basePolicyRegions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.createBasePolicy = software.amazon.jsii.Kernel.get(this, "createBasePolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts.class));
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
            this.globalNetworkId = java.util.Objects.requireNonNull(builder.globalNetworkId, "globalNetworkId is required");
            this.basePolicyDocument = builder.basePolicyDocument;
            this.basePolicyRegion = builder.basePolicyRegion;
            this.basePolicyRegions = builder.basePolicyRegions;
            this.createBasePolicy = builder.createBasePolicy;
            this.description = builder.description;
            this.id = builder.id;
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
        public final java.lang.String getGlobalNetworkId() {
            return this.globalNetworkId;
        }

        @Override
        public final java.lang.String getBasePolicyDocument() {
            return this.basePolicyDocument;
        }

        @Override
        public final java.lang.String getBasePolicyRegion() {
            return this.basePolicyRegion;
        }

        @Override
        public final java.util.List<java.lang.String> getBasePolicyRegions() {
            return this.basePolicyRegions;
        }

        @Override
        public final java.lang.Object getCreateBasePolicy() {
            return this.createBasePolicy;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
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
        public final imports.aws.networkmanager_core_network.NetworkmanagerCoreNetworkTimeouts getTimeouts() {
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

            data.set("globalNetworkId", om.valueToTree(this.getGlobalNetworkId()));
            if (this.getBasePolicyDocument() != null) {
                data.set("basePolicyDocument", om.valueToTree(this.getBasePolicyDocument()));
            }
            if (this.getBasePolicyRegion() != null) {
                data.set("basePolicyRegion", om.valueToTree(this.getBasePolicyRegion()));
            }
            if (this.getBasePolicyRegions() != null) {
                data.set("basePolicyRegions", om.valueToTree(this.getBasePolicyRegions()));
            }
            if (this.getCreateBasePolicy() != null) {
                data.set("createBasePolicy", om.valueToTree(this.getCreateBasePolicy()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
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
            struct.set("fqn", om.valueToTree("aws.networkmanagerCoreNetwork.NetworkmanagerCoreNetworkConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerCoreNetworkConfig.Jsii$Proxy that = (NetworkmanagerCoreNetworkConfig.Jsii$Proxy) o;

            if (!globalNetworkId.equals(that.globalNetworkId)) return false;
            if (this.basePolicyDocument != null ? !this.basePolicyDocument.equals(that.basePolicyDocument) : that.basePolicyDocument != null) return false;
            if (this.basePolicyRegion != null ? !this.basePolicyRegion.equals(that.basePolicyRegion) : that.basePolicyRegion != null) return false;
            if (this.basePolicyRegions != null ? !this.basePolicyRegions.equals(that.basePolicyRegions) : that.basePolicyRegions != null) return false;
            if (this.createBasePolicy != null ? !this.createBasePolicy.equals(that.createBasePolicy) : that.createBasePolicy != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.globalNetworkId.hashCode();
            result = 31 * result + (this.basePolicyDocument != null ? this.basePolicyDocument.hashCode() : 0);
            result = 31 * result + (this.basePolicyRegion != null ? this.basePolicyRegion.hashCode() : 0);
            result = 31 * result + (this.basePolicyRegions != null ? this.basePolicyRegions.hashCode() : 0);
            result = 31 * result + (this.createBasePolicy != null ? this.createBasePolicy.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
