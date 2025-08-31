package imports.aws.data_aws_ce_tags;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.496Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCeTags.DataAwsCeTagsTimePeriod")
@software.amazon.jsii.Jsii.Proxy(DataAwsCeTagsTimePeriod.Jsii$Proxy.class)
public interface DataAwsCeTagsTimePeriod extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ce_tags#end DataAwsCeTags#end}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnd();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ce_tags#start DataAwsCeTags#start}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStart();

    /**
     * @return a {@link Builder} of {@link DataAwsCeTagsTimePeriod}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCeTagsTimePeriod}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCeTagsTimePeriod> {
        java.lang.String end;
        java.lang.String start;

        /**
         * Sets the value of {@link DataAwsCeTagsTimePeriod#getEnd}
         * @param end Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ce_tags#end DataAwsCeTags#end}. This parameter is required.
         * @return {@code this}
         */
        public Builder end(java.lang.String end) {
            this.end = end;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsCeTagsTimePeriod#getStart}
         * @param start Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ce_tags#start DataAwsCeTags#start}. This parameter is required.
         * @return {@code this}
         */
        public Builder start(java.lang.String start) {
            this.start = start;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCeTagsTimePeriod}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCeTagsTimePeriod build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCeTagsTimePeriod}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCeTagsTimePeriod {
        private final java.lang.String end;
        private final java.lang.String start;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.end = software.amazon.jsii.Kernel.get(this, "end", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.start = software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.end = java.util.Objects.requireNonNull(builder.end, "end is required");
            this.start = java.util.Objects.requireNonNull(builder.start, "start is required");
        }

        @Override
        public final java.lang.String getEnd() {
            return this.end;
        }

        @Override
        public final java.lang.String getStart() {
            return this.start;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("end", om.valueToTree(this.getEnd()));
            data.set("start", om.valueToTree(this.getStart()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCeTags.DataAwsCeTagsTimePeriod"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCeTagsTimePeriod.Jsii$Proxy that = (DataAwsCeTagsTimePeriod.Jsii$Proxy) o;

            if (!end.equals(that.end)) return false;
            return this.start.equals(that.start);
        }

        @Override
        public final int hashCode() {
            int result = this.end.hashCode();
            result = 31 * result + (this.start.hashCode());
            return result;
        }
    }
}
