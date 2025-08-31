package app;

import com.hashicorp.cdktf.App;


public class Main
{
    public static void main(String[] args) {
        final App app = new App();
        new MainStack(app, "cdktf-java");
        app.synth();
    }
}