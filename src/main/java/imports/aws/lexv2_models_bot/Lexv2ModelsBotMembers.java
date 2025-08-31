package imports.aws.lexv2_models_bot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.548Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBot.Lexv2ModelsBotMembers")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsBotMembers.Jsii$Proxy.class)
public interface Lexv2ModelsBotMembers extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#alias_id Lexv2ModelsBot#alias_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAliasId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#alias_name Lexv2ModelsBot#alias_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAliasName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#id Lexv2ModelsBot#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#name Lexv2ModelsBot#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#version Lexv2ModelsBot#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsBotMembers}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsBotMembers}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsBotMembers> {
        java.lang.String aliasId;
        java.lang.String aliasName;
        java.lang.String id;
        java.lang.String name;
        java.lang.String version;

        /**
         * Sets the value of {@link Lexv2ModelsBotMembers#getAliasId}
         * @param aliasId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#alias_id Lexv2ModelsBot#alias_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder aliasId(java.lang.String aliasId) {
            this.aliasId = aliasId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotMembers#getAliasName}
         * @param aliasName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#alias_name Lexv2ModelsBot#alias_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder aliasName(java.lang.String aliasName) {
            this.aliasName = aliasName;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotMembers#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#id Lexv2ModelsBot#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotMembers#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#name Lexv2ModelsBot#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsBotMembers#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot#version Lexv2ModelsBot#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsBotMembers}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsBotMembers build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsBotMembers}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsBotMembers {
        private final java.lang.String aliasId;
        private final java.lang.String aliasName;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.String version;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aliasId = software.amazon.jsii.Kernel.get(this, "aliasId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.aliasName = software.amazon.jsii.Kernel.get(this, "aliasName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aliasId = java.util.Objects.requireNonNull(builder.aliasId, "aliasId is required");
            this.aliasName = java.util.Objects.requireNonNull(builder.aliasName, "aliasName is required");
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
        }

        @Override
        public final java.lang.String getAliasId() {
            return this.aliasId;
        }

        @Override
        public final java.lang.String getAliasName() {
            return this.aliasName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("aliasId", om.valueToTree(this.getAliasId()));
            data.set("aliasName", om.valueToTree(this.getAliasName()));
            data.set("id", om.valueToTree(this.getId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("version", om.valueToTree(this.getVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsBot.Lexv2ModelsBotMembers"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsBotMembers.Jsii$Proxy that = (Lexv2ModelsBotMembers.Jsii$Proxy) o;

            if (!aliasId.equals(that.aliasId)) return false;
            if (!aliasName.equals(that.aliasName)) return false;
            if (!id.equals(that.id)) return false;
            if (!name.equals(that.name)) return false;
            return this.version.equals(that.version);
        }

        @Override
        public final int hashCode() {
            int result = this.aliasId.hashCode();
            result = 31 * result + (this.aliasName.hashCode());
            result = 31 * result + (this.id.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.version.hashCode());
            return result;
        }
    }
}
