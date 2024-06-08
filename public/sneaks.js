document.addEventListener("DOMContentLoaded", () => {
  const formEl = document.querySelector("form");
  const inputEl = document.getElementById("cari");
  const searchResult = document.querySelector(".box-container");
  const showMoreBtn = document.getElementById("show-more");
  const filterForm = document.getElementById("sneaker-filter-form");
  const sneakerContainer = document.querySelector(".box-container");
  const hearts = document.querySelectorAll(".fa-heart");
  const filterPriceform = document.getElementById("sneaker-filter-price-form")

  let checkboxes = [];
  let inputData = "";
  let limit = 9;
  let offset = 0;
  let isSearchActive = false;
  let isPopularActive = false;
  let isFilterActive = false;
  let currentQuery = "";
  let priceMin = 0;
  let priceMax = 0;
  let isFilterPriceActive = false


  if (!filterForm) {
    console.error("Filter form is missing in the DOM");
    return;
  };

  checkboxes = filterForm.querySelectorAll('input[type="checkbox"]');

  if (!checkboxes.length) {
    console.error("No checkboxes found within the filter form");
    return;
  };
  function resetFilterStatus() {
    checkboxes.forEach(checkbox => {
      checkbox.checked = false; // Setiap checkbox di-set tidak terceklis
    });
  };

  // Fungsi untuk mereset filter harga
  function resetPriceFilter() {
    const priceMinInput = document.getElementById('hargaMin');
    const priceMaxInput = document.getElementById('hargaMax');
    priceMinInput.value = ""; // Atur ulang nilai minimum
    priceMaxInput.value = ""; // Atur ulang nilai maksimum
    priceMin = 0; // Reset variabel internal jika digunakan
    priceMax = 10000; // Reset variabel internal jika digunakan
  }

  async function searchSneaker(clear = true) {
    inputData = inputEl.value;
    try {
      isSearchActive = true;
      isPopularActive = false;
      isFilterActive = false;
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(
          inputData
        )}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const products = await response.json();
      displaySneakers(products, clear);
    } catch (error) {
      console.error(error);
      alert("Product not found or error occurred.");
    }
  };

  function displaySneakers(products, clear = true) {
    if (clear) {
      searchResult.innerHTML = ""; // Clear previous results
    }

    products.forEach((product) => {
      const frameImg = createSneakerElement(product);
      searchResult.appendChild(frameImg);
    });
  };

  function createSneakerElement(result) {
    const frameImg = document.createElement("div");
    frameImg.classList.add("frameimg");

    const heartIconContainer = document.createElement("div");
    heartIconContainer.classList.add("circle");

    const heartIcon = document.createElement("i");
    heartIcon.classList.add("fa", "fa-heart");
    heartIcon.setAttribute('data-styleID', result.styleID);
    heartIconContainer.appendChild(heartIcon);

    // Asynchronous call to check wishlist
    async function checkWishlist() {
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${result.styleID}`);
        const data = await response.json();
        if (data.isInWishlist) {
          heartIcon.classList.add("active"); // Add 'active' class if sneaker is in wishlist
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    }
    checkWishlist();

    heartIcon.addEventListener("click", async (event) => {
      event.stopPropagation(); // Prevent triggering click events on parent elements
      const userLoggedIn = sessionStorage.getItem('userLoggedIn');
       console.log(userLoggedIn)


      if (!userLoggedIn) {
       console.log(userLoggedIn)
        alert("Please login first");
        window.location.href = '/login';
        return; // Hentikan eksekusi lebih lanjut
      }
      const isActive = heartIcon.classList.toggle("active");
      const url = isActive ? "/add-to-wishlist" : "/remove-from-wishlist";
      const method = "POST";

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shoeName: result.shoeName,
            brand: result.brand,
            releaseDate: result.releaseDate,
            description: result.description,
            colorway: result.colorway,
            make: result.make,
            retailPrice: result.retailPrice,
            styleID: result.styleID,
            thumbnail: result.thumbnail,
            description: result.description,
            resellLinks: result.resellLinks,
            lowestResellPrice: result.lowestResellPrice,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(`Sneaker ${isActive ? 'added to' : 'removed from'} wishlist!`);
      } catch (error) {
        console.error(`Error ${isActive ? 'adding to' : 'removing from'} wishlist:`, error);
        alert(`An error occurred: ${error.message}`);
      }
    });

    const image = document.createElement("img");
    image.src = result.thumbnail;
    image.alt = result.styleID;
    image.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent default link behavior
      showPopUp_search(result);
    });

    const imageLink = document.createElement("a");
    imageLink.textContent = result.shoeName;
    imageLink.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent default link behavior
      showPopUp_search(result);
    });

    frameImg.appendChild(heartIconContainer);
    frameImg.appendChild(image);
    frameImg.appendChild(imageLink);

    return frameImg;
  }

  function showPopUp_search(sneaker) {
    if (!sneaker.lowestResellPrice || !sneaker.resellLinks) {
      console.log(sneaker);
      console.error("Error: Missing resell prices or links");
      return; // Stop execution if data is incomplete
    }

    const popUp = document.createElement("div");
    popUp.className = "pop-up";
    popUp.innerHTML = `
    <div class="pop-up">
      <div class="pop-up-content">
          <span class="close-button">&times;</span>
          <div class="previewimg">
            <img src="${sneaker.thumbnail}" alt="${sneaker.styleID}">
          </div>
          <div class="description">
            <div class="framedes">
              <h3>${sneaker.shoeName}</h3>
              <hr>
              <p>Retail Price $${sneaker.retailPrice}</p>
              <a class="description-text">${sneaker.description}</a>
              <div class="info">
                <div class="brand">
                  <a>Brand: <b class="nama">${sneaker.brand}</b></a>
                </div>
                <a>Release Date: <b class="nama">${sneaker.releaseDate}</b></a>
                <a>Color: <b class="nama">${sneaker.colorway}</b></a>
              </div>
              <div class="toko">
                <button class="btn">
                  <a href="${sneaker.resellLinks?.stockX
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/stockx.png" alt="StockX Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.stockX
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.stockX || " -"
      }</a>
                </button>
                <button class="btn">
                  <a href="${sneaker.resellLinks?.flightClub
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/flight.png" alt="Flight Club Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.flightClub
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.flightClub || " -"
      }</a>
                </button>
                <button class="btn">
                  <a href="${sneaker.resellLinks?.goat
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/GOAT-Logo.png" alt="GOAT Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.goat
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.goat || " -"
      }</a>
                </button>
                <button class="hearts">
                  <a href="#" class="like">
                    <i class="fas fa-heart"></i> <!-- Ikon hati Font Awesome -->
                  </a>
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    
  `;

    document.body.appendChild(popUp); // Append pop-up to the body


    // Add event listeners
    const closeBtn = popUp.querySelector(".close-button");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(popUp);
      setTimeout(() => {
        checkWishlist();
        updateHeartIconsOnPage(); // Fungsi baru untuk mengupdate ikon hati pada halaman
      }, 0);
    });



    const heartIcon = popUp.querySelector(".fa-heart");
    heartIcon.addEventListener("click", async (event) => {
      event.stopPropagation(); // Prevent triggering click events on parent elements
      const userLoggedIn = sessionStorage.getItem('userLoggedIn');
       console.log(userLoggedIn)


      if (!userLoggedIn) {
       console.log(userLoggedIn)
        alert("Please login first");
        window.location.href = '/login';
        return; // Hentikan eksekusi lebih lanjut
      }
      heartIcon.classList.toggle("active"); // Toggle active class to change icon color

      const isActive = heartIcon.classList.contains("active");
      const url = isActive ? "/add-to-wishlist" : "/remove-from-wishlist";
      const method = "POST"; // Use POST for both adding and removing

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shoeName: sneaker.shoeName,
            brand: sneaker.brand,
            releaseDate: sneaker.releaseDate,
            description: sneaker.description,
            colorway: sneaker.colorway,
            make: sneaker.make,
            retailPrice: sneaker.retailPrice,
            styleID: sneaker.styleID,
            thumbnail: sneaker.thumbnail,
            resellLinks: sneaker.resellLinks,
            lowestResellPrice: sneaker.lowestResellPrice,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(`Sneaker ${isActive ? 'added to' : 'removed from'} wishlist!`);
      } catch (error) {
        console.error(`Error ${isActive ? 'adding to' : 'removing from'} wishlist:`, error);
        alert(`An error occurred: ${error.message}`);
      }
    });
    checkWishlist();

    async function checkWishlist() {
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${sneaker.styleID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.isInWishlist) {
          heartIcon.classList.add("active"); // Add 'active' class if sneaker is in wishlist
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    }
  };

  function updateHeartIconsOnPage() {
    document.querySelectorAll('.fa-heart').forEach(async icon => {
      const styleID = icon.getAttribute('data-styleID');
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${styleID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.isInWishlist) {
          icon.classList.add("active");
          console.log("active")
          console.log(styleID)

        } else {
          icon.classList.remove("active");
          console.log("remove")
          console.log(styleID)

        }
      } catch (error) {
        console.error("Error checking wishlist status for icon:", error);
      }
    });
  };

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    offset = 0; // Reset offset to zero to Retail Price the beginning
    resetFilterStatus();
    resetPriceFilter();
    searchSneaker(true);

  });

  function createSneakerCard(sneaker) {
    const frameImg = document.createElement("div");
    frameImg.className = "frameimg";

    const circle = document.createElement("div");
    circle.className = "circle";
    const heartIcon = document.createElement("i");
    heartIcon.className = "fa fa-heart";
    heartIcon.setAttribute('data-styleID', sneaker.styleID);
    circle.appendChild(heartIcon);
    async function checkWishlist() {
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${sneaker.styleID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.isInWishlist) {
          heartIcon.classList.add("active"); // Add 'active' class if sneaker is in wishlist
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    }
    checkWishlist();

    heartIcon.addEventListener("click", async (event,req) => {
      event.stopPropagation(); // Prevent triggering click events on parent elements
      const userLoggedIn = sessionStorage.getItem('userLoggedIn');
      console.log(userLoggedIn)

      if (!userLoggedIn) {
       console.log(userLoggedIn)

        alert("Please login first");
        window.location.href = '/login';
        return ; // Hentikan eksekusi lebih lanjut
      }
      heartIcon.classList.toggle("active");
      if (heartIcon.classList.contains("active")) {
        // Add to wishlist
        try {
          const response = await fetch("/add-to-wishlist", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shoeName: sneaker.shoeName,
              brand: sneaker.brand,
              releaseDate: sneaker.releaseDate,
              description: sneaker.description,
              colorway: sneaker.colorway,
              make: sneaker.make,
              retailPrice: sneaker.retailPrice,
              styleID: sneaker.styleID,
              thumbnail: sneaker.thumbnail,
              description: sneaker.description,
              resellLinks: {
                goat: sneaker.resellLinks.goat,
                flightClub: sneaker.resellLinks.flightClub,
                stockX: sneaker.resellLinks.stockX,
              },
              lowestResellPrice: {
                stockX: sneaker.lowestResellPrice.stockX,
                flightClub: sneaker.lowestResellPrice.flightClub,
                goat: sneaker.lowestResellPrice.goat,
              },
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          alert("Sneaker added to wishlist!");
        } catch (error) {
          console.error("Error adding to wishlist:", error);
          alert(`An error occurred: ${error.message}`);
        }
      } else {
        // Remove from wishlist
        try {
          const response = await fetch("/remove-from-wishlist", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ styleID: sneaker.styleID }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          alert("Sneaker removed from wishlist!");
        } catch (error) {
          console.error("Error removing from wishlist:", error);
          alert(`An error occurred: ${error.message}`);
        }
      }
    });

    const image = document.createElement("img");
    image.src = sneaker.thumbnail;
    image.alt = sneaker.styleID;
    image.addEventListener("click", () => {
      showPopUp(sneaker);
    });

    const link = document.createElement("a");
    link.href = sneaker.resellLinks.goat;
    link.target = "_blank";
    link.textContent = sneaker.shoeName;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showPopUp(sneaker);
    });

    frameImg.appendChild(circle);
    frameImg.appendChild(image);
    frameImg.appendChild(link);

    return frameImg;
  }

  function showPopUp(sneaker) {
    if (!sneaker.lowestResellPrice || !sneaker.resellLinks) {
      console.log(sneaker);
      console.error("Error: Missing resell prices or links");
      return; // Stop execution if data is incomplete
    }

    const popUp = document.createElement("div");
    popUp.className = "pop-up";
    popUp.innerHTML = `
    <div class="pop-up">
      <div class="pop-up-content">
          <span class="close-button">&times;</span>
          <div class="previewimg">
            <img src="${sneaker.thumbnail}" alt="${sneaker.styleID}">
          </div>
          <div class="description">
            <div class="framedes">
              <h3>${sneaker.shoeName}</h3>
              <hr>
              <p>Retail Price $${sneaker.retailPrice}</p>
              <a class="description-text">${sneaker.description}</a>
              <div class="info">
                <div class="brand">
                  <a>Brand: <b class="nama">${sneaker.brand}</b></a>
                </div>
                <a>Release Date: <b class="nama">${sneaker.releaseDate}</b></a>
                <a>Color: <b class="nama">${sneaker.colorway}</b></a>
              </div>
              <div class="toko">
                <button class="btn">
                  <a href="${sneaker.resellLinks?.stockX
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/stockx.png" alt="StockX Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.stockX
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.stockX || " -"
      }</a>
                </button>
                <button class="btn">
                  <a href="${sneaker.resellLinks?.flightClub
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/flight.png" alt="Flight Club Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.flightClub
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.flightClub || " -"
      }</a>
                </button>
                <button class="btn">
                  <a href="${sneaker.resellLinks?.goat
      }" target="_blank" class="btn__visible">
                    <img src="/img/home-login/logo/GOAT-Logo.png" alt="GOAT Logo" class="log">
                  </a>
                  <a href="${sneaker.resellLinks?.goat
      }" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.goat || " -"
      }</a>
                </button>
                <button class="hearts">
                  <a href="#" class="like">
                    <i class="fas fa-heart"></i> <!-- Ikon hati Font Awesome -->
                  </a>
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    
  `;

    document.body.appendChild(popUp); // Append pop-up to the body

    // Add event listeners
    const closeBtn = popUp.querySelector(".close-button");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(popUp);
      setTimeout(() => {
        checkWishlist();
        updateHeartIconsOnPage(); // Fungsi baru untuk mengupdate ikon hati pada halaman
      }, 0);
    });

    const heartIcon = popUp.querySelector(".fa-heart");
    heartIcon.setAttribute('data-styleID', sneaker.styleID);
    heartIcon.addEventListener("click", async (event) => {
      event.stopPropagation(); // Prevent triggering click events on parent elements
      const userLoggedIn = sessionStorage.getItem('userLoggedIn');
       console.log(userLoggedIn)


      if (!userLoggedIn) {
       console.log(userLoggedIn)
        alert("Please login first");
        window.location.href = '/login';
        return; // Hentikan eksekusi lebih lanjut
      }
      heartIcon.classList.toggle("active"); // Toggle active class to change icon color
      heartIcon.setAttribute('data-styleID', sneaker.styleID);
      const isActive = heartIcon.classList.contains("active");
      const url = isActive ? "/add-to-wishlist" : "/remove-from-wishlist";
      const method = "POST"; // Use POST for both adding and removing

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shoeName: sneaker.shoeName,
            brand: sneaker.brand,
            releaseDate: sneaker.releaseDate,
            description: sneaker.description,
            colorway: sneaker.colorway,
            make: sneaker.make,
            retailPrice: sneaker.retailPrice,
            styleID: sneaker.styleID,
            thumbnail: sneaker.thumbnail,
            resellLinks: sneaker.resellLinks,
            lowestResellPrice: sneaker.lowestResellPrice,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(`Sneaker ${isActive ? 'added to' : 'removed from'} wishlist!`);
      } catch (error) {
        console.error(`Error ${isActive ? 'adding to' : 'removing from'} wishlist:`, error);
        alert(`An error occurred: ${error.message}`);
      }
    });
    checkWishlist();

    async function checkWishlist() {
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${sneaker.styleID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.isInWishlist) {
          heartIcon.classList.add("active"); // Add 'active' class if sneaker is in wishlist
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }

    }
  };

  function updateHeartIconsOnPage() {
    document.querySelectorAll('.fa-heart').forEach(async icon => {
      const styleID = icon.getAttribute('data-styleID');
      try {
        const response = await fetch(`/api/check-wishlist?styleID=${styleID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.isInWishlist) {
          icon.classList.add("active");
          console.log("active")
          console.log(styleID)

        } else {
          icon.classList.remove("active");
          console.log("remove")
          console.log(styleID)

        }
      } catch (error) {
        console.error("Error checking wishlist status for icon:", error);
      }
    });
  };

  hearts.forEach(function (heart) {
    heart.addEventListener("click", function () {
      // Toggle kelas 'active'
      heart.classList.toggle("active");
    });
  });

  //API most popular
  fetchMostPopularSneakers();

  function fetchMostPopularSneakers() {
    if (isFilterPriceActive) {
      fetch("/api/most-popular")
        .then((response) => response.json())
        .then((sneakers) => {
          const container = document.getElementById("sneaker-mostpopular1");
          console.log("ini mostpopular if");
          isPopularActive = true;
          container.innerHTML = ""; // Clear existing content
          console.log("max =", priceMax);
          console.log("min =", priceMin);
          sneakers.forEach((sneaker) => {
            if (priceFilter(sneaker, priceMin, priceMax)) {
              const sneakerCard = createSneakerCard(sneaker);
              container.appendChild(sneakerCard);
            }
          });
        })
        .catch((error) =>
          console.error("Error fetching most popular sneakers:", error)
        );
    } else {
      fetch("/api/most-popular")
        .then((response) => response.json())
        .then((sneakers) => {
          const container = document.getElementById("sneaker-mostpopular1");
          console.log("ini mostpopular else");
          isPopularActive = true;
          container.innerHTML = ""; // Clear existing content
          sneakers.forEach((sneaker) => {
            if (isNewRelease(sneaker.releaseDate)) {
              const sneakerCard = createSneakerCard(sneaker);
              container.appendChild(sneakerCard);
            }
            // offset += sneaker.length
          });
        })
        .catch((error) =>
          console.error("Error fetching most popular sneakers:", error)
        );
    }
  };


  function priceFilter(sneaker, minPrice, maxPrice) {
    console.log("max =", maxPrice);
    console.log("min =", minPrice);
    const prices = sneaker.lowestResellPrice;
    return (prices.stockX >= minPrice && prices.stockX <= maxPrice) ||
      (prices.goat >= minPrice && prices.goat <= maxPrice) ||
      (prices.flightClub >= minPrice && prices.flightClub <= maxPrice);
  };

  function isNewRelease(releaseDate) {
    const release = new Date(releaseDate);
    const startDate = new Date("2020-01-01");
    const endDate = new Date("2024-12-31");
    return release >= startDate && release <= endDate;
  };

  //API Onlu Jordan
  fetchonlyjordanSneakers();

  function fetchonlyjordanSneakers() {
    fetch("/api/onlyjordan")
      .then((response) => response.json())
      .then((sneakers) => {
        const container = document.getElementById("sneaker-mostpopular2");
        container.innerHTML = ""; // Clear existing content
        sneakers.map((sneaker) => {
          container.appendChild(createSneakerCard(sneaker));
        });
      })
      .catch((error) =>
        console.error("Error fetching only jordan sneakers:", error)
      );
  };

  //Filter brand
  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedBrands = Array.from(
      filterForm.querySelectorAll('input[type="checkbox"]:checked')
    ).map((checkbox) => checkbox.value);
    currentQuery = encodeURIComponent(selectedBrands.join(" "));
    // offset = 0; // Reset offset saat filter baru diterapkan
    sneakerContainer.innerHTML = ""; // Clear previous results
    fetchFilteredData();
    // showMoreBtn.textContent = "Next"; // Ubah teks tombol saat filter diterapkan
  });

  //filter price
  filterPriceform.addEventListener("submit", async (event) => {
    event.preventDefault();
    priceMin = document.getElementById('hargaMin').value || 0;
    priceMax = document.getElementById('hargaMax').value || 10000;
    console.log("max =", priceMax);
    console.log("min =", priceMin);
    if (isPopularActive) {
      isFilterPriceActive = true;
      console.log("Filter harga popular jalan");
      sneakerContainer.innerHTML = "";
      fetchMostPopularSneakers();
    } else if (isFilterActive) {
      isFilterPriceActive = true;
      console.log("Filter harga brand jalan");
      sneakerContainer.innerHTML = "";
      fetchFilteredData();
    } else if (isSearchActive) {
      isFilterPriceActive = true;
      console.log("Filter harga search jalan");
      sneakerContainer.innerHTML = "";
      searchSneaker(true);
    }
  })

  function fetchFilteredData() {
    isSearchActive = false;
    isPopularActive = false;
    isFilterActive = true;

    if (isFilterPriceActive) {
      console.log(`Fetching data with query: ${currentQuery}, limit:${limit}, offset: ${offset}`);
      console.log("ini filter if");
      console.log("max =", priceMax);
      console.log("min =", priceMin);

      fetch(`/api/filter?q=${currentQuery}&limit=${limit}&offset=${offset}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })
        .then((response) => response.json())
        .then((products) => {
          if (products.length > 0) {
            products.forEach(product => {
              if (priceFilter(product, priceMin, priceMax)) {
                const sneakerCard = createSneakerCard(product);
                sneakerContainer.appendChild(sneakerCard);
              }
            });
            offset += products.length; // Perbarui offset hanya jika produk diterima

          } else {
            console.log("Tidak ada produk lebih untuk ditampilkan.");
            alert("Tidak ada produk lebih untuk ditampilkan.");
          }
        })
        .catch((error) => {
          console.error("Gagal mengambil data sneakers:", error);
          sneakerContainer.innerHTML = `<p class="error">Gagal memuat produk. Silakan coba lagi.</p>`;
        });

    } else {
      console.log(`Fetching data with query: ${currentQuery}, limit:${limit}, offset: ${offset}`);

      fetch(`/api/filter?q=${currentQuery}&limit=${limit}&offset=${offset}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })
        .then((response) => response.json())
        .then((products) => {
          if (products.length > 0) {
            products.forEach(product => {
              const sneakerCard = createSneakerCard(product);
              sneakerContainer.appendChild(sneakerCard);
            });
            offset += products.length; // Perbarui offset hanya jika produk diterima
            console.log("ini mostpopular else");

          } else {
            console.log("Tidak ada produk lebih untuk ditampilkan.");
            alert("Tidak ada produk lebih untuk ditampilkan.");
          }
        })
        .catch((error) => {
          console.error("Gagal mengambil data sneakers:", error);
          sneakerContainer.innerHTML = `<p class="error">Gagal memuat produk. Silakan coba lagi.</p>`;
        });
    }

  };


  window.setTimeout(() => {
    window.showMoreHandled = false;
  }, 500);

  showMoreBtn.addEventListener("click", () => {
    offset += limit;
    if (window.showMoreHandled) {
      event.stopImmediatePropagation();
      return; // Hentikan jika sudah ditangani
    }
    if (isSearchActive) {
      console.log("searc", isSearchActive)
      console.log("Bejalan Search");
      searchSneaker(false); // Do not clear previous results
    } else if (isFilterActive) {
      console.log("filter", isFilterActive)
      console.log("berjalan filter");
      fetchFilteredData();
    } else if (isPopularActive) {
      console.log("Popular", isPopularActive)
      console.log("berjalan popular");
      fetchMostPopularSneakers()
      // searchSneaker(false); // Do not clear previous results
    }
    window.showMoreHandled = true;  // Prevent multiple triggers
    setTimeout(() => { window.showMoreHandled = false; }, 500);
  });
});


