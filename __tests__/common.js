// Write test for index "/"
const request = require("supertest");
const app = require("../app");
const db = require("../models/index");

let server, agent, _csrf, userId;

const fetchCSRFToken = async () => {
  // Get csrf token from home page
  let response = await agent.get("/register").set("Accept", "text/html");
  const csrfToken = response.text.match(/name="_csrf" value="(.*)"/)[1];
  response = await agent
    .post("/register")
    .send({
      firstName: "Test",
      lastName: "User",
      email: "test@user.in",
      password: "Test@1234535345",
      _csrf: csrfToken,
    })
    .set("Accept", "application/json");
  expect(response.statusCode).toEqual(200);
  return {
    csrfToken,
    userId: JSON.parse(response.text).id,
  };
};

describe("Common Tests for Voting Platform", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
    server = app.listen(3000, () => {});
    agent = request.agent(server).set("Accept", "application/json");

    const init = await fetchCSRFToken();
    _csrf = init.csrfToken;
    userId = init.userId;
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  it("should return home message", async () => {
    const req = await agent.get("/");
    expect(req.statusCode).toEqual(200);
    expect(req.text).toContain("ok");
  });

  it("should test for sessions", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/logout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });
});
