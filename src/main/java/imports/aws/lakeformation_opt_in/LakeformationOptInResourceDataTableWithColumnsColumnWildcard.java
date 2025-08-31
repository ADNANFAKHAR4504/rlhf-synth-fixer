package imports.aws.lakeformation_opt_in;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.492Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptInResourceDataTableWithColumnsColumnWildcard")
@software.amazon.jsii.Jsii.Proxy(LakeformationOptInResourceDataTableWithColumnsColumnWildcard.Jsii$Proxy.class)
public interface LakeformationOptInResourceDataTableWithColumnsColumnWildcard extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#excluded_column_names LakeformationOptIn#excluded_column_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedColumnNames() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationOptInResourceDataTableWithColumnsColumnWildcard}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationOptInResourceDataTableWithColumnsColumnWildcard}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationOptInResourceDataTableWithColumnsColumnWildcard> {
        java.util.List<java.lang.String> excludedColumnNames;

        /**
         * Sets the value of {@link LakeformationOptInResourceDataTableWithColumnsColumnWildcard#getExcludedColumnNames}
         * @param excludedColumnNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#excluded_column_names LakeformationOptIn#excluded_column_names}.
         * @return {@code this}
         */
        public Builder excludedColumnNames(java.util.List<java.lang.String> excludedColumnNames) {
            this.excludedColumnNames = excludedColumnNames;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationOptInResourceDataTableWithColumnsColumnWildcard}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationOptInResourceDataTableWithColumnsColumnWildcard build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationOptInResourceDataTableWithColumnsColumnWildcard}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationOptInResourceDataTableWithColumnsColumnWildcard {
        private final java.util.List<java.lang.String> excludedColumnNames;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.excludedColumnNames = software.amazon.jsii.Kernel.get(this, "excludedColumnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.excludedColumnNames = builder.excludedColumnNames;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludedColumnNames() {
            return this.excludedColumnNames;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExcludedColumnNames() != null) {
                data.set("excludedColumnNames", om.valueToTree(this.getExcludedColumnNames()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationOptIn.LakeformationOptInResourceDataTableWithColumnsColumnWildcard"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationOptInResourceDataTableWithColumnsColumnWildcard.Jsii$Proxy that = (LakeformationOptInResourceDataTableWithColumnsColumnWildcard.Jsii$Proxy) o;

            return this.excludedColumnNames != null ? this.excludedColumnNames.equals(that.excludedColumnNames) : that.excludedColumnNames == null;
        }

        @Override
        public final int hashCode() {
            int result = this.excludedColumnNames != null ? this.excludedColumnNames.hashCode() : 0;
            return result;
        }
    }
}
