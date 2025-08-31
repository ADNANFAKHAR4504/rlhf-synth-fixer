package imports.aws.sns_sms_preferences;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences aws_sns_sms_preferences}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.475Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsSmsPreferences.SnsSmsPreferences")
public class SnsSmsPreferences extends com.hashicorp.cdktf.TerraformResource {

    protected SnsSmsPreferences(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SnsSmsPreferences(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sns_sms_preferences.SnsSmsPreferences.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences aws_sns_sms_preferences} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public SnsSmsPreferences(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.sns_sms_preferences.SnsSmsPreferencesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences aws_sns_sms_preferences} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public SnsSmsPreferences(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a SnsSmsPreferences resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsSmsPreferences to import. This parameter is required.
     * @param importFromId The id of the existing SnsSmsPreferences that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SnsSmsPreferences to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_sms_preferences.SnsSmsPreferences.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SnsSmsPreferences resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsSmsPreferences to import. This parameter is required.
     * @param importFromId The id of the existing SnsSmsPreferences that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_sms_preferences.SnsSmsPreferences.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetDefaultSenderId() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultSenderId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultSmsType() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultSmsType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeliveryStatusIamRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryStatusIamRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeliveryStatusSuccessSamplingRate() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryStatusSuccessSamplingRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonthlySpendLimit() {
        software.amazon.jsii.Kernel.call(this, "resetMonthlySpendLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsageReportS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetUsageReportS3Bucket", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSenderIdInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSenderIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSmsTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSmsTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStatusIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStatusIamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStatusSuccessSamplingRateInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStatusSuccessSamplingRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMonthlySpendLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "monthlySpendLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsageReportS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "usageReportS3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSenderId() {
        return software.amazon.jsii.Kernel.get(this, "defaultSenderId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSenderId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSenderId", java.util.Objects.requireNonNull(value, "defaultSenderId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSmsType() {
        return software.amazon.jsii.Kernel.get(this, "defaultSmsType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSmsType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSmsType", java.util.Objects.requireNonNull(value, "defaultSmsType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStatusIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStatusIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryStatusIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryStatusIamRoleArn", java.util.Objects.requireNonNull(value, "deliveryStatusIamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStatusSuccessSamplingRate() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStatusSuccessSamplingRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryStatusSuccessSamplingRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryStatusSuccessSamplingRate", java.util.Objects.requireNonNull(value, "deliveryStatusSuccessSamplingRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMonthlySpendLimit() {
        return software.amazon.jsii.Kernel.get(this, "monthlySpendLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMonthlySpendLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "monthlySpendLimit", java.util.Objects.requireNonNull(value, "monthlySpendLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsageReportS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "usageReportS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsageReportS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usageReportS3Bucket", java.util.Objects.requireNonNull(value, "usageReportS3Bucket is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sns_sms_preferences.SnsSmsPreferences}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sns_sms_preferences.SnsSmsPreferences> {
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
        private imports.aws.sns_sms_preferences.SnsSmsPreferencesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sender_id SnsSmsPreferences#default_sender_id}.
         * <p>
         * @return {@code this}
         * @param defaultSenderId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sender_id SnsSmsPreferences#default_sender_id}. This parameter is required.
         */
        public Builder defaultSenderId(final java.lang.String defaultSenderId) {
            this.config().defaultSenderId(defaultSenderId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sms_type SnsSmsPreferences#default_sms_type}.
         * <p>
         * @return {@code this}
         * @param defaultSmsType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sms_type SnsSmsPreferences#default_sms_type}. This parameter is required.
         */
        public Builder defaultSmsType(final java.lang.String defaultSmsType) {
            this.config().defaultSmsType(defaultSmsType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_iam_role_arn SnsSmsPreferences#delivery_status_iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param deliveryStatusIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_iam_role_arn SnsSmsPreferences#delivery_status_iam_role_arn}. This parameter is required.
         */
        public Builder deliveryStatusIamRoleArn(final java.lang.String deliveryStatusIamRoleArn) {
            this.config().deliveryStatusIamRoleArn(deliveryStatusIamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_success_sampling_rate SnsSmsPreferences#delivery_status_success_sampling_rate}.
         * <p>
         * @return {@code this}
         * @param deliveryStatusSuccessSamplingRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_success_sampling_rate SnsSmsPreferences#delivery_status_success_sampling_rate}. This parameter is required.
         */
        public Builder deliveryStatusSuccessSamplingRate(final java.lang.String deliveryStatusSuccessSamplingRate) {
            this.config().deliveryStatusSuccessSamplingRate(deliveryStatusSuccessSamplingRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#id SnsSmsPreferences#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#id SnsSmsPreferences#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#monthly_spend_limit SnsSmsPreferences#monthly_spend_limit}.
         * <p>
         * @return {@code this}
         * @param monthlySpendLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#monthly_spend_limit SnsSmsPreferences#monthly_spend_limit}. This parameter is required.
         */
        public Builder monthlySpendLimit(final java.lang.Number monthlySpendLimit) {
            this.config().monthlySpendLimit(monthlySpendLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#usage_report_s3_bucket SnsSmsPreferences#usage_report_s3_bucket}.
         * <p>
         * @return {@code this}
         * @param usageReportS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#usage_report_s3_bucket SnsSmsPreferences#usage_report_s3_bucket}. This parameter is required.
         */
        public Builder usageReportS3Bucket(final java.lang.String usageReportS3Bucket) {
            this.config().usageReportS3Bucket(usageReportS3Bucket);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sns_sms_preferences.SnsSmsPreferences}.
         */
        @Override
        public imports.aws.sns_sms_preferences.SnsSmsPreferences build() {
            return new imports.aws.sns_sms_preferences.SnsSmsPreferences(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.sns_sms_preferences.SnsSmsPreferencesConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.sns_sms_preferences.SnsSmsPreferencesConfig.Builder();
            }
            return this.config;
        }
    }
}
