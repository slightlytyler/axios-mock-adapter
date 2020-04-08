var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter replyOnce", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("supports chaining", function () {
    mock
      .onGet("/foo")
      .replyOnce(200)
      .onAny("/foo")
      .replyOnce(500)
      .onPost("/foo")
      .replyOnce(201);

    expect(mock.handlers.once["get"].length).to.equal(2);
    expect(mock.handlers.once["post"].length).to.equal(2);
  });

  it("replies as normally on the first call", function () {
    mock.onGet("/foo").replyOnce(200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("replies only once", function () {
    var called = false;
    mock.onGet("/foo").replyOnce(200);

    return instance
      .get("/foo")
      .then(function () {
        called = true;
        return instance.get("/foo");
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when used with onAny", function () {
    var called = false;
    mock.onAny("/foo").replyOnce(200);

    return instance
      .get("/foo")
      .then(function () {
        called = true;
        return instance.post("/foo");
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when using request body matching", function () {
    var called = false;
    var body = "abc";
    mock.onPost("/onceWithBody", body).replyOnce(200);

    return instance
      .post("/onceWithBody", body)
      .then(function () {
        called = true;
        return instance.post("/onceWithBody", body);
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when using a function that returns a response", function () {
    mock
      .onGet("/foo")
      .replyOnce(function () {
        return [200];
      })
      .onGet("/foo")
      .replyOnce(function () {
        return [202];
      });

    return instance
      .get("/foo")
      .then(function (response) {
        expect(response.status).to.equal(200);
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(202);
      });
  });

  it("replies once taking presedence of a base handler", function () {
    mock.onGet("/foo").reply(200, {
      foo: "default",
    });

    mock.onGet("/foo").replyOnce(200, {
      foo: "bar",
    });

    mock.onGet("/foo").replyOnce(200, {
      foo: "baz",
    });

    return instance
      .get("/foo")
      .then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal("bar");
      })
      .then(function () {
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal("baz");
      })
      .then(function () {
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal("default");
      })
      .then(function () {
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal("default");
      });
  });
});
