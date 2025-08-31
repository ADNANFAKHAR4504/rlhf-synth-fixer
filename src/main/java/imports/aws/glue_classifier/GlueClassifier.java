package imports.aws.glue_classifier;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier aws_glue_classifier}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueClassifier.GlueClassifier")
public class GlueClassifier extends com.hashicorp.cdktf.TerraformResource {

    protected GlueClassifier(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueClassifier(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.glue_classifier.GlueClassifier.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier aws_glue_classifier} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GlueClassifier(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GlueClassifier resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GlueClassifier to import. This parameter is required.
     * @param importFromId The id of the existing GlueClassifier that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GlueClassifier to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.glue_classifier.GlueClassifier.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GlueClassifier resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GlueClassifier to import. This parameter is required.
     * @param importFromId The id of the existing GlueClassifier that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.glue_classifier.GlueClassifier.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCsvClassifier(final @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierCsvClassifier value) {
        software.amazon.jsii.Kernel.call(this, "putCsvClassifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGrokClassifier(final @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierGrokClassifier value) {
        software.amazon.jsii.Kernel.call(this, "putGrokClassifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJsonClassifier(final @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierJsonClassifier value) {
        software.amazon.jsii.Kernel.call(this, "putJsonClassifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putXmlClassifier(final @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierXmlClassifier value) {
        software.amazon.jsii.Kernel.call(this, "putXmlClassifier", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCsvClassifier() {
        software.amazon.jsii.Kernel.call(this, "resetCsvClassifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrokClassifier() {
        software.amazon.jsii.Kernel.call(this, "resetGrokClassifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJsonClassifier() {
        software.amazon.jsii.Kernel.call(this, "resetJsonClassifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXmlClassifier() {
        software.amazon.jsii.Kernel.call(this, "resetXmlClassifier", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierCsvClassifierOutputReference getCsvClassifier() {
        return software.amazon.jsii.Kernel.get(this, "csvClassifier", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierCsvClassifierOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierGrokClassifierOutputReference getGrokClassifier() {
        return software.amazon.jsii.Kernel.get(this, "grokClassifier", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierGrokClassifierOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierJsonClassifierOutputReference getJsonClassifier() {
        return software.amazon.jsii.Kernel.get(this, "jsonClassifier", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierJsonClassifierOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_classifier.GlueClassifierXmlClassifierOutputReference getXmlClassifier() {
        return software.amazon.jsii.Kernel.get(this, "xmlClassifier", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierXmlClassifierOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierCsvClassifier getCsvClassifierInput() {
        return software.amazon.jsii.Kernel.get(this, "csvClassifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierCsvClassifier.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierGrokClassifier getGrokClassifierInput() {
        return software.amazon.jsii.Kernel.get(this, "grokClassifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierGrokClassifier.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierJsonClassifier getJsonClassifierInput() {
        return software.amazon.jsii.Kernel.get(this, "jsonClassifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierJsonClassifier.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierXmlClassifier getXmlClassifierInput() {
        return software.amazon.jsii.Kernel.get(this, "xmlClassifierInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierXmlClassifier.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.glue_classifier.GlueClassifier}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.glue_classifier.GlueClassifier> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.glue_classifier.GlueClassifierConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.glue_classifier.GlueClassifierConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#name GlueClassifier#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#name GlueClassifier#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * csv_classifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#csv_classifier GlueClassifier#csv_classifier}
         * <p>
         * @return {@code this}
         * @param csvClassifier csv_classifier block. This parameter is required.
         */
        public Builder csvClassifier(final imports.aws.glue_classifier.GlueClassifierCsvClassifier csvClassifier) {
            this.config.csvClassifier(csvClassifier);
            return this;
        }

        /**
         * grok_classifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#grok_classifier GlueClassifier#grok_classifier}
         * <p>
         * @return {@code this}
         * @param grokClassifier grok_classifier block. This parameter is required.
         */
        public Builder grokClassifier(final imports.aws.glue_classifier.GlueClassifierGrokClassifier grokClassifier) {
            this.config.grokClassifier(grokClassifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#id GlueClassifier#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#id GlueClassifier#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * json_classifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#json_classifier GlueClassifier#json_classifier}
         * <p>
         * @return {@code this}
         * @param jsonClassifier json_classifier block. This parameter is required.
         */
        public Builder jsonClassifier(final imports.aws.glue_classifier.GlueClassifierJsonClassifier jsonClassifier) {
            this.config.jsonClassifier(jsonClassifier);
            return this;
        }

        /**
         * xml_classifier block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#xml_classifier GlueClassifier#xml_classifier}
         * <p>
         * @return {@code this}
         * @param xmlClassifier xml_classifier block. This parameter is required.
         */
        public Builder xmlClassifier(final imports.aws.glue_classifier.GlueClassifierXmlClassifier xmlClassifier) {
            this.config.xmlClassifier(xmlClassifier);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.glue_classifier.GlueClassifier}.
         */
        @Override
        public imports.aws.glue_classifier.GlueClassifier build() {
            return new imports.aws.glue_classifier.GlueClassifier(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
