package imports.aws.cleanrooms_collaboration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.212Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsCollaboration.CleanroomsCollaborationConfig")
@software.amazon.jsii.Jsii.Proxy(CleanroomsCollaborationConfig.Jsii$Proxy.class)
public interface CleanroomsCollaborationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#creator_display_name CleanroomsCollaboration#creator_display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCreatorDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#creator_member_abilities CleanroomsCollaboration#creator_member_abilities}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCreatorMemberAbilities();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#description CleanroomsCollaboration#description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#name CleanroomsCollaboration#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#query_log_status CleanroomsCollaboration#query_log_status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueryLogStatus();

    /**
     * data_encryption_metadata block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#data_encryption_metadata CleanroomsCollaboration#data_encryption_metadata}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata getDataEncryptionMetadata() {
        return null;
    }

    /**
     * member block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#member CleanroomsCollaboration#member}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMember() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#tags CleanroomsCollaboration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#tags_all CleanroomsCollaboration#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#timeouts CleanroomsCollaboration#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CleanroomsCollaborationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsCollaborationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsCollaborationConfig> {
        java.lang.String creatorDisplayName;
        java.util.List<java.lang.String> creatorMemberAbilities;
        java.lang.String description;
        java.lang.String name;
        java.lang.String queryLogStatus;
        imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata dataEncryptionMetadata;
        java.lang.Object member;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getCreatorDisplayName}
         * @param creatorDisplayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#creator_display_name CleanroomsCollaboration#creator_display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder creatorDisplayName(java.lang.String creatorDisplayName) {
            this.creatorDisplayName = creatorDisplayName;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getCreatorMemberAbilities}
         * @param creatorMemberAbilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#creator_member_abilities CleanroomsCollaboration#creator_member_abilities}. This parameter is required.
         * @return {@code this}
         */
        public Builder creatorMemberAbilities(java.util.List<java.lang.String> creatorMemberAbilities) {
            this.creatorMemberAbilities = creatorMemberAbilities;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#description CleanroomsCollaboration#description}. This parameter is required.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#name CleanroomsCollaboration#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getQueryLogStatus}
         * @param queryLogStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#query_log_status CleanroomsCollaboration#query_log_status}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryLogStatus(java.lang.String queryLogStatus) {
            this.queryLogStatus = queryLogStatus;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getDataEncryptionMetadata}
         * @param dataEncryptionMetadata data_encryption_metadata block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#data_encryption_metadata CleanroomsCollaboration#data_encryption_metadata}
         * @return {@code this}
         */
        public Builder dataEncryptionMetadata(imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata dataEncryptionMetadata) {
            this.dataEncryptionMetadata = dataEncryptionMetadata;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getMember}
         * @param member member block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#member CleanroomsCollaboration#member}
         * @return {@code this}
         */
        public Builder member(com.hashicorp.cdktf.IResolvable member) {
            this.member = member;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getMember}
         * @param member member block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#member CleanroomsCollaboration#member}
         * @return {@code this}
         */
        public Builder member(java.util.List<? extends imports.aws.cleanrooms_collaboration.CleanroomsCollaborationMember> member) {
            this.member = member;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#tags CleanroomsCollaboration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#tags_all CleanroomsCollaboration#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#timeouts CleanroomsCollaboration#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getDependsOn}
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
         * Sets the value of {@link CleanroomsCollaborationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationConfig#getProvisioners}
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
         * @return a new instance of {@link CleanroomsCollaborationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsCollaborationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsCollaborationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsCollaborationConfig {
        private final java.lang.String creatorDisplayName;
        private final java.util.List<java.lang.String> creatorMemberAbilities;
        private final java.lang.String description;
        private final java.lang.String name;
        private final java.lang.String queryLogStatus;
        private final imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata dataEncryptionMetadata;
        private final java.lang.Object member;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts timeouts;
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
            this.creatorDisplayName = software.amazon.jsii.Kernel.get(this, "creatorDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.creatorMemberAbilities = software.amazon.jsii.Kernel.get(this, "creatorMemberAbilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryLogStatus = software.amazon.jsii.Kernel.get(this, "queryLogStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataEncryptionMetadata = software.amazon.jsii.Kernel.get(this, "dataEncryptionMetadata", software.amazon.jsii.NativeType.forClass(imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata.class));
            this.member = software.amazon.jsii.Kernel.get(this, "member", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts.class));
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
            this.creatorDisplayName = java.util.Objects.requireNonNull(builder.creatorDisplayName, "creatorDisplayName is required");
            this.creatorMemberAbilities = java.util.Objects.requireNonNull(builder.creatorMemberAbilities, "creatorMemberAbilities is required");
            this.description = java.util.Objects.requireNonNull(builder.description, "description is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.queryLogStatus = java.util.Objects.requireNonNull(builder.queryLogStatus, "queryLogStatus is required");
            this.dataEncryptionMetadata = builder.dataEncryptionMetadata;
            this.member = builder.member;
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
        public final java.lang.String getCreatorDisplayName() {
            return this.creatorDisplayName;
        }

        @Override
        public final java.util.List<java.lang.String> getCreatorMemberAbilities() {
            return this.creatorMemberAbilities;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getQueryLogStatus() {
            return this.queryLogStatus;
        }

        @Override
        public final imports.aws.cleanrooms_collaboration.CleanroomsCollaborationDataEncryptionMetadata getDataEncryptionMetadata() {
            return this.dataEncryptionMetadata;
        }

        @Override
        public final java.lang.Object getMember() {
            return this.member;
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
        public final imports.aws.cleanrooms_collaboration.CleanroomsCollaborationTimeouts getTimeouts() {
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

            data.set("creatorDisplayName", om.valueToTree(this.getCreatorDisplayName()));
            data.set("creatorMemberAbilities", om.valueToTree(this.getCreatorMemberAbilities()));
            data.set("description", om.valueToTree(this.getDescription()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("queryLogStatus", om.valueToTree(this.getQueryLogStatus()));
            if (this.getDataEncryptionMetadata() != null) {
                data.set("dataEncryptionMetadata", om.valueToTree(this.getDataEncryptionMetadata()));
            }
            if (this.getMember() != null) {
                data.set("member", om.valueToTree(this.getMember()));
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
            struct.set("fqn", om.valueToTree("aws.cleanroomsCollaboration.CleanroomsCollaborationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsCollaborationConfig.Jsii$Proxy that = (CleanroomsCollaborationConfig.Jsii$Proxy) o;

            if (!creatorDisplayName.equals(that.creatorDisplayName)) return false;
            if (!creatorMemberAbilities.equals(that.creatorMemberAbilities)) return false;
            if (!description.equals(that.description)) return false;
            if (!name.equals(that.name)) return false;
            if (!queryLogStatus.equals(that.queryLogStatus)) return false;
            if (this.dataEncryptionMetadata != null ? !this.dataEncryptionMetadata.equals(that.dataEncryptionMetadata) : that.dataEncryptionMetadata != null) return false;
            if (this.member != null ? !this.member.equals(that.member) : that.member != null) return false;
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
            int result = this.creatorDisplayName.hashCode();
            result = 31 * result + (this.creatorMemberAbilities.hashCode());
            result = 31 * result + (this.description.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.queryLogStatus.hashCode());
            result = 31 * result + (this.dataEncryptionMetadata != null ? this.dataEncryptionMetadata.hashCode() : 0);
            result = 31 * result + (this.member != null ? this.member.hashCode() : 0);
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
