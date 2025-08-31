package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolSchema")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolSchema.Jsii$Proxy.class)
public interface CognitoUserPoolSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#attribute_data_type CognitoUserPool#attribute_data_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributeDataType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#name CognitoUserPool#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#developer_only_attribute CognitoUserPool#developer_only_attribute}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeveloperOnlyAttribute() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#mutable CognitoUserPool#mutable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMutable() {
        return null;
    }

    /**
     * number_attribute_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#number_attribute_constraints CognitoUserPool#number_attribute_constraints}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints getNumberAttributeConstraints() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#required CognitoUserPool#required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequired() {
        return null;
    }

    /**
     * string_attribute_constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#string_attribute_constraints CognitoUserPool#string_attribute_constraints}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints getStringAttributeConstraints() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolSchema> {
        java.lang.String attributeDataType;
        java.lang.String name;
        java.lang.Object developerOnlyAttribute;
        java.lang.Object mutable;
        imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints numberAttributeConstraints;
        java.lang.Object required;
        imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints stringAttributeConstraints;

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getAttributeDataType}
         * @param attributeDataType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#attribute_data_type CognitoUserPool#attribute_data_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributeDataType(java.lang.String attributeDataType) {
            this.attributeDataType = attributeDataType;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#name CognitoUserPool#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getDeveloperOnlyAttribute}
         * @param developerOnlyAttribute Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#developer_only_attribute CognitoUserPool#developer_only_attribute}.
         * @return {@code this}
         */
        public Builder developerOnlyAttribute(java.lang.Boolean developerOnlyAttribute) {
            this.developerOnlyAttribute = developerOnlyAttribute;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getDeveloperOnlyAttribute}
         * @param developerOnlyAttribute Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#developer_only_attribute CognitoUserPool#developer_only_attribute}.
         * @return {@code this}
         */
        public Builder developerOnlyAttribute(com.hashicorp.cdktf.IResolvable developerOnlyAttribute) {
            this.developerOnlyAttribute = developerOnlyAttribute;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getMutable}
         * @param mutable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#mutable CognitoUserPool#mutable}.
         * @return {@code this}
         */
        public Builder mutable(java.lang.Boolean mutable) {
            this.mutable = mutable;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getMutable}
         * @param mutable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#mutable CognitoUserPool#mutable}.
         * @return {@code this}
         */
        public Builder mutable(com.hashicorp.cdktf.IResolvable mutable) {
            this.mutable = mutable;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getNumberAttributeConstraints}
         * @param numberAttributeConstraints number_attribute_constraints block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#number_attribute_constraints CognitoUserPool#number_attribute_constraints}
         * @return {@code this}
         */
        public Builder numberAttributeConstraints(imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints numberAttributeConstraints) {
            this.numberAttributeConstraints = numberAttributeConstraints;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#required CognitoUserPool#required}.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#required CognitoUserPool#required}.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolSchema#getStringAttributeConstraints}
         * @param stringAttributeConstraints string_attribute_constraints block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#string_attribute_constraints CognitoUserPool#string_attribute_constraints}
         * @return {@code this}
         */
        public Builder stringAttributeConstraints(imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints stringAttributeConstraints) {
            this.stringAttributeConstraints = stringAttributeConstraints;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolSchema {
        private final java.lang.String attributeDataType;
        private final java.lang.String name;
        private final java.lang.Object developerOnlyAttribute;
        private final java.lang.Object mutable;
        private final imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints numberAttributeConstraints;
        private final java.lang.Object required;
        private final imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints stringAttributeConstraints;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributeDataType = software.amazon.jsii.Kernel.get(this, "attributeDataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.developerOnlyAttribute = software.amazon.jsii.Kernel.get(this, "developerOnlyAttribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mutable = software.amazon.jsii.Kernel.get(this, "mutable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.numberAttributeConstraints = software.amazon.jsii.Kernel.get(this, "numberAttributeConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringAttributeConstraints = software.amazon.jsii.Kernel.get(this, "stringAttributeConstraints", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributeDataType = java.util.Objects.requireNonNull(builder.attributeDataType, "attributeDataType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.developerOnlyAttribute = builder.developerOnlyAttribute;
            this.mutable = builder.mutable;
            this.numberAttributeConstraints = builder.numberAttributeConstraints;
            this.required = builder.required;
            this.stringAttributeConstraints = builder.stringAttributeConstraints;
        }

        @Override
        public final java.lang.String getAttributeDataType() {
            return this.attributeDataType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getDeveloperOnlyAttribute() {
            return this.developerOnlyAttribute;
        }

        @Override
        public final java.lang.Object getMutable() {
            return this.mutable;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolSchemaNumberAttributeConstraints getNumberAttributeConstraints() {
            return this.numberAttributeConstraints;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        public final imports.aws.cognito_user_pool.CognitoUserPoolSchemaStringAttributeConstraints getStringAttributeConstraints() {
            return this.stringAttributeConstraints;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attributeDataType", om.valueToTree(this.getAttributeDataType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDeveloperOnlyAttribute() != null) {
                data.set("developerOnlyAttribute", om.valueToTree(this.getDeveloperOnlyAttribute()));
            }
            if (this.getMutable() != null) {
                data.set("mutable", om.valueToTree(this.getMutable()));
            }
            if (this.getNumberAttributeConstraints() != null) {
                data.set("numberAttributeConstraints", om.valueToTree(this.getNumberAttributeConstraints()));
            }
            if (this.getRequired() != null) {
                data.set("required", om.valueToTree(this.getRequired()));
            }
            if (this.getStringAttributeConstraints() != null) {
                data.set("stringAttributeConstraints", om.valueToTree(this.getStringAttributeConstraints()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolSchema.Jsii$Proxy that = (CognitoUserPoolSchema.Jsii$Proxy) o;

            if (!attributeDataType.equals(that.attributeDataType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.developerOnlyAttribute != null ? !this.developerOnlyAttribute.equals(that.developerOnlyAttribute) : that.developerOnlyAttribute != null) return false;
            if (this.mutable != null ? !this.mutable.equals(that.mutable) : that.mutable != null) return false;
            if (this.numberAttributeConstraints != null ? !this.numberAttributeConstraints.equals(that.numberAttributeConstraints) : that.numberAttributeConstraints != null) return false;
            if (this.required != null ? !this.required.equals(that.required) : that.required != null) return false;
            return this.stringAttributeConstraints != null ? this.stringAttributeConstraints.equals(that.stringAttributeConstraints) : that.stringAttributeConstraints == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributeDataType.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.developerOnlyAttribute != null ? this.developerOnlyAttribute.hashCode() : 0);
            result = 31 * result + (this.mutable != null ? this.mutable.hashCode() : 0);
            result = 31 * result + (this.numberAttributeConstraints != null ? this.numberAttributeConstraints.hashCode() : 0);
            result = 31 * result + (this.required != null ? this.required.hashCode() : 0);
            result = 31 * result + (this.stringAttributeConstraints != null ? this.stringAttributeConstraints.hashCode() : 0);
            return result;
        }
    }
}
