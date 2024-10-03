const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

// userRouter.get("/user", async (req, res) => {
//   try {
//     const users = await User.find({ emailId: req.body.emailId });
//     if (users.length !== 0) {
//       res.send(users);
//     } else {
//       res.status(404).send("User not found!");
//     }
//   } catch (err) {
//     res.status(400).send("Something went wrong!");
//   }
// });

// userRouter.get("/feed", async (req, res) => {
//   try {
//     const users = await User.find({});
//     if (users.length !== 0) {
//       res.send(users);
//     } else {
//       res.status(404).send("User not found!");
//     }
//   } catch (err) {
//     res.status(400).send("Something went wrong!");
//   }
// });

// userRouter.delete("/user", async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete({ _id: req.body.userId });
//     res.send("User Deleted successfully!");
//   } catch (err) {
//     res.status(400).send("Something went wrong!");
//   }
// });

// userRouter.patch("/user/:userId", async (req, res) => {
//   const data = req.body;
//   try {
//     const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];
//     const isUpdateAllowed = Object.keys(data).every((k) =>
//       ALLOWED_UPDATES.includes(k)
//     );

//     if (!isUpdateAllowed) {
//       throw new Error("Update not allowed");
//     }
//     if (data?.skills.length > 10) {
//       throw new Error("Skills cannot be more than 10");
//     }
//     const user = await User.findByIdAndUpdate(
//       { _id: req.params?.userId },
//       data,
//       {
//         returnDocument: "after",
//         runValidators: true,
//       }
//     );
//     res.send("User Updated successfully!");
//   } catch (err) {
//     res.status(400).send("Update Failed: " + err.message);
//   }
// });

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", [
      "firstName",
      "lastName",
      "age",
      "gender",
      "photoUrl",
      "about",
      "skills",
    ]);
    // can also be written as following: .populate("fromUserId", "firstName lastName age gender photoUrl about skills");

    res.json({
      message: "Requests fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate(
        "fromUserId",
        "firstName lastName age gender photoUrl about skills"
      )
      .populate(
        "toUserId",
        "firstName lastName age gender photoUrl about skills"
      );
    const data = connectionRequests.map((item) => {
      if (item.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return item.toUserId;
      }
      return item.fromUserId;
    });
    res.json({
      message: "Connections fetched successfully",
      data,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select("firstName lastName age gender photoUrl about skills")
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = userRouter;
