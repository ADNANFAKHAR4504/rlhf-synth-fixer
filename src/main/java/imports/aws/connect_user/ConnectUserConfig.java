package imports.aws.connect_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectUser.ConnectUserConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectUserConfig.Jsii$Proxy.class)
public interface ConnectUserConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#instance_id ConnectUser#instance_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#name ConnectUser#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * phone_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#phone_config ConnectUser#phone_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.connect_user.ConnectUserPhoneConfig getPhoneConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#routing_profile_id ConnectUser#routing_profile_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoutingProfileId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#security_profile_ids ConnectUser#security_profile_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityProfileIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#directory_user_id ConnectUser#directory_user_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryUserId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#hierarchy_group_id ConnectUser#hierarchy_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHierarchyGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#id ConnectUser#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * identity_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#identity_info ConnectUser#identity_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_user.ConnectUserIdentityInfo getIdentityInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#password ConnectUser#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#tags ConnectUser#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#tags_all ConnectUser#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectUserConfig> {
        java.lang.String instanceId;
        java.lang.String name;
        imports.aws.connect_user.ConnectUserPhoneConfig phoneConfig;
        java.lang.String routingProfileId;
        java.util.List<java.lang.String> securityProfileIds;
        java.lang.String directoryUserId;
        java.lang.String hierarchyGroupId;
        java.lang.String id;
        imports.aws.connect_user.ConnectUserIdentityInfo identityInfo;
        java.lang.String password;
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
         * Sets the value of {@link ConnectUserConfig#getInstanceId}
         * @param instanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#instance_id ConnectUser#instance_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceId(java.lang.String instanceId) {
            this.instanceId = instanceId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#name ConnectUser#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getPhoneConfig}
         * @param phoneConfig phone_config block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#phone_config ConnectUser#phone_config}
         * @return {@code this}
         */
        public Builder phoneConfig(imports.aws.connect_user.ConnectUserPhoneConfig phoneConfig) {
            this.phoneConfig = phoneConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getRoutingProfileId}
         * @param routingProfileId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#routing_profile_id ConnectUser#routing_profile_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder routingProfileId(java.lang.String routingProfileId) {
            this.routingProfileId = routingProfileId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getSecurityProfileIds}
         * @param securityProfileIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#security_profile_ids ConnectUser#security_profile_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityProfileIds(java.util.List<java.lang.String> securityProfileIds) {
            this.securityProfileIds = securityProfileIds;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getDirectoryUserId}
         * @param directoryUserId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#directory_user_id ConnectUser#directory_user_id}.
         * @return {@code this}
         */
        public Builder directoryUserId(java.lang.String directoryUserId) {
            this.directoryUserId = directoryUserId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getHierarchyGroupId}
         * @param hierarchyGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#hierarchy_group_id ConnectUser#hierarchy_group_id}.
         * @return {@code this}
         */
        public Builder hierarchyGroupId(java.lang.String hierarchyGroupId) {
            this.hierarchyGroupId = hierarchyGroupId;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#id ConnectUser#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getIdentityInfo}
         * @param identityInfo identity_info block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#identity_info ConnectUser#identity_info}
         * @return {@code this}
         */
        public Builder identityInfo(imports.aws.connect_user.ConnectUserIdentityInfo identityInfo) {
            this.identityInfo = identityInfo;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#password ConnectUser#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#tags ConnectUser#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#tags_all ConnectUser#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getDependsOn}
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
         * Sets the value of {@link ConnectUserConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserConfig#getProvisioners}
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
         * @return a new instance of {@link ConnectUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectUserConfig {
        private final java.lang.String instanceId;
        private final java.lang.String name;
        private final imports.aws.connect_user.ConnectUserPhoneConfig phoneConfig;
        private final java.lang.String routingProfileId;
        private final java.util.List<java.lang.String> securityProfileIds;
        private final java.lang.String directoryUserId;
        private final java.lang.String hierarchyGroupId;
        private final java.lang.String id;
        private final imports.aws.connect_user.ConnectUserIdentityInfo identityInfo;
        private final java.lang.String password;
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
            this.instanceId = software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneConfig = software.amazon.jsii.Kernel.get(this, "phoneConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_user.ConnectUserPhoneConfig.class));
            this.routingProfileId = software.amazon.jsii.Kernel.get(this, "routingProfileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityProfileIds = software.amazon.jsii.Kernel.get(this, "securityProfileIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.directoryUserId = software.amazon.jsii.Kernel.get(this, "directoryUserId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hierarchyGroupId = software.amazon.jsii.Kernel.get(this, "hierarchyGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityInfo = software.amazon.jsii.Kernel.get(this, "identityInfo", software.amazon.jsii.NativeType.forClass(imports.aws.connect_user.ConnectUserIdentityInfo.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.instanceId = java.util.Objects.requireNonNull(builder.instanceId, "instanceId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.phoneConfig = java.util.Objects.requireNonNull(builder.phoneConfig, "phoneConfig is required");
            this.routingProfileId = java.util.Objects.requireNonNull(builder.routingProfileId, "routingProfileId is required");
            this.securityProfileIds = java.util.Objects.requireNonNull(builder.securityProfileIds, "securityProfileIds is required");
            this.directoryUserId = builder.directoryUserId;
            this.hierarchyGroupId = builder.hierarchyGroupId;
            this.id = builder.id;
            this.identityInfo = builder.identityInfo;
            this.password = builder.password;
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
        public final java.lang.String getInstanceId() {
            return this.instanceId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.connect_user.ConnectUserPhoneConfig getPhoneConfig() {
            return this.phoneConfig;
        }

        @Override
        public final java.lang.String getRoutingProfileId() {
            return this.routingProfileId;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityProfileIds() {
            return this.securityProfileIds;
        }

        @Override
        public final java.lang.String getDirectoryUserId() {
            return this.directoryUserId;
        }

        @Override
        public final java.lang.String getHierarchyGroupId() {
            return this.hierarchyGroupId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.connect_user.ConnectUserIdentityInfo getIdentityInfo() {
            return this.identityInfo;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
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

            data.set("instanceId", om.valueToTree(this.getInstanceId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("phoneConfig", om.valueToTree(this.getPhoneConfig()));
            data.set("routingProfileId", om.valueToTree(this.getRoutingProfileId()));
            data.set("securityProfileIds", om.valueToTree(this.getSecurityProfileIds()));
            if (this.getDirectoryUserId() != null) {
                data.set("directoryUserId", om.valueToTree(this.getDirectoryUserId()));
            }
            if (this.getHierarchyGroupId() != null) {
                data.set("hierarchyGroupId", om.valueToTree(this.getHierarchyGroupId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentityInfo() != null) {
                data.set("identityInfo", om.valueToTree(this.getIdentityInfo()));
            }
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
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
            struct.set("fqn", om.valueToTree("aws.connectUser.ConnectUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectUserConfig.Jsii$Proxy that = (ConnectUserConfig.Jsii$Proxy) o;

            if (!instanceId.equals(that.instanceId)) return false;
            if (!name.equals(that.name)) return false;
            if (!phoneConfig.equals(that.phoneConfig)) return false;
            if (!routingProfileId.equals(that.routingProfileId)) return false;
            if (!securityProfileIds.equals(that.securityProfileIds)) return false;
            if (this.directoryUserId != null ? !this.directoryUserId.equals(that.directoryUserId) : that.directoryUserId != null) return false;
            if (this.hierarchyGroupId != null ? !this.hierarchyGroupId.equals(that.hierarchyGroupId) : that.hierarchyGroupId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identityInfo != null ? !this.identityInfo.equals(that.identityInfo) : that.identityInfo != null) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
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
            int result = this.instanceId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.phoneConfig.hashCode());
            result = 31 * result + (this.routingProfileId.hashCode());
            result = 31 * result + (this.securityProfileIds.hashCode());
            result = 31 * result + (this.directoryUserId != null ? this.directoryUserId.hashCode() : 0);
            result = 31 * result + (this.hierarchyGroupId != null ? this.hierarchyGroupId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identityInfo != null ? this.identityInfo.hashCode() : 0);
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
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
