package imports.aws.devopsguru_resource_collection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruResourceCollection.DevopsguruResourceCollectionTags")
@software.amazon.jsii.Jsii.Proxy(DevopsguruResourceCollectionTags.Jsii$Proxy.class)
public interface DevopsguruResourceCollectionTags extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_resource_collection#app_boundary_key DevopsguruResourceCollection#app_boundary_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAppBoundaryKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_resource_collection#tag_values DevopsguruResourceCollection#tag_values}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTagValues();

    /**
     * @return a {@link Builder} of {@link DevopsguruResourceCollectionTags}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruResourceCollectionTags}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruResourceCollectionTags> {
        java.lang.String appBoundaryKey;
        java.util.List<java.lang.String> tagValues;

        /**
         * Sets the value of {@link DevopsguruResourceCollectionTags#getAppBoundaryKey}
         * @param appBoundaryKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_resource_collection#app_boundary_key DevopsguruResourceCollection#app_boundary_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder appBoundaryKey(java.lang.String appBoundaryKey) {
            this.appBoundaryKey = appBoundaryKey;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruResourceCollectionTags#getTagValues}
         * @param tagValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_resource_collection#tag_values DevopsguruResourceCollection#tag_values}. This parameter is required.
         * @return {@code this}
         */
        public Builder tagValues(java.util.List<java.lang.String> tagValues) {
            this.tagValues = tagValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruResourceCollectionTags}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruResourceCollectionTags build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruResourceCollectionTags}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruResourceCollectionTags {
        private final java.lang.String appBoundaryKey;
        private final java.util.List<java.lang.String> tagValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.appBoundaryKey = software.amazon.jsii.Kernel.get(this, "appBoundaryKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagValues = software.amazon.jsii.Kernel.get(this, "tagValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.appBoundaryKey = java.util.Objects.requireNonNull(builder.appBoundaryKey, "appBoundaryKey is required");
            this.tagValues = java.util.Objects.requireNonNull(builder.tagValues, "tagValues is required");
        }

        @Override
        public final java.lang.String getAppBoundaryKey() {
            return this.appBoundaryKey;
        }

        @Override
        public final java.util.List<java.lang.String> getTagValues() {
            return this.tagValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("appBoundaryKey", om.valueToTree(this.getAppBoundaryKey()));
            data.set("tagValues", om.valueToTree(this.getTagValues()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruResourceCollection.DevopsguruResourceCollectionTags"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruResourceCollectionTags.Jsii$Proxy that = (DevopsguruResourceCollectionTags.Jsii$Proxy) o;

            if (!appBoundaryKey.equals(that.appBoundaryKey)) return false;
            return this.tagValues.equals(that.tagValues);
        }

        @Override
        public final int hashCode() {
            int result = this.appBoundaryKey.hashCode();
            result = 31 * result + (this.tagValues.hashCode());
            return result;
        }
    }
}
