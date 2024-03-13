let coldstart = 1;
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      requestId: context.awsRequestId,
      coldstart: coldstart--,
    }),
  };
};
