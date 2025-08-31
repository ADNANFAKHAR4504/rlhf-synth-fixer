package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.262Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailEventSelector")
@software.amazon.jsii.Jsii.Proxy(CloudtrailEventSelector.Jsii$Proxy.class)
public interface CloudtrailEventSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * data_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#data_resource Cloudtrail#data_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataResource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#exclude_management_event_sources Cloudtrail#exclude_management_event_sources}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludeManagementEventSources() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_management_events Cloudtrail#include_management_events}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeManagementEvents() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#read_write_type Cloudtrail#read_write_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReadWriteType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudtrailEventSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudtrailEventSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudtrailEventSelector> {
        java.lang.Object dataResource;
        java.util.List<java.lang.String> excludeManagementEventSources;
        java.lang.Object includeManagementEvents;
        java.lang.String readWriteType;

        /**
         * Sets the value of {@link CloudtrailEventSelector#getDataResource}
         * @param dataResource data_resource block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#data_resource Cloudtrail#data_resource}
         * @return {@code this}
         */
        public Builder dataResource(com.hashicorp.cdktf.IResolvable dataResource) {
            this.dataResource = dataResource;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventSelector#getDataResource}
         * @param dataResource data_resource block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#data_resource Cloudtrail#data_resource}
         * @return {@code this}
         */
        public Builder dataResource(java.util.List<? extends imports.aws.cloudtrail.CloudtrailEventSelectorDataResource> dataResource) {
            this.dataResource = dataResource;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventSelector#getExcludeManagementEventSources}
         * @param excludeManagementEventSources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#exclude_management_event_sources Cloudtrail#exclude_management_event_sources}.
         * @return {@code this}
         */
        public Builder excludeManagementEventSources(java.util.List<java.lang.String> excludeManagementEventSources) {
            this.excludeManagementEventSources = excludeManagementEventSources;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventSelector#getIncludeManagementEvents}
         * @param includeManagementEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_management_events Cloudtrail#include_management_events}.
         * @return {@code this}
         */
        public Builder includeManagementEvents(java.lang.Boolean includeManagementEvents) {
            this.includeManagementEvents = includeManagementEvents;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventSelector#getIncludeManagementEvents}
         * @param includeManagementEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_management_events Cloudtrail#include_management_events}.
         * @return {@code this}
         */
        public Builder includeManagementEvents(com.hashicorp.cdktf.IResolvable includeManagementEvents) {
            this.includeManagementEvents = includeManagementEvents;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventSelector#getReadWriteType}
         * @param readWriteType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#read_write_type Cloudtrail#read_write_type}.
         * @return {@code this}
         */
        public Builder readWriteType(java.lang.String readWriteType) {
            this.readWriteType = readWriteType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudtrailEventSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudtrailEventSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudtrailEventSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudtrailEventSelector {
        private final java.lang.Object dataResource;
        private final java.util.List<java.lang.String> excludeManagementEventSources;
        private final java.lang.Object includeManagementEvents;
        private final java.lang.String readWriteType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataResource = software.amazon.jsii.Kernel.get(this, "dataResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.excludeManagementEventSources = software.amazon.jsii.Kernel.get(this, "excludeManagementEventSources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.includeManagementEvents = software.amazon.jsii.Kernel.get(this, "includeManagementEvents", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.readWriteType = software.amazon.jsii.Kernel.get(this, "readWriteType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataResource = builder.dataResource;
            this.excludeManagementEventSources = builder.excludeManagementEventSources;
            this.includeManagementEvents = builder.includeManagementEvents;
            this.readWriteType = builder.readWriteType;
        }

        @Override
        public final java.lang.Object getDataResource() {
            return this.dataResource;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludeManagementEventSources() {
            return this.excludeManagementEventSources;
        }

        @Override
        public final java.lang.Object getIncludeManagementEvents() {
            return this.includeManagementEvents;
        }

        @Override
        public final java.lang.String getReadWriteType() {
            return this.readWriteType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataResource() != null) {
                data.set("dataResource", om.valueToTree(this.getDataResource()));
            }
            if (this.getExcludeManagementEventSources() != null) {
                data.set("excludeManagementEventSources", om.valueToTree(this.getExcludeManagementEventSources()));
            }
            if (this.getIncludeManagementEvents() != null) {
                data.set("includeManagementEvents", om.valueToTree(this.getIncludeManagementEvents()));
            }
            if (this.getReadWriteType() != null) {
                data.set("readWriteType", om.valueToTree(this.getReadWriteType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudtrail.CloudtrailEventSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudtrailEventSelector.Jsii$Proxy that = (CloudtrailEventSelector.Jsii$Proxy) o;

            if (this.dataResource != null ? !this.dataResource.equals(that.dataResource) : that.dataResource != null) return false;
            if (this.excludeManagementEventSources != null ? !this.excludeManagementEventSources.equals(that.excludeManagementEventSources) : that.excludeManagementEventSources != null) return false;
            if (this.includeManagementEvents != null ? !this.includeManagementEvents.equals(that.includeManagementEvents) : that.includeManagementEvents != null) return false;
            return this.readWriteType != null ? this.readWriteType.equals(that.readWriteType) : that.readWriteType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataResource != null ? this.dataResource.hashCode() : 0;
            result = 31 * result + (this.excludeManagementEventSources != null ? this.excludeManagementEventSources.hashCode() : 0);
            result = 31 * result + (this.includeManagementEvents != null ? this.includeManagementEvents.hashCode() : 0);
            result = 31 * result + (this.readWriteType != null ? this.readWriteType.hashCode() : 0);
            return result;
        }
    }
}
