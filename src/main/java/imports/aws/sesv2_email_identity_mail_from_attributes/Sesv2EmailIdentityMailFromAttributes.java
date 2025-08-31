package imports.aws.sesv2_email_identity_mail_from_attributes;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes aws_sesv2_email_identity_mail_from_attributes}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.460Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2EmailIdentityMailFromAttributes.Sesv2EmailIdentityMailFromAttributes")
public class Sesv2EmailIdentityMailFromAttributes extends com.hashicorp.cdktf.TerraformResource {

    protected Sesv2EmailIdentityMailFromAttributes(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2EmailIdentityMailFromAttributes(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes aws_sesv2_email_identity_mail_from_attributes} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Sesv2EmailIdentityMailFromAttributes(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Sesv2EmailIdentityMailFromAttributes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2EmailIdentityMailFromAttributes to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2EmailIdentityMailFromAttributes that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Sesv2EmailIdentityMailFromAttributes to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Sesv2EmailIdentityMailFromAttributes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2EmailIdentityMailFromAttributes to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2EmailIdentityMailFromAttributes that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetBehaviorOnMxFailure() {
        software.amazon.jsii.Kernel.call(this, "resetBehaviorOnMxFailure", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMailFromDomain() {
        software.amazon.jsii.Kernel.call(this, "resetMailFromDomain", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getBehaviorOnMxFailureInput() {
        return software.amazon.jsii.Kernel.get(this, "behaviorOnMxFailureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailIdentityInput() {
        return software.amazon.jsii.Kernel.get(this, "emailIdentityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMailFromDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "mailFromDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBehaviorOnMxFailure() {
        return software.amazon.jsii.Kernel.get(this, "behaviorOnMxFailure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBehaviorOnMxFailure(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "behaviorOnMxFailure", java.util.Objects.requireNonNull(value, "behaviorOnMxFailure is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailIdentity() {
        return software.amazon.jsii.Kernel.get(this, "emailIdentity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailIdentity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailIdentity", java.util.Objects.requireNonNull(value, "emailIdentity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMailFromDomain() {
        return software.amazon.jsii.Kernel.get(this, "mailFromDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMailFromDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mailFromDomain", java.util.Objects.requireNonNull(value, "mailFromDomain is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes> {
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
        private final imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributesConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#email_identity Sesv2EmailIdentityMailFromAttributes#email_identity}.
         * <p>
         * @return {@code this}
         * @param emailIdentity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#email_identity Sesv2EmailIdentityMailFromAttributes#email_identity}. This parameter is required.
         */
        public Builder emailIdentity(final java.lang.String emailIdentity) {
            this.config.emailIdentity(emailIdentity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#behavior_on_mx_failure Sesv2EmailIdentityMailFromAttributes#behavior_on_mx_failure}.
         * <p>
         * @return {@code this}
         * @param behaviorOnMxFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#behavior_on_mx_failure Sesv2EmailIdentityMailFromAttributes#behavior_on_mx_failure}. This parameter is required.
         */
        public Builder behaviorOnMxFailure(final java.lang.String behaviorOnMxFailure) {
            this.config.behaviorOnMxFailure(behaviorOnMxFailure);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#id Sesv2EmailIdentityMailFromAttributes#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#id Sesv2EmailIdentityMailFromAttributes#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#mail_from_domain Sesv2EmailIdentityMailFromAttributes#mail_from_domain}.
         * <p>
         * @return {@code this}
         * @param mailFromDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity_mail_from_attributes#mail_from_domain Sesv2EmailIdentityMailFromAttributes#mail_from_domain}. This parameter is required.
         */
        public Builder mailFromDomain(final java.lang.String mailFromDomain) {
            this.config.mailFromDomain(mailFromDomain);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes}.
         */
        @Override
        public imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes build() {
            return new imports.aws.sesv2_email_identity_mail_from_attributes.Sesv2EmailIdentityMailFromAttributes(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
