package imports.aws.eks_addon;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksAddon.EksAddonConfig")
@software.amazon.jsii.Jsii.Proxy(EksAddonConfig.Jsii$Proxy.class)
public interface EksAddonConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#addon_name EksAddon#addon_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddonName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#cluster_name EksAddon#cluster_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#addon_version EksAddon#addon_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddonVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#configuration_values EksAddon#configuration_values}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationValues() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#id EksAddon#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * pod_identity_association block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#pod_identity_association EksAddon#pod_identity_association}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPodIdentityAssociation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#preserve EksAddon#preserve}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreserve() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts EksAddon#resolve_conflicts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResolveConflicts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts_on_create EksAddon#resolve_conflicts_on_create}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResolveConflictsOnCreate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts_on_update EksAddon#resolve_conflicts_on_update}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResolveConflictsOnUpdate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#service_account_role_arn EksAddon#service_account_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#tags EksAddon#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#tags_all EksAddon#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#timeouts EksAddon#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_addon.EksAddonTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksAddonConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksAddonConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksAddonConfig> {
        java.lang.String addonName;
        java.lang.String clusterName;
        java.lang.String addonVersion;
        java.lang.String configurationValues;
        java.lang.String id;
        java.lang.Object podIdentityAssociation;
        java.lang.Object preserve;
        java.lang.String resolveConflicts;
        java.lang.String resolveConflictsOnCreate;
        java.lang.String resolveConflictsOnUpdate;
        java.lang.String serviceAccountRoleArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.eks_addon.EksAddonTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EksAddonConfig#getAddonName}
         * @param addonName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#addon_name EksAddon#addon_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder addonName(java.lang.String addonName) {
            this.addonName = addonName;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getClusterName}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#cluster_name EksAddon#cluster_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterName(java.lang.String clusterName) {
            this.clusterName = clusterName;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getAddonVersion}
         * @param addonVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#addon_version EksAddon#addon_version}.
         * @return {@code this}
         */
        public Builder addonVersion(java.lang.String addonVersion) {
            this.addonVersion = addonVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getConfigurationValues}
         * @param configurationValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#configuration_values EksAddon#configuration_values}.
         * @return {@code this}
         */
        public Builder configurationValues(java.lang.String configurationValues) {
            this.configurationValues = configurationValues;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#id EksAddon#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getPodIdentityAssociation}
         * @param podIdentityAssociation pod_identity_association block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#pod_identity_association EksAddon#pod_identity_association}
         * @return {@code this}
         */
        public Builder podIdentityAssociation(com.hashicorp.cdktf.IResolvable podIdentityAssociation) {
            this.podIdentityAssociation = podIdentityAssociation;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getPodIdentityAssociation}
         * @param podIdentityAssociation pod_identity_association block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#pod_identity_association EksAddon#pod_identity_association}
         * @return {@code this}
         */
        public Builder podIdentityAssociation(java.util.List<? extends imports.aws.eks_addon.EksAddonPodIdentityAssociation> podIdentityAssociation) {
            this.podIdentityAssociation = podIdentityAssociation;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getPreserve}
         * @param preserve Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#preserve EksAddon#preserve}.
         * @return {@code this}
         */
        public Builder preserve(java.lang.Boolean preserve) {
            this.preserve = preserve;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getPreserve}
         * @param preserve Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#preserve EksAddon#preserve}.
         * @return {@code this}
         */
        public Builder preserve(com.hashicorp.cdktf.IResolvable preserve) {
            this.preserve = preserve;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getResolveConflicts}
         * @param resolveConflicts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts EksAddon#resolve_conflicts}.
         * @return {@code this}
         */
        public Builder resolveConflicts(java.lang.String resolveConflicts) {
            this.resolveConflicts = resolveConflicts;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getResolveConflictsOnCreate}
         * @param resolveConflictsOnCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts_on_create EksAddon#resolve_conflicts_on_create}.
         * @return {@code this}
         */
        public Builder resolveConflictsOnCreate(java.lang.String resolveConflictsOnCreate) {
            this.resolveConflictsOnCreate = resolveConflictsOnCreate;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getResolveConflictsOnUpdate}
         * @param resolveConflictsOnUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#resolve_conflicts_on_update EksAddon#resolve_conflicts_on_update}.
         * @return {@code this}
         */
        public Builder resolveConflictsOnUpdate(java.lang.String resolveConflictsOnUpdate) {
            this.resolveConflictsOnUpdate = resolveConflictsOnUpdate;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getServiceAccountRoleArn}
         * @param serviceAccountRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#service_account_role_arn EksAddon#service_account_role_arn}.
         * @return {@code this}
         */
        public Builder serviceAccountRoleArn(java.lang.String serviceAccountRoleArn) {
            this.serviceAccountRoleArn = serviceAccountRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#tags EksAddon#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#tags_all EksAddon#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_addon#timeouts EksAddon#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.eks_addon.EksAddonTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getDependsOn}
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
         * Sets the value of {@link EksAddonConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EksAddonConfig#getProvisioners}
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
         * @return a new instance of {@link EksAddonConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksAddonConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksAddonConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksAddonConfig {
        private final java.lang.String addonName;
        private final java.lang.String clusterName;
        private final java.lang.String addonVersion;
        private final java.lang.String configurationValues;
        private final java.lang.String id;
        private final java.lang.Object podIdentityAssociation;
        private final java.lang.Object preserve;
        private final java.lang.String resolveConflicts;
        private final java.lang.String resolveConflictsOnCreate;
        private final java.lang.String resolveConflictsOnUpdate;
        private final java.lang.String serviceAccountRoleArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.eks_addon.EksAddonTimeouts timeouts;
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
            this.addonName = software.amazon.jsii.Kernel.get(this, "addonName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clusterName = software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addonVersion = software.amazon.jsii.Kernel.get(this, "addonVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationValues = software.amazon.jsii.Kernel.get(this, "configurationValues", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.podIdentityAssociation = software.amazon.jsii.Kernel.get(this, "podIdentityAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.preserve = software.amazon.jsii.Kernel.get(this, "preserve", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resolveConflicts = software.amazon.jsii.Kernel.get(this, "resolveConflicts", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resolveConflictsOnCreate = software.amazon.jsii.Kernel.get(this, "resolveConflictsOnCreate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resolveConflictsOnUpdate = software.amazon.jsii.Kernel.get(this, "resolveConflictsOnUpdate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccountRoleArn = software.amazon.jsii.Kernel.get(this, "serviceAccountRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_addon.EksAddonTimeouts.class));
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
            this.addonName = java.util.Objects.requireNonNull(builder.addonName, "addonName is required");
            this.clusterName = java.util.Objects.requireNonNull(builder.clusterName, "clusterName is required");
            this.addonVersion = builder.addonVersion;
            this.configurationValues = builder.configurationValues;
            this.id = builder.id;
            this.podIdentityAssociation = builder.podIdentityAssociation;
            this.preserve = builder.preserve;
            this.resolveConflicts = builder.resolveConflicts;
            this.resolveConflictsOnCreate = builder.resolveConflictsOnCreate;
            this.resolveConflictsOnUpdate = builder.resolveConflictsOnUpdate;
            this.serviceAccountRoleArn = builder.serviceAccountRoleArn;
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
        public final java.lang.String getAddonName() {
            return this.addonName;
        }

        @Override
        public final java.lang.String getClusterName() {
            return this.clusterName;
        }

        @Override
        public final java.lang.String getAddonVersion() {
            return this.addonVersion;
        }

        @Override
        public final java.lang.String getConfigurationValues() {
            return this.configurationValues;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getPodIdentityAssociation() {
            return this.podIdentityAssociation;
        }

        @Override
        public final java.lang.Object getPreserve() {
            return this.preserve;
        }

        @Override
        public final java.lang.String getResolveConflicts() {
            return this.resolveConflicts;
        }

        @Override
        public final java.lang.String getResolveConflictsOnCreate() {
            return this.resolveConflictsOnCreate;
        }

        @Override
        public final java.lang.String getResolveConflictsOnUpdate() {
            return this.resolveConflictsOnUpdate;
        }

        @Override
        public final java.lang.String getServiceAccountRoleArn() {
            return this.serviceAccountRoleArn;
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
        public final imports.aws.eks_addon.EksAddonTimeouts getTimeouts() {
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

            data.set("addonName", om.valueToTree(this.getAddonName()));
            data.set("clusterName", om.valueToTree(this.getClusterName()));
            if (this.getAddonVersion() != null) {
                data.set("addonVersion", om.valueToTree(this.getAddonVersion()));
            }
            if (this.getConfigurationValues() != null) {
                data.set("configurationValues", om.valueToTree(this.getConfigurationValues()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPodIdentityAssociation() != null) {
                data.set("podIdentityAssociation", om.valueToTree(this.getPodIdentityAssociation()));
            }
            if (this.getPreserve() != null) {
                data.set("preserve", om.valueToTree(this.getPreserve()));
            }
            if (this.getResolveConflicts() != null) {
                data.set("resolveConflicts", om.valueToTree(this.getResolveConflicts()));
            }
            if (this.getResolveConflictsOnCreate() != null) {
                data.set("resolveConflictsOnCreate", om.valueToTree(this.getResolveConflictsOnCreate()));
            }
            if (this.getResolveConflictsOnUpdate() != null) {
                data.set("resolveConflictsOnUpdate", om.valueToTree(this.getResolveConflictsOnUpdate()));
            }
            if (this.getServiceAccountRoleArn() != null) {
                data.set("serviceAccountRoleArn", om.valueToTree(this.getServiceAccountRoleArn()));
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
            struct.set("fqn", om.valueToTree("aws.eksAddon.EksAddonConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksAddonConfig.Jsii$Proxy that = (EksAddonConfig.Jsii$Proxy) o;

            if (!addonName.equals(that.addonName)) return false;
            if (!clusterName.equals(that.clusterName)) return false;
            if (this.addonVersion != null ? !this.addonVersion.equals(that.addonVersion) : that.addonVersion != null) return false;
            if (this.configurationValues != null ? !this.configurationValues.equals(that.configurationValues) : that.configurationValues != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.podIdentityAssociation != null ? !this.podIdentityAssociation.equals(that.podIdentityAssociation) : that.podIdentityAssociation != null) return false;
            if (this.preserve != null ? !this.preserve.equals(that.preserve) : that.preserve != null) return false;
            if (this.resolveConflicts != null ? !this.resolveConflicts.equals(that.resolveConflicts) : that.resolveConflicts != null) return false;
            if (this.resolveConflictsOnCreate != null ? !this.resolveConflictsOnCreate.equals(that.resolveConflictsOnCreate) : that.resolveConflictsOnCreate != null) return false;
            if (this.resolveConflictsOnUpdate != null ? !this.resolveConflictsOnUpdate.equals(that.resolveConflictsOnUpdate) : that.resolveConflictsOnUpdate != null) return false;
            if (this.serviceAccountRoleArn != null ? !this.serviceAccountRoleArn.equals(that.serviceAccountRoleArn) : that.serviceAccountRoleArn != null) return false;
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
            int result = this.addonName.hashCode();
            result = 31 * result + (this.clusterName.hashCode());
            result = 31 * result + (this.addonVersion != null ? this.addonVersion.hashCode() : 0);
            result = 31 * result + (this.configurationValues != null ? this.configurationValues.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.podIdentityAssociation != null ? this.podIdentityAssociation.hashCode() : 0);
            result = 31 * result + (this.preserve != null ? this.preserve.hashCode() : 0);
            result = 31 * result + (this.resolveConflicts != null ? this.resolveConflicts.hashCode() : 0);
            result = 31 * result + (this.resolveConflictsOnCreate != null ? this.resolveConflictsOnCreate.hashCode() : 0);
            result = 31 * result + (this.resolveConflictsOnUpdate != null ? this.resolveConflictsOnUpdate.hashCode() : 0);
            result = 31 * result + (this.serviceAccountRoleArn != null ? this.serviceAccountRoleArn.hashCode() : 0);
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
