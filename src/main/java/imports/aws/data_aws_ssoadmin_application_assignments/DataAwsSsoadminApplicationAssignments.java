package imports.aws.data_aws_ssoadmin_application_assignments;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments aws_ssoadmin_application_assignments}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.892Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsoadminApplicationAssignments.DataAwsSsoadminApplicationAssignments")
public class DataAwsSsoadminApplicationAssignments extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsSsoadminApplicationAssignments(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSsoadminApplicationAssignments(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments aws_ssoadmin_application_assignments} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsSsoadminApplicationAssignments(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSsoadminApplicationAssignments resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSsoadminApplicationAssignments to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSsoadminApplicationAssignments that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsSsoadminApplicationAssignments to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSsoadminApplicationAssignments resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSsoadminApplicationAssignments to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSsoadminApplicationAssignments that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putApplicationAssignments(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignments>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignments> __cast_cd4240 = (java.util.List<imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignments>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignments __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putApplicationAssignments", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplicationAssignments() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationAssignments", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignmentsList getApplicationAssignments() {
        return software.amazon.jsii.Kernel.get(this, "applicationAssignments", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignmentsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplicationAssignmentsInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationAssignmentsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationArn() {
        return software.amazon.jsii.Kernel.get(this, "applicationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationArn", java.util.Objects.requireNonNull(value, "applicationArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments> {
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
        private final imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments#application_arn DataAwsSsoadminApplicationAssignments#application_arn}.
         * <p>
         * @return {@code this}
         * @param applicationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments#application_arn DataAwsSsoadminApplicationAssignments#application_arn}. This parameter is required.
         */
        public Builder applicationArn(final java.lang.String applicationArn) {
            this.config.applicationArn(applicationArn);
            return this;
        }

        /**
         * application_assignments block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments#application_assignments DataAwsSsoadminApplicationAssignments#application_assignments}
         * <p>
         * @return {@code this}
         * @param applicationAssignments application_assignments block. This parameter is required.
         */
        public Builder applicationAssignments(final com.hashicorp.cdktf.IResolvable applicationAssignments) {
            this.config.applicationAssignments(applicationAssignments);
            return this;
        }
        /**
         * application_assignments block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_assignments#application_assignments DataAwsSsoadminApplicationAssignments#application_assignments}
         * <p>
         * @return {@code this}
         * @param applicationAssignments application_assignments block. This parameter is required.
         */
        public Builder applicationAssignments(final java.util.List<? extends imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignmentsApplicationAssignments> applicationAssignments) {
            this.config.applicationAssignments(applicationAssignments);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments}.
         */
        @Override
        public imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments build() {
            return new imports.aws.data_aws_ssoadmin_application_assignments.DataAwsSsoadminApplicationAssignments(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
