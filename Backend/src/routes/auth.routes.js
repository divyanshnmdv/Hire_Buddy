const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

//register api
authRouter.post("/register", authController.registerUserController)

//login api
authRouter.post("/login", authController.loginUserController)

//logout api
authRouter.get("/logout", authController.logoutUserController)


//get user api
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


module.exports = authRouter