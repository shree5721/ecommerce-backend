const PORT = 4000;
const express = require("express");
const cors = require('cors')
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

app.use(cors())
app.use(express.json());

//Now defining connection with mongoDB
let connection = async () => {
  await mongoose
    .connect("mongodb://localhost:27017/Shopping")
    .then(() => console.log("Database Connected"))
    .catch((err) => console.log(err));
};
connection();

//Defining mongoose Model with schema

const Users = mongoose.model("userinfos", {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phoneNumber: {
    type: Number,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

//creating route for signup
app.post("/signup", async (req, res) => {
  const { username, email, phonenumber, password, confirmPassword } = req.body;
  if (
    username === "" ||
    email === "" ||
    phonenumber === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    return res.send({ status: "failed", message: "Fields cannot be empty!" });
  } else {
    const user = await Users.findOne({ email: email });
    if (user) {
      return res.send({ Status: false, message: "User already exists" });
    } else {
      if (password === confirmPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        let cart = {};
        for (let i = 0; i < 200; i++) {
          cart[i] = 0;
        }

        const doc = new Users({
          name: username,
          email: email,
          phoneNumber: phonenumber,
          password: hashPassword,
          cartData: cart,
        });
        await doc.save();
        const data = {
          user: {
            id: doc.id,
          },
        };
        const token = jwt.sign(data, "sec_ecommerce");
        res.send({ status: true, token });
      }
    }
  }
});

//creating route for login
app.post("/login", async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (email === "" || password === "" || confirmPassword === "") {
    return res.send({ status: "failed", message: "Fields cannot be empty!" });
  } else {
    const user = await Users.findOne({ email: email });
    if (user) {
      if (password === confirmPassword) {
        const validPass = await bcrypt.compare(password, user.password);
        if (validPass) {
          const token = jwt.sign({ user: { id: user.id } }, "sec_ecommerce");
          return res.send({
            status: "success",
            message: "Login successfull",
            token,
          });
        } else {
          return res.send({
            status: "invalidPass",
            message: "Invalid Password",
          });
        }
      } else {
        return res.send({
          status: "failedPass",
          message: "password and confirm Password did not match !",
        });
      }
    } else {
      res.send({ status: false, message: "User not found." });
    }
  }
});

//Creating middleware to fetch user

// const authMiddleWare = async (req, res, next) => {
//   const token = req.header("auth-token");
//   try {
//     if (token) {
//       const data = jwt.verify(token, "sec_ecommerce");
//       req.user = data.user;
//       next();
//     } else {
//       return res
//         .status(401)
//         .json({ status: "fail", message: "No Token Provided!" });
//     }
//   } catch (error) {
//     res.send(error);
//   }
// };

// Created a route for getcart

// app.post('/getcart',authMiddleWare,async(req,res)=>{
//   console.log("getCart")
//   let userData=await UserModel.findById({_id:req.user.id})
//   return res.json(userData.cartData)
// })

// app.post("/addtocart", authMiddleWare, async (req, res) => {
//   let userData = await Users.findOne({ _id: req.user.id });
//   userData.cartData[req.body.itemId] += 1;
//   await Users.findOneAndUpdate(
//     { _id: req.user.id },
//     { cartData: userData.cartData }
//   );
//   res.send("Added");
// });

// app.post("/removefromcart", authMiddleWare, async (req, res) => {
//   let userData = await Users.findOne({ _id: req.user.id });
//   if (userData.cartData > 0) {
//     userData.cartData[req.body.itemId] -= 1;
//     await Users.findOneAndUpdate(
//       { _id: req.user.id },
//       { cartData: userData.cartData }
//     );
//     res.send("deleted");
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
