package imports.aws.data_aws_resourcegroupstaggingapi_resources;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources aws_resourcegroupstaggingapi_resources}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsResourcegroupstaggingapiResources.DataAwsResourcegroupstaggingapiResources")
public class DataAwsResourcegroupstaggingapiResources extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsResourcegroupstaggingapiResources(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsResourcegroupstaggingapiResources(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources aws_resourcegroupstaggingapi_resources} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsResourcegroupstaggingapiResources(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources aws_resourcegroupstaggingapi_resources} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsResourcegroupstaggingapiResources(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsResourcegroupstaggingapiResources resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsResourcegroupstaggingapiResources to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsResourcegroupstaggingapiResources that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsResourcegroupstaggingapiResources to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsResourcegroupstaggingapiResources resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsResourcegroupstaggingapiResources to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsResourcegroupstaggingapiResources that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTagFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter> __cast_cd4240 = (java.util.List<imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTagFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExcludeCompliantResources() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeCompliantResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeComplianceDetails() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeComplianceDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceArnList() {
        software.amazon.jsii.Kernel.call(this, "resetResourceArnList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTypeFilters() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTypeFilters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagFilter() {
        software.amazon.jsii.Kernel.call(this, "resetTagFilter", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesResourceTagMappingListStructList getResourceTagMappingList() {
        return software.amazon.jsii.Kernel.get(this, "resourceTagMappingList", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesResourceTagMappingListStructList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilterList getTagFilter() {
        return software.amazon.jsii.Kernel.get(this, "tagFilter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeCompliantResourcesInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeCompliantResourcesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeComplianceDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeComplianceDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceArnListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceArnListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypeFiltersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceTypeFiltersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTagFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "tagFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeCompliantResources() {
        return software.amazon.jsii.Kernel.get(this, "excludeCompliantResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeCompliantResources(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeCompliantResources", java.util.Objects.requireNonNull(value, "excludeCompliantResources is required"));
    }

    public void setExcludeCompliantResources(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeCompliantResources", java.util.Objects.requireNonNull(value, "excludeCompliantResources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeComplianceDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeComplianceDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeComplianceDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeComplianceDetails", java.util.Objects.requireNonNull(value, "includeComplianceDetails is required"));
    }

    public void setIncludeComplianceDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeComplianceDetails", java.util.Objects.requireNonNull(value, "includeComplianceDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceArnList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resourceArnList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceArnList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceArnList", java.util.Objects.requireNonNull(value, "resourceArnList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResourceTypeFilters() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resourceTypeFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceTypeFilters(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTypeFilters", java.util.Objects.requireNonNull(value, "resourceTypeFilters is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources> {
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
        private imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}.
         * <p>
         * @return {@code this}
         * @param excludeCompliantResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}. This parameter is required.
         */
        public Builder excludeCompliantResources(final java.lang.Boolean excludeCompliantResources) {
            this.config().excludeCompliantResources(excludeCompliantResources);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}.
         * <p>
         * @return {@code this}
         * @param excludeCompliantResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}. This parameter is required.
         */
        public Builder excludeCompliantResources(final com.hashicorp.cdktf.IResolvable excludeCompliantResources) {
            this.config().excludeCompliantResources(excludeCompliantResources);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#id DataAwsResourcegroupstaggingapiResources#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#id DataAwsResourcegroupstaggingapiResources#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}.
         * <p>
         * @return {@code this}
         * @param includeComplianceDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}. This parameter is required.
         */
        public Builder includeComplianceDetails(final java.lang.Boolean includeComplianceDetails) {
            this.config().includeComplianceDetails(includeComplianceDetails);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}.
         * <p>
         * @return {@code this}
         * @param includeComplianceDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}. This parameter is required.
         */
        public Builder includeComplianceDetails(final com.hashicorp.cdktf.IResolvable includeComplianceDetails) {
            this.config().includeComplianceDetails(includeComplianceDetails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_arn_list DataAwsResourcegroupstaggingapiResources#resource_arn_list}.
         * <p>
         * @return {@code this}
         * @param resourceArnList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_arn_list DataAwsResourcegroupstaggingapiResources#resource_arn_list}. This parameter is required.
         */
        public Builder resourceArnList(final java.util.List<java.lang.String> resourceArnList) {
            this.config().resourceArnList(resourceArnList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_type_filters DataAwsResourcegroupstaggingapiResources#resource_type_filters}.
         * <p>
         * @return {@code this}
         * @param resourceTypeFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_type_filters DataAwsResourcegroupstaggingapiResources#resource_type_filters}. This parameter is required.
         */
        public Builder resourceTypeFilters(final java.util.List<java.lang.String> resourceTypeFilters) {
            this.config().resourceTypeFilters(resourceTypeFilters);
            return this;
        }

        /**
         * tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#tag_filter DataAwsResourcegroupstaggingapiResources#tag_filter}
         * <p>
         * @return {@code this}
         * @param tagFilter tag_filter block. This parameter is required.
         */
        public Builder tagFilter(final com.hashicorp.cdktf.IResolvable tagFilter) {
            this.config().tagFilter(tagFilter);
            return this;
        }
        /**
         * tag_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#tag_filter DataAwsResourcegroupstaggingapiResources#tag_filter}
         * <p>
         * @return {@code this}
         * @param tagFilter tag_filter block. This parameter is required.
         */
        public Builder tagFilter(final java.util.List<? extends imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter> tagFilter) {
            this.config().tagFilter(tagFilter);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources}.
         */
        @Override
        public imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources build() {
            return new imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResources(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesConfig.Builder();
            }
            return this.config;
        }
    }
}
