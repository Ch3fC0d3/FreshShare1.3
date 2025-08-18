const { authJwt } = require("../middleware");
const controller = require("../controllers/dashboard.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Route to get all dashboard data
  app.get(
    "/api/dashboard/data",
    [authJwt.verifyToken],
    controller.getDashboardData
  );
};
