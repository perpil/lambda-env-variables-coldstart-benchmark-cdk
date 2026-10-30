import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import events = require("aws-cdk-lib/aws-events");
import targets = require("aws-cdk-lib/aws-events-targets");
import { Architecture, Function } from "aws-cdk-lib/aws-lambda";
import { LlrtFunction } from "cdk-lambda-llrt"

export interface ColdstarterStackProps extends cdk.StackProps {
  readonly functions?: string[];
}

export const DEFAULT_FUNCTIONS = [
  "StrippedDownLlrt",
  "StrippedDownLlrtRaw",
];

export class ColdstarterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ColdstarterStackProps) {
    super(scope, id, props);
    const COLDSTARTER_NAME = "Coldstarter";
    const functions = props?.functions ?? DEFAULT_FUNCTIONS;

    // space out at least every 8 minutes so lambda runtime is shutdown
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(7,16,24,33,41,49,57 * * * ? *)"),
      enabled: false
    });

    const coldStarter = createLambda(
      this,
      COLDSTARTER_NAME,
      "src/coldstarter.js",
      functions,
    );

    for (const functionName of functions) {
      let lambdaFunction = Function.fromFunctionArn(this, functionName, `arn:aws:lambda:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:function:${functionName}`);
      lambdaFunction.grantInvoke(coldStarter);
    }
    rule.addTarget(new targets.LambdaFunction(coldStarter));
  }
}

function createLambda(
  scope: Construct,
  name: string,
  handlerLocation: string,
  targetFunctions: string[],
) {
  // const logGroup = new logs.LogGroup(scope, `${name}LogGroup`, {
  //   logGroupName: `/aws/lambda/${name}`,
  //   removalPolicy: cdk.RemovalPolicy.DESTROY,
  //   retention: RetentionDays.ONE_WEEK,
  // });

  /*return new NodejsFunction(scope, name, {
    entry: handlerLocation,
    timeout: cdk.Duration.seconds(10),
    functionName: name,
    memorySize: 512,
    runtime: Runtime.NODEJS_20_X,
    architecture: Architecture.ARM_64,
    awsSdkConnectionReuse: false,
    bundling: {
      metafile: false, //set to true to create the necessary metafile for https://esbuild.github.io/analyze/ to analyze the bundle
      minify: false,
      keepNames: false,
      target: "esnext",
      format: OutputFormat.ESM,
      platform: "node",
      mainFields: ["module", "main"],
      externalModules: [
                "@aws-sdk/client-sso",
                "@aws-sdk/client-sso-oidc",
                "@smithy/credential-provider-imds",
                "@aws-sdk/credential-provider-ini",
                "@aws-sdk/credential-provider-http",
                "@aws-sdk/credential-provider-process",
                "@aws-sdk/credential-provider-sso",
                "@aws-sdk/credential-provider-web-identity",
                "@aws-sdk/token-providers",
              ],
      //,
      //banner:
      //  "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')//).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
    },
    //logGroup,
  });*/
  return new LlrtFunction(scope, name, {
    entry: handlerLocation,
    timeout: cdk.Duration.seconds(10),
    functionName: name,
    memorySize: 256,
    architecture: Architecture.ARM_64,
    environment: {
      "FUNCTIONS": targetFunctions.join(","),
    }
  });
}

//Lambda logs
//https://speedrun-api.us-west-2.nobackspacecrew.com/v1/federate/320877393516?role=speedrun-Admin&logout=false&destination=https%3A%2F%2Fus-east-2.console.aws.amazon.com%2Fcloudwatch%2Fdeeplink.js%3Fregion%3Dus-east-2%23logsV2%3Alogs-insights%243FqueryDetail%243D%7E%28end%7E0%7Estart%7E-43200%7EtimeType%7E%27RELATIVE%7Etz%7E%27LOCAL%7Eunit%7E%27seconds%7EeditorString%7E%27filter*20ispresent*28*40initDuration*29*20*7c*0a*20stats*20count*28*40initDuration*29*20as*20samples*2c*20pct*28*40initDuration*2b*40duration*2c0*29*20as*20p0*2c*20*0apct*28*40initDuration*2b*40duration*2c50*29*20as*20p50*2c*20pct*28*40initDuration*2b*40duration*2c90*29*20as*20p90*2c*20pct*28*40initDuration*2b*40duration*2c95*29*20as*20p95*2c*20pct*28*40initDuration*2b*40duration*2c99*29*20as*20p99*2c*20pct*28*40initDuration*2b*40duration*2c100*29*20as*20p100*20by*20replace*28*40log*2c*22320877393516*3a*2faws*2flambda*2f*22*2c*22*22*29*20as*20test*0a*7c*20order*20by*20p0%7EqueryId%7E%2709262486-21b2-44f5-b98c-56405854ed9a%7Esource%7E%28%7E%27*2faws*2flambda*2fFastColdstart%7E%27*2faws*2flambda*2fSlowColdstart%7E%27*2faws*2flambda*2fMediumColdstart%7E%27*2faws*2flambda*2fAwsLiteColdstart%7E%27*2faws*2flambda*2fLLRTColdstart%29%7Elang%7E%27CWLI%29

//Coldstarter logs
//https://speedrun-api.us-west-2.nobackspacecrew.com/v1/federate/320877393516?role=speedrun-Admin&logout=false&destination=https%3A%2F%2Fus-east-2.console.aws.amazon.com%2Fcloudwatch%2Fdeeplink.js%3Fregion%3Dus-east-2%23logsV2%3Alogs-insights%243FqueryDetail%243D%7E%28end%7E0%7Estart%7E-86400%7EtimeType%7E%27RELATIVE%7Etz%7E%27LOCAL%7Eunit%7E%27seconds%7EeditorString%7E%27filter*20ispresent*28coldstart*29*20and*20*20coldstart*20*3d*201*0a*7c*20stats*20count*28latency*29*20as*20samples*2c*20pct*28latency*2c0*29*20as*20p0*2c*20*0apct*28latency*2c50*29*20as*20p50*2c*20pct*28latency*2c90*29*20as*20p90*2c*20pct*28latency*2c95*29*20as*20p95*2c*20pct*28latency*2c99*29*20as*20p99*2c*20pct*28latency*2c100*29*20as*20p100*20by*20funcName*0a*7c*20order*20by*20p0%7EqueryId%7E%2756209990-7941-48c8-b728-1674e01322be%7Esource%7E%28%7E%27*2faws*2flambda*2fColdstarter%29%7Elang%7E%27CWLI%29
// 
//Coldstarter Sept 24 2025
//https://speedrun-api.us-west-2.nobackspacecrew.com/v1/federate/320877393516?role=speedrun-Admin&logout=false&destination=https%3A%2F%2Fus-east-2.console.aws.amazon.com%2Fcloudwatch%2Fdeeplink.js%3Fregion%3Dus-east-2%23logsV2%3Alogs-insights%243FqueryDetail%243D%7E%28end%7E0%7Estart%7E-86400%7EtimeType%7E%27RELATIVE%7Etz%7E%27LOCAL%7Eunit%7E%27seconds%7EeditorString%7E%27filter*20ispresent*28coldstart*29*20and*20coldstart*20*3d*201*0a*7c*20stats*20count*28*2a*29*20as*20samples*2c*20pct*28latency*2c0*29*20as*20*60p0*28E2E*29*60*2c*20pct*28latency*2c50*29*20as*20*60p50*28E2E*29*60*2c*20*20pct*28latency*2c99*29*20as*20*60p99*28E2E*29*60*2c*20pct*28latency-billedDuration*2c*2050*29*20as*20overhead*2c*0a*20*20pct*28billedDuration*2c*200*29*20as*20*60p0*28BilledDuration*29*60*2c*20pct*28billedDuration*2c*2050*29*20as*20*60p50*28BilledDuration*29*60*2cpct*28billedDuration*2c*2099*29*20as*20*60p99*28BilledDuration*29*60*20*0a*20*20by*20funcName*2cmemory*0a*7c*20order*20by*20*60p50*28E2E*29*60%7EqueryId%7E%275a6878ae-fd31-4a0c-b5a0-d0fd73b02fbf%7Esource%7E%28%7E%27*2faws*2flambda*2fColdstarter%29%7Elang%7E%27CWLI%29
