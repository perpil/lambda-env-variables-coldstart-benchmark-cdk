# About
This was used to test whether using environment variables in Lambda impact coldstarts.  It runs a Lambda every 3 hours to test coldstart times.

## Deployment

```
npm install
npx cdk deploy
```

## Important files

* [lib/coldstarter-stack.ts](lib/coldstarter-stack.ts) - Defines the stack
* [src/coldstarter.js](src/coldstarter.js) - The Lambda function that invokes the other lambda functions and emits latency logs
* [src/handler.js](src/handler.js) - The Lambda function has environment variables or not.

## CloudWatch Insights Queries
To get Init Duration deltas run this on `/aws/lambda/Function and /aws/lambda/FunctionWithEnv` simultaneously:
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

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
