const express = require("express");

const PORT = 3000;

const app = express();

app.use((req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});
