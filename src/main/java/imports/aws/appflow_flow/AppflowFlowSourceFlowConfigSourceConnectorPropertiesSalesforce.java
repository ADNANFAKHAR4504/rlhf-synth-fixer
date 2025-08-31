package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObject();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#data_transfer_api AppflowFlow#data_transfer_api}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataTransferApi() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#enable_dynamic_field_update AppflowFlow#enable_dynamic_field_update}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDynamicFieldUpdate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_deleted_records AppflowFlow#include_deleted_records}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeDeletedRecords() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce> {
        java.lang.String object;
        java.lang.String dataTransferApi;
        java.lang.Object enableDynamicFieldUpdate;
        java.lang.Object includeDeletedRecords;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getObject}
         * @param object Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}. This parameter is required.
         * @return {@code this}
         */
        public Builder object(java.lang.String object) {
            this.object = object;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getDataTransferApi}
         * @param dataTransferApi Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#data_transfer_api AppflowFlow#data_transfer_api}.
         * @return {@code this}
         */
        public Builder dataTransferApi(java.lang.String dataTransferApi) {
            this.dataTransferApi = dataTransferApi;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getEnableDynamicFieldUpdate}
         * @param enableDynamicFieldUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#enable_dynamic_field_update AppflowFlow#enable_dynamic_field_update}.
         * @return {@code this}
         */
        public Builder enableDynamicFieldUpdate(java.lang.Boolean enableDynamicFieldUpdate) {
            this.enableDynamicFieldUpdate = enableDynamicFieldUpdate;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getEnableDynamicFieldUpdate}
         * @param enableDynamicFieldUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#enable_dynamic_field_update AppflowFlow#enable_dynamic_field_update}.
         * @return {@code this}
         */
        public Builder enableDynamicFieldUpdate(com.hashicorp.cdktf.IResolvable enableDynamicFieldUpdate) {
            this.enableDynamicFieldUpdate = enableDynamicFieldUpdate;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getIncludeDeletedRecords}
         * @param includeDeletedRecords Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_deleted_records AppflowFlow#include_deleted_records}.
         * @return {@code this}
         */
        public Builder includeDeletedRecords(java.lang.Boolean includeDeletedRecords) {
            this.includeDeletedRecords = includeDeletedRecords;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce#getIncludeDeletedRecords}
         * @param includeDeletedRecords Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#include_deleted_records AppflowFlow#include_deleted_records}.
         * @return {@code this}
         */
        public Builder includeDeletedRecords(com.hashicorp.cdktf.IResolvable includeDeletedRecords) {
            this.includeDeletedRecords = includeDeletedRecords;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce {
        private final java.lang.String object;
        private final java.lang.String dataTransferApi;
        private final java.lang.Object enableDynamicFieldUpdate;
        private final java.lang.Object includeDeletedRecords;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.object = software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataTransferApi = software.amazon.jsii.Kernel.get(this, "dataTransferApi", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableDynamicFieldUpdate = software.amazon.jsii.Kernel.get(this, "enableDynamicFieldUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeDeletedRecords = software.amazon.jsii.Kernel.get(this, "includeDeletedRecords", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.object = java.util.Objects.requireNonNull(builder.object, "object is required");
            this.dataTransferApi = builder.dataTransferApi;
            this.enableDynamicFieldUpdate = builder.enableDynamicFieldUpdate;
            this.includeDeletedRecords = builder.includeDeletedRecords;
        }

        @Override
        public final java.lang.String getObject() {
            return this.object;
        }

        @Override
        public final java.lang.String getDataTransferApi() {
            return this.dataTransferApi;
        }

        @Override
        public final java.lang.Object getEnableDynamicFieldUpdate() {
            return this.enableDynamicFieldUpdate;
        }

        @Override
        public final java.lang.Object getIncludeDeletedRecords() {
            return this.includeDeletedRecords;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("object", om.valueToTree(this.getObject()));
            if (this.getDataTransferApi() != null) {
                data.set("dataTransferApi", om.valueToTree(this.getDataTransferApi()));
            }
            if (this.getEnableDynamicFieldUpdate() != null) {
                data.set("enableDynamicFieldUpdate", om.valueToTree(this.getEnableDynamicFieldUpdate()));
            }
            if (this.getIncludeDeletedRecords() != null) {
                data.set("includeDeletedRecords", om.valueToTree(this.getIncludeDeletedRecords()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce.Jsii$Proxy that = (AppflowFlowSourceFlowConfigSourceConnectorPropertiesSalesforce.Jsii$Proxy) o;

            if (!object.equals(that.object)) return false;
            if (this.dataTransferApi != null ? !this.dataTransferApi.equals(that.dataTransferApi) : that.dataTransferApi != null) return false;
            if (this.enableDynamicFieldUpdate != null ? !this.enableDynamicFieldUpdate.equals(that.enableDynamicFieldUpdate) : that.enableDynamicFieldUpdate != null) return false;
            return this.includeDeletedRecords != null ? this.includeDeletedRecords.equals(that.includeDeletedRecords) : that.includeDeletedRecords == null;
        }

        @Override
        public final int hashCode() {
            int result = this.object.hashCode();
            result = 31 * result + (this.dataTransferApi != null ? this.dataTransferApi.hashCode() : 0);
            result = 31 * result + (this.enableDynamicFieldUpdate != null ? this.enableDynamicFieldUpdate.hashCode() : 0);
            result = 31 * result + (this.includeDeletedRecords != null ? this.includeDeletedRecords.hashCode() : 0);
            return result;
        }
    }
}
