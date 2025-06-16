async function handleImageUpload(inputEl, hiddenInputId) {
  const file = inputEl.files[0];
  if (!file) return;

  // Choose a random Cloudinary account
  const cloudNames = ["de7bwqvq5", "drooohxav", "ddbphbdqs"];
  const selectedCloud = cloudNames[Math.floor(Math.random() * cloudNames.length)];

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "myupload");

  // Status element
  const statusId = `imageStatus${hiddenInputId.slice(-1)}`;
  const statusText = document.getElementById(statusId);
  if (statusText) {
    statusText.textContent = "⏳ Uploading...";
    statusText.classList.remove("hidden", "text-emerald-600", "text-red-600");
    statusText.classList.add("text-yellow-500");
  }

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedCloud}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    const imageUrl = data.secure_url;

    // Set value to hidden input
    document.getElementById(hiddenInputId).value = imageUrl;

    // ✅ Show success
    if (statusText) {
      statusText.textContent = "✅ Image uploaded successfully!";
      statusText.classList.remove("text-yellow-500");
      statusText.classList.add("text-emerald-600");
    }

    showSuccess(`Image ${hiddenInputId.slice(-1)} uploaded!`);

  } catch (err) {
    // ❌ Error state
    if (statusText) {
      statusText.textContent = "❌ Upload failed. Try again.";
      statusText.classList.remove("text-yellow-500");
      statusText.classList.add("text-red-600");
    }
    alert("Upload failed: " + err.message);
  }
}