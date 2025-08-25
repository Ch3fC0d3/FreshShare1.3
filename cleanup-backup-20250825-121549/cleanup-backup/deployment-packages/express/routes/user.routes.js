const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // User profile API routes
  app.get(
    "/api/user/profile",
    [authJwt.verifyToken],
    controller.getUserProfile
  );

  app.put(
    "/api/user/profile",
    [authJwt.verifyToken],
    controller.updateUserProfile
  );

  // User management routes (admin only)
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );

  app.get(
    "/api/user/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getUserById
  );

  app.delete(
    "/api/user/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deleteUser
  );
};
