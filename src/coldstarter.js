import { LambdaClient, InvokeCommand, LogType } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
  region: process.env.AWS_REGION,
  maxAttempts: 1,
});

const invoke = async (funcName, payload = {}) => {
  const command = new InvokeCommand({
    FunctionName: funcName,
    Payload: JSON.stringify(payload),
    LogType: LogType.None,
  });
  let start = Date.now();
  const { Payload } = await client.send(command);
  let latency = Date.now() - start;
  let { requestId, coldstart } = JSON.parse(
    JSON.parse(Buffer.from(Payload).toString()).body
  );
  return {
    funcName,
    requestId,
    coldstart,
    latency,
  };
};

export const handler = async (event, context) => {
  //prime the http client
  try {
    await invoke("non-existent");
  } catch (e) {}

  //randomize order
  let funcs = ["Function", "FunctionWithEnv"];
  if (Math.random() < 0.5) {
    funcs = funcs.reverse();
  }

  //invoke
  for (const f of funcs) {
    console.log(await invoke(f));
  }
};
