package imports.aws.emr_studio_session_mapping;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping aws_emr_studio_session_mapping}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrStudioSessionMapping.EmrStudioSessionMapping")
public class EmrStudioSessionMapping extends com.hashicorp.cdktf.TerraformResource {

    protected EmrStudioSessionMapping(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrStudioSessionMapping(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping aws_emr_studio_session_mapping} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EmrStudioSessionMapping(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.emr_studio_session_mapping.EmrStudioSessionMappingConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EmrStudioSessionMapping resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrStudioSessionMapping to import. This parameter is required.
     * @param importFromId The id of the existing EmrStudioSessionMapping that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EmrStudioSessionMapping to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EmrStudioSessionMapping resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrStudioSessionMapping to import. This parameter is required.
     * @param importFromId The id of the existing EmrStudioSessionMapping that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityId() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityName() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityName", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityNameInput() {
        return software.amazon.jsii.Kernel.get(this, "identityNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "identityTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSessionPolicyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionPolicyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStudioIdInput() {
        return software.amazon.jsii.Kernel.get(this, "studioIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityId() {
        return software.amazon.jsii.Kernel.get(this, "identityId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityId", java.util.Objects.requireNonNull(value, "identityId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityName() {
        return software.amazon.jsii.Kernel.get(this, "identityName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityName", java.util.Objects.requireNonNull(value, "identityName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityType() {
        return software.amazon.jsii.Kernel.get(this, "identityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityType", java.util.Objects.requireNonNull(value, "identityType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSessionPolicyArn() {
        return software.amazon.jsii.Kernel.get(this, "sessionPolicyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSessionPolicyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sessionPolicyArn", java.util.Objects.requireNonNull(value, "sessionPolicyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStudioId() {
        return software.amazon.jsii.Kernel.get(this, "studioId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStudioId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "studioId", java.util.Objects.requireNonNull(value, "studioId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping> {
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
        private final imports.aws.emr_studio_session_mapping.EmrStudioSessionMappingConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.emr_studio_session_mapping.EmrStudioSessionMappingConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_type EmrStudioSessionMapping#identity_type}.
         * <p>
         * @return {@code this}
         * @param identityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_type EmrStudioSessionMapping#identity_type}. This parameter is required.
         */
        public Builder identityType(final java.lang.String identityType) {
            this.config.identityType(identityType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#session_policy_arn EmrStudioSessionMapping#session_policy_arn}.
         * <p>
         * @return {@code this}
         * @param sessionPolicyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#session_policy_arn EmrStudioSessionMapping#session_policy_arn}. This parameter is required.
         */
        public Builder sessionPolicyArn(final java.lang.String sessionPolicyArn) {
            this.config.sessionPolicyArn(sessionPolicyArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#studio_id EmrStudioSessionMapping#studio_id}.
         * <p>
         * @return {@code this}
         * @param studioId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#studio_id EmrStudioSessionMapping#studio_id}. This parameter is required.
         */
        public Builder studioId(final java.lang.String studioId) {
            this.config.studioId(studioId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#id EmrStudioSessionMapping#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#id EmrStudioSessionMapping#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_id EmrStudioSessionMapping#identity_id}.
         * <p>
         * @return {@code this}
         * @param identityId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_id EmrStudioSessionMapping#identity_id}. This parameter is required.
         */
        public Builder identityId(final java.lang.String identityId) {
            this.config.identityId(identityId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_name EmrStudioSessionMapping#identity_name}.
         * <p>
         * @return {@code this}
         * @param identityName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_studio_session_mapping#identity_name EmrStudioSessionMapping#identity_name}. This parameter is required.
         */
        public Builder identityName(final java.lang.String identityName) {
            this.config.identityName(identityName);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping}.
         */
        @Override
        public imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping build() {
            return new imports.aws.emr_studio_session_mapping.EmrStudioSessionMapping(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
