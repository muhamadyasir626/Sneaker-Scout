document.addEventListener("DOMContentLoaded", () => {
  const boxContainer = document.getElementById('sneaker-mostpopular1');

  boxContainer.addEventListener('click', async function (event) {
    const target = event.target;

    // Handle image click to show pop-up
    if (target.tagName === 'IMG' && target.parentNode.classList.contains('frameimg')) {
      const sneakerId = target.parentNode.getAttribute('data-sneaker-id');
      console.log("Sneaker ID: ", sneakerId); // Menampilkan ID sneaker ke konsol
      showPopUp(sneakerId);
    }

    // Handle heart icon click for removing from wishlist
    if (target.classList.contains('fa-heart')) {
      const sneakerId = target.closest('.frameimg').getAttribute('data-sneaker-id');
      console.log("Sneaker ID: ", sneakerId); // Menampilkan ID sneaker ke konsol

      Swal.fire({
        title: "Are you sure?",
        text: "Are you sure you want to remove this item from your wishlist?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it!",
        cancelButtonText: "No, keep it"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/remove-from-page-wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ styleID: sneakerId })
            });

            if (!response.ok) {
              console.error('Failed to remove sneaker, server responded with:', response.status);
              Swal.fire('Failed to remove sneaker from wishlist. Please try again.');
              return;
            }

            let data;
            try {
              data = await response.json();
            } catch (jsonError) {
              console.error('Error parsing JSON from response:', jsonError);
              Swal.fire('Received malformed data. Please contact support.');
              return;
            }

            Swal.fire('Removed!', 'Sneaker removed from wishlist.', 'success');
            target.closest('.frameimg').remove();

          } catch (error) {
            console.error('Error removing sneaker:', error);
            Swal.fire('An error occurred while removing the sneaker. Please check your network connection and try again.');
          }
        }
      });
    }
  });

  async function showPopUp(sneakerId) {
    const sneaker = await findSneakerById(sneakerId);
    if (!sneaker) {
      console.error('Sneaker not found');
      return;
    }
    const popUp = document.createElement('div');
    popUp.className = 'pop-up';
    popUp.innerHTML = `
    <div class="pop-up-content">
    <span class="close-button">&times;</span>
    <div class="previewimg">
      <img src="${sneaker.thumbnail}" alt="${sneaker.styleID}">
    </div>
    <div class="description1">
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
            <a href="${sneaker.resellLinks?.stockX}" target="_blank" class="btn__visible">
              <img src="/img/home-login/logo/stockx.png" alt="StockX Logo" class="lo">
            </a>
            <a href="${sneaker.resellLinks?.stockX}" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.stockX || ' -'}</a>
          </button>
          <button class="btn">
            <a href="${sneaker.resellLinks?.flightClub}" target="_blank" class="btn__visible">
              <img src="/img/home-login/logo/flight.png" alt="Flight Club Logo" class="lo">
            </a>
            <a href="${sneaker.resellLinks?.flightClub}" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.flightClub || ' -'}</a>
          </button>
          <button class="btn">
            <a href="${sneaker.resellLinks?.goat}" target="_blank" class="btn__visible">
              <img src="/img/home-login/logo/GOAT-Logo.png" alt="GOAT Logo" class="lo">
            </a>
            <a href="${sneaker.resellLinks?.goat}" target="_blank" class="btn__invisible">$${sneaker.lowestResellPrice?.goat || ' -'}</a>
          </button>
          <button class="hearts1">
            <a href="#" class="like">
              <i class="fas fa-heart"></i> <!-- Ikon hati Font Awesome -->
            </a>
          </button>
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
  window.location.reload()
  setTimeout(() => {
    checkWishlist();
  }, 0);
});

const heartIcon = popUp.querySelector(".fa-heart");
heartIcon.addEventListener("click", async (event) => {
  event.preventDefault(); // Prevent default link behavior
  event.stopPropagation(); // Prevent triggering click events on parent elements

  const isActive = heartIcon.classList.contains("active");
  const action = isActive ? "remove" : "add";

  Swal.fire({
    title: `Are you sure you want to ${action} this item to your wishlist?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Yes, ${action} it!`,
    cancelButtonText: "No, cancel"
  }).then(async (result) => {
    if (result.isConfirmed) {
      heartIcon.classList.toggle("active"); // Toggle active class to change icon color

      const url = heartIcon.classList.contains("active") ? "/add-to-wishlist" : "/remove-from-wishlist";
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
        Swal.fire(
          `${action === "add" ? "Added!" : "Removed!"}`,
          `Sneaker ${action === "add" ? "added to" : "removed from"} wishlist.`,
          "success"
        );
      } catch (error) {
        console.error(`Error ${isActive ? 'adding to' : 'removing from'} wishlist:`, error);
        Swal.fire(
          "Error",
          `An error occurred: ${error.message}`,
          "error"
        );
      }
    }
  });
});

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
}

function findSneakerById(id) {
if (!id) {
  console.error('Invalid sneaker ID:', id);
  return Promise.resolve(null); // Mengembalikan promise yang resolve ke null
}
return fetch(`/api/sneakers/detail/${id}`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    return data;
  })
  .catch(error => {
    console.error('Error fetching sneaker details:', error);
    return null;
  });
}
});
    

  

  
  
  function findSneakerById(id) {
    if (!id) {
      console.error('Invalid sneaker ID:', id);
      return Promise.resolve(null); // Mengembalikan promise yang resolve ke null
    }
    return fetch(`/api/sneakers/detail/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        return data;
      })
      .catch(error => {
        console.error('Error fetching sneaker details:', error);
        return null;
      });
  }
  

document.addEventListener("DOMContentLoaded", function () {
  var head = document.getElementsByTagName('head')[0];

  // Membuat elemen link untuk stylesheet
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/.css';

  // Menambahkan link ke head
  // head.appendChild(link);
});
