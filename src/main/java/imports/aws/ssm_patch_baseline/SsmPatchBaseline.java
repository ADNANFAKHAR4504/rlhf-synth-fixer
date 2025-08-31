package imports.aws.ssm_patch_baseline;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline aws_ssm_patch_baseline}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmPatchBaseline.SsmPatchBaseline")
public class SsmPatchBaseline extends com.hashicorp.cdktf.TerraformResource {

    protected SsmPatchBaseline(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmPatchBaseline(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ssm_patch_baseline.SsmPatchBaseline.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline aws_ssm_patch_baseline} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SsmPatchBaseline(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ssm_patch_baseline.SsmPatchBaselineConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SsmPatchBaseline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmPatchBaseline to import. This parameter is required.
     * @param importFromId The id of the existing SsmPatchBaseline that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SsmPatchBaseline to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_patch_baseline.SsmPatchBaseline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SsmPatchBaseline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmPatchBaseline to import. This parameter is required.
     * @param importFromId The id of the existing SsmPatchBaseline that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_patch_baseline.SsmPatchBaseline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putApprovalRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule> __cast_cd4240 = (java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putApprovalRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGlobalFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter> __cast_cd4240 = (java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGlobalFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineSource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineSource> __cast_cd4240 = (java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineSource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_patch_baseline.SsmPatchBaselineSource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApprovalRule() {
        software.amazon.jsii.Kernel.call(this, "resetApprovalRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApprovedPatches() {
        software.amazon.jsii.Kernel.call(this, "resetApprovedPatches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApprovedPatchesComplianceLevel() {
        software.amazon.jsii.Kernel.call(this, "resetApprovedPatchesComplianceLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApprovedPatchesEnableNonSecurity() {
        software.amazon.jsii.Kernel.call(this, "resetApprovedPatchesEnableNonSecurity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalFilter() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperatingSystem() {
        software.amazon.jsii.Kernel.call(this, "resetOperatingSystem", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRejectedPatches() {
        software.amazon.jsii.Kernel.call(this, "resetRejectedPatches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRejectedPatchesAction() {
        software.amazon.jsii.Kernel.call(this, "resetRejectedPatchesAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSource() {
        software.amazon.jsii.Kernel.call(this, "resetSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRuleList getApprovalRule() {
        return software.amazon.jsii.Kernel.get(this, "approvalRule", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilterList getGlobalFilter() {
        return software.amazon.jsii.Kernel.get(this, "globalFilter", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJson() {
        return software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_patch_baseline.SsmPatchBaselineSourceList getSource() {
        return software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_patch_baseline.SsmPatchBaselineSourceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApprovalRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "approvalRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApprovedPatchesComplianceLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesComplianceLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApprovedPatchesEnableNonSecurityInput() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesEnableNonSecurityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getApprovedPatchesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "approvedPatchesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGlobalFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "globalFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperatingSystemInput() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystemInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRejectedPatchesActionInput() {
        return software.amazon.jsii.Kernel.get(this, "rejectedPatchesActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRejectedPatchesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "rejectedPatchesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getApprovedPatches() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "approvedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setApprovedPatches(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "approvedPatches", java.util.Objects.requireNonNull(value, "approvedPatches is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApprovedPatchesComplianceLevel() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesComplianceLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApprovedPatchesComplianceLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "approvedPatchesComplianceLevel", java.util.Objects.requireNonNull(value, "approvedPatchesComplianceLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApprovedPatchesEnableNonSecurity() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesEnableNonSecurity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApprovedPatchesEnableNonSecurity(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "approvedPatchesEnableNonSecurity", java.util.Objects.requireNonNull(value, "approvedPatchesEnableNonSecurity is required"));
    }

    public void setApprovedPatchesEnableNonSecurity(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "approvedPatchesEnableNonSecurity", java.util.Objects.requireNonNull(value, "approvedPatchesEnableNonSecurity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperatingSystem() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystem", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperatingSystem(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operatingSystem", java.util.Objects.requireNonNull(value, "operatingSystem is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRejectedPatches() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "rejectedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRejectedPatches(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "rejectedPatches", java.util.Objects.requireNonNull(value, "rejectedPatches is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRejectedPatchesAction() {
        return software.amazon.jsii.Kernel.get(this, "rejectedPatchesAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRejectedPatchesAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rejectedPatchesAction", java.util.Objects.requireNonNull(value, "rejectedPatchesAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ssm_patch_baseline.SsmPatchBaseline}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ssm_patch_baseline.SsmPatchBaseline> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.ssm_patch_baseline.SsmPatchBaselineConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ssm_patch_baseline.SsmPatchBaselineConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * approval_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approval_rule SsmPatchBaseline#approval_rule}
         * <p>
         * @return {@code this}
         * @param approvalRule approval_rule block. This parameter is required.
         */
        public Builder approvalRule(final com.hashicorp.cdktf.IResolvable approvalRule) {
            this.config.approvalRule(approvalRule);
            return this;
        }
        /**
         * approval_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approval_rule SsmPatchBaseline#approval_rule}
         * <p>
         * @return {@code this}
         * @param approvalRule approval_rule block. This parameter is required.
         */
        public Builder approvalRule(final java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule> approvalRule) {
            this.config.approvalRule(approvalRule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches SsmPatchBaseline#approved_patches}.
         * <p>
         * @return {@code this}
         * @param approvedPatches Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches SsmPatchBaseline#approved_patches}. This parameter is required.
         */
        public Builder approvedPatches(final java.util.List<java.lang.String> approvedPatches) {
            this.config.approvedPatches(approvedPatches);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_compliance_level SsmPatchBaseline#approved_patches_compliance_level}.
         * <p>
         * @return {@code this}
         * @param approvedPatchesComplianceLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_compliance_level SsmPatchBaseline#approved_patches_compliance_level}. This parameter is required.
         */
        public Builder approvedPatchesComplianceLevel(final java.lang.String approvedPatchesComplianceLevel) {
            this.config.approvedPatchesComplianceLevel(approvedPatchesComplianceLevel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}.
         * <p>
         * @return {@code this}
         * @param approvedPatchesEnableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}. This parameter is required.
         */
        public Builder approvedPatchesEnableNonSecurity(final java.lang.Boolean approvedPatchesEnableNonSecurity) {
            this.config.approvedPatchesEnableNonSecurity(approvedPatchesEnableNonSecurity);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}.
         * <p>
         * @return {@code this}
         * @param approvedPatchesEnableNonSecurity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#approved_patches_enable_non_security SsmPatchBaseline#approved_patches_enable_non_security}. This parameter is required.
         */
        public Builder approvedPatchesEnableNonSecurity(final com.hashicorp.cdktf.IResolvable approvedPatchesEnableNonSecurity) {
            this.config.approvedPatchesEnableNonSecurity(approvedPatchesEnableNonSecurity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#description SsmPatchBaseline#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#description SsmPatchBaseline#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * global_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#global_filter SsmPatchBaseline#global_filter}
         * <p>
         * @return {@code this}
         * @param globalFilter global_filter block. This parameter is required.
         */
        public Builder globalFilter(final com.hashicorp.cdktf.IResolvable globalFilter) {
            this.config.globalFilter(globalFilter);
            return this;
        }
        /**
         * global_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#global_filter SsmPatchBaseline#global_filter}
         * <p>
         * @return {@code this}
         * @param globalFilter global_filter block. This parameter is required.
         */
        public Builder globalFilter(final java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineGlobalFilter> globalFilter) {
            this.config.globalFilter(globalFilter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#id SsmPatchBaseline#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#id SsmPatchBaseline#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#operating_system SsmPatchBaseline#operating_system}.
         * <p>
         * @return {@code this}
         * @param operatingSystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#operating_system SsmPatchBaseline#operating_system}. This parameter is required.
         */
        public Builder operatingSystem(final java.lang.String operatingSystem) {
            this.config.operatingSystem(operatingSystem);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches SsmPatchBaseline#rejected_patches}.
         * <p>
         * @return {@code this}
         * @param rejectedPatches Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches SsmPatchBaseline#rejected_patches}. This parameter is required.
         */
        public Builder rejectedPatches(final java.util.List<java.lang.String> rejectedPatches) {
            this.config.rejectedPatches(rejectedPatches);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches_action SsmPatchBaseline#rejected_patches_action}.
         * <p>
         * @return {@code this}
         * @param rejectedPatchesAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#rejected_patches_action SsmPatchBaseline#rejected_patches_action}. This parameter is required.
         */
        public Builder rejectedPatchesAction(final java.lang.String rejectedPatchesAction) {
            this.config.rejectedPatchesAction(rejectedPatchesAction);
            return this;
        }

        /**
         * source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#source SsmPatchBaseline#source}
         * <p>
         * @return {@code this}
         * @param source source block. This parameter is required.
         */
        public Builder source(final com.hashicorp.cdktf.IResolvable source) {
            this.config.source(source);
            return this;
        }
        /**
         * source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#source SsmPatchBaseline#source}
         * <p>
         * @return {@code this}
         * @param source source block. This parameter is required.
         */
        public Builder source(final java.util.List<? extends imports.aws.ssm_patch_baseline.SsmPatchBaselineSource> source) {
            this.config.source(source);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags SsmPatchBaseline#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags SsmPatchBaseline#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags_all SsmPatchBaseline#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#tags_all SsmPatchBaseline#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ssm_patch_baseline.SsmPatchBaseline}.
         */
        @Override
        public imports.aws.ssm_patch_baseline.SsmPatchBaseline build() {
            return new imports.aws.ssm_patch_baseline.SsmPatchBaseline(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
