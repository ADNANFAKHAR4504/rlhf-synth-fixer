package imports.aws.transfer_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.565Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferUser.TransferUserConfig")
@software.amazon.jsii.Jsii.Proxy(TransferUserConfig.Jsii$Proxy.class)
public interface TransferUserConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#role TransferUser#role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#server_id TransferUser#server_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServerId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#user_name TransferUser#user_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory TransferUser#home_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHomeDirectory() {
        return null;
    }

    /**
     * home_directory_mappings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory_mappings TransferUser#home_directory_mappings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHomeDirectoryMappings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory_type TransferUser#home_directory_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHomeDirectoryType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#id TransferUser#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#policy TransferUser#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * posix_profile block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#posix_profile TransferUser#posix_profile}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_user.TransferUserPosixProfile getPosixProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#tags TransferUser#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#tags_all TransferUser#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#timeouts TransferUser#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_user.TransferUserTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferUserConfig> {
        java.lang.String role;
        java.lang.String serverId;
        java.lang.String userName;
        java.lang.String homeDirectory;
        java.lang.Object homeDirectoryMappings;
        java.lang.String homeDirectoryType;
        java.lang.String id;
        java.lang.String policy;
        imports.aws.transfer_user.TransferUserPosixProfile posixProfile;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.transfer_user.TransferUserTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link TransferUserConfig#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#role TransferUser#role}. This parameter is required.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getServerId}
         * @param serverId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#server_id TransferUser#server_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder serverId(java.lang.String serverId) {
            this.serverId = serverId;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getUserName}
         * @param userName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#user_name TransferUser#user_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder userName(java.lang.String userName) {
            this.userName = userName;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getHomeDirectory}
         * @param homeDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory TransferUser#home_directory}.
         * @return {@code this}
         */
        public Builder homeDirectory(java.lang.String homeDirectory) {
            this.homeDirectory = homeDirectory;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getHomeDirectoryMappings}
         * @param homeDirectoryMappings home_directory_mappings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory_mappings TransferUser#home_directory_mappings}
         * @return {@code this}
         */
        public Builder homeDirectoryMappings(com.hashicorp.cdktf.IResolvable homeDirectoryMappings) {
            this.homeDirectoryMappings = homeDirectoryMappings;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getHomeDirectoryMappings}
         * @param homeDirectoryMappings home_directory_mappings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory_mappings TransferUser#home_directory_mappings}
         * @return {@code this}
         */
        public Builder homeDirectoryMappings(java.util.List<? extends imports.aws.transfer_user.TransferUserHomeDirectoryMappings> homeDirectoryMappings) {
            this.homeDirectoryMappings = homeDirectoryMappings;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getHomeDirectoryType}
         * @param homeDirectoryType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#home_directory_type TransferUser#home_directory_type}.
         * @return {@code this}
         */
        public Builder homeDirectoryType(java.lang.String homeDirectoryType) {
            this.homeDirectoryType = homeDirectoryType;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#id TransferUser#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#policy TransferUser#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getPosixProfile}
         * @param posixProfile posix_profile block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#posix_profile TransferUser#posix_profile}
         * @return {@code this}
         */
        public Builder posixProfile(imports.aws.transfer_user.TransferUserPosixProfile posixProfile) {
            this.posixProfile = posixProfile;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#tags TransferUser#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#tags_all TransferUser#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_user#timeouts TransferUser#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.transfer_user.TransferUserTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getDependsOn}
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
         * Sets the value of {@link TransferUserConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link TransferUserConfig#getProvisioners}
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
         * @return a new instance of {@link TransferUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferUserConfig {
        private final java.lang.String role;
        private final java.lang.String serverId;
        private final java.lang.String userName;
        private final java.lang.String homeDirectory;
        private final java.lang.Object homeDirectoryMappings;
        private final java.lang.String homeDirectoryType;
        private final java.lang.String id;
        private final java.lang.String policy;
        private final imports.aws.transfer_user.TransferUserPosixProfile posixProfile;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.transfer_user.TransferUserTimeouts timeouts;
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
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverId = software.amazon.jsii.Kernel.get(this, "serverId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userName = software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.homeDirectory = software.amazon.jsii.Kernel.get(this, "homeDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.homeDirectoryMappings = software.amazon.jsii.Kernel.get(this, "homeDirectoryMappings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.homeDirectoryType = software.amazon.jsii.Kernel.get(this, "homeDirectoryType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.posixProfile = software.amazon.jsii.Kernel.get(this, "posixProfile", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_user.TransferUserPosixProfile.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_user.TransferUserTimeouts.class));
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
            this.role = java.util.Objects.requireNonNull(builder.role, "role is required");
            this.serverId = java.util.Objects.requireNonNull(builder.serverId, "serverId is required");
            this.userName = java.util.Objects.requireNonNull(builder.userName, "userName is required");
            this.homeDirectory = builder.homeDirectory;
            this.homeDirectoryMappings = builder.homeDirectoryMappings;
            this.homeDirectoryType = builder.homeDirectoryType;
            this.id = builder.id;
            this.policy = builder.policy;
            this.posixProfile = builder.posixProfile;
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
        public final java.lang.String getRole() {
            return this.role;
        }

        @Override
        public final java.lang.String getServerId() {
            return this.serverId;
        }

        @Override
        public final java.lang.String getUserName() {
            return this.userName;
        }

        @Override
        public final java.lang.String getHomeDirectory() {
            return this.homeDirectory;
        }

        @Override
        public final java.lang.Object getHomeDirectoryMappings() {
            return this.homeDirectoryMappings;
        }

        @Override
        public final java.lang.String getHomeDirectoryType() {
            return this.homeDirectoryType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final imports.aws.transfer_user.TransferUserPosixProfile getPosixProfile() {
            return this.posixProfile;
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
        public final imports.aws.transfer_user.TransferUserTimeouts getTimeouts() {
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

            data.set("role", om.valueToTree(this.getRole()));
            data.set("serverId", om.valueToTree(this.getServerId()));
            data.set("userName", om.valueToTree(this.getUserName()));
            if (this.getHomeDirectory() != null) {
                data.set("homeDirectory", om.valueToTree(this.getHomeDirectory()));
            }
            if (this.getHomeDirectoryMappings() != null) {
                data.set("homeDirectoryMappings", om.valueToTree(this.getHomeDirectoryMappings()));
            }
            if (this.getHomeDirectoryType() != null) {
                data.set("homeDirectoryType", om.valueToTree(this.getHomeDirectoryType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPosixProfile() != null) {
                data.set("posixProfile", om.valueToTree(this.getPosixProfile()));
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
            struct.set("fqn", om.valueToTree("aws.transferUser.TransferUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferUserConfig.Jsii$Proxy that = (TransferUserConfig.Jsii$Proxy) o;

            if (!role.equals(that.role)) return false;
            if (!serverId.equals(that.serverId)) return false;
            if (!userName.equals(that.userName)) return false;
            if (this.homeDirectory != null ? !this.homeDirectory.equals(that.homeDirectory) : that.homeDirectory != null) return false;
            if (this.homeDirectoryMappings != null ? !this.homeDirectoryMappings.equals(that.homeDirectoryMappings) : that.homeDirectoryMappings != null) return false;
            if (this.homeDirectoryType != null ? !this.homeDirectoryType.equals(that.homeDirectoryType) : that.homeDirectoryType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.posixProfile != null ? !this.posixProfile.equals(that.posixProfile) : that.posixProfile != null) return false;
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
            int result = this.role.hashCode();
            result = 31 * result + (this.serverId.hashCode());
            result = 31 * result + (this.userName.hashCode());
            result = 31 * result + (this.homeDirectory != null ? this.homeDirectory.hashCode() : 0);
            result = 31 * result + (this.homeDirectoryMappings != null ? this.homeDirectoryMappings.hashCode() : 0);
            result = 31 * result + (this.homeDirectoryType != null ? this.homeDirectoryType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.posixProfile != null ? this.posixProfile.hashCode() : 0);
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
