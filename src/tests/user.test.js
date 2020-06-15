const app = require('../app');
const Z = require('supertest');
require('../db/mongoose');
const User = require('../db/models/user');
const jwt = require("jsonwebtoken");
const { ObjectID } = require("mongodb");
const e = require('express');

const _id = new ObjectID();
const dummyUser = {
    _id,
    name: "Jonathan Joestar",
    email: "jonathan@jojos.com",
    password: "randomPasswrd123#",
    age: 30,
    tokens: [{
            token: jwt.sign({_id}, process.env.JWT_SECRET)
        }]
}



beforeAll(async () => {
    await User.deleteMany();
    var user = new User(dummyUser);
    await user.save();
})

describe("User endpoints", () => {
    it("Creates new user on POST /users", async () => {
        await Z(app).post("/users").send({
            name: "Jorge Garcia",
            email: "jorge@mydomain.com",
            password: "micaela22",
            age: 23,
        }).expect(201)
    })

    it("Accepts authenticated user on POST /users/login", async() => {
        await Z(app).post("/users/login").send({
            email: dummyUser.email,
            password: dummyUser.password
        }).expect(200);
    })

    it("Rejects unauthenticated user on POST /users/login", async() => {
        await Z(app).post("/users/login").send({
            email: dummyUser.email,
            password: "holaQueHACEE"
        }).expect(400);
    })

    it("Accepts authenticated user on GET /users/me", async () => {
        await Z(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${dummyUser.tokens[0].token}`)
        .send()
        .expect(200)
    });

    it("Rejects unauthenticated users on GET /users/me", async () =>{
        await Z(app)
        .get("/users/me")
        .set("Authorization", `Bearer thisWillNotWork`)
        .send()
        .expect(401)
    })

    it("Denies account deletion (unauthenticated)", async () => {
        await Z(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${dummyUser.tokens[0].token.replace("a","b")}`)
        .send()
        .expect(401)
    })

    it("Uploads user avatar", async () => {      
        await Z(app)
        .post("/users/me/avatar")
        .set("Authorization", `Bearer ${dummyUser.tokens[0].token}`)
        .attach("avatar", "src/tests/fixtures/huevito.png");
        const user = await User.findById(dummyUser._id);
        expect(user.avatar).toEqual(expect.any(Buffer));
    })
    
    it("Changes user fields", async () => {
        await Z(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${dummyUser.tokens[0].token}`)
        .send({
            name: "Jose"
        }).expect(200);
        const x = await User.findById(dummyUser._id);
        expect(x.name).not.toBe(dummyUser.name);
    })

    it("Deletes account", async () => {
        await Z(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${dummyUser.tokens[0].token}`)
        .send()
        .expect(200)
    })
});

