package imports.aws.ses_receipt_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule aws_ses_receipt_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.449Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRule")
public class SesReceiptRule extends com.hashicorp.cdktf.TerraformResource {

    protected SesReceiptRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesReceiptRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ses_receipt_rule.SesReceiptRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule aws_ses_receipt_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SesReceiptRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SesReceiptRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesReceiptRule to import. This parameter is required.
     * @param importFromId The id of the existing SesReceiptRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SesReceiptRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_receipt_rule.SesReceiptRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SesReceiptRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesReceiptRule to import. This parameter is required.
     * @param importFromId The id of the existing SesReceiptRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_receipt_rule.SesReceiptRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAddHeaderAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAddHeaderAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBounceAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBounceAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Action(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleS3Action>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleS3Action> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleS3Action>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleS3Action __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putS3Action", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnsAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSnsAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStopAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleStopAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleStopAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleStopAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleStopAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStopAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkmailAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction> __cast_cd4240 = (java.util.List<imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWorkmailAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAddHeaderAction() {
        software.amazon.jsii.Kernel.call(this, "resetAddHeaderAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAfter() {
        software.amazon.jsii.Kernel.call(this, "resetAfter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBounceAction() {
        software.amazon.jsii.Kernel.call(this, "resetBounceAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaAction() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecipients() {
        software.amazon.jsii.Kernel.call(this, "resetRecipients", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Action() {
        software.amazon.jsii.Kernel.call(this, "resetS3Action", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScanEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetScanEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsAction() {
        software.amazon.jsii.Kernel.call(this, "resetSnsAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStopAction() {
        software.amazon.jsii.Kernel.call(this, "resetStopAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetTlsPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkmailAction() {
        software.amazon.jsii.Kernel.call(this, "resetWorkmailAction", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderActionList getAddHeaderAction() {
        return software.amazon.jsii.Kernel.get(this, "addHeaderAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderActionList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleBounceActionList getBounceAction() {
        return software.amazon.jsii.Kernel.get(this, "bounceAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleBounceActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleLambdaActionList getLambdaAction() {
        return software.amazon.jsii.Kernel.get(this, "lambdaAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleLambdaActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleS3ActionList getS3Action() {
        return software.amazon.jsii.Kernel.get(this, "s3Action", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleS3ActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleSnsActionList getSnsAction() {
        return software.amazon.jsii.Kernel.get(this, "snsAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleSnsActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleStopActionList getStopAction() {
        return software.amazon.jsii.Kernel.get(this, "stopAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleStopActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailActionList getWorkmailAction() {
        return software.amazon.jsii.Kernel.get(this, "workmailAction", software.amazon.jsii.NativeType.forClass(imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailActionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAddHeaderActionInput() {
        return software.amazon.jsii.Kernel.get(this, "addHeaderActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAfterInput() {
        return software.amazon.jsii.Kernel.get(this, "afterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBounceActionInput() {
        return software.amazon.jsii.Kernel.get(this, "bounceActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaActionInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecipientsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "recipientsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getS3ActionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScanEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "scanEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSnsActionInput() {
        return software.amazon.jsii.Kernel.get(this, "snsActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStopActionInput() {
        return software.amazon.jsii.Kernel.get(this, "stopActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWorkmailActionInput() {
        return software.amazon.jsii.Kernel.get(this, "workmailActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAfter() {
        return software.amazon.jsii.Kernel.get(this, "after", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAfter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "after", java.util.Objects.requireNonNull(value, "after is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRecipients() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "recipients", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRecipients(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "recipients", java.util.Objects.requireNonNull(value, "recipients is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleSetName() {
        return software.amazon.jsii.Kernel.get(this, "ruleSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleSetName", java.util.Objects.requireNonNull(value, "ruleSetName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getScanEnabled() {
        return software.amazon.jsii.Kernel.get(this, "scanEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setScanEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "scanEnabled", java.util.Objects.requireNonNull(value, "scanEnabled is required"));
    }

    public void setScanEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "scanEnabled", java.util.Objects.requireNonNull(value, "scanEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsPolicy", java.util.Objects.requireNonNull(value, "tlsPolicy is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ses_receipt_rule.SesReceiptRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ses_receipt_rule.SesReceiptRule> {
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
        private final imports.aws.ses_receipt_rule.SesReceiptRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ses_receipt_rule.SesReceiptRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#name SesReceiptRule#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#name SesReceiptRule#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#rule_set_name SesReceiptRule#rule_set_name}.
         * <p>
         * @return {@code this}
         * @param ruleSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#rule_set_name SesReceiptRule#rule_set_name}. This parameter is required.
         */
        public Builder ruleSetName(final java.lang.String ruleSetName) {
            this.config.ruleSetName(ruleSetName);
            return this;
        }

        /**
         * add_header_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#add_header_action SesReceiptRule#add_header_action}
         * <p>
         * @return {@code this}
         * @param addHeaderAction add_header_action block. This parameter is required.
         */
        public Builder addHeaderAction(final com.hashicorp.cdktf.IResolvable addHeaderAction) {
            this.config.addHeaderAction(addHeaderAction);
            return this;
        }
        /**
         * add_header_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#add_header_action SesReceiptRule#add_header_action}
         * <p>
         * @return {@code this}
         * @param addHeaderAction add_header_action block. This parameter is required.
         */
        public Builder addHeaderAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction> addHeaderAction) {
            this.config.addHeaderAction(addHeaderAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#after SesReceiptRule#after}.
         * <p>
         * @return {@code this}
         * @param after Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#after SesReceiptRule#after}. This parameter is required.
         */
        public Builder after(final java.lang.String after) {
            this.config.after(after);
            return this;
        }

        /**
         * bounce_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bounce_action SesReceiptRule#bounce_action}
         * <p>
         * @return {@code this}
         * @param bounceAction bounce_action block. This parameter is required.
         */
        public Builder bounceAction(final com.hashicorp.cdktf.IResolvable bounceAction) {
            this.config.bounceAction(bounceAction);
            return this;
        }
        /**
         * bounce_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bounce_action SesReceiptRule#bounce_action}
         * <p>
         * @return {@code this}
         * @param bounceAction bounce_action block. This parameter is required.
         */
        public Builder bounceAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction> bounceAction) {
            this.config.bounceAction(bounceAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#id SesReceiptRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#id SesReceiptRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * lambda_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#lambda_action SesReceiptRule#lambda_action}
         * <p>
         * @return {@code this}
         * @param lambdaAction lambda_action block. This parameter is required.
         */
        public Builder lambdaAction(final com.hashicorp.cdktf.IResolvable lambdaAction) {
            this.config.lambdaAction(lambdaAction);
            return this;
        }
        /**
         * lambda_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#lambda_action SesReceiptRule#lambda_action}
         * <p>
         * @return {@code this}
         * @param lambdaAction lambda_action block. This parameter is required.
         */
        public Builder lambdaAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction> lambdaAction) {
            this.config.lambdaAction(lambdaAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#recipients SesReceiptRule#recipients}.
         * <p>
         * @return {@code this}
         * @param recipients Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#recipients SesReceiptRule#recipients}. This parameter is required.
         */
        public Builder recipients(final java.util.List<java.lang.String> recipients) {
            this.config.recipients(recipients);
            return this;
        }

        /**
         * s3_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#s3_action SesReceiptRule#s3_action}
         * <p>
         * @return {@code this}
         * @param s3Action s3_action block. This parameter is required.
         */
        public Builder s3Action(final com.hashicorp.cdktf.IResolvable s3Action) {
            this.config.s3Action(s3Action);
            return this;
        }
        /**
         * s3_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#s3_action SesReceiptRule#s3_action}
         * <p>
         * @return {@code this}
         * @param s3Action s3_action block. This parameter is required.
         */
        public Builder s3Action(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleS3Action> s3Action) {
            this.config.s3Action(s3Action);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}.
         * <p>
         * @return {@code this}
         * @param scanEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}. This parameter is required.
         */
        public Builder scanEnabled(final java.lang.Boolean scanEnabled) {
            this.config.scanEnabled(scanEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}.
         * <p>
         * @return {@code this}
         * @param scanEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}. This parameter is required.
         */
        public Builder scanEnabled(final com.hashicorp.cdktf.IResolvable scanEnabled) {
            this.config.scanEnabled(scanEnabled);
            return this;
        }

        /**
         * sns_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sns_action SesReceiptRule#sns_action}
         * <p>
         * @return {@code this}
         * @param snsAction sns_action block. This parameter is required.
         */
        public Builder snsAction(final com.hashicorp.cdktf.IResolvable snsAction) {
            this.config.snsAction(snsAction);
            return this;
        }
        /**
         * sns_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sns_action SesReceiptRule#sns_action}
         * <p>
         * @return {@code this}
         * @param snsAction sns_action block. This parameter is required.
         */
        public Builder snsAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction> snsAction) {
            this.config.snsAction(snsAction);
            return this;
        }

        /**
         * stop_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#stop_action SesReceiptRule#stop_action}
         * <p>
         * @return {@code this}
         * @param stopAction stop_action block. This parameter is required.
         */
        public Builder stopAction(final com.hashicorp.cdktf.IResolvable stopAction) {
            this.config.stopAction(stopAction);
            return this;
        }
        /**
         * stop_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#stop_action SesReceiptRule#stop_action}
         * <p>
         * @return {@code this}
         * @param stopAction stop_action block. This parameter is required.
         */
        public Builder stopAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleStopAction> stopAction) {
            this.config.stopAction(stopAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#tls_policy SesReceiptRule#tls_policy}.
         * <p>
         * @return {@code this}
         * @param tlsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#tls_policy SesReceiptRule#tls_policy}. This parameter is required.
         */
        public Builder tlsPolicy(final java.lang.String tlsPolicy) {
            this.config.tlsPolicy(tlsPolicy);
            return this;
        }

        /**
         * workmail_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#workmail_action SesReceiptRule#workmail_action}
         * <p>
         * @return {@code this}
         * @param workmailAction workmail_action block. This parameter is required.
         */
        public Builder workmailAction(final com.hashicorp.cdktf.IResolvable workmailAction) {
            this.config.workmailAction(workmailAction);
            return this;
        }
        /**
         * workmail_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#workmail_action SesReceiptRule#workmail_action}
         * <p>
         * @return {@code this}
         * @param workmailAction workmail_action block. This parameter is required.
         */
        public Builder workmailAction(final java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction> workmailAction) {
            this.config.workmailAction(workmailAction);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ses_receipt_rule.SesReceiptRule}.
         */
        @Override
        public imports.aws.ses_receipt_rule.SesReceiptRule build() {
            return new imports.aws.ses_receipt_rule.SesReceiptRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
