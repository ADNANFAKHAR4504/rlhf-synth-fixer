package imports.aws.resourcegroups_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resourcegroupsGroup.ResourcegroupsGroupResourceQuery")
@software.amazon.jsii.Jsii.Proxy(ResourcegroupsGroupResourceQuery.Jsii$Proxy.class)
public interface ResourcegroupsGroupResourceQuery extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#query ResourcegroupsGroup#query}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQuery();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#type ResourcegroupsGroup#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ResourcegroupsGroupResourceQuery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ResourcegroupsGroupResourceQuery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ResourcegroupsGroupResourceQuery> {
        java.lang.String query;
        java.lang.String type;

        /**
         * Sets the value of {@link ResourcegroupsGroupResourceQuery#getQuery}
         * @param query Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#query ResourcegroupsGroup#query}. This parameter is required.
         * @return {@code this}
         */
        public Builder query(java.lang.String query) {
            this.query = query;
            return this;
        }

        /**
         * Sets the value of {@link ResourcegroupsGroupResourceQuery#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#type ResourcegroupsGroup#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ResourcegroupsGroupResourceQuery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ResourcegroupsGroupResourceQuery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ResourcegroupsGroupResourceQuery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ResourcegroupsGroupResourceQuery {
        private final java.lang.String query;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.query = software.amazon.jsii.Kernel.get(this, "query", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.query = java.util.Objects.requireNonNull(builder.query, "query is required");
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getQuery() {
            return this.query;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("query", om.valueToTree(this.getQuery()));
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resourcegroupsGroup.ResourcegroupsGroupResourceQuery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ResourcegroupsGroupResourceQuery.Jsii$Proxy that = (ResourcegroupsGroupResourceQuery.Jsii$Proxy) o;

            if (!query.equals(that.query)) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.query.hashCode();
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
