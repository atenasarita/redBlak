import request from "supertest";
import app from "../src/app";

describe("Health endpoint", () => {

    it("GET /health returns OK", async () => {

        const response = await request(app)
            .get("/health");

        expect(response.status).toBe(200);
        expect(response.text).toBe("OK");

    });

});