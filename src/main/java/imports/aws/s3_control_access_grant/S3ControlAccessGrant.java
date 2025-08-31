package imports.aws.s3_control_access_grant;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant aws_s3control_access_grant}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlAccessGrant.S3ControlAccessGrant")
public class S3ControlAccessGrant extends com.hashicorp.cdktf.TerraformResource {

    protected S3ControlAccessGrant(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlAccessGrant(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.s3_control_access_grant.S3ControlAccessGrant.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant aws_s3control_access_grant} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public S3ControlAccessGrant(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.s3_control_access_grant.S3ControlAccessGrantConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a S3ControlAccessGrant resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3ControlAccessGrant to import. This parameter is required.
     * @param importFromId The id of the existing S3ControlAccessGrant that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the S3ControlAccessGrant to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_control_access_grant.S3ControlAccessGrant.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a S3ControlAccessGrant resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3ControlAccessGrant to import. This parameter is required.
     * @param importFromId The id of the existing S3ControlAccessGrant that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_control_access_grant.S3ControlAccessGrant.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessGrantsLocationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAccessGrantsLocationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGrantee(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee> __cast_cd4240 = (java.util.List<imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGrantee", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessGrantsLocationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAccessGrantsLocationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrantee() {
        software.amazon.jsii.Kernel.call(this, "resetGrantee", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3PrefixType() {
        software.amazon.jsii.Kernel.call(this, "resetS3PrefixType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessGrantArn() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessGrantId() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfigurationList getAccessGrantsLocationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantsLocationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_access_grant.S3ControlAccessGrantGranteeList getGrantee() {
        return software.amazon.jsii.Kernel.get(this, "grantee", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_access_grant.S3ControlAccessGrantGranteeList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrantScope() {
        return software.amazon.jsii.Kernel.get(this, "grantScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAccessGrantsLocationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantsLocationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessGrantsLocationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantsLocationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGranteeInput() {
        return software.amazon.jsii.Kernel.get(this, "granteeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3PrefixTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3PrefixTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessGrantsLocationId() {
        return software.amazon.jsii.Kernel.get(this, "accessGrantsLocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessGrantsLocationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessGrantsLocationId", java.util.Objects.requireNonNull(value, "accessGrantsLocationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermission() {
        return software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermission(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permission", java.util.Objects.requireNonNull(value, "permission is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3PrefixType() {
        return software.amazon.jsii.Kernel.get(this, "s3PrefixType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3PrefixType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3PrefixType", java.util.Objects.requireNonNull(value, "s3PrefixType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.s3_control_access_grant.S3ControlAccessGrant}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.s3_control_access_grant.S3ControlAccessGrant> {
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
        private final imports.aws.s3_control_access_grant.S3ControlAccessGrantConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.s3_control_access_grant.S3ControlAccessGrantConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_id S3ControlAccessGrant#access_grants_location_id}.
         * <p>
         * @return {@code this}
         * @param accessGrantsLocationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_id S3ControlAccessGrant#access_grants_location_id}. This parameter is required.
         */
        public Builder accessGrantsLocationId(final java.lang.String accessGrantsLocationId) {
            this.config.accessGrantsLocationId(accessGrantsLocationId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#permission S3ControlAccessGrant#permission}.
         * <p>
         * @return {@code this}
         * @param permission Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#permission S3ControlAccessGrant#permission}. This parameter is required.
         */
        public Builder permission(final java.lang.String permission) {
            this.config.permission(permission);
            return this;
        }

        /**
         * access_grants_location_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_configuration S3ControlAccessGrant#access_grants_location_configuration}
         * <p>
         * @return {@code this}
         * @param accessGrantsLocationConfiguration access_grants_location_configuration block. This parameter is required.
         */
        public Builder accessGrantsLocationConfiguration(final com.hashicorp.cdktf.IResolvable accessGrantsLocationConfiguration) {
            this.config.accessGrantsLocationConfiguration(accessGrantsLocationConfiguration);
            return this;
        }
        /**
         * access_grants_location_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_configuration S3ControlAccessGrant#access_grants_location_configuration}
         * <p>
         * @return {@code this}
         * @param accessGrantsLocationConfiguration access_grants_location_configuration block. This parameter is required.
         */
        public Builder accessGrantsLocationConfiguration(final java.util.List<? extends imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration> accessGrantsLocationConfiguration) {
            this.config.accessGrantsLocationConfiguration(accessGrantsLocationConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#account_id S3ControlAccessGrant#account_id}.
         * <p>
         * @return {@code this}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#account_id S3ControlAccessGrant#account_id}. This parameter is required.
         */
        public Builder accountId(final java.lang.String accountId) {
            this.config.accountId(accountId);
            return this;
        }

        /**
         * grantee block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee S3ControlAccessGrant#grantee}
         * <p>
         * @return {@code this}
         * @param grantee grantee block. This parameter is required.
         */
        public Builder grantee(final com.hashicorp.cdktf.IResolvable grantee) {
            this.config.grantee(grantee);
            return this;
        }
        /**
         * grantee block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee S3ControlAccessGrant#grantee}
         * <p>
         * @return {@code this}
         * @param grantee grantee block. This parameter is required.
         */
        public Builder grantee(final java.util.List<? extends imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee> grantee) {
            this.config.grantee(grantee);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_prefix_type S3ControlAccessGrant#s3_prefix_type}.
         * <p>
         * @return {@code this}
         * @param s3PrefixType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_prefix_type S3ControlAccessGrant#s3_prefix_type}. This parameter is required.
         */
        public Builder s3PrefixType(final java.lang.String s3PrefixType) {
            this.config.s3PrefixType(s3PrefixType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#tags S3ControlAccessGrant#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#tags S3ControlAccessGrant#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.s3_control_access_grant.S3ControlAccessGrant}.
         */
        @Override
        public imports.aws.s3_control_access_grant.S3ControlAccessGrant build() {
            return new imports.aws.s3_control_access_grant.S3ControlAccessGrant(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
