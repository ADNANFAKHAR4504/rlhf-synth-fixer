package imports.aws.data_aws_neptune_orderable_db_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance aws_neptune_orderable_db_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.762Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNeptuneOrderableDbInstance.DataAwsNeptuneOrderableDbInstance")
public class DataAwsNeptuneOrderableDbInstance extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsNeptuneOrderableDbInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsNeptuneOrderableDbInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance aws_neptune_orderable_db_instance} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsNeptuneOrderableDbInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance aws_neptune_orderable_db_instance} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsNeptuneOrderableDbInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsNeptuneOrderableDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsNeptuneOrderableDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsNeptuneOrderableDbInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsNeptuneOrderableDbInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsNeptuneOrderableDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsNeptuneOrderableDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsNeptuneOrderableDbInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetEngine() {
        software.amazon.jsii.Kernel.call(this, "resetEngine", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceClass() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLicenseModel() {
        software.amazon.jsii.Kernel.call(this, "resetLicenseModel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredInstanceClasses() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredInstanceClasses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpc() {
        software.amazon.jsii.Kernel.call(this, "resetVpc", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIopsPerDbInstance() {
        return software.amazon.jsii.Kernel.get(this, "maxIopsPerDbInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIopsPerGib() {
        return software.amazon.jsii.Kernel.get(this, "maxIopsPerGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxStorageSize() {
        return software.amazon.jsii.Kernel.get(this, "maxStorageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIopsPerDbInstance() {
        return software.amazon.jsii.Kernel.get(this, "minIopsPerDbInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIopsPerGib() {
        return software.amazon.jsii.Kernel.get(this, "minIopsPerGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinStorageSize() {
        return software.amazon.jsii.Kernel.get(this, "minStorageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getMultiAzCapable() {
        return software.amazon.jsii.Kernel.get(this, "multiAzCapable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getReadReplicaCapable() {
        return software.amazon.jsii.Kernel.get(this, "readReplicaCapable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsEnhancedMonitoring() {
        return software.amazon.jsii.Kernel.get(this, "supportsEnhancedMonitoring", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsIamDatabaseAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "supportsIamDatabaseAuthentication", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsIops() {
        return software.amazon.jsii.Kernel.get(this, "supportsIops", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsPerformanceInsights() {
        return software.amazon.jsii.Kernel.get(this, "supportsPerformanceInsights", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsStorageEncryption() {
        return software.amazon.jsii.Kernel.get(this, "supportsStorageEncryption", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceClassInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLicenseModelInput() {
        return software.amazon.jsii.Kernel.get(this, "licenseModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredInstanceClassesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredInstanceClassesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceClass() {
        return software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceClass", java.util.Objects.requireNonNull(value, "instanceClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLicenseModel() {
        return software.amazon.jsii.Kernel.get(this, "licenseModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLicenseModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "licenseModel", java.util.Objects.requireNonNull(value, "licenseModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredInstanceClasses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredInstanceClasses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredInstanceClasses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredInstanceClasses", java.util.Objects.requireNonNull(value, "preferredInstanceClasses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance> {
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
        private imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstanceConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#engine DataAwsNeptuneOrderableDbInstance#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#engine DataAwsNeptuneOrderableDbInstance#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config().engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#engine_version DataAwsNeptuneOrderableDbInstance#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#engine_version DataAwsNeptuneOrderableDbInstance#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config().engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#id DataAwsNeptuneOrderableDbInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#id DataAwsNeptuneOrderableDbInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#instance_class DataAwsNeptuneOrderableDbInstance#instance_class}.
         * <p>
         * @return {@code this}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#instance_class DataAwsNeptuneOrderableDbInstance#instance_class}. This parameter is required.
         */
        public Builder instanceClass(final java.lang.String instanceClass) {
            this.config().instanceClass(instanceClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#license_model DataAwsNeptuneOrderableDbInstance#license_model}.
         * <p>
         * @return {@code this}
         * @param licenseModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#license_model DataAwsNeptuneOrderableDbInstance#license_model}. This parameter is required.
         */
        public Builder licenseModel(final java.lang.String licenseModel) {
            this.config().licenseModel(licenseModel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#preferred_instance_classes DataAwsNeptuneOrderableDbInstance#preferred_instance_classes}.
         * <p>
         * @return {@code this}
         * @param preferredInstanceClasses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#preferred_instance_classes DataAwsNeptuneOrderableDbInstance#preferred_instance_classes}. This parameter is required.
         */
        public Builder preferredInstanceClasses(final java.util.List<java.lang.String> preferredInstanceClasses) {
            this.config().preferredInstanceClasses(preferredInstanceClasses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#vpc DataAwsNeptuneOrderableDbInstance#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#vpc DataAwsNeptuneOrderableDbInstance#vpc}. This parameter is required.
         */
        public Builder vpc(final java.lang.Boolean vpc) {
            this.config().vpc(vpc);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#vpc DataAwsNeptuneOrderableDbInstance#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/neptune_orderable_db_instance#vpc DataAwsNeptuneOrderableDbInstance#vpc}. This parameter is required.
         */
        public Builder vpc(final com.hashicorp.cdktf.IResolvable vpc) {
            this.config().vpc(vpc);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance}.
         */
        @Override
        public imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance build() {
            return new imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstance(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstanceConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_neptune_orderable_db_instance.DataAwsNeptuneOrderableDbInstanceConfig.Builder();
            }
            return this.config;
        }
    }
}
