const Schema = {
  properties: {
    body: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          excludeMinimun: 0,
        },
      },
      required: ["amount"],
    },
  },
  required: ["body"],
};

export default Schema;
