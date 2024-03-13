import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import events = require("aws-cdk-lib/aws-events");
import targets = require("aws-cdk-lib/aws-events-targets");
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ColdstarterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const SERVICE_NAME = "Function";
    const COLDSTARTER_NAME = "Coldstarter";
    // run every 8 hours
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0 */3 * * ? *)"),
      ruleName: `${COLDSTARTER_NAME}Rule`,
    });

    const lambdaWithoutEnv = createLambda(
      this,
      SERVICE_NAME,
      "src/handler.js",
      false
    );
    const lambdaWithEnv = createLambda(
      this,
      `${SERVICE_NAME}WithEnv`,
      "src/handler.js",
      true
    );
    const coldStarter = createLambda(
      this,
      COLDSTARTER_NAME,
      "src/coldstarter.js",
      true
    );
    lambdaWithEnv.grantInvoke(coldStarter);
    lambdaWithoutEnv.grantInvoke(coldStarter);
    rule.addTarget(new targets.LambdaFunction(coldStarter));
  }
}

function createLambda(
  scope: Construct,
  name: string,
  handlerLocation: string,
  hasEnv: boolean
) {
  const logGroup = new logs.LogGroup(scope, `${name}LogGroup`, {
    logGroupName: `/aws/lambda/${name}`,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    retention: RetentionDays.ONE_WEEK,
  });

  return new NodejsFunction(scope, name, {
    entry: handlerLocation,
    timeout: cdk.Duration.seconds(10),
    functionName: name,
    memorySize: 512,
    runtime: Runtime.NODEJS_20_X,
    architecture: Architecture.ARM_64,
    awsSdkConnectionReuse: hasEnv,
    bundling: {
      metafile: false, //set to true to create the necessary metafile for https://esbuild.github.io/analyze/ to analyze the bundle
      minify: true,
      target: "esnext",
      format: OutputFormat.ESM,
      platform: "node",
      mainFields: ["module", "main"],
      externalModules: [
        "@aws-sdk/client-sso",
        "@aws-sdk/client-sso-oidc",
        "@aws-sdk/credential-provider-ini",
        "@aws-sdk/credential-provider-process",
        "@aws-sdk/credential-provider-sso",
        "@aws-sdk/credential-provider-web-identity",
        "@aws-sdk/token-providers",
      ],
      banner:
        "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
    },
    logGroup,
  });
}

const app = new cdk.App();
new ColdstarterStack(app, "Coldstarter");
app.synth();
