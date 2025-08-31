package imports.aws.kms_replica_external_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.482Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsReplicaExternalKey.KmsReplicaExternalKeyConfig")
@software.amazon.jsii.Jsii.Proxy(KmsReplicaExternalKeyConfig.Jsii$Proxy.class)
public interface KmsReplicaExternalKeyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#primary_key_arn KmsReplicaExternalKey#primary_key_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrimaryKeyArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#bypass_policy_lockout_safety_check KmsReplicaExternalKey#bypass_policy_lockout_safety_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBypassPolicyLockoutSafetyCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#deletion_window_in_days KmsReplicaExternalKey#deletion_window_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeletionWindowInDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#description KmsReplicaExternalKey#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#enabled KmsReplicaExternalKey#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#id KmsReplicaExternalKey#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#key_material_base64 KmsReplicaExternalKey#key_material_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyMaterialBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#policy KmsReplicaExternalKey#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#tags KmsReplicaExternalKey#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#tags_all KmsReplicaExternalKey#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#valid_to KmsReplicaExternalKey#valid_to}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidTo() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KmsReplicaExternalKeyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KmsReplicaExternalKeyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KmsReplicaExternalKeyConfig> {
        java.lang.String primaryKeyArn;
        java.lang.Object bypassPolicyLockoutSafetyCheck;
        java.lang.Number deletionWindowInDays;
        java.lang.String description;
        java.lang.Object enabled;
        java.lang.String id;
        java.lang.String keyMaterialBase64;
        java.lang.String policy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String validTo;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getPrimaryKeyArn}
         * @param primaryKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#primary_key_arn KmsReplicaExternalKey#primary_key_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder primaryKeyArn(java.lang.String primaryKeyArn) {
            this.primaryKeyArn = primaryKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getBypassPolicyLockoutSafetyCheck}
         * @param bypassPolicyLockoutSafetyCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#bypass_policy_lockout_safety_check KmsReplicaExternalKey#bypass_policy_lockout_safety_check}.
         * @return {@code this}
         */
        public Builder bypassPolicyLockoutSafetyCheck(java.lang.Boolean bypassPolicyLockoutSafetyCheck) {
            this.bypassPolicyLockoutSafetyCheck = bypassPolicyLockoutSafetyCheck;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getBypassPolicyLockoutSafetyCheck}
         * @param bypassPolicyLockoutSafetyCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#bypass_policy_lockout_safety_check KmsReplicaExternalKey#bypass_policy_lockout_safety_check}.
         * @return {@code this}
         */
        public Builder bypassPolicyLockoutSafetyCheck(com.hashicorp.cdktf.IResolvable bypassPolicyLockoutSafetyCheck) {
            this.bypassPolicyLockoutSafetyCheck = bypassPolicyLockoutSafetyCheck;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getDeletionWindowInDays}
         * @param deletionWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#deletion_window_in_days KmsReplicaExternalKey#deletion_window_in_days}.
         * @return {@code this}
         */
        public Builder deletionWindowInDays(java.lang.Number deletionWindowInDays) {
            this.deletionWindowInDays = deletionWindowInDays;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#description KmsReplicaExternalKey#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#enabled KmsReplicaExternalKey#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#enabled KmsReplicaExternalKey#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#id KmsReplicaExternalKey#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getKeyMaterialBase64}
         * @param keyMaterialBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#key_material_base64 KmsReplicaExternalKey#key_material_base64}.
         * @return {@code this}
         */
        public Builder keyMaterialBase64(java.lang.String keyMaterialBase64) {
            this.keyMaterialBase64 = keyMaterialBase64;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#policy KmsReplicaExternalKey#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#tags KmsReplicaExternalKey#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#tags_all KmsReplicaExternalKey#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getValidTo}
         * @param validTo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_replica_external_key#valid_to KmsReplicaExternalKey#valid_to}.
         * @return {@code this}
         */
        public Builder validTo(java.lang.String validTo) {
            this.validTo = validTo;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getDependsOn}
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
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link KmsReplicaExternalKeyConfig#getProvisioners}
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
         * @return a new instance of {@link KmsReplicaExternalKeyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KmsReplicaExternalKeyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KmsReplicaExternalKeyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KmsReplicaExternalKeyConfig {
        private final java.lang.String primaryKeyArn;
        private final java.lang.Object bypassPolicyLockoutSafetyCheck;
        private final java.lang.Number deletionWindowInDays;
        private final java.lang.String description;
        private final java.lang.Object enabled;
        private final java.lang.String id;
        private final java.lang.String keyMaterialBase64;
        private final java.lang.String policy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String validTo;
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
            this.primaryKeyArn = software.amazon.jsii.Kernel.get(this, "primaryKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bypassPolicyLockoutSafetyCheck = software.amazon.jsii.Kernel.get(this, "bypassPolicyLockoutSafetyCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deletionWindowInDays = software.amazon.jsii.Kernel.get(this, "deletionWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyMaterialBase64 = software.amazon.jsii.Kernel.get(this, "keyMaterialBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.validTo = software.amazon.jsii.Kernel.get(this, "validTo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.primaryKeyArn = java.util.Objects.requireNonNull(builder.primaryKeyArn, "primaryKeyArn is required");
            this.bypassPolicyLockoutSafetyCheck = builder.bypassPolicyLockoutSafetyCheck;
            this.deletionWindowInDays = builder.deletionWindowInDays;
            this.description = builder.description;
            this.enabled = builder.enabled;
            this.id = builder.id;
            this.keyMaterialBase64 = builder.keyMaterialBase64;
            this.policy = builder.policy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.validTo = builder.validTo;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getPrimaryKeyArn() {
            return this.primaryKeyArn;
        }

        @Override
        public final java.lang.Object getBypassPolicyLockoutSafetyCheck() {
            return this.bypassPolicyLockoutSafetyCheck;
        }

        @Override
        public final java.lang.Number getDeletionWindowInDays() {
            return this.deletionWindowInDays;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKeyMaterialBase64() {
            return this.keyMaterialBase64;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
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
        public final java.lang.String getValidTo() {
            return this.validTo;
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

            data.set("primaryKeyArn", om.valueToTree(this.getPrimaryKeyArn()));
            if (this.getBypassPolicyLockoutSafetyCheck() != null) {
                data.set("bypassPolicyLockoutSafetyCheck", om.valueToTree(this.getBypassPolicyLockoutSafetyCheck()));
            }
            if (this.getDeletionWindowInDays() != null) {
                data.set("deletionWindowInDays", om.valueToTree(this.getDeletionWindowInDays()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeyMaterialBase64() != null) {
                data.set("keyMaterialBase64", om.valueToTree(this.getKeyMaterialBase64()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getValidTo() != null) {
                data.set("validTo", om.valueToTree(this.getValidTo()));
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
            struct.set("fqn", om.valueToTree("aws.kmsReplicaExternalKey.KmsReplicaExternalKeyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KmsReplicaExternalKeyConfig.Jsii$Proxy that = (KmsReplicaExternalKeyConfig.Jsii$Proxy) o;

            if (!primaryKeyArn.equals(that.primaryKeyArn)) return false;
            if (this.bypassPolicyLockoutSafetyCheck != null ? !this.bypassPolicyLockoutSafetyCheck.equals(that.bypassPolicyLockoutSafetyCheck) : that.bypassPolicyLockoutSafetyCheck != null) return false;
            if (this.deletionWindowInDays != null ? !this.deletionWindowInDays.equals(that.deletionWindowInDays) : that.deletionWindowInDays != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keyMaterialBase64 != null ? !this.keyMaterialBase64.equals(that.keyMaterialBase64) : that.keyMaterialBase64 != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.validTo != null ? !this.validTo.equals(that.validTo) : that.validTo != null) return false;
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
            int result = this.primaryKeyArn.hashCode();
            result = 31 * result + (this.bypassPolicyLockoutSafetyCheck != null ? this.bypassPolicyLockoutSafetyCheck.hashCode() : 0);
            result = 31 * result + (this.deletionWindowInDays != null ? this.deletionWindowInDays.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keyMaterialBase64 != null ? this.keyMaterialBase64.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.validTo != null ? this.validTo.hashCode() : 0);
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
