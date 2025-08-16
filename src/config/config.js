require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: process.env.DB_SSL === "true" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: process.env.DB_SSL === "true" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
};

