package imports.aws.kms_grant;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant aws_kms_grant}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsGrant.KmsGrant")
public class KmsGrant extends com.hashicorp.cdktf.TerraformResource {

    protected KmsGrant(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KmsGrant(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.kms_grant.KmsGrant.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant aws_kms_grant} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public KmsGrant(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.kms_grant.KmsGrantConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a KmsGrant resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsGrant to import. This parameter is required.
     * @param importFromId The id of the existing KmsGrant that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the KmsGrant to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_grant.KmsGrant.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a KmsGrant resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsGrant to import. This parameter is required.
     * @param importFromId The id of the existing KmsGrant that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_grant.KmsGrant.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putConstraints(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kms_grant.KmsGrantConstraints>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kms_grant.KmsGrantConstraints> __cast_cd4240 = (java.util.List<imports.aws.kms_grant.KmsGrantConstraints>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kms_grant.KmsGrantConstraints __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConstraints", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConstraints() {
        software.amazon.jsii.Kernel.call(this, "resetConstraints", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrantCreationTokens() {
        software.amazon.jsii.Kernel.call(this, "resetGrantCreationTokens", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetireOnDelete() {
        software.amazon.jsii.Kernel.call(this, "resetRetireOnDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetiringPrincipal() {
        software.amazon.jsii.Kernel.call(this, "resetRetiringPrincipal", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.kms_grant.KmsGrantConstraintsList getConstraints() {
        return software.amazon.jsii.Kernel.get(this, "constraints", software.amazon.jsii.NativeType.forClass(imports.aws.kms_grant.KmsGrantConstraintsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrantId() {
        return software.amazon.jsii.Kernel.get(this, "grantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrantToken() {
        return software.amazon.jsii.Kernel.get(this, "grantToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConstraintsInput() {
        return software.amazon.jsii.Kernel.get(this, "constraintsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGrantCreationTokensInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "grantCreationTokensInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGranteePrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "granteePrincipalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "keyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOperationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "operationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetireOnDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "retireOnDeleteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRetiringPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "retiringPrincipalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGrantCreationTokens() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "grantCreationTokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGrantCreationTokens(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "grantCreationTokens", java.util.Objects.requireNonNull(value, "grantCreationTokens is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGranteePrincipal() {
        return software.amazon.jsii.Kernel.get(this, "granteePrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGranteePrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "granteePrincipal", java.util.Objects.requireNonNull(value, "granteePrincipal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyId() {
        return software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyId", java.util.Objects.requireNonNull(value, "keyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOperations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "operations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOperations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "operations", java.util.Objects.requireNonNull(value, "operations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRetireOnDelete() {
        return software.amazon.jsii.Kernel.get(this, "retireOnDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRetireOnDelete(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "retireOnDelete", java.util.Objects.requireNonNull(value, "retireOnDelete is required"));
    }

    public void setRetireOnDelete(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "retireOnDelete", java.util.Objects.requireNonNull(value, "retireOnDelete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRetiringPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "retiringPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRetiringPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "retiringPrincipal", java.util.Objects.requireNonNull(value, "retiringPrincipal is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.kms_grant.KmsGrant}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.kms_grant.KmsGrant> {
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
        private final imports.aws.kms_grant.KmsGrantConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.kms_grant.KmsGrantConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grantee_principal KmsGrant#grantee_principal}.
         * <p>
         * @return {@code this}
         * @param granteePrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grantee_principal KmsGrant#grantee_principal}. This parameter is required.
         */
        public Builder granteePrincipal(final java.lang.String granteePrincipal) {
            this.config.granteePrincipal(granteePrincipal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#key_id KmsGrant#key_id}.
         * <p>
         * @return {@code this}
         * @param keyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#key_id KmsGrant#key_id}. This parameter is required.
         */
        public Builder keyId(final java.lang.String keyId) {
            this.config.keyId(keyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#operations KmsGrant#operations}.
         * <p>
         * @return {@code this}
         * @param operations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#operations KmsGrant#operations}. This parameter is required.
         */
        public Builder operations(final java.util.List<java.lang.String> operations) {
            this.config.operations(operations);
            return this;
        }

        /**
         * constraints block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#constraints KmsGrant#constraints}
         * <p>
         * @return {@code this}
         * @param constraints constraints block. This parameter is required.
         */
        public Builder constraints(final com.hashicorp.cdktf.IResolvable constraints) {
            this.config.constraints(constraints);
            return this;
        }
        /**
         * constraints block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#constraints KmsGrant#constraints}
         * <p>
         * @return {@code this}
         * @param constraints constraints block. This parameter is required.
         */
        public Builder constraints(final java.util.List<? extends imports.aws.kms_grant.KmsGrantConstraints> constraints) {
            this.config.constraints(constraints);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grant_creation_tokens KmsGrant#grant_creation_tokens}.
         * <p>
         * @return {@code this}
         * @param grantCreationTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grant_creation_tokens KmsGrant#grant_creation_tokens}. This parameter is required.
         */
        public Builder grantCreationTokens(final java.util.List<java.lang.String> grantCreationTokens) {
            this.config.grantCreationTokens(grantCreationTokens);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#id KmsGrant#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#id KmsGrant#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#name KmsGrant#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#name KmsGrant#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}.
         * <p>
         * @return {@code this}
         * @param retireOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}. This parameter is required.
         */
        public Builder retireOnDelete(final java.lang.Boolean retireOnDelete) {
            this.config.retireOnDelete(retireOnDelete);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}.
         * <p>
         * @return {@code this}
         * @param retireOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}. This parameter is required.
         */
        public Builder retireOnDelete(final com.hashicorp.cdktf.IResolvable retireOnDelete) {
            this.config.retireOnDelete(retireOnDelete);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retiring_principal KmsGrant#retiring_principal}.
         * <p>
         * @return {@code this}
         * @param retiringPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retiring_principal KmsGrant#retiring_principal}. This parameter is required.
         */
        public Builder retiringPrincipal(final java.lang.String retiringPrincipal) {
            this.config.retiringPrincipal(retiringPrincipal);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.kms_grant.KmsGrant}.
         */
        @Override
        public imports.aws.kms_grant.KmsGrant build() {
            return new imports.aws.kms_grant.KmsGrant(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
