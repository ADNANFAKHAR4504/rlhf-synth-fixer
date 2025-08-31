package imports.aws.ssm_patch_baseline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmPatchBaseline.SsmPatchBaselineConfig")
@software.amazon.jsii.Jsii.Proxy(SsmPatchBaselineConfig.Jsii$Proxy.class)
public interface SsmPatchBaselineConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * approval_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approval_rule SsmPatchBaseline#approval_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApprovalRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches SsmPatchBaseline#approved_patches}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getApprovedPatches() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_compliance_level SsmPatchBaseline#approved_patches_compliance_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApprovedPatchesComplianceLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApprovedPatchesEnableNonSecurity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#description SsmPatchBaseline#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * global_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#global_filter SsmPatchBaseline#global_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGlobalFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#id SsmPatchBaseline#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#operating_system SsmPatchBaseline#operating_system}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperatingSystem() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches SsmPatchBaseline#rejected_patches}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRejectedPatches() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches_action SsmPatchBaseline#rejected_patches_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRejectedPatchesAction() {
        return null;
    }

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#source SsmPatchBaseline#source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags SsmPatchBaseline#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags_all SsmPatchBaseline#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmPatchBaselineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmPatchBaselineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmPatchBaselineConfig> {
        java.lang.String name;
        java.lang.Object approvalRule;
        java.util.List<java.lang.String> approvedPatches;
        java.lang.String approvedPatchesComplianceLevel;
        java.lang.Object approvedPatchesEnableNonSecurity;
        java.lang.String description;
        java.lang.Object globalFilter;
        java.lang.String id;
        java.lang.String operatingSystem;
        java.util.List<java.lang.String> rejectedPatches;
        java.lang.String rejectedPatchesAction;
        java.lang.Object source;
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
         * Sets the value of {@link SsmPatchBaselineConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovalRule}
         * @param approvalRule approval_rule block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approval_rule SsmPatchBaseline#approval_rule}
         * @return {@code this}
         */
        public Builder approvalRule(com.hashicorp.cdktf.IResolvable approvalRule) {
            this.approvalRule = approvalRule;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovalRule}
         * @param approvalRule approval_rule block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approval_rule SsmPatchBaseline#approval_rule}
         * @return {@code this}
         */
        public Builder approvalRule(java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule> approvalRule) {
            this.approvalRule = approvalRule;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovedPatches}
         * @param approvedPatches Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches SsmPatchBaseline#approved_patches}.
         * @return {@code this}
         */
        public Builder approvedPatches(java.util.List<java.lang.String> approvedPatches) {
            this.approvedPatches = approvedPatches;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovedPatchesComplianceLevel}
         * @param approvedPatchesComplianceLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_compliance_level SsmPatchBaseline#approved_patches_compliance_level}.
         * @return {@code this}
         */
        public Builder approvedPatchesComplianceLevel(java.lang.String approvedPatchesComplianceLevel) {
            this.approvedPatchesComplianceLevel = approvedPatchesComplianceLevel;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovedPatchesEnableNonSecurity}
         * @param approvedPatchesEnableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}.
         * @return {@code this}
         */
        public Builder approvedPatchesEnableNonSecurity(java.lang.Boolean approvedPatchesEnableNonSecurity) {
            this.approvedPatchesEnableNonSecurity = approvedPatchesEnableNonSecurity;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getApprovedPatchesEnableNonSecurity}
         * @param approvedPatchesEnableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}.
         * @return {@code this}
         */
        public Builder approvedPatchesEnableNonSecurity(com.hashicorp.cdktf.IResolvable approvedPatchesEnableNonSecurity) {
            this.approvedPatchesEnableNonSecurity = approvedPatchesEnableNonSecurity;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#description SsmPatchBaseline#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getGlobalFilter}
         * @param globalFilter global_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#global_filter SsmPatchBaseline#global_filter}
         * @return {@code this}
         */
        public Builder globalFilter(com.hashicorp.cdktf.IResolvable globalFilter) {
            this.globalFilter = globalFilter;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getGlobalFilter}
         * @param globalFilter global_filter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#global_filter SsmPatchBaseline#global_filter}
         * @return {@code this}
         */
        public Builder globalFilter(java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter> globalFilter) {
            this.globalFilter = globalFilter;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#id SsmPatchBaseline#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getOperatingSystem}
         * @param operatingSystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#operating_system SsmPatchBaseline#operating_system}.
         * @return {@code this}
         */
        public Builder operatingSystem(java.lang.String operatingSystem) {
            this.operatingSystem = operatingSystem;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getRejectedPatches}
         * @param rejectedPatches Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches SsmPatchBaseline#rejected_patches}.
         * @return {@code this}
         */
        public Builder rejectedPatches(java.util.List<java.lang.String> rejectedPatches) {
            this.rejectedPatches = rejectedPatches;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getRejectedPatchesAction}
         * @param rejectedPatchesAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches_action SsmPatchBaseline#rejected_patches_action}.
         * @return {@code this}
         */
        public Builder rejectedPatchesAction(java.lang.String rejectedPatchesAction) {
            this.rejectedPatchesAction = rejectedPatchesAction;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#source SsmPatchBaseline#source}
         * @return {@code this}
         */
        public Builder source(com.hashicorp.cdktf.IResolvable source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#source SsmPatchBaseline#source}
         * @return {@code this}
         */
        public Builder source(java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineSource> source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags SsmPatchBaseline#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags_all SsmPatchBaseline#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getDependsOn}
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
         * Sets the value of {@link SsmPatchBaselineConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineConfig#getProvisioners}
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
         * @return a new instance of {@link SsmPatchBaselineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmPatchBaselineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmPatchBaselineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmPatchBaselineConfig {
        private final java.lang.String name;
        private final java.lang.Object approvalRule;
        private final java.util.List<java.lang.String> approvedPatches;
        private final java.lang.String approvedPatchesComplianceLevel;
        private final java.lang.Object approvedPatchesEnableNonSecurity;
        private final java.lang.String description;
        private final java.lang.Object globalFilter;
        private final java.lang.String id;
        private final java.lang.String operatingSystem;
        private final java.util.List<java.lang.String> rejectedPatches;
        private final java.lang.String rejectedPatchesAction;
        private final java.lang.Object source;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.approvalRule = software.amazon.jsii.Kernel.get(this, "approvalRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.approvedPatches = software.amazon.jsii.Kernel.get(this, "approvedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.approvedPatchesComplianceLevel = software.amazon.jsii.Kernel.get(this, "approvedPatchesComplianceLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.approvedPatchesEnableNonSecurity = software.amazon.jsii.Kernel.get(this, "approvedPatchesEnableNonSecurity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.globalFilter = software.amazon.jsii.Kernel.get(this, "globalFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operatingSystem = software.amazon.jsii.Kernel.get(this, "operatingSystem", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rejectedPatches = software.amazon.jsii.Kernel.get(this, "rejectedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.rejectedPatchesAction = software.amazon.jsii.Kernel.get(this, "rejectedPatchesAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.approvalRule = builder.approvalRule;
            this.approvedPatches = builder.approvedPatches;
            this.approvedPatchesComplianceLevel = builder.approvedPatchesComplianceLevel;
            this.approvedPatchesEnableNonSecurity = builder.approvedPatchesEnableNonSecurity;
            this.description = builder.description;
            this.globalFilter = builder.globalFilter;
            this.id = builder.id;
            this.operatingSystem = builder.operatingSystem;
            this.rejectedPatches = builder.rejectedPatches;
            this.rejectedPatchesAction = builder.rejectedPatchesAction;
            this.source = builder.source;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getApprovalRule() {
            return this.approvalRule;
        }

        @Override
        public final java.util.List<java.lang.String> getApprovedPatches() {
            return this.approvedPatches;
        }

        @Override
        public final java.lang.String getApprovedPatchesComplianceLevel() {
            return this.approvedPatchesComplianceLevel;
        }

        @Override
        public final java.lang.Object getApprovedPatchesEnableNonSecurity() {
            return this.approvedPatchesEnableNonSecurity;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getGlobalFilter() {
            return this.globalFilter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOperatingSystem() {
            return this.operatingSystem;
        }

        @Override
        public final java.util.List<java.lang.String> getRejectedPatches() {
            return this.rejectedPatches;
        }

        @Override
        public final java.lang.String getRejectedPatchesAction() {
            return this.rejectedPatchesAction;
        }

        @Override
        public final java.lang.Object getSource() {
            return this.source;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getApprovalRule() != null) {
                data.set("approvalRule", om.valueToTree(this.getApprovalRule()));
            }
            if (this.getApprovedPatches() != null) {
                data.set("approvedPatches", om.valueToTree(this.getApprovedPatches()));
            }
            if (this.getApprovedPatchesComplianceLevel() != null) {
                data.set("approvedPatchesComplianceLevel", om.valueToTree(this.getApprovedPatchesComplianceLevel()));
            }
            if (this.getApprovedPatchesEnableNonSecurity() != null) {
                data.set("approvedPatchesEnableNonSecurity", om.valueToTree(this.getApprovedPatchesEnableNonSecurity()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getGlobalFilter() != null) {
                data.set("globalFilter", om.valueToTree(this.getGlobalFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOperatingSystem() != null) {
                data.set("operatingSystem", om.valueToTree(this.getOperatingSystem()));
            }
            if (this.getRejectedPatches() != null) {
                data.set("rejectedPatches", om.valueToTree(this.getRejectedPatches()));
            }
            if (this.getRejectedPatchesAction() != null) {
                data.set("rejectedPatchesAction", om.valueToTree(this.getRejectedPatchesAction()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
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
            struct.set("fqn", om.valueToTree("aws.ssmPatchBaseline.SsmPatchBaselineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmPatchBaselineConfig.Jsii$Proxy that = (SsmPatchBaselineConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.approvalRule != null ? !this.approvalRule.equals(that.approvalRule) : that.approvalRule != null) return false;
            if (this.approvedPatches != null ? !this.approvedPatches.equals(that.approvedPatches) : that.approvedPatches != null) return false;
            if (this.approvedPatchesComplianceLevel != null ? !this.approvedPatchesComplianceLevel.equals(that.approvedPatchesComplianceLevel) : that.approvedPatchesComplianceLevel != null) return false;
            if (this.approvedPatchesEnableNonSecurity != null ? !this.approvedPatchesEnableNonSecurity.equals(that.approvedPatchesEnableNonSecurity) : that.approvedPatchesEnableNonSecurity != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.globalFilter != null ? !this.globalFilter.equals(that.globalFilter) : that.globalFilter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.operatingSystem != null ? !this.operatingSystem.equals(that.operatingSystem) : that.operatingSystem != null) return false;
            if (this.rejectedPatches != null ? !this.rejectedPatches.equals(that.rejectedPatches) : that.rejectedPatches != null) return false;
            if (this.rejectedPatchesAction != null ? !this.rejectedPatchesAction.equals(that.rejectedPatchesAction) : that.rejectedPatchesAction != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.approvalRule != null ? this.approvalRule.hashCode() : 0);
            result = 31 * result + (this.approvedPatches != null ? this.approvedPatches.hashCode() : 0);
            result = 31 * result + (this.approvedPatchesComplianceLevel != null ? this.approvedPatchesComplianceLevel.hashCode() : 0);
            result = 31 * result + (this.approvedPatchesEnableNonSecurity != null ? this.approvedPatchesEnableNonSecurity.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.globalFilter != null ? this.globalFilter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.operatingSystem != null ? this.operatingSystem.hashCode() : 0);
            result = 31 * result + (this.rejectedPatches != null ? this.rejectedPatches.hashCode() : 0);
            result = 31 * result + (this.rejectedPatchesAction != null ? this.rejectedPatchesAction.hashCode() : 0);
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
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
