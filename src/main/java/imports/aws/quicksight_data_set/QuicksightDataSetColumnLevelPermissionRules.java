package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetColumnLevelPermissionRules")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetColumnLevelPermissionRules.Jsii$Proxy.class)
public interface QuicksightDataSetColumnLevelPermissionRules extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_names QuicksightDataSet#column_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColumnNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principals QuicksightDataSet#principals}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrincipals() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetColumnLevelPermissionRules}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetColumnLevelPermissionRules}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetColumnLevelPermissionRules> {
        java.util.List<java.lang.String> columnNames;
        java.util.List<java.lang.String> principals;

        /**
         * Sets the value of {@link QuicksightDataSetColumnLevelPermissionRules#getColumnNames}
         * @param columnNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_names QuicksightDataSet#column_names}.
         * @return {@code this}
         */
        public Builder columnNames(java.util.List<java.lang.String> columnNames) {
            this.columnNames = columnNames;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetColumnLevelPermissionRules#getPrincipals}
         * @param principals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#principals QuicksightDataSet#principals}.
         * @return {@code this}
         */
        public Builder principals(java.util.List<java.lang.String> principals) {
            this.principals = principals;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetColumnLevelPermissionRules}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetColumnLevelPermissionRules build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetColumnLevelPermissionRules}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetColumnLevelPermissionRules {
        private final java.util.List<java.lang.String> columnNames;
        private final java.util.List<java.lang.String> principals;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnNames = software.amazon.jsii.Kernel.get(this, "columnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principals = software.amazon.jsii.Kernel.get(this, "principals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnNames = builder.columnNames;
            this.principals = builder.principals;
        }

        @Override
        public final java.util.List<java.lang.String> getColumnNames() {
            return this.columnNames;
        }

        @Override
        public final java.util.List<java.lang.String> getPrincipals() {
            return this.principals;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColumnNames() != null) {
                data.set("columnNames", om.valueToTree(this.getColumnNames()));
            }
            if (this.getPrincipals() != null) {
                data.set("principals", om.valueToTree(this.getPrincipals()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetColumnLevelPermissionRules"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetColumnLevelPermissionRules.Jsii$Proxy that = (QuicksightDataSetColumnLevelPermissionRules.Jsii$Proxy) o;

            if (this.columnNames != null ? !this.columnNames.equals(that.columnNames) : that.columnNames != null) return false;
            return this.principals != null ? this.principals.equals(that.principals) : that.principals == null;
        }

        @Override
        public final int hashCode() {
            int result = this.columnNames != null ? this.columnNames.hashCode() : 0;
            result = 31 * result + (this.principals != null ? this.principals.hashCode() : 0);
            return result;
        }
    }
}
