package imports.aws.lakeformation_opt_in;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in aws_lakeformation_opt_in}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.485Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptIn")
public class LakeformationOptIn extends com.hashicorp.cdktf.TerraformResource {

    protected LakeformationOptIn(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationOptIn(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lakeformation_opt_in.LakeformationOptIn.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in aws_lakeformation_opt_in} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public LakeformationOptIn(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_opt_in.LakeformationOptInConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in aws_lakeformation_opt_in} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public LakeformationOptIn(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a LakeformationOptIn resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationOptIn to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationOptIn that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LakeformationOptIn to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_opt_in.LakeformationOptIn.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LakeformationOptIn resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LakeformationOptIn to import. This parameter is required.
     * @param importFromId The id of the existing LakeformationOptIn that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lakeformation_opt_in.LakeformationOptIn.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCondition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInCondition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInCondition> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInCondition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_opt_in.LakeformationOptInCondition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrincipal(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInPrincipal>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInPrincipal> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInPrincipal>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_opt_in.LakeformationOptInPrincipal __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPrincipal", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceData(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInResourceData>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInResourceData> __cast_cd4240 = (java.util.List<imports.aws.lakeformation_opt_in.LakeformationOptInResourceData>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lakeformation_opt_in.LakeformationOptInResourceData __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceData", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCondition() {
        software.amazon.jsii.Kernel.call(this, "resetCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrincipal() {
        software.amazon.jsii.Kernel.call(this, "resetPrincipal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceData() {
        software.amazon.jsii.Kernel.call(this, "resetResourceData", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_opt_in.LakeformationOptInConditionList getCondition() {
        return software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_opt_in.LakeformationOptInConditionList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModified() {
        return software.amazon.jsii.Kernel.get(this, "lastModified", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedBy() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_opt_in.LakeformationOptInPrincipalList getPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_opt_in.LakeformationOptInPrincipalList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataList getResourceData() {
        return software.amazon.jsii.Kernel.get(this, "resourceData", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_opt_in.LakeformationOptInResourceDataList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceDataInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceDataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    /**
     * A fluent builder for {@link imports.aws.lakeformation_opt_in.LakeformationOptIn}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lakeformation_opt_in.LakeformationOptIn> {
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
        private imports.aws.lakeformation_opt_in.LakeformationOptInConfig.Builder config;

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
         * condition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#condition LakeformationOptIn#condition}
         * <p>
         * @return {@code this}
         * @param condition condition block. This parameter is required.
         */
        public Builder condition(final com.hashicorp.cdktf.IResolvable condition) {
            this.config().condition(condition);
            return this;
        }
        /**
         * condition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#condition LakeformationOptIn#condition}
         * <p>
         * @return {@code this}
         * @param condition condition block. This parameter is required.
         */
        public Builder condition(final java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInCondition> condition) {
            this.config().condition(condition);
            return this;
        }

        /**
         * principal block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#principal LakeformationOptIn#principal}
         * <p>
         * @return {@code this}
         * @param principal principal block. This parameter is required.
         */
        public Builder principal(final com.hashicorp.cdktf.IResolvable principal) {
            this.config().principal(principal);
            return this;
        }
        /**
         * principal block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#principal LakeformationOptIn#principal}
         * <p>
         * @return {@code this}
         * @param principal principal block. This parameter is required.
         */
        public Builder principal(final java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInPrincipal> principal) {
            this.config().principal(principal);
            return this;
        }

        /**
         * resource_data block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_data LakeformationOptIn#resource_data}
         * <p>
         * @return {@code this}
         * @param resourceData resource_data block. This parameter is required.
         */
        public Builder resourceData(final com.hashicorp.cdktf.IResolvable resourceData) {
            this.config().resourceData(resourceData);
            return this;
        }
        /**
         * resource_data block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_data LakeformationOptIn#resource_data}
         * <p>
         * @return {@code this}
         * @param resourceData resource_data block. This parameter is required.
         */
        public Builder resourceData(final java.util.List<? extends imports.aws.lakeformation_opt_in.LakeformationOptInResourceData> resourceData) {
            this.config().resourceData(resourceData);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lakeformation_opt_in.LakeformationOptIn}.
         */
        @Override
        public imports.aws.lakeformation_opt_in.LakeformationOptIn build() {
            return new imports.aws.lakeformation_opt_in.LakeformationOptIn(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.lakeformation_opt_in.LakeformationOptInConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.lakeformation_opt_in.LakeformationOptInConfig.Builder();
            }
            return this.config;
        }
    }
}
