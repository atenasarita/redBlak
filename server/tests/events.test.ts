import request from "supertest";
import app from '../src/app';
import { pool } from "../src/db";

jest.mock("../src/utils/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));


jest.mock("../src/db", () => ({
    pool: {
        query: jest.fn()
    },
    initDb: jest.fn().mockResolvedValue(undefined)
}));

describe("Events API", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /events", () => {

        it("creates an event", async () => {

            (pool!.query as jest.Mock).mockResolvedValue({
                rows: [
                    {
                        id: 1
                    }
                ]
            });

            const response = await request(app)
                .post("/events")
                .send({
                    level: "info",
                    message: "Unit test"
                });

            expect(response.status).toBe(201);

            expect(response.body.id).toBe(1);
            expect(response.body.level).toBe("info");
            expect(response.body.message).toBe("Unit test");

            expect(pool!.query).toHaveBeenCalled();

        });

        it("returns 400 when payload is invalid", async () => {

            const response = await request(app)
                .post("/events")
                .send({});

            expect(response.status).toBe(400);

        });

        it("returns 500 when database fails", async () => {

            (pool!.query as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .post("/events")
                .send({
                    level: "error",
                    message: "failure"
                });

            expect(response.status).toBe(500);

        });

    });

    describe("GET /events", () => {

        it("returns events", async () => {

            (pool!.query as jest.Mock).mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        level: "info",
                        message: "hello",
                        metadata: {},
                        timestamp: new Date().toISOString()
                    }
                ]
            });

            const response = await request(app)
                .get("/events");

            expect(response.status).toBe(200);

            expect(Array.isArray(response.body)).toBe(true);

            expect(response.body.length).toBe(1);

        });

        it("filters by level", async () => {

            (pool!.query as jest.Mock).mockResolvedValue({
                rows: [
                    {
                        id: 2,
                        level: "error",
                        message: "database error",
                        metadata: {},
                        timestamp: new Date().toISOString()
                    }
                ]
            });

            const response = await request(app)
                .get("/events?level=error");

            expect(response.status).toBe(200);

            expect(response.body[0].level).toBe("error");

        });

        it("returns 500 when query fails", async () => {

            (pool!.query as jest.Mock).mockRejectedValue(
                new Error("Query failed")
            );

            const response = await request(app)
                .get("/events");

            expect(response.status).toBe(500);

        });

    });

});