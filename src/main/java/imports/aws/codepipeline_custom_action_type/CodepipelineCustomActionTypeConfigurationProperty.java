package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeConfigurationProperty")
@software.amazon.jsii.Jsii.Proxy(CodepipelineCustomActionTypeConfigurationProperty.Jsii$Proxy.class)
public interface CodepipelineCustomActionTypeConfigurationProperty extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#key CodepipelineCustomActionType#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#name CodepipelineCustomActionType#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#required CodepipelineCustomActionType#required}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRequired();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#secret CodepipelineCustomActionType#secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#description CodepipelineCustomActionType#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#queryable CodepipelineCustomActionType#queryable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#type CodepipelineCustomActionType#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineCustomActionTypeConfigurationProperty}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineCustomActionTypeConfigurationProperty}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineCustomActionTypeConfigurationProperty> {
        java.lang.Object key;
        java.lang.String name;
        java.lang.Object required;
        java.lang.Object secret;
        java.lang.String description;
        java.lang.Object queryable;
        java.lang.String type;

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#key CodepipelineCustomActionType#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.Boolean key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#key CodepipelineCustomActionType#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(com.hashicorp.cdktf.IResolvable key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#name CodepipelineCustomActionType#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#required CodepipelineCustomActionType#required}. This parameter is required.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#required CodepipelineCustomActionType#required}. This parameter is required.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getSecret}
         * @param secret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#secret CodepipelineCustomActionType#secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder secret(java.lang.Boolean secret) {
            this.secret = secret;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getSecret}
         * @param secret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#secret CodepipelineCustomActionType#secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder secret(com.hashicorp.cdktf.IResolvable secret) {
            this.secret = secret;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#description CodepipelineCustomActionType#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getQueryable}
         * @param queryable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#queryable CodepipelineCustomActionType#queryable}.
         * @return {@code this}
         */
        public Builder queryable(java.lang.Boolean queryable) {
            this.queryable = queryable;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getQueryable}
         * @param queryable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#queryable CodepipelineCustomActionType#queryable}.
         * @return {@code this}
         */
        public Builder queryable(com.hashicorp.cdktf.IResolvable queryable) {
            this.queryable = queryable;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeConfigurationProperty#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#type CodepipelineCustomActionType#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineCustomActionTypeConfigurationProperty}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineCustomActionTypeConfigurationProperty build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineCustomActionTypeConfigurationProperty}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineCustomActionTypeConfigurationProperty {
        private final java.lang.Object key;
        private final java.lang.String name;
        private final java.lang.Object required;
        private final java.lang.Object secret;
        private final java.lang.String description;
        private final java.lang.Object queryable;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.secret = software.amazon.jsii.Kernel.get(this, "secret", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryable = software.amazon.jsii.Kernel.get(this, "queryable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.required = java.util.Objects.requireNonNull(builder.required, "required is required");
            this.secret = java.util.Objects.requireNonNull(builder.secret, "secret is required");
            this.description = builder.description;
            this.queryable = builder.queryable;
            this.type = builder.type;
        }

        @Override
        public final java.lang.Object getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        public final java.lang.Object getSecret() {
            return this.secret;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getQueryable() {
            return this.queryable;
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

            data.set("key", om.valueToTree(this.getKey()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("required", om.valueToTree(this.getRequired()));
            data.set("secret", om.valueToTree(this.getSecret()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getQueryable() != null) {
                data.set("queryable", om.valueToTree(this.getQueryable()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipelineCustomActionType.CodepipelineCustomActionTypeConfigurationProperty"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineCustomActionTypeConfigurationProperty.Jsii$Proxy that = (CodepipelineCustomActionTypeConfigurationProperty.Jsii$Proxy) o;

            if (!key.equals(that.key)) return false;
            if (!name.equals(that.name)) return false;
            if (!required.equals(that.required)) return false;
            if (!secret.equals(that.secret)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.queryable != null ? !this.queryable.equals(that.queryable) : that.queryable != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.key.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.required.hashCode());
            result = 31 * result + (this.secret.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.queryable != null ? this.queryable.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
