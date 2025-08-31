package imports.aws.data_aws_resourcegroupstaggingapi_resources;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsResourcegroupstaggingapiResources.DataAwsResourcegroupstaggingapiResourcesConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsResourcegroupstaggingapiResourcesConfig.Jsii$Proxy.class)
public interface DataAwsResourcegroupstaggingapiResourcesConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeCompliantResources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#id DataAwsResourcegroupstaggingapiResources#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeComplianceDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_arn_list DataAwsResourcegroupstaggingapiResources#resource_arn_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceArnList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_type_filters DataAwsResourcegroupstaggingapiResources#resource_type_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypeFilters() {
        return null;
    }

    /**
     * tag_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#tag_filter DataAwsResourcegroupstaggingapiResources#tag_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTagFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsResourcegroupstaggingapiResourcesConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsResourcegroupstaggingapiResourcesConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsResourcegroupstaggingapiResourcesConfig> {
        java.lang.Object excludeCompliantResources;
        java.lang.String id;
        java.lang.Object includeComplianceDetails;
        java.util.List<java.lang.String> resourceArnList;
        java.util.List<java.lang.String> resourceTypeFilters;
        java.lang.Object tagFilter;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getExcludeCompliantResources}
         * @param excludeCompliantResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}.
         * @return {@code this}
         */
        public Builder excludeCompliantResources(java.lang.Boolean excludeCompliantResources) {
            this.excludeCompliantResources = excludeCompliantResources;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getExcludeCompliantResources}
         * @param excludeCompliantResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#exclude_compliant_resources DataAwsResourcegroupstaggingapiResources#exclude_compliant_resources}.
         * @return {@code this}
         */
        public Builder excludeCompliantResources(com.hashicorp.cdktf.IResolvable excludeCompliantResources) {
            this.excludeCompliantResources = excludeCompliantResources;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#id DataAwsResourcegroupstaggingapiResources#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getIncludeComplianceDetails}
         * @param includeComplianceDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}.
         * @return {@code this}
         */
        public Builder includeComplianceDetails(java.lang.Boolean includeComplianceDetails) {
            this.includeComplianceDetails = includeComplianceDetails;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getIncludeComplianceDetails}
         * @param includeComplianceDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#include_compliance_details DataAwsResourcegroupstaggingapiResources#include_compliance_details}.
         * @return {@code this}
         */
        public Builder includeComplianceDetails(com.hashicorp.cdktf.IResolvable includeComplianceDetails) {
            this.includeComplianceDetails = includeComplianceDetails;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getResourceArnList}
         * @param resourceArnList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_arn_list DataAwsResourcegroupstaggingapiResources#resource_arn_list}.
         * @return {@code this}
         */
        public Builder resourceArnList(java.util.List<java.lang.String> resourceArnList) {
            this.resourceArnList = resourceArnList;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getResourceTypeFilters}
         * @param resourceTypeFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#resource_type_filters DataAwsResourcegroupstaggingapiResources#resource_type_filters}.
         * @return {@code this}
         */
        public Builder resourceTypeFilters(java.util.List<java.lang.String> resourceTypeFilters) {
            this.resourceTypeFilters = resourceTypeFilters;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getTagFilter}
         * @param tagFilter tag_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#tag_filter DataAwsResourcegroupstaggingapiResources#tag_filter}
         * @return {@code this}
         */
        public Builder tagFilter(com.hashicorp.cdktf.IResolvable tagFilter) {
            this.tagFilter = tagFilter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getTagFilter}
         * @param tagFilter tag_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/resourcegroupstaggingapi_resources#tag_filter DataAwsResourcegroupstaggingapiResources#tag_filter}
         * @return {@code this}
         */
        public Builder tagFilter(java.util.List<? extends imports.aws.data_aws_resourcegroupstaggingapi_resources.DataAwsResourcegroupstaggingapiResourcesTagFilter> tagFilter) {
            this.tagFilter = tagFilter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsResourcegroupstaggingapiResourcesConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsResourcegroupstaggingapiResourcesConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsResourcegroupstaggingapiResourcesConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsResourcegroupstaggingapiResourcesConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsResourcegroupstaggingapiResourcesConfig {
        private final java.lang.Object excludeCompliantResources;
        private final java.lang.String id;
        private final java.lang.Object includeComplianceDetails;
        private final java.util.List<java.lang.String> resourceArnList;
        private final java.util.List<java.lang.String> resourceTypeFilters;
        private final java.lang.Object tagFilter;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.excludeCompliantResources = software.amazon.jsii.Kernel.get(this, "excludeCompliantResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeComplianceDetails = software.amazon.jsii.Kernel.get(this, "includeComplianceDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceArnList = software.amazon.jsii.Kernel.get(this, "resourceArnList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceTypeFilters = software.amazon.jsii.Kernel.get(this, "resourceTypeFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagFilter = software.amazon.jsii.Kernel.get(this, "tagFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.excludeCompliantResources = builder.excludeCompliantResources;
            this.id = builder.id;
            this.includeComplianceDetails = builder.includeComplianceDetails;
            this.resourceArnList = builder.resourceArnList;
            this.resourceTypeFilters = builder.resourceTypeFilters;
            this.tagFilter = builder.tagFilter;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getExcludeCompliantResources() {
            return this.excludeCompliantResources;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeComplianceDetails() {
            return this.includeComplianceDetails;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceArnList() {
            return this.resourceArnList;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypeFilters() {
            return this.resourceTypeFilters;
        }

        @Override
        public final java.lang.Object getTagFilter() {
            return this.tagFilter;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExcludeCompliantResources() != null) {
                data.set("excludeCompliantResources", om.valueToTree(this.getExcludeCompliantResources()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeComplianceDetails() != null) {
                data.set("includeComplianceDetails", om.valueToTree(this.getIncludeComplianceDetails()));
            }
            if (this.getResourceArnList() != null) {
                data.set("resourceArnList", om.valueToTree(this.getResourceArnList()));
            }
            if (this.getResourceTypeFilters() != null) {
                data.set("resourceTypeFilters", om.valueToTree(this.getResourceTypeFilters()));
            }
            if (this.getTagFilter() != null) {
                data.set("tagFilter", om.valueToTree(this.getTagFilter()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsResourcegroupstaggingapiResources.DataAwsResourcegroupstaggingapiResourcesConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsResourcegroupstaggingapiResourcesConfig.Jsii$Proxy that = (DataAwsResourcegroupstaggingapiResourcesConfig.Jsii$Proxy) o;

            if (this.excludeCompliantResources != null ? !this.excludeCompliantResources.equals(that.excludeCompliantResources) : that.excludeCompliantResources != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeComplianceDetails != null ? !this.includeComplianceDetails.equals(that.includeComplianceDetails) : that.includeComplianceDetails != null) return false;
            if (this.resourceArnList != null ? !this.resourceArnList.equals(that.resourceArnList) : that.resourceArnList != null) return false;
            if (this.resourceTypeFilters != null ? !this.resourceTypeFilters.equals(that.resourceTypeFilters) : that.resourceTypeFilters != null) return false;
            if (this.tagFilter != null ? !this.tagFilter.equals(that.tagFilter) : that.tagFilter != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.excludeCompliantResources != null ? this.excludeCompliantResources.hashCode() : 0;
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeComplianceDetails != null ? this.includeComplianceDetails.hashCode() : 0);
            result = 31 * result + (this.resourceArnList != null ? this.resourceArnList.hashCode() : 0);
            result = 31 * result + (this.resourceTypeFilters != null ? this.resourceTypeFilters.hashCode() : 0);
            result = 31 * result + (this.tagFilter != null ? this.tagFilter.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
