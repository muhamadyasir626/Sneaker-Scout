function removeFromWishlist(sneakerId) {
    // Contoh menggunakan fetch untuk menghapus item melalui API
    fetch('/api/remove-from-wishlist/' + sneakerId, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      console.log('Item removed:', data);
      location.reload(); // Reload the page to update the list
    })
    .catch(error => console.error('Error removing item:', error));
  }

  
  
  