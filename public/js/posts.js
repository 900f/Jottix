document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    const token = localStorage.getItem('token');
  
    // Redirect to login if not authenticated
    if (createPostForm && !token) {
      alert('Please log in to create a post');
      window.location.href = '/login.html';
      return;
    }
  
    if (createPostForm) {
      const imageInput = document.getElementById('image');
      const imagePreview = document.getElementById('image-preview');
      const removeImageBtn = document.getElementById('remove-image');
  
      // Image preview
      imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
          console.log('Image selected:', file.name, 'Size:', file.size);
          const reader = new FileReader();
          reader.onload = () => {
            imagePreview.src = reader.result;
            imagePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          imagePreview.src = '';
          imagePreview.style.display = 'none';
        }
      });
  
      // Remove image
      removeImageBtn.addEventListener('click', () => {
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        console.log('Image removed');
      });
  
      // Form submission
      createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createPostForm);
  
        // Log FormData for debugging
        const formDataObj = Object.fromEntries(formData);
        console.log('Submitting post:', formDataObj);
  
        try {
          const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
  
          const data = await response.json();
          console.log('Server response:', data);
  
          if (response.ok) {
            alert('Post created successfully!');
            window.location.href = '/explore.html';
          } else {
            alert(data.message || 'Error creating post');
          }
        } catch (error) {
          console.error('Fetch error:', error.message, error.stack);
          alert('Error creating post: ' + error.message);
        }
      });
    }
  });