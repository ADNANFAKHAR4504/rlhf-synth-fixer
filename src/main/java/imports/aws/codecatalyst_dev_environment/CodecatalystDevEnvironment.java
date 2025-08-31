package imports.aws.codecatalyst_dev_environment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment aws_codecatalyst_dev_environment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codecatalystDevEnvironment.CodecatalystDevEnvironment")
public class CodecatalystDevEnvironment extends com.hashicorp.cdktf.TerraformResource {

    protected CodecatalystDevEnvironment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodecatalystDevEnvironment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment aws_codecatalyst_dev_environment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CodecatalystDevEnvironment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CodecatalystDevEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodecatalystDevEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing CodecatalystDevEnvironment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CodecatalystDevEnvironment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CodecatalystDevEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodecatalystDevEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing CodecatalystDevEnvironment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putIdes(final @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes value) {
        software.amazon.jsii.Kernel.call(this, "putIdes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPersistentStorage(final @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage value) {
        software.amazon.jsii.Kernel.call(this, "putPersistentStorage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRepositories(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories> __cast_cd4240 = (java.util.List<imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRepositories", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAlias() {
        software.amazon.jsii.Kernel.call(this, "resetAlias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInactivityTimeoutMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetInactivityTimeoutMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepositories() {
        software.amazon.jsii.Kernel.call(this, "resetRepositories", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdesOutputReference getIdes() {
        return software.amazon.jsii.Kernel.get(this, "ides", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorageOutputReference getPersistentStorage() {
        return software.amazon.jsii.Kernel.get(this, "persistentStorage", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorageOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositoriesList getRepositories() {
        return software.amazon.jsii.Kernel.get(this, "repositories", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositoriesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAliasInput() {
        return software.amazon.jsii.Kernel.get(this, "aliasInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes getIdesInput() {
        return software.amazon.jsii.Kernel.get(this, "idesInput", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getInactivityTimeoutMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "inactivityTimeoutMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage getPersistentStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "persistentStorageInput", software.amazon.jsii.NativeType.forClass(imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProjectNameInput() {
        return software.amazon.jsii.Kernel.get(this, "projectNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRepositoriesInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpaceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlias() {
        return software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlias(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alias", java.util.Objects.requireNonNull(value, "alias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInactivityTimeoutMinutes() {
        return software.amazon.jsii.Kernel.get(this, "inactivityTimeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInactivityTimeoutMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "inactivityTimeoutMinutes", java.util.Objects.requireNonNull(value, "inactivityTimeoutMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProjectName() {
        return software.amazon.jsii.Kernel.get(this, "projectName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProjectName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "projectName", java.util.Objects.requireNonNull(value, "projectName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpaceName() {
        return software.amazon.jsii.Kernel.get(this, "spaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpaceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spaceName", java.util.Objects.requireNonNull(value, "spaceName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment> {
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
        private final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentConfig.Builder();
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
         * ides block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#ides CodecatalystDevEnvironment#ides}
         * <p>
         * @return {@code this}
         * @param ides ides block. This parameter is required.
         */
        public Builder ides(final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentIdes ides) {
            this.config.ides(ides);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#instance_type CodecatalystDevEnvironment#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#instance_type CodecatalystDevEnvironment#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config.instanceType(instanceType);
            return this;
        }

        /**
         * persistent_storage block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#persistent_storage CodecatalystDevEnvironment#persistent_storage}
         * <p>
         * @return {@code this}
         * @param persistentStorage persistent_storage block. This parameter is required.
         */
        public Builder persistentStorage(final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentPersistentStorage persistentStorage) {
            this.config.persistentStorage(persistentStorage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#project_name CodecatalystDevEnvironment#project_name}.
         * <p>
         * @return {@code this}
         * @param projectName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#project_name CodecatalystDevEnvironment#project_name}. This parameter is required.
         */
        public Builder projectName(final java.lang.String projectName) {
            this.config.projectName(projectName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#space_name CodecatalystDevEnvironment#space_name}.
         * <p>
         * @return {@code this}
         * @param spaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#space_name CodecatalystDevEnvironment#space_name}. This parameter is required.
         */
        public Builder spaceName(final java.lang.String spaceName) {
            this.config.spaceName(spaceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#alias CodecatalystDevEnvironment#alias}.
         * <p>
         * @return {@code this}
         * @param alias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#alias CodecatalystDevEnvironment#alias}. This parameter is required.
         */
        public Builder alias(final java.lang.String alias) {
            this.config.alias(alias);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#id CodecatalystDevEnvironment#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#id CodecatalystDevEnvironment#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#inactivity_timeout_minutes CodecatalystDevEnvironment#inactivity_timeout_minutes}.
         * <p>
         * @return {@code this}
         * @param inactivityTimeoutMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#inactivity_timeout_minutes CodecatalystDevEnvironment#inactivity_timeout_minutes}. This parameter is required.
         */
        public Builder inactivityTimeoutMinutes(final java.lang.Number inactivityTimeoutMinutes) {
            this.config.inactivityTimeoutMinutes(inactivityTimeoutMinutes);
            return this;
        }

        /**
         * repositories block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repositories CodecatalystDevEnvironment#repositories}
         * <p>
         * @return {@code this}
         * @param repositories repositories block. This parameter is required.
         */
        public Builder repositories(final com.hashicorp.cdktf.IResolvable repositories) {
            this.config.repositories(repositories);
            return this;
        }
        /**
         * repositories block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#repositories CodecatalystDevEnvironment#repositories}
         * <p>
         * @return {@code this}
         * @param repositories repositories block. This parameter is required.
         */
        public Builder repositories(final java.util.List<? extends imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentRepositories> repositories) {
            this.config.repositories(repositories);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#timeouts CodecatalystDevEnvironment#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironmentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment}.
         */
        @Override
        public imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment build() {
            return new imports.aws.codecatalyst_dev_environment.CodecatalystDevEnvironment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
