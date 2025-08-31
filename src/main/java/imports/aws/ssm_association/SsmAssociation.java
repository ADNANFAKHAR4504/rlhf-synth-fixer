package imports.aws.ssm_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association aws_ssm_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.495Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmAssociation.SsmAssociation")
public class SsmAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected SsmAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ssm_association.SsmAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association aws_ssm_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SsmAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ssm_association.SsmAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SsmAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmAssociation to import. This parameter is required.
     * @param importFromId The id of the existing SsmAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SsmAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_association.SsmAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SsmAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsmAssociation to import. This parameter is required.
     * @param importFromId The id of the existing SsmAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssm_association.SsmAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putOutputLocation(final @org.jetbrains.annotations.NotNull imports.aws.ssm_association.SsmAssociationOutputLocation value) {
        software.amazon.jsii.Kernel.call(this, "putOutputLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargets(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_association.SsmAssociationTargets>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_association.SsmAssociationTargets> __cast_cd4240 = (java.util.List<imports.aws.ssm_association.SsmAssociationTargets>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_association.SsmAssociationTargets __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargets", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplyOnlyAtCronInterval() {
        software.amazon.jsii.Kernel.call(this, "resetApplyOnlyAtCronInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAssociationName() {
        software.amazon.jsii.Kernel.call(this, "resetAssociationName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutomationTargetParameterName() {
        software.amazon.jsii.Kernel.call(this, "resetAutomationTargetParameterName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceSeverity() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceSeverity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceId() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrency() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxErrors() {
        software.amazon.jsii.Kernel.call(this, "resetMaxErrors", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputLocation() {
        software.amazon.jsii.Kernel.call(this, "resetOutputLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleExpression() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSyncCompliance() {
        software.amazon.jsii.Kernel.call(this, "resetSyncCompliance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargets() {
        software.amazon.jsii.Kernel.call(this, "resetTargets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForSuccessTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForSuccessTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "associationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_association.SsmAssociationOutputLocationOutputReference getOutputLocation() {
        return software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_association.SsmAssociationOutputLocationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_association.SsmAssociationTargetsList getTargets() {
        return software.amazon.jsii.Kernel.get(this, "targets", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_association.SsmAssociationTargetsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyOnlyAtCronIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "applyOnlyAtCronIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "associationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutomationTargetParameterNameInput() {
        return software.amazon.jsii.Kernel.get(this, "automationTargetParameterNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComplianceSeverityInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceSeverityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "documentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxConcurrencyInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaxErrorsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxErrorsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_association.SsmAssociationOutputLocation getOutputLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "outputLocationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_association.SsmAssociationOutputLocation.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSyncComplianceInput() {
        return software.amazon.jsii.Kernel.get(this, "syncComplianceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetsInput() {
        return software.amazon.jsii.Kernel.get(this, "targetsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitForSuccessTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForSuccessTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApplyOnlyAtCronInterval() {
        return software.amazon.jsii.Kernel.get(this, "applyOnlyAtCronInterval", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApplyOnlyAtCronInterval(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "applyOnlyAtCronInterval", java.util.Objects.requireNonNull(value, "applyOnlyAtCronInterval is required"));
    }

    public void setApplyOnlyAtCronInterval(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "applyOnlyAtCronInterval", java.util.Objects.requireNonNull(value, "applyOnlyAtCronInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationName() {
        return software.amazon.jsii.Kernel.get(this, "associationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associationName", java.util.Objects.requireNonNull(value, "associationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutomationTargetParameterName() {
        return software.amazon.jsii.Kernel.get(this, "automationTargetParameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutomationTargetParameterName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "automationTargetParameterName", java.util.Objects.requireNonNull(value, "automationTargetParameterName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComplianceSeverity() {
        return software.amazon.jsii.Kernel.get(this, "complianceSeverity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComplianceSeverity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "complianceSeverity", java.util.Objects.requireNonNull(value, "complianceSeverity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentVersion() {
        return software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentVersion", java.util.Objects.requireNonNull(value, "documentVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceId", java.util.Objects.requireNonNull(value, "instanceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxConcurrency() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxConcurrency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrency", java.util.Objects.requireNonNull(value, "maxConcurrency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaxErrors() {
        return software.amazon.jsii.Kernel.get(this, "maxErrors", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaxErrors(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maxErrors", java.util.Objects.requireNonNull(value, "maxErrors is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpression", java.util.Objects.requireNonNull(value, "scheduleExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSyncCompliance() {
        return software.amazon.jsii.Kernel.get(this, "syncCompliance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSyncCompliance(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "syncCompliance", java.util.Objects.requireNonNull(value, "syncCompliance is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitForSuccessTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "waitForSuccessTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitForSuccessTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitForSuccessTimeoutSeconds", java.util.Objects.requireNonNull(value, "waitForSuccessTimeoutSeconds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ssm_association.SsmAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ssm_association.SsmAssociation> {
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
        private final imports.aws.ssm_association.SsmAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ssm_association.SsmAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#name SsmAssociation#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#name SsmAssociation#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}.
         * <p>
         * @return {@code this}
         * @param applyOnlyAtCronInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}. This parameter is required.
         */
        public Builder applyOnlyAtCronInterval(final java.lang.Boolean applyOnlyAtCronInterval) {
            this.config.applyOnlyAtCronInterval(applyOnlyAtCronInterval);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}.
         * <p>
         * @return {@code this}
         * @param applyOnlyAtCronInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#apply_only_at_cron_interval SsmAssociation#apply_only_at_cron_interval}. This parameter is required.
         */
        public Builder applyOnlyAtCronInterval(final com.hashicorp.cdktf.IResolvable applyOnlyAtCronInterval) {
            this.config.applyOnlyAtCronInterval(applyOnlyAtCronInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#association_name SsmAssociation#association_name}.
         * <p>
         * @return {@code this}
         * @param associationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#association_name SsmAssociation#association_name}. This parameter is required.
         */
        public Builder associationName(final java.lang.String associationName) {
            this.config.associationName(associationName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#automation_target_parameter_name SsmAssociation#automation_target_parameter_name}.
         * <p>
         * @return {@code this}
         * @param automationTargetParameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#automation_target_parameter_name SsmAssociation#automation_target_parameter_name}. This parameter is required.
         */
        public Builder automationTargetParameterName(final java.lang.String automationTargetParameterName) {
            this.config.automationTargetParameterName(automationTargetParameterName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#compliance_severity SsmAssociation#compliance_severity}.
         * <p>
         * @return {@code this}
         * @param complianceSeverity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#compliance_severity SsmAssociation#compliance_severity}. This parameter is required.
         */
        public Builder complianceSeverity(final java.lang.String complianceSeverity) {
            this.config.complianceSeverity(complianceSeverity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#document_version SsmAssociation#document_version}.
         * <p>
         * @return {@code this}
         * @param documentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#document_version SsmAssociation#document_version}. This parameter is required.
         */
        public Builder documentVersion(final java.lang.String documentVersion) {
            this.config.documentVersion(documentVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#id SsmAssociation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#id SsmAssociation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#instance_id SsmAssociation#instance_id}.
         * <p>
         * @return {@code this}
         * @param instanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#instance_id SsmAssociation#instance_id}. This parameter is required.
         */
        public Builder instanceId(final java.lang.String instanceId) {
            this.config.instanceId(instanceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_concurrency SsmAssociation#max_concurrency}.
         * <p>
         * @return {@code this}
         * @param maxConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_concurrency SsmAssociation#max_concurrency}. This parameter is required.
         */
        public Builder maxConcurrency(final java.lang.String maxConcurrency) {
            this.config.maxConcurrency(maxConcurrency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_errors SsmAssociation#max_errors}.
         * <p>
         * @return {@code this}
         * @param maxErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#max_errors SsmAssociation#max_errors}. This parameter is required.
         */
        public Builder maxErrors(final java.lang.String maxErrors) {
            this.config.maxErrors(maxErrors);
            return this;
        }

        /**
         * output_location block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#output_location SsmAssociation#output_location}
         * <p>
         * @return {@code this}
         * @param outputLocation output_location block. This parameter is required.
         */
        public Builder outputLocation(final imports.aws.ssm_association.SsmAssociationOutputLocation outputLocation) {
            this.config.outputLocation(outputLocation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#parameters SsmAssociation#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#parameters SsmAssociation#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#schedule_expression SsmAssociation#schedule_expression}.
         * <p>
         * @return {@code this}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#schedule_expression SsmAssociation#schedule_expression}. This parameter is required.
         */
        public Builder scheduleExpression(final java.lang.String scheduleExpression) {
            this.config.scheduleExpression(scheduleExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#sync_compliance SsmAssociation#sync_compliance}.
         * <p>
         * @return {@code this}
         * @param syncCompliance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#sync_compliance SsmAssociation#sync_compliance}. This parameter is required.
         */
        public Builder syncCompliance(final java.lang.String syncCompliance) {
            this.config.syncCompliance(syncCompliance);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags SsmAssociation#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags SsmAssociation#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags_all SsmAssociation#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#tags_all SsmAssociation#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#targets SsmAssociation#targets}
         * <p>
         * @return {@code this}
         * @param targets targets block. This parameter is required.
         */
        public Builder targets(final com.hashicorp.cdktf.IResolvable targets) {
            this.config.targets(targets);
            return this;
        }
        /**
         * targets block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#targets SsmAssociation#targets}
         * <p>
         * @return {@code this}
         * @param targets targets block. This parameter is required.
         */
        public Builder targets(final java.util.List<? extends imports.aws.ssm_association.SsmAssociationTargets> targets) {
            this.config.targets(targets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#wait_for_success_timeout_seconds SsmAssociation#wait_for_success_timeout_seconds}.
         * <p>
         * @return {@code this}
         * @param waitForSuccessTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_association#wait_for_success_timeout_seconds SsmAssociation#wait_for_success_timeout_seconds}. This parameter is required.
         */
        public Builder waitForSuccessTimeoutSeconds(final java.lang.Number waitForSuccessTimeoutSeconds) {
            this.config.waitForSuccessTimeoutSeconds(waitForSuccessTimeoutSeconds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ssm_association.SsmAssociation}.
         */
        @Override
        public imports.aws.ssm_association.SsmAssociation build() {
            return new imports.aws.ssm_association.SsmAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
