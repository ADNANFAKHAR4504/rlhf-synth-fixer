package imports.aws.ssoadmin_customer_managed_policy_attachment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment aws_ssoadmin_customer_managed_policy_attachment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminCustomerManagedPolicyAttachment.SsoadminCustomerManagedPolicyAttachment")
public class SsoadminCustomerManagedPolicyAttachment extends com.hashicorp.cdktf.TerraformResource {

    protected SsoadminCustomerManagedPolicyAttachment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsoadminCustomerManagedPolicyAttachment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment aws_ssoadmin_customer_managed_policy_attachment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SsoadminCustomerManagedPolicyAttachment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SsoadminCustomerManagedPolicyAttachment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsoadminCustomerManagedPolicyAttachment to import. This parameter is required.
     * @param importFromId The id of the existing SsoadminCustomerManagedPolicyAttachment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SsoadminCustomerManagedPolicyAttachment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SsoadminCustomerManagedPolicyAttachment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SsoadminCustomerManagedPolicyAttachment to import. This parameter is required.
     * @param importFromId The id of the existing SsoadminCustomerManagedPolicyAttachment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCustomerManagedPolicyReference(final @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReference value) {
        software.amazon.jsii.Kernel.call(this, "putCustomerManagedPolicyReference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReferenceOutputReference getCustomerManagedPolicyReference() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedPolicyReference", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReferenceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReference getCustomerManagedPolicyReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedPolicyReferenceInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionSetArnInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionSetArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "instanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceArn", java.util.Objects.requireNonNull(value, "instanceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermissionSetArn() {
        return software.amazon.jsii.Kernel.get(this, "permissionSetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermissionSetArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permissionSetArn", java.util.Objects.requireNonNull(value, "permissionSetArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment> {
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
        private final imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentConfig.Builder();
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
         * customer_managed_policy_reference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#customer_managed_policy_reference SsoadminCustomerManagedPolicyAttachment#customer_managed_policy_reference}
         * <p>
         * @return {@code this}
         * @param customerManagedPolicyReference customer_managed_policy_reference block. This parameter is required.
         */
        public Builder customerManagedPolicyReference(final imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentCustomerManagedPolicyReference customerManagedPolicyReference) {
            this.config.customerManagedPolicyReference(customerManagedPolicyReference);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#instance_arn SsoadminCustomerManagedPolicyAttachment#instance_arn}.
         * <p>
         * @return {@code this}
         * @param instanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#instance_arn SsoadminCustomerManagedPolicyAttachment#instance_arn}. This parameter is required.
         */
        public Builder instanceArn(final java.lang.String instanceArn) {
            this.config.instanceArn(instanceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#permission_set_arn SsoadminCustomerManagedPolicyAttachment#permission_set_arn}.
         * <p>
         * @return {@code this}
         * @param permissionSetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#permission_set_arn SsoadminCustomerManagedPolicyAttachment#permission_set_arn}. This parameter is required.
         */
        public Builder permissionSetArn(final java.lang.String permissionSetArn) {
            this.config.permissionSetArn(permissionSetArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#id SsoadminCustomerManagedPolicyAttachment#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#id SsoadminCustomerManagedPolicyAttachment#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_customer_managed_policy_attachment#timeouts SsoadminCustomerManagedPolicyAttachment#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachmentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment}.
         */
        @Override
        public imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment build() {
            return new imports.aws.ssoadmin_customer_managed_policy_attachment.SsoadminCustomerManagedPolicyAttachment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
