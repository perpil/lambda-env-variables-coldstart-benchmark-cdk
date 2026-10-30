# About
This was used to test whether using environment variables in Lambda impact coldstarts.  It runs a Lambda every 3 hours to test coldstart times. [Here](https://speedrun.nobackspacecrew.com/blog/2024/03/13/lambda-environment-variables-impact-on-coldstarts.html) is the companion blog post.

## Deployment

```
npm install
npx cdk deploy
```

## Important files

* [lib/coldstarter-stack.ts](lib/coldstarter-stack.ts) - Defines the stack
* [src/coldstarter.js](src/coldstarter.js) - The Lambda function that invokes the other lambda functions and emits latency logs
* [src/handler.js](src/handler.js) - The Lambda function which has environment variables or not.

## CloudWatch Insights Queries
To get Init Duration deltas run this on `/aws/lambda/Function` and `/aws/lambda/FunctionWithEnv` simultaneously:
```
filter ispresent(@initDuration) |
stats max(@initDuration)-min(@initDuration) as delta by bin(2h) | stats min(delta) as min, avg(delta) as avg, pct(delta,50) as p50, max(delta) as max
```

To get E2E latency deltas run this on `/aws/lambda/Coldstarter`:
```
filter ispresent(coldstart) and coldstart >0
| stats min(latency) as mi, max(latency) as ma by bin(2h) as bucket
| stats min(ma-mi) as min, avg(ma-mi) as avg, pct(ma-mi,50) as p50,pct(ma-mi,90) as p90, pct(ma-mi,95) as p95, max(ma-mi) as max
```

Latest coldstart latency by function and memory
```
filter coldstart=1 
| stats count(*), avg(duration), pct(coldstartDuration, 0) as p0, pct(coldstartDuration,50) as p50, pct(coldstartDuration,99) as p99,
 pct(latency,0) as `E2E P0`, pct(latency,50) as `E2E P50`, pct(latency, 99) as `E2E P99` by funcName, memory |
 order by p50
 ```

With CPU
```
SOURCE "/aws/lambda/Coldstarter" START=-2d END=0s |
filter ispresent(coldstart) and coldstart = 1 and ispresent(cpu)
| stats count(*) as samples, avg(size), pct(latency,0) as `p0(E2E)`, pct(latency,50) as `p50(E2E)`,  pct(latency,99) as `p99(E2E)`, pct(latency-billedDuration, 50) as overhead,
  pct(billedDuration, 0) as `p0(BilledDuration)`, pct(billedDuration, 50) as `p50(BilledDuration)`,pct(billedDuration, 99) as `p99(BilledDuration)`, pct(coldstartDuration, 50) as `p50(coldstartDuration)` 
  by funcName,memory, cpu
| order by memory,`p50(E2E)`
```

Link: https://speedrun-api.us-west-2.nobackspacecrew.com/v1/federate/320877393516?logout=false&role=speedrun-Admin&destination=https%3A%2F%2Fus-east-2.console.aws.amazon.com%2Fcloudwatch%2Fdeeplink.js%3Fregion%3Dus-east-2%23log-analytics%3Factive%3D%257E%2527a%26a.id%3D%257E%2527cb31ec88-cc39-4152-b56d-8ec9c6251abe%26a.pos%3D%257E%25270%26a.label%3D%257E%2527Query*201%26a.type%3D%257E%2527query%26a.query%3D%257E%2527SOURCE*20*22*2faws*2flambda*2fColdstarter*22*20START*3d-2d*20END*3d0s*20*7c*0afilter*20ispresent*28coldstart*29*20and*20coldstart*20*3d*201*20and*20ispresent*28cpu*29*0a*7c*20stats*20count*28*2a*29*20as*20samples*2c*20avg*28size*29*2c*20pct*28latency*2c0*29*20as*20*60p0*28E2E*29*60*2c*20pct*28latency*2c50*29*20as*20*60p50*28E2E*29*60*2c*20*20pct*28latency*2c99*29*20as*20*60p99*28E2E*29*60*2c*20pct*28latency-billedDuration*2c*2050*29*20as*20overhead*2c*0a*20*20pct*28billedDuration*2c*200*29*20as*20*60p0*28BilledDuration*29*60*2c*20pct*28billedDuration*2c*2050*29*20as*20*60p50*28BilledDuration*29*60*2cpct*28billedDuration*2c*2099*29*20as*20*60p99*28BilledDuration*29*60*2c*20pct*28coldstartDuration*2c*2050*29*20as*20*60p50*28coldstartDuration*29*60*20*0a*20*20by*20funcName*2cmemory*2c*20cpu*0a*7c*20order*20by*20memory*2c*60p50*28E2E*29*60

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
