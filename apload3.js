async function handleImageUpload(inputEl, hiddenInputId) {
  const file = inputEl.files[0];
  if (!file) return;

  const statusEl = document.getElementById(`imageStatus-${hiddenInputId}`);
  const fileName = file.name;

  // Clear status and reset
  statusEl.innerHTML = `📷 Selected: ${fileName}`;
  statusEl.classList.remove("hidden");
  statusEl.style.color = "#2563eb"; // blue

  // Uploading...
  await new Promise(resolve => setTimeout(resolve, 300));
  statusEl.innerHTML = `⏳ Uploading ${fileName}...`;
  statusEl.style.color = "#d97706"; // amber

  // Random Cloudinary
  const cloudNames = ["de7bwqvq5", "drooohxav", "ddbphbdqs"];
  const selectedCloud = cloudNames[Math.floor(Math.random() * cloudNames.length)];

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "myupload");

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedCloud}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    const imageUrl = data.secure_url;

    // Set hidden field
    document.getElementById(hiddenInputId).value = imageUrl;

    // Show status & image preview
    statusEl.innerHTML = `✅ ${fileName} uploaded successfully!<br>
      <img src="${imageUrl}" style="margin-top: 6px; max-width: 100px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">`;
    statusEl.style.color = "#059669"; // green

    showSuccess(`Image uploaded: ${fileName}`);
  } catch (err) {
    statusEl.innerHTML = `❌ Upload failed for ${fileName}`;
    statusEl.style.color = "#dc2626"; // red
    alert("Upload failed: " + err.message);
  }
}