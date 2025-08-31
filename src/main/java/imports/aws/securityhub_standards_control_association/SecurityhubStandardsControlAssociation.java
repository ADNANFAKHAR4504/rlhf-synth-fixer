package imports.aws.securityhub_standards_control_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association aws_securityhub_standards_control_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.414Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubStandardsControlAssociation.SecurityhubStandardsControlAssociation")
public class SecurityhubStandardsControlAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected SecurityhubStandardsControlAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubStandardsControlAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association aws_securityhub_standards_control_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SecurityhubStandardsControlAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SecurityhubStandardsControlAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecurityhubStandardsControlAssociation to import. This parameter is required.
     * @param importFromId The id of the existing SecurityhubStandardsControlAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SecurityhubStandardsControlAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SecurityhubStandardsControlAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecurityhubStandardsControlAssociation to import. This parameter is required.
     * @param importFromId The id of the existing SecurityhubStandardsControlAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetUpdatedReason() {
        software.amazon.jsii.Kernel.call(this, "resetUpdatedReason", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociationStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "associationStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityControlIdInput() {
        return software.amazon.jsii.Kernel.get(this, "securityControlIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStandardsArnInput() {
        return software.amazon.jsii.Kernel.get(this, "standardsArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUpdatedReasonInput() {
        return software.amazon.jsii.Kernel.get(this, "updatedReasonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationStatus() {
        return software.amazon.jsii.Kernel.get(this, "associationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociationStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associationStatus", java.util.Objects.requireNonNull(value, "associationStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityControlId() {
        return software.amazon.jsii.Kernel.get(this, "securityControlId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityControlId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityControlId", java.util.Objects.requireNonNull(value, "securityControlId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStandardsArn() {
        return software.amazon.jsii.Kernel.get(this, "standardsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStandardsArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "standardsArn", java.util.Objects.requireNonNull(value, "standardsArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdatedReason() {
        return software.amazon.jsii.Kernel.get(this, "updatedReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUpdatedReason(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "updatedReason", java.util.Objects.requireNonNull(value, "updatedReason is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation> {
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
        private final imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#association_status SecurityhubStandardsControlAssociation#association_status}.
         * <p>
         * @return {@code this}
         * @param associationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#association_status SecurityhubStandardsControlAssociation#association_status}. This parameter is required.
         */
        public Builder associationStatus(final java.lang.String associationStatus) {
            this.config.associationStatus(associationStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#security_control_id SecurityhubStandardsControlAssociation#security_control_id}.
         * <p>
         * @return {@code this}
         * @param securityControlId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#security_control_id SecurityhubStandardsControlAssociation#security_control_id}. This parameter is required.
         */
        public Builder securityControlId(final java.lang.String securityControlId) {
            this.config.securityControlId(securityControlId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#standards_arn SecurityhubStandardsControlAssociation#standards_arn}.
         * <p>
         * @return {@code this}
         * @param standardsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#standards_arn SecurityhubStandardsControlAssociation#standards_arn}. This parameter is required.
         */
        public Builder standardsArn(final java.lang.String standardsArn) {
            this.config.standardsArn(standardsArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#updated_reason SecurityhubStandardsControlAssociation#updated_reason}.
         * <p>
         * @return {@code this}
         * @param updatedReason Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_standards_control_association#updated_reason SecurityhubStandardsControlAssociation#updated_reason}. This parameter is required.
         */
        public Builder updatedReason(final java.lang.String updatedReason) {
            this.config.updatedReason(updatedReason);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation}.
         */
        @Override
        public imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation build() {
            return new imports.aws.securityhub_standards_control_association.SecurityhubStandardsControlAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
