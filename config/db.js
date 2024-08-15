const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb+srv://muhamadyasirbuanadyva:nexussoul626@mymongodb.yrufkpn.mongodb.net/sneakerscout");

//cek db connected or not
connect.then(() => {
  console.log("Berhasil woi");
})
  .catch(() => {
    console.log("benerin woi");
  });

const user = new mongoose.Schema({
  image: String,
  username: {type:String, required :true}, 
  name:String,
  email: String,
  password: String,
 
  
});

const wishlist_schema = new mongoose.Schema({
  username: {type:String, required :true}, 
  shoeName: String,
  brand: String,
  releaseDate: String,
  description: String,
  colorway: String,
  make: String,
  retailPrice: Number,
  styleID: String,
  thumbnail: String,
  resellLinks: {
    goat: String,
    flightClub: String,
    stockX: String
  },
  lowestResellPrice: {
    stockX: Number,
    flightClub: Number,
    goat: Number
  }
});

const users = new mongoose.model("users", user);
const wishlist = new mongoose.model("wishlist", wishlist_schema);

module.exports = { users, wishlist };

