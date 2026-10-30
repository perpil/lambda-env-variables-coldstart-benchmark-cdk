import { LambdaClient, InvokeCommand, LogType } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
  region: process.env.AWS_REGION,
  maxAttempts: 1,
});

const invoke = async (funcName, payload = {}) => {
  const command = new InvokeCommand({
    FunctionName: funcName,
    Payload: JSON.stringify(payload),
    LogType: LogType.Tail,
  });
  let start = Date.now();
  const { LogResult, $metadata, Payload } = await client.send(command);
  let latency = Date.now() - start;
  let logLines = Buffer.from(LogResult, 'base64').toString('utf-8');
  logLines = logLines.split('\n').filter(line => line.startsWith('REPORT'));
  let values = {};
  if(logLines.length === 1) {
    let line = logLines[0].substring("REPORT ".length);
    //REPORT RequestId: 1c8df7d3-xmpl-46da-9778-518e6eca8125  Duration: 2.75 ms   Billed Duration: 3 ms Memory Size: 128 MB Max Memory Used: 56 MB  Init Duration: 113.51 ms
    const arr = line.split('\t');
    values = arr.reduce((acc, current, index) => {
      let [key, value] = current.split(': ');
      if(key){
        acc[key] = value.split(' ')[0];
      }
      return acc;
    }, {});
  }
  try {
    const convertedPayload = Buffer.from(Payload).toString('utf-8');
    values['Payload'] = convertedPayload.trim() ? JSON.parse(convertedPayload).body : {};
  } catch (e) {
    values['Payload'] = {};
  }
  return {
    funcName,
    requestId: values['RequestId'],
    coldstart: values['Init Duration']!==undefined,
    coldstartDuration: values['Init Duration'] ? parseFloat(values['Init Duration']) : undefined,
    duration: values['Duration'] ? parseFloat(values['Duration']) : undefined,
    billedDuration: values['Billed Duration'] ? parseFloat(values['Billed Duration']) : undefined,
    memory: values['Memory Size'] ? parseFloat(values['Memory Size']) : undefined,
    maxMemoryUsed: values['Max Memory Used'] ? parseFloat(values['Max Memory Used']) : undefined,
    latency,
    ...values['Payload']
  };
};

export const handler = async (event, context) => {
  //prime the https client
  try {
    await invoke("non-existent");
  } catch (e) {}

  //randomize order
  let funcs = process.env.FUNCTIONS.split(',').map(f=>f.trim());
  funcs = shuffleArray(funcs);

  //invoke
  for (const f of funcs) {
    console.log(await invoke(f,{}));
  }
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
