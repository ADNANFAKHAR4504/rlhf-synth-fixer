package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(FmsPolicyConfig.Jsii$Proxy.class)
public interface FmsPolicyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#exclude_resource_tags FmsPolicy#exclude_resource_tags}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getExcludeResourceTags();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#name FmsPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * security_service_policy_data block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#security_service_policy_data FmsPolicy#security_service_policy_data}
     */
    @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyData getSecurityServicePolicyData();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_all_policy_resources FmsPolicy#delete_all_policy_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteAllPolicyResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_unused_fm_managed_resources FmsPolicy#delete_unused_fm_managed_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteUnusedFmManagedResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#description FmsPolicy#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * exclude_map block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#exclude_map FmsPolicy#exclude_map}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicyExcludeMap getExcludeMap() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#id FmsPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * include_map block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#include_map FmsPolicy#include_map}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicyIncludeMap getIncludeMap() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#remediation_enabled FmsPolicy#remediation_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRemediationEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_set_ids FmsPolicy#resource_set_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceSetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_tags FmsPolicy#resource_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_type FmsPolicy#resource_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_type_list FmsPolicy#resource_type_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypeList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#tags FmsPolicy#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#tags_all FmsPolicy#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicyConfig> {
        java.lang.Object excludeResourceTags;
        java.lang.String name;
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyData securityServicePolicyData;
        java.lang.Object deleteAllPolicyResources;
        java.lang.Object deleteUnusedFmManagedResources;
        java.lang.String description;
        imports.aws.fms_policy.FmsPolicyExcludeMap excludeMap;
        java.lang.String id;
        imports.aws.fms_policy.FmsPolicyIncludeMap includeMap;
        java.lang.Object remediationEnabled;
        java.util.List<java.lang.String> resourceSetIds;
        java.util.Map<java.lang.String, java.lang.String> resourceTags;
        java.lang.String resourceType;
        java.util.List<java.lang.String> resourceTypeList;
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
         * Sets the value of {@link FmsPolicyConfig#getExcludeResourceTags}
         * @param excludeResourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#exclude_resource_tags FmsPolicy#exclude_resource_tags}. This parameter is required.
         * @return {@code this}
         */
        public Builder excludeResourceTags(java.lang.Boolean excludeResourceTags) {
            this.excludeResourceTags = excludeResourceTags;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getExcludeResourceTags}
         * @param excludeResourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#exclude_resource_tags FmsPolicy#exclude_resource_tags}. This parameter is required.
         * @return {@code this}
         */
        public Builder excludeResourceTags(com.hashicorp.cdktf.IResolvable excludeResourceTags) {
            this.excludeResourceTags = excludeResourceTags;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#name FmsPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getSecurityServicePolicyData}
         * @param securityServicePolicyData security_service_policy_data block. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#security_service_policy_data FmsPolicy#security_service_policy_data}
         * @return {@code this}
         */
        public Builder securityServicePolicyData(imports.aws.fms_policy.FmsPolicySecurityServicePolicyData securityServicePolicyData) {
            this.securityServicePolicyData = securityServicePolicyData;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDeleteAllPolicyResources}
         * @param deleteAllPolicyResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_all_policy_resources FmsPolicy#delete_all_policy_resources}.
         * @return {@code this}
         */
        public Builder deleteAllPolicyResources(java.lang.Boolean deleteAllPolicyResources) {
            this.deleteAllPolicyResources = deleteAllPolicyResources;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDeleteAllPolicyResources}
         * @param deleteAllPolicyResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_all_policy_resources FmsPolicy#delete_all_policy_resources}.
         * @return {@code this}
         */
        public Builder deleteAllPolicyResources(com.hashicorp.cdktf.IResolvable deleteAllPolicyResources) {
            this.deleteAllPolicyResources = deleteAllPolicyResources;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDeleteUnusedFmManagedResources}
         * @param deleteUnusedFmManagedResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_unused_fm_managed_resources FmsPolicy#delete_unused_fm_managed_resources}.
         * @return {@code this}
         */
        public Builder deleteUnusedFmManagedResources(java.lang.Boolean deleteUnusedFmManagedResources) {
            this.deleteUnusedFmManagedResources = deleteUnusedFmManagedResources;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDeleteUnusedFmManagedResources}
         * @param deleteUnusedFmManagedResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#delete_unused_fm_managed_resources FmsPolicy#delete_unused_fm_managed_resources}.
         * @return {@code this}
         */
        public Builder deleteUnusedFmManagedResources(com.hashicorp.cdktf.IResolvable deleteUnusedFmManagedResources) {
            this.deleteUnusedFmManagedResources = deleteUnusedFmManagedResources;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#description FmsPolicy#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getExcludeMap}
         * @param excludeMap exclude_map block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#exclude_map FmsPolicy#exclude_map}
         * @return {@code this}
         */
        public Builder excludeMap(imports.aws.fms_policy.FmsPolicyExcludeMap excludeMap) {
            this.excludeMap = excludeMap;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#id FmsPolicy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getIncludeMap}
         * @param includeMap include_map block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#include_map FmsPolicy#include_map}
         * @return {@code this}
         */
        public Builder includeMap(imports.aws.fms_policy.FmsPolicyIncludeMap includeMap) {
            this.includeMap = includeMap;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getRemediationEnabled}
         * @param remediationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#remediation_enabled FmsPolicy#remediation_enabled}.
         * @return {@code this}
         */
        public Builder remediationEnabled(java.lang.Boolean remediationEnabled) {
            this.remediationEnabled = remediationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getRemediationEnabled}
         * @param remediationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#remediation_enabled FmsPolicy#remediation_enabled}.
         * @return {@code this}
         */
        public Builder remediationEnabled(com.hashicorp.cdktf.IResolvable remediationEnabled) {
            this.remediationEnabled = remediationEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getResourceSetIds}
         * @param resourceSetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_set_ids FmsPolicy#resource_set_ids}.
         * @return {@code this}
         */
        public Builder resourceSetIds(java.util.List<java.lang.String> resourceSetIds) {
            this.resourceSetIds = resourceSetIds;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getResourceTags}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_tags FmsPolicy#resource_tags}.
         * @return {@code this}
         */
        public Builder resourceTags(java.util.Map<java.lang.String, java.lang.String> resourceTags) {
            this.resourceTags = resourceTags;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_type FmsPolicy#resource_type}.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getResourceTypeList}
         * @param resourceTypeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#resource_type_list FmsPolicy#resource_type_list}.
         * @return {@code this}
         */
        public Builder resourceTypeList(java.util.List<java.lang.String> resourceTypeList) {
            this.resourceTypeList = resourceTypeList;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#tags FmsPolicy#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#tags_all FmsPolicy#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getDependsOn}
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
         * Sets the value of {@link FmsPolicyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyConfig#getProvisioners}
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
         * @return a new instance of {@link FmsPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicyConfig {
        private final java.lang.Object excludeResourceTags;
        private final java.lang.String name;
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyData securityServicePolicyData;
        private final java.lang.Object deleteAllPolicyResources;
        private final java.lang.Object deleteUnusedFmManagedResources;
        private final java.lang.String description;
        private final imports.aws.fms_policy.FmsPolicyExcludeMap excludeMap;
        private final java.lang.String id;
        private final imports.aws.fms_policy.FmsPolicyIncludeMap includeMap;
        private final java.lang.Object remediationEnabled;
        private final java.util.List<java.lang.String> resourceSetIds;
        private final java.util.Map<java.lang.String, java.lang.String> resourceTags;
        private final java.lang.String resourceType;
        private final java.util.List<java.lang.String> resourceTypeList;
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
            this.excludeResourceTags = software.amazon.jsii.Kernel.get(this, "excludeResourceTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityServicePolicyData = software.amazon.jsii.Kernel.get(this, "securityServicePolicyData", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyData.class));
            this.deleteAllPolicyResources = software.amazon.jsii.Kernel.get(this, "deleteAllPolicyResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deleteUnusedFmManagedResources = software.amazon.jsii.Kernel.get(this, "deleteUnusedFmManagedResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludeMap = software.amazon.jsii.Kernel.get(this, "excludeMap", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicyExcludeMap.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeMap = software.amazon.jsii.Kernel.get(this, "includeMap", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicyIncludeMap.class));
            this.remediationEnabled = software.amazon.jsii.Kernel.get(this, "remediationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceSetIds = software.amazon.jsii.Kernel.get(this, "resourceSetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceTags = software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTypeList = software.amazon.jsii.Kernel.get(this, "resourceTypeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.excludeResourceTags = java.util.Objects.requireNonNull(builder.excludeResourceTags, "excludeResourceTags is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.securityServicePolicyData = java.util.Objects.requireNonNull(builder.securityServicePolicyData, "securityServicePolicyData is required");
            this.deleteAllPolicyResources = builder.deleteAllPolicyResources;
            this.deleteUnusedFmManagedResources = builder.deleteUnusedFmManagedResources;
            this.description = builder.description;
            this.excludeMap = builder.excludeMap;
            this.id = builder.id;
            this.includeMap = builder.includeMap;
            this.remediationEnabled = builder.remediationEnabled;
            this.resourceSetIds = builder.resourceSetIds;
            this.resourceTags = builder.resourceTags;
            this.resourceType = builder.resourceType;
            this.resourceTypeList = builder.resourceTypeList;
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
        public final java.lang.Object getExcludeResourceTags() {
            return this.excludeResourceTags;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyData getSecurityServicePolicyData() {
            return this.securityServicePolicyData;
        }

        @Override
        public final java.lang.Object getDeleteAllPolicyResources() {
            return this.deleteAllPolicyResources;
        }

        @Override
        public final java.lang.Object getDeleteUnusedFmManagedResources() {
            return this.deleteUnusedFmManagedResources;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicyExcludeMap getExcludeMap() {
            return this.excludeMap;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicyIncludeMap getIncludeMap() {
            return this.includeMap;
        }

        @Override
        public final java.lang.Object getRemediationEnabled() {
            return this.remediationEnabled;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceSetIds() {
            return this.resourceSetIds;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
            return this.resourceTags;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypeList() {
            return this.resourceTypeList;
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

            data.set("excludeResourceTags", om.valueToTree(this.getExcludeResourceTags()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("securityServicePolicyData", om.valueToTree(this.getSecurityServicePolicyData()));
            if (this.getDeleteAllPolicyResources() != null) {
                data.set("deleteAllPolicyResources", om.valueToTree(this.getDeleteAllPolicyResources()));
            }
            if (this.getDeleteUnusedFmManagedResources() != null) {
                data.set("deleteUnusedFmManagedResources", om.valueToTree(this.getDeleteUnusedFmManagedResources()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExcludeMap() != null) {
                data.set("excludeMap", om.valueToTree(this.getExcludeMap()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeMap() != null) {
                data.set("includeMap", om.valueToTree(this.getIncludeMap()));
            }
            if (this.getRemediationEnabled() != null) {
                data.set("remediationEnabled", om.valueToTree(this.getRemediationEnabled()));
            }
            if (this.getResourceSetIds() != null) {
                data.set("resourceSetIds", om.valueToTree(this.getResourceSetIds()));
            }
            if (this.getResourceTags() != null) {
                data.set("resourceTags", om.valueToTree(this.getResourceTags()));
            }
            if (this.getResourceType() != null) {
                data.set("resourceType", om.valueToTree(this.getResourceType()));
            }
            if (this.getResourceTypeList() != null) {
                data.set("resourceTypeList", om.valueToTree(this.getResourceTypeList()));
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
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicyConfig.Jsii$Proxy that = (FmsPolicyConfig.Jsii$Proxy) o;

            if (!excludeResourceTags.equals(that.excludeResourceTags)) return false;
            if (!name.equals(that.name)) return false;
            if (!securityServicePolicyData.equals(that.securityServicePolicyData)) return false;
            if (this.deleteAllPolicyResources != null ? !this.deleteAllPolicyResources.equals(that.deleteAllPolicyResources) : that.deleteAllPolicyResources != null) return false;
            if (this.deleteUnusedFmManagedResources != null ? !this.deleteUnusedFmManagedResources.equals(that.deleteUnusedFmManagedResources) : that.deleteUnusedFmManagedResources != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.excludeMap != null ? !this.excludeMap.equals(that.excludeMap) : that.excludeMap != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeMap != null ? !this.includeMap.equals(that.includeMap) : that.includeMap != null) return false;
            if (this.remediationEnabled != null ? !this.remediationEnabled.equals(that.remediationEnabled) : that.remediationEnabled != null) return false;
            if (this.resourceSetIds != null ? !this.resourceSetIds.equals(that.resourceSetIds) : that.resourceSetIds != null) return false;
            if (this.resourceTags != null ? !this.resourceTags.equals(that.resourceTags) : that.resourceTags != null) return false;
            if (this.resourceType != null ? !this.resourceType.equals(that.resourceType) : that.resourceType != null) return false;
            if (this.resourceTypeList != null ? !this.resourceTypeList.equals(that.resourceTypeList) : that.resourceTypeList != null) return false;
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
            int result = this.excludeResourceTags.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.securityServicePolicyData.hashCode());
            result = 31 * result + (this.deleteAllPolicyResources != null ? this.deleteAllPolicyResources.hashCode() : 0);
            result = 31 * result + (this.deleteUnusedFmManagedResources != null ? this.deleteUnusedFmManagedResources.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.excludeMap != null ? this.excludeMap.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeMap != null ? this.includeMap.hashCode() : 0);
            result = 31 * result + (this.remediationEnabled != null ? this.remediationEnabled.hashCode() : 0);
            result = 31 * result + (this.resourceSetIds != null ? this.resourceSetIds.hashCode() : 0);
            result = 31 * result + (this.resourceTags != null ? this.resourceTags.hashCode() : 0);
            result = 31 * result + (this.resourceType != null ? this.resourceType.hashCode() : 0);
            result = 31 * result + (this.resourceTypeList != null ? this.resourceTypeList.hashCode() : 0);
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
