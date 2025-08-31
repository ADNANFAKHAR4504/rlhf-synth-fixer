package imports.aws.securityhub_configuration_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter")
@software.amazon.jsii.Jsii.Proxy(SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter.Jsii$Proxy.class)
public interface SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#name SecurityhubConfigurationPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#value_type SecurityhubConfigurationPolicy#value_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValueType();

    /**
     * bool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#bool SecurityhubConfigurationPolicy#bool}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool getBool() {
        return null;
    }

    /**
     * double block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#double SecurityhubConfigurationPolicy#double}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble getDoubleValue() {
        return null;
    }

    /**
     * enum block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enum SecurityhubConfigurationPolicy#enum}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum getEnumValue() {
        return null;
    }

    /**
     * enum_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enum_list SecurityhubConfigurationPolicy#enum_list}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct getEnumList() {
        return null;
    }

    /**
     * int block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#int SecurityhubConfigurationPolicy#int}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt getIntValue() {
        return null;
    }

    /**
     * int_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#int_list SecurityhubConfigurationPolicy#int_list}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct getIntList() {
        return null;
    }

    /**
     * string block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#string SecurityhubConfigurationPolicy#string}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString getString() {
        return null;
    }

    /**
     * string_list block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#string_list SecurityhubConfigurationPolicy#string_list}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct getStringList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter> {
        java.lang.String name;
        java.lang.String valueType;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool bool;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble doubleValue;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum enumValue;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct enumList;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt intValue;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct intList;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString string;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct stringList;

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#name SecurityhubConfigurationPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getValueType}
         * @param valueType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#value_type SecurityhubConfigurationPolicy#value_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder valueType(java.lang.String valueType) {
            this.valueType = valueType;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getBool}
         * @param bool bool block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#bool SecurityhubConfigurationPolicy#bool}
         * @return {@code this}
         */
        public Builder bool(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool bool) {
            this.bool = bool;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getDoubleValue}
         * @param doubleValue double block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#double SecurityhubConfigurationPolicy#double}
         * @return {@code this}
         */
        public Builder doubleValue(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble doubleValue) {
            this.doubleValue = doubleValue;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getEnumValue}
         * @param enumValue enum block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enum SecurityhubConfigurationPolicy#enum}
         * @return {@code this}
         */
        public Builder enumValue(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum enumValue) {
            this.enumValue = enumValue;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getEnumList}
         * @param enumList enum_list block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enum_list SecurityhubConfigurationPolicy#enum_list}
         * @return {@code this}
         */
        public Builder enumList(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct enumList) {
            this.enumList = enumList;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getIntValue}
         * @param intValue int block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#int SecurityhubConfigurationPolicy#int}
         * @return {@code this}
         */
        public Builder intValue(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt intValue) {
            this.intValue = intValue;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getIntList}
         * @param intList int_list block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#int_list SecurityhubConfigurationPolicy#int_list}
         * @return {@code this}
         */
        public Builder intList(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct intList) {
            this.intList = intList;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getString}
         * @param string string block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#string SecurityhubConfigurationPolicy#string}
         * @return {@code this}
         */
        public Builder string(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString string) {
            this.string = string;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter#getStringList}
         * @param stringList string_list block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#string_list SecurityhubConfigurationPolicy#string_list}
         * @return {@code this}
         */
        public Builder stringList(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct stringList) {
            this.stringList = stringList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter {
        private final java.lang.String name;
        private final java.lang.String valueType;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool bool;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble doubleValue;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum enumValue;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct enumList;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt intValue;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct intList;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString string;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct stringList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valueType = software.amazon.jsii.Kernel.get(this, "valueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bool = software.amazon.jsii.Kernel.get(this, "bool", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool.class));
            this.doubleValue = software.amazon.jsii.Kernel.get(this, "double", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble.class));
            this.enumValue = software.amazon.jsii.Kernel.get(this, "enum", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum.class));
            this.enumList = software.amazon.jsii.Kernel.get(this, "enumList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct.class));
            this.intValue = software.amazon.jsii.Kernel.get(this, "int", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt.class));
            this.intList = software.amazon.jsii.Kernel.get(this, "intList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct.class));
            this.string = software.amazon.jsii.Kernel.get(this, "string", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString.class));
            this.stringList = software.amazon.jsii.Kernel.get(this, "stringList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.valueType = java.util.Objects.requireNonNull(builder.valueType, "valueType is required");
            this.bool = builder.bool;
            this.doubleValue = builder.doubleValue;
            this.enumValue = builder.enumValue;
            this.enumList = builder.enumList;
            this.intValue = builder.intValue;
            this.intList = builder.intList;
            this.string = builder.string;
            this.stringList = builder.stringList;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getValueType() {
            return this.valueType;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool getBool() {
            return this.bool;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble getDoubleValue() {
            return this.doubleValue;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum getEnumValue() {
            return this.enumValue;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct getEnumList() {
            return this.enumList;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt getIntValue() {
            return this.intValue;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct getIntList() {
            return this.intList;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString getString() {
            return this.string;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct getStringList() {
            return this.stringList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("valueType", om.valueToTree(this.getValueType()));
            if (this.getBool() != null) {
                data.set("bool", om.valueToTree(this.getBool()));
            }
            if (this.getDoubleValue() != null) {
                data.set("double", om.valueToTree(this.getDoubleValue()));
            }
            if (this.getEnumValue() != null) {
                data.set("enum", om.valueToTree(this.getEnumValue()));
            }
            if (this.getEnumList() != null) {
                data.set("enumList", om.valueToTree(this.getEnumList()));
            }
            if (this.getIntValue() != null) {
                data.set("int", om.valueToTree(this.getIntValue()));
            }
            if (this.getIntList() != null) {
                data.set("intList", om.valueToTree(this.getIntList()));
            }
            if (this.getString() != null) {
                data.set("string", om.valueToTree(this.getString()));
            }
            if (this.getStringList() != null) {
                data.set("stringList", om.valueToTree(this.getStringList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter.Jsii$Proxy that = (SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!valueType.equals(that.valueType)) return false;
            if (this.bool != null ? !this.bool.equals(that.bool) : that.bool != null) return false;
            if (this.doubleValue != null ? !this.doubleValue.equals(that.doubleValue) : that.doubleValue != null) return false;
            if (this.enumValue != null ? !this.enumValue.equals(that.enumValue) : that.enumValue != null) return false;
            if (this.enumList != null ? !this.enumList.equals(that.enumList) : that.enumList != null) return false;
            if (this.intValue != null ? !this.intValue.equals(that.intValue) : that.intValue != null) return false;
            if (this.intList != null ? !this.intList.equals(that.intList) : that.intList != null) return false;
            if (this.string != null ? !this.string.equals(that.string) : that.string != null) return false;
            return this.stringList != null ? this.stringList.equals(that.stringList) : that.stringList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.valueType.hashCode());
            result = 31 * result + (this.bool != null ? this.bool.hashCode() : 0);
            result = 31 * result + (this.doubleValue != null ? this.doubleValue.hashCode() : 0);
            result = 31 * result + (this.enumValue != null ? this.enumValue.hashCode() : 0);
            result = 31 * result + (this.enumList != null ? this.enumList.hashCode() : 0);
            result = 31 * result + (this.intValue != null ? this.intValue.hashCode() : 0);
            result = 31 * result + (this.intList != null ? this.intList.hashCode() : 0);
            result = 31 * result + (this.string != null ? this.string.hashCode() : 0);
            result = 31 * result + (this.stringList != null ? this.stringList.hashCode() : 0);
            return result;
        }
    }
}
