// Write test for index "/"
const request = require("supertest");
const app = require("../app");

let server, agent;

describe("Common Tests", () => {
  beforeAll(() => {
    server = app.listen(3000, () => {
      agent = request.agent(server);
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it("should return 200 OK", async (done) => {
    await agent.get("/").expect(200, done);
  });
});
