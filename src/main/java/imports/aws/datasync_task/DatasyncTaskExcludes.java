package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskExcludes")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskExcludes.Jsii$Proxy.class)
public interface DatasyncTaskExcludes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskExcludes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskExcludes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskExcludes> {
        java.lang.String filterType;
        java.lang.String value;

        /**
         * Sets the value of {@link DatasyncTaskExcludes#getFilterType}
         * @param filterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#filter_type DatasyncTask#filter_type}.
         * @return {@code this}
         */
        public Builder filterType(java.lang.String filterType) {
            this.filterType = filterType;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskExcludes#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#value DatasyncTask#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncTaskExcludes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskExcludes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskExcludes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskExcludes {
        private final java.lang.String filterType;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.filterType = software.amazon.jsii.Kernel.get(this, "filterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.filterType = builder.filterType;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getFilterType() {
            return this.filterType;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFilterType() != null) {
                data.set("filterType", om.valueToTree(this.getFilterType()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskExcludes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskExcludes.Jsii$Proxy that = (DatasyncTaskExcludes.Jsii$Proxy) o;

            if (this.filterType != null ? !this.filterType.equals(that.filterType) : that.filterType != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.filterType != null ? this.filterType.hashCode() : 0;
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
