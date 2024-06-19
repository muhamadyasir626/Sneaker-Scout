const express = require('express');
const cors = require("cors");
const path = require('path');
const bcrypt = require('bcrypt');
const { users, wishlist } = require('../config/db');
const async = require('hbs/lib/async');
const app = express();
const port = 443;

const SneaksAPI = require('sneaks-api');
const sneaks = new SneaksAPI();
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Setup session
app.use(session({
  secret: 'your_secret_key', // Replace with your own secret key
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://muhamadyasirbuanadyva:nexussoul626@mymongodb.yrufkpn.mongodb.net/sneakersessions' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session valid for 1 day
}));

// app.listen(443, () => {
//   console.log('Server started on port 443');
// });

// Set view engine
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, '..', 'views')); // Menyesuaikan direktori view
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '..', 'public')));

const corsConfig = {
  origin :"#",
  credential: true,
  methods:['GET','POST','DELETE','PUT'],
}
app.use(cors(corsConfig))

// Convert data to JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to pass user data to templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
 
  res.render('login');
});

app.get('/sneaker', (req, res) => {
  res.render('sneaker');
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
      res.redirect('/login');
  } else {
      try {
          const userData = await users.findOne({ email: req.session.user.email });
          if (!userData) {
              res.send("User not found");
          } else {
              const wishlistCount = await wishlist.countDocuments({ username: userData.username });
              res.render('profile', { user: userData, wishlistCount: wishlistCount });
          }
      } catch (error) {
          console.error('Error fetching user data:', error);
          res.status(500).send("Error fetching user data");
      }
  }
});

//update profile
app.post('/update-profile', async (req, res) => {
  try {
    const oldUsername = req.session.user.username; // Correctly access username from session
    console.log('Old Username:', oldUsername);
    const { username, name, email } = req.body;
    
    // Use the session ID to ensure you're updating the correct user profile
    const updatedUser = await users.findByIdAndUpdate(req.session.user._id, {
      $set: {
        username: username,
        name: name,
        email: email,
      }
    }, { new: true });

    if (updatedUser) {
      // Update wishlist items only if the username was indeed changed to avoid unnecessary operations
      if (oldUsername !== username) {
        await wishlist.updateMany({ username: oldUsername }, {
          $set: { username: username }
        });
      }

      // Update session details to reflect changes
      req.session.user = { ...req.session.user, username, name, email };

      // Respond with success message using SweetAlert2
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Update</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Success",
              text: "Profile updated successfully!",
              icon: "success",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/profile";
            });
          </script>
        </body>
        </html>
      `);
    } else {
      // If no user is found or updated, respond with an error message using SweetAlert2
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profile Update Error</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "User not found.",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/profile";
            });
          </script>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    // Handle error and respond with error message using SweetAlert2
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile Update Error</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script>
          Swal.fire({
            title: "Error",
            text: "An error occurred while updating your profile. Please try again.",
            icon: "error",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/profile";
          });
        </script>
      </body>
      </html>
    `);
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await users.findOne({ email: email });

    if (!user) {
      return res.status(401).send('<script>alert("Email not found.");window.location.href="/login";</script>');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).send('<script>alert("Incorrect password.");window.location.href="/login";</script>');
    }

    // Update session with more user data as needed
    req.session.user = {
      _id: user._id, // Consider adding user ID to the session
      username: user.username,
      name: user.name,
      email: user.email
    };

    // return res.redirect('/home')
     res.send('<script>sessionStorage.setItem("userLoggedIn", "true"); window.location.href = "/home";</script>'); ;
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).send('<script>alert("An error occurred during login.");window.location.href="/login";</script>');
  }
});

app.get('/catalog', (req, res) => {
  res.render('catalog');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/home', (req, res) => {
  if (req.session.user) {
    res.render('home-login', { user: req.session.user });
  } else {
    res.send('<script>alert("Please login first."); window.location.href = "/login";</script>');
  }
});
app.get('/sneaker-login', (req, res) => {
  if (req.session.user) {
    res.render('sneaker-login', { user: req.session.user });
  } else {
    res.send('<script>alert("Please login first."); window.location.href = "/login";</script>');
  }
});

//add wishlist
app.post('/add-to-wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Please login first.' });
  }

  const { shoeName, brand, releaseDate, description, colorway, make, retailPrice, styleID, thumbnail, resellLinks, lowestResellPrice } = req.body;

  try {
    const username = req.session.user.username;

    const wishlistItem = new wishlist({
      username: username,
      shoeName: shoeName,
      brand: brand,
      releaseDate: new Date(releaseDate),
      description: description,
      colorway: colorway,
      make: make,
      retailPrice: retailPrice,
      styleID: styleID,
      thumbnail: thumbnail,
      resellLinks: {
        goat: resellLinks.goat,
        flightClub: resellLinks.flightClub,
        stockX: resellLinks.stockX,
      },
      lowestResellPrice: {
        stockX: lowestResellPrice.stockX,
        flightClub: lowestResellPrice.flightClub,
        goat: lowestResellPrice.goat,
      }
    });

    await wishlistItem.save();
    res.json({ success: true, message: 'Sneaker adde' });
  } catch (error) {
    console.error('Error adding sneaker to wishlist:', error);
    res.status(500).json({ success: false, message: `An error occurred: ${error.message}` });
  }
});

// Endpoint untuk menghapus dari wishlist
app.post('/remove-from-wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'User not logged in.' });
  }
  try {
    await wishlist.deleteOne({
      username: req.session.user.username,
      styleID: req.body.styleID
    });
    res.json({ success: true, message: 'Sneaker removed from wishlist.' });
  } catch (error) {
    console.error('Error removing sneaker from wishlist:', error);
    res.status(500).json({ success: false, message: `An error occurred: ${error.message}` });
  }
});

//page wishlist
app.get('/wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const username = req.session.user.username; // Adjust this according to how user session is stored
    const wishlistItems = await wishlist.find({ username: username }); // Assuming 'wishlist' is the model for wishlist items
    res.render('wishlist', { items: wishlistItems, user: req.session.user });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).send('Error fetching wishlist items');
  }
});

//pop up wishlist
app.get('/api/sneakers/detail/:id', async (req, res) => {
  try {
    const sneakerId = req.params.id;
    const sneaker = await wishlist.findOne({ styleID: sneakerId }); // Asumsi bahwa 'wishlist' adalah model yang benar
    console.log
    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    res.json(sneaker);
  } catch (error) {
    console.error('Error fetching sneaker details:', error);
    res.status(500).json({ message: 'Error fetching sneaker details' });
  }
});

//checkwishlist
app.get('/api/check-wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'User not logged in.' });
  }
  
  try {
    // Mengambil styleID dari query parameter
    const styleID = req.query.styleID;
    const username = req.session.user.username;  // Ambil username dari session

    // Cek apakah item dengan styleID tersebut ada di wishlist
    const item = await wishlist.findOne({ username: username, styleID: styleID });
    const isInWishlist = item != null;

    // Mengirim respons ke client
    res.json({ isInWishlist: isInWishlist });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ success: false, message: `An error occurred: ${error.message}` });
  }
});

//remove item page wishlist
app.post('/remove-from-page-wishlist', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'User not logged in.' });
  }

  const { styleID } = req.body;
  console.log('Received styleID:', req.body.styleID);

  try {
    const result = await wishlist.deleteOne({
      username: req.session.user.username,  // Ensure username is correctly pulled from session
      styleID: req.body.styleID            // Ensure styleID is correctly pulled from the request body
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Item not found or already removed.' });
    } else {
      res.json({ success: true, message: 'Sneaker removed from wishlist.' });
    }
  } catch (error) {
    console.error('Error removing sneaker from wishlist:', error);
    res.status(500).json({ success: false, message: `An error occurred: ${error.message}` });
  }
});

// feature search
app.get('/api/search', (req, res) => {
  const query = req.query.q || 'Nike';  // Default search query
  const limit = parseInt(req.query.limit, 10) || 10;  // Default limit
  const offset = parseInt(req.query.offset, 10) || 0;  // Default offset

  console.log(`Searching for sneakers with query: ${query}, limit: ${limit}, and offset: ${offset}`);

  sneaks.getProducts(query, 100, (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Product not found or error occurred.' });
    }

    if (!products || !Array.isArray(products)) {
      console.error('Invalid products array received');
      return res.status(500).json({ error: 'Invalid product data received.' });
    }

    const slicedProducts = products.slice(offset, offset + limit);
    const formattedProducts = slicedProducts.map((product) => {
      return {
        shoeName: product.shoeName,
        brand: product.brand,
        releaseDate: product.releaseDate,
        description: product.description,
        colorway: product.colorway,
        make: product.make,
        retailPrice: product.retailPrice,
        styleID: product.styleID,
        thumbnail: product.thumbnail,
        description: product.description,
        resellLinks: {
          goat: product.resellLinks.goat,
          flightClub: product.resellLinks.flightClub,
          stockX: product.resellLinks.stockX,

        },
        lowestResellPrice: {
          stockX: product.lowestResellPrice.stockX,
          flightClub: product.lowestResellPrice.flightClub,
          goat: product.lowestResellPrice.goat,
        }
      };
    });

    res.json(formattedProducts);
  });
});

app.get('/api/filter', (req, res) => {
  const query = req.query.q ;  // Default search query
  const limit = parseInt(req.query.limit, 10) || 100;  // Default limit
  const offset = parseInt(req.query.offset, 10) || 0;  // Default offset

  console.log(`Searching for sneakers with query: ${query}, limit: ${limit}, and offset: ${offset}`);

  sneaks.getProducts(query, 100, (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Product not found or error occurred.' });
    }

    if (!products || !Array.isArray(products)) {
      console.error('Invalid products array received');
      return res.status(500).json({ error: 'Invalid product data received.' });
    }

    const slicedProducts = products.slice(offset, offset + limit);
    const formattedProducts = slicedProducts.map((product) => {
      return {
        shoeName: product.shoeName,
        brand: product.brand,
        releaseDate: product.releaseDate,
        description: product.description,
        colorway: product.colorway,
        make: product.make,
        retailPrice: product.retailPrice,
        styleID: product.styleID,
        thumbnail: product.thumbnail,
        description: product.description,
        resellLinks: {
          goat: product.resellLinks.goat,
          flightClub: product.resellLinks.flightClub,
          stockX: product.resellLinks.stockX,

        },
        lowestResellPrice: {
          stockX: product.lowestResellPrice.stockX,
          flightClub: product.lowestResellPrice.flightClub,
          goat: product.lowestResellPrice.goat,
        }
      };
    });

    res.json(formattedProducts);
  });
});

// Register
app.post('/signup', async (req, res) => {
  const { username, name, email, password1, password2 } = req.body;

  try {
    // Check if email and username already exists
    const checkEmail = await users.findOne({ email: email });
    const checkUsername = await users.findOne({ username: username });

    if (checkEmail) {
      console.log("Email already exists.");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Exists</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "Email already exists.",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/signup";
            });
          </script>
        </body>
        </html>
      `);
    }

    if (checkUsername) {
      console.log("Username already exists.");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Username Exists</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "Username already exists.",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/signup";
            });
          </script>
        </body>
        </html>
      `);
    }

    // Check if password1 and password2 match
    if (password1 !== password2) {
      console.log("Passwords do not match.");
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Mismatch</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "Passwords do not match.",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/signup";
            });
          </script>
        </body>
        </html>
      `);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password1, 10);

    // Create an object with user data
    const userDataToInsert = {
      image: "public/img/home-login/logo/flight.png",
      username: username.toLowerCase(),
      name: name,
      email: email,
      password: hashedPassword // Store the hashed password
    };

    // Save user data to the database
    const insertedUserData = await users.insertMany([userDataToInsert]);
    console.log(insertedUserData)

    // Respond with a success message
    console.log("Registration successful. Please log in.");
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Successful</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script>
          Swal.fire({
            title: "Success",
            text: "Registration successful. Please log in.",
            icon: "success",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/login";
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    // Handle any errors
    console.error('Error during registration:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Error</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script>
          Swal.fire({
            title: "Error",
            text: "An error occurred during registration. Please try again.",
            icon: "error",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/signup";
          });
        </script>
      </body>
      </html>
    `);
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const user = await users.findOne({ email: req.body.email });

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Not Found</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "Email not found.",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/login";
            });
          </script>
        </body>
        </html>
      `);
    }

    const passwordValid = await bcrypt.compare(req.body.password, user.password);
    if (passwordValid) {
      // Simpan username di sesi
      req.session.user = {
        username: user.username,
        name: user.name,
        email: user.email
      };

      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Successful</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Success",
              text: "Login successful.",
              icon: "success",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/home"; // Redirect to home page or wherever you want after login
            });
          </script>
        </body>
        </html>
      `);
    } else {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wrong Password</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        </head>
        <body>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script>
            Swal.fire({
              title: "Error",
              text: "Wrong Password!",
              icon: "error",
              confirmButtonText: "OK"
            }).then(() => {
              window.location.href = "/login";
            });
          </script>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Error</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script>
          Swal.fire({
            title: "Error",
            text: "An error occurred during login.",
            icon: "error",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/login";
          });
        </script>
      </body>
      </html>
    `);
  }
});


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logout</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <script>
          sessionStorage.clear(); // Clears all sessionStorage data
          localStorage.clear(); // Optionally clear localStorage if used
          Swal.fire({
            title: "Logged Out",
            text: "You have been logged out.",
            icon: "success",
            confirmButtonText: "OK"
          }).then(() => {
            window.location.href = "/login";
          });
        </script>
      </body>
      </html>
    `);
  });
});

//display most popular
app.get('/api/most-popular', (req, res) => {
  const limit = parseInt(req.query.limit) || 14;
  const offset = parseInt(req.query.offset) || 0;

  console.log(`Fetching most popular sneakers with limit: ${limit}, offset: ${offset}`);

  // Fetch a large enough number to handle pagination properly
  sneaks.getMostPopular(200, (err, products) => {
    if (err) {
      console.error('Error fetching most popular products:', err);
      return res.status(500).json({ error: 'Error occurred while fetching most popular products.' });
    }

    const slicedProducts = products.slice(offset, offset + limit);
    const formattedProducts = slicedProducts.map((product) => formatProduct(product))


    // const slicedProducts = products.slice(offset, offset + limit);
    // const formattedProducts = slicedProducts.map((product) => {
    //   return {
    //     shoeName: product.shoeName,
    //     brand: product.brand,
    //     releaseDate: product.releaseDate,
    //     description: product.description,
    //     colorway: product.colorway,
    //     make: product.make,
    //     retailPrice: product.retailPrice,
    //     styleID: product.styleID,
    //     thumbnail: product.thumbnail,
    //     description: product.description,
    //     resellLinks: {
    //       goat: product.resellLinks.goat,
    //       flightClub: product.resellLinks.flightClub,
    //       stockX: product.resellLinks.stockX,

    //     },
    //     lowestResellPrice: {
    //       stockX: product.lowestResellPrice.stockX,
    //       flightClub: product.lowestResellPrice.flightClub,
    //       goat: product.lowestResellPrice.goat,
    //     }
    //   };
    // });
    console.log(`Fetching most popular sneakers with limit: ${limit}, offset: ${offset}`);

    res.json(formattedProducts);
  });
});

app.get('/api/more-most-popular', (req, res) => {
  const limit = parseInt(req.query.limit) || 14;
  const offset = parseInt(req.query.offset) || 0;

  console.log(`Fetching most popular sneakers with limit: ${limit}, offset: ${offset}`);

  // Fetch a large enough number to handle pagination properly
  sneaks.getMostPopular(200, (err, products) => {
    if (err) {
      console.error('Error fetching most popular products:', err);
      return res.status(500).json({ error: 'Error occurred while fetching most popular products.' });
    }

    const slicedProducts = products.slice(offset, offset + limit);
    const formattedProducts = slicedProducts.map((product) => formatProduct(product))

    console.log(`Fetching most popular sneakers with limit: ${limit}, offset: ${offset}`);

    res.json(formattedProducts);
  });
});

//display only jordan
app.get('/api/onlyjordan', (req, res) => {
  console.log(`Fetching Jordan sneakers`);
  
  // Extract query parameters for pagination
  const limit = parseInt(req.query.limit) || 9; // Default to 10 items per page
  const offset = parseInt(req.query.offset) || 0; // Default to start at 0

  sneaks.getProducts('Jordan', 100, (err, products) => {
    if (err) {
      console.error('Error fetching Jordan products:', err);
      return res.status(500).json({ error: 'Error occurred while fetching Jordan products.' });
    }

    const slicedProducts = products.slice(offset, offset + limit);
    const formattedProducts = slicedProducts.map(product => ({
      shoeName: product.shoeName,
      brand: product.brand,
      releaseDate: product.releaseDate,
      description: product.description,
      colorway: product.colorway,
      make: product.make,
      retailPrice: product.retailPrice,
      styleID: product.styleID,
      thumbnail: product.thumbnail,
      resellLinks: product.resellLinks,
      lowestResellPrice: product.lowestResellPrice,
    }));

    res.json(formattedProducts);
  });
});
 
app.get('/not-found', (req, res) => {
  res.status(404).send("404 - Page Not Found");
});


// 404 Error Page
app.use((req, res) => {
  res.status(404);
  res.send("404 - Page Not Found");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Endpoint to get filtered sneaker data by brand
app.get('/api/search', (req, res) => {
    const query = req.query.q || 'Nike'; // Default search query if none provided
    const limit = parseInt(req.query.limit, 100) || 100; // Default items per page
    const offset = parseInt(req.query.offset, 10) || 0; // Pagination offset

    console.log(`Searching for sneakers with query: ${query}, limit: ${limit}, and offset: ${offset}`);

    // Split the query by spaces to support multiple brand filters
    const brands = query.split(' ');

    sneaks.getProducts(query, 100, (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Product not found or error occurred.' });
        }

        if (!products || !Array.isArray(products)) {
            console.error('Invalid products array received');
            return res.status(500).json({ error: 'Invalid product data received.' });
        }

        // Filter products to only include those matching the selected brands
        const filteredProducts = products.filter(product => brands.includes(product.brand));

        const slicedProducts = filteredProducts.slice(offset, offset + limit);
        const formattedProducts = slicedProducts.map((product) => formatProduct(product));

        res.json(formattedProducts);
    });
});

function formatProduct(product) {
    return {
        shoeName: product.shoeName,
        brand: product.brand,
        releaseDate: product.releaseDate,
        description: product.description,
        colorway: product.colorway,
        make: product.make,
        retailPrice: product.retailPrice,
        styleID: product.styleID,
        thumbnail: product.thumbnail,
        resellLinks: product.resellLinks,
        lowestResellPrice: product.lowestResellPrice,
    };
}
